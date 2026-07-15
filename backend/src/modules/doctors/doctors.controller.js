const { pool } = require('../../config/database');

async function ensureDoctorsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referring_doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NULL,
        clinic VARCHAR(255) NULL,
        specialization VARCHAR(255) NULL,
        branch_id INT NULL,
        commission_category ENUM('ON_TEST_RATE','ON_TEST_PROFIT') DEFAULT 'ON_TEST_RATE',
        commission_percent DECIMAL(5,2) DEFAULT 0,
        patient_discount_percent DECIMAL(5,2) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    if (err.code !== 'ER_TABLE_EXISTS_ERROR') console.error('[Doctors] ensureTable error:', err.message);
  }

  // Migrate existing table: add new columns if missing
  const alterCols = [
    ['commission_category', "ALTER TABLE referring_doctors ADD COLUMN commission_category ENUM('ON_TEST_RATE','ON_TEST_PROFIT') DEFAULT 'ON_TEST_RATE' AFTER commission_percent"],
    ['patient_discount_percent', 'ALTER TABLE referring_doctors ADD COLUMN patient_discount_percent DECIMAL(5,2) DEFAULT 0 AFTER commission_category'],
    ['referring_doctor_id', 'ALTER TABLE invoices ADD COLUMN referring_doctor_id INT NULL AFTER patient_id'],
    ['doctor_commission_amount', 'ALTER TABLE invoices ADD COLUMN doctor_commission_amount DECIMAL(10,2) DEFAULT 0 AFTER referring_doctor_id'],
    ['doctor_discount_amount', 'ALTER TABLE invoices ADD COLUMN doctor_discount_amount DECIMAL(10,2) DEFAULT 0 AFTER doctor_commission_amount'],
  ];

  for (const [colLabel, sql] of alterCols) {
    try {
      await pool.query(sql);
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME' && e.code !== 'ER_DUP_KEY') {
        console.error(`[Doctors] Error adding ${colLabel}:`, e.message);
      }
    }
  }
}

ensureDoctorsTable();

// ======================== CRUD ========================

async function getDoctors(req, res, next) {
  try {
    const { branch_id, active_only } = req.query;

    let whereClause = '1=1';
    const params = [];

    if (active_only === 'true') {
      whereClause += ' AND d.is_active = 1';
    }

    // Non-super-admins see doctors from their own branch family + global doctors (branch_id IS NULL)
    if (req.user.role !== 'SUPER_ADMIN') {
      const familyIds = req.user.branch_family_ids || [req.user.branch_id];
      if (branch_id && branch_id !== 'all') {
        const requestedId = parseInt(branch_id, 10);
        // Only allow filtering by branch if it belongs to their family
        if (familyIds.includes(requestedId)) {
          whereClause += ' AND (d.branch_id = ? OR d.branch_id IS NULL)';
          params.push(requestedId);
        } else {
          whereClause += ` AND (d.branch_id IN (${familyIds.map(() => '?').join(',')}) OR d.branch_id IS NULL)`;
          params.push(...familyIds);
        }
      } else {
        whereClause += ` AND (d.branch_id IN (${familyIds.map(() => '?').join(',')}) OR d.branch_id IS NULL)`;
        params.push(...familyIds);
      }
    } else if (branch_id && branch_id !== 'all') {
      whereClause += ' AND (d.branch_id = ? OR d.branch_id IS NULL)';
      params.push(parseInt(branch_id, 10));
    }

    const [rows] = await pool.query(`
      SELECT d.*, b.name as branch_name
      FROM referring_doctors d
      LEFT JOIN branches b ON d.branch_id = b.id
      WHERE ${whereClause}
      ORDER BY d.name ASC
    `, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function createDoctor(req, res, next) {
  try {
    const { 
      name, phone, clinic, specialization, 
      commission_category, commission_percent, patient_discount_percent, 
      branch_id,
      create_login, username, email, password
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Doctor name is required' });
    }

    if (create_login) {
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required to create a login.' });
      }
      
      const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ success: false, message: 'A user with this email already exists. Please use a different email.' });
      }
    }

    const finalBranchId = req.user.role === 'SUPER_ADMIN' ? (branch_id || null) : req.user.branch_id;
    const finalCategory = commission_category || 'ON_TEST_RATE';

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO referring_doctors (name, phone, clinic, specialization, commission_category, commission_percent, patient_discount_percent, branch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, phone || null, clinic || null, specialization || null, finalCategory, commission_percent || 0, patient_discount_percent || 0, finalBranchId]
      );
      
      const newDoctorId = result.insertId;

      if (create_login) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await connection.query(
          `INSERT INTO users (name, email, password_hash, role, branch_id, referring_doctor_id, is_active)
           VALUES (?, ?, ?, 'DOCTOR', ?, ?, 1)`,
          [name, email, hashedPassword, finalBranchId, newDoctorId]
        );
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        data: {
          id: newDoctorId, name, phone, clinic, specialization,
          commission_category: finalCategory,
          commission_percent: commission_percent || 0,
          patient_discount_percent: patient_discount_percent || 0,
          branch_id: finalBranchId
        }
      });
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
}

async function updateDoctor(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, clinic, specialization, commission_category, commission_percent, patient_discount_percent, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Doctor name is required' });
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      const [existing] = await pool.query('SELECT branch_id FROM referring_doctors WHERE id = ?', [id]);
      if (!existing[0] || existing[0].branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'You can only edit doctors created by your branch' });
      }
    }

    await pool.query(
      `UPDATE referring_doctors 
       SET name = ?, phone = ?, clinic = ?, specialization = ?, commission_category = ?, commission_percent = ?, patient_discount_percent = ?, is_active = ? 
       WHERE id = ?`,
      [
        name, phone || null, clinic || null, specialization || null,
        commission_category || 'ON_TEST_RATE',
        commission_percent || 0,
        patient_discount_percent || 0,
        is_active === false ? 0 : 1,
        id
      ]
    );

    res.json({ success: true, message: 'Doctor updated' });
  } catch (error) {
    next(error);
  }
}

async function deleteDoctor(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.role !== 'SUPER_ADMIN') {
      const [existing] = await pool.query('SELECT branch_id FROM referring_doctors WHERE id = ?', [id]);
      if (!existing[0] || existing[0].branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'You can only delete doctors created by your branch' });
      }
    }

    // Soft delete: just deactivate
    await pool.query('UPDATE referring_doctors SET is_active = 0 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Doctor deactivated successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
