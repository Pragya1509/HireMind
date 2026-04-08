const express = require('express');
const router  = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/save',      reportController.saveReport);
router.get('/my-reports', reportController.getMyReports);

module.exports = router;