"""
research_idx2.py - Uji hipotesis filter rezim pasar.

Temuan dari research_idx.py:
  90 konfigurasi, 0 lolos walk-forward. SEMUA rugi di periode test.
  Periode test = Jun 2025 .. Nov 2026 = pasar beruang (IHSG -39.9% YTD).

Hipotesis yang diuji di sini:
  Strategi long-only gagal BUKAN karena sinyalnya buruk, tapi karena
  dipaksa beli di pasar yang sedang turun. Kalau entry hanya diizinkan
  saat IHSG di atas MA200-nya sendiri (rezim naik), apakah hasilnya berubah?

Yang diuji:
  A. Regime filter OFF  (pembanding / baseline)
  B. Regime filter ON   (IHSG close > IHSG MA200)
  C. Regime ON + hanya 3 emiten terkuat (relative strength 60 hari)

Murni riset data publik. Tidak menyentuh ReyCOIN / ReyFX.

Jalankan:
  python tools/research_idx2.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backtest_idx import FEE_BUY, FEE_SELL, TAX_SELL  # noqa: E402
from research_idx import (  # noqa: E402
    MAX_CONCURRENT, SLOT_FRACTION, TRAIN_RATIO, MIN_ATR_PCT,
    precompute, entry_signal,
)
from sweep_idx import get_all_data  # noqa: E402

OUT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "research_idx2.json"
)

IHSG_URL = (
    "https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE"
    "?range=5y&interval=1d"
)

RS_LOOKBACK = 60
TOP_N_RS = 3


# ------------------------------------------------------------------- IHSG

def fetch_ihsg() -> dict[int, bool]:
    """Ambil IHSG, kembalikan map timestamp -> rezim naik (close > MA200)."""
    req = urllib.request.Request(IHSG_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.load(resp)

    node = payload["chart"]["result"][0]
    stamps = node["timestamp"]
    closes = node["indicators"]["quote"][0]["close"]

    rows = [(t, c) for t, c in zip(stamps, closes) if c is not None]
    if not rows:
        return {}

    vals = [c for _, c in rows]

    # SMA200 sederhana
    ma200 = [None] * len(vals)
    for i in range(199, len(vals)):
        ma200[i] = sum(vals[i - 199:i + 1]) / 200.0

    regime: dict[int, bool] = {}
    for i, (t, c) in enumerate(rows):
        m = ma200[i]
        regime[t] = bool(m is not None and c > m)

    print(f"IHSG: {len(rows)} bar, {sum(regime.values())} hari rezim naik "
          f"({sum(regime.values()) / len(regime) * 100:.1f}%)")
    return regime


def regime_on(regime: dict[int, bool], ts: int) -> bool:
    """Cari rezim pada timestamp <= ts (toleransi hari bursa berbeda)."""
    if ts in regime:
        return regime[ts]
    for back in range(1, 5):
        if (ts - back * 86400) in regime:
            return regime[ts - back * 86400]
    return False


# ------------------------------------------------------ simulasi (varian 2)

def simulate(pre, spec, start_ts, end_ts, regime_map, use_regime, use_rs):
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

        # ---------- exit ----------
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
            bars = i - pos["i"]

            exit_px = reason = None
            if spec["exit"] == "trail":
                pos["peak"] = max(pos["peak"], h_)
                if atr is not None:
                    pos["sl"] = max(pos["sl"], pos["peak"] - spec["trailMult"] * atr)

            if l_ <= pos["sl"]:
                exit_px, reason = pos["sl"], "SL"
            elif spec["exit"] == "fixed" and h_ >= pos["tp"]:
                exit_px, reason = pos["tp"], "TP"
            elif bars >= spec["timeStop"]:
                exit_px, reason = c_, "TIME"

            if exit_px is None:
                still.append(pos)
                continue

            proceeds = pos["shares"] * exit_px * (1.0 - FEE_SELL - TAX_SELL)
            cash += proceeds
            trades.append({"sym": s, "net": (proceeds / pos["cost"] - 1.0) * 100.0,
                           "reason": reason, "bars": bars})

        positions = still

        # ---------- entry ----------
        if len(positions) >= MAX_CONCURRENT:
            pass
        elif use_regime and not regime_on(regime_map, ts):
            pass
        else:
            # kandidat entry pada hari ini
            cands = []
            for s in symbols:
                if any(x["sym"] == s for x in positions):
                    continue
                p = pre[s]
                i = p["idx_by_ts"].get(ts)
                if i is None:
                    continue
                if not entry_signal(p, i, spec):
                    continue
                cands.append((s, i))

            if use_rs and len(cands) > TOP_N_RS:
                scored = []
                for s, i in cands:
                    p = pre[s]
                    if i >= RS_LOOKBACK:
                        rs = (p["c"][i] / p["c"][i - RS_LOOKBACK]) - 1.0
                    else:
                        rs = 0.0
                    scored.append((rs, s, i))
                scored.sort(reverse=True)
                cands = [(s, i) for _, s, i in scored[:TOP_N_RS]]

            for s, i in cands:
                if len(positions) >= MAX_CONCURRENT:
                    break
                p = pre[s]
                entry, atr = p["c"][i], p["atr"][i]
                if atr is None or atr <= 0:
                    continue

                eq = cash + sum(
                    x["shares"] * last_close.get(x["sym"], x["entry"]) for x in positions
                )
                notional = eq * SLOT_FRACTION
                cost = notional * (1.0 + FEE_BUY)
                if cash < cost or notional < 1e-9:
                    continue

                cash -= cost
                positions.append({
                    "sym": s, "entry": entry, "i": i,
                    "shares": notional / entry, "cost": cost,
                    "peak": p["h"][i],
                    "sl": entry - spec["slMult"] * atr,
                    "tp": entry + spec.get("tpMult", 4.0) * atr,
                })

        curve.append(
            cash + sum(x["shares"] * last_close.get(x["sym"], x["entry"]) for x in positions)
        )

    for pos in positions:
        px = last_close.get(pos["sym"], pos["entry"])
        proceeds = pos["shares"] * px * (1.0 - FEE_SELL - TAX_SELL)
        cash += proceeds
        trades.append({"sym": pos["sym"], "net": (proceeds / pos["cost"] - 1.0) * 100.0,
                       "reason": "OPEN", "bars": 0})

    final = curve[-1] if curve else 1.0
    peak = -1e18
    mdd = 0.0
    for e in curve:
        peak = max(peak, e)
        if peak > 0:
            mdd = min(mdd, (e - peak) / peak)

    if not trades:
        return {"trades": 0, "wr": 0.0, "pf": 0.0, "net": 0.0, "dd": 0.0, "exp": 0.0}

    wins = [t for t in trades if t["net"] > 0]
    losses = [t for t in trades if t["net"] <= 0]
    gw = sum(t["net"] for t in wins)
    gl = abs(sum(t["net"] for t in losses))

    return {
        "trades": len(trades),
        "wr": len(wins) / len(trades) * 100.0,
        "pf": (gw / gl) if gl > 0 else 0.0,
        "net": (final - 1.0) * 100.0,
        "dd": abs(mdd) * 100.0,
        "exp": sum(t["net"] for t in trades) / len(trades),
    }


# ------------------------------------------------------------------- specs

def build_specs():
    specs = []
    combos = [
        ("breakout", 20, 0), ("breakout", 55, 0),
        ("ma_cross", 0, 0),
        ("rsi_dip", 0, 15), ("rsi_dip", 0, 25),
        ("pullback", 0, 45),
    ]
    for etype, lo, thr in combos:
        for sl in (2.0, 3.0):
            for exit_kind, mult in (("fixed", 6.0), ("trail", 3.5)):
                for ts_ in (60, 120):
                    spec = {
                        "entry": etype, "lookback": lo, "rsiThr": thr,
                        "slMult": sl, "exit": exit_kind,
                        "minAtrPct": MIN_ATR_PCT, "timeStop": ts_,
                        "tpMult": mult if exit_kind == "fixed" else 0.0,
                        "trailMult": mult if exit_kind == "trail" else 0.0,
                    }
                    label = (
                        f"{etype}{lo or ''}{'' if not thr else f'<={thr}'}"
                        f" SL{sl} {'TP' if exit_kind == 'fixed' else 'TR'}{mult} T{ts_}"
                    )
                    spec["name"] = label
                    specs.append(spec)
    return specs


# ------------------------------------------------------------------- main

def main() -> int:
    print("Riset 2: filter rezim pasar + relative strength")
    print(f"Fee round-trip {(FEE_BUY + FEE_SELL + TAX_SELL) * 100:.2f}%\n")

    raw = get_all_data()
    pre = {s: precompute(d) for s, d in raw.items()}

    try:
        regime_map = fetch_ihsg()
    except Exception as exc:
        print(f"Gagal ambil IHSG: {exc}")
        return 1
    if not regime_map:
        print("Rezim IHSG kosong.")
        return 1

    all_ts = sorted({t for s in pre for t in pre[s]["ts"]})
    split = all_ts[int(len(all_ts) * TRAIN_RATIO)]
    t0, t1 = all_ts[0], split
    t2 = all_ts[-1]
    print(
        f"TRAIN {datetime.fromtimestamp(t0, tz=timezone.utc):%Y-%m-%d} .. "
        f"{datetime.fromtimestamp(t1, tz=timezone.utc):%Y-%m-%d}   |   "
        f"TEST {datetime.fromtimestamp(t1, tz=timezone.utc):%Y-%m-%d} .. "
        f"{datetime.fromtimestamp(t2, tz=timezone.utc):%Y-%m-%d}\n"
    )

    specs = build_specs()
    modes = [
        ("A no-filter", False, False),
        ("B regime", True, False),
        ("C regime+RS3", True, True),
    ]

    print(f"{len(specs)} konfigurasi x {len(modes)} mode\n")

    rows = []
    for spec in specs:
        for mname, use_reg, use_rs in modes:
            tr = simulate(pre, spec, t0, t1, regime_map, use_reg, use_rs)
            te = simulate(pre, spec, t1, t2, regime_map, use_reg, use_rs)
            ok = (
                tr["trades"] >= 20 and tr["pf"] >= 1.15 and tr["net"] > 0
                and te["trades"] >= 10 and te["pf"] >= 1.15 and te["net"] > 0
            )
            rows.append({"mode": mname, "name": spec["name"], "spec": spec,
                         "train": tr, "test": te, "pass": ok})

    rows.sort(key=lambda r: (r["pass"], r["test"]["pf"], r["test"]["net"]), reverse=True)
    winners = [r for r in rows if r["pass"]]

    hdr = f"{'mode':<13}{'konfigurasi':<38}{'TRtr':>5}{'PF':>6}{'net':>8} |{'TEtr':>5}{'PF':>6}{'net':>8}{'DD':>6}  ok"
    print(hdr)
    print("-" * len(hdr))
    for r in rows[:20]:
        a, b = r["train"], r["test"]
        print(
            f"{r['mode']:<13}{r['name'][:38]:<38}{a['trades']:>5}{a['pf']:>6.2f}{a['net']:>7.1f}%"
            f" |{b['trades']:>5}{b['pf']:>6.2f}{b['net']:>7.1f}%{b['dd']:>6.1f}"
            f"  {'LOLOS' if r['pass'] else '-'}"
        )

    # rekap per mode: berapa yang lolos + median test PF
    print("\nRekap per mode:")
    summary = {}
    for mname, _, _ in modes:
        sub = [r for r in rows if r["mode"] == mname]
        passed = sum(1 for r in sub if r["pass"])
        pfs = sorted(r["test"]["pf"] for r in sub)
        med = pfs[len(pfs) // 2] if pfs else 0.0
        pos = sum(1 for r in sub if r["test"]["net"] > 0)
        summary[mname] = {"tested": len(sub), "passed": passed,
                          "medianTestPf": round(med, 3), "testNetPositive": pos}
        print(f"  {mname:<14} lolos {passed:>3}/{len(sub)}  "
              f"median PF test {med:>5.2f}  net positif {pos:>3}/{len(sub)}")

    print("\n" + "=" * 76)
    if winners:
        best = winners[0]
        print(f"KANDIDAT LAYAK: [{best['mode']}] {best['name']}")
        print(f"  TRAIN tr{best['train']['trades']} PF{best['train']['pf']:.2f} "
              f"net{best['train']['net']:.1f}%  |  "
              f"TEST tr{best['test']['trades']} PF{best['test']['pf']:.2f} "
              f"net{best['test']['net']:.1f}% DD{best['test']['dd']:.1f}%")
        verdict = "LAYAK"
    else:
        verdict = "TIDAK LAYAK"
        print("MASIH TIDAK ADA YANG LOLOS TRAIN + TEST")
        b = rows[0]
        print(f"Terdekat: [{b['mode']}] {b['name']} -> "
              f"TRAIN PF {b['train']['pf']:.2f} net {b['train']['net']:.1f}% | "
              f"TEST PF {b['test']['pf']:.2f} net {b['test']['net']:.1f}%")
    print("=" * 76)

    payload = {
        "generatedAt": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "method": {
            "type": "portfolio + regime filter",
            "feeRoundTripPct": round((FEE_BUY + FEE_SELL + TAX_SELL) * 100, 2),
            "configsTested": len(rows),
            "trainPeriod": f"{datetime.fromtimestamp(t0, tz=timezone.utc):%Y-%m-%d}.."
                           f"{datetime.fromtimestamp(t1, tz=timezone.utc):%Y-%m-%d}",
            "testPeriod": f"{datetime.fromtimestamp(t1, tz=timezone.utc):%Y-%m-%d}.."
                          f"{datetime.fromtimestamp(t2, tz=timezone.utc):%Y-%m-%d}",
        },
        "verdict": verdict,
        "modeSummary": summary,
        "winners": [{"mode": w["mode"], "name": w["name"], "spec": w["spec"],
                     "train": w["train"], "test": w["test"]} for w in winners[:5]],
        "leaderboard": [{"mode": r["mode"], "name": r["name"],
                         "train": r["train"], "test": r["test"],
                         "passBoth": r["pass"]} for r in rows[:25]],
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    print(f"\nTersimpan: {os.path.normpath(OUT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
