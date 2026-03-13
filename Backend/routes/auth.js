// backend/routes/auth.js
// Authentication routes

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected routes (authentication required)
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;