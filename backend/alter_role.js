require('dotenv').config();
const { pool } = require('./src/config/database');

async function main() {
  try {
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('SUPER_ADMIN','BRANCH_ADMIN','BRANCH_MANAGER','STAFF','LAB_TECHNICIAN','PATHOLOGIST') DEFAULT 'STAFF'");
    console.log('Successfully added BRANCH_MANAGER to role ENUM');
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await pool.end();
  }
}

main();
