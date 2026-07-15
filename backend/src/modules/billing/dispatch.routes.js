const express = require('express');
const router = express.Router();
const dispatchController = require('./dispatch.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

// Dispatch routes
router.get('/pending', dispatchController.getPendingDispatches);
router.get('/incoming', dispatchController.getIncomingDispatches);
router.get('/report', dispatchController.getDispatchReport);
router.post('/', dispatchController.createDispatch);
router.put('/:id', dispatchController.overrideDispatch);
router.put('/:id/receive', dispatchController.receiveDispatch);

module.exports = router;
