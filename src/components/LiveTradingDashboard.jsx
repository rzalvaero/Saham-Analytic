import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Award,
  Share2,
  Copy,
  RefreshCw,
  BarChart3,
  Layers,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function LiveTradingDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencyMode, setCurrencyMode] = useState('dual'); // 'rp' | 'idc' | 'dual'
  const [copied, setCopied] = useState(false);
  const [lastPing, setLastPing] = useState(Date.now());

  // Formatter functions
  const formatRupiah = (val, showSign = false) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    const sign = showSign && val > 0 ? '+' : '';
    return sign + 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const formatIDC = (val, showSign = false) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    const sign = showSign && val > 0 ? '+' : '';
    return sign + Math.round(val).toLocaleString('en-US') + ' IDC';
  };

  const formatMoney = (idcVal, showSign = false) => {
    if (idcVal === undefined || idcVal === null || isNaN(idcVal)) return '-';
    const rpVal = idcVal / 100.0;
    if (currencyMode === 'rp') {
      return formatRupiah(rpVal, showSign);
    } else if (currencyMode === 'idc') {
      return formatIDC(idcVal, showSign);
    } else {
      const rpStr = formatRupiah(rpVal, showSign);
      let idcShort = '';
      const absVal = Math.abs(idcVal);
      if (absVal >= 1000000) {
        idcShort = (idcVal / 1000000).toFixed(2) + 'M IDC';
      } else if (absVal >= 1000) {
        idcShort = (idcVal / 1000).toFixed(1) + 'k IDC';
      } else {
        idcShort = Math.round(idcVal) + ' IDC';
      }
      return (
        <span>
          {rpStr}{' '}
          <span className="text-xs text-gray-400 font-mono font-normal">
            ({idcShort})
          </span>
        </span>
      );
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/trade-live');
      if (!res.ok) throw new Error('Gagal mengambil data live stream');
      const json = await res.json();
      setData(json);
      setError(null);
      setLastPing(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500); // Poll tiap 2.5 detik
    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Menghubungkan ke Live Stream MT5...</h3>
        <p className="text-sm text-gray-400">Mengambil data posisi aktif dan histori transaksi Exness Cent Real</p>
      </div>
    );
  }

  const account = data?.account || {};
  const stats = data?.stats || {};
  const positions = data?.positions || [];
  const history = data?.history || [];
  const leaderboard = stats?.leaderboard || [];
  const wdList = stats?.wd_list || [];

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-100">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/60 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE EXNESS MT5 REAL
              </span>
              <span className="bg-gray-800 text-gray-300 border border-gray-700 px-3 py-1 rounded-full text-xs font-mono">
                {account.server || 'Exness-MT5Real48'} • #{account.login || '452****70'}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {data?.server_time || new Date().toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ⚡ REEZ TRADE <span className="text-cyan-400 font-normal text-xl sm:text-2xl">Institutional Portfolio</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Verifikasi & Transparansi Trading Real-Time — Beekeeper Ecosystem (Koko Reza)
            </p>
          </div>

          {/* Controls: Currency switcher & Share button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center bg-gray-950/80 p-1 rounded-xl border border-gray-800 text-xs font-medium">
              <button
                onClick={() => setCurrencyMode('rp')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currencyMode === 'rp'
                    ? 'bg-cyan-500 text-gray-950 font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Rupiah (Rp)
              </button>
              <button
                onClick={() => setCurrencyMode('idc')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currencyMode === 'idc'
                    ? 'bg-cyan-500 text-gray-950 font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Cent (IDC)
              </button>
              <button
                onClick={() => setCurrencyMode('dual')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currencyMode === 'dual'
                    ? 'bg-cyan-500 text-gray-950 font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Dual (Keduanya)
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
              {copied ? 'Tersalin!' : 'Bagikan'}
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Executive Metric Cards (User Requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Bulan Ini Dapat Berapa */}
        <div className="bg-gray-900/70 border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> BULAN INI DAPAT
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
              Gross Profit
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 tracking-tight">
              {formatMoney(stats.gross_profit_idc, true)}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Total keuntungan trade menang ({stats.month_label || 'Bulan Ini'})
            </p>
          </div>
        </div>

        {/* Card 2: Minus Berapa */}
        <div className="bg-gray-900/70 border border-rose-500/30 rounded-2xl p-4 relative overflow-hidden backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="font-semibold text-rose-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> MINUS BERAPA
            </span>
            <span className="bg-rose-500/10 text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
              Total Loss
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-rose-400 tracking-tight">
              {formatMoney(-Math.abs(stats.total_loss_idc || 0))}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Total proteksi SL & trade cutloss ({stats.month_label || 'Bulan Ini'})
            </p>
          </div>
        </div>

        {/* Card 3: Udah WD Berapa */}
        <div className="bg-gray-900/70 border border-cyan-500/30 rounded-2xl p-4 relative overflow-hidden backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="font-semibold text-cyan-400 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> UDAH WD BERAPA
            </span>
            <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
              Bank Payout
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-400 tracking-tight">
              {formatMoney(stats.total_wd_idc)}
            </div>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> {stats.wd_count || 1}x Sukses Cair ke Rekening
            </p>
          </div>
        </div>

        {/* Card 4: Net PnL Bulan Ini */}
        <div className="bg-gray-900/70 border border-gray-700/60 rounded-2xl p-4 relative overflow-hidden backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="font-semibold text-gray-300 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" /> NET PNL BULAN INI
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Net Profit</span>
          </div>
          <div className="my-2">
            <div
              className={`text-xl sm:text-2xl font-extrabold font-mono tracking-tight ${
                (stats.net_pnl_idc || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatMoney(stats.net_pnl_idc, true)}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Hasil bersih setelah profit & loss</p>
          </div>
        </div>

        {/* Card 5: Saldo & Equity */}
        <div className="bg-gray-900/70 border border-gray-700/60 rounded-2xl p-4 relative overflow-hidden backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="font-semibold text-gray-300 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> SALDO & EQUITY
            </span>
            <span className="bg-purple-500/10 text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
              Live Modal
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-white tracking-tight">
              {formatMoney(account.balance_idc)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5 flex items-center justify-between">
              <span>Equity: {formatMoney(account.equity_idc)}</span>
            </div>
          </div>
        </div>

        {/* Card 6: Winrate & PF */}
        <div className="bg-gray-900/70 border border-gray-700/60 rounded-2xl p-4 relative overflow-hidden backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="font-semibold text-gray-300 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> WIN RATE & PF
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Metrik</span>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-400 tracking-tight">
              {stats.winrate_pct || 0}%{' '}
              <span className="text-xs text-gray-400 font-normal font-sans">
                (PF {stats.profit_factor || 0})
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {stats.win_count || 0}W / {stats.loss_count || 0}L ({stats.total_trades || 0} total)
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: POSISI AKTIF TERBUKA (LIVE OPEN POSITIONS) */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Posisi Aktif Terbuka
                <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
                  {positions.length} Posisi Running
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Data ditarik langsung tiap detik dari memori terminal MT5
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 block">Total Floating PnL</span>
            <span
              className={`text-base sm:text-lg font-extrabold font-mono ${
                (account.floating_idc || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatMoney(account.floating_idc, true)}
            </span>
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-800 bg-gray-950/40">
            <div className="w-12 h-12 rounded-full bg-gray-800/80 mx-auto flex items-center justify-center text-xl mb-3 text-gray-400">
              ⚪
            </div>
            <h4 className="text-base font-semibold text-white mb-1">Semua Posisi Clear (Standby)</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Tidak ada order yang sedang terbuka saat ini. Bot dan trader sedang menunggu konfirmasi setup sinyal berikutnya.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {positions.map((p) => {
              const isBuy = p.type === 'BUY';
              const isProfit = p.pnl_idc >= 0;
              let icon = '📊';
              if (p.symbol.includes('XAU')) icon = '🪙';
              else if (p.symbol.includes('BTC')) icon = '₿';
              else if (p.symbol.includes('OIL')) icon = '🛢️';

              return (
                <div
                  key={p.ticket}
                  className={`p-4 rounded-xl border transition-all ${
                    isProfit
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-base tracking-wide">
                            {p.symbol}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-extrabold ${
                              isBuy
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {p.type}
                          </span>
                          <span className="text-xs font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">
                            {p.volume} Lot
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{p.strategy}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 uppercase">Floating</div>
                      <div
                        className={`text-base font-extrabold font-mono ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatMoney(p.pnl_idc, true)}
                      </div>
                    </div>
                  </div>

                  {/* Price Grid */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-lg bg-gray-900/80 border border-gray-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Harga Entry</span>
                      <span className="text-gray-200 font-semibold">{p.price_open}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Harga Sekarang</span>
                      <span className="text-cyan-300 font-semibold">{p.price_current}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Stop Loss (SL)</span>
                      <span className={p.sl > 0 ? 'text-rose-300 font-semibold' : 'text-gray-600'}>
                        {p.sl > 0 ? p.sl : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Take Profit (TP)</span>
                      <span className={p.tp > 0 ? 'text-emerald-300 font-semibold' : 'text-gray-600'}>
                        {p.tp > 0 ? p.tp : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-800/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      Aktif {p.duration} ({p.open_time})
                    </span>
                    <span className="font-mono text-gray-500">#{p.ticket}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2 & 3: LEADERBOARD PER-EA & RIWAYAT WITHDRAWAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Performa EA (2 Cols) */}
        <div className="lg:col-span-2 bg-gray-900/70 border border-gray-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                🏆
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Peringkat Performa EA & Strategi</h3>
                <p className="text-xs text-gray-400">
                  Evaluasi live per-EA (Mana yang paling profit vs mana yang perlu optimasi)
                </p>
              </div>
            </div>
            <span className="text-xs text-gray-400 font-mono">{stats.month_label}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs font-semibold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Strategi / EA</th>
                  <th className="py-2.5 px-3">Trade (W/L)</th>
                  <th className="py-2.5 px-3">Win Rate</th>
                  <th className="py-2.5 px-3">Profit Factor</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-500">
                      Belum ada rekaman trade di bulan ini.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item, idx) => {
                    let rankBadge = (
                      <span className="w-5 h-5 rounded-full bg-gray-800 text-gray-300 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                    );
                    if (idx === 0) rankBadge = <span className="text-base">🥇</span>;
                    else if (idx === 1) rankBadge = <span className="text-base">🥈</span>;
                    else if (idx === 2) rankBadge = <span className="text-base">🥉</span>;

                    const isProf = item.net_idc >= 0;
                    return (
                      <tr
                        key={item.name}
                        className="border-b border-gray-800/40 hover:bg-gray-800/30 transition"
                      >
                        <td className="py-2.5 px-3">{rankBadge}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{item.name}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-300">
                          {item.trades}{' '}
                          <span className="text-[11px] text-gray-500">
                            ({item.wins}W / {item.losses}L)
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 font-mono font-semibold ${
                            item.winrate_pct >= 50 ? 'text-emerald-400' : 'text-gray-300'
                          }`}
                        >
                          {item.winrate_pct}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300">
                          {item.profit_factor}
                        </td>
                        <td
                          className={`py-2.5 px-3 font-mono font-bold text-right ${
                            isProf ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatMoney(item.net_idc, true)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Riwayat Penarikan Dana (Withdrawals) (1 Col) */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                  💸
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Riwayat Penarikan (WD)</h3>
                  <p className="text-xs text-gray-400">Bukti dana berhasil ditarik ke bank</p>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            {wdList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                Belum ada transaksi penarikan dana di bulan ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {wdList.map((w) => (
                  <div
                    key={w.ticket}
                    className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Transfer Bank Sukses
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {w.time} • #{w.ticket}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-cyan-400">
                        {formatMoney(w.amount_idc)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">Terkonfirmasi</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800/60 text-xs text-gray-500 flex items-center justify-between">
            <span>Metode WD: Rekening Bank Resmi</span>
            <span className="text-gray-400 font-mono">Exness Instant</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: 50 TRANSAKSI TERAKHIR DITUTUP (CLOSED DEALS) */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 font-bold">
              📜
            </div>
            <div>
              <h3 className="text-base font-bold text-white">50 Trade Terakhir Ditutup</h3>
              <p className="text-xs text-gray-400">
                Riwayat eksekusi real order yang telah diselesaikan (TP / SL / Close)
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-mono">Real Deals OUT</span>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800 text-gray-400 text-xs font-semibold z-10">
              <tr>
                <th className="py-2.5 px-3">Waktu (WIB)</th>
                <th className="py-2.5 px-3">Pair & Tipe</th>
                <th className="py-2.5 px-3">Ukuran Lot</th>
                <th className="py-2.5 px-3">Strategi</th>
                <th className="py-2.5 px-3 text-right">Harga Close</th>
                <th className="py-2.5 px-3 text-right">Profit Bersih</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    Belum ada rekaman riwayat transaksi tertutup.
                  </td>
                </tr>
              ) : (
                history.map((h) => {
                  const isBuy = h.type === 'BUY';
                  const isProf = h.net_idc >= 0;
                  return (
                    <tr
                      key={h.ticket}
                      className="border-b border-gray-800/40 hover:bg-gray-800/30 transition font-mono text-xs"
                    >
                      <td className="py-2 px-3 text-gray-400">{h.time}</td>
                      <td className="py-2 px-3 font-semibold text-white font-sans">
                        {h.symbol}{' '}
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ml-1 ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {h.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-300">{h.volume} Lot</td>
                      <td className="py-2 px-3 text-gray-400 font-sans">{h.strategy}</td>
                      <td className="py-2 px-3 text-gray-300 text-right">{h.price}</td>
                      <td
                        className={`py-2 px-3 font-bold text-right ${
                          isProf ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatMoney(h.net_idc, true)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-800/60">
        <p>
          ⚡ trade.reez.my.id — Verified Read-Only Trading Stream powered by Beekeeper Ecosystem & Exness MT5 Real.
        </p>
        <p className="mt-1">
          Formula Akun Cent: 100 IDC = Rp 1 (IDR) • Seluruh data tersinkronisasi otomatis dari terminal MetaTrader 5.
        </p>
      </div>
    </div>
  );
}
