// config/db.js (CORRECT)
const mysql = require('mysql2/promise');

async function connectDB() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '914695', // Replace with your password
      database: 'coding_game',    // Replace with your database name
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully!');
    connection.release();
    
    // IMPORTANT: Assign to global
    global.db = pool;
    
    return pool;
  } catch (err) {
    console.error('❌ MySQL connection error:', err);
    throw err; // Important: throw error so startServer catches it
  }
}

module.exports = connectDB;
