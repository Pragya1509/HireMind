const express     = require('express');
const router      = express.Router();
const aiCtrl      = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

console.log('🚨 AI ROUTE FILE LOADED');

// ── Public routes (no login needed) ──────────────────────────────────────────
router.post('/generate-questions', aiCtrl.generateQuestions);
router.post('/analyze-answer',     aiCtrl.analyzeAnswer);
router.post('/get-response',       aiCtrl.getAIResponse);

// ── Protected routes (login required) ────────────────────────────────────────
router.post('/save-report', protect, aiCtrl.saveReport);
router.get('/my-reports',   protect, aiCtrl.getMyReports);
router.post('/generate-roadmap', protect, aiCtrl.generateRoadmap); 


module.exports = router;