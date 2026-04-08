import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { getMyReports } from '../api/api';
import './CandidateDashboard.css';

export default function CandidateDashboard() {
  const [user, setUser]               = useState(null);
  const [meetings, setMeetings]       = useState([]);
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [roomInput, setRoomInput]     = useState('');
  const [showJoinBox, setShowJoinBox] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showAllReports, setShowAllReports] = useState(false);
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
    fetchReports();
  }, [navigate]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await API.get('/meetings/my-meetings');
      setMeetings(res.data.meetings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchReports = async () => {
    try {
      const res = await getMyReports();
      setReports(res.data.reports || []);
    } catch (e) {
      console.error('Could not fetch reports:', e.response?.data || e.message);
    }
  };

  const startPractice = () => navigate('/aria-setup');
  const joinRoom = () => { const id = roomInput.trim(); if (!id) return; navigate(`/room/${id}`); };
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  const practiceCount = reports.length;
  const avgScore = reports.length
    ? Math.round(reports.reduce((s, r) => s + (r.avgScore || 0), 0) / reports.length)
    : 0;
  const latestReport = reports[0] || null;

  // Score colour helpers
  const scoreCol = s => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
  const scoreBg  = s => s >= 75 ? '#d1fae5' : s >= 50 ? '#fef3c7' : '#fee2e2';
  const scoreTxt = s => s >= 75 ? '#065f46' : s >= 50 ? '#78350f' : '#991b1b';

  if (!user) return <div className="cd-loading"><div className="cd-spin" />Loading...</div>;

  return (
    <div className="cd-root">

      {/* Nav */}
      <nav className="cd-nav">
        <div className="cd-nav-brand" onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}>
          <span className="cd-brand-rocket">🚀</span>
          <span className="cd-brand-name">HireMind</span>
        </div>
        <div className="cd-nav-center">
          <span className="cd-nav-greeting">Good {getGreeting()}, {user.name.split(' ')[0]}!</span>
        </div>
        <div className="cd-nav-right">
          <div className="cd-nav-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <span className="cd-nav-name">{user.name}</span>
          <span className="cd-role-chip">Candidate</span>
          <button className="cd-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="cd-content">

        {/* Hero */}
        <div className="cd-hero">
          <div className="cd-hero-left">
            <div className="cd-hero-label">INTERVIEW PREP PLATFORM</div>
            <h1 className="cd-hero-title">
              Practice. Improve.<br/>
              <span className="cd-hero-accent">Get Hired.</span>
            </h1>
            <p className="cd-hero-sub">
              Practice with ARIA, our live AI interviewer, or join a recruiter session.
              Get instant feedback and real scores on every answer.
            </p>
            <div className="cd-hero-btns">
              <button className="cd-btn-primary" onClick={startPractice} disabled={loading}>
                <span>🤖</span> Practice with ARIA
              </button>
              <button className="cd-btn-secondary" onClick={() => setShowJoinBox(!showJoinBox)}>
                <span>🔗</span> Join Recruiter Session
              </button>
            </div>
            {showJoinBox && (
              <div className="cd-join-box">
                <div className="cd-join-label">Enter the Room ID your recruiter shared:</div>
                <div className="cd-join-row">
                  <input className="cd-join-input" placeholder="Paste Room ID here..."
                    value={roomInput} onChange={e => setRoomInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && joinRoom()} autoFocus />
                  <button className="cd-join-go" onClick={joinRoom} disabled={!roomInput.trim()}>Join</button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="cd-hero-right">
            <div className="cd-stats-grid">
              <div className="cd-stat">
                <div className="cd-stat-val">{reports.length + meetings.length}</div>
                <div className="cd-stat-label">Sessions</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-val">{reports.length}</div>
                <div className="cd-stat-label">Reports</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-val">{practiceCount}</div>
                <div className="cd-stat-label">AI Practice</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-val">{avgScore || '--'}</div>
                <div className="cd-stat-label">Avg Score</div>
              </div>
            </div>

            {latestReport && (
              <div className="cd-latest-report">
                <div className="cd-report-header">
                  <span className="cd-report-icon">📊</span>
                  <span className="cd-report-title">Latest Performance</span>
                </div>
                <div className="cd-report-body">
                  <div className="cd-report-score-circle">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="6"/>
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#7c3aed" strokeWidth="6"
                        strokeDasharray={`${(latestReport.avgScore/100)*201} 201`}
                        strokeLinecap="round" transform="rotate(-90 40 40)"
                        style={{transition:'stroke-dasharray 1s ease'}}/>
                      <text x="40" y="45" textAnchor="middle" fontSize="20" fontWeight="800" fill="#7c3aed">
                        {latestReport.avgScore}
                      </text>
                    </svg>
                  </div>
                  <div className="cd-report-meta">
                    <div className="cd-report-session">{latestReport.role} Interview</div>
                    <div className="cd-report-date">
                      {new Date(latestReport.createdAt).toLocaleDateString('en-US',
                        {month:'long',day:'numeric',year:'numeric'})}
                    </div>
                  </div>
                  <button className="cd-view-report-btn" onClick={() => setSelectedReport(latestReport)}>
                    View Full Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 6 Feature Cards ── */}
        <div className="cd-features">

          {/* 1 — Practice with ARIA */}
          <div className="cd-feature-card cd-feature-ai" onClick={startPractice}>
            <div className="cd-feature-glow" />
            <div className="cd-feature-icon">🤖</div>
            <div className="cd-feature-content">
              <h3>Practice with ARIA</h3>
              <p>A live AI interviewer asks role-specific questions, speaks out loud, and scores every answer instantly.</p>
              <div className="cd-feature-tags">
                <span>HD Video Avatar</span><span>Live Scoring</span><span>Instant Feedback</span>
              </div>
            </div>
            <div className="cd-feature-arrow">→</div>
          </div>

          {/* 2 — Join Real Interview */}
          <div className="cd-feature-card cd-feature-join" onClick={() => setShowJoinBox(true)}>
            <div className="cd-feature-icon">🎯</div>
            <div className="cd-feature-content">
              <h3>Join Real Interview</h3>
              <p>Your recruiter sends you a Room ID. Join a live interview session with video and chat.</p>
              <div className="cd-feature-tags">
                <span>Live Video</span><span>AI Assistance</span><span>Screen Share</span>
              </div>
            </div>
            <div className="cd-feature-arrow">→</div>
          </div>

          {/* 3 — Study Material */}
          <div className="cd-feature-card cd-feature-study" onClick={() => navigate('/study-material')}>
            <div className="cd-feature-icon">📚</div>
            <div className="cd-feature-content">
              <h3>Study Material</h3>
              <p>Master FAANG interview questions from Google, Amazon, Meta, Apple, and Netflix with hints and difficulty tags.</p>
              <div className="cd-feature-tags">
                <span>5 Companies</span><span>DSA + System Design</span><span>Behavioral</span>
              </div>
            </div>
            <div className="cd-feature-arrow">→</div>
          </div>

          {/* 4 — Performance Reports */}
          <div className="cd-feature-card cd-feature-reports" onClick={() => setShowAllReports(true)}>
            <div className="cd-feature-icon">📈</div>
            <div className="cd-feature-content">
              <h3>Performance Reports</h3>
              <p>
                Review all your past ARIA interview sessions, see scores per question, strengths, gaps, and track your improvement over time.
              </p>
              <div className="cd-feature-tags">
                <span>{reports.length} Report{reports.length !== 1 ? 's' : ''}</span>
                <span>Score History</span>
                <span>AI Feedback</span>
              </div>
            </div>
            <div className="cd-feature-arrow">→</div>
          </div>

          {/* 5 — 1-on-1 Mentorship */}
          <div className="cd-feature-card cd-feature-mentor" onClick={() => navigate('/mentorship')}>
            <div className="cd-feature-icon">🎓</div>
            <div className="cd-feature-content">
              <h3>1-on-1 Mentorship</h3>
              <p>Book a session with real engineers from Google, Amazon, Meta and more. Get personalized career guidance from Big Tech insiders.</p>
              <div className="cd-feature-tags">
                <span>Real Engineers</span><span>Book a Session</span><span>Big Tech Mentors</span>
              </div>
            </div>
            <div className="cd-feature-arrow">→</div>
          </div>

          {/* 6 — Interview Roadmap (NEW) */}
          <div className="cd-feature-card cd-feature-roadmap" onClick={() => navigate('/interview-roadmap')}>
            <div className="cd-feature-icon">🗺️</div>
            <div className="cd-feature-content">
              <h3>Interview Roadmap</h3>
              <p>Get a personalized week-by-week AI-generated study plan based on your role, experience level, and weak areas from past sessions.</p>
              <div className="cd-feature-tags">
                <span>AI Generated</span><span>Week-by-Week</span><span>Role Specific</span>
              </div>
            </div>
            <div className="cd-feature-arrow">→</div>
          </div>

        </div>

        {/* Session History */}
        <div className="cd-history-section">
          <div className="cd-history-header">
            <h2>My Sessions</h2>
            <span className="cd-history-count">{meetings.length} total</span>
          </div>
          {loading ? (
            <div className="cd-loading-sessions"><div className="cd-spin" /><span>Loading...</span></div>
          ) : meetings.length === 0 ? (
            <div className="cd-no-sessions">
              <div className="cd-no-sessions-visual">
                <div className="cd-empty-rings">
                  <div className="cd-ring cd-ring-1" /><div className="cd-ring cd-ring-2" /><div className="cd-ring cd-ring-3" />
                  <span className="cd-empty-emoji">🎯</span>
                </div>
              </div>
              <h3>Ready to start?</h3>
              <p>Your first practice session is just one click away.</p>
              <button className="cd-btn-primary" onClick={startPractice} disabled={loading}>
                <span>🤖</span> Start First Practice
              </button>
            </div>
          ) : (
            <div className="cd-sessions-list">
              {meetings.map((m) => (
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
                        {m.duration && <span className="cd-session-dur">{m.duration} min</span>}
                      </div>
                    </div>
                  </div>
                  <div className="cd-session-right">
                    {m.status === 'ongoing' && (
                      <button className="cd-rejoin-btn" onClick={() => navigate(`/room/${m.roomId}`)}>Rejoin</button>
                    )}
                    {m.status === 'completed' && (
                      <button className="cd-view-report-sm" onClick={() => setShowAllReports(true)}>View Reports</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account */}
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
              <div className="cd-field-val">Candidate</div>
            </div>
            <div className="cd-account-field">
              <div className="cd-field-label">Reports Saved</div>
              <div className="cd-field-val">{reports.length}</div>
            </div>
          </div>
        </div>

      </div>

      {/* ══ ALL REPORTS MODAL ══ */}
      {showAllReports && (
        <div className="cd-modal-overlay" onClick={() => setShowAllReports(false)}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-header">
              <div className="cd-modal-title-group">
                <h3>All Performance Reports</h3>
                <p>{reports.length} report{reports.length !== 1 ? 's' : ''} saved</p>
              </div>
              <button className="cd-modal-close" onClick={() => setShowAllReports(false)}>✕</button>
            </div>
            <div className="cd-modal-body">
              {reports.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 20px',color:'#64748b'}}>
                  <div style={{fontSize:'48px',marginBottom:'16px'}}>📭</div>
                  <p style={{fontSize:'16px',fontWeight:600,marginBottom:'8px'}}>No reports yet</p>
                  <p>Complete an ARIA interview to see your report here.</p>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  {reports.map((r, i) => (
                    <div key={r._id || i}
                      style={{background:'#faf5ff',border:'1px solid #ede9fe',borderRadius:'14px',
                        padding:'18px 20px',display:'flex',justifyContent:'space-between',
                        alignItems:'center',cursor:'pointer'}}
                      onClick={() => { setSelectedReport(r); setShowAllReports(false); }}>
                      <div>
                        <div style={{fontWeight:700,fontSize:'15px',color:'#1e1b4b',marginBottom:'4px'}}>
                          {r.role} Interview
                        </div>
                        <div style={{fontSize:'12px',color:'#94a3b8',marginBottom:'8px'}}>
                          {new Date(r.createdAt).toLocaleDateString('en-US',
                            {month:'long',day:'numeric',year:'numeric'})}
                          {' · '}
                          {r.answeredQuestions}/{r.totalQuestions} questions answered
                        </div>
                        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                          <span style={{fontSize:'11px',fontWeight:700,background:'#ede9fe',color:'#7c3aed',padding:'2px 10px',borderRadius:'20px'}}>
                            {r.strongAnswers} Strong
                          </span>
                          <span style={{fontSize:'11px',fontWeight:700,background:'#f0fdf4',color:'#166534',padding:'2px 10px',borderRadius:'20px'}}>
                            Score: {r.avgScore}/100
                          </span>
                        </div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
                        <svg width="60" height="60" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="6"/>
                          <circle cx="40" cy="40" r="32" fill="none"
                            stroke={scoreCol(r.avgScore)} strokeWidth="6"
                            strokeDasharray={`${(r.avgScore/100)*201} 201`}
                            strokeLinecap="round" transform="rotate(-90 40 40)"/>
                          <text x="40" y="45" textAnchor="middle" fontSize="18" fontWeight="800"
                            fill={scoreCol(r.avgScore)}>{r.avgScore}</text>
                        </svg>
                        <span style={{fontSize:'11px',color:'#94a3b8'}}>View</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="cd-modal-footer">
              <button className="cd-modal-btn-secondary" onClick={() => setShowAllReports(false)}>Close</button>
              <button className="cd-modal-btn-primary"
                onClick={() => { setShowAllReports(false); navigate('/aria-setup'); }}>
                New Practice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ FULL REPORT DETAIL MODAL — with model answers, strengths, improvements ══ */}
      {selectedReport && (
        <div className="cd-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="cd-modal" style={{maxWidth:'780px'}} onClick={e => e.stopPropagation()}>
            <div className="cd-modal-header">
              <div className="cd-modal-title-group">
                <h3>Interview Performance Report</h3>
                <p>{selectedReport.role} Interview</p>
              </div>
              <button className="cd-modal-close" onClick={() => setSelectedReport(null)}>✕</button>
            </div>

            <div className="cd-modal-body">

              {/* Score hero */}
              <div style={{
                background:'linear-gradient(135deg,#667eea,#764ba2)',
                borderRadius:16,padding:'24px 20px',marginBottom:20,
                color:'white',textAlign:'center',
              }}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:3,textTransform:'uppercase',opacity:0.8,marginBottom:6}}>
                  Overall Performance
                </div>
                <div style={{
                  display:'inline-flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',width:90,height:90,borderRadius:'50%',
                  background:'rgba(255,255,255,0.15)',border:'4px solid rgba(255,255,255,0.4)',
                  marginBottom:10,
                }}>
                  <div style={{fontSize:34,fontWeight:900,lineHeight:1}}>{selectedReport.avgScore}</div>
                  <div style={{fontSize:10,opacity:0.8}}>/ 100</div>
                </div>
                <div style={{fontSize:16,fontWeight:700}}>
                  {selectedReport.avgScore >= 85 ? 'Excellent' :
                   selectedReport.avgScore >= 70 ? 'Good' :
                   selectedReport.avgScore >= 50 ? 'Keep Practising' : 'Needs Work'}
                </div>
                <div style={{fontSize:12,opacity:0.7,marginTop:6}}>
                  {new Date(selectedReport.createdAt).toLocaleDateString('en-US',
                    {month:'long',day:'numeric',year:'numeric'})}
                  {' · '}
                  {selectedReport.answeredQuestions}/{selectedReport.totalQuestions} answered
                  {' · '}
                  {selectedReport.strongAnswers} strong answers
                </div>
              </div>

              {/* Stat cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
                {[
                  {n:selectedReport.totalQuestions,    l:'Questions', c:'#667eea'},
                  {n:selectedReport.answeredQuestions, l:'Answered',  c:'#10b981'},
                  {n:selectedReport.strongAnswers,     l:'Strong',    c:'#f59e0b'},
                  {n:(selectedReport.totalQuestions||0)-(selectedReport.answeredQuestions||0), l:'Skipped', c:'#ef4444'},
                ].map(s => (
                  <div key={s.l} style={{
                    background:'#fff',border:`2px solid ${s.c}20`,borderTop:`3px solid ${s.c}`,
                    borderRadius:12,padding:'12px 8px',textAlign:'center',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.n}</div>
                    <div style={{fontSize:11,color:'#64748b',marginTop:3}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Per-question breakdown — full rich version */}
              {selectedReport.records && selectedReport.records.length > 0 && (
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:'#0f172a',marginBottom:12}}>
                    Question by Question Breakdown
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                    {selectedReport.records.map((rec, i) => (
                      <div key={i} style={{
                        background:'#fff',
                        border:`1px solid ${rec.score>=75?'#bbf7d0':rec.score>=50?'#fde68a':'#fecaca'}`,
                        borderRadius:14,overflow:'hidden',
                        boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
                      }}>
                        {/* Question header */}
                        <div style={{
                          background: rec.score>=75?'#f0fdf4':rec.score>=50?'#fffbeb':'#fef2f2',
                          padding:'12px 16px',
                          borderBottom:`1px solid ${rec.score>=75?'#bbf7d0':rec.score>=50?'#fde68a':'#fecaca'}`,
                          display:'flex',justifyContent:'space-between',alignItems:'flex-start',
                        }}>
                          <div style={{flex:1,paddingRight:12}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                              <span style={{
                                fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:1,
                                color:scoreCol(rec.score),
                                background:`${scoreCol(rec.score)}18`,
                                padding:'2px 8px',borderRadius:12,
                                border:`1px solid ${scoreCol(rec.score)}30`,
                              }}>
                                Q{i+1} {rec.answer==='(skipped)'?' · Skipped':''}
                              </span>
                              <span style={{fontSize:11,color:scoreCol(rec.score),fontWeight:600}}>
                                {rec.score>=75?'Strong':rec.score>=50?'Decent':'Needs work'}
                              </span>
                            </div>
                            <p style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:0,lineHeight:1.5}}>
                              {rec.question}
                            </p>
                          </div>
                          {/* Score ring */}
                          <svg width="52" height="52" viewBox="0 0 52 52" style={{flexShrink:0}}>
                            <circle cx="26" cy="26" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4"/>
                            <circle cx="26" cy="26" r="20" fill="none"
                              stroke={scoreCol(rec.score)} strokeWidth="4"
                              strokeDasharray={`${(rec.score/100)*125.6} 125.6`}
                              strokeLinecap="round" transform="rotate(-90 26 26)"
                              style={{transition:'stroke-dasharray 1s ease'}}/>
                            <text x="26" y="30" textAnchor="middle" fontSize="11"
                              fontWeight="800" fill={scoreCol(rec.score)}>{rec.score}</text>
                          </svg>
                        </div>

                        <div style={{padding:'14px 16px'}}>

                          {/* Your answer */}
                          <div style={{
                            background:'#f8fafc',border:'1px solid #e2e8f0',
                            borderRadius:9,padding:'9px 12px',marginBottom:10,
                          }}>
                            <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',
                              textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>
                              Your Answer
                            </div>
                            <div style={{fontSize:13,color:'#374151',lineHeight:1.7,
                              fontStyle:rec.answer==='(skipped)'?'italic':'normal'}}>
                              {rec.answer}
                            </div>
                          </div>

                          {/* AI feedback */}
                          {rec.analysis && (
                            <div style={{
                              background:'#eff6ff',border:'1px solid #bfdbfe',
                              borderRadius:9,padding:'10px 12px',marginBottom:10,
                              fontSize:13,color:'#1e40af',lineHeight:1.7,
                            }}>
                              <div style={{fontSize:10,fontWeight:700,color:'#3b82f6',
                                marginBottom:5,textTransform:'uppercase',letterSpacing:1}}>
                                ARIA Feedback
                              </div>
                              {rec.analysis}
                            </div>
                          )}

                          {/* Strengths */}
                          {rec.strengths && rec.strengths.length > 0 && (
                            <div style={{
                              background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                              border:'1px solid #bbf7d0',borderLeft:'4px solid #16a34a',
                              borderRadius:'0 10px 10px 0',padding:'10px 12px',marginBottom:8,
                            }}>
                              <div style={{fontSize:10,fontWeight:800,color:'#16a34a',
                                textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>
                                What You Did Well
                              </div>
                              {rec.strengths.map((s, j) => (
                                <div key={j} style={{display:'flex',gap:7,marginBottom:j<rec.strengths.length-1?4:0,
                                  fontSize:13,color:'#166534',lineHeight:1.6}}>
                                  <span style={{color:'#16a34a',flexShrink:0,fontWeight:700}}>✓</span>
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Improvements */}
                          {rec.improvements && rec.improvements.length > 0 && rec.score < 70 && (
                            <div style={{
                              background:'linear-gradient(135deg,#fffbeb,#fef9c3)',
                              border:'1px solid #fde68a',borderLeft:'4px solid #d97706',
                              borderRadius:'0 10px 10px 0',padding:'10px 12px',marginBottom:8,
                            }}>
                              <div style={{fontSize:10,fontWeight:800,color:'#d97706',
                                textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>
                                Key Gaps
                              </div>
                              {rec.improvements.slice(0,2).map((s, j) => (
                                <div key={j} style={{display:'flex',gap:7,marginBottom:j<1?4:0,
                                  fontSize:13,color:'#92400e',lineHeight:1.6}}>
                                  <span style={{color:'#d97706',flexShrink:0}}>→</span>
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Model / Ideal answer — ALWAYS shown */}
                          <div style={{
                            background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',
                            border:'1px solid #c4b5fd',borderLeft:'4px solid #7c3aed',
                            borderRadius:'0 12px 12px 0',padding:'12px 14px',
                          }}>
                            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                              <span style={{
                                background:'linear-gradient(135deg,#7c3aed,#a78bfa)',
                                color:'white',borderRadius:6,padding:'2px 9px',
                                fontSize:9,fontWeight:800,letterSpacing:1,flexShrink:0,
                              }}>
                                {rec.answer === '(skipped)' ? 'IDEAL ANSWER' : 'SAMPLE ANSWER'}
                              </span>
                              <span style={{fontSize:11,color:'#7c3aed',fontWeight:600}}>
                                How a strong candidate would answer
                              </span>
                            </div>
                            <div style={{
                              fontSize:13,color:'#3b0764',lineHeight:1.85,
                              background:'white',borderRadius:8,padding:'10px 12px',
                              border:'1px solid #ddd6fe',minHeight:40,
                            }}>
                              {rec.modelAnswer
                                ? rec.modelAnswer
                                : (
                                  <span style={{color:'#94a3b8',fontStyle:'italic',fontSize:12}}>
                                    Sample answer not available — complete a new ARIA session to see model answers.
                                  </span>
                                )
                              }
                            </div>
                            {rec.modelAnswer && (
                              <div style={{marginTop:6,fontSize:10,color:'#7c3aed',opacity:0.85}}>
                                {rec.answer === '(skipped)'
                                  ? 'You skipped this — read it carefully and practise it.'
                                  : 'Study this — notice the depth and specific examples used.'}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If old reports have no rich data */}
              {(!selectedReport.records || selectedReport.records.length === 0) && (
                <div style={{textAlign:'center',padding:'32px',color:'#64748b'}}>
                  <div style={{fontSize:40,marginBottom:12}}>📭</div>
                  <p>Detailed breakdown not available for this session.</p>
                  <p style={{fontSize:12,marginTop:8}}>Complete a new ARIA interview to see full question-by-question analysis with model answers.</p>
                </div>
              )}

            </div>

            <div className="cd-modal-footer">
              <button className="cd-modal-btn-secondary" onClick={() => setSelectedReport(null)}>Close</button>
              <button className="cd-modal-btn-primary"
                onClick={() => { setSelectedReport(null); navigate('/aria-setup'); }}>
                Practice Again
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