import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Calendar, Rocket, RefreshCw, ChevronDown, ChevronUp, Layers, CheckCircle2 } from 'lucide-react';
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
];

const ipoData = [
  {
    name: 'PT Teknologi Inovasi (TEKI)',
    sector: 'Technology',
    offerPrice: 'Rp 250 - Rp 300',
    date: '2026-10-01',
    score: 85,
    status: 'BUY',
    note: 'Pertumbuhan pendapatan YoY 40% dan valuasi (PER) masih tergolong wajar untuk sektor teknologi (under-valued).'
  },
  {
    name: 'PT Sawit Hijau (SAWI)',
    sector: 'Agriculture',
    offerPrice: 'Rp 100 - Rp 120',
    date: '2026-10-15',
    score: 45,
    status: 'SKIP',
    note: 'Kas operasional negatif 3 tahun berturut-turut, mayoritas alokasi dana IPO untuk melunasi hutang modal kerja perbankan.'
  },
  {
    name: 'PT Energi Surya (SURY)',
    sector: 'Energy',
    offerPrice: 'Rp 400 - Rp 450',
    date: '2026-10-20',
    score: 92,
    status: 'BUY',
    note: 'Didukung regulasi bauran energi baru terbarukan (EBT) dan mengantongi kontrak pembangkit jangka panjang 10 tahun.'
  },
  {
    name: 'PT Logistik Maju (LMAJ)',
    sector: 'Logistics',
    offerPrice: 'Rp 150 - Rp 180',
    date: '2026-11-05',
    score: 68,
    status: 'HOLD',
    note: 'Arus kas stabil, namun margin tipis akibat kompetisi ketat di rute logistik domestik. Valuasi berada pada level fair value.'
  },
  {
    name: 'PT Sehat Sentosa (SEHT)',
    sector: 'Healthcare',
    offerPrice: 'Rp 320 - Rp 380',
    date: '2026-11-12',
    score: 78,
    status: 'BUY',
    note: 'Tingkat okupansi kamar di atas 80% dengan ROE 18%. Ekspansi unit rumah sakit baru berpotensi melipatgandakan margin EBITDA.'
  },
];

const formatVolume = (vol) => {
  if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
  if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
  if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
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
      const targetSymbols = [
        'GOTO', 'BBRI', 'BMRI', 'TLKM', 'BBCA', 'AMMN', 'BREN',
        'CUAN', 'PANI', 'ASII', 'ADRO', 'PGEO', 'BRPT', 'MDKA'
      ];

      try {
        const promises = targetSymbols.map((sym) => fetchRealtimeData(sym));
        const results = await Promise.all(promises);
        const validData = results.filter((d) => d !== null);

        const active = [...validData].sort((a, b) => b.volume - a.volume).slice(0, 6);
        setMostActive(active);

        const unusual = [...validData]
          .filter((d) => d.avgVolume > 0 && d.volume > d.avgVolume * 1.5)
          .sort((a, b) => b.volume / b.avgVolume - a.volume / a.avgVolume)
          .slice(0, 6);

        if (unusual.length === 0) {
          const relativeUnusual = [...validData]
            .filter((d) => d.avgVolume > 0)
            .sort((a, b) => b.volume / b.avgVolume - a.volume / a.avgVolume)
            .slice(0, 6);
          setUnusualVolume(relativeUnusual);
        } else {
          setUnusualVolume(unusual);
        }
      } catch (err) {
        console.error('Failed to fetch screener data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScreenerData();
  }, []);

  return (
    <div className="space-y-6 text-gray-100 font-sans">
      {/* 1. Header Banner */}
      <div className="rt-card bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#0c1322] border-gray-850 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rt-badge rt-badge-live">
                <span className="rt-pulse-dot" />
                MARKET INTELLIGENCE
              </span>
              <span className="text-xs text-gray-400 font-mono">Bursa Efek Indonesia (IDX)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              🧭 Market Screener &amp; Discovery
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Pusat screening emiten aktif, lonjakan volume tidak biasa, dividen, dan IPO baru
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono bg-cyan-950/60 border border-cyan-800/40 px-3.5 py-2 rounded-xl shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memindai Bursa...</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Top 3 Discovery Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Active Stocks */}
        <div className="rt-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-850">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Saham Teraktif (Most Active)
              </h3>
              <span className="text-[10px] bg-cyan-950/60 text-cyan-300 px-2 py-0.5 rounded font-mono">
                Volume Top
              </span>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-3 text-[11px] font-semibold text-gray-500 pb-2 border-b border-gray-850/60 uppercase">
                <span>Emiten</span>
                <span className="text-right">Harga</span>
                <span className="text-right">Volume</span>
              </div>

              <div className="divide-y divide-gray-850/40">
                {!loading && mostActive.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500">Data tidak tersedia</div>
                ) : (
                  mostActive.map((stock) => {
                    const isUp = (stock.priceChange || 0) > 0;
                    return (
                      <div key={stock.symbol} className="grid grid-cols-3 items-center py-2.5 text-xs">
                        <div className="font-bold text-white font-mono flex items-center gap-1.5">
                          {stock.symbol}
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-gray-200 font-semibold">
                            Rp {(stock.currentPrice || 0).toLocaleString('id-ID')}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              isUp ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isUp ? '+' : ''}
                            {stock.priceChange || 0}
                          </div>
                        </div>
                        <div className="text-right font-mono text-cyan-300 font-semibold">
                          {formatVolume(stock.volume || 0)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unusual Volume */}
        <div className="rt-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-850">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Lonjakan Volume Anomali
              </h3>
              <span className="text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded font-mono">
                Surge Alert
              </span>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-3 text-[11px] font-semibold text-gray-500 pb-2 border-b border-gray-850/60 uppercase">
                <span>Emiten</span>
                <span className="text-right">Volume Real</span>
                <span className="text-right">Lonjakan</span>
              </div>

              <div className="divide-y divide-gray-850/40">
                {!loading && unusualVolume.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500">Data tidak tersedia</div>
                ) : (
                  unusualVolume.map((stock) => {
                    const surge = stock.avgVolume > 0 ? ((stock.volume / stock.avgVolume) * 100).toFixed(0) : '100';
                    return (
                      <div key={stock.symbol} className="grid grid-cols-3 items-center py-2.5 text-xs">
                        <div className="font-bold text-white font-mono">{stock.symbol}</div>
                        <div className="text-right font-mono">
                          <div className="text-gray-200">{formatVolume(stock.volume || 0)}</div>
                          <div className="text-[10px] text-gray-500">
                            Avg: {formatVolume(stock.avgVolume || 0)}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              parseInt(surge) > 100
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'text-gray-400'
                            }`}
                          >
                            {surge}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Jadwal Dividen */}
        <div className="rt-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-850">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Jadwal Cum &amp; Ex Dividen
              </h3>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded font-mono">
                Cash Yield
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {dividendData.map((div) => (
                <div
                  key={div.symbol}
                  className="p-2.5 rounded-xl bg-gray-950/60 border border-gray-850/80 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white font-mono text-xs">{div.symbol}</div>
                    <div className="text-[10px] text-gray-400">Ex-Date: {div.exDate}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-emerald-400">
                      Rp {div.amount.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-gray-500">Cum: {div.cumDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Upcoming IPO — Full Width Institutional Section */}
      <div className="rt-card">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upcoming IPO &amp; Analisis Kuantitatif</h3>
              <p className="text-xs text-gray-400">
                Pencatatan perdana saham baru, estimasi harga penawaran, dan evaluasi fundamental
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/30">
            Pipeline 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ipoData.map((ipo) => {
            const isExpanded = expandedIpo === ipo.name;
            const isBuy = ipo.status === 'BUY';
            const isSkip = ipo.status === 'SKIP';

            return (
              <div
                key={ipo.name}
                onClick={() => setExpandedIpo(isExpanded ? null : ipo.name)}
                className={`p-4 rounded-xl bg-gray-950/70 border transition-all cursor-pointer ${
                  isExpanded
                    ? 'border-cyan-500 shadow-lg shadow-cyan-500/10'
                    : 'border-gray-850 hover:border-gray-750'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-sm text-white">{ipo.name}</h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border font-mono ${
                      isBuy
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : isSkip
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {ipo.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{ipo.sector}</span>
                  <span className="font-mono text-gray-200 font-semibold">{ipo.offerPrice}</span>
                </div>

                <div className="pt-2 border-t border-gray-850/80 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Listing: {ipo.date}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Skor:</span>
                    <span
                      className={`font-mono font-bold ${
                        ipo.score > 70
                          ? 'text-emerald-400'
                          : ipo.score < 50
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {ipo.score}/100
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-3 rounded-lg border border-gray-800 animate-fade-in">
                    <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Analisis Fundamental &amp; Kuantitatif:
                    </div>
                    <p className="text-[11px] text-gray-400 leading-normal">{ipo.note}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Discover;
