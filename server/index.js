require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

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

// GET user info (Login simulation)
app.get('/api/user/:username', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, balance FROM users WHERE username = ?', [req.params.username]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
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
