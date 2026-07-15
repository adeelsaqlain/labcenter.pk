require('dotenv').config();
const { pool } = require('./src/config/database');

async function run() {
  try {
    const [r] = await pool.query('SELECT id, name, role, branch_id FROM users');
    console.table(r);
  } finally {
    pool.end();
  }
}
run();
