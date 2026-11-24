"""
backtest_idx.py - Backtest kuantitatif saham IDX (Bursa Efek Indonesia).

Tujuan:
  Menghasilkan laporan backtest historis untuk dipakai halaman
  "Backtest Historis" di ReezTrade (trade.reez.my.id).

Model biaya IDX (WAJIB, bukan asumsi crypto):
  - Fee beli  : 0.15%
  - Fee jual  : 0.15%
  - Pajak jual: 0.10%
  - Total round-trip: 0.40%

Strategi (adaptasi TRADFI_RSI5_CHAMP ke timeframe D1):
  BUY  : RSI(5) <= 25 DAN close > EMA50 (trend filter) DAN candle hijau
  SELL : RSI(5) >= 75 DAN close < EMA50 DAN candle merah
  SL   : 2.0 x ATR(14)
  TP   : 4.0 x ATR(14)
  Time stop: 20 hari bursa (bila belum kena SL/TP)

Output (deterministik, siap di-commit):
  src/data/backtest_idx.json

Jalankan:
  python tools/backtest_idx.py

Catatan: script ini HANYA membaca data publik Yahoo Finance.
Tidak menyentuh ReyCOIN / ReyFX / konfigurasi live apa pun.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

# ---------------------------------------------------------------- konfigurasi

OUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "src",
    "data",
    "backtest_idx.json",
)

UNIVERSE = [
    # Blue chip / LQ45 likuid
    "BBCA", "BBRI", "BMRI", "BBNI", "TLKM", "ASII", "UNTR", "ANTM",
    "ADRO", "PTBA", "ICBP", "KLBF", "INDF", "GOTO", "MEDC", "INCO",
    "MDKA", "AMMN", "TPIA", "BRPT", "CPIN", "SMGR", "INTP", "PGAS",
    "JSMR", "EXCL", "ISAT", "TOWR", "MIKA", "SIDO", "ACES", "MAPI",
]

RANGE = "5y"           # ~1260 bar D1, cukup untuk 2 siklus pasar
INTERVAL = "1d"

FEE_BUY = 0.0015       # 0.15%
FEE_SELL = 0.0015      # 0.15%
TAX_SELL = 0.0010      # 0.10%
FEE_ROUND_TRIP = FEE_BUY + FEE_SELL + TAX_SELL   # 0.40%

RSI_PERIOD = 5
RSI_BUY_MAX = 25.0
RSI_SELL_MIN = 75.0
EMA_TREND = 50
ATR_PERIOD = 14
SL_MULT_ATR = 2.0
TP_MULT_ATR = 4.0
TIME_STOP_BARS = 20

YAHOO = (
    "https://query1.finance.yahoo.com/v8/finance/chart/{sym}"
    "?range={rng}&interval={itv}"
)


# ------------------------------------------------------------------ indikator

def ema(values: list[float], period: int) -> list[float | None]:
    """EMA klasik; None sampai periode terpenuhi."""
    out: list[float | None] = [None] * len(values)
    if len(values) < period:
        return out
    k = 2.0 / (period + 1.0)
    seed = sum(values[:period]) / period
    out[period - 1] = seed
    prev = seed
    for i in range(period, len(values)):
        prev = values[i] * k + prev * (1.0 - k)
        out[i] = prev
    return out


def wilder_rsi(values: list[float], period: int) -> list[float | None]:
    """RSI Wilder; None sampai periode terpenuhi."""
    out: list[float | None] = [None] * len(values)
    if len(values) <= period:
        return out

    gains = 0.0
    losses = 0.0
    for i in range(1, period + 1):
        diff = values[i] - values[i - 1]
        if diff >= 0:
            gains += diff
        else:
            losses -= diff

    avg_gain = gains / period
    avg_loss = losses / period

    def to_rsi(g: float, l: float) -> float:
        if l == 0.0:
            return 100.0
        rs = g / l
        return 100.0 - (100.0 / (1.0 + rs))

    out[period] = to_rsi(avg_gain, avg_loss)

    for i in range(period + 1, len(values)):
        diff = values[i] - values[i - 1]
        gain = diff if diff > 0 else 0.0
        loss = -diff if diff < 0 else 0.0
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
        out[i] = to_rsi(avg_gain, avg_loss)

    return out


def atr_series(highs, lows, closes, period: int) -> list[float | None]:
    """ATR Wilder dari true range."""
    n = len(closes)
    out: list[float | None] = [None] * n
    if n < period + 1:
        return out

    trs: list[float] = []
    for i in range(1, n):
        tr = max(
            highs[i] - lows[i],
            abs(highs[i] - closes[i - 1]),
            abs(lows[i] - closes[i - 1]),
        )
        trs.append(tr)

    first = sum(trs[:period]) / period
    out[period] = first
    prev = first
    for i in range(period, len(trs)):
        prev = (prev * (period - 1) + trs[i]) / period
        out[i + 1] = prev

    return out


# --------------------------------------------------------------------- data

def fetch(symbol: str) -> dict | None:
    url = YAHOO.format(sym=f"{symbol}.JK", rng=RANGE, itv=INTERVAL)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.load(resp)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"  [!] {symbol}: gagal fetch ({exc})", file=sys.stderr)
        return None
    except json.JSONDecodeError as exc:
        print(f"  [!] {symbol}: JSON rusak ({exc})", file=sys.stderr)
        return None

    result = (payload.get("chart") or {}).get("result") or []
    if not result:
        print(f"  [!] {symbol}: tidak ada data", file=sys.stderr)
        return None

    node = result[0]
    stamps = node.get("timestamp") or []
    quote = (node.get("indicators") or {}).get("quote") or [{}]
    q = quote[0]

    opens = q.get("open") or []
    highs = q.get("high") or []
    lows = q.get("low") or []
    closes = q.get("close") or []
    volumes = q.get("volume") or []

    rows: list[dict] = []
    for i, ts in enumerate(stamps):
        try:
            o, h, l, c = opens[i], highs[i], lows[i], closes[i]
        except IndexError:
            break
        if None in (o, h, l, c):
            continue
        v = volumes[i] if i < len(volumes) and volumes[i] is not None else 0
        rows.append({
            "t": int(ts),
            "o": float(o),
            "h": float(h),
            "l": float(l),
            "c": float(c),
            "v": float(v),
        })

    if len(rows) < EMA_TREND + ATR_PERIOD + 10:
        print(f"  [!] {symbol}: bar kurang ({len(rows)})", file=sys.stderr)
        return None

    return {
        "symbol": symbol,
        "currency": (node.get("meta") or {}).get("currency"),
        "rows": rows,
    }


# ----------------------------------------------------------------- backtest

def run_symbol(data: dict) -> dict:
    """Backtest satu emiten. Mengembalikan metrik + daftar trade."""
    rows = data["rows"]
    closes = [r["c"] for r in rows]
    highs = [r["h"] for r in rows]
    lows = [r["l"] for r in rows]
    opens = [r["o"] for r in rows]

    rsi = wilder_rsi(closes, RSI_PERIOD)
    ema50 = ema(closes, EMA_TREND)
    atr = atr_series(highs, lows, closes, ATR_PERIOD)

    trades: list[dict] = []
    position: dict | None = None
    equity = 1.0
    peak = 1.0
    max_dd = 0.0

    start_idx = max(EMA_TREND, ATR_PERIOD + 1, RSI_PERIOD) + 1

    for i in range(start_idx, len(rows)):
        row = rows[i]
        r = rsi[i]
        e = ema50[i]
        a = atr[i]

        # --------- kelola posisi terbuka ---------
        if position is not None:
            hit_sl = row["l"] <= position["sl"]
            hit_tp = row["h"] >= position["tp"]
            bars_held = i - position["entry_i"]

            exit_price = None
            reason = None

            if hit_sl and hit_tp:
                # Konservatif: bila keduanya tersentuh di bar yang sama, anggap SL.
                exit_price, reason = position["sl"], "SL"
            elif hit_sl:
                exit_price, reason = position["sl"], "SL"
            elif hit_tp:
                exit_price, reason = position["tp"], "TP"
            elif bars_held >= TIME_STOP_BARS:
                exit_price, reason = row["c"], "TIME"

            if exit_price is not None:
                gross = (exit_price - position["entry"]) / position["entry"]
                net = gross - FEE_ROUND_TRIP
                equity *= (1.0 + net)
                peak = max(peak, equity)
                dd = (equity - peak) / peak
                max_dd = min(max_dd, dd)

                trades.append({
                    "entryDate": datetime.fromtimestamp(
                        position["entry_t"], tz=timezone.utc
                    ).strftime("%Y-%m-%d"),
                    "exitDate": datetime.fromtimestamp(
                        row["t"], tz=timezone.utc
                    ).strftime("%Y-%m-%d"),
                    "entry": round(position["entry"], 2),
                    "exit": round(exit_price, 2),
                    "bars": bars_held,
                    "reason": reason,
                    "netPct": round(net * 100.0, 2),
                })
                position = None

        # --------- cari entry baru ---------
        if position is None and r is not None and e is not None and a is not None:
            bullish = row["c"] > e
            bearish = row["c"] < e
            green = row["c"] > row["o"]
            red = row["c"] < row["o"]

            if r <= RSI_BUY_MAX and bullish and green:
                entry = row["c"]
                sl = entry - SL_MULT_ATR * a
                tp = entry + TP_MULT_ATR * a
                if sl < entry < tp:
                    position = {
                        "entry": entry,
                        "sl": sl,
                        "tp": tp,
                        "entry_i": i,
                        "entry_t": row["t"],
                        "side": "BUY",
                    }

    if not trades:
        return {
            "symbol": data["symbol"],
            "bars": len(rows),
            "firstDate": datetime.fromtimestamp(
                rows[0]["t"], tz=timezone.utc
            ).strftime("%Y-%m-%d"),
            "lastDate": datetime.fromtimestamp(
                rows[-1]["t"], tz=timezone.utc
            ).strftime("%Y-%m-%d"),
            "lastClose": round(closes[-1], 2),
            "trades": 0,
            "winRate": 0.0,
            "profitFactor": 0.0,
            "netPct": 0.0,
            "maxDrawdownPct": 0.0,
            "avgBars": 0.0,
            "exitBreakdown": {},
            "sample": [],
        }

    wins = [t for t in trades if t["netPct"] > 0]
    losses = [t for t in trades if t["netPct"] <= 0]
    gross_win = sum(t["netPct"] for t in wins)
    gross_loss = abs(sum(t["netPct"] for t in losses))

    breakdown: dict[str, int] = {}
    for t in trades:
        breakdown[t["reason"]] = breakdown.get(t["reason"], 0) + 1

    return {
        "symbol": data["symbol"],
        "bars": len(rows),
        "firstDate": datetime.fromtimestamp(
            rows[0]["t"], tz=timezone.utc
        ).strftime("%Y-%m-%d"),
        "lastDate": datetime.fromtimestamp(
            rows[-1]["t"], tz=timezone.utc
        ).strftime("%Y-%m-%d"),
        "lastClose": round(closes[-1], 2),
        "trades": len(trades),
        "winRate": round(len(wins) / len(trades) * 100.0, 2),
        "profitFactor": round(gross_win / gross_loss, 3) if gross_loss > 0 else 0.0,
        "netPct": round((equity - 1.0) * 100.0, 2),
        "maxDrawdownPct": round(abs(max_dd) * 100.0, 2),
        "avgBars": round(sum(t["bars"] for t in trades) / len(trades), 1),
        "exitBreakdown": breakdown,
        # 5 trade terbaru untuk ditampilkan di UI
        "sample": trades[-5:],
    }


# --------------------------------------------------------------------- main

def main() -> int:
    print(f"Backtest IDX | fee round-trip {FEE_ROUND_TRIP * 100:.2f}%")
    print(f"Universe: {len(UNIVERSE)} emiten | range {RANGE} | interval {INTERVAL}\n")

    results: list[dict] = []
    failed: list[str] = []

    for idx, symbol in enumerate(UNIVERSE, 1):
        print(f"[{idx:>2}/{len(UNIVERSE)}] {symbol} ...", end=" ", flush=True)
        data = fetch(symbol)
        if data is None:
            failed.append(symbol)
            print("SKIP")
            time.sleep(0.6)
            continue
        stats = run_symbol(data)
        results.append(stats)
        print(
            f"{stats['trades']:>3} trade | WR {stats['winRate']:>5.1f}% "
            f"| PF {stats['profitFactor']:>5.2f} | net {stats['netPct']:>7.2f}%"
        )
        time.sleep(0.6)   # sopan terhadap Yahoo, hindari 429

    traded = [r for r in results if r["trades"] > 0]

    if traded:
        total_trades = sum(r["trades"] for r in traded)
        agg_win = sum(r["winRate"] * r["trades"] / 100.0 for r in traded)
        pf_weighted = (
            sum(r["profitFactor"] * r["trades"] for r in traded) / total_trades
            if total_trades
            else 0.0
        )
        avg_net = sum(r["netPct"] for r in traded) / len(traded)
        worst_dd = max(r["maxDrawdownPct"] for r in traded)
        profitable = sum(1 for r in traded if r["netPct"] > 0)
    else:
        total_trades = 0
        agg_win = 0.0
        pf_weighted = 0.0
        avg_net = 0.0
        worst_dd = 0.0
        profitable = 0

    payload = {
        "generatedAt": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "config": {
            "strategy": "RSI5_TREND_D1",
            "timeframe": INTERVAL,
            "range": RANGE,
            "feeRoundTripPct": round(FEE_ROUND_TRIP * 100.0, 2),
            "feeBuyPct": round(FEE_BUY * 100.0, 2),
            "feeSellPct": round(FEE_SELL * 100.0, 2),
            "taxSellPct": round(TAX_SELL * 100.0, 2),
            "rsiPeriod": RSI_PERIOD,
            "rsiBuyMax": RSI_BUY_MAX,
            "rsiSellMin": RSI_SELL_MIN,
            "emaTrend": EMA_TREND,
            "atrPeriod": ATR_PERIOD,
            "slMultAtr": SL_MULT_ATR,
            "tpMultAtr": TP_MULT_ATR,
            "timeStopBars": TIME_STOP_BARS,
        },
        "summary": {
            "universe": len(UNIVERSE),
            "tested": len(results),
            "traded": len(traded),
            "profitable": profitable,
            "failed": failed,
            "totalTrades": total_trades,
            "winRate": round(agg_win / total_trades * 100.0, 2) if total_trades else 0.0,
            "profitFactor": round(pf_weighted, 3),
            "avgNetPct": round(avg_net, 2),
            "worstMaxDdPct": round(worst_dd, 2),
            "verdict": (
                "LAYAK" if pf_weighted >= 1.3 and avg_net > 0 else "TIDAK LAYAK"
            ),
        },
        "emiten": sorted(results, key=lambda r: r["netPct"], reverse=True),
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)

    s = payload["summary"]
    print("\n" + "=" * 62)
    print(f"Emiten teruji     : {s['tested']}/{s['universe']}")
    print(f"Ada trade         : {s['traded']} (profitable: {s['profitable']})")
    print(f"Total trade       : {s['totalTrades']}")
    print(f"Win rate agregat  : {s['winRate']:.2f}%")
    print(f"Profit factor     : {s['profitFactor']:.3f}")
    print(f"Rata-rata net     : {s['avgNetPct']:.2f}%")
    print(f"Max DD terburuk   : {s['worstMaxDdPct']:.2f}%")
    print(f"VERDICT           : {s['verdict']}")
    print("=" * 62)
    print(f"Tersimpan: {os.path.normpath(OUT_PATH)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
