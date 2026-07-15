const { pool } = require('../../config/database');

async function ensureCommissionTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commission_settlements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_branch_id INT NOT NULL,
        to_branch_id INT NOT NULL,
        from_branch_name VARCHAR(255),
        to_branch_name VARCHAR(255),
        month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM',
        invoice_item_id INT NOT NULL,
        invoice_number VARCHAR(100),
        dispatch_number VARCHAR(100),
        test_name VARCHAR(255),
        patient_name VARCHAR(255),
        cost_price DECIMAL(10,2) DEFAULT 0,
        booking_profit_amount DECIMAL(10,2) DEFAULT 0,
        performing_profit_amount DECIMAL(10,2) DEFAULT 0,
        status ENUM('PENDING','PAID','RECEIVED') DEFAULT 'PENDING',
        paid_by_id INT NULL,
        paid_by_name VARCHAR(255) NULL,
        paid_at TIMESTAMP NULL,
        received_by_id INT NULL,
        received_by_name VARCHAR(255) NULL,
        received_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_settlement_item (invoice_item_id)
      )
    `);
  } catch (err) {
    if (err.code !== 'ER_TABLE_EXISTS_ERROR') console.error('[Commission] ensureTable error:', err.message);
  }

  // Ensure new columns exist for discount tracking
  try {
    await pool.query('ALTER TABLE commission_settlements ADD COLUMN test_rate DECIMAL(10,2) DEFAULT 0 AFTER patient_name');
    await pool.query('ALTER TABLE commission_settlements ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0 AFTER test_rate');
    await pool.query('ALTER TABLE commission_settlements ADD COLUMN discounted_price DECIMAL(10,2) DEFAULT 0 AFTER discount_percentage');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error('[Commission] Error adding columns:', err.message);
  }
}

ensureCommissionTable();

/**
 * Sync approved outsourced invoice_items into commission_settlements.
 * Called on page load from frontend.
 * Groups records by invoice_item so they are idempotent.
 */
async function syncCommissions(req, res, next) {
  try {
    const branchId = req.user.branch_id;
    const familyIds = req.user.branch_family_ids || [branchId];

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    let query = `
      SELECT
        ii.id as invoice_item_id,
        ii.cost_price,
        ii.booking_profit_amount,
        ii.performing_profit_amount,
        ii.perform_branch_id as to_branch_id,
        inv.branch_id as from_branch_id,
        inv.invoice_number,
        ii.price as test_rate,
        inv.subtotal,
        inv.total_amount,
        d.dispatch_number,
        t.name as test_name,
        p.name as patient_name,
        fb.name as from_branch_name,
        tb.name as to_branch_name,
        DATE_FORMAT(ii.updated_at, '%Y-%m') as month
      FROM invoice_items ii
      JOIN invoices inv ON ii.invoice_id = inv.id
      JOIN tests t ON ii.test_id = t.id
      JOIN patients p ON inv.patient_id = p.id
      LEFT JOIN test_dispatches d ON ii.dispatch_id = d.id
      LEFT JOIN branches fb ON inv.branch_id = fb.id
      LEFT JOIN branches tb ON ii.perform_branch_id = tb.id
      WHERE ii.is_outsourced = TRUE
        AND d.id IS NOT NULL
        AND inv.branch_id != ii.perform_branch_id
    `;
    let params = [];

    if (!isSuperAdmin) {
      query += ` AND (inv.branch_id IN (?) OR ii.perform_branch_id IN (?))`;
      params.push(familyIds, familyIds);
    }

    const [items] = await pool.query(query, params);

    if (items.length === 0) return res.json({ success: true, synced: 0 });

    let synced = 0;
    for (const item of items) {
      try {
        const discountRatio = parseFloat(item.subtotal) > 0 ? (parseFloat(item.total_amount) / parseFloat(item.subtotal)) : 1;
        const discountedPrice = parseFloat(item.test_rate) * discountRatio;
        let discountPercentage = 0;
        if (parseFloat(item.test_rate) > 0) {
           discountPercentage = ((parseFloat(item.test_rate) - discountedPrice) / parseFloat(item.test_rate)) * 100;
        }

        await pool.query(`
          INSERT INTO commission_settlements
            (from_branch_id, to_branch_id, from_branch_name, to_branch_name, month,
             invoice_item_id, invoice_number, dispatch_number, test_name, patient_name,
             test_rate, discount_percentage, discounted_price,
             cost_price, booking_profit_amount, performing_profit_amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            invoice_number = VALUES(invoice_number),
            dispatch_number = VALUES(dispatch_number),
            month = VALUES(month),
            test_rate = VALUES(test_rate),
            discount_percentage = VALUES(discount_percentage),
            discounted_price = VALUES(discounted_price),
            cost_price = VALUES(cost_price),
            booking_profit_amount = VALUES(booking_profit_amount),
            performing_profit_amount = VALUES(performing_profit_amount)
        `, [
          item.from_branch_id, item.to_branch_id,
          item.from_branch_name, item.to_branch_name,
          item.month,
          item.invoice_item_id, item.invoice_number, item.dispatch_number,
          item.test_name, item.patient_name,
          item.test_rate || 0, discountPercentage, discountedPrice,
          item.cost_price || 0, item.booking_profit_amount || 0, item.performing_profit_amount || 0
        ]);
        synced++;
      } catch (e) {
        // skip duplicates silently
      }
    }

    res.json({ success: true, synced });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/commissions?type=pay&month=YYYY-MM
 * type=pay   → from_branch_id = current branch (we owe performing branch)
 * type=collect → to_branch_id = current branch (booking branch owes us)
 */
async function getCommissions(req, res, next) {
  try {
    const { type = 'pay', month, branch_id: filterBranchId } = req.query;
    const branchId = req.user.branch_id;
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isParent = req.user.is_parent_branch === true;
    const familyIds = req.user.branch_family_ids || [branchId];

    if (!month) return res.status(400).json({ success: false, message: 'month is required (YYYY-MM)' });

    // branchField = the "owner" side (who is paying or collecting)
    const branchField = type === 'pay' ? 'from_branch_id' : 'to_branch_id';

    let query = `SELECT cs.* FROM commission_settlements cs WHERE month = ?`;
    let params = [month];

    if (!isSuperAdmin) {
      if (isParent) {
        // Parent branch sees commissions for ALL branches in its family
        query += ` AND ${branchField} IN (?)`;
        params.push(familyIds);
      } else {
        // Child branch sees ONLY its own commissions — strict isolation
        query += ` AND ${branchField} = ?`;
        params.push(branchId);
      }
    }

    // Optional counterpart branch filter (from branch selector dropdown)
    if (filterBranchId) {
      const counterpartField = type === 'pay' ? 'to_branch_id' : 'from_branch_id';
      query += ` AND ${counterpartField} = ?`;
      params.push(filterBranchId);
    }

    query += ` ORDER BY cs.created_at DESC`;

    const [rows] = await pool.query(query, params);

    // Group by counterpart branch for summary
    // - SuperAdmin & Parent: group by full pair (from_id + to_id) so each child's row is separate
    // - Child branch: group by counterpart only (one row per branch they transact with)
    const grouped = {};
    for (const row of rows) {
      let key;
      let displayName;
      let branchIdForAction;

      if (isSuperAdmin || isParent) {
        // Group by both sides so XYZ123→Multan and XYZ456→Multan are separate rows
        key = `${row.from_branch_id}_${row.to_branch_id}`;
        displayName = `${row.from_branch_name} → ${row.to_branch_name}`;
        branchIdForAction = type === 'pay' ? row.to_branch_id : row.from_branch_id;
      } else {
        // Child branch: group by counterpart
        key = type === 'pay' ? row.to_branch_id : row.from_branch_id;
        displayName = type === 'pay' ? row.to_branch_name : row.from_branch_name;
        branchIdForAction = key;
      }

      if (!grouped[key]) {
        grouped[key] = {
          branch_id: branchIdForAction,
          from_branch_id: row.from_branch_id,
          to_branch_id: row.to_branch_id,
          from_branch_name: row.from_branch_name,
          to_branch_name: row.to_branch_name,
          branch_name: displayName,
          total_cost_price: 0,
          total_booking_profit: 0,
          total_performing_profit: 0,
          total_to_pay: 0,
          items: []
        };
      }
      grouped[key].total_cost_price += Number(row.cost_price) || 0;
      grouped[key].total_booking_profit += Number(row.booking_profit_amount) || 0;
      grouped[key].total_performing_profit += Number(row.performing_profit_amount) || 0;
      grouped[key].total_to_pay += (Number(row.cost_price) || 0) + (Number(row.performing_profit_amount) || 0);
      grouped[key].items.push(row);
    }

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/commissions/batch-paid  { branch_id, month }
 * Booking branch marks ALL PENDING items for a specific counterpart branch as PAID
 */
async function markBranchPaid(req, res, next) {
  try {
    const { counterpart_branch_id, from_branch_id, to_branch_id, month } = req.body;
    const branchId = req.user.branch_id;
    const userName = req.user.name;
    const userId = req.user.id;
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    if (!month || (!counterpart_branch_id && (!from_branch_id || !to_branch_id))) {
      return res.status(400).json({ success: false, message: 'branch ids and month are required' });
    }

    const familyIds = req.user.branch_family_ids || [branchId];

    let query = `
      UPDATE commission_settlements
      SET status = 'PAID', paid_by_id = ?, paid_by_name = ?, paid_at = NOW()
      WHERE month = ? AND status = 'PENDING'
    `;
    let params = [userId, userName, month];

    // When explicit from/to IDs are provided (parent or super admin acting on specific pair), use them
    if (from_branch_id && to_branch_id) {
      query += ` AND from_branch_id = ? AND to_branch_id = ?`;
      params.push(from_branch_id, to_branch_id);
    } else {
      // Child branch: mark their own commissions to the counterpart
      query += ` AND from_branch_id = ? AND to_branch_id = ?`;
      params.push(branchId, counterpart_branch_id);
    }

    const [result] = await pool.query(query, params);

    res.json({ success: true, updated: result.affectedRows });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/commissions/batch-received  { counterpart_branch_id, month }
 * Performing branch marks ALL PAID items for a specific booking branch as RECEIVED
 */
async function markBranchReceived(req, res, next) {
  try {
    const { counterpart_branch_id, from_branch_id, to_branch_id, month } = req.body;
    const branchId = req.user.branch_id;
    const userName = req.user.name;
    const userId = req.user.id;
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    if (!month || (!counterpart_branch_id && (!from_branch_id || !to_branch_id))) {
      return res.status(400).json({ success: false, message: 'branch ids and month are required' });
    }

    const familyIds = req.user.branch_family_ids || [branchId];

    let query = `
      UPDATE commission_settlements
      SET status = 'RECEIVED', received_by_id = ?, received_by_name = ?, received_at = NOW()
      WHERE month = ? AND status = 'PAID'
    `;
    let params = [userId, userName, month];

    // When explicit from/to IDs are provided (parent or super admin acting on specific pair), use them
    if (from_branch_id && to_branch_id) {
      query += ` AND from_branch_id = ? AND to_branch_id = ?`;
      params.push(from_branch_id, to_branch_id);
    } else {
      // Child branch: receive their own commissions from the counterpart
      query += ` AND to_branch_id = ? AND from_branch_id = ?`;
      params.push(branchId, counterpart_branch_id);
    }

    const [result] = await pool.query(query, params);

    res.json({ success: true, updated: result.affectedRows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/commissions/receipt?from_branch_id=&to_branch_id=&month=
 * Returns settlement details for printing receipt
 */
async function getSettlementReceipt(req, res, next) {
  try {
    const { from_branch_id, to_branch_id, month } = req.query;
    if (!from_branch_id || !to_branch_id || !month) {
      return res.status(400).json({ success: false, message: 'from_branch_id, to_branch_id, month required' });
    }

    const [rows] = await pool.query(`
      SELECT * FROM commission_settlements
      WHERE from_branch_id = ? AND to_branch_id = ? AND month = ?
        AND status = 'RECEIVED'
      ORDER BY created_at DESC
    `, [from_branch_id, to_branch_id, month]);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/commissions/report?type=pay|collect&month=YYYY-MM
 * Returns all commissions for all branches (for reports page), grouped by counterpart branch
 */
async function getCommissionReport(req, res, next) {
  try {
    const { type = 'pay', month, start_date, end_date } = req.query;
    const branchId = req.user.branch_id;
    const branchField = type === 'pay' ? 'from_branch_id' : 'to_branch_id';

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    let dateFilter = '';
    let dateParams = [];
    if (start_date && end_date) {
      // Use created_at for exact date range filtering
      dateFilter = 'DATE(created_at) BETWEEN ? AND ?';
      dateParams = [start_date, end_date];
    } else if (month) {
      dateFilter = 'month = ?';
      dateParams = [month];
    }

    let query = `SELECT * FROM commission_settlements WHERE 1=1`;
    let params = [];

    if (dateFilter) {
      query += ` AND ${dateFilter}`;
      params.push(...dateParams);
    }

    const familyIds = req.user.branch_family_ids || [branchId];
    const isParent = req.user.is_parent_branch === true;

    if (!isSuperAdmin) {
      if (isParent) {
        query += ` AND ${branchField} IN (?)`;
        params.push(familyIds);
      } else {
        query += ` AND ${branchField} = ?`;
        params.push(branchId);
      }
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  syncCommissions,
  getCommissions,
  markBranchPaid,
  markBranchReceived,
  getSettlementReceipt,
  getCommissionReport,
};
