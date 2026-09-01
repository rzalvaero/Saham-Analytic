import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Calendar, Rocket, RefreshCw } from 'lucide-react';
import { fetchRealtimeData } from '../services/marketData';

const dividendData = [
  { symbol: 'BBCA', amount: 42.5, cumDate: '2026-09-10', exDate: '2026-09-11', paymentDate: '2026-09-25' },
  { symbol: 'ITMG', amount: 1200, cumDate: '2026-09-15', exDate: '2026-09-16', paymentDate: '2026-09-30' },
  { symbol: 'ASII', amount: 88, cumDate: '2026-09-20', exDate: '2026-09-21', paymentDate: '2026-10-05' },
  { symbol: 'TLKM', amount: 167, cumDate: '2026-09-22', exDate: '2026-09-23', paymentDate: '2026-10-10' },
  { symbol: 'ADRO', amount: 240, cumDate: '2026-09-25', exDate: '2026-09-26', paymentDate: '2026-10-15' },
  { symbol: 'PTBA', amount: 1090, cumDate: '2026-10-02', exDate: '2026-10-03', paymentDate: '2026-10-20' },
  { symbol: 'UNTR', amount: 700, cumDate: '2026-10-05', exDate: '2026-10-06', paymentDate: '2026-10-22' },
  { symbol: 'BBNI', amount: 211, cumDate: '2026-10-10', exDate: '2026-10-11', paymentDate: '2026-10-28' },
  { symbol: 'BMRI', amount: 350, cumDate: '2026-10-15', exDate: '2026-10-16', paymentDate: '2026-11-02' },
  { symbol: 'BBRI', amount: 235, cumDate: '2026-10-18', exDate: '2026-10-19', paymentDate: '2026-11-05' },
  { symbol: 'INDF', amount: 250, cumDate: '2026-10-22', exDate: '2026-10-23', paymentDate: '2026-11-10' },
  { symbol: 'ICBP', amount: 180, cumDate: '2026-10-25', exDate: '2026-10-26', paymentDate: '2026-11-12' },
];

const ipoData = [
  { name: 'PT Teknologi Inovasi (TEKI)', sector: 'Technology', offerPrice: 'Rp 250 - Rp 300', date: '2026-10-01', score: 85, status: 'BUY', note: 'Pertumbuhan pendapatan YoY 40% dan valuasi (PER) masih tergolong murah untuk sektor teknologi (under-valued).' },
  { name: 'PT Sawit Hijau (SAWI)', sector: 'Agriculture', offerPrice: 'Rp 100 - Rp 120', date: '2026-10-15', score: 45, status: 'SKIP', note: 'Kas operasional negatif 3 tahun berturut-turut, sebagian besar dana IPO untuk melunasi hutang bank, bukan ekspansi bisnis.' },
  { name: 'PT Energi Surya (SURY)', sector: 'Energy', offerPrice: 'Rp 400 - Rp 450', date: '2026-10-20', score: 92, status: 'BUY', note: 'Didukung regulasi pemerintah terkait EBT (Energi Baru Terbarukan) dan memiliki kontrak proyek jangka panjang (10 tahun) yang sudah terkunci.' },
  { name: 'PT Logistik Maju (LMAJ)', sector: 'Logistics', offerPrice: 'Rp 150 - Rp 180', date: '2026-11-05', score: 68, status: 'HOLD', note: 'Bisnis stabil, namun margin keuntungan tipis dan industri logistik saat ini sedang jenuh (red ocean). Penilaian fair-value.' },
  { name: 'PT Sehat Sentosa (SEHT)', sector: 'Healthcare', offerPrice: 'Rp 320 - Rp 380', date: '2026-11-12', score: 78, status: 'BUY', note: 'Tingkat okupansi rumah sakit perseroan tinggi (>80%) dengan ROE 18%. Ekspansi 2 rumah sakit baru berpotensi melipatgandakan laba.' },
];

const formatVolume = (vol) => {
  if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
  if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
  if (vol >= 1e3) return (vol / 1e3).toFixed(2) + 'K';
  return vol;
};

const Discover = () => {
  const [loading, setLoading] = useState(true);
  const [mostActive, setMostActive] = useState([]);
  const [unusualVolume, setUnusualVolume] = useState([]);
  const [expandedIpo, setExpandedIpo] = useState(null);

  useEffect(() => {
    const fetchScreenerData = async () => {
      setLoading(true);
      const targetSymbols = ['GOTO', 'BBRI', 'BMRI', 'TLKM', 'BBCA', 'AMMN', 'BREN', 'CUAN', 'PANI', 'ASII', 'ADRO', 'PGEO', 'BRPT', 'MDKA'];
      
      try {
        const promises = targetSymbols.map(sym => fetchRealtimeData(sym));
        const results = await Promise.all(promises);
        const validData = results.filter(d => d !== null);

        const active = [...validData].sort((a, b) => b.volume - a.volume).slice(0, 5);
        setMostActive(active);

        const unusual = [...validData]
          .filter(d => d.avgVolume > 0 && d.volume > d.avgVolume * 1.5)
          .sort((a, b) => (b.volume / b.avgVolume) - (a.volume / a.avgVolume))
          .slice(0, 5);
        
        if (unusual.length === 0) {
          const relativeUnusual = [...validData]
            .filter(d => d.avgVolume > 0)
            .sort((a, b) => (b.volume / b.avgVolume) - (a.volume / a.avgVolume))
            .slice(0, 5);
          setUnusualVolume(relativeUnusual);
        } else {
          setUnusualVolume(unusual);
        }

      } catch (err) {
        console.error("Failed to fetch screener data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScreenerData();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Market Screener</h1>
          <p className="text-muted">Pusat pencarian aktivitas saham (Stock) secara real-time dan analisis sentimen.</p>
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <RefreshCw size={18} className="animate-spin" />
            <span>Scanning Market...</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
        
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Activity size={18} className="text-accent-primary" /> Most Active Stocks
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem', paddingBottom: '8px' }}>
            <div>Emiten</div>
            <div style={{ textAlign: 'right' }}>Harga</div>
            <div style={{ textAlign: 'right' }}>Volume</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {!loading && mostActive.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem' }} className="text-muted">Data tidak tersedia</div>
            ) : mostActive.map(stock => (
              <div key={stock.symbol} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', padding: '12px 0' }}>
                <div style={{ fontWeight: '500' }}>{stock.symbol}</div>
                <div style={{ textAlign: 'right' }}>
                  <div>Rp {stock.currentPrice.toLocaleString('id-ID')}</div>
                  <div style={{ fontSize: '0.75rem', color: stock.priceChange > 0 ? 'var(--positive)' : stock.priceChange < 0 ? 'var(--negative)' : 'var(--text-muted)' }}>
                    {stock.priceChange > 0 ? '+' : ''}{stock.priceChange}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>{formatVolume(stock.volume)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <AlertTriangle size={18} color="#f59e0b" /> Unusual Volume
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem', paddingBottom: '8px' }}>
            <div>Emiten</div>
            <div style={{ textAlign: 'right' }}>Vol Saat Ini</div>
            <div style={{ textAlign: 'right' }}>Lonjakan</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {!loading && unusualVolume.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem' }} className="text-muted">Data tidak tersedia</div>
            ) : unusualVolume.map(stock => {
              const surge = ((stock.volume / stock.avgVolume) * 100).toFixed(0);
              return (
                <div key={stock.symbol} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', padding: '12px 0' }}>
                  <div style={{ fontWeight: '500' }}>{stock.symbol}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{formatVolume(stock.volume)}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Avg: {formatVolume(stock.avgVolume)}</div>
                  </div>
                  <div style={{ textAlign: 'right', color: surge > 100 ? '#f59e0b' : 'var(--text-muted)', fontWeight: surge > 100 ? '600' : '400' }}>
                    {surge}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="glass-card" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', position: 'sticky', top: 0, background: 'var(--bg-secondary)', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <Calendar size={18} className="text-positive" /> Jadwal Dividen
          </h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {dividendData.map(div => (
              <div key={div.symbol} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.125rem' }}>{div.symbol}</h4>
                  <p className="text-muted" style={{ fontSize: '0.75rem', margin: '4px 0 0 0' }}>Ex-Date: {div.exDate}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: 'var(--positive)' }}>Rp {div.amount} / Lembar</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cum: {div.cumDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming IPO - FULL WIDTH */}
      <div style={{ marginTop: '1.5rem' }}>
        <div className="glass-card" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', position: 'sticky', top: 0, background: 'var(--bg-secondary)', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
            <Rocket size={18} color="#a855f7" /> Upcoming IPO & AI Analysis
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '12px' }}>
            {ipoData.map(ipo => (
              <div 
                key={ipo.name} 
                onClick={() => setExpandedIpo(expandedIpo === ipo.name ? null : ipo.name)}
                style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: expandedIpo === ipo.name ? '1px solid var(--accent-primary)' : '1px solid transparent' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>{ipo.name}</h4>
                  <span className={`badge ${ipo.recommendation === 'BUY' ? 'buy' : ipo.recommendation === 'SKIP' ? 'sell' : 'hold'}`}>{ipo.recommendation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="text-muted">{ipo.sector}</span>
                  <span>{ipo.offerPrice}</span>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem' }} className="text-muted">Target Listing: {ipo.date}</span>
                  <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    AI Score: <strong style={{ color: ipo.aiScore > 70 ? 'var(--positive)' : ipo.aiScore < 50 ? 'var(--negative)' : '#f59e0b' }}>{ipo.aiScore}/100</strong>
                  </div>
                </div>
                {/* AI Rationale (Expandable) */}
                {expandedIpo === ipo.name && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.875rem' }} className="animate-fade-in">
                    <div style={{ marginBottom: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Rocket size={14} color="var(--accent-primary)" /> Alasan AI {ipo.recommendation}:
                    </div>
                    <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{ipo.reason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;
