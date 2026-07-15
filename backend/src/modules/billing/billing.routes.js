const express = require('express');
const router = express.Router();
const { 
  createInvoice, 
  getInvoices, 
  getInvoiceItemsByStatus,
  getTestStats,
  getDashboardStats,
  getTestItemDetails,
  getItemsByInvoice,
  submitTestResults, 
  updateTestStatus,
  generateTrackToken,
  getTrackInvoiceByToken,
  getProfitLossReport
} = require('./billing.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

// Public Tracking Endpoints
router.post('/track', generateTrackToken);
router.get('/track/:token', getTrackInvoiceByToken);

const requireManageBilling = requirePermission('manage_billing');

router.use(authenticate);

// Profit & Loss
const requireManageAccounts = requirePermission('manage_accounts');
router.get('/profit-loss', requireManageAccounts, getProfitLossReport);

// Invoices
router.post('/invoices', requireManageBilling, createInvoice);
router.get('/invoices', requireManageBilling, getInvoices);

// Test Execution
router.get('/dashboard-stats', getDashboardStats);
router.get('/items/stats', getTestStats);
router.get('/items', getInvoiceItemsByStatus);
router.get('/items/:itemId', getTestItemDetails);
router.get('/invoices/:invoiceId/items', getItemsByInvoice);
router.post('/items/:itemId/results', submitTestResults);
router.put('/items/:itemId/status', updateTestStatus);

module.exports = router;
