import React, { useMemo } from 'react';
import { Layers, ArrowUpRight, ArrowDownRight, Minus, Target, ShieldAlert } from 'lucide-react';
import { calculateRSI, calculateSMA, calculateATR } from '../services/marketData';

/* ---------------------------------------------------------------- helpers */

const lastValue = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const item = arr[arr.length - 1];
  return typeof item === 'number' ? item : item?.value ?? null;
};

/**
 * Agregasi bar harian menjadi bar mingguan.
 * Minggu IDX = Senin–Jumat. Dikelompokkan per ISO-week sederhana (mulai Senin).
 */
const toWeekly = (bars) => {
  if (!bars || bars.length === 0) return [];

  const out = [];
  let bucket = null;

  for (const b of bars) {
    const d = typeof b.time === 'string' ? new Date(b.time) : new Date(b.time * 1000);
    // Geser ke Senin sebagai awal minggu
    const dow = (d.getUTCDay() + 6) % 7; // Senin=0
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - dow);
    const key = monday.toISOString().slice(0, 10);

    if (!bucket || bucket.key !== key) {
      if (bucket) out.push(bucket.bar);
      bucket = {
        key,
        bar: {
          time: b.time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          volume: b.volume || 0,
        },
      };
    } else {
      bucket.bar.high = Math.max(bucket.bar.high, b.high);
      bucket.bar.low = Math.min(bucket.bar.low, b.low);
      bucket.bar.close = b.close;
      bucket.bar.volume += b.volume || 0;
    }
  }
  if (bucket) out.push(bucket.bar);

  return out;
};

/* -------------------------------------------------------------- sub-views */

const TrendPill = ({ bias }) => {
  if (bias === 'BULLISH') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
        <ArrowUpRight className="w-3 h-3" /> Naik
      </span>
    );
  }
  if (bias === 'BEARISH') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border text-rose-400 bg-rose-500/10 border-rose-500/30">
        <ArrowDownRight className="w-3 h-3" /> Turun
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border text-gray-400 bg-gray-500/10 border-gray-600/40">
      <Minus className="w-3 h-3" /> Sideways
    </span>
  );
};

const TFRow = ({ label, bias, rsi, price, ma20, ma50, atr, atrPct }) => (
  <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
        {label}
      </span>
      <TrendPill bias={bias} />
    </div>

    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono">
      <div className="flex justify-between">
        <span className="text-gray-500">RSI</span>
        <span
          className={
            rsi == null
              ? 'text-gray-500'
              : rsi >= 70
                ? 'text-rose-400 font-semibold'
                : rsi <= 30
                  ? 'text-emerald-400 font-semibold'
                  : 'text-gray-300'
          }
        >
          {rsi == null ? '—' : rsi.toFixed(1)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">ATR%</span>
        <span className="text-gray-300">
          {atrPct == null ? '—' : `${atrPct.toFixed(2)}%`}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">MA20</span>
        <span
          className={
            price != null && ma20 != null && price > ma20
              ? 'text-emerald-400'
              : 'text-gray-300'
          }
        >
          {ma20 == null ? '—' : ma20.toLocaleString('id-ID')}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">MA50</span>
        <span
          className={
            price != null && ma50 != null && price > ma50
              ? 'text-emerald-400'
              : 'text-gray-300'
          }
        >
          {ma50 == null ? '—' : ma50.toLocaleString('id-ID')}
        </span>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------- main */

const MultiTimeframe = ({ historicalData, symbol }) => {
  const analysis = useMemo(() => {
    if (!historicalData || historicalData.length < 60) return null;

    const daily = historicalData;
    const weekly = toWeekly(daily);

    const build = (bars, label) => {
      if (!bars || bars.length < 30) return null;

      const price = bars[bars.length - 1].close;
      const rsi = lastValue(calculateRSI(bars, 14));
      const ma20 = lastValue(calculateSMA(bars, 20));
      const ma50 = lastValue(calculateSMA(bars, Math.min(50, bars.length - 2)));
      const atrArr = calculateATR(bars, 14);
      const atr = atrArr.length ? atrArr[atrArr.length - 1] : null;
      const atrPct = atr && price ? (atr / price) * 100 : null;

      let bias = 'SIDEWAYS';
      if (ma20 != null && ma50 != null && price != null) {
        if (price > ma20 && ma20 > ma50) bias = 'BULLISH';
        else if (price < ma20 && ma20 < ma50) bias = 'BEARISH';
      }

      const score = [
        price != null && ma20 != null ? (price > ma20 ? 1 : -1) : 0,
        price != null && ma50 != null ? (price > ma50 ? 1 : -1) : 0,
        ma20 != null && ma50 != null ? (ma20 > ma50 ? 1 : -1) : 0,
        rsi != null ? (rsi > 50 ? 1 : -1) : 0,
      ].reduce((a, b) => a + b, 0);

      return { label, bias, rsi, price, ma20, ma50, atr, atrPct, score, bars: bars.length };
    };

    const d = build(daily, 'Harian (D1)');
    const w = build(weekly, 'Mingguan (W1)');
    if (!d) return null;

    // Konfluensi: D1 + W1 searah
    let confluence = 'CAMPURAN';
    if (w) {
      if (d.bias === 'BULLISH' && w.bias === 'BULLISH') confluence = 'SEARAH NAIK';
      else if (d.bias === 'BEARISH' && w.bias === 'BEARISH') confluence = 'SEARAH TURUN';
      else if (d.bias !== w.bias) confluence = 'BERLAWANAN';
    }

    // Level berbasis ATR harian
    const atrUse = d.atr;
    const levels =
      atrUse && d.price
        ? {
            entry: d.price,
            sl: d.price - 2 * atrUse,
            tp1: d.price + 2 * atrUse,
            tp2: d.price + 4 * atrUse,
            riskPct: (2 * atrUse) / d.price * 100,
          }
        : null;

    // Kelayakan: butuh volatilitas cukup untuk menutup fee 0.40%
    const feasible = d.atrPct != null ? d.atrPct >= 1.0 : false;

    return { d, w, confluence, levels, feasible };
  }, [historicalData]);

  if (!analysis) {
    return (
      <div className="rt-card">
        <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-gray-850">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Analisis Multi-Timeframe</h3>
        </div>
        <p className="text-xs text-gray-500 py-6 text-center">
          Data historis belum cukup untuk analisis D1 + W1.
        </p>
      </div>
    );
  }

  const { d, w, confluence, levels, feasible } = analysis;
  const cTone =
    confluence === 'SEARAH NAIK'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : confluence === 'SEARAH TURUN'
        ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
        : 'text-amber-400 border-amber-500/30 bg-amber-500/10';

  return (
    <div className="rt-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 mb-4 border-b border-gray-850">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Analisis Multi-Timeframe</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Konfirmasi arah D1 dan W1 untuk {symbol || 'emiten ini'}
            </p>
          </div>
        </div>
        <span
          className={`self-start sm:self-auto text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${cTone}`}
        >
          {confluence}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TFRow
          label={d.label}
          bias={d.bias}
          rsi={d.rsi}
          price={d.price}
          ma20={d.ma20}
          ma50={d.ma50}
          atr={d.atr}
          atrPct={d.atrPct}
        />
        {w ? (
          <TFRow
            label={w.label}
            bias={w.bias}
            rsi={w.rsi}
            price={w.price}
            ma20={w.ma20}
            ma50={w.ma50}
            atr={w.atr}
            atrPct={w.atrPct}
          />
        ) : (
          <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3 flex items-center justify-center text-[11px] text-gray-500">
            Data mingguan belum cukup
          </div>
        )}
      </div>

      {levels && (
        <div className="mt-3 rounded-xl border border-gray-850 bg-gray-950/60 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Level Referensi (berbasis ATR harian)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="rounded-lg bg-gray-900/70 border border-gray-850 px-2 py-1.5">
              <div className="text-[9px] text-gray-500 uppercase">Entry</div>
              <div className="text-white font-bold">
                {levels.entry.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="rounded-lg bg-rose-500/5 border border-rose-500/25 px-2 py-1.5">
              <div className="text-[9px] text-rose-400/80 uppercase">Stop Loss</div>
              <div className="text-rose-400 font-bold">
                {levels.sl.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/25 px-2 py-1.5">
              <div className="text-[9px] text-emerald-400/80 uppercase">TP1 (1R)</div>
              <div className="text-emerald-400 font-bold">
                {levels.tp1.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/25 px-2 py-1.5">
              <div className="text-[9px] text-emerald-400/80 uppercase">TP2 (2R)</div>
              <div className="text-emerald-400 font-bold">
                {levels.tp2.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-gray-500 leading-snug">
            Risiko per transaksi {levels.riskPct.toFixed(2)}% dari harga. Angka ini
            referensi teknikal, bukan ajakan beli.
          </p>
        </div>
      )}

      {!feasible && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[10px] text-amber-500/90 leading-snug">
          <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            Volatilitas harian di bawah 1%. Setelah fee 0,40% round-trip, ruang untung
            terlalu tipis untuk strategi ini.
          </span>
        </p>
      )}
    </div>
  );
};

export default MultiTimeframe;
