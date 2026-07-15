require('dotenv').config();
const { pool } = require('./src/config/database');

async function migrate() {
  try {
    console.log('Adding results_data column to invoice_items...');
    await pool.query('ALTER TABLE invoice_items ADD COLUMN results_data JSON DEFAULT NULL');
    console.log('Done!');
  } catch (e) {
    if (e.message.includes('Duplicate')) {
      console.log('Column already exists, skipping.');
    } else {
      console.error(e.message);
    }
  }
  process.exit();
}

migrate();
