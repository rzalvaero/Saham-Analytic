import React, { useState, useEffect } from 'react';
import { RefreshCw, CircleDollarSign, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchRealtimeData } from '../services/marketData';
import StockChart from './StockChart';

const formatPrice = (price, symbol) => {
  if (!price) return '0.00';
  if (symbol.includes('JPY') || symbol === 'XAUUSD=X' || symbol === 'GC=F') {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
};

const Forex = () => {
  const [loading, setLoading] = useState(true);
  const [forexData, setForexData] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);

  useEffect(() => {
    const fetchForexData = async () => {
      setLoading(true);
      try {
        const forexSymbols = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'GC=F'];
        const fPromises = forexSymbols.map((sym) => fetchRealtimeData(sym));
        const fResults = await Promise.all(fPromises);
        const validData = fResults.filter((d) => d !== null);

        const goldIndex = validData.findIndex((d) => d.symbol === 'GC=F');
        if (goldIndex !== -1) {
          validData[goldIndex].name = 'Gold (XAU) / USD';
        }

        setForexData(validData);
        if (validData.length > 0 && !selectedPair) {
          setSelectedPair(validData[0]);
        } else if (selectedPair) {
          const updatedPair = validData.find((d) => d.symbol === selectedPair.symbol);
          if (updatedPair) setSelectedPair(updatedPair);
        }
      } catch (err) {
        console.error('Failed to fetch forex data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchForexData();
    const interval = setInterval(fetchForexData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 text-gray-100 font-sans">
      {/* 1. Header Banner */}
      <div className="rt-card bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#0c1322] border-gray-850 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rt-badge rt-badge-live">
                <span className="rt-pulse-dot" />
                GLOBAL CURRENCY &amp; COMMODITIES
              </span>
              <span className="text-xs text-gray-400 font-mono">Spot Market Rate</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <CircleDollarSign className="w-7 h-7 text-cyan-400" /> Forex &amp; Commodities
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Pantau pergerakan nilai tukar mata uang global utama dan komoditas Emas (Gold XAU/USD)
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono bg-cyan-950/60 border border-cyan-800/40 px-3.5 py-2 rounded-xl shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sinkronisasi Pasar...</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Pair Cards Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {forexData.map((pair) => {
          const isSelected = selectedPair?.symbol === pair.symbol;
          const isUp = (pair.priceChange || 0) >= 0;
          const rec = pair.analysis?.recommendation || 'HOLD';

          return (
            <div
              key={pair.symbol}
              onClick={() => setSelectedPair(pair)}
              className={`p-3.5 rounded-xl transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-gray-900 border-cyan-500 shadow-lg shadow-cyan-500/15'
                  : 'bg-gray-950/70 border-gray-850 hover:border-gray-750'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="font-bold text-white text-xs sm:text-sm font-mono truncate">
                  {pair.name?.split(' / ')[0]}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                    rec === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : rec === 'SELL'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {rec}
                </span>
              </div>

              <div className="text-[10px] text-gray-500 font-mono mb-2 truncate">
                {pair.name?.includes('/') ? `/ ${pair.name.split(' / ')[1]}` : pair.symbol}
              </div>

              <div className="font-mono font-bold text-sm text-gray-200">
                {formatPrice(pair.currentPrice, pair.symbol)}
              </div>

              <div
                className={`text-[10px] font-mono font-semibold mt-0.5 flex items-center gap-0.5 ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isUp ? '+' : ''}
                {formatPrice(pair.priceChange, pair.symbol)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Interactive Chart & Algorithmic Analysis */}
      {selectedPair && (
        <div className="space-y-4">
          <StockChart data={selectedPair.historicalData} symbol={selectedPair.symbol} />

          <div className="rt-card p-4 border-gray-850 bg-gray-950/70">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">
                Analisis Teknikal &amp; Algoritma Momentum ({selectedPair.symbol})
              </h4>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              {selectedPair.analysis?.reason || 'Konsolidasi range sempit pada sesi perdagangan saat ini.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forex;
