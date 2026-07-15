const express = require('express');
const router = express.Router();
const { 
  getStaffSalaries, 
  setStaffBaseSalary, 
  getSalaryTransactions, 
  addSalaryTransaction, 
  deleteSalaryTransaction 
} = require('./salary.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

const requireManageSalary = requirePermission('manage_salary');

router.use(authenticate);
router.use(requireManageSalary);

router.get('/staff', getStaffSalaries);
router.post('/staff/:userId/base', setStaffBaseSalary);

router.get('/transactions', getSalaryTransactions);
router.post('/transactions', addSalaryTransaction);
router.delete('/transactions/:id', deleteSalaryTransaction);

module.exports = router;
