const { pool } = require('./src/config/database');

async function checkTests() {
  const [rows] = await pool.query('SELECT * FROM tests LIMIT 1');
  console.log(rows);
  process.exit(0);
}
checkTests();
