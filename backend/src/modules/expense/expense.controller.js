const { pool } = require('../../config/database');

async function ensureExpenseTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        amount DECIMAL(10,2) NOT NULL,
        expense_date DATE NOT NULL,
        status ENUM('PENDING', 'APPROVED') DEFAULT 'PENDING',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Auto-migration for existing tables
    try {
      await pool.query('ALTER TABLE expenses ADD COLUMN status ENUM("PENDING", "APPROVED") DEFAULT "PENDING";');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
  } catch (error) {
    console.error('Failed to create expense table:', error);
  }
}

// Call on load
ensureExpenseTables();

async function getExpenses(req, res, next) {
  try {
    const { branch_id, month, year } = req.query;
    
    let whereClause = '1=1';
    const params = [];

    if (month && year) {
      whereClause += ' AND MONTH(e.expense_date) = ? AND YEAR(e.expense_date) = ?';
      params.push(month, year);
    } else if (year) {
      whereClause += ' AND YEAR(e.expense_date) = ?';
      params.push(year);
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      whereClause += ' AND e.branch_id = ?';
      params.push(req.user.branch_id);
    } else if (branch_id && branch_id !== 'all') {
      whereClause += ' AND e.branch_id = ?';
      params.push(branch_id);
    }

    const [expenses] = await pool.query(`
      SELECT 
        e.*,
        b.name as branch_name,
        cb.name as created_by_name
      FROM expenses e
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN users cb ON e.created_by = cb.id
      WHERE ${whereClause}
      ORDER BY e.expense_date DESC, e.id DESC
    `, params);

    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
}

async function addExpense(req, res, next) {
  try {
    const { branch_id, category, description, amount, expense_date } = req.body;
    
    const targetBranch = branch_id || req.user.branch_id;

    await pool.query(`
      INSERT INTO expenses (branch_id, category, description, amount, expense_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [targetBranch, category, description, amount, expense_date, req.user.id]);

    res.json({ success: true, message: 'Expense added successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateExpense(req, res, next) {
  try {
    const { id } = req.params;
    const { category, description, amount, expense_date } = req.body;
    
    const [rows] = await pool.query('SELECT status FROM expenses WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (rows[0].status === 'APPROVED' && !['SUPER_ADMIN', 'BRANCH_ADMIN', 'BRANCH_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Cannot edit an approved expense' });
    }

    await pool.query(`
      UPDATE expenses 
      SET category = ?, description = ?, amount = ?, expense_date = ?
      WHERE id = ?
    `, [category, description, amount, expense_date, id]);

    res.json({ success: true, message: 'Expense updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query('SELECT status FROM expenses WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (rows[0].status === 'APPROVED' && !['SUPER_ADMIN', 'BRANCH_ADMIN', 'BRANCH_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Cannot delete an approved expense' });
    }

    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function getExpenseSummary(req, res, next) {
  try {
    const { branch_id, month, year } = req.query;
    
    let whereClause = '1=1';
    const params = [];

    if (month && year) {
      whereClause += ' AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?';
      params.push(month, year);
    } else if (year) {
      whereClause += ' AND YEAR(expense_date) = ?';
      params.push(year);
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      whereClause += ' AND branch_id = ?';
      params.push(req.user.branch_id);
    } else if (branch_id && branch_id !== 'all') {
      whereClause += ' AND branch_id = ?';
      params.push(branch_id);
    }

    const [summary] = await pool.query(`
      SELECT category, SUM(amount) as total
      FROM expenses
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY total DESC
    `, params);

    const [totalRow] = await pool.query(`
      SELECT SUM(amount) as grand_total
      FROM expenses
      WHERE ${whereClause}
    `, params);

    res.json({ 
      success: true, 
      data: {
        byCategory: summary,
        total: parseFloat(totalRow[0].grand_total || 0)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function approveExpense(req, res, next) {
  try {
    if (!['SUPER_ADMIN', 'BRANCH_ADMIN', 'BRANCH_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only admins and managers can approve expenses' });
    }
    const { id } = req.params;
    await pool.query('UPDATE expenses SET status = "APPROVED" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Expense approved successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  approveExpense
};
