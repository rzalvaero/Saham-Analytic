import React, { useState } from 'react';

const PaperTrading = ({ symbol, currentPrice, user, onTrade }) => {
  const [qty, setQty] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleTrade = async (type) => {
    if (!user) return alert('Silakan login terlebih dahulu');
    setLoading(true);
    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          symbol,
          type,
          qty: parseInt(qty),
          price: currentPrice
        })
      });
      const result = await response.json();
      if (result.success) {
        onTrade(result.balance);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const total = qty * currentPrice;

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3>Paper Trading (Simulasi)</h3>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Beli/Jual {symbol} tanpa risiko</p>
      </div>
      
      {user ? (
        <>
          <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="text-muted">Saldo Virtual:</span>
              <span style={{ fontWeight: '600', color: 'var(--positive)' }}>Rp {parseFloat(user.balance).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Harga Saat Ini:</span>
              <span style={{ fontWeight: '600' }}>Rp {currentPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px' }}>
              <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>Jumlah Lot (1 Lot = 100 lembar)</label>
              <input 
                type="number" 
                value={qty / 100}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1) * 100)}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border-color)', 
                  padding: '10px', 
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none'
                }} 
              />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>Total Nilai</label>
              <div style={{ padding: '10px', border: '1px solid transparent' }}>
                Rp {total.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => handleTrade('BUY')}
              disabled={loading || user.balance < total}
              style={{
                flex: '1 1 120px',
                padding: '12px',
                background: user.balance < total ? 'rgba(255,255,255,0.1)' : 'var(--positive)',
                color: user.balance < total ? 'var(--text-muted)' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: user.balance < total || loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : 'BUY (Beli)'}
            </button>
            <button 
              onClick={() => handleTrade('SELL')}
              disabled={loading}
              style={{
                flex: '1 1 120px',
                padding: '12px',
                background: 'var(--negative)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : 'SELL (Jual)'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          Mencoba terhubung dengan sesi...
        </div>
      )}
    </div>
  );
};

export default PaperTrading;
