// backend/controllers/meetingController.js
const Meeting = require('../models/Meeting');
const { v4: uuidv4 } = require('uuid');

// Create new meeting
exports.createMeeting = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;

    // Generate unique room ID
    const roomId = uuidv4();

    const meeting = await Meeting.create({
      roomId,
      title: title || 'Interview Session',
      host: userId,
      participants: [{
        user: userId,
        joinedAt: new Date()
      }],
      status: 'ongoing',
      startTime: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting: {
        id: meeting._id,
        roomId: meeting.roomId,
        title: meeting.title,
        status: meeting.status
      }
    });

  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating meeting',
      error: error.message
    });
  }
};

// Get meeting by room ID
exports.getMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;

    const meeting = await Meeting.findOne({ roomId })
      .populate('host', 'name email')
      .populate('participants.user', 'name email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.status(200).json({
      success: true,
      meeting
    });

  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meeting',
      error: error.message
    });
  }
};

// Join meeting
exports.joinMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ roomId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user already in participants
    const alreadyJoined = meeting.participants.some(
      p => p.user.toString() === userId
    );

    if (!alreadyJoined) {
      meeting.participants.push({
        user: userId,
        joinedAt: new Date()
      });
      await meeting.save();
    }

    res.status(200).json({
      success: true,
      message: 'Joined meeting successfully',
      meeting: {
        id: meeting._id,
        roomId: meeting.roomId,
        title: meeting.title,
        status: meeting.status
      }
    });

  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining meeting',
      error: error.message
    });
  }
};

// End meeting
exports.endMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ roomId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Only host can end meeting
    if (meeting.host.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only host can end the meeting'
      });
    }

    meeting.status = 'completed';
    meeting.endTime = new Date();
    
    // Calculate duration in minutes
    const durationMs = meeting.endTime - meeting.startTime;
    meeting.duration = Math.round(durationMs / 60000);

    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting ended successfully',
      duration: meeting.duration
    });

  } catch (error) {
    console.error('End meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending meeting',
      error: error.message
    });
  }
};

// Get user's meetings
exports.getUserMeetings = async (req, res) => {
  try {
    const userId = req.user.id;

    const meetings = await Meeting.find({
      $or: [
        { host: userId },
        { 'participants.user': userId }
      ]
    })
    .populate('host', 'name email')
    .sort({ createdAt: -1 })
    .limit(20);

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings
    });

  } catch (error) {
    console.error('Get user meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meetings',
      error: error.message
    });
  }
};