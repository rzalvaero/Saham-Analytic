import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { BarChart3, Maximize2, Minimize2 } from 'lucide-react';

// Rentang tampilan: berapa bar terakhir yang langsung terlihat.
// Data tetap 5 tahun penuh supaya bisa di-zoom mundur.
const RANGES = [
  { label: '1B', bars: 22 },
  { label: '3B', bars: 66 },
  { label: '6B', bars: 126 },
  { label: '1T', bars: 252 },
  { label: '3T', bars: 756 },
  { label: '5T', bars: 0 },
];

const StockChart = ({ data = [], symbol = '', ma60 = [], ma280 = [] }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candleRef = useRef();
  const ma60Ref = useRef();
  const ma280Ref = useRef();
  const [range, setRange] = useState('1T');
  const [expanded, setExpanded] = useState(false);

  // Buat chart sekali saja; update data lewat effect terpisah supaya
  // zoom/pan pengguna tidak ter-reset setiap data baru masuk.
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: expanded ? 620 : 400,
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(148,163,184,0.4)', width: 1, style: 2, labelBackgroundColor: '#0e7490' },
        horzLine: { color: 'rgba(148,163,184,0.4)', width: 1, style: 2, labelBackgroundColor: '#0e7490' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: false,
        rightOffset: 6,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      localization: {
        locale: 'id-ID',
        priceFormatter: (p) => Number(p).toLocaleString('id-ID'),
      },
    };

    chartRef.current = createChart(chartContainerRef.current, chartOptions);

    candleRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    });

    ma60Ref.current = chartRef.current.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    ma280Ref.current = chartRef.current.addLineSeries({
      color: '#8b5cf6',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const rect = entries[0].contentRect;
      if (rect.width > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width: rect.width });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) chartRef.current.remove();
      chartRef.current = null;
    };
  }, [expanded]);

  // Update data
  useEffect(() => {
    if (!candleRef.current || !data.length) return;
    candleRef.current.setData(data);
    ma60Ref.current?.setData(ma60 || []);
    ma280Ref.current?.setData(ma280 || []);

    const n = RANGES.find((r) => r.label === range)?.bars ?? 0;
    if (n > 0 && data.length > n) {
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: data.length - n,
        to: data.length + 4,
      });
    } else {
      chartRef.current.timeScale().fitContent();
    }
  }, [data, ma60, ma280, range]);

  const last = data.length ? data[data.length - 1] : null;

  return (
    <div className="rt-card shadow-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3 border-b border-gray-850 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Grafik Harga {symbol}
            </h3>
            <p className="text-xs text-gray-400">
              Candlestick harian &amp; Moving Average 60 / 280
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> MA60
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/25 text-violet-400">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> MA280
            </span>
          </div>

          <div className="flex items-center gap-0.5 rounded-lg bg-gray-950 border border-gray-800 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r.label)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                  range === r.label
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-lg border border-gray-800 bg-gray-950 text-gray-400 hover:text-gray-200 transition"
            title={expanded ? 'Perkecil' : 'Perbesar'}
          >
            {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full" style={{ minHeight: expanded ? 620 : 400 }} />

      {last && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 mt-1 border-t border-gray-850/60 text-[10px] font-mono text-gray-500">
          <span>
            O <span className="text-gray-300">{Number(last.open).toLocaleString('id-ID')}</span>
          </span>
          <span>
            H <span className="text-emerald-400">{Number(last.high).toLocaleString('id-ID')}</span>
          </span>
          <span>
            L <span className="text-rose-400">{Number(last.low).toLocaleString('id-ID')}</span>
          </span>
          <span>
            C <span className="text-gray-100 font-bold">{Number(last.close).toLocaleString('id-ID')}</span>
          </span>
          <span className="ml-auto text-gray-600">{data.length} bar harian</span>
        </div>
      )}
    </div>
  );
};

export default StockChart;
