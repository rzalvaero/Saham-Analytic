import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';

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
        
        // Strict filter to remove irrelevant clustered news (e.g., general IHSG news when searching BBRI)
        const filterStrict = (newsList) => {
          if (!newsList) return [];
          return newsList.filter(article => {
            const title = (article.title || '').toUpperCase();
            const hasTicker = article.relatedTickers && 
              (article.relatedTickers.includes(symbol) || article.relatedTickers.includes(`${symbolWithoutJK}.JK`));
            return hasTicker || title.includes(symbolWithoutJK);
          });
        };

        // Fetch specific news
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

        // Fetch global market news (IHSG / Pasar Indonesia)
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

  if (loading) {
    return (
      <div className="glass-card" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '2rem' }}>
        <p className="text-muted">Memuat berita terbaru...</p>
      </div>
    );
  }

  const renderNewsList = (newsList, isGlobal = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {newsList.slice(0, 5).map((article, idx) => {
        // Extract Indonesian tickers (ending in .JK) for global news
        const tickers = isGlobal && article.relatedTickers 
          ? article.relatedTickers.filter(t => t.endsWith('.JK')).map(t => t.replace('.JK', ''))
          : [];

        return (
          <a 
            key={idx} 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'block', 
              padding: '1rem', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          >
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ flex: 1, paddingRight: '1rem' }}>{article.title}</span>
              <ExternalLink size={14} className="text-muted" />
            </h4>
            
            {tickers.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {tickers.map(ticker => (
                  <button
                    key={ticker}
                    onClick={(e) => {
                      e.preventDefault(); // Stop link navigation
                      e.stopPropagation();
                      if(onAddSymbol) onAddSymbol(ticker);
                    }}
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                  >
                    + {ticker}
                  </button>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '500' }}>{article.publisher}</span>
              <span className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                {new Date(article.providerPublishTime * 1000).toLocaleDateString('id-ID')}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <Newspaper size={20} className="text-accent-primary" />
        <h3 style={{ margin: 0, marginRight: 'auto' }}>Berita & Sentimen</h3>
        
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
          <button 
            onClick={() => setActiveTab('specific')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: activeTab === 'specific' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'specific' ? 'white' : 'var(--text-muted)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            {symbol}
          </button>
          <button 
            onClick={() => setActiveTab('global')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: activeTab === 'global' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'global' ? 'white' : 'var(--text-muted)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            Pasar Global (IHSG)
          </button>
        </div>
      </div>

      {activeTab === 'specific' ? (
        news.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '2rem 0' }}>Tidak ada berita spesifik terbaru untuk emiten ini.</p>
        ) : (
          renderNewsList(news, false)
        )
      ) : (
        globalNews.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '2rem 0' }}>Tidak ada berita pasar global terbaru saat ini.</p>
        ) : (
          renderNewsList(globalNews, true)
        )
      )}
    </div>
  );
};

export default FundamentalNews;
