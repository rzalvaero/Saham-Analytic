import React, { useState, useEffect } from 'react';
import {
  Zap,
  LayoutDashboard,
  RefreshCw,
  Compass,
  X,
  Menu,
  Clock,
  FlaskConical,
  Scale,
  ChevronRight,
} from 'lucide-react';
import LiveTradingDashboard from './components/LiveTradingDashboard';
import StockChart from './components/StockChart';
import StockInfoPanel from './components/StockInfoPanel';
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
import OrderFlow from './components/OrderFlow';
import PasarHariIni from './components/PasarHariIni';
import { fetchRealtimeData } from './services/marketData';

/**
 * Navigasi dikelompokkan per DOMAIN, bukan per fitur.
 *
 * Kenapa: seluruh fitur saham Indonesia (IHSG, arus, screener, riset) adalah
 * satu keluarga. Menaruhnya sejajar dengan XAUUSD membuat pengguna mengira
 * semuanya setara. Dengan sidebar berkelompok, semua fitur terlihat sekaligus
 * tanpa perlu klik dua lapis.
 */
const NAV_GROUPS = [
  {
    label: 'Trading',
    items: [
      { id: 'live-trading', label: 'XAUUSD Live', icon: Zap, tab: 'live-trading', liveBadge: true },
    ],
  },
  {
    label: 'Pasar IDX',
    items: [
      { id: 'idx-ringkasan', label: 'Ringkasan Pasar', icon: LayoutDashboard, tab: 'idx', sub: 'ringkasan' },
      { id: 'idx-arus', label: 'Arus Beli/Jual', icon: Scale, tab: 'idx', sub: 'arus' },
      { id: 'idx-screener', label: 'Screener', icon: Compass, tab: 'idx', sub: 'screener' },
      { id: 'idx-riset', label: 'Riset & Backtest', icon: FlaskConical, tab: 'idx', sub: 'riset' },
    ],
  },
  {
    label: 'Global',
    items: [
      { id: 'forex', label: 'Forex & Gold', icon: RefreshCw, tab: 'forex' },
    ],
  },
];

const FLAT_NAV = NAV_GROUPS.flatMap((g) => g.items);

function App() {
  const [stocksData, setStocksData] = useState([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState(['PANI', 'BBRI', 'BMRI', 'BBCA', '^JKSE']);
  const [selectedSymbol, setSelectedSymbol] = useState('BBRI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('live-trading'); // Default Live Trading
  const [idxTab, setIdxTab] = useState('ringkasan'); // Sub-tab di dalam Pasar IDX
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
    if (activeTab !== 'idx' || watchlistSymbols.length === 0) return;

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

  // Navigasi: satu id aktif untuk sidebar, diturunkan dari tab + sub-tab
  const activeId = activeTab === 'idx' ? `idx-${idxTab}` : activeTab;

  const goTo = (item) => {
    setActiveTab(item.tab);
    if (item.sub) setIdxTab(item.sub);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-gray-100 flex font-sans">
      {/* ============ SIDEBAR KIRI (desktop) ============ */}
      <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col sticky top-0 h-screen bg-[#0c111d] border-r border-gray-800/80">
        {/* Brand */}
        <div className="px-4 h-16 flex items-center border-b border-gray-800/70">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('live-trading');
            }}
            className="flex items-center gap-2.5 text-white font-extrabold text-lg tracking-tight no-underline group"
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
        </div>

        {/* Grup navigasi */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goTo(item)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                          : 'text-gray-400 border border-transparent hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
                      <span className="truncate text-left">{item.label}</span>
                      {item.liveBadge && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      )}
                      {isActive && !item.liveBadge && (
                        <ChevronRight className="ml-auto w-3.5 h-3.5 text-cyan-500/70 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Status akun */}
        <div className="px-4 py-3 border-t border-gray-800/70">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>EXNESS REAL</span>
          </div>
          <div className="mt-2 text-[10px] text-gray-600 font-mono">
            Bursa Efek Indonesia
          </div>
        </div>
      </aside>

      {/* ============ AREA KONTEN ============ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="md:hidden sticky top-0 z-50 bg-[#0c111d]/95 backdrop-blur-xl border-b border-gray-800/80">
          <div className="flex items-center justify-between h-14 px-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('live-trading');
              }}
              className="flex items-center gap-2 text-white font-extrabold tracking-tight no-underline"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-gray-950 rounded-[7px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="text-base">
                REEZ<span className="text-cyan-400"> Trade</span>
              </span>
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Dropdown menu bergrup */}
          {mobileMenuOpen && (
            <div className="bg-gray-950 border-t border-gray-800 px-4 py-3 space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeId === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => goTo(item)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                            isActive
                              ? 'bg-cyan-500 text-gray-950 font-bold'
                              : 'text-gray-300 hover:bg-gray-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                          {item.liveBadge && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bar geser cepat (jempol) */}
          <div className="bg-[#090d16] border-t border-gray-850 px-3 py-2 overflow-x-auto touch-pan-x flex items-center gap-2 no-scrollbar">
            {FLAT_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item)}
                  className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                    isActive
                      ? 'bg-cyan-500 text-gray-950 font-bold'
                      : 'bg-gray-900/80 text-gray-400 border border-gray-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Konten utama */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 1. Live Trading Dashboard (Default) */}
          {activeTab === 'live-trading' && <LiveTradingDashboard />}

          {/* 2. Pasar IDX */}
          {activeTab === 'idx' && (
            <div className="space-y-6">
              {idxTab === 'ringkasan' && (
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
                          Auto-refresh setiap 1 menit
                          {lastUpdated
                            ? ` • Update terakhir: ${lastUpdated.toLocaleTimeString('id-ID')}`
                            : ' • Menyiapkan data...'}
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

                  {/* Pasar Hari Ini: breadth IHSG + top mover seluruh emiten BEI */}
                  <PasarHariIni />

                  {/* Kondisi Pasar & Status Indeks (selalu tampil, tidak bergantung watchlist) */}
                  <RiskRegime />

                  {stocksData.length > 0 && (
                    <>
                      <MarketOverview stocks={stocksData} />

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                          {/* Watchlist Chips */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider shrink-0">
                              Watchlist:
                            </span>
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
                              ma60={selectedStockData.ma60}
                              ma280={selectedStockData.ma280}
                              symbol={selectedStockData.symbol}
                            />
                          ) : ihsgData ? (
                            <StockChart
                              data={ihsgData.historicalData}
                              ma60={ihsgData.ma60}
                              ma280={ihsgData.ma280}
                              symbol="IHSG (^JKSE)"
                            />
                          ) : (
                            <div className="h-96 rounded-2xl bg-gray-950 border border-gray-850 flex items-center justify-center text-gray-500 text-sm">
                              Memuat grafik...
                            </div>
                          )}
                        </div>

                        <div className="space-y-6">
                          {selectedStockData && <StockInfoPanel stock={selectedStockData} />}
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

              {idxTab === 'arus' && <OrderFlow />}

              {idxTab === 'screener' && <Discover />}

              {idxTab === 'riset' && (
                <div className="space-y-5">
                  <BacktestHistoris />
                  <FullUniverse />
                </div>
              )}
            </div>
          )}

          {/* 3. Forex & Gold (Spot Rates & XAU/USD) */}
          {activeTab === 'forex' && <Forex />}
        </main>
      </div>
    </div>
  );
}

export default App;
