require('dotenv').config();
const { pool } = require('./src/config/database');

async function migrate() {
  try {
    console.log("Starting migrations...");

    // 1. Create branch_test_config table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branch_test_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NOT NULL,
        test_id INT NOT NULL,
        perform_mode ENUM('IN_HOUSE', 'OUTSOURCED') DEFAULT 'IN_HOUSE',
        default_source_branch_id INT NULL,
        cost_price DECIMAL(10,2) DEFAULT 0.00,
        selling_price DECIMAL(10,2) DEFAULT 0.00,
        booking_branch_profit_pct DECIMAL(5,2) DEFAULT 0.00,
        performing_branch_profit_pct DECIMAL(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_branch_test (branch_id, test_id),
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
        FOREIGN KEY (default_source_branch_id) REFERENCES branches(id) ON DELETE SET NULL
      )
    `);
    console.log("branch_test_config table created.");

    // 2. Create test_dispatches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_dispatches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dispatch_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_item_id INT NOT NULL,
        from_branch_id INT NOT NULL,
        to_branch_id INT NOT NULL,
        status ENUM('PENDING_DISPATCH', 'DISPATCHED', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PENDING_DISPATCH',
        dispatched_by INT NULL,
        dispatched_at TIMESTAMP NULL,
        received_by INT NULL,
        received_at TIMESTAMP NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_item_id) REFERENCES invoice_items(id) ON DELETE CASCADE,
        FOREIGN KEY (from_branch_id) REFERENCES branches(id),
        FOREIGN KEY (to_branch_id) REFERENCES branches(id),
        FOREIGN KEY (dispatched_by) REFERENCES users(id),
        FOREIGN KEY (received_by) REFERENCES users(id)
      )
    `);
    console.log("test_dispatches table created.");

    // 3. Alter invoice_items table
    const alterQueries = [
      "ALTER TABLE invoice_items ADD COLUMN is_outsourced BOOLEAN DEFAULT FALSE",
      "ALTER TABLE invoice_items ADD COLUMN perform_branch_id INT NULL",
      "ALTER TABLE invoice_items ADD COLUMN dispatch_id INT NULL",
      "ALTER TABLE invoice_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE invoice_items ADD COLUMN booking_profit_pct DECIMAL(5,2) DEFAULT 0.00",
      "ALTER TABLE invoice_items ADD COLUMN performing_profit_pct DECIMAL(5,2) DEFAULT 0.00",
      "ALTER TABLE invoice_items ADD COLUMN booking_profit_amount DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE invoice_items ADD COLUMN performing_profit_amount DECIMAL(10,2) DEFAULT 0.00"
    ];

    for (const q of alterQueries) {
      try {
        await pool.query(q);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.error("Migration error on alter:", err.message);
        }
      }
    }
    console.log("invoice_items table altered.");
    
    // Also migrate existing branch_tests to branch_test_config
    try {
      await pool.query(`
        INSERT IGNORE INTO branch_test_config (branch_id, test_id, perform_mode)
        SELECT branch_id, test_id, 'IN_HOUSE' FROM branch_tests
      `);
      console.log("Migrated existing branch_tests to branch_test_config.");
    } catch (err) {
      console.error("Error migrating branch_tests:", err.message);
    }

    console.log("Migrations complete.");
    process.exit(0);
  } catch (error) {
    console.error("Fatal Migration Error:", error);
    process.exit(1);
  }
}

migrate();
