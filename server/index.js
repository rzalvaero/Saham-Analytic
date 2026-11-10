require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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


// POST login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT id, username, balance, password FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        delete user.password;
        res.json(user);
      } else {
        res.status(401).json({ error: 'Username atau password salah' });
      }
    } else {
      res.status(401).json({ error: 'Username atau password salah' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST register
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) return res.status(400).json({ error: 'Username, email, dan password wajib diisi' });
  
  try {
    const [existingUser] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) return res.status(400).json({ error: 'Username sudah terdaftar' });
    
    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (username, password, email, balance) VALUES (?, ?, ?, 10000000)', [username, hashedPassword, email]);
    
    res.json({ id: result.insertId, username, email, balance: 10000000 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user info (legacy, can still be used if needed)
app.get('/api/user/:username', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, balance FROM users WHERE username = ?', [req.params.username]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update password
app.put('/api/user/:id/password', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.params.id;
  
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Password lama dan baru wajib diisi' });
  
  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    
    const user = rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Password lama salah' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    
    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET watchlist
app.get('/api/watchlist/:userId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT symbol FROM watchlists WHERE user_id = ?', [req.params.userId]);
    res.json(rows.map(row => row.symbol));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add to watchlist
app.post('/api/watchlist', async (req, res) => {
  const { userId, symbol } = req.body;
  try {
    await pool.query('INSERT IGNORE INTO watchlists (user_id, symbol) VALUES (?, ?)', [userId, symbol]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE from watchlist
app.delete('/api/watchlist/:userId/:symbol', async (req, res) => {
  try {
    await pool.query('DELETE FROM watchlists WHERE user_id = ? AND symbol = ?', [req.params.userId, req.params.symbol]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET portfolio
app.get('/api/portfolio/:userId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT symbol, qty, avg_price FROM portfolios WHERE user_id = ? AND qty > 0', [req.params.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST trade (BUY / SELL)
app.post('/api/trade', async (req, res) => {
  const { userId, symbol, type, qty, price } = req.body;
  const total = qty * price;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get user balance
    const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (userRows.length === 0) throw new Error('User not found');
    let balance = parseFloat(userRows[0].balance);

    // 2. Get portfolio
    const [portRows] = await connection.query('SELECT qty, avg_price FROM portfolios WHERE user_id = ? AND symbol = ? FOR UPDATE', [userId, symbol]);
    let currentQty = portRows.length > 0 ? portRows[0].qty : 0;
    let currentAvgPrice = portRows.length > 0 ? parseFloat(portRows[0].avg_price) : 0;

    if (type === 'BUY') {
      if (balance < total) throw new Error('Saldo tidak mencukupi');
      
      balance -= total;
      const newQty = currentQty + qty;
      const newAvgPrice = ((currentQty * currentAvgPrice) + total) / newQty;

      await connection.query('UPDATE users SET balance = ? WHERE id = ?', [balance, userId]);
      
      if (portRows.length > 0) {
        await connection.query('UPDATE portfolios SET qty = ?, avg_price = ? WHERE user_id = ? AND symbol = ?', [newQty, newAvgPrice, userId, symbol]);
      } else {
        await connection.query('INSERT INTO portfolios (user_id, symbol, qty, avg_price) VALUES (?, ?, ?, ?)', [userId, symbol, newQty, newAvgPrice]);
      }
    } else if (type === 'SELL') {
      if (currentQty < qty) throw new Error('Jumlah saham tidak mencukupi');
      
      balance += total;
      const newQty = currentQty - qty;

      await connection.query('UPDATE users SET balance = ? WHERE id = ?', [balance, userId]);
      await connection.query('UPDATE portfolios SET qty = ? WHERE user_id = ? AND symbol = ?', [newQty, userId, symbol]);
    }

    // Record Transaction
    await connection.query('INSERT INTO transactions (user_id, symbol, type, qty, price, total) VALUES (?, ?, ?, ?, ?, ?)', [userId, symbol, type, qty, price, total]);

    await connection.commit();
    res.json({ success: true, balance });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

module.exports = app;
