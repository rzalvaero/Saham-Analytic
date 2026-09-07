import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, TrendingDown, Lock, User, LogIn } from 'lucide-react';

const Portfolio = ({ user, onLogin }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError('Silakan masukkan username dan password');
      return;
    }
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        const userData = await response.json();
        onLogin(userData);
      } else {
        const errData = await response.json();
        setLoginError(errData.error || 'Gagal login');
      }
    } catch (err) {
      setLoginError('Gagal terhubung ke server');
    }
  };

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

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Lock size={32} className="text-accent-primary" />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Akses Portofolio</h2>
            <p className="text-muted">Silakan login untuk mengakses fitur watchlist dan portofolio trading Anda.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loginError && (
              <div style={{ padding: '0.75rem', background: 'var(--negative-bg)', color: 'var(--negative)', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center' }}>
                {loginError}
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username" 
                  style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password" 
                  style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                />
              </div>
            </div>

            <button type="submit" style={{ marginTop: '1rem', padding: '12px', background: 'var(--accent-primary)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s' }}>
              <LogIn size={20} /> Login Sekarang
            </button>
          </form>
        </div>
      </div>
    );
  }
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
