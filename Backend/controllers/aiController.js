// backend/controllers/aiController.js
const aiService = require('../services/aiService');

// Generate interview questions
exports.generateQuestions = async (req, res) => {
  try {
    const { role, count } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const questions = await aiService.generateInterviewQuestions(
      role, 
      count || 5
    );

    res.status(200).json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating questions',
      error: error.message
    });
  }
};

// Analyze answer
exports.analyzeAnswer = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    const analysis = await aiService.analyzeAnswer(question, answer);

    res.status(200).json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Analyze answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing answer',
      error: error.message
    });
  }
};

// Generate interview summary
exports.generateSummary = async (req, res) => {
  try {
    const { transcript, duration } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'Transcript is required'
      });
    }

    const summary = await aiService.generateInterviewSummary(
      transcript, 
      duration || 30
    );

    res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating summary',
      error: error.message
    });
  }
};

// Get AI response during interview
exports.getAIResponse = async (req, res) => {
  try {
    const { context, message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const aiResponse = await aiService.generateAIResponse(
      context || 'Interview in progress', 
      message
    );

    res.status(200).json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Get AI response error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting AI response',
      error: error.message
    });
  }
};