import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, TrendingDown } from 'lucide-react';

const Portfolio = ({ user }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/api/portfolio/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setPortfolio(data);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [user]);

  if (!user) return <div className="text-muted">Harap login terlebih dahulu...</div>;
  if (loading) return <div className="text-muted">Memuat portofolio...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Portofolio Saya</h1>
        <p className="text-muted">Daftar kepemilikan saham dari hasil Paper Trading</p>
      </div>

      {portfolio.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Briefcase size={48} className="text-muted" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Belum ada saham</h3>
          <p className="text-muted">Anda belum memiliki saham apapun. Silakan lakukan transaksi beli di Dashboard.</p>
        </div>
      ) : (
        <div className="grid-top">
          {portfolio.map(item => {
            const totalInvested = item.qty * item.avg_price;
            return (
              <div key={item.symbol} className="glass-card animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>{item.symbol}</h3>
                  <span className="badge buy">{item.qty} Lembar</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Harga Rata-rata:</span>
                    <span>Rp {parseFloat(item.avg_price).toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Total Modal:</span>
                    <span style={{ fontWeight: '600' }}>Rp {totalInvested.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Portfolio;
