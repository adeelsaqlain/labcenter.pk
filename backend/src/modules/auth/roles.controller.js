const { pool } = require('../../config/database');

async function getRolePermissions(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT role_name, permission_key, is_allowed FROM role_permissions');
    
    // Group by role for easy consumption by the frontend matrix
    const matrix = rows.reduce((acc, row) => {
      if (!acc[row.role_name]) acc[row.role_name] = {};
      acc[row.role_name][row.permission_key] = !!row.is_allowed;
      return acc;
    }, {});

    res.json({ success: true, data: matrix });
  } catch (error) {
    next(error);
  }
}

async function updateRolePermission(req, res, next) {
  try {
    const { role_name, permission_key, is_allowed } = req.body;
    
    if (!role_name || !permission_key) {
      return res.status(400).json({ success: false, message: 'Missing role_name or permission_key' });
    }

    await pool.query(
      `INSERT INTO role_permissions (role_name, permission_key, is_allowed)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed)`,
      [role_name, permission_key, is_allowed]
    );

    res.json({ success: true, message: 'Permission updated successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRolePermissions,
  updateRolePermission
};
