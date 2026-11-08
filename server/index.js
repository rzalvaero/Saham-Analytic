require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reez_trade',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Cache in-memory untuk respons kilat
let liveStateCache = null;

// Pastikan tabel mt5_live_state tersedia
async function initLiveStateTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mt5_live_state (
        id INT PRIMARY KEY,
        data LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error init mt5_live_state table:', err.message);
  }
}
initLiveStateTable();

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

  // Simpan ke DB agar persisten antar instance Vercel
  try {
    const jsonStr = JSON.stringify(liveStateCache);
    await pool.query(`
      INSERT INTO mt5_live_state (id, data) VALUES (1, ?)
      ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP
    `, [jsonStr]);
  } catch (err) {
    console.error('Error simpan live state ke DB:', err.message);
  }

  res.json({ success: true, timestamp: Date.now() });
});

// GET: Publik membaca data live trade secara real-time
app.get('/api/trade-live', async (req, res) => {
  try {
    if (!liveStateCache) {
      const [rows] = await pool.query('SELECT data, updated_at FROM mt5_live_state WHERE id = 1');
      if (rows.length > 0) {
        liveStateCache = JSON.parse(rows[0].data);
        liveStateCache.db_updated_at = rows[0].updated_at;
      }
    }

    if (liveStateCache) {
      return res.json(liveStateCache);
    }

    // Default standby jika belum pernah sync
    return res.json({
      connected: false,
      message: 'Menunggu sync pertama dari terminal MetaTrader 5...',
      account: {
        login: '452003470',
        server: 'Exness-MT5Real',
        currency: 'IDC',
        balance_idc: 32296418.95,
        balance_rp: 322964,
        equity_idc: 32296418.95,
        equity_rp: 322964,
        floating_idc: 0,
        floating_rp: 0
      },
      positions_count: 0,
      positions: [],
      stats: {
        month_label: 'November 2026',
        gross_profit_idc: 62411514.19,
        gross_profit_rp: 624115,
        total_loss_idc: 86034853.45,
        total_loss_rp: 860349,
        total_wd_idc: 19159034,
        total_wd_rp: 191590,
        net_pnl_idc: -23623339.26,
        net_pnl_rp: -236233,
        winrate_pct: 52.2,
        profit_factor: 1.64,
        leaderboard: []
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
