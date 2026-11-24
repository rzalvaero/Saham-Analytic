"""
research_idx.py - Riset strategi IDX level portofolio (bukan per-emiten).

Kenapa script ini ada:
  Sweep pertama (sweep_idx.py) menguji 6 varian mean-reversion dan semuanya
  gagal karena sampel tipis (14 trade / 5 tahun). Script ini memperbaiki
  metodenya:
    1. Simulasi PORTOFOLIO harian (kas + posisi terbuka, mark-to-market),
       bukan rata-rata per emiten yang menyesatkan.
    2. Grid lebih luas: breakout Donchian, MA cross, RSI dip, pullback.
    3. Exit fixed-R DAN trailing ATR (chandelier).
    4. Filter wajib: ATR% minimal (biar fee 0.40% tertutup), harga minimal.
    5. Walk-forward: latih 70% data awal, uji 30% data terakhir.
       Hanya konfigurasi yang lolos DI KEDUA periode yang dianggap layak.

Ini murni riset data publik. Tidak menyentuh ReyCOIN / ReyFX.

Jalankan:
  python tools/research_idx.py
"""

from __future__ import annotations

import itertools
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backtest_idx import FEE_BUY, FEE_SELL, TAX_SELL, ema, wilder_rsi, atr_series
from sweep_idx import get_all_data

OUT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "research_idx.json"
)

MIN_PRICE = 100.0          # hindari saham gocap yang spread-nya ganas
MIN_ATR_PCT = 1.0          # syarat agar gerakan menutup fee 0.40%
MAX_CONCURRENT = 5         # slot posisi bersamaan
SLOT_FRACTION = 1.0 / MAX_CONCURRENT
TRAIN_RATIO = 0.70


# --------------------------------------------------------------- indikator

def rolling_max(vals, n):
    out = [None] * len(vals)
    for i in range(len(vals)):
        if i < n:
            continue
        out[i] = max(vals[i - n:i])
    return out


def precompute(d: dict) -> dict:
    rows = d["rows"]
    c = [r["c"] for r in rows]
    h = [r["h"] for r in rows]
    l = [r["l"] for r in rows]
    o = [r["o"] for r in rows]
    v = [r["v"] for r in rows]
    ts = [r["t"] for r in rows]

    return {
        "ts": ts, "c": c, "h": h, "l": l, "o": o, "v": v,
        "rsi14": wilder_rsi(c, 14),
        "rsi3": wilder_rsi(c, 3),
        "ema20": ema(c, 20),
        "ema50": ema(c, 50),
        "ema200": ema(c, 200),
        "atr": atr_series(h, l, c, 14),
        "hi20": rolling_max(h, 20),
        "hi55": rolling_max(h, 55),
        "idx_by_ts": {t: i for i, t in enumerate(ts)},
    }


# ------------------------------------------------------------ sinyal masuk

def entry_signal(p: dict, i: int, spec: dict) -> bool:
    close = p["c"][i]
    e200 = p["ema200"][i]
    atr = p["atr"][i]
    if e200 is None or atr is None:
        return False
    if close < MIN_PRICE:
        return False
    # Filter biaya: gerakan harian harus cukup besar
    if (atr / close) * 100.0 < spec["minAtrPct"]:
        return False

    kind = spec["entry"]

    if kind == "breakout":
        ref = p["hi20"][i] if spec["lookback"] == 20 else p["hi55"][i]
        if ref is None:
            return False
        return close > ref and close > e200

    if kind == "ma_cross":
        e20, e50 = p["ema20"][i], p["ema50"][i]
        e20p, e50p = p["ema20"][i - 1], p["ema50"][i - 1]
        if None in (e20, e50, e20p, e50p):
            return False
        return e20p <= e50p and e20 > e50 and close > e200

    if kind == "rsi_dip":
        r3 = p["rsi3"][i]
        if r3 is None:
            return False
        return r3 <= spec["rsiThr"] and close > e200

    if kind == "pullback":
        r14 = p["rsi14"][i]
        e20 = p["ema20"][i]
        if r14 is None or e20 is None:
            return False
        return close > e200 and r14 <= spec["rsiThr"] and close > e20

    return False


# --------------------------------------------------------- simulasi portfolio

def simulate(pre: dict, spec: dict, start_ts: int, end_ts: int) -> dict:
    symbols = list(pre.keys())
    # timeline gabungan
    all_ts = sorted({t for s in symbols for t in pre[s]["ts"] if start_ts <= t <= end_ts})

    cash = 1.0
    positions: list[dict] = []
    trades: list[dict] = []
    equity_curve: list[float] = []
    last_close: dict[str, float] = {}

    initial_equity = 1.0

    for ts in all_ts:
        # ---------- update harga terakhir ----------
        for s in symbols:
            p = pre[s]
            i = p["idx_by_ts"].get(ts)
            if i is not None:
                last_close[s] = p["c"][i]

        # ---------- kelola posisi ----------
        still_open = []
        for pos in positions:
            s = pos["sym"]
            p = pre[s]
            i = p["idx_by_ts"].get(ts)
            if i is None:
                still_open.append(pos)
                continue

            row_h = p["h"][i]
            row_l = p["l"][i]
            row_c = p["c"][i]
            atr = p["atr"][i]
            bars = i - pos["i"]

            exit_px = None
            reason = None

            # trailing stop diperbarui pakai high tertinggi sejak entry
            if spec["exit"] == "trail":
                pos["peak"] = max(pos["peak"], row_h)
                if atr is not None:
                    trail = pos["peak"] - spec["trailMult"] * atr
                    pos["sl"] = max(pos["sl"], trail)

            if row_l <= pos["sl"]:
                exit_px, reason = pos["sl"], "SL"
            elif spec["exit"] == "fixed" and row_h >= pos["tp"]:
                exit_px, reason = pos["tp"], "TP"
            elif bars >= spec["timeStop"]:
                exit_px, reason = row_c, "TIME"

            if exit_px is None:
                still_open.append(pos)
                continue

            proceeds = pos["shares"] * exit_px * (1.0 - FEE_SELL - TAX_SELL)
            cash += proceeds
            net_pct = (proceeds / pos["cost"] - 1.0) * 100.0
            trades.append({
                "sym": s, "net": net_pct, "reason": reason, "bars": bars,
                "entryTs": p["ts"][pos["i"]], "exitTs": ts,
            })

        positions = still_open

        # ---------- entri baru ----------
        if len(positions) < MAX_CONCURRENT:
            for s in symbols:
                if len(positions) >= MAX_CONCURRENT:
                    break
                if any(x["sym"] == s for x in positions):
                    continue
                p = pre[s]
                i = p["idx_by_ts"].get(ts)
                if i is None:
                    continue
                if not entry_signal(p, i, spec):
                    continue

                entry = p["c"][i]
                atr = p["atr"][i]
                if atr is None or atr <= 0:
                    continue

                equity_now = cash + sum(
                    x["shares"] * last_close.get(x["sym"], x["entry"])
                    for x in positions
                )
                notional = equity_now * SLOT_FRACTION
                if notional < 1e-9:
                    continue
                cost = notional * (1.0 + FEE_BUY)
                if cash < cost:
                    continue

                cash -= cost
                positions.append({
                    "sym": s,
                    "entry": entry,
                    "i": i,
                    "shares": notional / entry,
                    "cost": cost,
                    "peak": p["h"][i],
                    "sl": entry - spec["slMult"] * atr,
                    "tp": entry + spec.get("tpMult", 4.0) * atr,
                })

        # ---------- mark to market ----------
        mtm = cash + sum(
            x["shares"] * last_close.get(x["sym"], x["entry"]) for x in positions
        )
        equity_curve.append(mtm)

    # tutup posisi yang tersisa di akhir periode
    for pos in positions:
        px = last_close.get(pos["sym"], pos["entry"])
        proceeds = pos["shares"] * px * (1.0 - FEE_SELL - TAX_SELL)
        cash += proceeds
        trades.append({
            "sym": pos["sym"], "net": (proceeds / pos["cost"] - 1.0) * 100.0,
            "reason": "OPEN", "bars": 0, "entryTs": 0, "exitTs": end_ts,
        })

    final_equity = equity_curve[-1] if equity_curve else initial_equity

    # drawdown dari kurva harian
    peak = -1e18
    max_dd = 0.0
    for e in equity_curve:
        peak = max(peak, e)
        if peak > 0:
            max_dd = min(max_dd, (e - peak) / peak)

    if not trades:
        return {"trades": 0, "wr": 0.0, "pf": 0.0, "net": 0.0, "dd": 0.0,
                "expectancy": 0.0, "years": 0.0}

    wins = [t for t in trades if t["net"] > 0]
    losses = [t for t in trades if t["net"] <= 0]
    gw = sum(t["net"] for t in wins)
    gl = abs(sum(t["net"] for t in losses))

    years = max(
        1e-9,
        (all_ts[-1] - all_ts[0]) / (365.25 * 86400) if all_ts else 1.0,
    )

    return {
        "trades": len(trades),
        "wr": len(wins) / len(trades) * 100.0,
        "pf": (gw / gl) if gl > 0 else 0.0,
        "net": (final_equity - 1.0) * 100.0,
        "dd": abs(max_dd) * 100.0,
        "expectancy": sum(t["net"] for t in trades) / len(trades),
        "years": years,
        "cagr": ((final_equity ** (1.0 / years)) - 1.0) * 100.0
        if final_equity > 0 else -100.0,
    }


# ------------------------------------------------------------------- grid

def build_specs() -> list[dict]:
    specs = []

    for sl, exit_kind in itertools.product(
        [2.0, 2.5, 3.0], ["fixed", "trail"]
    ):
        for etype, lo, thr in [
            ("breakout", 20, 0), ("breakout", 55, 0),
            ("ma_cross", 0, 0),
            ("rsi_dip", 0, 15), ("rsi_dip", 0, 25),
            ("pullback", 0, 45),
        ]:
            base = {
                "entry": etype, "lookback": lo, "rsiThr": thr,
                "slMult": sl, "exit": exit_kind,
                "minAtrPct": MIN_ATR_PCT, "timeStop": 60,
            }
            if exit_kind == "fixed":
                for tp in [3.0, 4.0, 6.0]:
                    s = dict(base, tpMult=tp, trailMult=0.0)
                    s["name"] = (
                        f"{etype}{'' if not lo else f'{lo}'}"
                        f"{'' if not thr else f'<= {thr}'}"
                        f" | SL{sl} TP{tp}"
                    )
                    specs.append(s)
            else:
                for tm in [2.5, 3.5]:
                    s = dict(base, tpMult=0.0, trailMult=tm)
                    s["name"] = (
                        f"{etype}{'' if not lo else f'{lo}'}"
                        f"{'' if not thr else f'<= {thr}'}"
                        f" | SL{sl} TRAIL{tm}"
                    )
                    specs.append(s)

    return specs


# ------------------------------------------------------------------- main

def main() -> int:
    print("Riset strategi IDX | portofolio | walk-forward 70/30")
    print(f"Fee round-trip {(FEE_BUY + FEE_SELL + TAX_SELL) * 100:.2f}% | "
          f"slot {MAX_CONCURRENT} | filter ATR>={MIN_ATR_PCT}%\n")

    raw = get_all_data()
    if not raw:
        print("Tidak ada data.")
        return 1

    pre = {s: precompute(d) for s, d in raw.items()}
    print(f"Precompute {len(pre)} emiten selesai.\n")

    all_ts = sorted({t for s in pre for t in pre[s]["ts"]})
    split_ts = all_ts[int(len(all_ts) * TRAIN_RATIO)]

    t0, t1 = all_ts[0], split_ts
    t2 = all_ts[-1]

    d0 = datetime.fromtimestamp(t0, tz=timezone.utc).strftime("%Y-%m-%d")
    d1 = datetime.fromtimestamp(t1, tz=timezone.utc).strftime("%Y-%m-%d")
    d2 = datetime.fromtimestamp(t2, tz=timezone.utc).strftime("%Y-%m-%d")
    print(f"TRAIN {d0} .. {d1}   |   TEST {d1} .. {d2}\n")

    specs = build_specs()
    print(f"Menguji {len(specs)} konfigurasi...\n")

    results = []
    for spec in specs:
        tr = simulate(pre, spec, t0, t1)
        te = simulate(pre, spec, t1, t2)

        # lolos = cukup transaksi DAN profitabilitas positif di dua periode
        ok_train = tr["trades"] >= 20 and tr["pf"] >= 1.15 and tr["net"] > 0
        ok_test = te["trades"] >= 10 and te["pf"] >= 1.15 and te["net"] > 0

        results.append({
            "name": spec["name"],
            "spec": {k: v for k, v in spec.items() if k != "name"},
            "train": tr, "test": te,
            "passTrain": ok_train, "passTest": ok_test,
            "passBoth": ok_train and ok_test,
        })

    results.sort(key=lambda r: (r["passBoth"], r["test"]["pf"], r["test"]["net"]), reverse=True)

    print(f"{'Konfigurasi':<40} {'TRAIN':>26} {'TEST':>26}  OK")
    print("-" * 100)
    for r in results[:18]:
        a, b = r["train"], r["test"]
        print(
            f"{r['name'][:40]:<40} "
            f"tr{a['trades']:>3} PF{a['pf']:>5.2f} {a['net']:>7.1f}% "
            f"| tr{b['trades']:>3} PF{b['pf']:>5.2f} {b['net']:>7.1f}% "
            f"| {'LOLOS' if r['passBoth'] else 'tolak'}"
        )

    winners = [r for r in results if r["passBoth"]]

    print("\n" + "=" * 70)
    if winners:
        best = winners[0]
        print(f"KANDIDAT LAYAK: {best['name']}")
        print(f"  TRAIN: {best['train']['trades']} trade, PF {best['train']['pf']:.2f}, "
              f"net {best['train']['net']:.1f}%, DD {best['train']['dd']:.1f}%")
        print(f"  TEST : {best['test']['trades']} trade, PF {best['test']['pf']:.2f}, "
              f"net {best['test']['net']:.1f}%, DD {best['test']['dd']:.1f}%")
        verdict = "LAYAK"
    else:
        print("TIDAK ADA KONFIGURASI YANG LOLOS TRAIN + TEST")
        bb = results[0]
        print(f"Terbaik mentah: {bb['name']} "
              f"(test PF {bb['test']['pf']:.2f}, net {bb['test']['net']:.1f}%)")
        verdict = "TIDAK LAYAK"
    print("=" * 70)

    payload = {
        "generatedAt": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "method": {
            "type": "portfolio",
            "feeRoundTripPct": round((FEE_BUY + FEE_SELL + TAX_SELL) * 100, 2),
            "maxConcurrent": MAX_CONCURRENT,
            "minAtrPct": MIN_ATR_PCT,
            "trainPeriod": f"{d0} .. {d1}",
            "testPeriod": f"{d1} .. {d2}",
            "configsTested": len(specs),
        },
        "verdict": verdict,
        "winners": [
            {
                "name": w["name"], "spec": w["spec"],
                "train": w["train"], "test": w["test"],
            }
            for w in winners[:5]
        ],
        "leaderboard": [
            {
                "name": r["name"], "spec": r["spec"],
                "train": r["train"], "test": r["test"],
                "passBoth": r["passBoth"],
            }
            for r in results[:25]
        ],
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)

    print(f"\nTersimpan: {os.path.normpath(OUT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
