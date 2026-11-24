import React from 'react';
import {
  Info,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Gauge,
} from 'lucide-react';

const fmtRp = (v) =>
  v == null || Number.isNaN(Number(v))
    ? '—'
    : Number(v).toLocaleString('id-ID', { maximumFractionDigits: 0 });

const fmtVol = (v) => {
  const n = Number(v);
  if (!n) return '—';
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} M`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} jt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} rb`;
  return String(Math.round(n));
};

const Row = ({ label, value, cls = 'text-gray-200' }) => (
  <div className="flex items-center justify-between gap-2 py-[3px]">
    <span className="text-[10px] text-gray-500">{label}</span>
    <span className={`text-[11px] font-mono font-semibold ${cls}`}>{value}</span>
  </div>
);

const StockInfoPanel = ({ stock }) => {
  if (!stock) return null;

  const up = (stock.changePercent ?? 0) >= 0;

  // Posisi harga terhadap MA panjang = bacaan tren paling jujur yang
  // bisa dihitung dari data harga saja.
  const ma60Last = stock.ma60?.length ? stock.ma60[stock.ma60.length - 1].value : null;
  const ma280Last = stock.ma280?.length ? stock.ma280[stock.ma280.length - 1].value : null;
  const px = stock.currentPrice;

  const aboveMa60 = ma60Last != null ? px >= ma60Last : null;
  const aboveMa280 = ma280Last != null ? px >= ma280Last : null;

  return (
    <div className="rt-card h-full">
      {/* Harga utama */}
      <div className="pb-3 mb-3 border-b border-gray-850">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{stock.symbol}</h3>
            <p className="text-[10px] text-gray-500 truncate">{stock.name}</p>
          </div>
          <span
            className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
              up
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
            }`}
          >
            {up ? 'NAIK' : 'TURUN'}
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-extrabold font-mono text-white">
            Rp {fmtRp(stock.currentPrice)}
          </span>
        </div>
        <div
          className={`flex items-center gap-1 text-[11px] font-mono font-semibold ${
            up ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {up ? '+' : ''}
          {fmtRp(stock.priceChange)} ({up ? '+' : ''}
          {(stock.changePercent ?? 0).toFixed(2)}%)
        </div>
      </div>

      {/* OHLC hari ini */}
      <div className="grid grid-cols-2 gap-x-3 mb-2">
        <Row label="Open" value={fmtRp(stock.dayOpen)} />
        <Row label="High" value={fmtRp(stock.dayHigh)} cls="text-emerald-400" />
        <Row label="Low" value={fmtRp(stock.dayLow)} cls="text-rose-400" />
        <Row label="Vol" value={fmtVol(stock.volume)} />
        <Row label="Value" value={`Rp ${fmtVol(stock.turnover)}`} />
        <Row label="Avg Vol 20H" value={fmtVol(stock.avgVolume)} />
        <Row label="52W High" value={fmtRp(stock.week52High)} cls="text-emerald-400/80" />
        <Row label="52W Low" value={fmtRp(stock.week52Low)} cls="text-rose-400/80" />
      </div>

      {/* MA */}
      <div className="pt-2 mt-1 border-t border-gray-850/70">
        <div className="flex items-center gap-1 mb-1">
          <Gauge className="w-3 h-3 text-cyan-400" />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">
            Posisi terhadap MA
          </span>
        </div>
        <Row
          label="MA 60"
          value={
            ma60Last != null ? (
              <span className="flex items-center gap-1">
                {fmtRp(ma60Last)}
                <span className={aboveMa60 ? 'text-emerald-400' : 'text-rose-400'}>
                  {aboveMa60 ? '▲ di atas' : '▼ di bawah'}
                </span>
              </span>
            ) : (
              '—'
            )
          }
        />
        <Row
          label="MA 280"
          value={
            ma280Last != null ? (
              <span className="flex items-center gap-1">
                {fmtRp(ma280Last)}
                <span className={aboveMa280 ? 'text-emerald-400' : 'text-rose-400'}>
                  {aboveMa280 ? '▲ di atas' : '▼ di bawah'}
                </span>
              </span>
            ) : (
              '—'
            )
          }
        />
        {stock.analysis?.recommendation && (
          <Row
            label="Sinyal Teknikal"
            value={stock.analysis.recommendation}
            cls={
              stock.analysis.recommendation === 'BUY'
                ? 'text-emerald-400'
                : stock.analysis.recommendation === 'SELL'
                  ? 'text-rose-400'
                  : 'text-gray-300'
            }
          />
        )}
        {stock.analysis?.rsi != null && (
          <Row
            label="RSI 14"
            value={Number(stock.analysis.rsi).toFixed(1)}
            cls={
              stock.analysis.rsi >= 70
                ? 'text-rose-400'
                : stock.analysis.rsi <= 30
                  ? 'text-emerald-400'
                  : 'text-gray-300'
            }
          />
        )}
      </div>

      {/* Kejujuran data */}
      <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
        <div className="flex items-start gap-1.5">
          <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[9.5px] text-gray-400 leading-relaxed">
            <strong className="text-gray-300">PER, PBV, ROE, EPS, dan Dividend Yield
            tidak ditampilkan</strong> karena sumber data kami menolak akses fundamental
            untuk saham IDX (401). Angka dikarang tidak akan saya tampilkan.
          </p>
        </div>
      </div>

      <p className="mt-1.5 text-[9px] text-gray-600 leading-snug flex items-start gap-1">
        <Info className="w-2.5 h-2.5 shrink-0 mt-0.5" />
        <span>Data harga tertunda sesuai kebijakan bursa.</span>
      </p>
    </div>
  );
};

export default StockInfoPanel;
