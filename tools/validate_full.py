"""
validate_full.py - Validasi ketat kandidat universe penuh.

Dua hal yang WAJIB dibersihkan sebelum angka riset_full.py boleh dipercaya:

  1. BENCHMARK CACAT.
     research_full.py membandingkan dengan equal-weight 881 emiten TERMASUK
     yang tidak likuid. Saham gocap bisa naik 5x dalam setahun, sehingga
     benchmark membengkak (fold3 = +114%) dan perbandingan jadi tidak adil.
     Di sini benchmark dihitung ulang HANYA pada universe likuid.

  2. BIAS SURVIVORSHIP.
     Universe dibangun dari daftar BEI SAAT INI. Emiten yang sudah delisting
     tidak ikut, sehingga hasil otomatis lebih bagus dari kenyataan.
     Ini tidak bisa dihilangkan tanpa data delisted, tapi harus dinyatakan.

Uji tambahan: sensitivitas tetangga parameter kandidat top20 LB126.
Kalau tetangganya (top15/top25, LB100/LB150) juga positif, artinya strategi
bertahan pada dataran (plateau), bukan menara tunggal (spike) = bukan overfit.

Jalankan:
  python tools/validate_full.py
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backtest_idx import FEE_BUY, FEE_SELL, TAX_SELL  # noqa: E402
from research_idx2 import fetch_ihsg  # noqa: E402
from research_full import (  # noqa: E402
    CACHE, MIN_DAILY_VALUE, MIN_PRICE, precompute, build_liquid_mask,
    run_momentum, folds_of, fmt,
)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "src", "data", "validate_full.json")

FEE_RT = FEE_BUY + FEE_SELL + TAX_SELL


def bench_liquid(pre, liquid, start_ts, end_ts):
    """Equal-weight HANYA emiten likuid."""
    ratios = []
    for s, ok in liquid.items():
        if not ok:
            continue
        p = pre[s]
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


def main() -> int:
    print(f"Validasi kandidat universe penuh | fee {FEE_RT*100:.2f}%\n")

    with open(CACHE, encoding="utf-8") as fh:
        raw = json.load(fh)
    pre = {s: precompute(d["rows"]) for s, d in raw.items() if len(d["rows"]) >= 300}
    liquid = build_liquid_mask(pre, MIN_DAILY_VALUE)
    n_liq = sum(1 for v in liquid.values() if v)
    print(f"Universe {len(pre)} | likuid {n_liq}\n")

    regime_map = fetch_ihsg()
    all_ts = sorted({t for s in pre for t in pre[s]["ts"]})
    folds = folds_of(all_ts)

    # ------------------ 1. benchmark bersih ------------------
    print("BENCHMARK (equal-weight, hanya likuid):")
    bench_clean = []
    for a, b, c, d in folds:
        bl = bench_liquid(pre, liquid, c, d)
        bench_clean.append({"period": f"{fmt(c)}..{fmt(d)}",
                            "net": bl["net"] if bl else None,
                            "n": bl["n"] if bl else 0})
        print(f"  {fmt(c)}..{fmt(d)}  net {bl['net']:>7.1f}%  ({bl['n']} emiten)"
              if bl else f"  {fmt(c)}..{fmt(d)}  n/a")

    # ------------------ 2. sensitivitas tetangga ------------------
    neighbors = [
        ("top15 LB126", 15, 126),
        ("top20 LB100", 20, 100),
        ("top20 LB126", 20, 126),
        ("top20 LB150", 20, 150),
        ("top25 LB126", 25, 126),
        ("top20 LB63", 20, 63),
    ]

    print("\nSENSITIVITAS TETANGGA PARAMETER:")
    results = []
    for label, top_k, lb in neighbors:
        rows = []
        for a, b, c, d in folds:
            te = run_momentum(pre, liquid, regime_map, c, d, top_k, lb)
            bl = bench_liquid(pre, liquid, c, d)
            rows.append({"period": f"{fmt(c)}..{fmt(d)}", **te,
                         "benchNet": bl["net"] if bl else None})

        good = sum(1 for r in rows if r["net"] > 0 and r["trades"] >= 5)
        beat = sum(1 for r in rows
                   if r["benchNet"] is not None and r["net"] > r["benchNet"])
        tested = sum(1 for r in rows if r["trades"] >= 5)
        avg_pf = (sum(r["pf"] for r in rows if r["trades"] >= 5) / tested) if tested else 0.0

        results.append({"name": label, "folds": rows, "profitableFolds": good,
                        "testedFolds": tested, "beatBenchFolds": beat,
                        "avgPf": round(avg_pf, 3)})

        print(f"  {label:<14} untung {good}/{tested}  kalahkan-bench {beat}/{tested}  "
              f"avgPF {avg_pf:>5.2f}")
        for r in rows:
            bn = r["benchNet"]
            bs = f"{bn:>7.1f}%" if bn is not None else "   n/a "
            print(f"      {r['period']} tr{r['trades']:>4} PF{r['pf']:>5.2f} "
                  f"net{r['net']:>7.1f}% DD{r['dd']:>5.1f}% | bench{bs}")

    # ------------------ 3. verdik ------------------
    print("\n" + "=" * 72)

    core = [r for r in results if r["name"] == "top20 LB126"][0]
    plateau = sum(1 for r in results if r["profitableFolds"] >= 3)
    beat_all = sum(1 for r in results if r["beatBenchFolds"] >= 3)

    print(f"Kandidat inti top20 LB126 : {core['profitableFolds']}/{core['testedFolds']} fold untung")
    print(f"Tetangga yang juga >=3/4   : {plateau}/{len(results)}")
    print(f"Tetangga yang kalahkan bench >=3/4 : {beat_all}/{len(results)}")

    if core["profitableFolds"] >= 3 and plateau >= 5:
        verdict = "LAYAK"
        note = "Bertahan di rolling test DAN di dataran parameter (bukan spike)."
    elif core["profitableFolds"] >= 3 and plateau >= 3:
        verdict = "CUKUP"
        note = "Bertahan di rolling test, tapi sebagian tetangga melemah."
    else:
        verdict = "TIDAK LAYAK"
        note = "Tidak bertahan, atau hanya menara tunggal (indikasi overfit)."

    print(f"\nVERDIK: {verdict}")
    print(note)
    print("=" * 72)

    payload = {
        "generatedAt": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "method": {
            "universe": len(pre), "liquid": n_liq,
            "feeRoundTripPct": round(FEE_RT * 100, 2),
            "minPrice": MIN_PRICE, "minDailyValue": MIN_DAILY_VALUE,
            "benchmark": "equal-weight likuid saja (bukan 881 emiten)",
            "survivorshipBias": (
                "Universe dari daftar BEI saat ini; emiten delisting tidak ikut. "
                "Hasil cenderung lebih bagus dari kenyataan."
            ),
        },
        "verdict": verdict,
        "note": note,
        "benchmarkClean": bench_clean,
        "neighbors": results,
        "coreCandidate": "top20 LB126",
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    print(f"\nTersimpan: {os.path.normpath(OUT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
