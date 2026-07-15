require('dotenv').config({path: './.env'});
const { pool } = require('./src/config/database');

async function migrate() {
  try {
    // Check if column exists first
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'referring_doctor_id'");
    
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('SUPER_ADMIN','BRANCH_ADMIN','BRANCH_MANAGER','STAFF','LAB_TECHNICIAN','PATHOLOGIST','DOCTOR') DEFAULT 'STAFF'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN referring_doctor_id INT NULL");
    }
    await pool.query("ALTER TABLE doctor_commission_settlements MODIFY COLUMN status ENUM('PENDING','PAID','RECEIVED','PAID_TO_DOCTOR','CONFIRMED') DEFAULT 'PENDING'");
    console.log('Migration successful');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

migrate();
