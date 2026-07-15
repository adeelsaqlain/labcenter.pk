const express = require('express');
const router = express.Router();
const { getPatients, createPatient } = require('./patient.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

const requireManagePatients = requirePermission('manage_patients');

router.use(authenticate);

router.get('/', requireManagePatients, getPatients);
router.post('/', requireManagePatients, createPatient);

module.exports = router;
