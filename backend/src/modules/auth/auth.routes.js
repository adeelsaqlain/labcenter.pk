const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

const { authenticate } = require('../../middleware/auth.middleware');

// Public route for login
router.post('/login', authController.login);

// Protected route to get fresh user context
router.get('/me', authenticate, authController.getMe);

module.exports = router;
