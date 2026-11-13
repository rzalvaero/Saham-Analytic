import React, { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";

/**
 * Kurva Pertumbuhan Saldo (Equity Curve)
 * Visualisasi performa portofolio dari waktu ke waktu.
 * Data dari endpoint /api/trade-live/equity (rekonstruksi net profit per trade).
 */
export default function EquityCurve() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all"); // all | 30 | 7

  const formatMoney = (val, showSign = false) => {
    if (val === undefined || val === null || isNaN(val)) return "-";
    const sign = showSign && val > 0 ? "+" : "";
    return sign + "Rp " + Math.round(val).toLocaleString("id-ID");
  };

  const fetchEquity = async () => {
    try {
      const res = await fetch("/api/trade-live/equity");
      if (!res.ok) throw new Error("Gagal memuat kurva saldo");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquity();
    const interval = setInterval(fetchEquity, 15000);
    return () => clearInterval(interval);
  }, []);

  const points = data?.points || [];

  const filtered = useMemo(() => {
    if (range === "all" || points.length === 0) return points;
    const n = range === "30" ? 30 : 7;
    return points.slice(-n);
  }, [points, range]);

  // Bangun path SVG
  const chart = useMemo(() => {
    if (filtered.length < 2) return null;
    const values = filtered.map((p) => Number(p.v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const W = 1000;
    const H = 260;
    const pad = 8;
    const stepX = W / (filtered.length - 1);

    const coords = values.map((v, i) => {
      const x = i * stepX;
      const y = H - pad - ((v - min) / span) * (H - pad * 2);
      return { x, y, v, t: filtered[i].t };
    });

    const linePath = coords
      .map(
        (c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`,
      )
      .join(" ");
    const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

    return { coords, linePath, areaPath, min, max, W, H };
  }, [filtered]);

  const isUp = (data?.growth_pct || 0) >= 0;

  if (loading && !data) {
    return (
      <div className="rt-card flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
        Memuat kurva pertumbuhan saldo...
      </div>
    );
  }

  if (!data?.available || points.length === 0) {
    return (
      <div className="rt-card">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Kurva Pertumbuhan Saldo
            </h3>
            <p className="text-xs text-gray-400">
              Pergerakan ekuitas portofolio dari waktu ke waktu
            </p>
          </div>
        </div>
        <div className="text-center py-8 text-xs text-gray-500">
          Data kurva belum tersedia. Menunggu sinkronisasi riwayat transaksi
          dari MetaTrader 5.
        </div>
      </div>
    );
  }

  return (
    <div className="rt-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Kurva Pertumbuhan Saldo
            </h3>
            <p className="text-xs text-gray-400">
              Pergerakan ekuitas portofolio dari waktu ke waktu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs overflow-x-auto no-scrollbar">
            {[
              { id: "7", label: "7 Trade" },
              { id: "30", label: "30 Trade" },
              { id: "all", label: "Semua" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  range === r.id
                    ? "bg-cyan-500 text-gray-950 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gray-950/60 border border-gray-850">
          <span className="text-[9px] text-gray-500 uppercase font-semibold block">
            Saldo
          </span>
          <span className="text-sm font-extrabold font-mono text-white">
            {formatMoney(data.current_value)}
          </span>
        </div>
        <div className="p-2 rounded-xl bg-gray-950/60 border border-gray-850">
          <span className="text-[9px] text-gray-500 uppercase font-semibold block">
            Growth
          </span>
          <span
            className={`text-sm font-extrabold font-mono flex items-center gap-1 ${isUp ? "text-emerald-400" : "text-rose-400"}`}
          >
            {isUp ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {isUp ? "+" : ""}
            {data.growth_pct}%
          </span>
        </div>
        <div className="p-2 rounded-xl bg-gray-950/60 border border-gray-850">
          <span className="text-[9px] text-gray-500 uppercase font-semibold block">
            Net PNL
          </span>
          <span
            className={`text-sm font-extrabold font-mono ${(data.net_pnl_idc || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}
          >
            {formatMoney(data.net_pnl_idc, true)}
          </span>
        </div>
      </div>

      {/* Grafik SVG */}
      {chart ? (
        <div className="w-full rounded-xl bg-gray-950/40 border border-gray-850 p-2">
          <svg
            viewBox={`0 0 ${chart.W} ${chart.H}`}
            className="w-full h-52"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isUp ? "#10b981" : "#f43f5e"}
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor={isUp ? "#10b981" : "#f43f5e"}
                  stopOpacity="0.02"
                />
              </linearGradient>
            </defs>
            <path d={chart.areaPath} fill="url(#eqFill)" />
            <path
              d={chart.linePath}
              fill="none"
              stroke={isUp ? "#10b981" : "#f43f5e"}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono px-1 pt-1">
            <span>{filtered[0]?.t}</span>
            <span>
              Min {formatMoney(chart.min)} · Maks {formatMoney(chart.max)}
            </span>
            <span>{filtered[filtered.length - 1]?.t}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-gray-500">
          Butuh minimal 2 titik data untuk menggambar kurva.
        </div>
      )}
    </div>
  );
}
