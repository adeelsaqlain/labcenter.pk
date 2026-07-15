const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');

// Settings are global, so typically SUPER_ADMIN only
router.get('/public', settingsController.getPublicSettings); // no auth needed for login page
router.get('/', authenticate, settingsController.getSettings);
router.put('/', authenticate, authorize('SUPER_ADMIN'), settingsController.updateSettings);

module.exports = router;
