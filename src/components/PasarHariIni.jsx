import React, { useState, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Banknote,
  Info,
  RefreshCw,
} from 'lucide-react';
import data from '../data/pasar_hari_ini.json';

const fmtNum = (v) => {
  if (v >= 1e12) return (v / 1e12).toFixed(2) + ' T';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + ' M';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + ' Jt';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + ' Rb';
  return v > 0 ? v.toLocaleString('id-ID') : '-';
};

const fmtPrice = (v) => {
  if (v == null) return '-';
  return v.toLocaleString('id-ID', { maximumFractionDigits: 0 });
};

const fmtPct = (v) => `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`;

const TABS = [
  { id: 'naik', label: 'Naik', icon: TrendingUp },
  { id: 'turun', label: 'Turun', icon: TrendingDown },
  { id: 'volume', label: 'Volume', icon: BarChart2 },
  { id: 'nilai', label: 'Nilai', icon: Banknote },
];

const PasarHariIni = () => {
  const [tab, setTab] = useState('naik');

  const breadth = data.breadth || { naik: 0, tetap: 0, turun: 0 };
  const total = breadth.naik + breadth.tetap + breadth.turun || 1;
  const pctNaik = (breadth.naik / total) * 100;
  const pctTetap = (breadth.tetap / total) * 100;
  const pctTurun = (breadth.turun / total) * 100;

  const ihsg = data.ihsg;
  const ihsgUp = ihsg ? ihsg.change >= 0 : false;

  const rows = useMemo(() => {
    const list = data[tab] || [];
    return list.map((r) => ({
      ...r,
      // Kolom metrik menyesuaikan tab: volume -> Volume, nilai -> Nilai
      metric:
        tab === 'volume' ? fmtNum(r.volume) : tab === 'nilai' ? fmtNum(r.value) : fmtPct(r.pct),
      isUp: r.change > 0,
    }));
  }, [tab]);

  const barDate = data.barDate
    ? new Date(data.barDate + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="space-y-4">
      {/* ===== Header: IHSG + Breadth ===== */}
      <div className="rt-card border-cyan-500/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Pasar Hari Ini
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-xs font-semibold text-gray-500">IHSG</span>
              <span className="rt-metric-value font-extrabold font-mono text-white">
                {ihsg ? fmtPrice(ihsg.last) : '—'}
              </span>
              {ihsg && (
                <span
                  className={`text-sm font-bold font-mono ${
                    ihsgUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {fmtPct(ihsg.pct)}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[10px] text-gray-500">
              Penutupan {barDate}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Emiten Dipantau</div>
            <div className="mt-0.5 font-mono text-lg font-extrabold text-white">
              {data.tradedEmiten}
            </div>
            <div className="text-[10px] text-gray-500">
              dari {data.totalEmiten} terdaftar
            </div>
          </div>
        </div>

        {/* Breadth bar */}
        <div className="mt-4">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div className="bg-emerald-500" style={{ width: `${pctNaik}%` }} />
            <div className="bg-gray-600" style={{ width: `${pctTetap}%` }} />
            <div className="bg-rose-500" style={{ width: `${pctTurun}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
            <span className="text-emerald-400">
              {breadth.naik} naik
            </span>
            <span className="text-gray-400">
              {breadth.tetap} tetap
            </span>
            <span className="text-rose-400">
              {breadth.turun} turun
            </span>
            <span className="ml-auto text-gray-500">
              {pctNaik.toFixed(0)}% / {pctTurun.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* ===== Tabel Top Mover ===== */}
      <div className="rt-card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="rt-table-scroll-x">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase tracking-wider text-gray-500">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-3">Kode</th>
                <th className="py-2 pr-3">Nama Perusahaan</th>
                <th className="py-2 pr-3 text-right">Harga</th>
                <th className="py-2 pr-3 text-right">%</th>
                <th className="py-2 text-right">
                  {tab === 'volume' ? 'Volume' : tab === 'nilai' ? 'Nilai' : 'Volume'}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.code}
                  className="border-b border-gray-900/70 last:border-0 hover:bg-gray-900/50"
                >
                  <td className="py-1.5 pr-2 font-mono text-gray-600">{i + 1}</td>
                  <td className="py-1.5 pr-3 font-mono font-bold text-white">{r.code}</td>
                  <td className="py-1.5 pr-3 text-gray-400 max-w-[220px] truncate">
                    {r.name || '-'}
                  </td>
                  <td className="py-1.5 pr-3 text-right font-mono text-gray-200">
                    {fmtPrice(r.price)}
                  </td>
                  <td
                    className={`py-1.5 pr-3 text-right font-mono font-bold ${
                      r.isUp ? 'text-emerald-400' : r.change < 0 ? 'text-rose-400' : 'text-gray-400'
                    }`}
                  >
                    {fmtPct(r.pct)}
                  </td>
                  <td className="py-1.5 text-right font-mono text-gray-400">
                    {tab === 'volume'
                      ? fmtNum(r.volume)
                      : tab === 'nilai'
                      ? fmtNum(r.value)
                      : fmtNum(r.volume)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    Data belum tersedia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Catatan kejujuran data ===== */}
      <div className="rt-card border-gray-800">
        <div className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-600" />
          <div>
            <span className="font-semibold text-gray-400">Sumber & batasan:</span>{' '}
            {data.source}. Breadth dihitung hanya dari emiten yang benar-benar
            bertransaksi pada hari tersebut. Snapshot diambil saat panel dibangun
            ({new Date(data.generatedAt).toLocaleString('id-ID')} WIB) — panel ini
            menampilkan data penutupan, bukan streaming per detik.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasarHariIni;
