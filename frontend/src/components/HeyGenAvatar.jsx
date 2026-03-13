// frontend/src/components/HeyGenAvatar.jsx
// Uses @heygen/streaming-avatar SDK
// Install: npm install @heygen/streaming-avatar livekit-client

import { useState, useEffect, useRef, useCallback } from 'react';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from '@heygen/streaming-avatar';
import { generateQuestions, analyzeAnswer } from '../api/api';
import API from '../api/api';
import './HeyGenAvatar.css';

const AVATARS = [
  { avatar_id: 'Anna_public_3_20240108',  avatar_name: 'Anna',  emoji: '👩' },
  { avatar_id: 'Tyler-incasual-20220722',  avatar_name: 'Tyler', emoji: '👨' },
  { avatar_id: 'Susan_public_2_20240328',  avatar_name: 'Susan', emoji: '👩' },
  { avatar_id: 'Wayne_20240711',           avatar_name: 'Wayne', emoji: '👨' },
];

const INTRO = (role) =>
  `Hello! I am your AI interviewer today. I will ask you five questions for the ${role} role. Take your time with each answer. Let us begin!`;

const BRIDGE = (score) =>
  score >= 75
    ? 'Great answer with clear structure. Let us continue to the next question.'
    : score >= 50
    ? 'Good response. Adding specific results would strengthen it. Moving on.'
    : 'Thank you. For stronger answers, try the STAR method — Situation, Task, Action, Result.';

const CLOSING = (avg) =>
  `You have completed the interview with an average score of ${avg} out of 100. ${
    avg >= 75 ? 'Excellent performance! Well done.'
    : avg >= 55 ? 'Solid effort. Keep practising with concrete examples.'
    : 'Keep working on structured answers. You will improve with practice!'
  }`;

function scoreAnswer(ans) {
  const wc = ans.trim().split(/\s+/).length;
  let s = Math.min(60, Math.round((wc / 80) * 60));
  if (/\d+/.test(ans)) s += 15;
  if (/example|project|achieved|implemented|led|built|solved/i.test(ans)) s += 15;
  if (wc > 40 && wc < 130) s += 10;
  return Math.min(100, s);
}

function ScoreRing({ score }) {
  const r = 32, c = 2 * Math.PI * r;
  const col = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="7"/>
      <circle cx="40" cy="40" r={r} fill="none" stroke={col} strokeWidth="7"
        strokeDasharray={`${(score/100)*c} ${c-(score/100)*c}`}
        strokeLinecap="round" transform="rotate(-90 40 40)"
        style={{ transition:'stroke-dasharray 1.2s ease' }}/>
      <text x="40" y="45" textAnchor="middle" fontSize="16" fontWeight="800" fill={col}>{score}</text>
    </svg>
  );
}

export default function HeyGenAvatar({ onClose }) {
  const [phase, setPhase]                   = useState('setup');
  const [role, setRole]                     = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].avatar_id);
  const [speaking, setSpeaking]             = useState(false);
  const [error, setError]                   = useState('');
  const [statusMsg, setStatusMsg]           = useState('');
  const [questions, setQuestions]           = useState([]);
  const [qIndex, setQIndex]                 = useState(0);
  const [answer, setAnswer]                 = useState('');
  const [analysis, setAnalysis]             = useState('');
  const [scores, setScores]                 = useState([]);
  const [records, setRecords]               = useState([]);
  const [loading, setLoading]               = useState(false);

  const avatarRef  = useRef(null);
  const videoRef   = useRef(null);
  const questionsRef = useRef([]);  // ref so speak callbacks can access latest questions

  useEffect(() => {
    return () => { avatarRef.current?.stopAvatar().catch(() => {}); };
  }, []);

  // ── speak helper ──────────────────────────────────────────────────────────
  const speak = useCallback(async (text) => {
    if (!avatarRef.current) return;
    try {
      setSpeaking(true);
      await avatarRef.current.speak({ text, taskType: TaskType.TALK });
    } catch (e) {
      console.warn('speak error:', e.message);
      setSpeaking(false);
    }
  }, []);

  // ── start HeyGen session ──────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setError('');
    setPhase('connecting');
    setStatusMsg('Getting streaming token...');

    try {
      // 1. Get token from backend
      let tokenRes;
      try {
        tokenRes = await API.post('/avatar/heygen-token', { avatarId: selectedAvatar });
      } catch (e) {
        throw new Error('Cannot reach backend. Is "node server.js" running on port 5000?');
      }

      if (!tokenRes.data.success) throw new Error(tokenRes.data.message);

      console.log('✅ Got HeyGen token');

      // 2. Create StreamingAvatar instance
      setStatusMsg('Connecting to avatar...');
      const avatar = new StreamingAvatar({ token: tokenRes.data.token });
      avatarRef.current = avatar;

      // 3. Wire events BEFORE createStartAvatar
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('✅ STREAM_READY — attaching video');
        if (videoRef.current) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.play().catch(console.warn);
        }
        setStatusMsg('');
        // Phase transition happens in launch() after speak() calls
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => setSpeaking(true));
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING,  () => setSpeaking(false));

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        setError('Stream disconnected. Please close and try again.');
        setSpeaking(false);
      });

      // 4. BACKEND CREATES SESSION - bypasses SDK's broken createStartAvatar
      setStatusMsg('Creating avatar session...');
      
      const sessionRes = await API.post('/avatar/create-session', {
        avatarId: selectedAvatar,
        quality: 'low',
      });

      if (!sessionRes.data.success) {
        throw new Error(sessionRes.data.message || 'Session creation failed');
      }

      console.log('✅ Backend created session, waiting for stream...');
      
      // Wait for STREAM_READY event to fire
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('✅ Avatar ready');
      return avatar;

    } catch (err) {
      console.error('❌ Session error:', err.message);
      setError(err.message);
      setPhase('setup');
      return null;
    }
  }, [selectedAvatar]);

  // ── launch ────────────────────────────────────────────────────────────────
  const launch = useCallback(async () => {
    if (!role.trim()) return setError('Please enter a job role');
    setLoading(true);
    setError('');

    try {
      const [qRes, avatar] = await Promise.all([
        generateQuestions(role, 5),
        startSession()
      ]);

      if (!avatar) return;

      const qs = qRes.data.questions;
      setQuestions(qs);
      questionsRef.current = qs;
      setPhase('interview');

      await speak(INTRO(role));
      await speak(`Question 1: ${qs[0]}`);

    } catch (err) {
      setError('Launch failed: ' + err.message);
      setPhase('setup');
    } finally {
      setLoading(false);
    }
  }, [role, startSession, speak]);

  // ── submit answer ─────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setPhase('analysis');
    try {
      const q   = questions[qIndex];
      const res = await analyzeAnswer(q, answer);
      const txt = res.data.analysis;
      const s   = scoreAnswer(answer);
      setAnalysis(txt);
      setScores(p  => [...p, s]);
      setRecords(p => [...p, { question: q, answer, analysis: txt, score: s }]);
      await speak(BRIDGE(s));
    } catch (err) {
      setError('Analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [answer, questions, qIndex, speak]);

  // ── next question ─────────────────────────────────────────────────────────
  const nextQuestion = useCallback(async () => {
    const next = qIndex + 1;
    setAnswer(''); setAnalysis(''); setError('');
    if (next >= questions.length) {
      setScores(prev => {
        const avg = Math.round(prev.reduce((a, b) => a + b, 0) / prev.length);
        setPhase('complete');
        speak(CLOSING(avg));
        return prev;
      });
      return;
    }
    setQIndex(next);
    setPhase('interview');
    await speak(`Question ${next + 1}: ${questions[next]}`);
  }, [qIndex, questions, speak]);

  const avgScore  = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const isLive    = phase === 'interview' || phase === 'analysis' || phase === 'complete';

  return (
    <div className="hg-overlay">
      <div className="hg-panel">

        <div className="hg-header">
          <div className="hg-header-left">
            <div className="hg-live-dot" />
            <span className="hg-title">ARIA · AI Interviewer</span>
            <span className="hg-powered">Powered by HeyGen LiveAvatar</span>
          </div>
          <button className="hg-close" onClick={onClose}>✕</button>
        </div>

        <div className="hg-body">

          {/* ── Video column ── */}
          <div className="hg-video-col">
            <div className={`hg-video-wrap ${speaking ? 'hg-speaking' : ''}`}>
              <video
                ref={videoRef}
                autoPlay playsInline
                className="hg-video"
                style={{ display: (phase === 'setup' || phase === 'connecting') ? 'none' : 'block' }}
              />

              {(phase === 'setup' || phase === 'connecting') && (
                <div className="hg-placeholder">
                  <div className="hg-avatar-icon">👤</div>
                  <p>{phase === 'connecting' ? (statusMsg || 'Connecting...') : 'Select an Interviewer'}</p>
                  {phase === 'connecting' && (
                    <div className="hg-spinner" style={{ width:32, height:32, borderWidth:3, marginTop:14 }} />
                  )}
                </div>
              )}

              {speaking && (
                <div className="hg-speaking-bar">
                  {[...Array(12)].map((_,i) => (
                    <div key={i} className="hg-bar" style={{ animationDelay:`${i*0.07}s` }} />
                  ))}
                </div>
              )}

              <div className={`hg-status-badge ${speaking ? 'badge-speaking' : isLive ? 'badge-ready' : phase === 'connecting' ? 'badge-idle' : 'badge-idle'}`}>
                {speaking ? '🎙 Speaking' : isLive ? '✅ Listening' : phase === 'connecting' ? '⏳ Connecting' : '⏳ Idle'}
              </div>
            </div>

            {phase === 'setup' && (
              <div className="hg-avatar-grid">
                <p className="hg-avatar-label">Choose Your Interviewer</p>
                <div className="hg-avatar-list">
                  {AVATARS.map(a => (
                    <button key={a.avatar_id}
                      className={`hg-avatar-btn ${selectedAvatar === a.avatar_id ? 'selected' : ''}`}
                      onClick={() => setSelectedAvatar(a.avatar_id)}>
                      <div className="hg-avatar-thumb-placeholder">{a.emoji}</div>
                      <span className="hg-avatar-name">{a.avatar_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Interaction column ── */}
          <div className="hg-interact-col">

            {error && (
              <div className="hg-error" style={{ margin:'16px', whiteSpace:'pre-line' }}>
                <span>⚠️</span>
                <span style={{ flex:1 }}>{error}</span>
              </div>
            )}

            {/* SETUP */}
            {phase === 'setup' && (
              <div className="hg-section">
                <h2 className="hg-section-title">Start Your AI Interview</h2>
                <p className="hg-section-sub">
                  A photorealistic AI interviewer will conduct a live 5-question interview with instant scored feedback.
                </p>
                <label className="hg-label">Job Role / Position</label>
                <input className="hg-input"
                  placeholder="e.g., Software Engineer, Data Scientist"
                  value={role}
                  onChange={e => { setRole(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && launch()}
                  disabled={loading} />
                <button className="hg-btn-primary" onClick={launch}
                  disabled={loading || !role.trim()}>
                  {loading ? '⏳ Launching...' : '🚀 Start Interview with ARIA'}
                </button>
                <div className="hg-feature-row">
                  {['🎬 HD Video Avatar','🎙 Real Voice','🧠 Gemini AI','📊 Live Score'].map(f=>(
                    <span key={f} className="hg-feature-tag">{f}</span>
                  ))}
                </div>
                <div className="hg-setup-note">
                  <strong>⚙️ If avatar fails to connect:</strong>
                  <ul style={{margin:'6px 0 0',paddingLeft:'16px',fontSize:'12px',lineHeight:'1.9'}}>
                    <li>Backend running? → <code>node server.js</code> in Backend/</li>
                    <li>API key set? → <code>HEYGEN_API_KEY=xxx</code> in Backend/.env</li>
                    <li>Key valid? → <code>node check-avatars.js</code> in Backend/</li>
                    <li>Get key → <a href="https://app.heygen.com" target="_blank" rel="noreferrer" style={{color:'#fbbf24'}}>app.heygen.com</a> → Settings → API</li>
                  </ul>
                </div>
              </div>
            )}

            {/* CONNECTING */}
            {phase === 'connecting' && (
              <div className="hg-section hg-centered">
                <div className="hg-spinner" />
                <p className="hg-connect-msg">{statusMsg || 'Starting avatar stream...'}</p>
                <p className="hg-connect-sub">ARIA is getting ready — takes 10–20 seconds</p>
              </div>
            )}

            {/* INTERVIEW */}
            {phase === 'interview' && (
              <div className="hg-section">
                <div className="hg-progress-wrap">
                  <div className="hg-progress-label">
                    <span>Question {qIndex+1} of {questions.length}</span>
                    {avgScore > 0 && <span>Avg: <strong>{avgScore}/100</strong></span>}
                  </div>
                  <div className="hg-progress-track">
                    <div className="hg-progress-fill" style={{ width:`${((qIndex+1)/questions.length)*100}%` }} />
                  </div>
                </div>
                <div className="hg-question-card">
                  <div className="hg-q-label">Question {qIndex+1}</div>
                  <p className="hg-q-text">{questions[qIndex]}</p>
                </div>
                <label className="hg-label">Your Answer</label>
                <textarea className="hg-textarea" rows={5}
                  placeholder="Type your answer here... Aim for 50–100 words with specific examples."
                  value={answer} onChange={e => setAnswer(e.target.value)}
                  disabled={loading || speaking} />
                <div className="hg-word-count">{wordCount} words</div>
                <div className="hg-btn-row">
                  <button className="hg-btn-primary" onClick={submitAnswer}
                    disabled={loading || !answer.trim() || speaking}>
                    {loading ? '⏳ Analyzing...' : '✅ Submit Answer'}
                  </button>
                  <button className="hg-btn-ghost" onClick={nextQuestion}
                    disabled={loading || speaking}>Skip</button>
                </div>
              </div>
            )}

            {/* ANALYSIS */}
            {phase === 'analysis' && (
              <div className="hg-section">
                <div className="hg-analysis-header">
                  <ScoreRing score={scores[scores.length-1] || 0} />
                  <div className="hg-analysis-title">
                    <h3>ARIA's Feedback</h3>
                    <p>Score: <strong>{scores[scores.length-1]}/100</strong></p>
                  </div>
                </div>
                <div className="hg-analysis-card">{analysis}</div>
                <div className="hg-your-answer">
                  <strong>Your Answer:</strong>
                  <p>{answer}</p>
                </div>
                <button className="hg-btn-primary" onClick={nextQuestion}
                  disabled={speaking || loading}>
                  {qIndex < questions.length-1 ? 'Next Question →' : '🏁 Finish Interview'}
                </button>
              </div>
            )}

            {/* COMPLETE */}
            {phase === 'complete' && (
              <div className="hg-section">
                <div className="hg-complete-header">
                  <div className="hg-complete-score">{avgScore}</div>
                  <div className="hg-complete-label">Overall Score</div>
                  <div className="hg-complete-stars">
                    {'★'.repeat(Math.round(avgScore/20))}{'☆'.repeat(5-Math.round(avgScore/20))}
                  </div>
                </div>
                <div className="hg-stat-row">
                  {[
                    { n: questions.length,                       l: 'Questions' },
                    { n: records.length,                         l: 'Answered'  },
                    { n: records.filter(r=>r.score>=70).length,  l: 'Strong'    },
                  ].map(s => (
                    <div key={s.l} className="hg-stat-box">
                      <div className="hg-stat-n">{s.n}</div>
                      <div className="hg-stat-l">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="hg-records">
                  {records.map((r,i) => (
                    <div key={i} className="hg-record-card">
                      <div className="hg-record-top">
                        <span className="hg-record-q">Q{i+1}: {r.question}</span>
                        <ScoreRing score={r.score} />
                      </div>
                      <p className="hg-record-ans">{r.answer}</p>
                      <p className="hg-record-fb">💬 {r.analysis}</p>
                    </div>
                  ))}
                </div>
                <button className="hg-btn-primary" onClick={onClose}>✅ Close Report</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}