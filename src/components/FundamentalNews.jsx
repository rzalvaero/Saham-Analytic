import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';

const FundamentalNews = ({ symbol }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/finance/v1/finance/search?q=${symbol}.JK&newsCount=5`);
        if (response.ok) {
          const data = await response.json();
          if (data.news && data.news.length > 0) {
            setNews(data.news);
          } else {
            // Fallback to global search if .JK doesn't return news
            const fallbackRes = await fetch(`/api/finance/v1/finance/search?q=${symbol}&newsCount=5`);
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              setNews(fallbackData.news || []);
            }
          }
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

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Newspaper size={20} className="text-accent-primary" />
        <h3 style={{ margin: 0 }}>Berita & Sentimen {symbol}</h3>
      </div>

      {news.length === 0 ? (
        <p className="text-muted">Tidak ada berita terbaru untuk emiten ini.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {news.slice(0, 5).map((article, idx) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '500' }}>{article.publisher}</span>
                <span className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {new Date(article.providerPublishTime * 1000).toLocaleDateString('id-ID')}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default FundamentalNews;
