require('dotenv').config();
const { pool } = require('./src/config/database');

async function check() {
  try {
    const [rows] = await pool.query('DESCRIBE invoice_items');
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
