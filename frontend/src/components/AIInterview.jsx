// frontend/src/components/AIInterview.jsx
import { useState, useEffect } from 'react';
import { generateQuestions, analyzeAnswer, getAIResponse } from '../api/api';
import './AIInterview.css';

function AIInterview({ roomId, onClose }) {
  const [role, setRole] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState('');

  // Start interview
  const startInterview = async () => {
    if (!role.trim()) {
      alert('Please enter a job role');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await generateQuestions(role, 5);
      setQuestions(response.data.questions);
      setInterviewStarted(true);
      setAiResponse(`Great! Let's begin the interview for the ${role} position. Here's your first question.`);
    } catch (error) {
      console.error('Error generating questions:', error);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('Please provide an answer');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      console.log('Analyzing answer for question:', currentQuestion);
      console.log('User answer:', userAnswer);
      
      // Analyze answer with AI
      const analysisResponse = await analyzeAnswer(currentQuestion, userAnswer);
      const aiAnalysis = analysisResponse.data.analysis;
      
      console.log('AI Analysis received:', aiAnalysis);
      
      setAnalysis(aiAnalysis);

      // Save answer with its analysis
      const newAnswer = {
        question: currentQuestion,
        answer: userAnswer,
        analysis: aiAnalysis
      };
      
      setAnswers([...answers, newAnswer]);

      // Get AI response
      const aiResponseData = await getAIResponse(
        `Interview for question ${currentQuestionIndex + 1} of ${questions.length}. User answered: ${userAnswer.substring(0, 100)}`,
        userAnswer
      );
      setAiResponse(aiResponseData.data.response);

      setLoading(false);

    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to analyze answer. Please try again.');
      setLoading(false);
    }
  };

  // Move to next question manually
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setAnalysis('');
      setError('');
      setAiResponse(`Question ${currentQuestionIndex + 2} of ${questions.length}`);
    }
  };

  // Skip question
  const skipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setAnalysis('');
      setError('');
      setAiResponse('Let\'s move to the next question.');
    } else {
      setAiResponse('That was the last question. Review your answers or close the interview.');
    }
  };

  return (
    <div className="ai-interview-overlay">
      <div className="ai-interview-panel">
        <div className="ai-header">
          <h2>🤖 AI Interview Assistant</h2>
          <button onClick={onClose} className="close-ai">✖️</button>
        </div>

        <div className="ai-content">
          {!interviewStarted ? (
            // Setup screen
            <div className="ai-setup">
              <h3>Start AI-Powered Interview</h3>
              <p>Enter the job role to generate relevant interview questions</p>
              
              {error && (
                <div className="error-message-ai">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              
              <div className="input-group">
                <label>Job Role:</label>
                <input
                  type="text"
                  placeholder="e.g., Software Engineer, Product Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && startInterview()}
                  disabled={loading}
                  className="role-input"
                />
              </div>

              <button 
                onClick={startInterview} 
                className="btn-start-ai"
                disabled={loading}
              >
                {loading ? 'Generating Questions...' : 'Start Interview'}
              </button>

              <div className="ai-info">
                <p>✨ AI will generate 5 relevant questions</p>
                <p>📊 Get instant feedback on your answers</p>
                <p>🎯 Improve your interview skills</p>
              </div>
            </div>
          ) : (
            // Interview screen
            <div className="ai-interview">
              {/* AI Response */}
              {aiResponse && (
                <div className="ai-message">
                  <div className="ai-avatar">🤖</div>
                  <div className="ai-text">{aiResponse}</div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="error-message-ai">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Progress */}
              <div className="progress-bar">
                <div className="progress-info">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Question */}
              {questions[currentQuestionIndex] && (
                <div className="question-card">
                  <h3>Question {currentQuestionIndex + 1}</h3>
                  <p>{questions[currentQuestionIndex]}</p>
                </div>
              )}

              {/* Answer Input - Only show if no analysis yet */}
              {currentQuestionIndex < questions.length && !analysis && (
                <div className="answer-section">
                  <label>Your Answer:</label>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows="6"
                    disabled={loading}
                    className="answer-textarea"
                  />

                  <div className="answer-actions">
                    <button 
                      onClick={submitAnswer}
                      disabled={loading || !userAnswer.trim()}
                      className="btn-submit-answer"
                    >
                      {loading ? 'Analyzing...' : 'Submit Answer'}
                    </button>
                    <button 
                      onClick={skipQuestion}
                      disabled={loading}
                      className="btn-skip"
                    >
                      Skip Question
                    </button>
                  </div>
                </div>
              )}

              {/* Analysis Display with Next Button */}
              {analysis && currentQuestionIndex < questions.length && (
                <div className="analysis-section">
                  <div className="analysis-card">
                    <h4>📊 AI Analysis:</h4>
                    <p>{analysis}</p>
                  </div>

                  <div className="your-answer-display">
                    <h4>Your Answer:</h4>
                    <p>{userAnswer}</p>
                  </div>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <button 
                      onClick={moveToNextQuestion}
                      className="btn-next-question"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <div className="interview-complete-message">
                      <p>🎉 You've completed all questions!</p>
                      <button onClick={onClose} className="btn-finish">
                        View Results
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Summary of all answers */}
              {answers.length === questions.length && answers.length > 0 && (
                <div className="answers-summary">
                  <h3>Interview Summary</h3>
                  <p className="summary-intro">Here's a review of all your responses:</p>
                  {answers.map((item, index) => (
                    <div key={index} className="answer-summary-card">
                      <div className="summary-question">
                        <strong>Q{index + 1}:</strong> {item.question}
                      </div>
                      <div className="summary-answer">
                        <strong>Your Answer:</strong> {item.answer}
                      </div>
                      <div className="summary-analysis">
                        <strong>AI Feedback:</strong> {item.analysis}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIInterview;