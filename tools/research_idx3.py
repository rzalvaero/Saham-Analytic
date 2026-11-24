"""
research_idx3.py - Uji dua pendekatan yang SECARA STRUKTUR berbeda.

Semua uji sebelumnya (234 konfigurasi) memakai sinyal time-series per saham
dengan holding pendek. Semuanya gagal. Dua penyebab struktural:
  1. Fee 0.40% round-trip membunuh frekuensi tinggi.
  2. Sinyal teknikal pendek di IDX = noise.

Yang diuji di sini, dua-duanya menghindari masalah itu:

  MODE M - Momentum lintas-saham (cross-sectional):
    Setiap bulan, ranking semua emiten berdasarkan return N-hari.
    Beli TOP-K terkuat, tahan 1 bulan, ulang. Holding panjang = fee kecil.
    Ini metode klasik yang terdokumentasi menang di banyak pasar.

  MODE T - Trend panjang (turtle-style):
    Breakout 55 hari, trail stop lebar 4-5 ATR, tanpa TP.
    Tahan berbulan-bulan. Fee teramortisasi.

Murni riset. Tidak menyentuh ReyCOIN / ReyFX.

Jalankan:
  python tools/research_idx3.py
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backtest_idx import FEE_BUY, FEE_SELL, TAX_SELL  # noqa: E402
from research_idx import precompute, TRAIN_RATIO, MIN_ATR_PCT  # noqa: E402
from research_idx2 import fetch_ihsg, regime_on  # noqa: E402
from sweep_idx import get_all_data  # noqa: E402

OUT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "research_idx3.json"
)

FEE_RT = FEE_BUY + FEE_SELL + TAX_SELL


# ------------------------------------------------------------- util metrik

def metrics(curve, trades):
    final = curve[-1] if curve else 1.0
    peak = -1e18
    mdd = 0.0
    for e in curve:
        peak = max(peak, e)
        if peak > 0:
            mdd = min(mdd, (e - peak) / peak)

    if not trades:
        return {"trades": 0, "wr": 0.0, "pf": 0.0, "net": (final - 1) * 100.0,
                "dd": abs(mdd) * 100.0, "exp": 0.0}

    w = [t for t in trades if t > 0]
    l = [t for t in trades if t <= 0]
    gw = sum(w)
    gl = abs(sum(l))
    return {
        "trades": len(trades),
        "wr": len(w) / len(trades) * 100.0,
        "pf": (gw / gl) if gl > 0 else 0.0,
        "net": (final - 1.0) * 100.0,
        "dd": abs(mdd) * 100.0,
        "exp": sum(trades) / len(trades),
    }


# ------------------------------------------------- MODE M: momentum ranking

def run_momentum(pre, start_ts, end_ts, top_k, lookback, use_regime, regime_map,
                 rebalance_days=21):
    symbols = list(pre.keys())
    all_ts = sorted({t for s in symbols for t in pre[s]["ts"] if start_ts <= t <= end_ts})
    if len(all_ts) < lookback + rebalance_days:
        return {"trades": 0, "wr": 0.0, "pf": 0.0, "net": 0.0, "dd": 0.0, "exp": 0.0}, []

    # posisi: dict sym -> {entry_px, cost, shares}
    cash = 1.0
    holdings: dict[str, dict] = {}
    trades: list[float] = []
    curve: list[float] = []
    last_close: dict[str, float] = {}

    def price_at(s, ts):
        p = pre[s]
        i = p["idx_by_ts"].get(ts)
        if i is None:
            # cari hari bursa terdekat ke belakang
            for b in range(1, 6):
                j = p["idx_by_ts"].get(ts - b * 86400)
                if j is not None:
                    return p["c"][j], j
            return None, None
        return p["c"][i], i

    for n, ts in enumerate(all_ts):
        for s in symbols:
            px, _ = price_at(s, ts)
            if px is not None:
                last_close[s] = px

        if n % rebalance_days != 0:
            curve.append(cash + sum(h["shares"] * last_close.get(s, h["entry"])
                                    for s, h in holdings.items()))
            continue

        # ---------- hitung ranking ----------
        ranked = []
        for s in symbols:
            p = pre[s]
            px, i = price_at(s, ts)
            if px is None or i is None or i < lookback:
                continue
            past = p["c"][i - lookback]
            if past <= 0 or px < 100.0:
                continue
            atr = p["atr"][i]
            if atr is None or (atr / px) * 100.0 < MIN_ATR_PCT:
                continue
            ranked.append(((px / past) - 1.0, s, px))

        ranked.sort(reverse=True)

        want = set()
        if ranked:
            gate = True
            if use_regime:
                gate = regime_on(regime_map, ts)
            if gate:
                want = {s for _, s, _ in ranked[:top_k]}

        # ---------- jual yang tidak diinginkan ----------
        for s in list(holdings.keys()):
            if s in want:
                continue
            h = holdings.pop(s)
            px = last_close.get(s, h["entry"])
            proceeds = h["shares"] * px * (1.0 - FEE_SELL - TAX_SELL)
            cash += proceeds
            trades.append((proceeds / h["cost"] - 1.0) * 100.0)

        # ---------- beli yang baru diinginkan ----------
        buys = [x for x in ranked if x[1] in want and x[1] not in holdings]
        if buys:
            eq = cash + sum(h["shares"] * last_close.get(s, h["entry"])
                            for s, h in holdings.items())
            slot = eq / top_k
            for _, s, px in buys:
                notional = min(slot, cash / (1.0 + FEE_BUY))
                if notional < 1e-9:
                    continue
                cost = notional * (1.0 + FEE_BUY)
                if cash < cost:
                    continue
                cash -= cost
                holdings[s] = {"entry": px, "cost": cost, "shares": notional / px}

        curve.append(cash + sum(h["shares"] * last_close.get(s, h["entry"])
                                for s, h in holdings.items()))

    for s, h in holdings.items():
        px = last_close.get(s, h["entry"])
        proceeds = h["shares"] * px * (1.0 - FEE_SELL - TAX_SELL)
        cash += proceeds
        trades.append((proceeds / h["cost"] - 1.0) * 100.0)
    if curve:
        curve[-1] = cash

    return metrics(curve, trades), trades


# ----------------------------------------------- MODE T: trend panjang

def run_trend(pre, start_ts, end_ts, lookback, sl_mult, trail_mult, use_regime,
              regime_map, max_pos=5):
    symbols = list(pre.keys())
    all_ts = sorted({t for s in symbols for t in pre[s]["ts"] if start_ts <= t <= end_ts})

    cash = 1.0
    positions = []
    trades = []
    curve = []
    last_close = {}

    for ts in all_ts:
        for s in symbols:
            p = pre[s]
            i = p["idx_by_ts"].get(ts)
            if i is not None:
                last_close[s] = p["c"][i]

        # exit
        still = []
        for pos in positions:
            s = pos["sym"]
            p = pre[s]
            i = p["idx_by_ts"].get(ts)
            if i is None:
                still.append(pos)
                continue
            h_, l_, c_ = p["h"][i], p["l"][i], p["c"][i]
            atr = p["atr"][i]

            pos["peak"] = max(pos["peak"], h_)
            if atr is not None:
                pos["sl"] = max(pos["sl"], pos["peak"] - trail_mult * atr)

            if l_ <= pos["sl"]:
                proceeds = pos["shares"] * pos["sl"] * (1.0 - FEE_SELL - TAX_SELL)
                cash += proceeds
                trades.append((proceeds / pos["cost"] - 1.0) * 100.0)
                continue
            still.append(pos)
        positions = still

        # entry
        if len(positions) < max_pos:
            gate = True
            if use_regime:
                gate = regime_on(regime_map, ts)
            if gate:
                for s in symbols:
                    if len(positions) >= max_pos:
                        break
                    if any(x["sym"] == s for x in positions):
                        continue
                    p = pre[s]
                    i = p["idx_by_ts"].get(ts)
                    if i is None or i < lookback:
                        continue
                    px = p["c"][i]
                    atr = p["atr"][i]
                    if atr is None or px < 100.0:
                        continue
                    if (atr / px) * 100.0 < MIN_ATR_PCT:
                        continue
                    e200 = p["ema200"][i]
                    if e200 is None or px <= e200:
                        continue
                    hi = max(p["h"][i - lookback:i])
                    if px <= hi:
                        continue

                    eq = cash + sum(x["shares"] * last_close.get(x["sym"], x["entry"])
                                    for x in positions)
                    notional = eq / max_pos
                    cost = notional * (1.0 + FEE_BUY)
                    if cash < cost or notional < 1e-9:
                        continue
                    cash -= cost
                    positions.append({
                        "sym": s, "entry": px, "cost": cost,
                        "shares": notional / px, "peak": p["h"][i],
                        "sl": px - sl_mult * atr,
                    })

        curve.append(cash + sum(x["shares"] * last_close.get(x["sym"], x["entry"])
                                for x in positions))

    for pos in positions:
        px = last_close.get(pos["sym"], pos["entry"])
        proceeds = pos["shares"] * px * (1.0 - FEE_SELL - TAX_SELL)
        cash += proceeds
        trades.append((proceeds / pos["cost"] - 1.0) * 100.0)
    if curve:
        curve[-1] = cash

    return metrics(curve, trades), trades


# ------------------------------------------------------------------- main

def main() -> int:
    print(f"Riset 3: momentum lintas-saham + trend panjang | fee {FEE_RT*100:.2f}%\n")

    raw = get_all_data()
    pre = {s: precompute(d) for s, d in raw.items()}
    regime_map = fetch_ihsg()

    all_ts = sorted({t for s in pre for t in pre[s]["ts"]})
    split = all_ts[int(len(all_ts) * TRAIN_RATIO)]
    t0, t1, t2 = all_ts[0], split, all_ts[-1]

    f = lambda t: datetime.fromtimestamp(t, tz=timezone.utc).strftime("%Y-%m-%d")
    print(f"TRAIN {f(t0)}..{f(t1)}  |  TEST {f(t1)}..{f(t2)}\n")

    results = []

    # ---- MODE M ----
    for top_k in (3, 5):
        for lb in (63, 126, 252):
            for reg in (False, True):
                name = f"M top{top_k} LB{lb}d {'REG' if reg else 'ALL'}"
                tr, _ = run_momentum(pre, t0, t1, top_k, lb, reg, regime_map)
                te, _ = run_momentum(pre, t1, t2, top_k, lb, reg, regime_map)
                ok = (tr["trades"] >= 20 and tr["pf"] >= 1.15 and tr["net"] > 0
                      and te["trades"] >= 10 and te["pf"] >= 1.15 and te["net"] > 0)
                results.append({"mode": "M", "name": name, "train": tr, "test": te, "pass": ok})

    # ---- MODE T ----
    for lb in (55, 100):
        for sl in (3.0, 4.0):
            for tr_m in (4.0, 5.0):
                for reg in (False, True):
                    name = f"T brk{lb} SL{sl} TR{tr_m} {'REG' if reg else 'ALL'}"
                    tr, _ = run_trend(pre, t0, t1, lb, sl, tr_m, reg, regime_map)
                    te, _ = run_trend(pre, t1, t2, lb, sl, tr_m, reg, regime_map)
                    ok = (tr["trades"] >= 10 and tr["pf"] >= 1.15 and tr["net"] > 0
                          and te["trades"] >= 5 and te["pf"] >= 1.15 and te["net"] > 0)
                    results.append({"mode": "T", "name": name, "train": tr, "test": te, "pass": ok})

    results.sort(key=lambda r: (r["pass"], r["test"]["pf"], r["test"]["net"]), reverse=True)

    hdr = f"{'konfigurasi':<30}{'TRtr':>5}{'PF':>6}{'net':>9}{'DD':>7} |{'TEtr':>5}{'PF':>6}{'net':>9}{'DD':>7}  ok"
    print(hdr)
    print("-" * len(hdr))
    for r in results:
        a, b = r["train"], r["test"]
        print(
            f"{r['name'][:30]:<30}{a['trades']:>5}{a['pf']:>6.2f}{a['net']:>8.1f}%{a['dd']:>7.1f}"
            f" |{b['trades']:>5}{b['pf']:>6.2f}{b['net']:>8.1f}%{b['dd']:>7.1f}"
            f"  {'LOLOS' if r['pass'] else '-'}"
        )

    winners = [r for r in results if r["pass"]]
    print("\n" + "=" * 80)
    if winners:
        best = winners[0]
        print(f"KANDIDAT LAYAK: {best['name']}")
        print(f"  TRAIN {best['train']['trades']}tr PF{best['train']['pf']:.2f} "
              f"net{best['train']['net']:.1f}% DD{best['train']['dd']:.1f}%")
        print(f"  TEST  {best['test']['trades']}tr PF{best['test']['pf']:.2f} "
              f"net{best['test']['net']:.1f}% DD{best['test']['dd']:.1f}%")
        verdict = "LAYAK"
    else:
        verdict = "TIDAK LAYAK"
        print("TIDAK ADA YANG LOLOS")
        b = results[0]
        print(f"Terdekat: {b['name']} -> TR PF{b['train']['pf']:.2f} "
              f"net{b['train']['net']:.1f}% | TE PF{b['test']['pf']:.2f} "
              f"net{b['test']['net']:.1f}%")
    print("=" * 80)

    payload = {
        "generatedAt": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "method": {
            "feeRoundTripPct": round(FEE_RT * 100, 2),
            "configsTested": len(results),
            "modes": {
                "M": "momentum lintas-saham, rebalance bulanan, tahan TOP-K",
                "T": "breakout trend panjang, trail stop lebar, tanpa TP",
            },
            "trainPeriod": f"{f(t0)}..{f(t1)}",
            "testPeriod": f"{f(t1)}..{f(t2)}",
        },
        "verdict": verdict,
        "winners": [{"name": w["name"], "train": w["train"], "test": w["test"]}
                    for w in winners[:5]],
        "leaderboard": [{"mode": r["mode"], "name": r["name"], "train": r["train"],
                         "test": r["test"], "passBoth": r["pass"]} for r in results],
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    print(f"\nTersimpan: {os.path.normpath(OUT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
