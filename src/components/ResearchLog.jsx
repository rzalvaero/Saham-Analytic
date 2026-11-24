import React, { useState } from 'react';
import {
  Microscope,
  CircleX,
  CircleCheck,
  TriangleAlert,
  ChevronDown,
  Lightbulb,
  TrendingDown,
} from 'lucide-react';
import r1 from '../data/research_idx.json';
import r2 from '../data/research_idx2.json';
import r3 from '../data/research_idx3.json';
import r4 from '../data/research_idx4.json';

const pct = (v, d = 1) => `${v > 0 ? '+' : ''}${Number(v).toFixed(d)}%`;
const tone = (v) => (v > 0 ? 'text-emerald-400' : v < 0 ? 'text-rose-400' : 'text-gray-400');

const ROUNDS = [
  {
    no: 1,
    title: 'Sinyal time-series, 90 konfigurasi',
    data: r1,
    scope: 'RSI dip, breakout, MA cross, pullback × SL/TP/trailing',
    verdict: r1.verdict,
    finding:
      'Semua gagal. Tahap ini membuktikan sinyal teknikal pendek per saham tidak sanggup menutup fee 0,40% round-trip.',
  },
  {
    no: 2,
    title: 'Tambah filter rezim IHSG, 144 konfigurasi',
    data: r2,
    scope: 'Mode A tanpa filter, B filter IHSG>MA200, C filter + 3 emiten terkuat',
    verdict: r2.verdict,
    finding:
      'Masih nol yang lolos. Tapi jumlah konfigurasi yang positif di periode test naik dari 4/48 ke 11/48 — filter rezim memang bekerja.',
  },
  {
    no: 3,
    title: 'Momentum lintas-saham + trend panjang, 28 konfigurasi',
    data: r3,
    scope: 'Ranking return 63/126/252 hari, beli TOP-K, rebalance bulanan',
    verdict: r3.verdict,
    finding:
      'Muncul satu kandidat: momentum TOP5 lookback 63 hari dengan filter rezim. Train PF 1,83 net +31,5%, test PF 1,54 net +7,4%.',
  },
  {
    no: 4,
    title: 'Uji ketahanan rolling walk-forward, 4 fold',
    data: r4,
    scope: 'Kandidat + 7 tetangga parameter, diuji 4 periode berurutan',
    verdict: r4.verdict,
    finding:
      'Kandidat gugur. Hanya 2 dari 4 fold untung. Satu sel grid yang lolos di uji tunggal ternyata tidak bertahan — tanda overfit.',
  },
];

const VerdictIcon = ({ v }) => {
  if (v === 'LAYAK') return <CircleCheck className="w-4 h-4 text-emerald-400" />;
  if (v === 'LEMAH') return <TriangleAlert className="w-4 h-4 text-amber-400" />;
  return <CircleX className="w-4 h-4 text-rose-400" />;
};

const ResearchLog = () => {
  const [open, setOpen] = useState(1);

  const totalConfigs =
    r1.method.configsTested +
    r2.method.configsTested +
    r3.method.configsTested +
    r4.candidates.length;

  const best = r4.candidates[0];
  const noFilter = r4.candidates.find((c) => !c.regime);

  return (
    <div className="rt-card">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3.5 mb-4 border-b border-gray-850">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Microscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Catatan Riset Strategi</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalConfigs} konfigurasi diuji pada data 5 tahun yang sama
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto text-[10px] font-mono px-2 py-1 rounded-md border border-gray-700 bg-gray-900 text-gray-400">
          fee 0,40% round-trip
        </span>
      </div>

      {/* Temuan yang benar-benar berguna */}
      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3.5 mb-4">
        <div className="flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-white">
              Yang terbukti bekerja: filter rezim pasar
            </h4>
            <p className="mt-1 text-[11px] text-gray-300 leading-relaxed">
              Strategi yang sama, diuji dengan dan tanpa filter IHSG di atas MA200.
              Hasilnya bukan soal untung, tapi soal selamat.
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {noFilter && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 px-2.5 py-2">
                  <div className="text-[9px] uppercase tracking-wide text-rose-400/80 font-semibold">
                    Tanpa filter rezim
                  </div>
                  <div className="text-sm font-mono font-bold text-rose-400">
                    {pct(noFilter.folds[3].net)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    drawdown {noFilter.folds[3].dd.toFixed(1)}%
                  </div>
                </div>
              )}
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-2">
                <div className="text-[9px] uppercase tracking-wide text-emerald-400/80 font-semibold">
                  Dengan filter rezim
                </div>
                <div className={`text-sm font-mono font-bold ${tone(best.folds[3].net)}`}>
                  {pct(best.folds[3].net)}
                </div>
                <div className="text-[10px] text-gray-500">
                  drawdown {best.folds[3].dd.toFixed(1)}%
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-gray-400 leading-snug">
              Di periode pasar turun terakhir, filter rezim memangkas kerugian dari
              -40,6% menjadi -14,0%. Bukan menghasilkan untung, tapi mencegah luka besar.
              Itu satu-satunya bagian yang layak dipakai dari seluruh riset ini.
            </p>
          </div>
        </div>
      </div>

      {/* Benchmark */}
      <div className="rounded-xl border border-gray-850 bg-gray-950/60 p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Benchmark pembanding
          </span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Beli rata semua {r4.method.benchmarkEqualWeight.n} emiten dan tahan di periode
          uji terakhir menghasilkan{' '}
          <span className="text-rose-400 font-mono font-bold">
            {pct(r4.method.benchmarkEqualWeight.net)}
          </span>
          . Pasar memang sedang turun, jadi tidak ada strategi long-only yang bisa
          diharapkan untung besar di sini.
        </p>
      </div>

      {/* Timeline 4 ronde */}
      <div className="space-y-1.5">
        {ROUNDS.map((r) => {
          const isOpen = open === r.no;
          const passed = r.verdict === 'LAYAK';
          return (
            <div
              key={r.no}
              className="rounded-xl border border-gray-850/70 bg-gray-950/40 overflow-hidden"
            >
              <button
                onClick={() => setOpen(isOpen ? null : r.no)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-900/50 transition"
              >
                <span
                  className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold font-mono border ${
                    passed
                      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                      : 'text-gray-500 border-gray-700 bg-gray-900'
                  }`}
                >
                  {r.no}
                </span>
                <span className="flex-1 text-[11px] sm:text-xs font-semibold text-gray-200 min-w-0 truncate">
                  {r.title}
                </span>
                <VerdictIcon v={r.verdict} />
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 text-gray-500 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-gray-850/60 px-3 py-2.5 bg-gray-950/60 space-y-2">
                  <div className="text-[10px] text-gray-500">
                    <span className="uppercase tracking-wider font-semibold">Cakupan: </span>
                    {r.scope}
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">{r.finding}</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-gray-500">Verdik ronde ini:</span>
                    <span
                      className={
                        passed
                          ? 'text-emerald-400 font-bold'
                          : r.verdict === 'LEMAH'
                            ? 'text-amber-400 font-bold'
                            : 'text-rose-400 font-bold'
                      }
                    >
                      {r.verdict}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Kesimpulan akhir */}
      <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
        <div className="flex items-start gap-2.5">
          <TriangleAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-white">Kesimpulan jujur</h4>
            <p className="mt-1 text-[11px] text-gray-300 leading-relaxed">
              Tidak ada satu pun dari {totalConfigs} konfigurasi yang lolos uji ketahanan.
              Kandidat terbaik gugur di 2 dari 4 periode. Artinya: sistem otomatis untuk
              IDX belum layak dijalankan dengan uang sungguhan.
            </p>
            <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
              Yang layak dipakai dari riset ini cuma satu: <strong className="text-gray-200">
              aturan rezim</strong>. Jangan buka posisi baru saat IHSG di bawah MA200.
              Sisanya masih perlu pendekatan berbeda — bukan penyesuaian parameter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchLog;
