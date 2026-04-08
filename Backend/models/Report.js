const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  question:    { type: String, default: '' },
  answer:      { type: String, default: '' },
  analysis:    { type: String, default: '' },
  score:       { type: Number, default: 0  },
  strengths:   [{ type: String }],
  improvements:[{ type: String }],
  modelAnswer: { type: String, default: '' },
  wordCount:   { type: Number, default: 0  },
  fillerCount: { type: Number, default: 0  },
  skipped:     { type: Boolean, default: false },
});

const reportSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:              { type: String, required: true },
  avgScore:          { type: Number, default: 0 },
  totalQuestions:    { type: Number, default: 0 },
  answeredQuestions: { type: Number, default: 0 },
  strongAnswers:     { type: Number, default: 0 },
  records:           [recordSchema],
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);