require('dotenv').config();
const { pool } = require('./src/config/database');

async function main() {
  try {
    const [cols] = await pool.query('DESCRIBE referring_doctors');
    console.log('Columns:', cols.map(c => c.Field));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

main();
