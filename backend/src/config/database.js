const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lab_diagnostic',
  
  // === cPanel Shared Hosting Optimizations ===
  connectionLimit: 5,          // Keep LOW (5-10) for shared hosting
  maxIdle: 2,                  // Close idle connections to save memory
  idleTimeout: 30000,          // 30 seconds — shared hosts kill idle connections
  enableKeepAlive: true,       // Maintain stable connections
  keepAliveInitialDelay: 10000,// 10 seconds
  
  // === Production Safety ===
  waitForConnections: true,
  queueLimit: 0,               // Unlimited queue (prevents instant rejection)
  connectTimeout: 10000,       // 10s connection timeout
  
  // === Security ===
  multipleStatements: false,   // Prevent SQL injection via stacked queries
  timezone: '+00:00',          // Consistent UTC
  dateStrings: true,           // Return dates as strings to avoid JS Date issues
});

/**
 * Reusable transaction wrapper — handles acquire/begin/commit/rollback/release
 * @param {Function} callback - Async function receiving the connection
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release(); // CRITICAL: Always release back to pool
  }
}

module.exports = { pool, withTransaction };
