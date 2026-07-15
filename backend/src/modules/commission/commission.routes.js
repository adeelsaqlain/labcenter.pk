const express = require('express');
const router = express.Router();
const commissionController = require('./commission.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

router.use(authenticate);
const requireCommission = requirePermission('manage_accounts');

router.post('/sync', requireCommission, commissionController.syncCommissions);
router.get('/', requireCommission, commissionController.getCommissions);
router.get('/receipt', requireCommission, commissionController.getSettlementReceipt);
router.get('/report', requireCommission, commissionController.getCommissionReport);
router.patch('/batch-paid', requireCommission, commissionController.markBranchPaid);
router.patch('/batch-received', requireCommission, commissionController.markBranchReceived);

module.exports = router;
