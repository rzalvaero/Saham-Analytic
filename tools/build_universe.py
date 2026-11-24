"""
build_universe.py - Bangun universe penuh IDX (~941 emiten) yang TERBUKTI ada datanya.

Sumber daftar kode: Wikipedia "Daftar perusahaan yang tercatat di BEI".
Validasi data    : Yahoo Finance, diuji satu per satu.

Prinsip: hanya emiten yang benar-benar punya data historis yang masuk universe.
Yang tidak ada di Yahoo (delisted, suspensi, tidak tercakup) dibuang dan dicatat.

Output:
  tools/_cache_idx_full.json   -> cache mentah (gitignored, besar)
  src/data/universe_idx.json   -> ringkasan yang lolos (ikut deploy)

Jalankan:
  python tools/build_universe.py            # bangun dari nol
  python tools/build_universe.py --reuse    # pakai cache, hanya isi yang kurang
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "_cache_idx_full.json")
SUMMARY = os.path.join(HERE, "..", "src", "data", "universe_idx.json")

WIKI = "https://id.wikipedia.org/wiki/Daftar_perusahaan_yang_tercatat_di_Bursa_Efek_Indonesia"
YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=5y&interval=1d"

MIN_BARS = 250          # minimal ~1 tahun data agar layak diuji
WORKERS = 8
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}


def fetch_codes() -> list[str]:
    """Ambil kode 4 huruf kapital dari tabel Wikipedia."""
    req = urllib.request.Request(WIKI, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as resp:
        html = resp.read().decode("utf-8", "replace")

    codes = sorted({m.group(1) for m in re.finditer(r">([A-Z]{4})<", html)})
    return codes


def fetch_one(sym: str) -> tuple[str, dict | None, str]:
    """Ambil data satu emiten. Kembalikan (kode, data|None, alasan gagal)."""
    url = YAHOO.format(sym=f"{sym}.JK")
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=35) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as exc:
        return sym, None, f"HTTP {exc.code}"
    except Exception as exc:  # noqa: BLE001
        return sym, None, type(exc).__name__

    result = (payload.get("chart") or {}).get("result") or []
    if not result:
        return sym, None, "no-result"

    node = result[0]
    stamps = node.get("timestamp") or []
    q = (node.get("indicators") or {}).get("quote") or [{}]
    q = q[0]

    opens, highs = q.get("open") or [], q.get("high") or []
    lows, closes = q.get("low") or [], q.get("close") or []
    vols = q.get("volume") or []

    rows = []
    for i, ts in enumerate(stamps):
        try:
            o, h, l, c = opens[i], highs[i], lows[i], closes[i]
        except IndexError:
            break
        if None in (o, h, l, c) or c <= 0:
            continue
        rows.append({
            "t": int(ts),
            "o": round(float(o), 2),
            "h": round(float(h), 2),
            "l": round(float(l), 2),
            "c": round(float(c), 2),
            "v": float(vols[i]) if i < len(vols) and vols[i] is not None else 0.0,
        })

    if len(rows) < MIN_BARS:
        return sym, None, f"bar-kurang ({len(rows)})"

    return sym, {"symbol": sym, "rows": rows}, ""


def main() -> int:
    reuse = "--reuse" in sys.argv

    print("Membangun universe penuh IDX\n")

    codes = fetch_codes()
    print(f"Daftar kode dari Wikipedia : {len(codes)}")

    cache: dict[str, dict] = {}
    if reuse and os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as fh:
            cache = json.load(fh)
        print(f"Cache lama dipakai         : {len(cache)} emiten")

    todo = [c for c in codes if c not in cache]
    print(f"Perlu diambil              : {len(todo)}\n")

    failed: dict[str, str] = {}
    done = 0
    total = len(todo)

    if todo:
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = {pool.submit(fetch_one, sym): sym for sym in todo}
            for fut in as_completed(futures):
                sym, data, why = fut.result()
                done += 1
                if data:
                    cache[sym] = data
                else:
                    failed[sym] = why
                if done % 50 == 0 or done == total:
                    print(f"  {done}/{total} diproses | lolos {len(cache)} | gagal {len(failed)}",
                          flush=True)

        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        with open(CACHE, "w", encoding="utf-8") as fh:
            json.dump(cache, fh)

    # ringkasan ringan untuk UI (tanpa bar harga)
    summary = {
        "generatedAt": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "Wikipedia (daftar BEI) + validasi Yahoo Finance",
        "listedCodes": len(codes),
        "withData": len(cache),
        "withoutData": len(failed),
        "minBars": MIN_BARS,
        "emiten": sorted(cache.keys()),
        "excluded": dict(sorted(failed.items())),
    }

    os.makedirs(os.path.dirname(SUMMARY), exist_ok=True)
    with open(SUMMARY, "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print(f"Kode terdaftar     : {len(codes)}")
    print(f"Punya data layak   : {len(cache)}")
    print(f"Tidak ada data     : {len(failed)}")
    print(f"Tersimpan: {os.path.normpath(SUMMARY)}")
    print("=" * 60)

    if failed:
        from collections import Counter
        reasons = Counter(v.split(" (")[0] for v in failed.values())
        print("\nAlasan gagal:")
        for r, n in reasons.most_common():
            print(f"  {r}: {n}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
