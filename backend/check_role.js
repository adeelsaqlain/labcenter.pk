require('dotenv').config();
const { pool } = require('./src/config/database');

async function main() {
  try {
    const [rows] = await pool.query('SHOW COLUMNS FROM users LIKE "role"');
    console.log('--- ROLE COLUMN ---');
    console.log(rows[0]);
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await pool.end();
  }
}

main();
