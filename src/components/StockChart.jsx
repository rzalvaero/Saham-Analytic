import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { BarChart3, TrendingUp } from 'lucide-react';

const StockChart = ({ data = [], symbol = '', smaData = [] }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 380,
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
      },
    };

    chartRef.current = createChart(chartContainerRef.current, chartOptions);

    const candlestickSeries = chartRef.current.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const smaSeries = chartRef.current.addLineSeries({
      color: '#06b6d4',
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });

    if (data && data.length > 0) {
      candlestickSeries.setData(data);
    }

    if (smaData && smaData.length > 0) {
      smaSeries.setData(smaData);
    }

    if (data && data.length > 0) {
      chartRef.current.timeScale().fitContent();
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      if (newRect.width > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width: newRect.width });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [data, smaData]);

  return (
    <div className="rt-card shadow-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3 border-b border-gray-850 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Grafik Candlestick {symbol}
              <span className="text-[10px] bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded-full font-mono font-bold">
                REALTIME
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              Price Action Historis &amp; Indikator Moving Average (MA 14)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-950 border border-gray-800 text-gray-300 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> MA 14
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-950 border border-gray-800 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Bullish Candle
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-950 border border-gray-800 text-rose-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Bearish Candle
          </span>
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full min-h-[380px]" />
    </div>
  );
};

export default StockChart;
