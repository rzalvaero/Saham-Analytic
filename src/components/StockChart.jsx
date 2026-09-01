import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const StockChart = ({ data, symbol, smaData }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
      color: '#3b82f6',
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });

    if (data && data.length > 0) {
      candlestickSeries.setData(data);
    }
    
    if (smaData && smaData.length > 0) {
      smaSeries.setData(smaData);
    }

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) { return; }
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
    <div className="glass-card">
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h3>{symbol} Chart</h3>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Realtime Price Action (MA 14: <span style={{color: '#3b82f6'}}>Blue Line</span>)</p>
        </div>
      </div>
      <div ref={chartContainerRef} style={{ width: '100%' }} />
    </div>
  );
};

export default StockChart;
