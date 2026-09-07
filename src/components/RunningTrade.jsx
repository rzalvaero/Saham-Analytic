import React, { useState, useEffect, useRef } from 'react';
import { Activity, Search, Filter, List, ArrowUp, ArrowDown } from 'lucide-react';

const mockSymbols = [
  { code: 'BBRI', price: 4950 }, { code: 'BMRI', price: 7100 }, { code: 'BBCA', price: 10400 },
  { code: 'GOTO', price: 54 }, { code: 'BREN', price: 11000 }, { code: 'AMMN', price: 9800 },
  { code: 'BUMI', price: 218 }, { code: 'UNTR', price: 25800 }, { code: 'MDIA', price: 228 },
  { code: 'SURI', price: 87 }, { code: 'BULL', price: 442 }, { code: 'ADRO', price: 2760 },
  { code: 'BRPT', price: 1200 }, { code: 'TPIA', price: 7600 }, { code: 'PANI', price: 5500 }
];

const RunningTrade = () => {
  const [trades, setTrades] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, BELI, JUAL
  const [search, setSearch] = useState('');
  const tradesRef = useRef([]);

  // Mock Engine
  useEffect(() => {
    let anomalyMap = {};
    
    const generateTrade = () => {
      const isBuy = Math.random() > 0.5;
      const symbol = mockSymbols[Math.floor(Math.random() * mockSymbols.length)];
      
      // Price variation +/- 2%
      const priceVariation = 1 + ((Math.random() - 0.5) * 0.04);
      const price = Math.round(symbol.price * priceVariation);
      
      // Lots: mostly small, sometimes big
      let lots = Math.floor(Math.random() * 100) + 1;
      if (Math.random() > 0.9) lots *= 100; // Whale!
      
      const value = price * lots * 100; // 1 lot = 100 shares
      
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const newTrade = {
        id: Math.random().toString(36).substr(2, 9),
        time: timeString,
        code: symbol.code,
        action: isBuy ? 'BELI' : 'JUAL',
        price: price,
        lots: lots,
        value: value,
        isWhale: lots >= 5000
      };
      
      // Anomaly tracking
      if (!anomalyMap[symbol.code]) {
        anomalyMap[symbol.code] = { code: symbol.code, freq: 0, totalLots: 0, totalValue: 0, action: newTrade.action };
      }
      
      if (anomalyMap[symbol.code].action === newTrade.action) {
        anomalyMap[symbol.code].freq += 1;
        anomalyMap[symbol.code].totalLots += lots;
        anomalyMap[symbol.code].totalValue += value;
      } else {
        anomalyMap[symbol.code] = { code: symbol.code, freq: 1, totalLots: lots, totalValue: value, action: newTrade.action };
      }

      setTrades(prev => {
        const updated = [newTrade, ...prev].slice(0, 200); // keep last 200
        tradesRef.current = updated;
        return updated;
      });
      
      // Update anomalies every few trades
      if (Math.random() > 0.7) {
        const sortedAnomalies = Object.values(anomalyMap)
          .filter(a => a.freq >= 5) // Only show if consecutive >= 5
          .sort((a, b) => b.freq - a.freq)
          .slice(0, 4); // Top 4
        setAnomalies(sortedAnomalies);
      }
    };

    // Fast interval for heavy traffic simulation (3-5 trades per second)
    const interval = setInterval(() => {
      const burst = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < burst; i++) {
        generateTrade();
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const formatValue = (val) => {
    if (val >= 1e9) return (val / 1e9).toFixed(1) + ' M';
    if (val >= 1e6) return (val / 1e6).toFixed(1) + ' Jt';
    if (val >= 1e3) return (val / 1e3).toFixed(1) + ' Rb';
    return val;
  };

  const filteredTrades = trades.filter(t => {
    if (filter !== 'ALL' && t.action !== filter) return false;
    if (search && !t.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
      
      {/* Top Section: Anomalies */}
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity className="text-accent-primary" /> Deteksi Sinyal (Screener)
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {anomalies.length > 0 ? anomalies.map((anomaly, idx) => (
            <div key={idx} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{anomaly.code}</h3>
                <div style={{ 
                  background: anomaly.action === 'BELI' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                  color: anomaly.action === 'BELI' ? 'var(--positive)' : 'var(--negative)', 
                  padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.875rem' 
                }}>
                  {anomaly.freq}X {anomaly.action}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{anomaly.totalLots.toLocaleString('id-ID')} Lot</p>
                <p style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>Rp {formatValue(anomaly.totalValue)}</p>
              </div>
            </div>
          )) : (
            <div className="glass-card" style={{ padding: '1rem', color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1 / -1' }}>
              Menunggu sinyal anomali frekuensi transaksi...
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Tape/Orderflow */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <List size={18} /> Aliran Transaksi
          </h3>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Cari emiten..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 10px 8px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', width: '150px' }}
              />
            </div>
            
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
              <button 
                onClick={() => setFilter('ALL')}
                style={{ padding: '4px 12px', background: filter === 'ALL' ? 'var(--accent-primary)' : 'transparent', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
              >Semua</button>
              <button 
                onClick={() => setFilter('BELI')}
                style={{ padding: '4px 12px', background: filter === 'BELI' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', border: 'none', color: filter === 'BELI' ? 'var(--positive)' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
              >Beli</button>
              <button 
                onClick={() => setFilter('JUAL')}
                style={{ padding: '4px 12px', background: filter === 'JUAL' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', border: 'none', color: filter === 'JUAL' ? 'var(--negative)' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
              >Jual</button>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', flex: 1, maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(10, 14, 23, 0.95)', backdropFilter: 'blur(4px)', zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Waktu</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Kode</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Aksi</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Harga</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Lot</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Nilai</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: t.isWhale ? 'rgba(124, 58, 237, 0.1)' : 'transparent' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t.time}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{t.code}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                      background: t.action === 'BELI' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: t.action === 'BELI' ? 'var(--positive)' : 'var(--negative)',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      {t.action === 'BELI' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {t.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{t.price.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: t.isWhale ? 'bold' : 'normal' }}>
                    {t.lots.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: t.action === 'BELI' ? 'var(--positive)' : 'var(--negative)' }}>
                    {formatValue(t.value)}
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data transaksi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RunningTrade;
