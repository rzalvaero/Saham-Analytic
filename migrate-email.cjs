require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'reez_trade',
  });

  try {
    console.log("Checking if email column exists...");
    const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'email'");
    if (columns.length === 0) {
      console.log("Adding email column...");
      await connection.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER username");
      console.log("Email column added successfully.");
      
      // Update admin user with default email
      await connection.query("UPDATE users SET email = 'admin@reez.my.id' WHERE username = 'admin'");
    } else {
      console.log("Email column already exists.");
    }
  } catch (error) {
    console.error("Error updating database:", error);
  } finally {
    await connection.end();
  }
}

run();
