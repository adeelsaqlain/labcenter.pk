require('dotenv').config();
const { pool } = require('./src/config/database');

async function run() {
  try {
    const [rows] = await pool.query(`
      SELECT rd.name as doctor_name, b.name as branch_name 
      FROM referring_doctors rd
      LEFT JOIN branches b ON rd.branch_id = b.id
      ORDER BY b.name, rd.name
    `);
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
