require('dotenv').config();
const { pool } = require('./src/config/database');

async function check() {
  try {
    const [tp] = await pool.query('SELECT test_id, parameter_name FROM test_parameters');
    console.log(tp);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
