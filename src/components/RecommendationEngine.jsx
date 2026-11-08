import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Zap, ShieldCheck } from 'lucide-react';

const RecommendationEngine = ({ stocks = [] }) => {
  return (
    <div className="rt-card flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-850">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Sinyal Analisis Kuantitatif
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Model algoritma momentum teknikal (RSI 14 &amp; Moving Average)
          </p>
        </div>
        <span className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded font-mono font-semibold">
          ALGO V2
        </span>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {stocks.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">
            Belum ada emiten terpilih di watchlist
          </div>
        ) : (
          stocks.map((stock) => {
            const analysis = stock.analysis || {};
            const recommendation = analysis.recommendation || 'HOLD';
            const reason = analysis.reason || 'Sinyal konsolidasi wajar';

            let BadgeIcon = Minus;
            let badgeStyle = 'bg-gray-800 text-gray-300 border-gray-700';

            if (recommendation === 'BUY') {
              BadgeIcon = ArrowUpRight;
              badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
            } else if (recommendation === 'SELL') {
              BadgeIcon = ArrowDownRight;
              badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
            }

            const isUp = (stock.priceChange || 0) >= 0;

            return (
              <div
                key={stock.symbol}
                className="p-3 rounded-xl bg-gray-950/60 border border-gray-850 hover:border-gray-750 transition flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm font-sans flex items-center gap-1.5">
                    {stock.symbol}
                    <span className="text-[10px] text-gray-500 font-mono font-normal">IDX</span>
                  </div>
                  <div className="text-[11px] text-gray-400 truncate max-w-[120px] sm:max-w-[150px]">
                    {stock.name || stock.symbol}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-xs sm:text-sm text-gray-200">
                    Rp {(stock.currentPrice || 0).toLocaleString('id-ID')}
                  </div>
                  <div
                    className={`font-mono text-[11px] font-semibold ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? '+' : ''}
                    {(stock.priceChange || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="text-right min-w-[100px] shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeStyle}`}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    {recommendation}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[110px] ml-auto leading-tight">
                    {reason}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-850 flex items-center justify-between text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Kalkulasi Otomatis
        </span>
        <span className="font-mono text-gray-400">Timeframe Daily</span>
      </div>
    </div>
  );
};

export default RecommendationEngine;
