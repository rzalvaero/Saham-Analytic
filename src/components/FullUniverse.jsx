import React, { useState } from 'react';
import {
  Globe2,
  CircleCheck,
  TriangleAlert,
  ChevronDown,
  ShieldCheck,
  Trophy,
  Info,
} from 'lucide-react';
import val from '../data/validate_full.json';
import universe from '../data/universe_idx.json';

const pct = (v, d = 1) => `${v > 0 ? '+' : ''}${Number(v).toFixed(d)}%`;
const tone = (v) => (v > 0 ? 'text-emerald-400' : v < 0 ? 'text-rose-400' : 'text-gray-400');

const Stat = ({ label, value, sub, toneCls = 'text-white' }) => (
  <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
      {label}
    </div>
    <div className={`mt-1 text-lg font-extrabold font-mono ${toneCls}`}>{value}</div>
    {sub && <div className="mt-0.5 text-[10px] text-gray-500">{sub}</div>}
  </div>
);

const FullUniverse = () => {
  const [open, setOpen] = useState('top20 LB126');
  const core = val.neighbors.find((n) => n.name === val.coreCandidate);
  const totalTrades = core ? core.folds.reduce((a, f) => a + f.trades, 0) : 0;

  return (
    <div className="rt-card">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3.5 mb-4 border-b border-gray-850">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Riset Universe Penuh IDX
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {universe.withData} emiten terdaftar, {val.method.liquid} lolos filter likuiditas
            </p>
          </div>
        </div>
        <span
          className={`self-start sm:self-auto text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${
            val.verdict === 'LAYAK'
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
          }`}
        >
          {val.verdict}
        </span>
      </div>

      {/* Kenapa universe penuh berbeda */}
      <div className="rounded-xl border border-gray-850 bg-gray-950/60 p-3 mb-4">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Riset awal memakai 32 blue chip dan gagal total. Dengan{' '}
          <strong className="text-gray-200">{universe.withData} emiten</strong> dan filter
          likuiditas (nilai transaksi minimal Rp 1 miliar/hari), hasilnya berubah:
          momentum lintas-saham akhirnya bertahan di uji bergulir.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-gray-400">
            {universe.listedCodes} kode terdaftar
          </span>
          <span className="px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-gray-400">
            {universe.withData} punya data
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            {val.method.liquid} likuid
          </span>
          <span className="px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-gray-500">
            {universe.withoutData} tanpa data
          </span>
        </div>
      </div>

      {/* Metrik inti */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Total Transaksi" value={totalTrades} sub="4 fold, 4 tahun" />
        <Stat
          label="Fold Untung"
          value={`${core?.profitableFolds ?? 0}/4`}
          toneCls="text-emerald-400"
          sub="rolling walk-forward"
        />
        <Stat
          label="Rata-rata PF"
          value={(core?.avgPf ?? 0).toFixed(2)}
          toneCls="text-emerald-400"
          sub="profit factor agregat"
        />
        <Stat
          label="Kalahkan Bench"
          value={`${core?.beatBenchFolds ?? 0}/4`}
          toneCls="text-amber-400"
          sub="vs equal-weight likuid"
        />
      </div>

      {/* Tabel per fold kandidat inti */}
      <div className="rounded-xl border border-gray-850 bg-gray-950/50 overflow-hidden mb-3">
        <div className="px-3 py-2 border-b border-gray-850 flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold text-white">
            Kandidat inti: Momentum TOP20, lookback 126 hari
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] whitespace-nowrap font-mono">
            <thead>
              <tr className="text-gray-500 uppercase text-[9px] tracking-wider">
                <th className="py-1.5 pl-3 pr-2 font-semibold">Periode</th>
                <th className="py-1.5 px-2 font-semibold text-right">Trade</th>
                <th className="py-1.5 px-2 font-semibold text-right">PF</th>
                <th className="py-1.5 px-2 font-semibold text-right">Net</th>
                <th className="py-1.5 px-2 font-semibold text-right">DD</th>
                <th className="py-1.5 px-2 font-semibold text-right">WR</th>
                <th className="py-1.5 pr-3 pl-2 font-semibold text-right">Bench</th>
              </tr>
            </thead>
            <tbody>
              {core?.folds.map((f) => (
                <tr key={f.period} className="border-t border-gray-850/60">
                  <td className="py-1.5 pl-3 pr-2 text-gray-300">{f.period}</td>
                  <td className="py-1.5 px-2 text-right text-gray-400">{f.trades}</td>
                  <td className="py-1.5 px-2 text-right text-emerald-400">
                    {f.pf.toFixed(2)}
                  </td>
                  <td className={`py-1.5 px-2 text-right font-semibold ${tone(f.net)}`}>
                    {pct(f.net)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-rose-400/80">
                    {f.dd.toFixed(1)}%
                  </td>
                  <td className="py-1.5 px-2 text-right text-gray-400">
                    {f.wr.toFixed(0)}%
                  </td>
                  <td className={`py-1.5 pr-3 pl-2 text-right ${tone(f.benchNet)}`}>
                    {pct(f.benchNet)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kejujuran soal alpha */}
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 mb-3">
        <div className="flex items-start gap-2">
          <TriangleAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-300 leading-relaxed">
            <strong className="text-white">Baca angkanya dengan jujur.</strong> Di dua
            fold pertama strategi ini kalah dari beli-rata. Keunggulannya muncul di fold
            keempat: saat benchmark <span className="text-rose-400 font-mono">-24,4%</span>,
            strategi masih <span className="text-emerald-400 font-mono">+8,0%</span>.
            Jadi ini bukan mesin pencetak untung — ini <strong className="text-gray-200">rem
            darurat</strong> yang membuat Anda keluar lebih awal saat pasar jatuh.
          </p>
        </div>
      </div>

      {/* Sensitivitas tetangga */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-1">
          Uji sensitivitas parameter (apakah bertahan atau cuma kebetulan)
        </div>
        {val.neighbors.map((n) => {
          const isOpen = open === n.name;
          const solid = n.profitableFolds >= 3;
          return (
            <div
              key={n.name}
              className="rounded-xl border border-gray-850/70 bg-gray-950/40 overflow-hidden"
            >
              <button
                onClick={() => setOpen(isOpen ? null : n.name)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-900/50 transition"
              >
                <span className="w-24 shrink-0 text-[11px] font-mono font-bold text-gray-200">
                  {n.name}
                </span>
                <span
                  className={`w-14 shrink-0 text-[10px] font-mono text-right ${
                    solid ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {n.profitableFolds}/{n.testedFolds}
                </span>
                <span className="w-16 shrink-0 text-[10px] font-mono text-right text-gray-400">
                  PF {n.avgPf.toFixed(2)}
                </span>
                <span className="flex-1 text-[10px] text-right text-gray-500">
                  beat {n.beatBenchFolds}/{n.testedFolds}
                </span>
                <ChevronDown
                  className={`w-3 h-3 shrink-0 text-gray-500 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-gray-850/60 px-3 py-2 bg-gray-950/60 space-y-1 font-mono text-[10px]">
                  {n.folds.map((f) => (
                    <div key={f.period} className="flex items-center gap-2 text-gray-400">
                      <span className="w-24 shrink-0">{f.period}</span>
                      <span className="w-12 shrink-0 text-right">{f.trades} tr</span>
                      <span
                        className={`w-16 shrink-0 text-right font-semibold ${tone(f.net)}`}
                      >
                        {pct(f.net)}
                      </span>
                      <span className="w-14 shrink-0 text-right text-rose-400/70">
                        DD {f.dd.toFixed(0)}%
                      </span>
                      <span className={`flex-1 text-right ${tone(f.benchNet)}`}>
                        bench {pct(f.benchNet)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Catatan metodologi */}
      <div className="mt-3 rounded-xl border border-gray-850 bg-gray-950/50 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Batasan yang harus Anda tahu
          </span>
        </div>
        <ul className="space-y-1 text-[10px] text-gray-400 leading-relaxed">
          <li>
            • <strong className="text-gray-300">Survivorship bias:</strong> daftar emiten
            diambil dari BEI hari ini, jadi perusahaan yang sudah delisting tidak ikut dihitung.
            Hasil cenderung lebih bagus dari kenyataan.
          </li>
          <li>
            • <strong className="text-gray-300">Drawdown besar:</strong> fold keempat
            mencapai 39,7%. Secara psikologis berat untuk dijalani.
          </li>
          <li>
            • <strong className="text-gray-300">Fee 0,40%</strong> sudah dihitung dua arah,
            tapi belum termasuk slippage dan pajak dividen.
          </li>
          <li>
            • Angka masa lalu tidak menjamin hasil masa depan.
          </li>
        </ul>
      </div>

      <p className="mt-2.5 text-[10px] text-gray-600 leading-snug flex items-start gap-1.5">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          Metode: momentum lintas-saham, rebalance 21 hari bursa, filter rezim IHSG di atas
          MA200, maksimal 5 posisi. Diuji 4 fold bergulir sepanjang 2022–2026.
        </span>
      </p>
    </div>
  );
};

export default FullUniverse;
