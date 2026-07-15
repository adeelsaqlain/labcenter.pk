const { pool } = require('../config/database');

/**
 * Automatically appends WHERE branch_id = ? to queries when branchId is present.
 * SUPER_ADMIN with no branchId sees all data.
 */
async function scopedQuery(baseSQL, params = [], branchId = null) {
  let sql = baseSQL;
  if (branchId) {
    // Append branch filter
    const hasWhere = sql.toUpperCase().includes('WHERE');
    sql += hasWhere ? ' AND branch_id = ?' : ' WHERE branch_id = ?';
    params.push(branchId);
  }
  
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * For INSERT operations — auto-injects branch_id into the data object
 */
function injectBranchId(data, branchId) {
  if (branchId) {
    return { ...data, branch_id: branchId };
  }
  return data;
}

module.exports = { scopedQuery, injectBranchId };
