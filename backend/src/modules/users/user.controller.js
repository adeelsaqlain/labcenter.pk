const { pool } = require('../../config/database');
const { hashPassword } = require('../../utils/auth.helpers');

async function ensureRoles() {
  try {
    await pool.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('SUPER_ADMIN', 'BRANCH_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'DOCTOR') NOT NULL DEFAULT 'STAFF'
    `);
  } catch (error) {
    console.error("Failed to alter users role ENUM:", error.message);
  }
}
ensureRoles();

async function getUsers(req, res, next) {
  try {
    const { branch_id } = req.query;
    
    // Determine allowed branches for non-super admins
    let allowedBranchIds = null;
    if (req.user.role !== 'SUPER_ADMIN') {
      allowedBranchIds = req.user.branch_id ? [req.user.branch_id, ...(req.user.child_branch_ids || [])] : [];
    }

    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, u.branch_id, u.referring_doctor_id, b.name as branch_name 
      FROM users u 
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE 1=1
    `;
    let params = [];

    if (allowedBranchIds) {
      query += ` AND u.branch_id IN (?)`;
      params.push(allowedBranchIds);
    }

    if (branch_id) {
      // If they requested a specific branch, make sure it's allowed
      if (allowedBranchIds && !allowedBranchIds.includes(parseInt(branch_id))) {
        return res.json({ success: true, data: [] }); // Or 403
      }
      query += ' AND u.branch_id = ?';
      params.push(branch_id);
    }
    
    query += ' ORDER BY u.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { branch_id, referring_doctor_id, name, email, phone, role, password } = req.body;
    
    if (!name || !email || !role || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, role, and password are required' });
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      let allowedBranchIds = req.user.branch_id ? [req.user.branch_id, ...(req.user.child_branch_ids || [])] : [];

      if (role === 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Branch admins cannot create super admin roles' });
      }

      // DOCTOR accounts are global (no branch), skip branch check
      if (role !== 'DOCTOR') {
        if (!allowedBranchIds.includes(parseInt(branch_id))) {
          return res.status(403).json({ success: false, message: 'Branch admins can only create staff for their own branch or child branches' });
        }
        if (role === 'BRANCH_ADMIN') {
          // Branch admin can ONLY create another branch admin for their child branches, NOT their own branch
          const isChildBranch = allowedBranchIds.includes(parseInt(branch_id)) && parseInt(branch_id) !== req.user.branch_id;
          if (!isChildBranch) {
            return res.status(403).json({ success: false, message: 'Branch admins can only create admin roles for their child branches' });
          }
        }
      }
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await pool.query(
      'INSERT INTO users (branch_id, referring_doctor_id, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [branch_id || null, referring_doctor_id || null, name, email, phone, role, hashedPassword]
    );

    const [newUser] = await pool.query('SELECT id, name, email, phone, role, branch_id FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newUser[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { branch_id, referring_doctor_id, name, email, phone, role, password } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
    }

    // Authorization checks
    if (req.user.role !== 'SUPER_ADMIN') {
      let allowedBranchIds = req.user.branch_id ? [req.user.branch_id, ...(req.user.child_branch_ids || [])] : [];

      // Verify the user they are updating belongs to their scope
      const [targetUser] = await pool.query('SELECT branch_id FROM users WHERE id = ?', [id]);
      if (!targetUser.length || !allowedBranchIds.includes(targetUser[0].branch_id)) {
         return res.status(403).json({ success: false, message: 'You do not have permission to modify this user' });
      }

      if (branch_id && !allowedBranchIds.includes(parseInt(branch_id))) {
        return res.status(403).json({ success: false, message: 'Branch admins can only assign staff to their own or child branches' });
      }
      if (role === 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Branch admins cannot assign super admin roles' });
      }
      if (role === 'BRANCH_ADMIN') {
        const targetBranchId = parseInt(branch_id || targetUser[0].branch_id);
        const isChildBranch = allowedBranchIds.includes(targetBranchId) && targetBranchId !== req.user.branch_id;
        if (!isChildBranch) {
          return res.status(403).json({ success: false, message: 'Branch admins can only assign admin roles to their child branches' });
        }
      }
    }

    let query = 'UPDATE users SET name = ?, email = ?, phone = ?, role = ?, branch_id = ?, referring_doctor_id = ?';
    let params = [name, email, phone, role, branch_id || null, referring_doctor_id || null];

    if (password && password.trim() !== '') {
      const hashedPassword = await hashPassword(password);
      query += ', password_hash = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    next(error);
  }
}

async function toggleActive(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Optional: add checks so a user cannot deactivate themselves
    if (req.user.id == id) {
       return res.status(400).json({ success: false, message: 'Cannot change your own status' });
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      let allowedBranchIds = req.user.branch_id ? [req.user.branch_id, ...(req.user.child_branch_ids || [])] : [];

      const [targetUser] = await pool.query('SELECT branch_id FROM users WHERE id = ?', [id]);
      if (!targetUser.length || !allowedBranchIds.includes(targetUser[0].branch_id)) {
         return res.status(403).json({ success: false, message: 'You do not have permission to modify this user' });
      }
    }

    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);
    
    res.json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  toggleActive
};
