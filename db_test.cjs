const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '194.233.65.45',
      user: 'reez_users',
      password: '1$cL4_jcL+5$',
      database: 'reez_trade'
    });
    console.log('Connection successful!');
    
    // Check tables
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables:', rows);
    
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
