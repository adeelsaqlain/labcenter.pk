require('dotenv').config();
const { pool } = require('./src/config/database');

async function test() {
  try {
    const [result] = await pool.query(
      `INSERT INTO branch_test_prices (branch_id, test_id, price, cost_price)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE price = VALUES(price), cost_price = VALUES(cost_price)`,
      [1, 1, 500, 200]
    );
    console.log('Success:', result);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    pool.end();
  }
}
test();
