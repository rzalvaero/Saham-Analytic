import React, { useState } from 'react';
import {
  Zap,
  Target,
  Flame,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const RecommendationEngine = ({ stocks = [] }) => {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'BUY' | 'SELL'

  const filteredStocks = stocks.filter((stock) => {
    const rec = stock.analysis?.recommendation || 'HOLD';
    if (filter === 'BUY') return rec === 'BUY';
    if (filter === 'SELL') return rec === 'SELL';
    return true;
  });

  return (
    <div className="rt-card flex flex-col justify-between">
      {/* 1. Header Terminal */}
      <div className="pb-3 mb-3 border-b border-gray-850">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Sniper Kuantitatif Saham BEI
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Model lonjakan volume akumulasi (Volume Spike) &amp; target harga terukur
            </p>
          </div>
          <span className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded font-mono font-semibold shrink-0">
            DEX-SNIPER V2
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition ${
              filter === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-gray-900/60 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            Semua ({stocks.length})
          </button>
          <button
            onClick={() => setFilter('BUY')}
            className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
              filter === 'BUY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-gray-900/60 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <Flame className="w-3 h-3 text-emerald-400" />
            Fresh Beli ({stocks.filter((s) => s.analysis?.recommendation === 'BUY').length})
          </button>
          <button
            onClick={() => setFilter('SELL')}
            className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
              filter === 'SELL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-gray-900/60 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <Target className="w-3 h-3 text-rose-400" />
            Take Profit ({stocks.filter((s) => s.analysis?.recommendation === 'SELL').length})
          </button>
        </div>
      </div>

      {/* 2. List Emiten & Trading Plan */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {filteredStocks.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 bg-gray-950/40 rounded-xl border border-gray-850">
            Tidak ada emiten dengan kategori filter ini di watchlist.
          </div>
        ) : (
          filteredStocks.map((stock) => {
            const analysis = stock.analysis || {};
            const recommendation = analysis.recommendation || 'HOLD';
            const isUp = (stock.priceChange || 0) >= 0;

            let badgeStyle = 'bg-gray-850 text-gray-300 border-gray-750';
            if (recommendation === 'BUY') {
              badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
            } else if (recommendation === 'SELL') {
              badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
            }

            const buyZone = analysis.buyZone || { label: '-' };
            const tp1 = analysis.targetPrice1 || { label: '-' };
            const tp2 = analysis.targetPrice2 || { label: '-' };
            const sl = analysis.stopLoss || { label: '-' };
            const rr = analysis.riskReward || '1 : 2.5';
            const volSpike = analysis.volumeSpike || '1.0x';
            const score = analysis.score || 50;

            return (
              <div
                key={stock.symbol}
                className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-850 hover:border-gray-750 transition space-y-2.5"
              >
                {/* Header Card: Symbol, Price, & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-white text-sm font-sans flex items-center gap-1.5">
                      {stock.symbol}
                      <span className="text-[10px] text-gray-500 font-mono font-normal">IDX</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border font-mono ${badgeStyle}`}
                      >
                        {analysis.badge || recommendation}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 truncate max-w-[200px] mt-0.5">
                      {stock.name || stock.symbol}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-gray-100">
                      Rp {(stock.currentPrice || 0).toLocaleString('id-ID')}
                    </div>
                    <div
                      className={`font-mono text-[11px] font-semibold flex items-center justify-end gap-0.5 ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isUp ? '+' : ''}
                      {(stock.priceChange || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* 4-Box Trading Plan Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-gray-900/60 p-2 rounded-lg border border-gray-850/80 text-[11px]">
                  {/* Box 1: Area Beli */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-semibold block uppercase">Area Beli</span>
                    <span className="font-mono font-bold text-cyan-300 text-xs">
                      {buyZone.label}
                    </span>
                  </div>

                  {/* Box 2: TP1 Cepat */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-semibold block uppercase">Target 1 (Panen)</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {tp1.label}
                    </span>
                  </div>

                  {/* Box 3: TP2 Runner */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-semibold block uppercase">Target 2 (Runner)</span>
                    <span className="font-mono font-bold text-purple-400 text-xs">
                      {tp2.label}
                    </span>
                  </div>

                  {/* Box 4: Cut Loss */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-semibold block uppercase">Cut Loss (SL)</span>
                    <span className="font-mono font-bold text-rose-400 text-xs">
                      {sl.label}
                    </span>
                  </div>
                </div>

                {/* Quantitative Metrics Bar */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono px-1">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-cyan-400" />
                    Vol Spike: <strong className="text-gray-200">{volSpike}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-amber-400" />
                    R:R: <strong className="text-gray-200">{rr}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    Skor: <strong className="text-emerald-400">{score}/100</strong>
                  </span>
                </div>

                {/* Execution Note / Rationale */}
                <div className="text-[11px] text-gray-300 bg-gray-900/40 p-2 rounded-lg border border-gray-850 leading-relaxed">
                  <p className="text-gray-400 leading-snug">
                    <strong className="text-cyan-400 font-semibold">Panduan Taktis: </strong>
                    {analysis.executionNotes || analysis.reason}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Footer Quality Seal */}
      <div className="mt-3 pt-2.5 border-t border-gray-850 flex items-center justify-between text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Kalkulasi Presisi Fraksi BEI
        </span>
        <span className="font-mono text-gray-400 text-[10px]">Timeframe Harian (Daily)</span>
      </div>
    </div>
  );
};

export default RecommendationEngine;
