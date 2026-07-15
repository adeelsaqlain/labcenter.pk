require('dotenv').config();
const { pool } = require('./src/config/database');

async function migrate() {
  try {
    console.log('Adding result_remarks to invoice_items...');
    await pool.query('ALTER TABLE invoice_items ADD COLUMN result_remarks TEXT DEFAULT NULL;');
    console.log('Migration successful.');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Migration failed:', e);
    }
  } finally {
    pool.end();
  }
}
migrate();
