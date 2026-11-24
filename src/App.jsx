import React, { useState, useEffect } from 'react';
import {
  Zap,
  LayoutDashboard,
  RefreshCw,
  Compass,
  X,
  Menu,
  Clock,
  FlaskConical
} from 'lucide-react';
import LiveTradingDashboard from './components/LiveTradingDashboard';
import StockChart from './components/StockChart';
import RecommendationEngine from './components/RecommendationEngine';
import MarketOverview from './components/MarketOverview';
import SearchStock from './components/SearchStock';
import FundamentalNews from './components/FundamentalNews';
import Discover from './components/Discover';
import Forex from './components/Forex';
import RiskRegime from './components/RiskRegime';
import MultiTimeframe from './components/MultiTimeframe';
import BacktestHistoris from './components/BacktestHistoris';
import FullUniverse from './components/FullUniverse';
import { fetchRealtimeData } from './services/marketData';

function App() {
  const [stocksData, setStocksData] = useState([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState(['PANI', 'BBRI', 'BMRI', 'BBCA', '^JKSE']);
  const [selectedSymbol, setSelectedSymbol] = useState('BBRI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('live-trading'); // Default Live Trading
  const [lastUpdated, setLastUpdated] = useState(null);
  const [ihsgData, setIhsgData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchIHSG = async () => {
      const ihsg = await fetchRealtimeData('^JKSE');
      if (ihsg) setIhsgData(ihsg);
    };
    fetchIHSG();
    const interval = setInterval(fetchIHSG, 60000); // Auto-refresh IHSG setiap 1 menit (60s)
    return () => clearInterval(interval);
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
          setLastUpdated(new Date());
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
    if (!watchlistSymbols.includes(symbol)) {
      setWatchlistSymbols([...watchlistSymbols, symbol]);
      setSelectedSymbol(symbol);
    }
  };

  const handleRemoveWatchlist = (e, symbolToRemove) => {
    e.stopPropagation();
    const newWatchlist = watchlistSymbols.filter((sym) => sym !== symbolToRemove);
    setWatchlistSymbols(newWatchlist);
    if (selectedSymbol === symbolToRemove) {
      setSelectedSymbol(newWatchlist.length > 0 ? newWatchlist[0] : null);
    }
  };

  const selectedStockData = stocksData.find((s) => s.symbol === selectedSymbol);

  const navItems = [
    { id: 'live-trading', label: 'Live XAUUSD', icon: Zap, liveBadge: true },
    { id: 'dashboard', label: 'Saham & IHSG', icon: LayoutDashboard },
    { id: 'backtest', label: 'Backtest', icon: FlaskConical },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'forex', label: 'Forex & Gold', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-[#070a12] text-gray-100 flex flex-col font-sans">
      {/* Top Institutional Navbar */}
      <header className="sticky top-0 z-50 bg-[#0c111d]/90 backdrop-blur-xl border-b border-gray-800/80 shadow-lg">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
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
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
        {/* 1. Live Trading Dashboard (Default) */}
        {activeTab === 'live-trading' && <LiveTradingDashboard />}

        {/* 2. Saham & IHSG Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Institutional Header */}
            <div className="rt-card bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#0c1322] border-gray-850 p-5 sm:p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rt-badge rt-badge-live">
                      <span className="rt-pulse-dot" />
                      IDX REALTIME
                    </span>
                    <span className="text-xs text-gray-400 font-mono">Bursa Efek Indonesia</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    📊 Pasar Saham Indonesia (IDX)
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Data realtime Yahoo Finance, grafik interaktif candlestick, dan sinyal algoritma momentum
                  </p>
                  <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Auto-refresh setiap 1 menit{lastUpdated ? ` • Update terakhir: ${lastUpdated.toLocaleTimeString('id-ID')}` : ' • Menyiapkan data...'}
                  </p>
                </div>
                <div className="w-full sm:w-auto">
                  <SearchStock onAddSymbol={handleAddSymbol} />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Kondisi Pasar & Status Indeks (selalu tampil, tidak bergantung watchlist) */}
            <RiskRegime />

            {stocksData.length > 0 && (
              <>
                <MarketOverview stocks={stocksData} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Watchlist Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider shrink-0">Watchlist:</span>
                      {watchlistSymbols.map((sym) => (
                        <button
                          key={sym}
                          onClick={() => setSelectedSymbol(sym)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
                            selectedSymbol === sym
                              ? 'bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20'
                              : 'bg-gray-950/80 text-gray-300 border border-gray-850 hover:border-gray-700'
                          }`}
                        >
                          <span>{sym}</span>
                          <X
                            size={12}
                            className="opacity-70 hover:opacity-100 hover:text-rose-400"
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
                      <div className="h-96 rounded-2xl bg-gray-950 border border-gray-850 flex items-center justify-center text-gray-500 text-sm">
                        Memuat grafik...
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <RecommendationEngine stocks={stocksData} />
                  </div>
                </div>

                {selectedStockData && (
                  <MultiTimeframe
                    historicalData={selectedStockData.historicalData}
                    symbol={selectedStockData.symbol}
                  />
                )}

                {selectedStockData && (
                  <div className="mt-6">
                    <FundamentalNews symbol={selectedStockData.symbol} onAddSymbol={handleAddSymbol} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 3. Backtest Historis (hasil precomputed, JSON statis) */}
        {activeTab === 'backtest' && (
          <div className="space-y-5">
            <BacktestHistoris />
            <FullUniverse />
          </div>
        )}

        {/* 4. Discover (Market Screener, Volume Surge, IPO, Dividen) */}
        {activeTab === 'discover' && <Discover />}

        {/* 5. Forex & Gold (Spot Rates & XAU/USD) */}
        {activeTab === 'forex' && <Forex />}
      </main>
    </div>
  );
}

export default App;
