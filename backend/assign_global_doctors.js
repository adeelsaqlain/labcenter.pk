require('dotenv').config();
const { pool } = require('./src/config/database');

async function run() {
  try {
    // 1. Get the Islamabad branch ID
    const [branches] = await pool.query('SELECT id, name FROM branches WHERE name LIKE "%Islamabad Diagnostic Center Islamabad%"');
    if (branches.length === 0) {
      console.log('Branch not found!');
      return;
    }
    const islamabadBranchId = branches[0].id;
    console.log('Islamabad Branch ID:', islamabadBranchId);

    // 2. Update doctors with NULL branch_id
    const [updateResult] = await pool.query('UPDATE referring_doctors SET branch_id = ? WHERE branch_id IS NULL', [islamabadBranchId]);
    console.log(`Updated ${updateResult.affectedRows} doctors.`);

    // 3. Verify
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
