import React, { useState, useEffect, useMemo } from 'react';
import { CalendarClock, AlertTriangle, RefreshCw, Clock, Info } from 'lucide-react';

/**
 * Kalender Ekonomi (High-Impact US News)
 * Menampilkan jadwal rilis data ekonomi AS dengan jam WIB + hitung mundur.
 * Terhubung dengan modul NewsStop (bot menahan diri saat rilis berita besar).
 */
export default function EconomicCalendar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const fetchCalendar = async () => {
    try {
      const res = await fetch('/api/economic-calendar');
      if (!res.ok) throw new Error('Gagal memuat kalender ekonomi');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    const refetch = setInterval(fetchCalendar, 300000); // refresh tiap 5 menit
    const tick = setInterval(() => setNow(Date.now()), 1000); // countdown tiap detik
    return () => {
      clearInterval(refetch);
      clearInterval(tick);
    };
  }, []);

  const events = useMemo(() => {
    const list = data?.events || [];
    return list.map((e) => {
      const secs = Math.round((e.ts - now) / 1000);
      return { ...e, seconds_to: secs, is_past_now: secs < 0 };
    });
  }, [data, now]);

  const formatCountdown = (secs) => {
    if (secs <= 0) return 'Sudah rilis';
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (d > 0) return `${d}h ${h}j ${m}m`;
    if (h > 0) return `${h}j ${m}m ${s}d`;
    if (m > 0) return `${m}m ${s}d`;
    return `${s} detik`;
  };

  const impactStyle = (impact) => {
    if (impact === 'high') return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', label: 'Tinggi' };
    if (impact === 'medium') return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Sedang' };
    return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', label: 'Rendah' };
  };

  const nextEvent = events.find((e) => !e.is_past_now);

  if (loading && !data) {
    return (
      <div className="rt-card flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
        Memuat kalender ekonomi...
      </div>
    );
  }

  return (
    <div className="rt-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Kalender Ekonomi Global</h3>
            <p className="text-xs text-gray-400">
              Jadwal rilis data berdampak tinggi (jam WIB) — sistem menyesuaikan eksposur saat rilis berita
            </p>
          </div>
        </div>
        <span className="text-[11px] text-gray-400 font-mono bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800">
          {data?.server_time || '-'}
        </span>
      </div>

      {/* Banner event berikutnya */}
      {nextEvent && (
        <div className={`mb-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 ${impactStyle(nextEvent.impact).bg} ${impactStyle(nextEvent.impact).border}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className={`w-5 h-5 shrink-0 ${impactStyle(nextEvent.impact).text}`} />
            <div className="min-w-0">
              <div className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Rilis Berikutnya</div>
              <div className="text-sm font-bold text-white truncate">{nextEvent.title}</div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Sisa Waktu</div>
            <div className={`text-base font-extrabold font-mono ${impactStyle(nextEvent.impact).text}`}>
              {formatCountdown(nextEvent.seconds_to)}
            </div>
          </div>
        </div>
      )}

      {/* Daftar event */}
      <div className="space-y-2.5">
        {events.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">Belum ada jadwal rilis terdekat.</div>
        ) : (
          events.map((e, idx) => {
            const st = impactStyle(e.impact);
            const past = e.is_past_now;
            const isToday = e.date_label && new Date(e.ts).toDateString() === new Date(now).toDateString();
            return (
              <div
                key={`${e.key}-${idx}`}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                  past ? 'bg-gray-950/40 border-gray-850 opacity-60' : 'bg-gray-950/70 border-gray-800/80 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${st.bg} ${st.border} border ${st.text}`}>
                    {e.key}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{e.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${st.bg} ${st.border} ${st.text}`}>
                        {st.label}
                      </span>
                      {isToday && !past && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                          HARI INI
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">{e.time_wib}</span>
                      <span className="text-gray-600">•</span>
                      <span>{e.date_label}</span>
                    </div>
                    {e.desc && (
                      <div className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">{e.desc}</div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {past ? (
                    <span className="text-[11px] text-gray-500 font-mono">Selesai</span>
                  ) : (
                    <>
                      <div className="text-[10px] text-gray-500 uppercase font-semibold">Hitungan</div>
                      <div className={`text-sm font-bold font-mono ${st.text}`}>{formatCountdown(e.seconds_to)}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800/60 text-[11px] text-gray-500 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span>Jadwal bersifat indikatif berdasarkan pola rilis rutin. Waktu dapat bergeser sesuai pengumuman resmi.</span>
      </div>
    </div>
  );
}
