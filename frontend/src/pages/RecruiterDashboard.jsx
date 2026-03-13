// frontend/src/pages/RecruiterDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import './RecruiterDashboard.css';

export default function RecruiterDashboard() {
  const [user, setUser]           = useState(null);
  const [meetings, setMeetings]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [creating, setCreating]   = useState(false);
  const [copiedId, setCopiedId]   = useState('');
  const [filter, setFilter]       = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPosition, setNewPosition] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'recruiter' && parsed.role !== 'admin') { 
      navigate('/candidate-dashboard'); return; 
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

  const createSession = async () => {
    if (!newPosition.trim()) return;
    setCreating(true);
    try {
      const title = candidateName.trim() 
        ? `${candidateName} - ${newPosition}` 
        : `${newPosition} Interview`;
      const res = await API.post('/meetings/create', { title });
      const { roomId } = res.data.meeting;
      setShowNewModal(false);
      setNewPosition(''); setCandidateName('');
      navigate(`/room/${roomId}`);
    } catch (e) {
      alert('Failed to create session');
    } finally { setCreating(false); }
  };

  const joinSession = () => {
    const id = prompt('Enter Room ID to rejoin:');
    if (id?.trim()) navigate(`/room/${id.trim()}`);
  };

  const copyRoomId = (roomId) => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filtered = meetings.filter(m =>
    filter === 'all' ? true : m.status === filter
  );

  const stats = {
    total:     meetings.length,
    ongoing:   meetings.filter(m => m.status === 'ongoing').length,
    completed: meetings.filter(m => m.status === 'completed').length,
    candidates: new Set(meetings.flatMap(m => m.participants?.map(p => p.user) || [])).size,
  };

  if (!user) return <div className="rdb-loading">Loading...</div>;

  return (
    <div className="rdb-root">
      
      {/* Top Nav */}
      <nav className="rdb-nav">
        <div className="rdb-nav-left">
          <div className="rdb-brand">
            <span className="rdb-icon">🚀</span>
            <span className="rdb-name">HireMind</span>
          </div>
          <span className="rdb-divider" />
          <span className="rdb-nav-title">Recruiter Portal</span>
        </div>
        <div className="rdb-nav-right">
          <button className="rdb-btn-new" onClick={() => setShowNewModal(true)}>
            + New Interview
          </button>
          <div className="rdb-user-menu">
            <div className="rdb-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="rdb-user-info">
              <div className="rdb-user-name">{user.name}</div>
              <div className="rdb-user-role">Recruiter</div>
            </div>
            <button className="rdb-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="rdb-content">

        {/* Welcome banner */}
        <div className="rdb-welcome">
          <div className="rdb-welcome-left">
            <h1>Welcome back, {user.name.split(' ')[0]}! 👋</h1>
            <p>Manage your interview sessions, share room links with candidates, and track progress</p>
          </div>
          <div className="rdb-welcome-right">
            <div className="rdb-quick-stat">
              <span className="rdb-qs-label">Active Sessions</span>
              <span className="rdb-qs-val">{stats.ongoing}</span>
            </div>
            <div className="rdb-quick-stat">
              <span className="rdb-qs-label">Total Conducted</span>
              <span className="rdb-qs-val">{stats.total}</span>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="rdb-stats">
          {[
            { icon: '📋', label: 'Total Sessions',  val: stats.total,     color: '#3b82f6' },
            { icon: '🔴', label: 'Live Now',        val: stats.ongoing,   color: '#ef4444' },
            { icon: '✅', label: 'Completed',       val: stats.completed, color: '#10b981' },
            { icon: '👥', label: 'Candidates',      val: stats.candidates, color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="rdb-stat-card" style={{'--color': s.color}}>
              <div className="rdb-stat-icon">{s.icon}</div>
              <div className="rdb-stat-num">{s.val}</div>
              <div className="rdb-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="rdb-actions">
          <div className="rdb-action-card rdb-primary" onClick={() => setShowNewModal(true)}>
            <div className="rdb-ac-icon">🎬</div>
            <div className="rdb-ac-content">
              <h3>Create New Session</h3>
              <p>Start an interview room and get a shareable Room ID for your candidate</p>
            </div>
            <div className="rdb-ac-arrow">→</div>
          </div>

          <div className="rdb-action-card" onClick={joinSession}>
            <div className="rdb-ac-icon">🔗</div>
            <div className="rdb-ac-content">
              <h3>Rejoin Active Session</h3>
              <p>Enter a Room ID to rejoin an ongoing interview</p>
            </div>
            <div className="rdb-ac-arrow">→</div>
          </div>

          <div className="rdb-action-card rdb-disabled">
            <div className="rdb-ac-icon">📊</div>
            <div className="rdb-ac-content">
              <h3>Analytics & Reports</h3>
              <p>View candidate performance and AI scoring insights</p>
            </div>
            <span className="rdb-coming-soon">Coming Soon</span>
          </div>
        </div>

        {/* Sessions table */}
        <div className="rdb-sessions-card">
          <div className="rdb-sessions-header">
            <h2>Interview Sessions</h2>
            <div className="rdb-filter-group">
              {['all','ongoing','completed'].map(f => (
                <button key={f} className={`rdb-filter ${filter===f?'active':''}`}
                  onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                  <span className="rdb-filter-count">
                    {f==='all' ? meetings.length : meetings.filter(m=>m.status===f).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rdb-empty">
              <div className="rdb-spinner" />
              <span>Loading sessions...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rdb-empty">
              <div className="rdb-empty-icon">📋</div>
              <h3>No sessions yet</h3>
              <p>Create your first interview session to get started</p>
              <button className="rdb-btn-new" onClick={() => setShowNewModal(true)}>
                + Create First Session
              </button>
            </div>
          ) : (
            <div className="rdb-table">
              {filtered.map(m => (
                <div key={m._id} className="rdb-row">
                  <div className="rdb-row-main">
                    <div className={`rdb-status-dot ${m.status}`} />
                    <div className="rdb-row-info">
                      <div className="rdb-row-title">{m.title}</div>
                      <div className="rdb-row-meta">
                        <span className="rdb-meta-item">
                          📅 {new Date(m.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                        </span>
                        <span className="rdb-meta-item">
                          🕐 {new Date(m.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                        </span>
                        {m.participants?.length > 1 && (
                          <span className="rdb-meta-item">👥 {m.participants.length} participants</span>
                        )}
                        {m.duration && (
                          <span className="rdb-meta-item">⏱ {m.duration} min</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rdb-row-actions">
                    <div className="rdb-room-id-box">
                      <span className="rdb-room-label">Room ID:</span>
                      <code className="rdb-room-code">{m.roomId.substring(0,16)}...</code>
                      <button className="rdb-copy-btn" onClick={() => copyRoomId(m.roomId)}>
                        {copiedId === m.roomId ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    {m.status === 'ongoing' ? (
                      <button className="rdb-rejoin-btn"
                        onClick={() => navigate(`/room/${m.roomId}`)}>
                        Rejoin Session →
                      </button>
                    ) : (
                      <button className="rdb-view-btn" disabled>View Report</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How to share guide */}
        <div className="rdb-guide-card">
          <h3>💡 How to invite candidates</h3>
          <div className="rdb-guide-steps">
            {[
              'Click "+ New Interview" to create a session',
              'Copy the Room ID using the 📋 button',
              'Share the Room ID with your candidate via email/message',
              'Candidate enters the Room ID on their dashboard to join',
            ].map((step, i) => (
              <div key={i} className="rdb-guide-step">
                <div className="rdb-step-num">{i+1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Session Modal */}
      {showNewModal && (
        <div className="rdb-modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="rdb-modal" onClick={e => e.stopPropagation()}>
            <div className="rdb-modal-header">
              <h3>🎬 Create New Interview Session</h3>
              <button className="rdb-modal-close" onClick={() => setShowNewModal(false)}>✕</button>
            </div>
            <div className="rdb-modal-body">
              <label>Position / Role *</label>
              <input className="rdb-modal-input"
                placeholder="e.g., Senior Frontend Developer"
                value={newPosition}
                onChange={e => setNewPosition(e.target.value)}
                onKeyDown={e => e.key==='Enter' && candidateName && createSession()}
                autoFocus />
              
              <label style={{marginTop:16}}>Candidate Name (optional)</label>
              <input className="rdb-modal-input"
                placeholder="e.g., John Smith"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                onKeyDown={e => e.key==='Enter' && createSession()} />
              
              <div className="rdb-modal-note">
                💡 A unique Room ID will be generated. Share it with your candidate to join the session.
              </div>
            </div>
            <div className="rdb-modal-footer">
              <button className="rdb-modal-cancel" onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button className="rdb-modal-create" onClick={createSession}
                disabled={creating || !newPosition.trim()}>
                {creating ? 'Creating...' : '🚀 Create & Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}