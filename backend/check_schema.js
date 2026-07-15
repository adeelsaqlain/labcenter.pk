require('dotenv').config();
const { pool } = require('./src/config/database');

async function check() {
  try {
    const [rows] = await pool.query('DESCRIBE test_parameters');
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
