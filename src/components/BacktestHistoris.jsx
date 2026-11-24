import React, { useState, useMemo } from 'react';
import {
  History,
  FlaskConical,
  TriangleAlert,
  CircleCheck,
  CircleSlash,
  ChevronDown,
  Info,
} from 'lucide-react';
import backtest from '../data/backtest_idx.json';
import sweep from '../data/sweep_idx.json';
import ResearchLog from './ResearchLog';

const fmtPct = (v, digits = 2) =>
  `${v > 0 ? '+' : ''}${Number(v).toFixed(digits)}%`;

const toneFor = (v) =>
  v > 0 ? 'text-emerald-400' : v < 0 ? 'text-rose-400' : 'text-gray-400';

const VerdictBadge = ({ verdict }) => {
  const ok = verdict === 'LAYAK';
  const Icon = ok ? CircleCheck : CircleSlash;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${
        ok
          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
          : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
      }`}
    >
      <Icon className="w-3 h-3" />
      {verdict}
    </span>
  );
};

const Metric = ({ label, value, tone = 'text-white', sub }) => (
  <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
      {label}
    </div>
    <div className={`mt-1 text-lg font-extrabold font-mono ${tone}`}>{value}</div>
    {sub && <div className="mt-0.5 text-[10px] text-gray-500">{sub}</div>}
  </div>
);

const BacktestHistoris = () => {
  const [activeSpec, setActiveSpec] = useState('A RSI5 dip + EMA50 (baseline)');
  const [expanded, setExpanded] = useState(null);

  const cfg = backtest.config;
  const s = backtest.summary;
  const emiten = backtest.emiten;

  const spec = useMemo(
    () => sweep.results.find((r) => r.name === activeSpec) || sweep.results[0],
    [activeSpec],
  );

  const tradedEmiten = emiten.filter((e) => e.trades > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rt-card bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#0c1322] border-gray-850 p-5 sm:p-6">
        <div className="flex items-start gap-2 mb-2">
          <span className="rt-badge text-[10px] px-2 py-0.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            HASIL TERKUNCI
          </span>
          <span className="text-xs text-gray-400 font-mono">
            Diuji {backtest.generatedAt}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-cyan-400" /> Backtest Historis IDX
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-3xl">
          Hasil uji mundur strategi pada data harian 5 tahun, {s.universe} emiten,
          sudah dipotong biaya transaksi riil bursa Indonesia.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono text-gray-400">
          <span>
            Fee beli <span className="text-white">{cfg.feeBuyPct}%</span>
          </span>
          <span>
            Fee jual <span className="text-white">{cfg.feeSellPct}%</span>
          </span>
          <span>
            Pajak jual <span className="text-white">{cfg.taxSellPct}%</span>
          </span>
          <span className="text-amber-400 font-bold">
            Total round-trip {cfg.feeRoundTripPct}%
          </span>
        </div>
      </div>

      {/* Kesimpulan jujur */}
      <div
        className={`rt-card border ${
          s.verdict === 'LAYAK'
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-rose-500/30 bg-rose-500/5'
        }`}
      >
        <div className="flex items-start gap-3">
          {s.verdict === 'LAYAK' ? (
            <CircleCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <TriangleAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">
                Verdik: strategi ini belum layak dipakai
              </h3>
              <VerdictBadge verdict={s.verdict} />
            </div>
            <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
              Dalam 5 tahun, seluruh {s.universe} emiten hanya menghasilkan{' '}
              <strong className="text-white">{s.totalTrades} transaksi</strong>. Itu
              terlalu sedikit untuk dianggap bukti. Win rate {s.winRate}% dan profit
              factor {s.profitFactor} terlihat bagus, tetapi rata-rata hasil per emiten
              tetap <span className={toneFor(s.avgNetPct)}>{fmtPct(s.avgNetPct)}</span>{' '}
              setelah biaya. Angka bagus di sini adalah artefak sampel kecil, bukan
              keunggulan strategi.
            </p>
            <p className="mt-2 text-[11px] text-gray-400 leading-relaxed">
              Penyebab utamanya biaya. Fee round-trip {cfg.feeRoundTripPct}% berarti
              setiap transaksi harus untung lebih dari itu hanya untuk balik modal,
              sementara sinyal RSI ekstrem jarang muncul di saham blue chip.
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan metrik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Total Transaksi" value={s.totalTrades} sub="5 tahun penuh" />
        <Metric
          label="Win Rate"
          value={`${s.winRate}%`}
          tone={s.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}
          sub="agregat semua emiten"
        />
        <Metric
          label="Profit Factor"
          value={s.profitFactor.toFixed(2)}
          tone={s.profitFactor >= 1.3 ? 'text-emerald-400' : 'text-amber-400'}
          sub="total untung / total rugi"
        />
        <Metric
          label="Rata-rata Net"
          value={fmtPct(s.avgNetPct)}
          tone={toneFor(s.avgNetPct)}
          sub="per emiten, setelah fee"
        />
      </div>

      {/* Tabel sweep varian */}
      <div className="rt-card">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-850">
          <div>
            <h3 className="text-base font-bold text-white">
              Uji 6 Varian Strategi
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Semua varian diuji pada data dan biaya yang sama, agar perbandingan adil
            </p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead>
              <tr className="text-gray-500 uppercase text-[10px] tracking-wider">
                <th className="py-2 pr-3 font-semibold">Strategi</th>
                <th className="py-2 px-2 font-semibold text-right">Trade</th>
                <th className="py-2 px-2 font-semibold text-right">WR</th>
                <th className="py-2 px-2 font-semibold text-right">PF</th>
                <th className="py-2 px-2 font-semibold text-right">Net</th>
                <th className="py-2 px-2 font-semibold text-right">MaxDD</th>
                <th className="py-2 pl-2 font-semibold text-right">Verdik</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {sweep.results.map((r) => (
                <tr
                  key={r.name}
                  onClick={() =>
                    setActiveSpec(activeSpec === r.name ? '' : r.name)
                  }
                  className={`border-t border-gray-850/60 cursor-pointer transition ${
                    activeSpec === r.name
                      ? 'bg-cyan-500/5'
                      : 'hover:bg-gray-900/40'
                  }`}
                >
                  <td className="py-2 pr-3 text-gray-300 font-sans max-w-[220px] truncate">
                    {r.name}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-300">{r.trades}</td>
                  <td className="py-2 px-2 text-right text-gray-300">
                    {r.wr.toFixed(1)}%
                  </td>
                  <td
                    className={`py-2 px-2 text-right ${
                      r.pf >= 1.3 ? 'text-emerald-400' : 'text-gray-300'
                    }`}
                  >
                    {r.pf.toFixed(2)}
                  </td>
                  <td className={`py-2 px-2 text-right ${toneFor(r.avgNet)}`}>
                    {fmtPct(r.avgNet)}
                  </td>
                  <td className="py-2 px-2 text-right text-rose-400/80">
                    {r.dd.toFixed(1)}%
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <VerdictBadge verdict={r.verdict} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {spec && (
          <div className="mt-3 rounded-xl border border-gray-850 bg-gray-950/50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
              Interpretasi
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Yang paling dekat layak adalah{' '}
              <span className="text-gray-200 font-semibold">{spec.name}</span> dengan{' '}
              {spec.trades} transaksi, PF {spec.pf.toFixed(2)}, dan rata-rata{' '}
              <span className={toneFor(spec.avgNet)}>{fmtPct(spec.avgNet)}</span>.
              Tetap tidak memenuhi syarat minimum: PF di atas 1,3, hasil positif, dan
              minimal 30 transaksi.
            </p>
          </div>
        )}
      </div>

      {/* Per emiten */}
      <div className="rt-card">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-850">
          <div>
            <h3 className="text-base font-bold text-white">
              Hasil Per Emiten
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {tradedEmiten.length} dari {emiten.length} emiten menghasilkan transaksi
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {emiten.map((e) => {
            const isOpen = expanded === e.symbol;
            const noTrade = e.trades === 0;
            return (
              <div
                key={e.symbol}
                className="rounded-xl border border-gray-850/70 bg-gray-950/40 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : e.symbol)}
                  disabled={noTrade}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                    noTrade ? 'opacity-50 cursor-default' : 'hover:bg-gray-900/50'
                  }`}
                >
                  <span className="w-16 shrink-0 text-xs font-bold font-mono text-gray-200">
                    {e.symbol}
                  </span>
                  <span className="w-20 shrink-0 text-[10px] font-mono text-gray-500 text-right">
                    {e.lastClose.toLocaleString('id-ID')}
                  </span>
                  <span className="w-14 shrink-0 text-[10px] font-mono text-gray-400 text-right">
                    {e.trades} tr
                  </span>
                  <span className="w-14 shrink-0 text-[10px] font-mono text-gray-400 text-right">
                    {e.trades > 0 ? `${e.winRate.toFixed(0)}%` : '—'}
                  </span>
                  <span
                    className={`flex-1 text-[11px] font-mono text-right font-semibold ${toneFor(
                      e.netPct,
                    )}`}
                  >
                    {e.trades > 0 ? fmtPct(e.netPct) : 'tidak ada sinyal'}
                  </span>
                  {!noTrade && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 text-gray-500 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {isOpen && e.sample?.length > 0 && (
                  <div className="border-t border-gray-850/60 px-3 py-2.5 bg-gray-950/60">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                      5 transaksi terakhir
                    </div>
                    <div className="space-y-1 font-mono text-[10px]">
                      {e.sample.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-gray-400"
                        >
                          <span className="w-20 shrink-0">{t.entryDate}</span>
                          <span className="w-3 text-gray-600">→</span>
                          <span className="w-20 shrink-0">{t.exitDate}</span>
                          <span className="w-16 shrink-0 text-right">
                            {t.entry.toLocaleString('id-ID')}
                          </span>
                          <span className="w-16 shrink-0 text-right">
                            {t.exit.toLocaleString('id-ID')}
                          </span>
                          <span className="w-12 shrink-0 text-center text-gray-500">
                            {t.reason}
                          </span>
                          <span
                            className={`flex-1 text-right font-semibold ${toneFor(
                              t.netPct,
                            )}`}
                          >
                            {fmtPct(t.netPct)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-gray-600 leading-relaxed flex items-start gap-1.5">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          Sumber data: Yahoo Finance (harian, 5 tahun). Metode: sinyal masuk saat RSI
          ekstrem, keluar saat stop loss 2x ATR, take profit 4x ATR, atau batas waktu.
          Biaya dihitung dua arah. Angka ini bukan jaminan hasil masa depan.
        </span>
      </p>

      {/* Catatan riset lanjutan: 234 konfigurasi + uji ketahanan */}
      <ResearchLog />
    </div>
  );
};

export default BacktestHistoris;
