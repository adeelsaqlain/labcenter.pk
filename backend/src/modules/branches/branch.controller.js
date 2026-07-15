const { pool } = require('../../config/database');

// Auto-migration: add logo, receipt_mode & parent_id columns if missing
async function ensureBranchColumns() {
  const cols = [
    "ALTER TABLE branches ADD COLUMN logo LONGTEXT;",
    "ALTER TABLE branches ADD COLUMN receipt_mode VARCHAR(20) DEFAULT 'main_lab';",
    "ALTER TABLE branches ADD COLUMN parent_id INT NULL;",
    "ALTER TABLE branches ADD FOREIGN KEY (parent_id) REFERENCES branches(id) ON DELETE SET NULL;"
  ];
  for (const q of cols) {
    try { await pool.query(q); } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME' && e.code !== 'ER_DUP_KEY') console.error('Branch column migration:', e.message);
    }
  }
}
ensureBranchColumns();

async function getBranches(req, res, next) {
  try {
    const query = `
      SELECT b.*, p.name as parent_name 
      FROM branches b 
      LEFT JOIN branches p ON b.parent_id = p.id 
      ORDER BY b.created_at DESC
    `;
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function createBranch(req, res, next) {
  try {
    const { name, code, address, city, phone, email, logo, receipt_mode, parent_id } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO branches (name, code, address, city, phone, email, logo, receipt_mode, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, code, address, city, phone, email, logo || null, receipt_mode || 'main_lab', parent_id || null]
    );

    const [newBranch] = await pool.query('SELECT * FROM branches WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newBranch[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Branch code already exists' });
    }
    next(error);
  }
}

async function updateBranch(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, address, city, phone, email, logo, receipt_mode, parent_id } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required' });
    }

    await pool.query(
      'UPDATE branches SET name = ?, code = ?, address = ?, city = ?, phone = ?, email = ?, logo = ?, receipt_mode = ?, parent_id = ? WHERE id = ?',
      [name, code, address, city, phone, email, logo || null, receipt_mode || 'main_lab', parent_id || null, id]
    );

    res.json({ success: true, message: 'Branch updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Branch code already exists' });
    }
    next(error);
  }
}

async function toggleActive(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query('UPDATE branches SET is_active = ? WHERE id = ?', [is_active, id]);
    
    res.json({ success: true, message: 'Branch status updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function ensureBranchTestsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branch_tests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NOT NULL,
        test_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_branch_test (branch_id, test_id)
      )
    `);
  } catch (error) {
    console.error("Ensure branch_tests table error:", error);
  }
}
ensureBranchTestsTable();

async function getBranchTests(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT test_id FROM branch_tests WHERE branch_id = ?', [id]);
    res.json({ success: true, data: rows.map(r => r.test_id) });
  } catch (error) {
    next(error);
  }
}

async function assignBranchTests(req, res, next) {
  try {
    const { id } = req.params;
    let { testIds } = req.body;

    if (!Array.isArray(testIds)) {
      return res.status(400).json({ success: false, message: 'testIds must be an array' });
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      if (!req.user.is_parent_branch) {
        return res.status(403).json({ success: false, message: 'Forbidden: Only Parent Branches can assign tests' });
      }
      
      const targetIdNum = parseInt(id, 10);
      if (!req.user.child_branch_ids.includes(targetIdNum)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Can only assign tests to your child branches' });
      }

      // Filter testIds to only allow tests that the Parent branch has access to
      const [parentTestsRows] = await pool.query('SELECT test_id FROM branch_tests WHERE branch_id = ?', [req.user.branch_id]);
      const parentAllowedTestIds = parentTestsRows.map(r => r.test_id);
      testIds = testIds.filter(id => parentAllowedTestIds.includes(id));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clear existing tests for the branch
      await connection.query('DELETE FROM branch_tests WHERE branch_id = ?', [id]);

      // Insert new tests
      if (testIds.length > 0) {
        const values = testIds.map(testId => [id, testId]);
        await connection.query('INSERT INTO branch_tests (branch_id, test_id) VALUES ?', [values]);
      }

      await connection.commit();
      res.json({ success: true, message: 'Tests assigned successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  toggleActive,
  getBranchTests,
  assignBranchTests
};
