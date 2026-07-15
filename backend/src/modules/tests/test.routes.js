const express = require('express');
const router = express.Router();
const testController = require('./test.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

router.use(authenticate);

const requireManageTests = requirePermission('manage_tests');

// Anyone can view test groups and tests
router.get('/groups', testController.getTestGroups);
router.get('/', testController.getTests);

// Super Admin or users with 'manage_tests' permission manage catalog
router.post('/groups', requireManageTests, testController.createTestGroup);
router.put('/groups/:id/toggle-active', requireManageTests, testController.toggleTestGroupActive);

router.post('/', requireManageTests, testController.createTest);
router.put('/:id', requireManageTests, testController.updateTest);
router.put('/:testId/branch-price', requireManageTests, testController.updateBranchTestPrice);
router.put('/:id/toggle-active', requireManageTests, testController.toggleTestActive);

// ---- Parameter Library (independent of any test) ----
router.get('/library/parameters', testController.getParameterLibrary);
router.post('/library/parameters', requireManageTests, testController.createLibraryParameter);
router.put('/library/parameters/:id', requireManageTests, testController.updateLibraryParameter);
router.delete('/library/parameters/:id', requireManageTests, testController.deleteLibraryParameter);

// ---- Test Parameters ----
router.get('/:testId/parameters', testController.getTestParameters);
router.post('/:testId/parameters', requireManageTests, testController.createTestParameter);
router.put('/:testId/parameters/:id', requireManageTests, testController.updateTestParameter);
router.post('/:testId/parameters/assign', requireManageTests, testController.assignParametersToTest);
router.delete('/:testId/parameters/:id', requireManageTests, testController.deleteTestParameter);

module.exports = router;
