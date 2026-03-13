// backend/models/Meeting.js
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed'],
    default: 'scheduled'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in minutes
  },
  recordingUrl: {
    type: String
  },
  transcript: {
    type: String
  },
  aiAnalysis: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Meeting', meetingSchema);