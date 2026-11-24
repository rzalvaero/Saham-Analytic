import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, RefreshCw, Sparkles } from 'lucide-react';

const FundamentalNews = ({ symbol, onAddSymbol }) => {
  const [news, setNews] = useState([]);
  const [globalNews, setGlobalNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('specific');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    if (!symbol) return;
    setLoading(true);
    let errSpecific = null;
    let errGlobal = null;
    try {
      const symbolClean = symbol.replace('.JK', '').replace('^', '').toUpperCase();

      // 1. Fetch specific news for the active symbol
      const resSpecific = await fetch(`/api/news?symbol=${encodeURIComponent(symbolClean)}&_=${Date.now()}`);
      if (resSpecific.ok) {
        const data = await resSpecific.json();
        setNews(Array.isArray(data.news) ? data.news : []);
      } else {
        errSpecific = `HTTP ${resSpecific.status}`;
        setNews([]);
      }

      // 2. Fetch global market / IHSG news
      const resGlobal = await fetch(`/api/news?q=${encodeURIComponent('saham IHSG bursa efek indonesia')}&_=${Date.now()}`);
      if (resGlobal.ok) {
        const dataGlobal = await resGlobal.json();
        setGlobalNews(Array.isArray(dataGlobal.news) ? dataGlobal.news : []);
      } else {
        errGlobal = `HTTP ${resGlobal.status}`;
        setGlobalNews([]);
      }
      setError(errSpecific || errGlobal);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch news', err);
      setNews([]);
      setGlobalNews([]);
      setError(err?.message || 'Koneksi ke penyedia berita gagal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 120000); // auto-refresh berita tiap 2 menit
    return () => clearInterval(interval);
  }, [symbol]);

  const formatPubTime = (item) => {
    if (!item.pubTime) return item.pubDate || 'Baru saja';
    const diffSec = Math.floor((Date.now() - item.pubTime) / 1000);
    if (diffSec < 60) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    return new Date(item.pubTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const renderNewsList = (newsList) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {newsList.length === 0 ? (
        <div className="col-span-full text-center py-8 px-4 text-xs text-gray-500 bg-gray-950/40 rounded-xl border border-gray-850">
          <p>Tidak ada berita yang berhasil dimuat.</p>
          {error ? (
            <p className="mt-1.5 text-[10px] font-mono text-amber-500/80">
              Penyebab: {error}
            </p>
          ) : (
            <p className="mt-1.5 text-[10px] text-gray-600">
              Penyedia berita tidak mengembalikan artikel untuk kueri ini.
            </p>
          )}
          <p className="mt-1.5 text-[10px] text-gray-600">
            Tidak ada data contoh yang ditampilkan — semua berita di sini berasal dari sumber nyata.
          </p>
        </div>
      ) : (
        newsList.slice(0, 6).map((article, idx) => (
          <a
            key={idx}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between p-3.5 rounded-xl bg-gray-950/70 border border-gray-850 hover:border-cyan-500/50 hover:bg-gray-900/60 transition group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 font-mono">
                <span className="text-cyan-400 font-semibold truncate max-w-[150px]">
                  {article.publisher || 'Media Nasional'}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-500 shrink-0">
                  <Clock className="w-3 h-3 text-gray-500" />
                  {formatPubTime(article)}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-200 group-hover:text-cyan-300 transition leading-snug line-clamp-2">
                {article.title}
              </h4>
            </div>

            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-850/60 text-[10px] text-gray-500">
              <span className="text-gray-400 font-mono">Berita Terverifikasi</span>
              <span className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:underline">
                Baca Selengkapnya
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </a>
        ))
      )}
    </div>
  );

  return (
    <div className="rt-card mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-gray-850 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Sentimen &amp; Berita Fundamental Realtime</h3>
              <span className="rt-badge rt-badge-live text-[9px] py-0.5 px-2">
                <span className="rt-pulse-dot" />
                FRESH
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Feed berita aktual dan analisis penggerak pasar modal Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setActiveTab('specific')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'specific'
                  ? 'bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Berita {symbol || 'Emiten'}
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'global'
                  ? 'bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Kabar Pasar IHSG
            </button>
          </div>

          <button
            onClick={fetchNews}
            disabled={loading}
            title="Refresh Berita Sekarang"
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
          <span>Memuat berita emiten dan pasar modal terkini...</span>
        </div>
      ) : activeTab === 'specific' ? (
        renderNewsList(news)
      ) : (
        renderNewsList(globalNews)
      )}
    </div>
  );
};

export default FundamentalNews;
