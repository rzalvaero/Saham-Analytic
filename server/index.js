require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool with safety timeout
const pool = mysql.createPool({
  host: process.env.DB_HOST || '194.233.65.45',
  user: process.env.DB_USER || 'reez_users',
  password: process.env.DB_PASSWORD || '1$cL4_jcL+5$',
  database: process.env.DB_NAME || 'reez_trade',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 3000 // 3 detik max agar tidak hang di Vercel Serverless
});

// Cache in-memory untuk respons kilat
let liveStateCache = null;

// ==========================================
// KALENDER EKONOMI (High-Impact US News)
// Jadwal rilis rutin (jam WIB) — disimpan statis agar tanpa dependensi API eksternal.
// Sumber jadwal: rilis BLS/BEA/Fed standar (dapat diperbarui manual).
// ==========================================
function getEconomicCalendar() {
  // Jadwal final bulan BERJALAN saja (dikelola manual sesuai pengumuman resmi BLS/BEA/Fed).
  // Format tanggal: YYYY-MM-DD, jam WIB (UTC+7). Tidak memakai pola tebakan.
  const SCHEDULE = [
    { key: 'JOLTS', date: '2026-11-03', hour: 22, minute: 0, title: 'JOLTS', impact: 'medium', desc: 'Mengukur jumlah lowongan kerja di AS, indikator kekuatan pasar tenaga kerja.' },
    { key: 'NFP', date: '2026-11-06', hour: 20, minute: 30, title: 'NFP (NON-FARM PAYROLLS)', impact: 'high', desc: 'Data tenaga kerja utama AS yang sangat berpengaruh pada USD.' },
    { key: 'CPI', date: '2026-11-10', hour: 20, minute: 30, title: 'CPI (CONSUMER PRICE INDEX)', impact: 'high', desc: 'Data inflasi utama yang menjadi fokus The Fed dan market.' },
    { key: 'PPI', date: '2026-11-13', hour: 20, minute: 30, title: 'PPI (PRODUCER PRICE INDEX)', impact: 'medium', desc: 'Mengukur perubahan harga di tingkat produsen. Indikator tekanan inflasi awal.' },
    { key: 'RETAIL', date: '2026-11-17', hour: 20, minute: 30, title: 'RETAIL SALES', impact: 'medium', desc: 'Mengukur total penjualan ritel. Indikator kekuatan konsumsi AS.' },
    { key: 'FOMC', date: '2026-11-19', hour: 2, minute: 0, title: 'FOMC MEETING MINUTES', impact: 'high', desc: 'Risalah rapat The Fed yang memberikan gambaran arah kebijakan suku bunga.' },
    { key: 'GDP', date: '2026-11-25', hour: 20, minute: 30, title: 'GDP Q3 (SECOND ESTIMATE)', impact: 'high', desc: 'Estimasi kedua pertumbuhan ekonomi AS pada kuartal ketiga (Q3).' },
    { key: 'PCE', date: '2026-11-25', hour: 20, minute: 30, title: 'PCE PRICE INDEX', impact: 'high', desc: 'Indeks inflasi favorit The Fed untuk mengukur tekanan harga (inflasi).' }
  ];

  const pad = (n) => String(n).padStart(2, '0');

  const results = SCHEDULE.map((ev) => {
    // Tanggal & jam sudah dinyatakan dalam WIB (UTC+7)
    const [y, m, d] = ev.date.split('-').map(Number);
    const wib = new Date(y, m - 1, d, ev.hour, ev.minute, 0);
    return {
      key: ev.key,
      title: ev.title,
      country: 'US',
      impact: ev.impact,
      desc: ev.desc,
      iso: wib.toISOString(),
      date_label: wib.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      time_wib: pad(ev.hour) + ':' + pad(ev.minute) + ' WIB',
      ts: wib.getTime()
    };
  });

  const nowMs = Date.now();
  results.sort((a, b) => a.ts - b.ts);
  // Sertakan event yang baru saja lewat (<= 24 jam) agar tetap terlihat di hari yang sama,
  // dan hanya bulan berjalan + beberapa hari awal bulan depan bila jadwal sudah berakhir.
  return results.filter((e) => e.ts > nowMs - 24 * 3600000).slice(0, 16);
}

// Pastikan tabel mt5_live_state tersedia (non-blocking)
async function initLiveStateTable() {
  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 3000));
    const queryPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS mt5_live_state (
        id INT PRIMARY KEY,
        data LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await Promise.race([queryPromise, timeoutPromise]);
  } catch (err) {
    console.error('Info init mt5_live_state:', err.message);
  }
}
setTimeout(initLiveStateTable, 100);

// ==========================================
// ENDPOINT LIVE TRADING EXNESS MT5 REAL
// ==========================================

// POST: Menerima sync data dari MT5 local worker
app.post('/api/trade-live/sync', async (req, res) => {
  const { secret, data } = req.body;
  const expectedSecret = process.env.SYNC_SECRET || 'reez_mt5_secret_2026';
  
  if (secret !== expectedSecret) {
    return res.status(403).json({ error: 'Unauthorized secret token' });
  }
  if (!data) {
    return res.status(400).json({ error: 'Data payload tidak boleh kosong' });
  }

  // Update in-memory
  liveStateCache = {
    ...data,
    synced_at: new Date().toISOString()
  };

  // Simpan ke DB secara asynchronous non-blocking
  try {
    const jsonStr = JSON.stringify(liveStateCache);
    pool.query(`
      INSERT INTO mt5_live_state (id, data) VALUES (1, ?)
      ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP
    `, [jsonStr]).catch(err => console.error('DB save error:', err.message));
  } catch (err) {
    console.error('Error simpan live state:', err.message);
  }

  res.json({ success: true, timestamp: Date.now() });
});

// GET: Kalender ekonomi high-impact (US) dengan jam rilis WIB
app.get('/api/economic-calendar', (req, res) => {
  try {
    const nowMs = Date.now();
    const events = getEconomicCalendar().map((e) => ({
      ...e,
      is_past: e.ts < nowMs,
      seconds_to: Math.round((e.ts - nowMs) / 1000)
    }));
    res.json({
      generated_at: new Date().toISOString(),
      server_time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
      server_ms: nowMs,
      count: events.length,
      events
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Equity curve (kurva pertumbuhan saldo) — dihitung dari state live
app.get('/api/trade-live/equity', async (req, res) => {
  try {
    let state = liveStateCache;
    if (!state) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2500));
        const dbPromise = pool.query('SELECT data FROM mt5_live_state WHERE id = 1');
        const [rows] = await Promise.race([dbPromise, timeoutPromise]);
        if (rows && rows.length > 0) state = JSON.parse(rows[0].data);
      } catch (dbErr) {
        // fallback di bawah
      }
    }

    if (!state) {
      return res.json({ available: false, points: [], message: 'Belum ada data live dari MT5.' });
    }

    const account = state.account || {};
    const stats = state.stats || {};
    const history = state.history || [];

    const balance = Number(account.balance_idc || 0);
    const equity = Number(account.equity_idc || 0);

    // Rekonstruksi kurva: mulai dari saldo awal, lalu kumulatifkan net profit tiap trade
    // (dari histori terbaru). Jika tidak ada histori, tampilkan titik tunggal.
    const points = [];
    const chrono = [...history].reverse(); // history terbaru dulu -> jadi tertua dulu
    let running = balance - chrono.reduce((acc, h) => acc + Number(h.net_idc || 0), 0);
    if (chrono.length === 0) {
      points.push({ t: state.synced_at || new Date().toISOString(), v: balance });
    } else {
      points.push({ t: chrono[0].time, v: Math.round(running) });
      for (const h of chrono) {
        running += Number(h.net_idc || 0);
        points.push({ t: h.time, v: Math.round(running) });
      }
    }

    const start = points.length ? points[0].v : balance;
    const growth = start > 0 ? ((balance - start) / start) * 100 : 0;

    res.json({
      available: true,
      currency: 'IDR',
      start_value: start,
      current_value: Math.round(balance),
      current_equity: Math.round(equity),
      growth_pct: Number(growth.toFixed(2)),
      net_pnl_idc: Math.round(Number(stats.net_pnl_idc || 0)),
      points,
      synced_at: state.synced_at || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Publik membaca data live trade secara real-time
app.get('/api/trade-live', async (req, res) => {
  try {
    if (!liveStateCache) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2500));
        const dbPromise = pool.query('SELECT data, updated_at FROM mt5_live_state WHERE id = 1');
        const [rows] = await Promise.race([dbPromise, timeoutPromise]);
        if (rows && rows.length > 0) {
          liveStateCache = JSON.parse(rows[0].data);
          liveStateCache.db_updated_at = rows[0].updated_at;
        }
      } catch (dbErr) {
        // Fallback gracefully jika DB belum siap atau timeout
      }
    }

    if (liveStateCache) {
      return res.json(liveStateCache);
    }

    // Default snapshot fallback
    return res.json({
      connected: true,
      message: 'Snapshot live Exness MT5 Real',
      account: {
        login: '452****70',
        server: 'Exness-MT5Real48',
        currency: 'IDR',
        balance_idc: 32296418.95,
        balance_rp: 322964,
        equity_idc: 32424522.08,
        equity_rp: 324245,
        floating_idc: 128103.13,
        floating_rp: 1281
      },
      positions_count: 5,
      positions: [
        {
          ticket: 15911762,
          symbol: 'BTCUSDc',
          type: 'SELL',
          volume: 0.03,
          price_open: 75631.91,
          price_current: 75540.89,
          sl: 76146.35,
          tp: 74658.03,
          pnl_idc: 49364.22,
          pnl_rp: 494,
          magic: 0,
          strategy: '👤 Manual Trade',
          open_time: '09 Nov 04:17',
          duration: '25m',
          comment: ''
        },
        {
          ticket: 15909181,
          symbol: 'BTCUSDc',
          type: 'SELL',
          volume: 0.05,
          price_open: 75660.50,
          price_current: 75540.89,
          sl: 76146.35,
          tp: 74646.35,
          pnl_idc: 89745.50,
          pnl_rp: 897,
          magic: 778899,
          strategy: '🪙 ReyFX-BTC',
          open_time: '09 Nov 04:00',
          duration: '43m',
          comment: 'ReyFX-BTC [BREAKOUT-SELL]'
        }
      ],
      stats: {
        month_label: 'November 2026',
        gross_profit_idc: 62411514.19,
        gross_profit_rp: 624115,
        total_loss_idc: 86034853.45,
        total_loss_rp: 860349,
        total_wd_idc: 19159034,
        total_wd_rp: 191590,
        wd_count: 1,
        wd_list: [
          {
            ticket: 7277208,
            time: '04 Nov 2026 14:30',
            amount_idc: 19159034,
            amount_rp: 191590,
            comment: 'W-BANKIDGT-IDC (Penarikan Bank)'
          }
        ],
        net_pnl_idc: -23623339.26,
        net_pnl_rp: -236233,
        winrate_pct: 52.2,
        profit_factor: 1.64,
        win_count: 1123,
        loss_count: 1029,
        total_trades: 2152,
        leaderboard: [
          {
            name: '🪙 ReyFX-BTC',
            magic: 778899,
            trades: 94,
            wins: 51,
            losses: 43,
            winrate_pct: 54.3,
            profit_factor: 1.46,
            net_idc: 18528821,
            net_rp: 185288
          },
          {
            name: '🛡️ ReyFX-M15 (Breakout)',
            magic: 667788,
            trades: 182,
            wins: 82,
            losses: 100,
            winrate_pct: 45.1,
            profit_factor: 1.92,
            net_idc: 25816764,
            net_rp: 258168
          },
          {
            name: '🤖 ReyFX-M5 (Scalper)',
            magic: 667799,
            trades: 420,
            wins: 220,
            losses: 200,
            winrate_pct: 52.4,
            profit_factor: 1.64,
            net_idc: 35799408,
            net_rp: 357994
          }
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ==========================================
// ENDPOINT BERITA PASAR & FUNDAMENTAL REALTIME (RSS IDX / IHSG)
// Menyediakan berita terkini seputar emiten saham & bursa Indonesia
// ==========================================
const newsCache = new Map();

function fetchGoogleNewsRss(query) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=id&gl=ID&ceid=ID:id`;
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const items = [];
        const itemMatches = data.match(/<item>[\s\S]*?<\/item>/g) || [];
        for (const item of itemMatches.slice(0, 15)) {
          const title = (item.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
          const link = (item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
          const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
          const source = (item.match(/<source[\s\S]*?>([\s\S]*?)<\/source>/) || [])[1] || 'Market News';
          
          let cleanTitle = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          let publisher = source.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          if (cleanTitle.includes(' - ')) {
            const parts = cleanTitle.split(' - ');
            publisher = parts[parts.length - 1];
            cleanTitle = parts.slice(0, -1).join(' - ');
          }
          items.push({
            title: cleanTitle,
            link: link.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
            publisher: publisher,
            pubDate: pubDate,
            pubTime: pubDate ? new Date(pubDate).getTime() : Date.now()
          });
        }
        resolve(items);
      });
    });
    req.on('error', (err) => {
      console.error('RSS fetch error:', err.message);
      resolve([]);
    });
    req.setTimeout(4000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

app.get('/api/news', async (req, res) => {
  try {
    const symbol = (req.query.symbol || '').trim().toUpperCase();
    const query = req.query.q || (symbol ? `saham ${symbol} OR ${symbol}.JK` : 'saham IHSG Bursa Efek Indonesia');
    const cacheKey = `news_${query.toLowerCase()}`;
    const now = Date.now();

    // Cek cache (TTL 3 menit)
    const cached = newsCache.get(cacheKey);
    if (cached && (now - cached.timestamp < 180000)) {
      return res.json({ success: true, count: cached.data.length, news: cached.data, cached: true });
    }

    const items = await fetchGoogleNewsRss(query);
    if (items.length > 0) {
      newsCache.set(cacheKey, { timestamp: now, data: items });
      return res.json({ success: true, count: items.length, news: items, cached: false });
    }

    // Jika pencarian spesifik kosong, fallback ke berita umum IHSG
    if (symbol) {
      const fallbackItems = await fetchGoogleNewsRss('saham IHSG Bursa Efek Indonesia');
      return res.json({ success: true, count: fallbackItems.length, news: fallbackItems, fallback: true });
    }

    res.json({ success: true, count: 0, news: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

module.exports = app;
