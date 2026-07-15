require('dotenv').config();
const { pool } = require('./src/config/database');

async function run() {
  try {
    const isSuperAdmin = false;
    const branchFamilyIds = [8, 9, 10];
    const reqUserBranchId = 9;
    const month = '2026-07';

    let query = `
      SELECT s.* 
      FROM doctor_commission_settlements s
      JOIN referring_doctors rd ON s.referring_doctor_id = rd.id
      WHERE s.month = ?
    `;
    let params = [month];

    if (!isSuperAdmin && branchFamilyIds.length > 0) {
      query += ` AND s.branch_id IN (${branchFamilyIds.map(() => '?').join(',')})`;
      params.push(...branchFamilyIds);
      query += ` AND rd.branch_id = ?`;
      params.push(reqUserBranchId);
    }
    
    console.log(query, params);

    const [rows] = await pool.query(query, params);
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
