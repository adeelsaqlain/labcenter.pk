const express = require('express');
const router = express.Router();
const controller = require('./doctor-commission.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/sync', requirePermission('manage_accounts'), controller.syncDoctorCommissions);
router.get('/account', requirePermission('manage_accounts'), controller.getDoctorAccount);
router.get('/', requirePermission('manage_accounts'), controller.getDoctorCommissions);
router.post('/mark-paid', requirePermission('manage_accounts'), controller.markPaid);
router.post('/mark-received', requirePermission('manage_accounts'), controller.markReceived);
router.post('/pay-to-doctor', requirePermission('manage_accounts'), controller.payToDoctor);
router.get('/receipt', requirePermission('manage_accounts'), controller.getReceipt);

// Doctor specific routes
router.get('/my-account', (req, res, next) => {
  console.log('[my-account] req.user:', JSON.stringify({ role: req.user.role, referring_doctor_id: req.user.referring_doctor_id, id: req.user.id }));
  if (req.user.role === 'DOCTOR' || req.user.role === 'SUPER_ADMIN') return next();
  return res.status(403).json({ success: false, message: 'Forbidden' });
}, controller.getMyDoctorAccount);

router.post('/confirm-receipt', (req, res, next) => {
  if (req.user.role === 'DOCTOR' || req.user.role === 'SUPER_ADMIN') return next();
  return res.status(403).json({ success: false, message: 'Forbidden' });
}, controller.confirmDoctorReceipt);

module.exports = router;
