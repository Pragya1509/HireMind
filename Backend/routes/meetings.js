// backend/routes/meetings.js
const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// Create meeting
router.post('/create', meetingController.createMeeting);

// Get user's meetings
router.get('/my-meetings', meetingController.getUserMeetings);

// Get specific meeting
router.get('/:roomId', meetingController.getMeeting);

// Join meeting
router.post('/:roomId/join', meetingController.joinMeeting);

// End meeting
router.post('/:roomId/end', meetingController.endMeeting);

module.exports = router;