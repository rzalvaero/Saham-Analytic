import React from 'react';
import { Activity, TrendingUp, TrendingDown, BarChart2, Database } from 'lucide-react';

const MarketOverview = ({ stocks = [] }) => {
  const totalGain = stocks.reduce((acc, stock) => acc + (stock.priceChange || 0), 0);
  const isMarketUp = totalGain >= 0;

  const gainers = stocks.filter((s) => (s.priceChange || 0) > 0).length;
  const losers = stocks.filter((s) => (s.priceChange || 0) < 0).length;
  const unchanged = stocks.filter((s) => (s.priceChange || 0) === 0).length;

  const totalVolume = stocks.reduce((acc, stock) => acc + (stock.volume || 0), 0);
  const formatVol = (v) => {
    if (v >= 1e12) return (v / 1e12).toFixed(2) + ' T';
    if (v >= 1e9) return (v / 1e9).toFixed(2) + ' B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + ' M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + ' K';
    return v > 0 ? v.toLocaleString('id-ID') : '0';
  };

  // Cari data IHSG bila ada di watchlist (^JKSE)
  const ihsg = stocks.find((s) => s.symbol === '^JKSE');
  const ihsgChange = ihsg ? (ihsg.priceChange || 0) : null;
  const hasIhsg = ihsg && ihsg.currentPrice;

  return (
    <div className="rt-grid-3">
      {/* 1. IHSG Composite Card — real dari watchlist bila ada, jujur bila tidak */}
      <div className="rt-card flex flex-col justify-between border-cyan-500/20 shadow-lg">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> IHSG Composite (^JKSE)
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            hasIhsg ? (isMarketUp ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30')
            : 'bg-gray-800 text-gray-400 border border-gray-700'
          }`}>
            {hasIhsg ? (isMarketUp ? 'BULLISH' : 'BEARISH') : 'N/A'}
          </span>
        </div>

        <div className="my-2.5">
          <div className="rt-metric-value font-extrabold font-mono text-white tracking-tight">
            {hasIhsg ? ihsg.currentPrice.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '—'}
          </div>
          {hasIhsg && ihsgChange !== null ? (
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className={`font-mono font-bold flex items-center gap-1 ${
                isMarketUp ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isMarketUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isMarketUp ? '+' : ''}{ihsgChange.toLocaleString('id-ID', { minimumFractionDigits: 2 })} ({(ihsgChange / (ihsg.currentPrice - ihsgChange) * 100).toFixed(2)}%)
              </span>
              <span className="text-[11px] text-gray-500">Bursa Efek Indonesia</span>
            </div>
          ) : (
            <p className="text-[11px] text-gray-500 mt-1">Tambah ^JKSE ke watchlist untuk data IHSG real.</p>
          )}
        </div>

        <div className="pt-2 border-t border-gray-800/60 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Market Breadth (watchlist):</span>
          <span className="font-mono text-gray-300">
            <span className="text-emerald-400 font-bold">{gainers} Naik</span> •{' '}
            <span className="text-rose-400 font-bold">{losers} Turun</span> •{' '}
            <span>{unchanged} Tetap</span>
          </span>
        </div>
      </div>

      {/* 2. Volume Perdagangan Card — real dari watchlist */}
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
            Total volume {stocks.length} emiten pada watchlist
          </p>
        </div>
      </div>

      {/* 3. Data Watchlist Card — pengganti placeholder total transaksi */}
      <div className="rt-card flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Database className="w-3.5 h-3.5 text-amber-400" /> Sumber Data
          </span>
          <span className="bg-amber-500/10 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">
            Yahoo Finance
          </span>
        </div>

        <div className="my-2.5">
          <div className="rt-metric-value font-extrabold font-mono text-amber-300 tracking-tight">
            {stocks.length} Emiten
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Data real harga &amp; volume (auto-refresh tiap menit)
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;

