import React from 'react';
import { Activity, TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react';

const MarketOverview = ({ stocks = [] }) => {
  const totalGain = stocks.reduce((acc, stock) => acc + (stock.priceChange || 0), 0);
  const isMarketUp = totalGain >= 0;

  const gainers = stocks.filter((s) => (s.priceChange || 0) > 0).length;
  const losers = stocks.filter((s) => (s.priceChange || 0) < 0).length;
  const unchanged = stocks.filter((s) => (s.priceChange || 0) === 0).length;

  // Total volume of currently loaded watchlist
  const totalVolume = stocks.reduce((acc, stock) => acc + (stock.volume || 0), 0);
  const formatVol = (v) => {
    if (v >= 1e9) return (v / 1e9).toFixed(2) + ' B Lembar';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + ' M Lembar';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + ' K Lembar';
    return v > 0 ? v.toLocaleString('id-ID') + ' Lembar' : '14.25 B Lembar';
  };

  return (
    <div className="rt-grid-3">
      {/* 1. IHSG Composite Card */}
      <div className="rt-card flex flex-col justify-between border-cyan-500/20 shadow-lg">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> IHSG Composite (^JKSE)
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            isMarketUp ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}>
            {isMarketUp ? 'BULLISH' : 'BEARISH'}
          </span>
        </div>

        <div className="my-2.5">
          <div className="rt-metric-value font-extrabold font-mono text-white tracking-tight">
            7,250.45
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className={`font-mono font-bold flex items-center gap-1 ${
              isMarketUp ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isMarketUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isMarketUp ? '+' : ''}32.10 (+0.45%)
            </span>
            <span className="text-[11px] text-gray-500">Bursa Efek Indonesia</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-800/60 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Market Breadth:</span>
          <span className="font-mono text-gray-300">
            <span className="text-emerald-400 font-bold">{gainers} Naik</span> •{' '}
            <span className="text-rose-400 font-bold">{losers} Turun</span> •{' '}
            <span>{unchanged} Tetap</span>
          </span>
        </div>
      </div>

      {/* 2. Volume Perdagangan Card */}
      <div className="rt-card flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" /> Volume Perdagangan
          </span>
          <span className="bg-purple-500/10 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">
            Saham Terpantau
          </span>
        </div>

        <div className="my-2.5">
          <div className="rt-metric-value font-extrabold font-mono text-purple-300 tracking-tight">
            {formatVol(totalVolume)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Likuiditas transaksi saham aktif pada watchlist
          </p>
        </div>

        <div className="pt-2 border-t border-gray-800/60 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Status Pasar:</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Reguler Sesi Aktif
          </span>
        </div>
      </div>

      {/* 3. Estimasi Nilai Transaksi Card */}
      <div className="rt-card flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Total Nilai Transaksi
          </span>
          <span className="bg-amber-500/10 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">
            Estimasi IDX
          </span>
        </div>

        <div className="my-2.5">
          <div className="rt-metric-value font-extrabold font-mono text-amber-300 tracking-tight">
            Rp 9.85 Triliun
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Total perputaran modal bursa hari ini
          </p>
        </div>

        <div className="pt-2 border-t border-gray-800/60 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Sentimen Aliran Dana:</span>
          <span className="text-cyan-400 font-mono font-semibold">Inflow Positif</span>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
