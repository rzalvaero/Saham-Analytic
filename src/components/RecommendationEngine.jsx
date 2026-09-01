import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const RecommendationEngine = ({ stocks }) => {
  return (
    <div className="glass-card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h3>AI Recommendation Engine</h3>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Berdasarkan Analisa RSI & Moving Average</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '280px', overflowY: 'auto', paddingRight: '8px' }}>
        {stocks.map((stock, index) => {
          const { recommendation, reason } = stock.analysis;
          let BadgeIcon = Minus;
          let badgeClass = 'hold';
          
          if (recommendation === 'BUY') {
            BadgeIcon = ArrowUpRight;
            badgeClass = 'buy';
          } else if (recommendation === 'SELL') {
            BadgeIcon = ArrowDownRight;
            badgeClass = 'sell';
          }

          const priceColor = stock.priceChange >= 0 ? 'text-positive' : 'text-negative';

          return (
            <div key={stock.symbol} className="stock-item animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{stock.symbol}</h4>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>{stock.name}</p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '600' }}>Rp {stock.currentPrice.toLocaleString('id-ID')}</p>
                <p className={priceColor} style={{ fontSize: '0.75rem' }}>
                  {stock.priceChange > 0 ? '+' : ''}{stock.priceChange.toLocaleString('id-ID')}
                </p>
              </div>
              
              <div style={{ textAlign: 'right', minWidth: '140px' }}>
                <span className={`badge ${badgeClass}`} style={{ marginBottom: '0.25rem' }}>
                  <BadgeIcon size={14} style={{ marginRight: '4px' }} />
                  {recommendation}
                </span>
                <p className="text-muted" style={{ fontSize: '0.7rem', maxWidth: '120px', marginLeft: 'auto' }}>
                  {reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationEngine;
