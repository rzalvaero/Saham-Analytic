import React, { useState, useEffect } from 'react';
import { LineChart, LayoutDashboard, Settings, Bell, RefreshCw, Briefcase, Compass, X } from 'lucide-react';
import StockChart from './components/StockChart';
import RecommendationEngine from './components/RecommendationEngine';
import MarketOverview from './components/MarketOverview';
import SearchStock from './components/SearchStock';
import PaperTrading from './components/PaperTrading';
import Portfolio from './components/Portfolio';
import SettingsPage from './components/Settings';
import FundamentalNews from './components/FundamentalNews';
import Discover from './components/Discover';
import { fetchRealtimeData } from './services/marketData';

function App() {
  const [stocksData, setStocksData] = useState([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ihsgData, setIhsgData] = useState(null);
  
  // Login as admin and fetch watchlist
  useEffect(() => {
    const initApp = async () => {
      try {
        const userRes = await fetch('/api/user/admin');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          
          const watchlistRes = await fetch(`/api/watchlist/${userData.id}`);
          if (watchlistRes.ok) {
            const symbols = await watchlistRes.json();
            setWatchlistSymbols(symbols.length > 0 ? symbols : ['BBCA']);
            setSelectedSymbol(symbols[0] || 'BBCA');
          }
        }
      } catch (err) {
        console.error("Failed to connect to backend", err);
      }
    };
    initApp();

    const fetchIHSG = async () => {
      const ihsg = await fetchRealtimeData('^JKSE');
      if (ihsg) setIhsgData(ihsg);
    };
    fetchIHSG();
  }, []);


  useEffect(() => {
    if (watchlistSymbols.length === 0) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const promises = watchlistSymbols.map(symbol => fetchRealtimeData(symbol));
        const results = await Promise.all(promises);
        
        const validData = results.filter(data => data !== null);
        
        if (validData.length === 0) {
          setError('Gagal memuat data saham. Pastikan koneksi dan kode saham valid.');
        } else {
          setStocksData(validData);
        }
      } catch (err) {
        setError('Terjadi kesalahan saat mengambil data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [watchlistSymbols]);

  const handleAddSymbol = async (symbol) => {
    if (!watchlistSymbols.includes(symbol) && user) {
      try {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, symbol })
        });
        setWatchlistSymbols([...watchlistSymbols, symbol]);
        setSelectedSymbol(symbol);
      } catch (e) {
        alert("Gagal menambahkan ke watchlist");
      }
    } else if (!watchlistSymbols.includes(symbol)) {
      setWatchlistSymbols([...watchlistSymbols, symbol]);
      setSelectedSymbol(symbol);
    }
  };

  const handleRemoveWatchlist = async (e, symbolToRemove) => {
    e.stopPropagation();
    if (user) {
      try {
        await fetch(`/api/watchlist/${user.id}/${symbolToRemove}`, {
          method: 'DELETE'
        });
        const newWatchlist = watchlistSymbols.filter(sym => sym !== symbolToRemove);
        setWatchlistSymbols(newWatchlist);
        if (selectedSymbol === symbolToRemove) {
          setSelectedSymbol(newWatchlist.length > 0 ? newWatchlist[0] : null);
        }
      } catch (err) {
        console.error("Failed to remove from watchlist", err);
      }
    } else {
      const newWatchlist = watchlistSymbols.filter(sym => sym !== symbolToRemove);
      setWatchlistSymbols(newWatchlist);
      if (selectedSymbol === symbolToRemove) {
        setSelectedSymbol(newWatchlist.length > 0 ? newWatchlist[0] : null);
      }
    }
  };

  const selectedStockData = stocksData.find(s => s.symbol === selectedSymbol);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '8px' }}>
            <LineChart size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '1.25rem', letterSpacing: '0.5px' }}>IDX<span className="text-accent-primary">Analytics</span></h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); setSelectedSymbol(watchlistSymbols[0]); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: activeTab === 'dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'dashboard' ? 'white' : 'var(--text-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('discover'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: activeTab === 'discover' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'discover' ? 'white' : 'var(--text-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <Compass size={20} />
            Discover
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('portfolio'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: activeTab === 'portfolio' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'portfolio' ? 'white' : 'var(--text-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <Briefcase size={20} />
            Portfolio
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: activeTab === 'settings' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'settings' ? 'white' : 'var(--text-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <Settings size={20} />
            Settings
          </a>
        </nav>
        
        {user && (
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Logged in as <b>{user.username}</b></p>
            <p style={{ fontWeight: 'bold', color: 'var(--positive)' }}>Rp {parseFloat(user.balance).toLocaleString('id-ID')}</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <SearchStock onAddSymbol={handleAddSymbol} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Bell size={20} />
            </button>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }} />
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="content-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Market Dashboard</h1>
                <p className="text-muted">Data Realtime Pasar Saham Indonesia (Yahoo Finance)</p>
              </div>
              
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Memuat Data...</span>
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: '1rem', background: 'var(--negative-bg)', color: 'var(--negative)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            {stocksData.length > 0 && (
              <>
                <MarketOverview stocks={stocksData} />

                <div className="grid-main">
                  <div className="item-chart" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                      {watchlistSymbols.map(sym => (
                        <button
                          key={sym}
                          onClick={() => setSelectedSymbol(sym)}
                          style={{
                            padding: '8px 16px',
                            background: selectedSymbol === sym ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid ' + (selectedSymbol === sym ? 'var(--accent-primary)' : 'var(--border-color)'),
                            borderRadius: '99px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {sym}
                          <X 
                            size={14} 
                            style={{ opacity: 0.7 }} 
                            onClick={(e) => handleRemoveWatchlist(e, sym)} 
                          />
                        </button>
                      ))}
                    </div>
                    
                    {selectedStockData ? (
                      <StockChart 
                        data={selectedStockData.historicalData} 
                        smaData={selectedStockData.smaData}
                        symbol={selectedStockData.symbol} 
                      />
                    ) : ihsgData ? (
                      <StockChart 
                        data={ihsgData.historicalData} 
                        smaData={ihsgData.smaData}
                        symbol="IHSG (^JKSE)" 
                      />
                    ) : (
                      <div className="glass-card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="text-muted">Memuat grafik...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="item-reco">
                    <RecommendationEngine stocks={stocksData} />
                  </div>
                    
                  <div className="item-paper">
                    {selectedStockData && (
                      <PaperTrading 
                        symbol={selectedStockData.symbol} 
                        currentPrice={selectedStockData.currentPrice} 
                        user={user}
                        onTrade={(newBalance) => setUser({...user, balance: newBalance})}
                      />
                    )}
                  </div>
                </div>

                {/* News Section Full Width Below Grid */}
                <div style={{ marginTop: '1.5rem' }}>
                  {selectedStockData && (
                    <div className="item-news">
                      <FundamentalNews symbol={selectedStockData.symbol} onAddSymbol={handleAddSymbol} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Discover Content */}
        {activeTab === 'discover' && (
          <div className="content-wrapper">
             <Discover />
          </div>
        )}

        {/* Portfolio Content */}
        {activeTab === 'portfolio' && (
          <div className="content-wrapper">
             <Portfolio user={user} />
          </div>
        )}

        {/* Settings Content */}
        {activeTab === 'settings' && (
          <div className="content-wrapper">
             <SettingsPage user={user} />
          </div>
        )}
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}} />
    </div>
  );
}

export default App;
