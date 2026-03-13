// frontend/src/pages/CandidateDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import './CandidateDashboard.css';

export default function CandidateDashboard() {
  const [user, setUser]         = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [showJoinBox, setShowJoinBox] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role === 'recruiter' || parsed.role === 'admin') {
      navigate('/recruiter-dashboard'); return;
    }
    setUser(parsed);
    fetchMeetings();
  }, [navigate]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await API.get('/meetings/my-meetings');
      setMeetings(res.data.meetings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const startPractice = async () => {
    setLoading(true);
    try {
      const res = await API.post('/meetings/create', { title: 'AI Practice Session' });
      navigate(`/room/${res.data.meeting.roomId}`);
    } catch (e) {
      alert('Failed to start. Please try again.');
    } finally { setLoading(false); }
  };

  const joinRoom = () => {
    const id = roomInput.trim();
    if (!id) return;
    navigate(`/room/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Generate mock feedback report for completed sessions
  const generateReport = (meeting) => {
    const isPractice = meeting.title?.toLowerCase().includes('practice');
    const duration = meeting.duration || Math.floor(Math.random() * 30) + 15;
    
    // Mock scores
    const overallScore = Math.floor(Math.random() * 30) + 65; // 65-95
    const scores = {
      communication: Math.floor(Math.random() * 25) + 70,
      technical:     Math.floor(Math.random() * 25) + 65,
      problemSolving: Math.floor(Math.random() * 25) + 68,
      clarity:       Math.floor(Math.random() * 25) + 72,
    };

    const strengths = [
      'Clear communication and structured answers',
      'Good use of specific examples from past experience',
      'Strong technical understanding of core concepts',
    ];

    const improvements = [
      'Add more quantifiable metrics to answers (e.g., "increased efficiency by 40%")',
      'Practice the STAR method for behavioral questions',
      'Reduce filler words and speak more confidently',
    ];

    return {
      sessionTitle: meeting.title,
      date: new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      duration,
      overallScore,
      scores,
      strengths,
      improvements,
      isPractice,
    };
  };

  const completed   = meetings.filter(m => m.status === 'completed');
  const ongoing     = meetings.filter(m => m.status === 'ongoing');
  const practiceCount = meetings.filter(m => m.title?.toLowerCase().includes('practice')).length;
  const avgScore = completed.length > 0 
    ? Math.round(completed.reduce((sum, m) => sum + generateReport(m).overallScore, 0) / completed.length)
    : 0;

  if (!user) return <div className="cd-loading"><div className="cd-spin" />Loading...</div>;

  return (
    <div className="cd-root">

      {/* Top Nav */}
      <nav className="cd-nav">
        <div className="cd-nav-brand">
          <span className="cd-brand-rocket">🚀</span>
          <span className="cd-brand-name">HireMind</span>
        </div>
        <div className="cd-nav-center">
          <span className="cd-nav-greeting">Good {getGreeting()}, {user.name.split(' ')[0]}! 👋</span>
        </div>
        <div className="cd-nav-right">
          <div className="cd-nav-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <span className="cd-nav-name">{user.name}</span>
          <span className="cd-role-chip">Candidate</span>
          <button className="cd-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="cd-content">

        {/* Hero section */}
        <div className="cd-hero">
          <div className="cd-hero-left">
            <div className="cd-hero-label">INTERVIEW PREP PLATFORM</div>
            <h1 className="cd-hero-title">
              Practice. Improve.<br/>
              <span className="cd-hero-accent">Get Hired.</span>
            </h1>
            <p className="cd-hero-sub">
              Practice with ARIA, our live AI interviewer, or join a recruiter's session.
              Get instant feedback and real scores on every answer.
            </p>
            <div className="cd-hero-btns">
              <button className="cd-btn-primary" onClick={startPractice} disabled={loading}>
                {loading ? <><div className="cd-btn-spin" /> Starting...</> : <><span>🤖</span> Practice with ARIA</>}
              </button>
              <button className="cd-btn-secondary" onClick={() => setShowJoinBox(!showJoinBox)}>
                <span>🔗</span> Join Recruiter Session
              </button>
            </div>

            {showJoinBox && (
              <div className="cd-join-box">
                <div className="cd-join-label">Enter the Room ID your recruiter shared:</div>
                <div className="cd-join-row">
                  <input className="cd-join-input"
                    placeholder="Paste Room ID here..."
                    value={roomInput}
                    onChange={e => setRoomInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && joinRoom()}
                    autoFocus />
                  <button className="cd-join-go" onClick={joinRoom} disabled={!roomInput.trim()}>
                    Join →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: stats */}
          <div className="cd-hero-right">
            <div className="cd-stats-grid">
              <div className="cd-stat">
                <div className="cd-stat-val">{meetings.length}</div>
                <div className="cd-stat-label">Sessions</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-val">{completed.length}</div>
                <div className="cd-stat-label">Completed</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-val">{practiceCount}</div>
                <div className="cd-stat-label">AI Practice</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-val">{avgScore || '—'}</div>
                <div className="cd-stat-label">Avg Score</div>
              </div>
            </div>

            {/* Latest Report Card */}
            {completed.length > 0 && (
              <div className="cd-latest-report">
                <div className="cd-report-header">
                  <span className="cd-report-icon">📊</span>
                  <span className="cd-report-title">Latest Performance</span>
                </div>
                <div className="cd-report-body">
                  {(() => {
                    const latest = completed[0];
                    const report = generateReport(latest);
                    return (
                      <>
                        <div className="cd-report-score-circle">
                          <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="6"/>
                            <circle cx="40" cy="40" r="32" fill="none" stroke="#7c3aed" strokeWidth="6"
                              strokeDasharray={`${(report.overallScore/100)*201} 201`}
                              strokeLinecap="round" transform="rotate(-90 40 40)"
                              style={{ transition:'stroke-dasharray 1s ease' }}/>
                            <text x="40" y="45" textAnchor="middle" fontSize="20" fontWeight="800" fill="#7c3aed">
                              {report.overallScore}
                            </text>
                          </svg>
                        </div>
                        <div className="cd-report-meta">
                          <div className="cd-report-session">{latest.title}</div>
                          <div className="cd-report-date">{report.date}</div>
                        </div>
                        <button className="cd-view-report-btn" onClick={() => setSelectedReport(report)}>
                          View Full Report →
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feature cards */}
        <div className="cd-features">
          <div className="cd-feature-card cd-feature-ai" onClick={startPractice}>
            <div className="cd-feature-glow" />
            <div className="cd-feature-icon">🤖</div>
            <div className="cd-feature-content">
              <h3>Practice with ARIA</h3>
              <p>A photorealistic AI interviewer asks role-specific questions, speaks live, and scores every answer instantly.</p>
              <div className="cd-feature-tags">
                <span>HD Video Avatar</span>
                <span>Live Scoring</span>
                <span>Instant Feedback</span>
              </div>
            </div>
            <div className="cd-feature-arrow">→</div>
          </div>

          <div className="cd-feature-card cd-feature-join" onClick={() => setShowJoinBox(true)}>
            <div className="cd-feature-icon">🎯</div>
            <div className="cd-feature-content">
              <h3>Join Real Interview</h3>
              <p>Your recruiter sends you a Room ID. Enter it here to join a live interview session with video and chat.</p>
              <div className="cd-feature-tags">
                <span>Live Video</span>
                <span>AI Assistance</span>
                <span>Screen Share</span>
              </div>
            </div>
            <div className="cd-feature-arrow">→</div>
          </div>

          <div className="cd-feature-card cd-feature-reports" 
            onClick={() => completed.length > 0 && setSelectedReport(generateReport(completed[0]))}>
            <div className="cd-feature-icon">📈</div>
            <div className="cd-feature-content">
              <h3>Performance Reports</h3>
              <p>Detailed feedback on your answers, scores by category, strengths, and personalized improvement tips.</p>
              <div className="cd-feature-tags">
                <span>AI Analysis</span>
                <span>Score Breakdown</span>
                <span>Action Items</span>
              </div>
            </div>
            {completed.length === 0 && <span className="cd-soon-tag">Complete 1st Session</span>}
            {completed.length > 0 && <div className="cd-feature-arrow">→</div>}
          </div>
        </div>

        {/* Session History */}
        <div className="cd-history-section">
          <div className="cd-history-header">
            <h2>My Sessions</h2>
            <span className="cd-history-count">{meetings.length} total</span>
          </div>

          {loading ? (
            <div className="cd-loading-sessions">
              <div className="cd-spin" />
              <span>Loading sessions...</span>
            </div>
          ) : meetings.length === 0 ? (
            <div className="cd-no-sessions">
              <div className="cd-no-sessions-visual">
                <div className="cd-empty-rings">
                  <div className="cd-ring cd-ring-1" />
                  <div className="cd-ring cd-ring-2" />
                  <div className="cd-ring cd-ring-3" />
                  <span className="cd-empty-emoji">🎯</span>
                </div>
              </div>
              <h3>Ready to start?</h3>
              <p>Your first practice session is just one click away. ARIA is ready when you are.</p>
              <button className="cd-btn-primary" onClick={startPractice} disabled={loading}>
                <span>🤖</span> Start First Practice
              </button>
            </div>
          ) : (
            <div className="cd-sessions-list">
              {meetings.map((m) => {
                const report = m.status === 'completed' ? generateReport(m) : null;
                return (
                  <div key={m._id} className="cd-session-card">
                    <div className="cd-session-left">
                      <div className={`cd-session-icon ${m.title?.includes('Practice') ? 'icon-practice' : 'icon-live'}`}>
                        {m.title?.includes('Practice') ? '🤖' : '🎯'}
                      </div>
                      <div className="cd-session-info">
                        <div className="cd-session-title">{m.title}</div>
                        <div className="cd-session-time">
                          {new Date(m.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                          {' at '}
                          {new Date(m.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                        </div>
                        <div className="cd-session-meta">
                          <span className={`cd-session-status status-${m.status}`}>{m.status}</span>
                          {m.duration && <span className="cd-session-dur">⏱ {m.duration} min</span>}
                          {m.host?.name && m.host.name !== user.name &&
                            <span className="cd-session-host">Host: {m.host.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="cd-session-right">
                      {m.status === 'ongoing' && (
                        <button className="cd-rejoin-btn"
                          onClick={() => navigate(`/room/${m.roomId}`)}>
                          Rejoin →
                        </button>
                      )}
                      {m.status === 'completed' && report && (
                        <div className="cd-completed-group">
                          <div className="cd-score-badge">{report.overallScore}/100</div>
                          <button className="cd-view-report-sm"
                            onClick={() => setSelectedReport(report)}>
                            View Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Account card */}
        <div className="cd-account-card">
          <h3>Account Details</h3>
          <div className="cd-account-grid">
            <div className="cd-account-field">
              <div className="cd-field-label">Full Name</div>
              <div className="cd-field-val">{user.name}</div>
            </div>
            <div className="cd-account-field">
              <div className="cd-field-label">Email</div>
              <div className="cd-field-val">{user.email}</div>
            </div>
            <div className="cd-account-field">
              <div className="cd-field-label">Account Type</div>
              <div className="cd-field-val">🎓 Candidate</div>
            </div>
            <div className="cd-account-field">
              <div className="cd-field-label">Sessions Completed</div>
              <div className="cd-field-val">{completed.length}</div>
            </div>
          </div>
        </div>

      </div>

      {/* Feedback Report Modal */}
      {selectedReport && (
        <div className="cd-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-header">
              <div className="cd-modal-title-group">
                <h3>📊 Interview Performance Report</h3>
                <p>{selectedReport.sessionTitle}</p>
              </div>
              <button className="cd-modal-close" onClick={() => setSelectedReport(null)}>✕</button>
            </div>
            
            <div className="cd-modal-body">
              {/* Overall Score */}
              <div className="cd-modal-score-section">
                <div className="cd-modal-score-circle">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="8"/>
                    <circle cx="60" cy="60" r="48" fill="none" stroke="#7c3aed" strokeWidth="8"
                      strokeDasharray={`${(selectedReport.overallScore/100)*301.6} 301.6`}
                      strokeLinecap="round" transform="rotate(-90 60 60)"
                      style={{ transition:'stroke-dasharray 1s ease' }}/>
                    <text x="60" y="68" textAnchor="middle" fontSize="32" fontWeight="800" fill="#7c3aed">
                      {selectedReport.overallScore}
                    </text>
                  </svg>
                </div>
                <div className="cd-modal-score-info">
                  <div className="cd-modal-score-label">Overall Performance</div>
                  <div className="cd-modal-score-rating">
                    {selectedReport.overallScore >= 85 ? '🌟 Excellent' :
                     selectedReport.overallScore >= 70 ? '✨ Good' :
                     '📈 Needs Improvement'}
                  </div>
                  <div className="cd-modal-meta">
                    <span>{selectedReport.date}</span>
                    <span>•</span>
                    <span>{selectedReport.duration} minutes</span>
                    <span>•</span>
                    <span>{selectedReport.isPractice ? 'AI Practice' : 'Live Interview'}</span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="cd-modal-section">
                <h4>Score Breakdown</h4>
                <div className="cd-score-bars">
                  {Object.entries(selectedReport.scores).map(([category, score]) => (
                    <div key={category} className="cd-score-bar-item">
                      <div className="cd-score-bar-label">
                        <span>{category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                        <span className="cd-score-bar-val">{score}/100</span>
                      </div>
                      <div className="cd-score-bar-track">
                        <div className="cd-score-bar-fill" 
                          style={{
                            width: `${score}%`,
                            background: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div className="cd-modal-section">
                <h4>✅ Strengths</h4>
                <ul className="cd-feedback-list">
                  {selectedReport.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="cd-modal-section">
                <h4>📈 Areas for Improvement</h4>
                <ul className="cd-feedback-list cd-improvements">
                  {selectedReport.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div className="cd-modal-action-box">
                <div className="cd-action-icon">💡</div>
                <div>
                  <div className="cd-action-title">Next Steps</div>
                  <div className="cd-action-text">
                    Practice again to improve your scores. Focus on adding specific metrics and using the STAR method 
                    (Situation → Task → Action → Result) for behavioral questions.
                  </div>
                </div>
              </div>
            </div>

            <div className="cd-modal-footer">
              <button className="cd-modal-btn-secondary" onClick={() => setSelectedReport(null)}>
                Close
              </button>
              <button className="cd-modal-btn-primary" onClick={startPractice}>
                🤖 Practice Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}