import React from 'react';
import { ShieldAlert, TrendingDown, Activity, Droplets, Info, CalendarClock } from 'lucide-react';
import regime from '../data/risk_regime.json';

const ICONS = {
  Risiko: ShieldAlert,
  Volatilitas: Activity,
  Tren: TrendingDown,
  Likuiditas: Droplets,
};

const TONE = {
  rose: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  amber: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
};

const RiskRegime = () => {
  const { ihsg, msci, rebalancing, level, sumber, updatedAt, catatan } = regime;

  return (
    <div className="rt-card">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3.5 mb-4 border-b border-gray-850">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Kondisi Pasar &amp; Status Indeks</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Ringkasan risiko makro yang memengaruhi seluruh emiten
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono shrink-0">
          <CalendarClock className="w-3 h-3 text-cyan-400" />
          <span>Data per {updatedAt}</span>
        </div>
      </div>

      {/* Empat kartu level */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {level.map((item) => {
          const Icon = ICONS[item.nama] || Info;
          const tone = TONE[item.warna] || TONE.cyan;
          return (
            <div key={item.nama} className={`rounded-xl border p-3 ${tone}`}>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-90">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.nama}</span>
              </div>
              <div className="mt-1.5 text-sm font-extrabold font-mono">{item.nilai}</div>
              <p className="mt-1 text-[10px] leading-snug text-gray-400">{item.alasan}</p>
            </div>
          );
        })}
      </div>

      {/* Status MSCI + rebalancing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Status Indeks Global (MSCI)
            </span>
            <span className="rt-badge text-[9px] py-0.5 px-2 border border-amber-500/30 bg-amber-500/10 text-amber-400">
              {msci.status}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{msci.ringkas}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {msci.risiko}
            </span>
            <span className="text-[10px] text-gray-500 self-center">{msci.dampak}</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Rebalancing {rebalancing.periode}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {rebalancing.dikeluarkan} saham keluar
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {rebalancing.contoh.map((kode) => (
              <span
                key={kode}
                className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-gray-300"
              >
                {kode}
              </span>
            ))}
            <span className="text-[10px] text-gray-500 self-center">dan lainnya</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">{rebalancing.keterangan}</p>
        </div>
      </div>

      {/* Konteks IHSG */}
      <div className="mt-3 rounded-xl border border-gray-850 bg-gray-950/50 p-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono">
          <span className="text-gray-500">
            IHSG <span className="text-white font-bold">{ihsg.level.toLocaleString('id-ID')}</span>
          </span>
          <span className="text-gray-500">
            YTD <span className="text-rose-400 font-bold">{ihsg.ytdPct}%</span>
          </span>
          <span className="text-gray-500">
            1 Bulan <span className="text-rose-400 font-bold">{ihsg.sebulanPct}%</span>
          </span>
          <span className="text-gray-500">
            Regime <span className="text-rose-400 font-bold">{ihsg.regime}</span>
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400 leading-snug">{ihsg.keterangan}</p>
      </div>

      <p className="mt-3 text-[10px] text-gray-600 leading-snug flex items-start gap-1.5">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          Sumber: {sumber}. {catatan}
        </span>
      </p>
    </div>
  );
};

export default RiskRegime;
