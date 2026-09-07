import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, CircleDollarSign } from 'lucide-react';
import { fetchRealtimeData } from '../services/marketData';
import StockChart from './StockChart';

const formatPrice = (price, symbol) => {
  if (!price) return '0.00';
  if (symbol.includes('JPY') || symbol === 'XAUUSD=X') {
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
        const forexSymbols = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'XAUUSD=X'];
        const fPromises = forexSymbols.map(sym => fetchRealtimeData(sym));
        const fResults = await Promise.all(fPromises);
        const validData = fResults.filter(d => d !== null);
        
        // Find Gold
        const goldIndex = validData.findIndex(d => d.symbol === 'XAUUSD=X');
        if (goldIndex !== -1) {
            validData[goldIndex].name = 'Gold (XAU) / USD';
        }

        setForexData(validData);
        if (validData.length > 0 && !selectedPair) {
          setSelectedPair(validData[0]);
        } else if (selectedPair) {
          const updatedPair = validData.find(d => d.symbol === selectedPair.symbol);
          if (updatedPair) setSelectedPair(updatedPair);
        }
      } catch (err) {
        console.error("Failed to fetch forex data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForexData();
    const interval = setInterval(fetchForexData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircleDollarSign size={24} className="text-accent-secondary" /> Forex & Commodities
          </h1>
          <p className="text-muted">Pantau pergerakan nilai tukar mata uang utama dunia dan harga Emas (Gold).</p>
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <RefreshCw size={18} className="animate-spin" />
            <span>Memuat Data...</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
        {/* Top Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {forexData.map(pair => (
            <div 
              key={pair.symbol} 
              onClick={() => setSelectedPair(pair)}
              className="glass-card"
              style={{ 
                padding: '1rem', 
                cursor: 'pointer', 
                border: selectedPair?.symbol === pair.symbol ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                transition: 'all 0.2s',
                background: selectedPair?.symbol === pair.symbol ? 'rgba(255,255,255,0.05)' : 'var(--bg-secondary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{pair.name.split(' / ')[0]}</h3>
                <span className={`badge ${pair.analysis.recommendation === 'BUY' ? 'buy' : pair.analysis.recommendation === 'SELL' ? 'sell' : 'hold'}`}>
                  {pair.analysis.recommendation}
                </span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '12px' }}>
                {pair.name.includes('/') ? `/ ${pair.name.split(' / ')[1]}` : pair.symbol}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {formatPrice(pair.currentPrice, pair.symbol)}
                </div>
                <div style={{ fontSize: '0.875rem', color: pair.priceChange > 0 ? 'var(--positive)' : pair.priceChange < 0 ? 'var(--negative)' : 'var(--text-muted)' }}>
                  {pair.priceChange > 0 ? '+' : ''}{formatPrice(pair.priceChange, pair.symbol)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        {selectedPair && (
          <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>{selectedPair.name} ({selectedPair.symbol})</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {formatPrice(selectedPair.currentPrice, selectedPair.symbol)}
                  </span>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.875rem',
                    background: selectedPair.priceChange > 0 ? 'rgba(16, 185, 129, 0.1)' : selectedPair.priceChange < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.1)',
                    color: selectedPair.priceChange > 0 ? 'var(--positive)' : selectedPair.priceChange < 0 ? 'var(--negative)' : 'var(--text-muted)' 
                  }}>
                    {selectedPair.priceChange > 0 ? '+' : ''}{formatPrice(selectedPair.priceChange, selectedPair.symbol)}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ height: '400px', width: '100%' }}>
              <StockChart data={selectedPair.historicalData} symbol={selectedPair.symbol} />
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-primary)' }}>AI Technical Analysis</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                {selectedPair.analysis.reason}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Forex;
