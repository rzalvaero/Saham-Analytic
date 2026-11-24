"""
research_full.py - Riset pada universe PENUH IDX (881 emiten), bukan 32 blue chip.

Perbedaan penting dari research_idx*.py:
  1. Universe 881 emiten (validasi Yahoo), bukan 32.
  2. Filter likuiditas WAJIB: nilai transaksi harian >= Rp 1 miliar.
     Tanpa filter ini, backtest akan "membeli" saham gocap yang di dunia nyata
     tidak bisa dibeli dalam ukuran wajar. Itu menipu diri sendiri.
  3. Filter harga >= Rp 50 (hindari tidur/suspensi).
  4. Metode: momentum lintas-saham + filter rezim IHSG>MA200 (satu-satunya
     pendekatan yang memberi sinyal positif di riset sebelumnya).
  5. Rolling walk-forward 4 fold, plus benchmark equal-weight universe penuh.

Verdik LAYAK hanya jika bertahan di minimal 3 dari 4 fold DAN mengalahkan
benchmark equal-weight di mayoritas fold.

Jalankan:
  python tools/research_full.py
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backtest_idx import FEE_BUY, FEE_SELL, TAX_SELL, ema, wilder_rsi, atr_series  # noqa: E402
from research_idx2 import fetch_ihsg, regime_on  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "_cache_idx_full.json")
OUT = os.path.join(HERE, "..", "src", "data", "research_full.json")

FEE_RT = FEE_BUY + FEE_SELL + TAX_SELL

MIN_PRICE = 50.0            # rupiah
MIN_DAILY_VALUE = 1_000_000_000.0   # Rp 1 miliar/hari
MIN_ATR_PCT = 1.0
MAX_POS = 5
REBALANCE_DAYS = 21
N_FOLDS = 4


# ------------------------------------------------------------ precompute

def precompute(rows: list[dict]) -> dict:
    c = [r["c"] for r in rows]
    h = [r["h"] for r in rows]
    l = [r["l"] for r in rows]
    v = [r["v"] for r in rows]
    ts = [r["t"] for r in rows]

    # nilai transaksi harian kasar (harga x volume)
    value = [c[i] * v[i] for i in range(len(c))]

    atr = atr_series(h, l, c, 14)
    e200 = ema(c, 200)

    return {
        "ts": ts,
        "c": c, "h": h, "l": l, "v": v,
        "cv": value,
        "atr": atr,
        "ema200": e200,
        "idx": {t: i for i, t in enumerate(ts)},
    }


# ------------------------------------------------- sebaran likuiditas awal

def build_liquid_mask(pre: dict, min_value: float) -> dict[str, bool]:
    """Emiten dianggap likuid jika median nilai transaksi >= ambang."""
    out = {}
    for s, p in pre.items():
        vals = sorted(p["cv"])
        if not vals:
            out[s] = False
            continue
        med = vals[len(vals) // 2]
        out[s] = med >= min_value
    return out


# ------------------------------------------------------ momentum portfolio

def run_momentum(pre, liquid, regime_map, start_ts, end_ts, top_k, lookback,
                 use_regime=True):
    symbols = [s for s, ok in liquid.items() if ok]
    if not symbols:
        return {"trades": 0, "wr": 0.0, "pf": 0.0, "net": 0.0, "dd": 0.0,
                "exp": 0.0, "years": 0.0, "cagr": 0.0}

    all_ts = sorted({t for s in symbols for t in pre[s]["ts"]
                     if start_ts <= t <= end_ts})
    if len(all_ts) < lookback + REBALANCE_DAYS:
        return {"trades": 0, "wr": 0.0, "pf": 0.0, "net": 0.0, "dd": 0.0,
                "exp": 0.0, "years": 0.0, "cagr": 0.0}

    # peta close per simbol untuk lookup cepat
    close_map = {s: {t: pre[s]["c"][i] for t, i in pre[s]["idx"].items()}
                 for s in symbols}

    cash = 1.0
    holdings: dict[str, dict] = {}
    trades: list[float] = []
    curve: list[float] = []
    last: dict[str, float] = {}

    for n, ts in enumerate(all_ts):
        for s in symbols:
            px = close_map[s].get(ts)
            if px is not None:
                last[s] = px

        if n % REBALANCE_DAYS != 0:
            curve.append(cash + sum(h["sh"] * last.get(s, h["px"])
                                    for s, h in holdings.items()))
            continue

        # ----- ranking -----
        ranked = []
        for s in symbols:
            p = pre[s]
            i = p["idx"].get(ts)
            if i is None or i < lookback:
                continue
            px = p["c"][i]
            past = p["c"][i - lookback]
            if past <= 0 or px < MIN_PRICE:
                continue
            atr = p["atr"][i]
            if atr is None or (atr / px) * 100.0 < MIN_ATR_PCT:
                continue
            if p["cv"][i] < MIN_DAILY_VALUE:
                continue
            e200 = p["ema200"][i]
            if e200 is not None and px < e200:
                continue
            ranked.append(((px / past) - 1.0, s, px))

        ranked.sort(reverse=True)

        want: set[str] = set()
        if ranked and (not use_regime or regime_on(regime_map, ts)):
            want = {s for _, s, _ in ranked[:top_k]}

        # ----- jual -----
        for s in list(holdings):
            if s in want:
                continue
            h = holdings.pop(s)
            px = last.get(s, h["px"])
            proceeds = h["sh"] * px * (1.0 - FEE_SELL - TAX_SELL)
            cash += proceeds
            trades.append((proceeds / h["cost"] - 1.0) * 100.0)

        # ----- beli -----
        buys = [(s, px) for _, s, px in ranked if s in want and s not in holdings]
        if buys:
            eq = cash + sum(h["sh"] * last.get(s, h["px"]) for s, h in holdings.items())
            slot = eq / max(1, top_k)
            for s, px in buys:
                notional = min(slot, cash / (1.0 + FEE_BUY))
                if notional < 1e-9:
                    continue
                cost = notional * (1.0 + FEE_BUY)
                if cash < cost:
                    continue
                cash -= cost
                holdings[s] = {"px": px, "cost": cost, "sh": notional / px}

        curve.append(cash + sum(h["sh"] * last.get(s, h["px"])
                                for s, h in holdings.items()))

    for s, h in holdings.items():
        px = last.get(s, h["px"])
        proceeds = h["sh"] * px * (1.0 - FEE_SELL - TAX_SELL)
        cash += proceeds
        trades.append((proceeds / h["cost"] - 1.0) * 100.0)
    if curve:
        curve[-1] = cash

    final = curve[-1] if curve else 1.0
    peak = -1e18
    mdd = 0.0
    for e in curve:
        peak = max(peak, e)
        if peak > 0:
            mdd = min(mdd, (e - peak) / peak)

    years = max(1e-9, (all_ts[-1] - all_ts[0]) / (365.25 * 86400))

    if not trades:
        return {"trades": 0, "wr": 0.0, "pf": 0.0, "net": (final - 1) * 100.0,
                "dd": abs(mdd) * 100.0, "exp": 0.0, "years": years, "cagr": 0.0}

    w = [t for t in trades if t > 0]
    l = [t for t in trades if t <= 0]
    gw, gl = sum(w), abs(sum(l))

    return {
        "trades": len(trades),
        "wr": len(w) / len(trades) * 100.0,
        "pf": (gw / gl) if gl > 0 else 0.0,
        "net": (final - 1.0) * 100.0,
        "dd": abs(mdd) * 100.0,
        "exp": sum(trades) / len(trades),
        "years": years,
        "cagr": ((final ** (1.0 / years)) - 1.0) * 100.0 if final > 0 else -100.0,
    }


# ---------------------------------------------------------------- benchmark

def bench_equal_weight(pre, start_ts, end_ts):
    """Beli rata semua emiten likuid, tahan. Fee dua arah."""
    ratios = []
    for s, p in pre.items():
        ts = p["ts"]
        i0 = next((i for i, t in enumerate(ts) if t >= start_ts), None)
        i1 = next((i for i in range(len(ts) - 1, -1, -1) if ts[i] <= end_ts), None)
        if i0 is None or i1 is None or i1 <= i0:
            continue
        a, b = p["c"][i0], p["c"][i1]
        if a > 0:
            ratios.append(b / a)
    if not ratios:
        return None
    gross = sum(ratios) / len(ratios)
    net = gross * (1.0 - FEE_SELL - TAX_SELL) / (1.0 + FEE_BUY)
    return {"net": (net - 1.0) * 100.0, "n": len(ratios)}


def folds_of(all_ts, n=N_FOLDS):
    seg = len(all_ts) // (n + 1)
    return [(all_ts[0], all_ts[seg * k - 1], all_ts[seg * k],
             all_ts[seg * (k + 1) - 1] if k < n else all_ts[-1])
            for k in range(1, n + 1)]


def fmt(t):
    return datetime.fromtimestamp(t, tz=timezone.utc).strftime("%Y-%m")


# --------------------------------------------------------------------- main

def main() -> int:
    print(f"Riset universe PENUH IDX | fee {FEE_RT*100:.2f}%")
    print(f"Filter: harga>=Rp{MIN_PRICE:.0f}, nilai transaksi>=Rp{MIN_DAILY_VALUE/1e9:.1f}M/hari\n")

    if not os.path.exists(CACHE):
        print("Cache universe belum ada. Jalankan dulu: python tools/build_universe.py")
        return 1

    with open(CACHE, encoding="utf-8") as fh:
        raw = json.load(fh)
    print(f"Emiten di cache      : {len(raw)}")

    pre = {}
    for s, d in raw.items():
        if len(d["rows"]) >= 300:
            pre[s] = precompute(d["rows"])
    print(f"Layak precompute     : {len(pre)}")

    liquid = build_liquid_mask(pre, MIN_DAILY_VALUE)
    n_liquid = sum(1 for v in liquid.values() if v)
    print(f"Lolos filter likuid  : {n_liquid} emiten")
    print(f"Dibuang (tidak likuid): {len(liquid) - n_liquid}\n")

    regime_map = fetch_ihsg()

    all_ts = sorted({t for s in pre for t in pre[s]["ts"]})
    folds = folds_of(all_ts)

    print(f"Rolling walk-forward {N_FOLDS} fold:")
    for k, (a, b, c, d) in enumerate(folds, 1):
        print(f"  fold{k}: TRAIN {fmt(a)}..{fmt(b)}  TEST {fmt(c)}..{fmt(d)}")
    print()

    configs = [
        ("top5 LB63", 5, 63),
        ("top10 LB63", 10, 63),
        ("top5 LB126", 5, 126),
        ("top10 LB126", 10, 126),
        ("top20 LB126", 20, 126),
        ("top20 LB252", 20, 252),
    ]

    results = []

    for label, top_k, lb in configs:
        print(f"=== {label} ===")
        rows = []
        for a, b, c, d in folds:
            te = run_momentum(pre, liquid, regime_map, c, d, top_k, lb)
            bench = bench_equal_weight(pre, c, d)
            rows.append({"period": f"{fmt(c)}..{fmt(d)}", **te,
                         "benchNet": bench["net"] if bench else None})
            print(f"  TEST {fmt(c)}..{fmt(d)}  tr{te['trades']:>4}  "
                  f"PF{te['pf']:>5.2f}  net{te['net']:>7.1f}%  "
                  f"DD{te['dd']:>5.1f}%  (bench {bench['net']:>6.1f}%)" if bench else
                  f"  TEST {fmt(c)}..{fmt(d)}  tr{te['trades']:>4}  PF{te['pf']:>5.2f}  "
                  f"net{te['net']:>7.1f}%")

        good = sum(1 for r in rows if r["net"] > 0 and r["trades"] >= 5)
        beat = sum(1 for r in rows
                   if r["benchNet"] is not None and r["net"] > r["benchNet"])
        tested = sum(1 for r in rows if r["trades"] >= 5)
        avg_pf = (sum(r["pf"] for r in rows if r["trades"] >= 5) / tested) if tested else 0.0

        results.append({
            "name": label, "topK": top_k, "lookback": lb,
            "folds": rows, "profitableFolds": good, "testedFolds": tested,
            "beatBenchFolds": beat, "avgPf": round(avg_pf, 3),
            "verdict": "LAYAK" if (good >= 3 and beat >= 3) else "TIDAK LAYAK",
        })
        print(f"  -> untung {good}/{tested} fold, kalahkan benchmark {beat}/{tested} "
              f"-> {results[-1]['verdict']}\n")

    # full-period run untuk konteks
    t0, t2 = all_ts[0], all_ts[-1]
    full = run_momentum(pre, liquid, regime_map, t0, t2, 10, 126)
    full_bench = bench_equal_weight(pre, t0, t2)

    print("=" * 70)
    print("SEPANJANG PERIODE (konteks, bukan uji)")
    print(f"  Momentum top10 LB126 : {full['trades']} trade, PF {full['pf']:.2f}, "
          f"net {full['net']:.1f}%, CAGR {full['cagr']:.1f}%, DD {full['dd']:.1f}%")
    if full_bench:
        print(f"  Equal-weight {full_bench['n']} emiten : net {full_bench['net']:.1f}%")

    winners = [r for r in results if r["verdict"] == "LAYAK"]
    print()
    if winners:
        print(f"KANDIDAT LAYAK ({len(winners)}): " + ", ".join(w["name"] for w in winners))
        verdict = "LAYAK"
    else:
        best = max(results, key=lambda r: (r["profitableFolds"], r["avgPf"]))
        print(f"TIDAK ADA YANG LAYAK. Terbaik: {best['name']} "
              f"({best['profitableFolds']}/{best['testedFolds']} fold untung, "
              f"avgPF {best['avgPf']:.2f})")
        verdict = "TIDAK LAYAK"
    print("=" * 70)

    payload = {
        "generatedAt": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "method": {
            "universe": len(pre),
            "liquid": n_liquid,
            "feeRoundTripPct": round(FEE_RT * 100, 2),
            "minPrice": MIN_PRICE,
            "minDailyValue": MIN_DAILY_VALUE,
            "minAtrPct": MIN_ATR_PCT,
            "maxPos": MAX_POS,
            "rebalanceDays": REBALANCE_DAYS,
            "nFolds": N_FOLDS,
            "folds": [{"train": f"{fmt(a)}..{fmt(b)}", "test": f"{fmt(c)}..{fmt(d)}"}
                      for a, b, c, d in folds],
        },
        "verdict": verdict,
        "fullPeriod": {"config": "top10 LB126", **full, "benchNet":
                       full_bench["net"] if full_bench else None,
                       "benchN": full_bench["n"] if full_bench else None},
        "candidates": results,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    print(f"\nTersimpan: {os.path.normpath(OUT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
