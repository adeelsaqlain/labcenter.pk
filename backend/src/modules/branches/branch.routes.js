const express = require('express');
const router = express.Router();
const branchController = require('./branch.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

const requireManageBranches = requirePermission('manage_branches');

router.use(authenticate);

// Get branches (any authenticated user can view branches, e.g. for dropdowns)
router.get('/', branchController.getBranches);

// Super Admin or users with 'manage_branches' permission
router.post('/', requireManageBranches, branchController.createBranch);
router.put('/:id', requireManageBranches, branchController.updateBranch);
router.put('/:id/toggle-active', requireManageBranches, branchController.toggleActive);

const configController = require('./branchTestConfig.controller');

// Branch tests
router.get('/:id/tests', branchController.getBranchTests);
router.post('/:id/tests', requireManageBranches, branchController.assignBranchTests);

// Branch Test Outsourcing Config
router.get('/:branchId/test-config', configController.getBranchTestConfig);
router.post('/:branchId/test-config', requireManageBranches, configController.saveBranchTestConfig);
router.get('/:branchId/available-source-branches', configController.getAvailableSourceBranches);

module.exports = router;
