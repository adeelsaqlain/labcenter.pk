require('dotenv').config();
const { pool } = require('./src/config/database');

async function runMigration() {
  try {
    console.log('Creating branch_test_prices table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branch_test_prices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NOT NULL,
        test_id INT NOT NULL,
        cost_price DECIMAL(10,2) DEFAULT NULL,
        price DECIMAL(10,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_branch_test (branch_id, test_id),
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
      );
    `);
    console.log('Table branch_test_prices created successfully.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
