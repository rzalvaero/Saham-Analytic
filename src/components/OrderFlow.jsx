import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Scale,
  RefreshCw,
  TriangleAlert,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { fetchOrderFlow } from '../services/marketData';
import universeData from '../data/universe_idx.json';

const fmtVol = (v) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} M`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} jt`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)} rb`;
  return String(Math.round(v));
};

const fmtRp = (v) =>
  v == null ? '—' : `Rp ${Number(v).toLocaleString('id-ID')}`;

// Saham teraktif hari ini (dipilih karena likuiditas tinggi, bukan klaim
// siapa yang paling banyak dibeli — itu ditentukan oleh hasil scan).
const DEFAULT_SYMBOLS = [
  'BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM',
  'ASII', 'ANTM', 'ADRO', 'BREN', 'PANI',
];

const OrderFlow = () => {
  const [symbol, setSymbol] = useState('BBCA');
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (sym) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOrderFlow(sym);
      if (!res) {
        setError('Data intraday tidak tersedia untuk emiten ini.');
        setFlow(null);
      } else {
        setFlow(res);
        setLastUpdated(new Date());
      }
    } catch (e) {
      setError(e.message || 'Gagal memuat data.');
      setFlow(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(symbol);
    const id = setInterval(() => load(symbol), 60000);
    return () => clearInterval(id);
  }, [symbol, load]);

  // Skala bar supaya level terbesar = 100% lebar
  const scale = useMemo(() => {
    if (!flow?.maxLevel) return 1;
    return flow.maxLevel;
  }, [flow]);

  const buyDominant = flow ? flow.delta >= 0 : false;

  return (
    <div className="rt-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3.5 mb-4 border-b border-gray-850">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Arus Beli vs Jual per Harga
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Siapa yang lebih agresif di setiap level harga hari ini
            </p>
          </div>
        </div>
        <button
          onClick={() => load(symbol)}
          disabled={loading}
          className="self-start flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-gray-800 bg-gray-900/60 text-gray-300 hover:bg-gray-800 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {lastUpdated
            ? lastUpdated.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Muat'}
        </button>
      </div>

      {/* Pemilih emiten */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {DEFAULT_SYMBOLS.map((s) => (
          <button
            key={s}
            onClick={() => setSymbol(s)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border transition ${
              symbol === s
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="self-center text-[10px] text-gray-600 ml-1">
          {universeData.withData} emiten IDX tersedia via pencarian
        </span>
      </div>

      {loading && !flow && (
        <div className="py-10 text-center text-xs text-gray-500">
          Membaca transaksi intraday…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 flex items-start gap-2">
          <TriangleAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-300">{error}</p>
        </div>
      )}

      {flow && !error && (
        <>
          {/* Ringkasan agresor */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Volume Beli
              </div>
              <div className="mt-1 text-lg font-extrabold font-mono text-emerald-400">
                {fmtVol(flow.buyVol)}
              </div>
              <div className="mt-0.5 text-[10px] text-gray-500">
                {flow.buyPct.toFixed(1)}% dari transaksi
              </div>
            </div>
            <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Volume Jual
              </div>
              <div className="mt-1 text-lg font-extrabold font-mono text-rose-400">
                {fmtVol(flow.sellVol)}
              </div>
              <div className="mt-0.5 text-[10px] text-gray-500">
                {flow.sellPct.toFixed(1)}% dari transaksi
              </div>
            </div>
            <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Selisih (Delta)
              </div>
              <div
                className={`mt-1 text-lg font-extrabold font-mono ${
                  buyDominant ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {flow.delta > 0 ? '+' : ''}
                {fmtVol(flow.delta)}
              </div>
              <div className="mt-0.5 text-[10px] text-gray-500">
                {buyDominant ? 'pembeli menekan' : 'penjual menekan'}
              </div>
            </div>
            <div className="rounded-xl border border-gray-850 bg-gray-950/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Harga Sekarang
              </div>
              <div className="mt-1 text-lg font-extrabold font-mono text-white">
                {fmtRp(flow.lastPrice)}
              </div>
              <div className="mt-0.5 text-[10px] text-gray-500">
                {flow.bars} bar 1 menit
              </div>
            </div>
          </div>

          {/* Bar rasio beli/jual */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                BELI {flow.buyPct.toFixed(1)}%
              </span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                JUAL {flow.sellPct.toFixed(1)}%
                <ArrowDownRight className="w-3 h-3" />
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-gray-900">
              <div
                className="h-full bg-emerald-500/80 transition-all duration-500"
                style={{ width: `${flow.buyPct}%` }}
              />
              <div
                className="h-full bg-rose-500/80 transition-all duration-500"
                style={{ width: `${flow.sellPct}%` }}
              />
            </div>
          </div>

          {/* Peta level harga */}
          <div className="rounded-xl border border-gray-850 bg-gray-950/50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-850 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold text-white">
                  Peta Level Harga Terbesar
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                fraksi tick BEI
              </span>
            </div>
            <div className="p-3 space-y-1.5">
              {flow.walls.map((lv) => {
                const bw = (lv.buy / scale) * 100;
                const sw = (lv.sell / scale) * 100;
                const netBuy = lv.delta >= 0;
                return (
                  <div key={lv.price} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-[11px] font-mono font-bold text-gray-200 text-right">
                      {lv.price.toLocaleString('id-ID')}
                    </span>
                    <div className="flex-1 flex items-center gap-0.5 min-w-0">
                      <div className="flex-1 flex justify-end">
                        <div
                          className="h-3.5 rounded-l-sm bg-emerald-500/70"
                          style={{ width: `${bw}%` }}
                          title={`Beli ${fmtVol(lv.buy)}`}
                        />
                      </div>
                      <div className="w-px h-3.5 bg-gray-700 shrink-0" />
                      <div className="flex-1">
                        <div
                          className="h-3.5 rounded-r-sm bg-rose-500/70"
                          style={{ width: `${sw}%` }}
                          title={`Jual ${fmtVol(lv.sell)}`}
                        />
                      </div>
                    </div>
                    <span
                      className={`w-20 shrink-0 text-[10px] font-mono text-right font-semibold ${
                        netBuy ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {netBuy ? '+' : ''}
                      {fmtVol(lv.delta)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="px-3 pb-2 flex items-center gap-3 text-[9px] text-gray-500 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-emerald-500/70" /> beli
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-rose-500/70" /> jual
              </span>
              <span className="ml-auto">delta = beli − jual</span>
            </div>
          </div>

          {/* Kejujuran data */}
          <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-300 leading-relaxed">
                <strong className="text-white">Ini bukan order book broker.</strong>{' '}
                Bursa Efek Indonesia tidak membuka antrian bid/ask per broker lewat
                Yahoo Finance. Angka di atas adalah{' '}
                <strong className="text-gray-200">klasifikasi volume</strong> tiap bar
                1 menit ke sisi beli atau jual (tick rule), lalu dikelompokkan per
                level harga. Gunanya membaca agresor mana yang dominan — bukan
                melihat nama broker atau bandar.
              </p>
            </div>
          </div>
        </>
      )}

      <p className="mt-2.5 text-[10px] text-gray-600 leading-snug flex items-start gap-1.5">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          Auto-refresh 60 detik. Sumber: bar intraday 1 menit Yahoo Finance via proxy
          domain. Data tertunda sesuai kebijakan bursa, bukan tick real-time.
        </span>
      </p>
    </div>
  );
};

export default OrderFlow;
