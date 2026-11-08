import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, RefreshCw } from 'lucide-react';

const FundamentalNews = ({ symbol, onAddSymbol }) => {
  const [news, setNews] = useState([]);
  const [globalNews, setGlobalNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('specific');

  useEffect(() => {
    if (!symbol) return;

    const fetchNews = async () => {
      setLoading(true);
      try {
        const symbolWithoutJK = symbol.replace('.JK', '').toUpperCase();

        const filterStrict = (newsList) => {
          if (!newsList) return [];
          return newsList.filter((article) => {
            const title = (article.title || '').toUpperCase();
            const hasTicker =
              article.relatedTickers &&
              (article.relatedTickers.includes(symbol) ||
                article.relatedTickers.includes(`${symbolWithoutJK}.JK`));
            return hasTicker || title.includes(symbolWithoutJK);
          });
        };

        const response = await fetch(`/api/finance/v1/finance/search?q=${symbol}.JK&newsCount=15`);
        if (response.ok) {
          const data = await response.json();
          let strictNews = filterStrict(data.news);

          if (strictNews.length === 0) {
            const fallbackRes = await fetch(`/api/finance/v1/finance/search?q=${symbol}&newsCount=15`);
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              strictNews = filterStrict(fallbackData.news);
            }
          }
          setNews(strictNews);
        }

        const globalRes = await fetch(`/api/finance/v1/finance/search?q=IHSG&newsCount=5`);
        if (globalRes.ok) {
          const globalData = await globalRes.json();
          setGlobalNews(globalData.news || []);
        }
      } catch (err) {
        console.error('Failed to fetch news', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol]);

  const renderNewsList = (newsList, isGlobal = false) => (
    <div className="space-y-3">
      {newsList.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-500">
          Tidak ada berita terbaru untuk kategori ini saat ini.
        </div>
      ) : (
        newsList.slice(0, 5).map((article, idx) => {
          const tickers =
            isGlobal && article.relatedTickers
              ? article.relatedTickers
                  .filter((t) => t.endsWith('.JK'))
                  .map((t) => t.replace('.JK', ''))
              : [];

          return (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3.5 rounded-xl bg-gray-950/60 border border-gray-850 hover:border-gray-750 transition group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-200 group-hover:text-cyan-400 transition leading-snug">
                  {article.title}
                </h4>
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 shrink-0 transition" />
              </div>

              {tickers.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {tickers.map((ticker) => (
                    <button
                      key={ticker}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onAddSymbol) onAddSymbol(ticker);
                      }}
                      className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold hover:bg-cyan-500/20 transition cursor-pointer"
                    >
                      + {ticker}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-850/50">
                <span className="font-medium text-gray-400">{article.publisher || 'Market News'}</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {article.providerPublishTime
                    ? new Date(article.providerPublishTime * 1000).toLocaleDateString('id-ID')
                    : 'Terbaru'}
                </span>
              </div>
            </a>
          );
        })
      )}
    </div>
  );

  return (
    <div className="rt-card mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-gray-850 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sentimen &amp; Berita Fundamental</h3>
            <p className="text-xs text-gray-400">
              Kabar terkini seputar {symbol} dan dinamika pasar modal Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
          <button
            onClick={() => setActiveTab('specific')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'specific'
                ? 'bg-cyan-500 text-gray-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Berita {symbol}
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'global'
                ? 'bg-cyan-500 text-gray-950 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Kabar Pasar IHSG
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
          <span>Memuat berita emiten terkini...</span>
        </div>
      ) : activeTab === 'specific' ? (
        renderNewsList(news)
      ) : (
        renderNewsList(globalNews, true)
      )}
    </div>
  );
};

export default FundamentalNews;
