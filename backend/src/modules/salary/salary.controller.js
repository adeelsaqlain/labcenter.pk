const { pool } = require('../../config/database');

async function ensureSalaryTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_salaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        branch_id INT NOT NULL,
        base_salary DECIMAL(10,2) DEFAULT 0,
        effective_from DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS salary_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        branch_id INT NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        type ENUM('ADVANCE', 'DEDUCTION', 'BONUS', 'PAYMENT') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        note TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Failed to create salary tables:', error);
  }
}

// Call on load
ensureSalaryTables();

async function getStaffSalaries(req, res, next) {
  try {
    const { branch_id } = req.query;
    
    let whereClause = 'u.role != "SUPER_ADMIN"';
    const params = [];

    // Filter by branch
    if (req.user.role !== 'SUPER_ADMIN') {
      // Non-super-admins can ONLY see their own branch
      whereClause += ' AND u.branch_id = ?';
      params.push(req.user.branch_id);
    } else if (branch_id && branch_id !== 'all') {
      whereClause += ' AND u.branch_id = ?';
      params.push(branch_id);
    }

    const [staff] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.branch_id,
        b.name as branch_name,
        COALESCE(ss.base_salary, 0) as base_salary,
        ss.effective_from
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN staff_salaries ss ON u.id = ss.user_id
      WHERE ${whereClause}
      ORDER BY u.name ASC
    `, params);

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
}

async function setStaffBaseSalary(req, res, next) {
  try {
    const { userId } = req.params;
    const { base_salary, effective_from } = req.body;
    
    // Get user's branch
    const [users] = await pool.query('SELECT branch_id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const branch_id = users[0].branch_id;

    await pool.query(`
      INSERT INTO staff_salaries (user_id, branch_id, base_salary, effective_from)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE base_salary = VALUES(base_salary), effective_from = VALUES(effective_from)
    `, [userId, branch_id, base_salary || 0, effective_from || null]);

    res.json({ success: true, message: 'Base salary updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function getSalaryTransactions(req, res, next) {
  try {
    const { month, year, branch_id, user_id } = req.query;
    
    let whereClause = '1=1';
    const params = [];

    if (month) {
      whereClause += ' AND st.month = ?';
      params.push(month);
    }
    if (year) {
      whereClause += ' AND st.year = ?';
      params.push(year);
    }
    if (user_id) {
       whereClause += ' AND st.user_id = ?';
       params.push(user_id);
    }
    
    if (req.user.role !== 'SUPER_ADMIN') {
      // Non-super-admins can ONLY see their own branch
      whereClause += ' AND st.branch_id = ?';
      params.push(req.user.branch_id);
    } else if (branch_id && branch_id !== 'all') {
      whereClause += ' AND st.branch_id = ?';
      params.push(branch_id);
    }

    const [transactions] = await pool.query(`
      SELECT 
        st.*,
        u.name as staff_name,
        cb.name as created_by_name
      FROM salary_transactions st
      JOIN users u ON st.user_id = u.id
      LEFT JOIN users cb ON st.created_by = cb.id
      WHERE ${whereClause}
      ORDER BY st.created_at DESC
    `, params);

    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
}

async function addSalaryTransaction(req, res, next) {
  try {
    const { user_id, month, year, type, amount, note } = req.body;
    
    if (!['ADVANCE', 'DEDUCTION', 'BONUS', 'PAYMENT'].includes(type)) {
       return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    const [users] = await pool.query('SELECT branch_id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const branch_id = users[0].branch_id;

    await pool.query(`
      INSERT INTO salary_transactions (user_id, branch_id, month, year, type, amount, note, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, branch_id, month, year, type, amount, note, req.user.id]);

    res.json({ success: true, message: 'Transaction added successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteSalaryTransaction(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM salary_transactions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStaffSalaries,
  setStaffBaseSalary,
  getSalaryTransactions,
  addSalaryTransaction,
  deleteSalaryTransaction
};
