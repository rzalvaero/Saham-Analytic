import React, { useState, useEffect } from 'react';
import {
  Zap,
  LayoutDashboard,
  RefreshCw,
  Activity,
  Compass,
  Briefcase,
  Settings,
  Bell,
  LogOut,
  X,
  Menu
} from 'lucide-react';
import LiveTradingDashboard from './components/LiveTradingDashboard';
import StockChart from './components/StockChart';
import RecommendationEngine from './components/RecommendationEngine';
import MarketOverview from './components/MarketOverview';
import SearchStock from './components/SearchStock';
import PaperTrading from './components/PaperTrading';
import Portfolio from './components/Portfolio';
import SettingsPage from './components/Settings';
import FundamentalNews from './components/FundamentalNews';
import Discover from './components/Discover';
import Forex from './components/Forex';
import RunningTrade from './components/RunningTrade';
import { fetchRealtimeData } from './services/marketData';

function App() {
  const [stocksData, setStocksData] = useState([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState(['BBRI', 'BMRI', 'BBCA', '^JKSE']);
  const [selectedSymbol, setSelectedSymbol] = useState('BBRI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('live-trading'); // Default Live MT5
  const [authMode, setAuthMode] = useState('login');
  const [ihsgData, setIhsgData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchIHSG = async () => {
      const ihsg = await fetchRealtimeData('^JKSE');
      if (ihsg) setIhsgData(ihsg);
    };
    fetchIHSG();
  }, []);

  useEffect(() => {
    if (activeTab !== 'dashboard' || watchlistSymbols.length === 0) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const promises = watchlistSymbols.map((symbol) => fetchRealtimeData(symbol));
        const results = await Promise.all(promises);
        const validData = results.filter((data) => data !== null);

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
  }, [watchlistSymbols, activeTab]);

  const handleAddSymbol = async (symbol) => {
    if (!watchlistSymbols.includes(symbol) && user) {
      try {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, symbol }),
        });
        setWatchlistSymbols([...watchlistSymbols, symbol]);
        setSelectedSymbol(symbol);
      } catch (e) {
        alert('Gagal menambahkan ke watchlist');
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
          method: 'DELETE',
        });
        const newWatchlist = watchlistSymbols.filter((sym) => sym !== symbolToRemove);
        setWatchlistSymbols(newWatchlist);
        if (selectedSymbol === symbolToRemove) {
          setSelectedSymbol(newWatchlist.length > 0 ? newWatchlist[0] : null);
        }
      } catch (err) {
        console.error('Failed to remove from watchlist', err);
      }
    } else {
      const newWatchlist = watchlistSymbols.filter((sym) => sym !== symbolToRemove);
      setWatchlistSymbols(newWatchlist);
      if (selectedSymbol === symbolToRemove) {
        setSelectedSymbol(newWatchlist.length > 0 ? newWatchlist[0] : null);
      }
    }
  };

  const selectedStockData = stocksData.find((s) => s.symbol === selectedSymbol);

  const navItems = [
    { id: 'live-trading', label: 'Live Trading', icon: Zap, liveBadge: true },
    { id: 'dashboard', label: 'Saham & IHSG', icon: LayoutDashboard },
    { id: 'forex', label: 'Forex & Gold', icon: RefreshCw },
    { id: 'running-trade', label: 'Running Trade', icon: Activity },
    { id: 'discover', label: 'Discover', icon: Compass },
  ];

  return (
    <div className="min-h-screen bg-[#070a12] text-gray-100 flex flex-col font-sans">
      {/* Top Institutional Navbar */}
      <header className="sticky top-0 z-50 bg-[#0c111d]/90 backdrop-blur-xl border-b border-gray-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo & Live Badge */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('live-trading');
                }}
                className="flex items-center gap-2.5 text-white font-extrabold text-lg sm:text-xl tracking-tight no-underline group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                  <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <span>
                  REEZ<span className="text-cyan-400"> Trade</span>
                </span>
              </a>

              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>EXNESS REAL</span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 bg-gray-900/60 p-1 rounded-xl border border-gray-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gray-950' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                    {item.liveBadge && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Controls / Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 py-1 px-2.5 rounded-xl text-xs">
                  <div className="text-right hidden sm:block">
                    <span className="text-gray-400 text-[10px] block">User: {user.username}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      Rp {parseFloat(user.balance).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <button
                    onClick={() => setUser(null)}
                    className="text-gray-400 hover:text-rose-400 p-1"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setActiveTab('portfolio');
                    }}
                    className="text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-800 hover:border-gray-700 transition"
                  >
                    Paper Login
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-950 border-b border-gray-800 px-4 py-3 space-y-1 animate-fade-in">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-cyan-500 text-gray-950 font-bold'
                      : 'text-gray-300 hover:bg-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.liveBadge && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile Swipeable Tab Bar (Geser tab dengan jempol) */}
        <div className="md:hidden bg-[#090d16] border-b border-gray-850 px-3 py-2 overflow-x-auto touch-pan-x flex items-center gap-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                  isActive
                    ? 'bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gray-950' : 'text-gray-400'}`} />
                <span>{item.label}</span>
                {item.liveBadge && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. Live MT5 Institutional Dashboard (Default) */}
        {activeTab === 'live-trading' && <LiveTradingDashboard />}

        {/* 2. Saham & IHSG Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/60 p-4 rounded-2xl border border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white">Pasar Saham Indonesia (IDX)</h2>
                <p className="text-xs text-gray-400">Data Realtime Yahoo Finance (IHSG, BBCA, BBRI, BMRI, dll)</p>
              </div>
              <div className="w-full sm:w-auto">
                <SearchStock onAddSymbol={handleAddSymbol} />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            {stocksData.length > 0 && (
              <>
                <MarketOverview stocks={stocksData} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Watchlist Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {watchlistSymbols.map((sym) => (
                        <button
                          key={sym}
                          onClick={() => setSelectedSymbol(sym)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition ${
                            selectedSymbol === sym
                              ? 'bg-cyan-500 text-gray-950 font-bold'
                              : 'bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          {sym}
                          <X
                            size={12}
                            className="opacity-70 hover:opacity-100"
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
                      <div className="h-96 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 text-sm">
                        Memuat grafik...
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <RecommendationEngine stocks={stocksData} />
                    {selectedStockData && (
                      <PaperTrading
                        symbol={selectedStockData.symbol}
                        currentPrice={selectedStockData.currentPrice}
                        user={user}
                        onTrade={(newBalance) => setUser({ ...user, balance: newBalance })}
                      />
                    )}
                  </div>
                </div>

                {selectedStockData && (
                  <div className="mt-6">
                    <FundamentalNews symbol={selectedStockData.symbol} onAddSymbol={handleAddSymbol} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 3. Forex & Commodities */}
        {activeTab === 'forex' && (
          <div className="rounded-2xl bg-gray-900/60 p-5 border border-gray-800">
            <Forex />
          </div>
        )}

        {/* 4. Running Trade */}
        {activeTab === 'running-trade' && (
          <div className="rounded-2xl bg-gray-900/60 p-5 border border-gray-800">
            <RunningTrade />
          </div>
        )}

        {/* 5. Discover */}
        {activeTab === 'discover' && (
          <div className="rounded-2xl bg-gray-900/60 p-5 border border-gray-800">
            <Discover />
          </div>
        )}

        {/* 6. Portfolio Paper Trading */}
        {activeTab === 'portfolio' && (
          <div className="rounded-2xl bg-gray-900/60 p-5 border border-gray-800">
            <Portfolio
              user={user}
              authMode={authMode}
              setAuthMode={setAuthMode}
              onLogin={(userData) => {
                setUser(userData);
                setWatchlistSymbols(['BBCA']);
                setSelectedSymbol('BBCA');
              }}
            />
          </div>
        )}

        {/* 7. Settings */}
        {activeTab === 'settings' && (
          <div className="rounded-2xl bg-gray-900/60 p-5 border border-gray-800">
            <SettingsPage user={user} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
