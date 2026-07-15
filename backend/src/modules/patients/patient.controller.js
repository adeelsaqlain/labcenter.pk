const { pool } = require('../../config/database');

async function getPatients(req, res, next) {
  try {
    const { branch_id } = req.query;
    let query = 'SELECT * FROM patients';
    let params = [];

    // If branch_id is provided, or if the user is not super admin
    if (req.user.role !== 'SUPER_ADMIN') {
      if (req.user.branch_family_ids && req.user.branch_family_ids.length > 0) {
        query += ' WHERE branch_id IN (?)';
        params.push(req.user.branch_family_ids);
      } else {
        query += ' WHERE branch_id = ?';
        params.push(-1); // Safety fallback if family is empty
      }
    } else if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function createPatient(req, res, next) {
  try {
    const { branch_id, name, age, gender, phone, father_husband_name, dob, email, cnic, address, blood_group, referred_by } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    // Default to the user's branch if they are not super admin
    const finalBranchId = req.user.role === 'SUPER_ADMIN' ? (branch_id || req.user.branch_id) : req.user.branch_id;

    // Auto-generate patient_code: PT-<timestamp>
    const patientCode = 'PT-' + Date.now();

    const [result] = await pool.query(
      `INSERT INTO patients (branch_id, patient_code, name, age, gender, phone, father_husband_name, dob, email, cnic, address, blood_group, referred_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalBranchId,
        patientCode,
        name,
        age || null,
        gender || 'Male',
        phone || null,
        father_husband_name || null,
        dob || null,
        email || null,
        cnic || null,
        address || null,
        blood_group || null,
        referred_by || null
      ]
    );

    const [newPatient] = await pool.query('SELECT * FROM patients WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newPatient[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPatients,
  createPatient
};
