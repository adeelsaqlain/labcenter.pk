const { pool } = require('../../config/database');

// GET /api/branches/:branchId/test-config
async function getBranchTestConfig(req, res, next) {
  try {
    const { branchId } = req.params;
    
    // Validate permission (can they see this branch's config?)
    if (req.user.role === 'BRANCH_ADMIN' && !req.user.branch_family_ids.includes(parseInt(branchId))) {
      return res.status(403).json({ success: false, message: 'Access denied to this branch config' });
    }

    const query = `
      SELECT 
        btc.id as config_id,
        t.id as test_id,
        t.test_code,
        t.name as test_name,
        tg.name as test_group_name,
        btc.perform_mode,
        btc.default_source_branch_id,
        btc.cost_price,
        btc.selling_price,
        btc.booking_branch_profit_pct,
        btc.performing_branch_profit_pct
      FROM branch_test_config btc
      JOIN tests t ON btc.test_id = t.id
      JOIN test_groups tg ON t.test_group_id = tg.id
      WHERE btc.branch_id = ?
      ORDER BY tg.name, t.name
    `;
    
    const [rows] = await pool.query(query, [branchId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// POST /api/branches/:branchId/test-config
async function saveBranchTestConfig(req, res, next) {
  try {
    const { branchId } = req.params;
    const { configs } = req.body; // Array of objects

    if (req.user.role === 'BRANCH_ADMIN') {
      // Must own the branch
      if (!req.user.child_branch_ids.includes(parseInt(branchId))) {
        return res.status(403).json({ success: false, message: 'You can only configure your child branches' });
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clear existing configs for this branch
      await connection.query('DELETE FROM branch_test_config WHERE branch_id = ?', [branchId]);
      
      // Keep old branch_tests in sync for backward compatibility
      await connection.query('DELETE FROM branch_tests WHERE branch_id = ?', [branchId]);

      if (configs && configs.length > 0) {
        for (const c of configs) {
          const performMode = c.perform_mode || 'IN_HOUSE';
          const defaultSourceId = performMode === 'OUTSOURCED' ? (c.default_source_branch_id || null) : null;
          
          await connection.query(`
            INSERT INTO branch_test_config 
              (branch_id, test_id, perform_mode, default_source_branch_id, cost_price, selling_price, booking_branch_profit_pct, performing_branch_profit_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            branchId, 
            c.test_id, 
            performMode, 
            defaultSourceId, 
            c.cost_price || 0, 
            c.selling_price || 0, 
            c.booking_branch_profit_pct || 0, 
            c.performing_branch_profit_pct || 0
          ]);

          // Backward compatibility sync
          await connection.query('INSERT INTO branch_tests (branch_id, test_id) VALUES (?, ?)', [branchId, c.test_id]);
          
          // Also insert into branch_test_prices to override the global price if they set a selling_price
          if (c.selling_price && c.selling_price > 0) {
            // we override price at the family level as per existing logic
            await connection.query(`
              INSERT INTO branch_test_prices (branch_id, test_id, price) 
              VALUES (?, ?, ?) 
              ON DUPLICATE KEY UPDATE price = ?
            `, [req.user.branch_family_parent_id, c.test_id, c.selling_price, c.selling_price]);
          }
        }
      }

      await connection.commit();
      res.json({ success: true, message: 'Branch test configuration saved' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
}

// GET /api/branches/:branchId/available-source-branches
async function getAvailableSourceBranches(req, res, next) {
  try {
    const { branchId } = req.params;
    
    // Find parent of this branch
    const [bRows] = await pool.query('SELECT parent_id FROM branches WHERE id = ?', [branchId]);
    if (!bRows.length) return res.status(404).json({ success: false, message: 'Branch not found' });
    
    const parentId = bRows[0].parent_id;
    if (!parentId) {
      // It is a parent branch itself, so it can't outsource to anyone (or maybe itself, but it's IN_HOUSE)
      return res.json({ success: true, data: [] });
    }

    // Available sources = the parent + all other children of that parent (excluding itself)
    const [sources] = await pool.query(`
      SELECT id, name, code 
      FROM branches 
      WHERE (id = ? OR parent_id = ?) AND id != ?
    `, [parentId, parentId, branchId]);

    res.json({ success: true, data: sources });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBranchTestConfig,
  saveBranchTestConfig,
  getAvailableSourceBranches
};
