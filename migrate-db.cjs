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
    console.log("Checking if password column exists...");
    const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'password'");
    if (columns.length === 0) {
      console.log("Adding password column...");
      await connection.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT NULL AFTER username");
      console.log("Password column added successfully.");
    }

    console.log("Creating default admin user...");
    const [users] = await connection.query("SELECT * FROM users WHERE username = 'admin'");
    if (users.length === 0) {
      await connection.query("INSERT INTO users (username, password, balance) VALUES ('admin', 'admin', 50000000)");
      console.log("Admin user created.");
    } else {
      await connection.query("UPDATE users SET password = 'admin' WHERE username = 'admin'");
      console.log("Admin password updated.");
    }

    console.log("Database update complete!");
  } catch (error) {
    console.error("Error updating database:", error);
  } finally {
    await connection.end();
  }
}

run();
