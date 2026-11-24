"""
build_pasar_hari_ini.py - Bangun panel "Pasar Hari Ini" (breadth IHSG + top mover)
dari cache universe penuh (tools/_cache_idx_full.json).

Sumber bar : Yahoo Finance harian yang sudah ter-cache (881 emiten).
Nama emiten: diambil dari Yahoo Finance meta (longName), hanya untuk emiten
             yang tampil di daftar, agar tidak membombardir endpoint.

Output: src/data/pasar_hari_ini.json  (ikut deploy, statis)
"""
import json
import os
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "_cache_idx_full.json")
OUT = os.path.join(ROOT, "src", "data", "pasar_hari_ini.json")

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=5d&interval=1d"

TOP_N = 12


def fetch_meta(code):
    """Ambil nama panjang emiten dari Yahoo. Return (code, name)."""
    url = YAHOO.format(sym=f"{code}.JK")
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.load(resp)
        meta = (data.get("chart", {}).get("result") or [{}])[0].get("meta", {})
        name = meta.get("longName") or meta.get("shortName") or ""
        return code, name.strip()
    except Exception:
        return code, ""


def fetch_index():
    """Ambil level & perubahan IHSG (^JKSE).

    PENTING: meta.chartPreviousClose adalah close pada AWAL range yang diminta,
    bukan close hari bursa sebelumnya. Untuk persentase harian yang benar, pakai
    dua bar harian terakhir yang benar-benar punya nilai close.
    """
    url = YAHOO.format(sym="%5EJKSE")
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.load(resp)
        result = (data.get("chart", {}).get("result") or [{}])[0]
        meta = result.get("meta", {})
        quote = (result.get("indicators", {}).get("quote") or [{}])[0]
        closes = quote.get("close") or []

        # Bar hari berjalan sering still null di Yahoo. Jika bar terakhir null,
        # close terakhir yang valid ADALAH hari bursa sebelumnya (acuan persen).
        # Jika bar terakhir terisi, acuan = satu bar sebelum itu.
        if not closes:
            return None
        if closes[-1] is None:
            valid = [float(c) for c in closes if c is not None]
            if not valid:
                return None
            prev = valid[-1]
        else:
            valid = [float(c) for c in closes if c is not None]
            if len(valid) < 2:
                return None
            prev = valid[-2]

        last = meta.get("regularMarketPrice")
        last = float(last) if isinstance(last, (int, float)) and last > 0 else valid[-1]

        return {
            "last": round(last, 2),
            "prev": round(prev, 2),
            "change": round(last - prev, 2),
            "pct": round((last / prev - 1) * 100, 2),
        }
    except Exception as exc:
        print(f"  [WARN] IHSG gagal: {exc}")
    return None


def main():
    print("[>] Membaca cache universe penuh...")
    with open(CACHE, "r", encoding="utf-8") as fh:
        cache = json.load(fh)

    rows = []
    tradable = 0
    last_date = None

    for code, payload in cache.items():
        bars = payload.get("rows") or []
        if len(bars) < 2:
            continue
        last, prev = bars[-1], bars[-2]
        if not last.get("v") or not prev.get("c") or not last.get("c"):
            continue
        chg = last["c"] - prev["c"]
        pct = (chg / prev["c"]) * 100 if prev["c"] else 0.0
        tradable += 1
        if last_date is None or last["t"] > last_date:
            last_date = last["t"]
        rows.append({
            "code": code,
            "price": last["c"],
            "change": round(chg, 2),
            "pct": round(pct, 2),
            "volume": int(last["v"]),
            "value": int(last["v"] * last["c"]),
        })

    print(f"  emiten bertransaksi: {tradable}")

    naik = sum(1 for r in rows if r["change"] > 0)
    turun = sum(1 for r in rows if r["change"] < 0)
    tetap = sum(1 for r in rows if r["change"] == 0)

    gainers = sorted(rows, key=lambda r: -r["pct"])[:TOP_N]
    losers = sorted(rows, key=lambda r: r["pct"])[:TOP_N]
    by_vol = sorted(rows, key=lambda r: -r["volume"])[:TOP_N]
    by_val = sorted(rows, key=lambda r: -r["value"])[:TOP_N]

    # Nama hanya untuk emiten yang tampil
    need = sorted({r["code"] for group in (gainers, losers, by_vol, by_val) for r in group})
    print(f"[>] Mengambil nama {len(need)} emiten dari Yahoo...")
    names = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        for code, name in pool.map(fetch_meta, need):
            if name:
                names[code] = name
            time.sleep(0.05)

    def label(rec):
        return dict(rec, name=names.get(rec["code"], ""))

    payload = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "barDate": time.strftime("%Y-%m-%d", time.gmtime(last_date)) if last_date else None,
        "source": "Yahoo Finance harian (cache universe BEI)",
        "totalEmiten": len(cache),
        "tradedEmiten": tradable,
        "breadth": {"naik": naik, "tetap": tetap, "turun": turun},
        "ihsg": fetch_index(),
        "naik": [label(r) for r in gainers],
        "turun": [label(r) for r in losers],
        "volume": [label(r) for r in by_vol],
        "nilai": [label(r) for r in by_val],
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, separators=(",", ":"))

    print(f"[OK] {OUT}")
    print(f"     breadth: naik {naik} / tetap {tetap} / turun {turun}")
    if payload["ihsg"]:
        i = payload["ihsg"]
        print(f"     IHSG: {i['last']} ({i['pct']:+.2f}%)")
    print(f"     top gainer: {gainers[0]['code']} {gainers[0]['pct']:+.2f}%")


if __name__ == "__main__":
    main()
