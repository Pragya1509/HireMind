const Report = require('../models/Report');

exports.saveReport = async (req, res) => {
  try {
    const { role, records } = req.body;
    if (!role || !Array.isArray(records))
      return res.status(400).json({ message: 'role and records are required' });

    const totalQuestions    = records.length;
    const answeredQuestions = records.filter(r => r.answer?.trim()).length;
    const strongAnswers     = records.filter(r => r.score >= 70).length;
    const avgScore = totalQuestions > 0
      ? Math.round(records.reduce((s, r) => s + (r.score || 0), 0) / totalQuestions) : 0;

    const report = await Report.create({
      candidate: req.user.id, role, records,
      totalQuestions, answeredQuestions, strongAnswers, avgScore,
    });
    res.status(201).json({ message: 'Report saved', report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ candidate: req.user.id }).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};