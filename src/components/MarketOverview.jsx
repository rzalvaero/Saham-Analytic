import React from 'react';
import { Activity, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const MarketOverview = ({ stocks }) => {
  const totalGain = stocks.reduce((acc, stock) => acc + stock.priceChange, 0);
  const isMarketUp = totalGain >= 0;
  
  return (
    <div className="grid-top">
      <div className="glass-card animate-fade-in delay-1">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h4 className="text-muted" style={{ fontWeight: '500' }}>IHSG Overview</h4>
          <Activity size={20} className={isMarketUp ? 'text-positive' : 'text-negative'} />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          7,250.45
        </div>
        <div className={isMarketUp ? 'text-positive' : 'text-negative'} style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
          {isMarketUp ? <TrendingUp size={16} style={{ marginRight: '4px' }} /> : <TrendingDown size={16} style={{ marginRight: '4px' }} />}
          <span>{isMarketUp ? '+' : ''}32.10 (0.45%)</span>
        </div>
      </div>

      <div className="glass-card animate-fade-in delay-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h4 className="text-muted" style={{ fontWeight: '500' }}>Total Volume</h4>
          <Activity size={20} className="text-accent-primary" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          14.2 B
        </div>
        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
          Shares Traded Today
        </div>
      </div>

      <div className="glass-card animate-fade-in delay-3">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h4 className="text-muted" style={{ fontWeight: '500' }}>Total Value</h4>
          <DollarSign size={20} className="text-warning" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Rp 9.8 T
        </div>
        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
          Transaction Value
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
