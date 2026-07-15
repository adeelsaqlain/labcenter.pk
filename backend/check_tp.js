require('dotenv').config();
const { pool } = require('./src/config/database');

async function check() {
  try {
    const [tp] = await pool.query('SELECT * FROM test_parameters');
    console.log('Test Parameters:', tp.length);
    
    const [t] = await pool.query('SELECT id, name FROM tests');
    console.log('Tests:', t);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
