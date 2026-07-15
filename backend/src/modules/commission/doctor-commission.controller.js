const { pool } = require('../../config/database');

async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_commission_settlements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referring_doctor_id INT NOT NULL,
        doctor_name VARCHAR(255),
        branch_id INT NOT NULL,
        branch_name VARCHAR(255),
        month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM',
        invoice_id INT NOT NULL,
        invoice_number VARCHAR(100),
        patient_name VARCHAR(255),
        commission_amount DECIMAL(10,2) DEFAULT 0,
        status ENUM('PENDING','PAID','RECEIVED') DEFAULT 'PENDING',
        paid_by_id INT NULL,
        paid_by_name VARCHAR(255) NULL,
        paid_at TIMESTAMP NULL,
        received_by_id INT NULL,
        received_by_name VARCHAR(255) NULL,
        received_at TIMESTAMP NULL,
        paid_to_doctor_by_name VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_doc_settlement (invoice_id)
      )
    `);
  } catch (err) {
    console.error('[DoctorCommission] ensureTable error:', err.message);
  }
}

ensureTable();

// Migration: add paid_to_doctor_by_name if missing on existing installations
(async () => {
  try {
    await pool.query(
      `ALTER TABLE doctor_commission_settlements ADD COLUMN paid_to_doctor_by_name VARCHAR(255) NULL AFTER received_at`
    );
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') console.error('[DoctorCommission] migrate paid_to_doctor_by_name:', e.message);
  }
})();

async function syncDoctorCommissions(req, res, next) {
  try {
    const branchId = req.user.branch_id;
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    let query = `
      SELECT
        inv.id as invoice_id,
        inv.invoice_number,
        inv.branch_id,
        b.name as branch_name,
        inv.referring_doctor_id,
        rd.name as doctor_name,
        p.name as patient_name,
        inv.doctor_commission_amount as commission_amount,
        DATE_FORMAT(inv.created_at, '%Y-%m') as month
      FROM invoices inv
      JOIN patients p ON inv.patient_id = p.id
      JOIN referring_doctors rd ON inv.referring_doctor_id = rd.id
      LEFT JOIN branches b ON inv.branch_id = b.id
      WHERE inv.doctor_commission_amount > 0
    `;
    let params = [];

    if (!isSuperAdmin) {
      query += ` AND inv.branch_id = ?`;
      params.push(branchId);
    }

    const [invoices] = await pool.query(query, params);

    if (invoices.length === 0) return res.json({ success: true, synced: 0 });

    let synced = 0;
    for (const inv of invoices) {
      try {
        await pool.query(`
          INSERT INTO doctor_commission_settlements
            (referring_doctor_id, doctor_name, branch_id, branch_name, month,
             invoice_id, invoice_number, patient_name, commission_amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            invoice_number = VALUES(invoice_number),
            patient_name = VALUES(patient_name),
            commission_amount = VALUES(commission_amount)
        `, [
          inv.referring_doctor_id, inv.doctor_name, inv.branch_id, inv.branch_name, inv.month,
          inv.invoice_id, inv.invoice_number, inv.patient_name, inv.commission_amount
        ]);
        synced++;
      } catch (e) {
        // skip duplicates silently
      }
    }

    res.json({ success: true, synced });
  } catch (error) {
    next(error);
  }
}

async function getDoctorCommissions(req, res, next) {
  try {
    const { month } = req.query;
    const branchId = req.user.branch_id;
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required (YYYY-MM)' });
    }

    let query = `
      SELECT s.*, rb.name as registered_branch_name
      FROM doctor_commission_settlements s
      JOIN referring_doctors rd ON s.referring_doctor_id = rd.id
      LEFT JOIN branches rb ON rd.branch_id = rb.id
      WHERE s.month = ?
    `;
    let params = [month];

    if (!isSuperAdmin) {
      query += ` AND s.branch_id = ?`;
      params.push(branchId);
    }

    const [rows] = await pool.query(query, params);

    // Group by referring_doctor_id
    const grouped = {};
    rows.forEach(r => {
      const key = `${r.branch_id}_${r.referring_doctor_id}`;
      if (!grouped[key]) {
        grouped[key] = {
          branch_id: r.branch_id,
          branch_name: r.branch_name,
          referring_doctor_id: r.referring_doctor_id,
          doctor_name: r.doctor_name,
          registered_branch_name: r.registered_branch_name,
          month: r.month,
          total_commission: 0,
          items: []
        };
      }
      grouped[key].items.push(r);
      grouped[key].total_commission += parseFloat(r.commission_amount);
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    next(error);
  }
}

async function getMyDoctorAccount(req, res, next) {
  try {
    const { month } = req.query;
    let referring_doctor_id = req.user.referring_doctor_id;

    // Fallback: if token was issued before referring_doctor_id was added, look it up from DB
    if (!referring_doctor_id && req.user.id) {
      const [userRows] = await pool.query('SELECT referring_doctor_id FROM users WHERE id = ?', [req.user.id]);
      if (userRows.length > 0) referring_doctor_id = userRows[0].referring_doctor_id;
    }

    if (!referring_doctor_id) {
       return res.status(403).json({ success: false, message: 'You are not linked to a referring doctor profile.' });
    }

    if (!month) {
      return res.status(400).json({ success: false, message: 'month is required' });
    }

    const query = `
      SELECT 
        s.id, s.referring_doctor_id, s.doctor_name, s.branch_id, s.branch_name, s.month, 
        s.invoice_id, s.invoice_number, s.patient_name, s.commission_amount, s.status,
        s.paid_by_name, s.paid_at, s.received_by_name, s.received_at, s.paid_to_doctor_by_name, s.created_at,
        r.commission_percent, r.commission_category,
        db.name as doctor_registered_branch_name,
        db.address as doctor_registered_branch_address,
        db.phone as doctor_registered_branch_phone,
        db.email as doctor_registered_branch_email
      FROM doctor_commission_settlements s
      JOIN referring_doctors r ON s.referring_doctor_id = r.id
      LEFT JOIN branches db ON r.branch_id = db.id
      WHERE s.month = ? AND s.referring_doctor_id = ?
      ORDER BY s.branch_id, s.created_at DESC
    `;

    const [rows] = await pool.query(query, [month, referring_doctor_id]);

    const grouped = {};

    rows.forEach(r => {
      const docKey = r.referring_doctor_id;
      if (!grouped[docKey]) {
        grouped[docKey] = {
          referring_doctor_id: r.referring_doctor_id,
          doctor_name: r.doctor_name,
          doctor_registered_branch_name: r.doctor_registered_branch_name,
          doctor_registered_branch_address: r.doctor_registered_branch_address,
          doctor_registered_branch_phone: r.doctor_registered_branch_phone,
          doctor_registered_branch_email: r.doctor_registered_branch_email,
          month: r.month,
          paid_by_name: null,
          branches: {},
          total_commission: 0
        };
      }
      
      if (!grouped[docKey].paid_to_doctor_by_name && r.paid_to_doctor_by_name) {
        grouped[docKey].paid_to_doctor_by_name = r.paid_to_doctor_by_name;
      }
      
      if (!grouped[docKey].paid_by_name && r.paid_by_name) {
        grouped[docKey].paid_by_name = r.paid_by_name;
      }

      const branchKey = r.branch_id;
      if (!grouped[docKey].branches[branchKey]) {
        grouped[docKey].branches[branchKey] = {
          branch_id: r.branch_id,
          branch_name: r.branch_name,
          commission_percent: r.commission_percent,
          commission_category: r.commission_category,
          status: r.status, // We use the status of the first item (all items in a branch-month settle together)
          total_commission: 0,
          invoice_count: 0,
          items: []
        };
      }

      grouped[docKey].branches[branchKey].items.push(r);
      grouped[docKey].branches[branchKey].invoice_count += 1;
      grouped[docKey].branches[branchKey].total_commission += parseFloat(r.commission_amount);
      grouped[docKey].total_commission += parseFloat(r.commission_amount);
    });

    const result = Object.values(grouped).map(doc => ({
      ...doc,
      branches: Object.values(doc.branches)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function markPaid(req, res, next) {
  try {
    const { referring_doctor_id, branch_id, month } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    const [result] = await pool.query(`
      UPDATE doctor_commission_settlements
      SET status = 'PAID', paid_by_id = ?, paid_by_name = ?, paid_at = NOW()
      WHERE status = 'PENDING' 
        AND referring_doctor_id = ? 
        AND branch_id = ? 
        AND month = ?
    `, [userId, userName, referring_doctor_id, branch_id, month]);

    res.json({ success: true, message: 'Marked as paid', affectedRows: result.affectedRows });
  } catch (error) {
    next(error);
  }
}

async function markReceived(req, res, next) {
  try {
    const { referring_doctor_id, branch_id, month, received_by_name } = req.body;
    const userId = req.user.id;
    const rName = received_by_name || req.user.name;

    const [result] = await pool.query(`
      UPDATE doctor_commission_settlements
      SET status = 'RECEIVED', received_by_id = ?, received_by_name = ?, received_at = NOW()
      WHERE status = 'PAID' 
        AND referring_doctor_id = ? 
        AND branch_id = ? 
        AND month = ?
    `, [userId, rName, referring_doctor_id, branch_id, month]);

    res.json({ success: true, message: 'Marked as received', affectedRows: result.affectedRows });
  } catch (error) {
    next(error);
  }
}

async function payToDoctor(req, res, next) {
  try {
    const { referring_doctor_id, month } = req.body;
    const adminName = req.user.name;
    
    // Updates all RECEIVED branch payments to PAID_TO_DOCTOR for this doctor and month
    const [result] = await pool.query(`
      UPDATE doctor_commission_settlements
      SET status = 'PAID_TO_DOCTOR', paid_to_doctor_by_name = ?
      WHERE status = 'RECEIVED'
        AND referring_doctor_id = ?
        AND month = ?
    `, [adminName, referring_doctor_id, month]);

    res.json({ success: true, message: 'Paid to doctor', affectedRows: result.affectedRows });
  } catch (error) {
    next(error);
  }
}

async function confirmDoctorReceipt(req, res, next) {
  try {
    const { referring_doctor_id, month } = req.body;
    
    const [result] = await pool.query(`
      UPDATE doctor_commission_settlements
      SET status = 'CONFIRMED'
      WHERE status = 'PAID_TO_DOCTOR'
        AND referring_doctor_id = ?
        AND month = ?
    `, [referring_doctor_id, month]);

    res.json({ success: true, message: 'Doctor confirmed receipt', affectedRows: result.affectedRows });
  } catch (error) {
    next(error);
  }
}

async function getReceipt(req, res, next) {
  try {
    const { referring_doctor_id, branch_id, month } = req.query;

    const [rows] = await pool.query(`
      SELECT * FROM doctor_commission_settlements
      WHERE referring_doctor_id = ? 
        AND branch_id = ? 
        AND month = ?
        AND status IN ('PAID', 'RECEIVED', 'PAID_TO_DOCTOR', 'CONFIRMED')
    `, [referring_doctor_id, branch_id, month]);

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function getDoctorAccount(req, res, next) {
  try {
    const { month, doctor_id } = req.query;
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const branchFamilyIds = req.user.branch_family_ids || (req.user.branch_id ? [req.user.branch_id] : []);

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required (YYYY-MM)' });
    }

    let query = `
      SELECT s.*, 
             rd.commission_category, 
             rd.commission_percent,
             db.name as doctor_registered_branch_name,
             db.address as doctor_registered_branch_address,
             db.phone as doctor_registered_branch_phone,
             db.email as doctor_registered_branch_email
      FROM doctor_commission_settlements s
      JOIN referring_doctors rd ON s.referring_doctor_id = rd.id
      LEFT JOIN branches db ON rd.branch_id = db.id
      WHERE s.month = ?
    `;
    let params = [month];

    // For non-super-admins, restrict to branch family only
    if (!isSuperAdmin && branchFamilyIds.length > 0) {
      query += ` AND s.branch_id IN (${branchFamilyIds.map(() => '?').join(',')})`;
      params.push(...branchFamilyIds);
      // Only own branch registered doctor should show
      query += ` AND rd.branch_id = ?`;
      params.push(req.user.branch_id);
    }

    // Optionally filter by a specific doctor
    if (doctor_id) {
      query += ` AND s.referring_doctor_id = ?`;
      params.push(doctor_id);
    }

    query += ` ORDER BY s.doctor_name ASC, s.branch_name ASC`;

    const [rows] = await pool.query(query, params);

    // Group by doctor first, then by branch + status inside each doctor
    const grouped = {};
    rows.forEach(r => {
      const docKey = r.referring_doctor_id;
      if (!grouped[docKey]) {
        grouped[docKey] = {
          referring_doctor_id: r.referring_doctor_id,
          doctor_name: r.doctor_name,
          doctor_registered_branch_name: r.doctor_registered_branch_name,
          doctor_registered_branch_address: r.doctor_registered_branch_address,
          doctor_registered_branch_phone: r.doctor_registered_branch_phone,
          doctor_registered_branch_email: r.doctor_registered_branch_email,
          month: r.month,
          paid_by_name: null,
          paid_to_doctor_by_name: null,
          total_commission: 0,
          branches: {}
        };
      }
      
      if (!grouped[docKey].paid_to_doctor_by_name && r.paid_to_doctor_by_name) {
        grouped[docKey].paid_to_doctor_by_name = r.paid_to_doctor_by_name;
      }
      
      if (!grouped[docKey].paid_by_name && r.paid_by_name) {
        grouped[docKey].paid_by_name = r.paid_by_name;
      }

      const branchKey = `${r.branch_id}_${r.status}`;
      if (!grouped[docKey].branches[branchKey]) {
        grouped[docKey].branches[branchKey] = {
          branch_id: r.branch_id,
          branch_name: r.branch_name,
          status: r.status,
          commission_category: r.commission_category,
          commission_percent: r.commission_percent,
          total_commission: 0,
          invoice_count: 0,
          items: []
        };
      }

      grouped[docKey].branches[branchKey].items.push(r);
      grouped[docKey].branches[branchKey].invoice_count += 1;
      grouped[docKey].branches[branchKey].total_commission += parseFloat(r.commission_amount);
      grouped[docKey].total_commission += parseFloat(r.commission_amount);
    });

    // Convert nested branches object to array
    const result = Object.values(grouped).map(doc => ({
      ...doc,
      branches: Object.values(doc.branches)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  syncDoctorCommissions,
  getDoctorCommissions,
  getDoctorAccount,
  getMyDoctorAccount,
  markPaid,
  markReceived,
  payToDoctor,
  confirmDoctorReceipt,
  getReceipt
};
