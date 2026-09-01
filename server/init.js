require('dotenv').config();
const mysql = require('mysql2/promise');

async function initDB() {
  const connection = await mysql.createConnection({
    host: '194.233.65.45',
    user: 'reez_users',
    password: '1$cL4_jcL+5$',
    database: 'reez_trade'
  });

  console.log('Connected to MySQL. Initializing tables...');

  // Create Users Table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      balance DECIMAL(15,2) DEFAULT 100000000.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Watchlists Table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS watchlists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      symbol VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_watchlist (user_id, symbol)
    )
  `);

  // Create Portfolio Table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      symbol VARCHAR(50) NOT NULL,
      qty INT NOT NULL DEFAULT 0,
      avg_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_portfolio (user_id, symbol)
    )
  `);

  // Create Transactions Table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      symbol VARCHAR(50) NOT NULL,
      type ENUM('BUY', 'SELL') NOT NULL,
      qty INT NOT NULL,
      price DECIMAL(15,2) NOT NULL,
      total DECIMAL(15,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Insert Default User if not exists
  const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
  if (rows.length === 0) {
    await connection.execute('INSERT INTO users (username) VALUES (?)', ['admin']);
    console.log('Default user "admin" created with Rp 100.000.000 balance.');
    
    // Add default watchlist for admin
    const [adminRow] = await connection.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    const adminId = adminRow[0].id;
    const defaultSymbols = ['BBCA', 'BBRI', 'GOTO', 'TLKM', 'BMRI'];
    for (const sym of defaultSymbols) {
      await connection.execute('INSERT INTO watchlists (user_id, symbol) VALUES (?, ?)', [adminId, sym]);
    }
  }

  console.log('Database initialization completed!');
  await connection.end();
}

initDB().catch(console.error);
