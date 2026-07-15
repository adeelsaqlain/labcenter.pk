const express = require('express');
const router = express.Router();
const { getDoctors, createDoctor, updateDoctor, deleteDoctor } = require('./doctors.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

router.use(authenticate);

// Any authenticated user with manage_billing can view doctors (for booking dropdown)
router.get('/', getDoctors);

// Only users with manage_referring_doctors can manage doctors
const requireBilling = requirePermission('manage_referring_doctors');
router.post('/', requireBilling, createDoctor);
router.put('/:id', requireBilling, updateDoctor);
router.delete('/:id', requireBilling, deleteDoctor);

module.exports = router;
