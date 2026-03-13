// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Generate interview questions
router.post('/generate-questions', aiController.generateQuestions);

// Analyze answer
router.post('/analyze-answer', aiController.analyzeAnswer);

// Generate interview summary
router.post('/generate-summary', aiController.generateSummary);

// Get AI response
router.post('/ai-response', aiController.getAIResponse);

module.exports = router;