"""
sweep_idx.py - Parameter sweep strategi IDX di atas data yang sama.

Tujuan: mencari tahu apakah ADA varian strategi yang layak secara
statistik di IDX dengan fee round-trip 0.40%, sebelum menyimpulkan.

Mengimpor fetch/indikator dari backtest_idx.py agar apples-to-apples.
Cache data mentah ke tools/_cache_idx.json supaya tidak fetch berulang.

Jalankan:
  python tools/sweep_idx.py
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backtest_idx import (  # noqa: E402
    UNIVERSE,
    FEE_ROUND_TRIP,
    fetch,
    ema,
    wilder_rsi,
    atr_series,
)

CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_cache_idx.json")


# ------------------------------------------------------------------- cache

def load_cache() -> dict:
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            return {}
    return {}


def save_cache(cache: dict) -> None:
    with open(CACHE_PATH, "w", encoding="utf-8") as fh:
        json.dump(cache, fh)


def get_all_data() -> dict:
    cache = load_cache()
    out = {}
    for i, sym in enumerate(UNIVERSE, 1):
        if sym in cache:
            out[sym] = cache[sym]
            continue
        print(f"  fetch {i}/{len(UNIVERSE)} {sym}", flush=True)
        d = fetch(sym)
        if d:
            cache[sym] = d
            out[sym] = d
    save_cache(cache)
    print(f"  data siap: {len(out)} emiten\n")
    return out


# ------------------------------------------------------------- backtest inti

def run(data: dict, spec: dict) -> dict:
    rows = data["rows"]
    closes = [r["c"] for r in rows]
    highs = [r["h"] for r in rows]
    lows = [r["l"] for r in rows]
    opens = [r["o"] for r in rows]
    vols = [r["v"] for r in rows]

    rsi_p = spec["rsiPeriod"]
    rsi = wilder_rsi(closes, rsi_p)
    ema_fast = ema(closes, spec["emaFast"])
    ema_slow = ema(closes, spec["emaSlow"])
    atr = atr_series(highs, lows, closes, 14)

    lookback = spec["breakoutLookback"]
    vol_mult = spec["volMult"]

    trades = []
    pos = None
    equity = 1.0
    peak = 1.0
    max_dd = 0.0

    start = max(spec["emaSlow"], 15, rsi_p, lookback) + 1

    for i in range(start, len(rows)):
        row = rows[i]

        if pos is not None:
            hit_sl = row["l"] <= pos["sl"]
            hit_tp = row["h"] >= pos["tp"]
            bars = i - pos["i"]
            exit_px = None
            reason = None

            if hit_sl:
                exit_px, reason = pos["sl"], "SL"
            elif hit_tp:
                exit_px, reason = pos["tp"], "TP"
            elif bars >= spec["timeStop"]:
                exit_px, reason = row["c"], "TIME"

            if exit_px is not None:
                gross = (exit_px - pos["entry"]) / pos["entry"]
                net = gross - FEE_ROUND_TRIP
                equity *= (1.0 + net)
                peak = max(peak, equity)
                max_dd = min(max_dd, (equity - peak) / peak)
                trades.append({"net": net, "reason": reason, "bars": bars})
                pos = None

        if pos is not None:
            continue

        r = rsi[i]
        ef = ema_fast[i]
        es = ema_slow[i]
        a = atr[i]
        if r is None or ef is None or es is None or a is None:
            continue

        green = row["c"] > row["o"]
        above_fast = row["c"] > ef
        above_slow = row["c"] > es

        # volume rata-rata lookback
        lo = max(0, i - lookback)
        av = sum(vols[lo:i]) / max(1, i - lo)
        vol_ok = av > 0 and (vols[i] / av) >= vol_mult

        entry_signal = False
        if spec["entry"] == "rsi_dip":
            entry_signal = r <= spec["rsiBuyMax"] and above_slow and green
        elif spec["entry"] == "breakout":
            hi = max(highs[lo:i]) if i > lo else row["h"]
            entry_signal = row["c"] > hi and above_fast and vol_ok and green
        elif spec["entry"] == "pullback_uptrend":
            entry_signal = above_slow and above_fast and r <= spec["rsiBuyMax"] and green
        elif spec["entry"] == "ma_cross":
            ef_prev = ema_fast[i - 1]
            entry_signal = (
                ef_prev is not None
                and ef_prev <= es
                and ef > es
                and above_slow
            )

        if entry_signal:
            entry = row["c"]
            sl = entry - spec["slMult"] * a
            tp = entry + spec["tpMult"] * a
            if sl < entry < tp:
                pos = {"entry": entry, "sl": sl, "tp": tp, "i": i}

    if not trades:
        return {"trades": 0, "wr": 0.0, "pf": 0.0, "net": 0.0, "dd": 0.0}

    wins = [t for t in trades if t["net"] > 0]
    losses = [t for t in trades if t["net"] <= 0]
    gw = sum(t["net"] for t in wins)
    gl = abs(sum(t["net"] for t in losses))

    return {
        "trades": len(trades),
        "wr": len(wins) / len(trades) * 100.0,
        "pf": (gw / gl) if gl > 0 else 0.0,
        "net": (equity - 1.0) * 100.0,
        "dd": abs(max_dd) * 100.0,
    }


# ------------------------------------------------------------------- specs

SPECS = [
    {
        "name": "A RSI5 dip + EMA50 (baseline)",
        "entry": "rsi_dip", "rsiPeriod": 5, "rsiBuyMax": 25,
        "emaFast": 20, "emaSlow": 50, "breakoutLookback": 20,
        "volMult": 1.3, "slMult": 2.0, "tpMult": 4.0, "timeStop": 20,
    },
    {
        "name": "B RSI5 dip + EMA200, TP 6x",
        "entry": "rsi_dip", "rsiPeriod": 5, "rsiBuyMax": 30,
        "emaFast": 20, "emaSlow": 200, "breakoutLookback": 20,
        "volMult": 1.3, "slMult": 2.0, "tpMult": 6.0, "timeStop": 40,
    },
    {
        "name": "C RSI14 dip + EMA200",
        "entry": "rsi_dip", "rsiPeriod": 14, "rsiBuyMax": 35,
        "emaFast": 20, "emaSlow": 200, "breakoutLookback": 20,
        "volMult": 1.3, "slMult": 2.0, "tpMult": 6.0, "timeStop": 60,
    },
    {
        "name": "D Breakout 20 + vol 1.3x",
        "entry": "breakout", "rsiPeriod": 14, "rsiBuyMax": 100,
        "emaFast": 20, "emaSlow": 50, "breakoutLookback": 20,
        "volMult": 1.3, "slMult": 2.0, "tpMult": 4.0, "timeStop": 30,
    },
    {
        "name": "E Pullback uptrend RSI14<=50",
        "entry": "pullback_uptrend", "rsiPeriod": 14, "rsiBuyMax": 50,
        "emaFast": 20, "emaSlow": 50, "breakoutLookback": 20,
        "volMult": 1.3, "slMult": 2.0, "tpMult": 4.0, "timeStop": 30,
    },
    {
        "name": "F MA20 cross MA50 + EMA200",
        "entry": "ma_cross", "rsiPeriod": 14, "rsiBuyMax": 100,
        "emaFast": 20, "emaSlow": 50, "breakoutLookback": 20,
        "volMult": 1.3, "slMult": 2.5, "tpMult": 5.0, "timeStop": 60,
    },
]


def main() -> int:
    print("Sweep strategi IDX | fee round-trip 0.40%\n")
    data = get_all_data()
    if not data:
        print("Tidak ada data.")
        return 1

    summary_rows = []

    for spec in SPECS:
        tot_tr = 0
        nets = []
        pfs = []
        dds = []
        agg_win = 0.0

        for sym, d in data.items():
            r = run(d, spec)
            if r["trades"] == 0:
                continue
            tot_tr += r["trades"]
            nets.append(r["net"])
            pfs.append(r["pf"])
            dds.append(r["dd"])
            agg_win += r["wr"] * r["trades"] / 100.0

        if tot_tr == 0:
            print(f"{spec['name']:<38} -> 0 trade")
            continue

        wr = agg_win / tot_tr * 100.0
        pf = sum(pfs) / len(pfs)
        avg_net = sum(nets) / len(nets)
        pos = sum(1 for n in nets if n > 0)
        worst_dd = max(dds)

        verdict = "LAYAK" if (pf >= 1.3 and avg_net > 0 and tot_tr >= 30) else "TOLAK"

        summary_rows.append({
            "name": spec["name"], "trades": tot_tr, "wr": wr, "pf": pf,
            "avgNet": avg_net, "dd": worst_dd, "pos": pos,
            "universe": len(nets), "verdict": verdict,
        })

        print(
            f"{spec['name']:<38} tr={tot_tr:>4} WR={wr:>5.1f}% "
            f"PF={pf:>5.2f} net={avg_net:>7.2f}% DD={worst_dd:>5.1f}% "
            f"profit_emit={pos}/{len(nets)} -> {verdict}"
        )

    if summary_rows:
        best = max(summary_rows, key=lambda x: (x["verdict"] == "LAYAK", x["pf"]))
        print("\n" + "=" * 70)
        print(f"TERBAIK: {best['name']}  (PF {best['pf']:.2f}, net {best['avgNet']:.2f}%)")
        print(f"Verdict: {best['verdict']}")
        print("=" * 70)

        out = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..", "src", "data", "sweep_idx.json",
        )
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as fh:
            json.dump({"feeRoundTripPct": round(FEE_ROUND_TRIP * 100, 2),
                       "results": summary_rows}, fh, indent=2, ensure_ascii=False)
        print(f"Tersimpan: {os.path.normpath(out)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
