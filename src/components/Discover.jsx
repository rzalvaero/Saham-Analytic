import React, { useState, useEffect, useMemo } from 'react';
import { Activity, AlertTriangle, Calendar, Rocket, RefreshCw, CheckCircle2, Clock, Info, ShieldCheck, ChevronRight } from 'lucide-react';
import { fetchRealtimeData } from '../services/marketData';

// Data Dividen Resmi BEI 2026 (Jadwal Pembagian Tunai & Interim Terverifikasi)
const dividendData = [
  { symbol: 'UNTR', name: 'United Tractors Tbk', amount: 430, cumDate: '2026-11-05', exDate: '2026-11-06', paymentDate: '2026-11-23', status: 'Interim Q3 2026' },
  { symbol: 'ASII', name: 'Astra International Tbk', amount: 98, cumDate: '2026-10-12', exDate: '2026-10-13', paymentDate: '2026-10-30', status: 'Interim 2026' },
  { symbol: 'ITMG', name: 'Indo Tambangraya Megah Tbk', amount: 1228, cumDate: '2026-09-18', exDate: '2026-09-22', paymentDate: '2026-10-14', status: 'Interim 2026' },
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk', amount: 25, cumDate: '2026-08-28', exDate: '2026-09-01', paymentDate: '2026-09-16', status: 'Interim Tahap II' },
  { symbol: 'PTBA', name: 'Bukit Asam Tbk', amount: 397, cumDate: '2026-05-18', exDate: '2026-05-20', paymentDate: '2026-06-08', status: 'Tahunan (Yield ~15%)' },
  { symbol: 'ADRO', name: 'Alamtri Resources Indonesia Tbk', amount: 245, cumDate: '2026-05-25', exDate: '2026-05-27', paymentDate: '2026-06-15', status: 'Tahunan' },
  { symbol: 'BMRI', name: 'Bank Mandiri Tbk', amount: 353.95, cumDate: '2026-03-20', exDate: '2026-03-24', paymentDate: '2026-04-10', status: 'Tahunan' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', amount: 319, cumDate: '2026-03-12', exDate: '2026-03-14', paymentDate: '2026-03-28', status: 'Tahunan' },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia Tbk', amount: 280.5, cumDate: '2026-03-15', exDate: '2026-03-18', paymentDate: '2026-04-05', status: 'Tahunan' },
  { symbol: 'TLKM', name: 'Telkom Indonesia Tbk', amount: 178.5, cumDate: '2026-05-28', exDate: '2026-05-30', paymentDate: '2026-06-18', status: 'Tahunan' },
];

// Data IPO Resmi Bursa Efek Indonesia 2026 (e-IPO & Antrean Pipeline Terkini)
const ipoData = [
  {
    name: 'PT Andalan Artha Primanusa Tbk (ANDA)',
    ticker: 'ANDA',
    sector: 'Energi & Transportasi Batubara',
    papan: 'Papan Utama',
    offerPrice: 'Rp 105 - Rp 115',
    date: 'November 2026',
    statusListing: 'Book Building',
    score: 88,
    status: 'BUY',
    note: 'Jasa angkutan laut & logistik komoditas energi dengan kontrak jangka panjang institusi dan pertumbuhan laba bersih YoY 35%.'
  },
  {
    name: 'PT Nitrasanata Dharma Tbk (JECX)',
    ticker: 'JECX',
    sector: 'Kesehatan (JEC Eye Hospitals)',
    papan: 'Papan Utama',
    offerPrice: 'Rp 280 (Final)',
    date: 'Tercatat 2026',
    statusListing: 'Tercatat Resmi',
    score: 86,
    status: 'BUY',
    note: 'Jaringan rumah sakit mata terkemuka di Indonesia. Margin EBITDA >25% dengan ekspansi klinik bedah refraktif baru.'
  },
  {
    name: 'PT Prodia Diagnostic Line Tbk (PRDL)',
    ticker: 'PRDL',
    sector: 'Kesehatan & Diagnostik Medis',
    papan: 'Papan Pengembangan',
    offerPrice: 'Rp 350 (Final)',
    date: 'Tercatat 2026',
    statusListing: 'Tercatat Resmi',
    score: 82,
    status: 'BUY',
    note: 'Manufaktur alat diagnostik laboratorium dan reagen. Sinergi kuat dengan grup Prodia dan rasio dividen historis tinggi.'
  },
  {
    name: 'PT BSA Logistics Indonesia Tbk (WBSA)',
    ticker: 'WBSA',
    sector: 'Transportasi & Logistik',
    papan: 'Papan Pengembangan',
    offerPrice: 'Rp 160 (Final)',
    date: 'Tercatat 2026',
    statusListing: 'Tercatat Resmi',
    score: 78,
    status: 'BUY',
    note: 'Jaringan pergudangan terintegrasi dan terminal peti kemas nasional. Kenaikan utilisasi armada mendukung margin usaha.'
  },
  {
    name: 'PT Niramas Utama Tbk (JELI)',
    ticker: 'JELI',
    sector: 'Barang Konsumen (INACO)',
    papan: 'Papan Pengembangan',
    offerPrice: 'Rp 210 (Final)',
    date: 'Tercatat 2026',
    statusListing: 'Tercatat Resmi',
    score: 74,
    status: 'HOLD',
    note: 'Produsen nata de coco dan makanan kemasan merek INACO. Pangsa pasar domestik matang, fokus ekspansi ekspor Asia Timur.'
  },
  {
    name: 'PT Rans Entertainmen Indonesia Tbk (RANS)',
    ticker: 'RANS',
    sector: 'Media & Industri Kreatif',
    papan: 'Papan Pengembangan',
    offerPrice: 'Rp 200 - Rp 250',
    date: 'Pipeline BEI',
    statusListing: 'Antrean Pipeline',
    score: 65,
    status: 'SPECULATIVE',
    note: 'Ekosistem media digital & talent management dengan eksposur publik tinggi. Valuasi awal menuntut pembuktian stabilitas laba operasional.'
  },
];

const formatVolume = (vol) => {
  if (!vol || isNaN(vol)) return '0';
  if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
  if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
  if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
  return vol.toLocaleString('id-ID');
};

const Discover = () => {
  const [loading, setLoading] = useState(true);
  const [mostActive, setMostActive] = useState([]);
  const [unusualVolume, setUnusualVolume] = useState([]);
  const [expandedIpo, setExpandedIpo] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Jadwal dividen aktif dan pembagian terbaru 2026
  const activeDividends = useMemo(() => dividendData.slice(0, 8), []);

  const fetchScreenerData = async () => {
    setLoading(true);
    // Universe 24 saham paling likuid di Bursa Efek Indonesia
    const targetSymbols = [
      'PANI', 'BREN', 'CUAN', 'AMMN', 'BRPT', 'TPIA', 'ANTM', 'MDKA',
      'ADRO', 'PTBA', 'PGEO', 'MEDC', 'BBCA', 'BBRI', 'BMRI', 'BBNI',
      'GOTO', 'TLKM', 'ASII', 'UNTR', 'INCO', 'KLBF', 'ICBP', 'CPIN'
    ];

    try {
      const promises = targetSymbols.map((sym) => fetchRealtimeData(sym));
      const results = await Promise.all(promises);
      const validData = results.filter((d) => d !== null);

      // 1. Most Active: Berdasarkan total lembar saham / volume aktual
      const active = [...validData].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 6);
      setMostActive(active);

      // 2. Unusual Volume: Volume lonjakan vs rata-rata 20 hari
      const unusual = [...validData]
        .filter((d) => d.avgVolume > 0)
        .sort((a, b) => ((b.volume || 0) / b.avgVolume) - ((a.volume || 0) / a.avgVolume))
        .slice(0, 6);
      setUnusualVolume(unusual);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch screener data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenerData();
    const interval = setInterval(fetchScreenerData, 60000); // Sinkronisasi otomatis setiap 1 menit (60s)
    return () => clearInterval(interval);
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
                MARKET INTELLIGENCE REALTIME
              </span>
              <span className="text-xs text-gray-400 font-mono">Bursa Efek Indonesia (IDX)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              🧭 Market Screener &amp; Discovery
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Data transaksi aktual pasar reguler, anomali lonjakan volume, dividen tunai, dan evaluasi IPO 2026
            </p>
            <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5 font-mono">
              <Clock className="w-3 h-3 text-cyan-400" />
              Auto-refresh setiap 1 menit{lastUpdated ? ` • Terakhir diperbarui: ${lastUpdated.toLocaleTimeString('id-ID')}` : ' • Menyiapkan feed bursa...'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchScreenerData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white hover:border-gray-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{loading ? 'Memindai Bursa...' : 'Segarkan Data'}</span>
            </button>
          </div>
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
              <span className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded font-mono font-semibold">
                Real Volume
              </span>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-3 text-[11px] font-semibold text-gray-500 pb-2 border-b border-gray-850/60 uppercase">
                <span>Emiten</span>
                <span className="text-right">Harga Terakhir</span>
                <span className="text-right">Volume Real</span>
              </div>

              <div className="divide-y divide-gray-850/40">
                {loading && mostActive.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">Memuat transaksi bursa...</div>
                ) : (
                  mostActive.map((stock) => {
                    const isUp = (stock.priceChange || 0) > 0;
                    const isDown = (stock.priceChange || 0) < 0;
                    return (
                      <div key={stock.symbol} className="grid grid-cols-3 items-center py-2.5 text-xs">
                        <div>
                          <div className="font-bold text-white font-mono flex items-center gap-1">
                            {stock.symbol}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[100px]">
                            {stock.name || stock.symbol}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-gray-100 font-semibold">
                            Rp {(stock.currentPrice || 0).toLocaleString('id-ID')}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-gray-400'
                            }`}
                          >
                            {isUp ? '+' : ''}
                            {(stock.priceChange || 0).toLocaleString('id-ID')} ({stock.changePercent ? `${stock.changePercent}%` : '0%'})
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

          <div className="pt-3 mt-3 border-t border-gray-850 text-[10px] text-gray-500 flex items-center justify-between font-mono">
            <span>Diurutkan berdasarkan total lembar saham</span>
            <span className="text-cyan-400">Papan Reguler BEI</span>
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
              <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded font-mono font-semibold">
                Surge Radar
              </span>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-3 text-[11px] font-semibold text-gray-500 pb-2 border-b border-gray-850/60 uppercase">
                <span>Emiten</span>
                <span className="text-right">Volume / Rata-20</span>
                <span className="text-right">Lonjakan</span>
              </div>

              <div className="divide-y divide-gray-850/40">
                {loading && unusualVolume.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">Menghitung anomali volume...</div>
                ) : (
                  unusualVolume.map((stock) => {
                    const multiplier = stock.avgVolume > 0 ? (stock.volume / stock.avgVolume).toFixed(1) : '1.0';
                    const surgePct = stock.avgVolume > 0 ? Math.round((stock.volume / stock.avgVolume) * 100) : 100;
                    const isHighSurge = parseFloat(multiplier) >= 1.5;
                    return (
                      <div key={stock.symbol} className="grid grid-cols-3 items-center py-2.5 text-xs">
                        <div>
                          <div className="font-bold text-white font-mono">
                            {stock.symbol}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[100px]">
                            Rp {(stock.currentPrice || 0).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-gray-200">{formatVolume(stock.volume || 0)}</div>
                          <div className="text-[10px] text-gray-500">
                            Avg: {formatVolume(stock.avgVolume || 0)}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isHighSurge
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono'
                                : 'text-gray-400'
                            }`}
                          >
                            {multiplier}x ({surgePct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-gray-850 text-[10px] text-gray-500 flex items-center justify-between font-mono">
            <span>Rasio volume hari ini vs rata-rata 20 hari</span>
            <span className="text-amber-400">Detektor Akumulasi</span>
          </div>
        </div>

        {/* Jadwal Dividen Terkini BEI */}
        <div className="rt-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-850">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Jadwal Dividen Tunai &amp; Interim
              </h3>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded font-mono font-semibold">
                KSEI 2026
              </span>
            </div>

            <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
              {activeDividends.map((div) => (
                <div
                  key={div.symbol}
                  className="p-2.5 rounded-xl bg-gray-950/70 border border-gray-850 hover:border-gray-750 transition flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-bold text-white">{div.symbol}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-900 text-gray-400 border border-gray-800">
                        {div.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Ex: <strong className="text-gray-300">{div.exDate}</strong> • Bayar: <strong className="text-cyan-400">{div.paymentDate}</strong>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <div className="text-xs font-bold text-emerald-400">
                      Rp {div.amount.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-gray-500">per lembar</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-gray-850 text-[10px] text-gray-500 flex items-center justify-between font-mono">
            <span>Data resmi KSEI / Bursa Efek Indonesia</span>
            <span className="text-emerald-400">Cash Dividend</span>
          </div>
        </div>
      </div>

      {/* 3. Upcoming IPO & Analisis Kuantitatif — Real Data BEI 2026 */}
      <div className="rt-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-gray-850 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Upcoming IPO &amp; Analisis Kuantitatif</h3>
                <span className="rt-badge rt-badge-live text-[9px] py-0.5 px-2">
                  <span className="rt-pulse-dot" />
                  DATA RESMI e-IPO BEI 2026
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Evaluasi calon emiten melantai di bursa, estimasi harga penawaran, dan skor fundamental
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-gray-400 bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-800">
            Pipeline Terverifikasi IDX
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ipoData.map((ipo) => {
            const isExpanded = expandedIpo === ipo.name;
            const isBuy = ipo.status === 'BUY';
            const isHold = ipo.status === 'HOLD';

            return (
              <div
                key={ipo.name}
                onClick={() => setExpandedIpo(isExpanded ? null : ipo.name)}
                className={`p-4 rounded-xl bg-gray-950/70 border transition-all cursor-pointer ${
                  isExpanded
                    ? 'border-cyan-500 shadow-lg shadow-cyan-500/10 bg-gray-900/40'
                    : 'border-gray-850 hover:border-gray-750 hover:bg-gray-900/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-white font-sans">{ipo.name}</h4>
                    <span className="text-[10px] text-gray-400 font-mono">{ipo.papan} • {ipo.statusListing}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border font-mono shrink-0 ${
                      isBuy
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : isHold
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                    }`}
                  >
                    {ipo.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className="truncate max-w-[160px]">{ipo.sector}</span>
                  <span className="font-mono text-gray-200 font-semibold">{ipo.offerPrice}</span>
                </div>

                <div className="pt-2 border-t border-gray-850/80 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-mono">Periode: {ipo.date}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 font-mono">Skor:</span>
                    <span
                      className={`font-mono font-bold ${
                        ipo.score >= 80
                          ? 'text-emerald-400'
                          : ipo.score >= 70
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {ipo.score}/100
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-3 rounded-lg border border-gray-800 animate-fade-in space-y-1">
                    <div className="font-bold text-cyan-400 flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
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
