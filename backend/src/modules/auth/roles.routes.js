const express = require('express');
const router = express.Router();
const rolesController = require('./roles.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden: Super Admin only' });
  }
  next();
};

router.use(authenticate);

router.get('/permissions', requireSuperAdmin, rolesController.getRolePermissions);
router.put('/permissions', requireSuperAdmin, rolesController.updateRolePermission);

module.exports = router;
