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
    
    query += ` ORDER BY s.doctor_name ASC, s.branch_name ASC`;

    const [rows] = await pool.query(query, params);

    const grouped = {};
    rows.forEach(r => {
      const docKey = r.referring_doctor_id;
      if (!grouped[docKey]) {
        grouped[docKey] = {
          referring_doctor_id: r.referring_doctor_id,
          doctor_name: r.doctor_name,
          month: r.month,
          total_commission: 0,
          branches: {}
        };
      }

      const branchKey = r.branch_id;
      if (!grouped[docKey].branches[branchKey]) {
        grouped[docKey].branches[branchKey] = {
          branch_id: r.branch_id,
          branch_name: r.branch_name,
          total_commission: 0,
          items: []
        };
      }

      grouped[docKey].branches[branchKey].items.push(r);
      grouped[docKey].branches[branchKey].total_commission += parseFloat(r.commission_amount);
      grouped[docKey].total_commission += parseFloat(r.commission_amount);
    });

    const result = Object.values(grouped).map(doc => ({
      ...doc,
      branches: Object.values(doc.branches)
    }));

    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
