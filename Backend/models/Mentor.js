// backend/models/Mentor.js
const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  role:            { type: String, required: true },       // "Software Engineer II"
  company:         { type: String, required: true },       // "Google"
  companyLogo:     { type: String, default: '🏢' },        // emoji
  experience:      { type: String, required: true },       // "2 years"
  location:        { type: String, required: true },       // "Bangalore, India"
  avatarInitials:  { type: String },                       // "AS" — auto-generated
  avatarColor:     { type: String, default: '#7c3aed' },   // hex for avatar bg
  bio:             { type: String, required: true, maxlength: 400 },
  expertise:       [{ type: String }],                     // ["DSA", "System Design"]
  languages:       [{ type: String }],                     // ["English", "Hindi"]
  sessionDuration: { type: String, default: '45 min' },
  email:           { type: String, required: true },       // real email — kept private, never sent to frontend
  rating:          { type: Number, default: 5.0, min: 1, max: 5 },
  sessions:        { type: Number, default: 0 },
  isActive:        { type: Boolean, default: true },
  photoUrl:        { type: String, default: '' },          // optional photo URL (Cloudinary etc.)
  createdAt:       { type: Date, default: Date.now },
});

// Auto-generate initials from name
mentorSchema.pre('save', function(next) {
  if (!this.avatarInitials && this.name) {
    const parts = this.name.trim().split(' ');
    this.avatarInitials = parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Mentor', mentorSchema);