require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'reez_trade',
  });

  try {
    const hashedPassword = await bcrypt.hash('admin', 10);
    await connection.query("UPDATE users SET password = ? WHERE username = 'admin'", [hashedPassword]);
    console.log("Admin password encrypted successfully.");
  } catch (error) {
    console.error("Error updating database:", error);
  } finally {
    await connection.end();
  }
}

run();
