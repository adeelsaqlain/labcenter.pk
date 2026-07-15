const express = require('express');
const router = express.Router();
const { 
  getExpenses, 
  addExpense, 
  updateExpense, 
  deleteExpense, 
  getExpenseSummary,
  approveExpense
} = require('./expense.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

const requireManageExpenses = requirePermission('manage_expenses');

router.use(authenticate);
router.use(requireManageExpenses);

router.get('/', getExpenses);
router.post('/', addExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.patch('/:id/approve', approveExpense);
router.get('/summary', getExpenseSummary);

module.exports = router;
