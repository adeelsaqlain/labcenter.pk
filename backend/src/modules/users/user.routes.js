const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

const requireManageStaff = requirePermission('manage_staff');

router.use(authenticate);

router.get('/', requireManageStaff, userController.getUsers);
router.post('/', requireManageStaff, userController.createUser);
router.put('/:id', requireManageStaff, userController.updateUser);
router.put('/:id/toggle-active', requireManageStaff, userController.toggleActive);

module.exports = router;
