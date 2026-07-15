const { verifyToken } = require('../utils/auth.helpers');
const { pool } = require('../config/database');

/**
 * Verifies JWT and attaches decoded user to req.user
 * Also computes the branch family for data sharing
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyToken(token);

    if (req.user.role !== 'SUPER_ADMIN' && req.user.branch_id) {
      const [branchRows] = await pool.query('SELECT id, parent_id FROM branches WHERE id = ?', [req.user.branch_id]);
      if (branchRows.length > 0) {
        const branchInfo = branchRows[0];
        req.user.is_parent_branch = (branchInfo.parent_id === null);
        const familyParentId = branchInfo.parent_id || branchInfo.id;
        req.user.branch_family_parent_id = familyParentId;
        
        const [familyRows] = await pool.query('SELECT id, parent_id FROM branches WHERE id = ? OR parent_id = ?', [familyParentId, familyParentId]);
        req.user.branch_family_ids = familyRows.map(r => r.id);
        
        if (req.user.is_parent_branch) {
          req.user.child_branch_ids = familyRows.filter(r => r.parent_id === req.user.branch_id).map(r => r.id);
        } else {
          req.user.child_branch_ids = [];
        }
      } else {
        req.user.branch_family_ids = [req.user.branch_id];
        req.user.branch_family_parent_id = req.user.branch_id;
        req.user.is_parent_branch = false;
        req.user.child_branch_ids = [];
      }
    } else {
      req.user.branch_family_ids = [];
      req.user.branch_family_parent_id = null;
      req.user.is_parent_branch = true; // SUPER_ADMIN acts as parent
      req.user.child_branch_ids = [];
      req.user.permissions = ['SUPER_ADMIN_ALL'];
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      const [permRows] = await pool.query('SELECT permission_key FROM role_permissions WHERE role_name = ? AND is_allowed = TRUE', [req.user.role]);
      req.user.permissions = permRows.map(r => r.permission_key);
    }

    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ success: false, message });
  }
}

const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (req.user.role === 'SUPER_ADMIN') return next();
    // Check exact match OR any granular sub-permission (e.g. 'manage_tests' matches 'manage_tests.view')
    const hasPermission = req.user.permissions.some(p => p === permissionKey || p.startsWith(permissionKey + '.'));
    if (hasPermission) return next();
    return res.status(403).json({ success: false, message: `Forbidden: Requires ${permissionKey} permission` });
  };
};

module.exports = { authenticate, requirePermission };
