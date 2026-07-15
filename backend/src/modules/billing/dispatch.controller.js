const { pool } = require('../../config/database');

async function getPendingDispatches(req, res, next) {
  try {
    const branchId = req.user.branch_id;
    // Get all OUTSOURCED items booked by this branch that are not dispatched yet, or have been dispatched but not received
    const query = `
      SELECT 
        ii.id as item_id,
        inv.invoice_number,
        p.name as patient_name,
        p.patient_code,
        t.name as test_name,
        t.test_code,
        ii.perform_branch_id as default_target_branch_id,
        b.name as default_target_branch_name,
        d.id as dispatch_id,
        d.dispatch_number,
        d.status as dispatch_status,
        d.to_branch_id as current_target_branch_id,
        tb.name as current_target_branch_name,
        ii.status as item_status
      FROM invoice_items ii
      JOIN invoices inv ON ii.invoice_id = inv.id
      JOIN patients p ON inv.patient_id = p.id
      JOIN tests t ON ii.test_id = t.id
      LEFT JOIN branches b ON ii.perform_branch_id = b.id
      LEFT JOIN test_dispatches d ON ii.dispatch_id = d.id
      LEFT JOIN branches tb ON d.to_branch_id = tb.id
      WHERE ii.is_outsourced = TRUE 
        AND inv.branch_id = ?
        AND ii.status != 'APPROVED'
      ORDER BY ii.created_at DESC
    `;
    const [rows] = await pool.query(query, [branchId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createDispatch(req, res, next) {
  try {
    const { invoice_item_id, target_branch_id } = req.body;
    const branchId = req.user.branch_id;

    // Validate item
    const [items] = await pool.query(`
      SELECT ii.id, ii.is_outsourced, ii.dispatch_id, inv.branch_id 
      FROM invoice_items ii 
      JOIN invoices inv ON ii.invoice_id = inv.id 
      WHERE ii.id = ?
    `, [invoice_item_id]);

    if (!items.length) return res.status(404).json({ success: false, message: 'Item not found' });
    const item = items[0];

    if (!item.is_outsourced) return res.status(400).json({ success: false, message: 'Test is not outsourced' });
    if (item.branch_id !== branchId) return res.status(403).json({ success: false, message: 'You can only dispatch tests booked by your branch' });
    if (item.dispatch_id) return res.status(400).json({ success: false, message: 'Test is already dispatched. Use override instead.' });
    const dispatchNumber = `DSP-${Date.now()}`;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create dispatch
      const [result] = await connection.query(`
        INSERT INTO test_dispatches (dispatch_number, invoice_item_id, from_branch_id, to_branch_id, status, dispatched_by, dispatched_at)
        VALUES (?, ?, ?, ?, 'DISPATCHED', ?, NOW())
      `, [dispatchNumber, invoice_item_id, branchId, target_branch_id, req.user.id]);

      const dispatchId = result.insertId;

      // Update invoice item
      await connection.query(`
        UPDATE invoice_items 
        SET dispatch_id = ?, perform_branch_id = ? 
        WHERE id = ?
      `, [dispatchId, target_branch_id, invoice_item_id]);

      await connection.commit();
      res.json({ success: true, message: 'Test dispatched successfully', dispatch_number: dispatchNumber });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
}

async function overrideDispatch(req, res, next) {
  try {
    const { id } = req.params; // dispatch ID
    const { target_branch_id } = req.body;
    const branchId = req.user.branch_id;

    const [dispatches] = await pool.query('SELECT * FROM test_dispatches WHERE id = ?', [id]);
    if (!dispatches.length) return res.status(404).json({ success: false, message: 'Dispatch not found' });
    
    const dispatch = dispatches[0];
    if (dispatch.from_branch_id !== branchId) return res.status(403).json({ success: false, message: 'Not authorized' });
    
    if (dispatch.status === 'RECEIVED' || dispatch.status === 'COMPLETED' || dispatch.status === 'IN_PROGRESS') {
      return res.status(400).json({ success: false, message: 'Cannot override dispatch that has already been received' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(`
        UPDATE test_dispatches 
        SET to_branch_id = ?, dispatched_by = ?, dispatched_at = NOW() 
        WHERE id = ?
      `, [target_branch_id, req.user.id, id]);

      await connection.query(`
        UPDATE invoice_items 
        SET perform_branch_id = ? 
        WHERE id = ?
      `, [target_branch_id, dispatch.invoice_item_id]);

      await connection.commit();
      res.json({ success: true, message: 'Dispatch overridden successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
}

async function getIncomingDispatches(req, res, next) {
  try {
    const branchId = req.user.branch_id;
    // Get all dispatches targeted to this branch that are pending receipt
    const query = `
      SELECT 
        d.id as dispatch_id,
        d.dispatch_number,
        d.status as dispatch_status,
        d.created_at,
        inv.invoice_number,
        p.name as patient_name,
        p.patient_code,
        t.name as test_name,
        t.test_code,
        b.name as from_branch_name
      FROM test_dispatches d
      JOIN invoice_items ii ON d.invoice_item_id = ii.id
      JOIN invoices inv ON ii.invoice_id = inv.id
      JOIN patients p ON inv.patient_id = p.id
      JOIN tests t ON ii.test_id = t.id
      JOIN branches b ON d.from_branch_id = b.id
      WHERE d.to_branch_id = ? AND d.status = 'DISPATCHED'
      ORDER BY d.created_at DESC
    `;
    const [rows] = await pool.query(query, [branchId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function receiveDispatch(req, res, next) {
  try {
    const { id } = req.params; // dispatch ID
    const branchId = req.user.branch_id;

    const [dispatches] = await pool.query('SELECT * FROM test_dispatches WHERE id = ?', [id]);
    if (!dispatches.length) return res.status(404).json({ success: false, message: 'Dispatch not found' });
    
    const dispatch = dispatches[0];
    if (dispatch.to_branch_id !== branchId) return res.status(403).json({ success: false, message: 'Not authorized to receive this dispatch' });
    if (dispatch.status !== 'DISPATCHED') return res.status(400).json({ success: false, message: `Cannot receive, status is ${dispatch.status}` });

    await pool.query(`
      UPDATE test_dispatches 
      SET status = 'RECEIVED', received_by = ?, received_at = NOW() 
      WHERE id = ?
    `, [req.user.id, id]);

    res.json({ success: true, message: 'Test received successfully. It is now in the Lab Technician queue.' });
  } catch (err) {
    next(err);
  }
}

async function getDispatchReport(req, res, next) {
  try {
    const branchId = req.user.branch_id;
    const { start_date, end_date } = req.query;

    let dateWhere = '';
    let params = [branchId];

    if (start_date && end_date) {
      dateWhere = ' AND DATE(d.created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const query = `
      SELECT 
        ii.id as item_id,
        inv.invoice_number,
        p.name as patient_name,
        p.phone as patient_phone,
        t.name as test_name,
        d.dispatch_number,
        d.status as dispatch_status,
        tb.name as to_branch_name,
        fb.name as from_branch_name,
        ii.status as item_status,
        d.created_at as dispatch_date
      FROM test_dispatches d
      JOIN invoice_items ii ON d.invoice_item_id = ii.id
      JOIN invoices inv ON ii.invoice_id = inv.id
      JOIN patients p ON inv.patient_id = p.id
      JOIN tests t ON ii.test_id = t.id
      JOIN branches tb ON d.to_branch_id = tb.id
      JOIN branches fb ON d.from_branch_id = fb.id
      WHERE d.from_branch_id = ?
      ${dateWhere}
      ORDER BY d.created_at DESC
    `;
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPendingDispatches,
  getIncomingDispatches,
  createDispatch,
  overrideDispatch,
  receiveDispatch,
  getDispatchReport
};
