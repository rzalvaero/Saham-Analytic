import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Clock,
  CheckCircle2,
  Award,
  Share2,
  RefreshCw,
  BarChart3,
  Zap,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function LiveTradingDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Formatter fungsi: IDC = IDR (Rupiah) langsung tanpa dibagi 100
  const formatMoney = (val, showSign = false) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    const sign = showSign && val > 0 ? '+' : '';
    return sign + 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/trade-live');
      if (!res.ok) throw new Error('Gagal memuat live stream');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500); // 2.5s auto poll
    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Menghubungkan ke Live Stream MT5...</h3>
        <p className="text-sm text-gray-400">Mengambil data posisi aktif dan histori Exness Real</p>
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
    <div className="space-y-6 text-gray-100 font-sans">
      {/* 1. Top Header Banner */}
      <div className="rt-card relative overflow-hidden bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#0c1322] border border-gray-800 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              <span className="rt-badge rt-badge-live">
                <span className="rt-pulse-dot" />
                LIVE STREAMING MT5 REAL
              </span>
              <span className="bg-gray-800 text-gray-300 border border-gray-700/80 px-3 py-1 rounded-full text-xs font-mono">
                {account.server || 'Exness-MT5Real48'} • Login #{account.login || '452****70'} • Mata Uang: IDR (Rupiah)
              </span>
              <span className="text-xs text-gray-400 font-mono">
                ⏱️ {data?.server_time || new Date().toLocaleTimeString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ⚡ REEZ TRADE <span className="text-cyan-400 font-medium text-xl sm:text-2xl">Verified Portfolio</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Transparansi Trading Real-Time — Beekeeper Ecosystem (Koko Reza) • Akun Real Exness IDR
            </p>
          </div>

          {/* Quick Action: Share Button */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto justify-center flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4 text-white" />}
              {copied ? 'Tautan Berhasil Disalin!' : 'Bagikan Link Portfolio'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. LIMA METRIK UTAMA FINANSIAL (Sesuai Permintaan: Minus Berapa Dihapus) */}
      <div className="rt-grid-5">
        {/* Card 1: Profit Month */}
        <div className="rt-card rt-card-emerald flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider text-[11px]">
              <TrendingUp className="w-3.5 h-3.5" /> Profit Month
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
              Gross Win
            </span>
          </div>
          <div className="my-2">
            <div className="rt-metric-value font-extrabold font-mono text-emerald-400 tracking-tight">
              {formatMoney(stats.gross_profit_idc, true)}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Total keuntungan profit ({stats.month_label || 'Bulan Ini'})
            </p>
          </div>
        </div>

        {/* Card 2: Withdraw Month (Minus berapa dihapus khusus pribadi) */}
        <div className="rt-card rt-card-cyan flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-cyan-400 flex items-center gap-1 uppercase tracking-wider text-[11px]">
              <Wallet className="w-3.5 h-3.5" /> Withdraw Month
            </span>
            <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
              Bank WD
            </span>
          </div>
          <div className="my-2">
            <div className="rt-metric-value font-extrabold font-mono text-cyan-400 tracking-tight">
              {formatMoney(stats.total_wd_idc)}
            </div>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> {stats.wd_count || 1}x Sukses Cair ke Rekening
            </p>
          </div>
        </div>

        {/* Card 3: PNL Monthly */}
        <div className="rt-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-gray-300 flex items-center gap-1 uppercase tracking-wider text-[11px]">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> PNL Monthly
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Net Profit</span>
          </div>
          <div className="my-2">
            <div
              className={`rt-metric-value font-extrabold font-mono tracking-tight ${
                (stats.net_pnl_idc || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatMoney(stats.net_pnl_idc, true)}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Hasil bersih bulan berjalan</p>
          </div>
        </div>

        {/* Card 4: Saldo */}
        <div className="rt-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-gray-300 flex items-center gap-1 uppercase tracking-wider text-[11px]">
              <DollarSign className="w-3.5 h-3.5 text-purple-400" /> Saldo
            </span>
            <span className="bg-purple-500/10 text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
              Real IDR
            </span>
          </div>
          <div className="my-2">
            <div className="rt-metric-value font-extrabold font-mono text-white tracking-tight">
              {formatMoney(account.balance_idc)}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center justify-between">
              <span>Equity: {formatMoney(account.equity_idc)}</span>
            </p>
          </div>
        </div>

        {/* Card 5: Winrate */}
        <div className="rt-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-gray-300 flex items-center gap-1 uppercase tracking-wider text-[11px]">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Winrate
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Statistik</span>
          </div>
          <div className="my-2">
            <div className="rt-metric-value font-extrabold font-mono text-amber-400 tracking-tight">
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

      {/* 3. SECTION POSISI AKTIF TERBUKA (LIVE OPEN POSITIONS) */}
      <div className="rt-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              ⚡
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Posisi Aktif Terbuka (Open Trades)
                <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {positions.length} Posisi Running
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Order yang sedang aktif dieksekusi broker MetaTrader 5 saat ini
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-gray-400 block uppercase font-medium">Total Floating PnL</span>
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
            <div className="w-12 h-12 rounded-full bg-gray-900 mx-auto flex items-center justify-center text-xl mb-3 text-gray-400 border border-gray-800">
              ⚪
            </div>
            <h4 className="text-base font-semibold text-white mb-1">Semua Posisi Standby (Clear)</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Tidak ada order terbuka saat ini. Sistem menunggu konfirmasi setup sinyal EA atau manual berikutnya.
            </p>
          </div>
        ) : (
          <div className="rt-grid-3">
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
                  className={`rt-card p-4 border transition-all ${
                    isProfit
                      ? 'rt-card-emerald bg-[#0d1f1c]/80'
                      : 'rt-card-rose bg-[#1f1015]/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-base tracking-wide">
                            {p.symbol}
                          </span>
                          <span
                            className={`rt-badge ${
                              isBuy ? 'rt-badge-buy' : 'rt-badge-sell'
                            }`}
                          >
                            {p.type}
                          </span>
                          <span className="text-xs font-mono bg-gray-900 text-gray-300 px-2 py-0.5 rounded border border-gray-800">
                            {p.volume} Lot
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 font-medium">{p.strategy}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Running PnL</div>
                      <div
                        className={`text-base font-extrabold font-mono ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatMoney(p.pnl_idc, true)}
                      </div>
                    </div>
                  </div>

                  {/* Price Matrix Box */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 p-2.5 rounded-lg bg-gray-950/80 border border-gray-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Harga Entry</span>
                      <span className="text-gray-200 font-semibold">{p.price_open}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Harga Saat Ini</span>
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

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1.5 border-t border-gray-800/50">
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

      {/* 4. LEADERBOARD PER-EA & RIWAYAT WD */}
      <div className="rt-grid-split">
        {/* Leaderboard Performa EA */}
        <div className="rt-card">
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

          <div className="w-full overflow-hidden rounded-xl border border-gray-850 bg-gray-950/60">
            {/* Mobile swipe helper */}
            <div className="md:hidden flex items-center justify-between px-3 py-1.5 bg-cyan-950/40 border-b border-cyan-850/40 text-[11px] text-cyan-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="animate-pulse">👉</span> Geser tabel untuk statistik EA
              </span>
              <span className="font-mono text-[10px] bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded">SWIPE ⇄</span>
            </div>

            <div className="rt-table-scroll-x">
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
                        Belum ada data rekaman transaksi bulan ini.
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
                          className="border-b border-gray-800/40 hover:bg-gray-850/40 transition"
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
        </div>

        {/* Riwayat Penarikan Dana (Withdrawals) */}
        <div className="rt-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                  💸
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bukti Penarikan (WD)</h3>
                  <p className="text-xs text-gray-400">Bukti penarikan sukses ke rekening bank</p>
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
                    className="p-3 rounded-xl bg-gray-950/70 border border-gray-800/80 flex items-center justify-between"
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
            <span>Metode: Transfer Bank Resmi</span>
            <span className="text-gray-400 font-mono font-medium">Exness Instant</span>
          </div>
        </div>
      </div>

      {/* 5. 50 TRADE TERAKHIR SELESAI */}
      <div className="rt-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-850 border border-gray-700 flex items-center justify-center text-gray-300 font-bold">
              📜
            </div>
            <div>
              <h3 className="text-base font-bold text-white">50 Trade Terakhir Selesai</h3>
              <p className="text-xs text-gray-400">
                Riwayat eksekusi real order yang telah diselesaikan (TP / SL / Close)
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-mono">Deals OUT</span>
        </div>

        <div className="w-full overflow-hidden rounded-xl border border-gray-850 bg-gray-950/60">
          {/* Mobile swipe helper */}
          <div className="md:hidden flex items-center justify-between px-3 py-1.5 bg-cyan-950/40 border-b border-cyan-850/40 text-[11px] text-cyan-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="animate-pulse">👉</span> Geser tabel untuk detail (Lot, Strategi, Profit)
            </span>
            <span className="font-mono text-[10px] bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded">SWIPE ⇄</span>
          </div>

          <div className="rt-table-scroll-x">
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 bg-[#0c111d] border-b border-gray-800 text-gray-400 text-xs font-semibold z-10">
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
                          className="border-b border-gray-800/40 hover:bg-gray-850/40 transition font-mono text-xs"
                        >
                          <td className="py-2 px-3 text-gray-400">{h.time}</td>
                          <td className="py-2 px-3 font-semibold text-white font-sans">
                            {h.symbol}{' '}
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ml-1 ${
                                isBuy ? 'rt-badge-buy' : 'rt-badge-sell'
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
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 py-6 border-t border-gray-800/60">
        <p className="font-medium text-gray-400">
          ⚡ trade.reez.my.id — Verified Institutional Trading Stream by Beekeeper Ecosystem
        </p>
        <p className="mt-1">
          Exness Real Account (IDR) • Data tersinkronisasi otomatis langsung dari MetaTrader 5
        </p>
      </footer>
    </div>
  );
}
