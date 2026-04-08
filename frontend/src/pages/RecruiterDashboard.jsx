// frontend/src/pages/RecruiterDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import './RecruiterDashboard.css';

// Company logo emoji map
const COMPANY_LOGOS = {
  google:    '🔵', Google:    '🔵',
  amazon:    '🟠', Amazon:    '🟠',
  meta:      '🔷', Meta:      '🔷',
  apple:     '🍎', Apple:     '🍎',
  netflix:   '🔴', Netflix:   '🔴',
  microsoft: '🪟', Microsoft: '🪟',
  flipkart:  '🟦', Flipkart:  '🟦',
  uber:      '⬛', Uber:      '⬛',
  default:   '🏢',
};

const getCompanyLogo = (company) =>
  COMPANY_LOGOS[company] || COMPANY_LOGOS[company?.toLowerCase()] || COMPANY_LOGOS.default;

export default function RecruiterDashboard() {
  const [user, setUser]           = useState(null);
  const [meetings, setMeetings]   = useState([]);
  const [mentors, setMentors]     = useState([]);
  const [loadingM, setLoadingM]   = useState(false);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [copiedId, setCopiedId]   = useState('');
  const [filter, setFilter]       = useState('all');

  // Modal states
  const [showNewModal, setShowNewModal]     = useState(false);
  const [showBookModal, setShowBookModal]   = useState(false);
  const [showAddMentor, setShowAddMentor]   = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

  // Form states
  const [newPosition, setNewPosition]   = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [bookingForm, setBookingForm]   = useState({ name:'', email:'', topic:'', message:'', preferredTime:'' });
  const [bookingStatus, setBookingStatus] = useState(''); // 'sending' | 'sent' | 'error'

  const [addMentorForm, setAddMentorForm] = useState({
    name:'', role:'', company:'', companyLogo:'', experience:'', location:'',
    bio:'', expertise:'', languages:'English', sessionDuration:'45 min',
    email:'', rating:'5.0', avatarColor:'#7c3aed', photoUrl:'',
  });
  const [addMentorStatus, setAddMentorStatus] = useState(''); // 'saving' | 'saved' | 'error'

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
    fetchMentors();
  }, [navigate]);

  const fetchMeetings = async () => {
    setLoadingM(true);
    try {
      const res = await API.get('/meetings/my-meetings');
      setMeetings(res.data.meetings || []);
    } catch (e) { console.error(e); }
    finally { setLoadingM(false); }
  };

  const fetchMentors = async () => {
    setLoadingMentors(true);
    try {
      const res = await API.get('/mentorship');
      setMentors(res.data.mentors || []);
    } catch (e) {
      console.error('Could not fetch mentors:', e);
      setMentors([]); // empty — show "Add first mentor" state
    }
    finally { setLoadingMentors(false); }
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
    } catch (e) { alert('Failed to create session'); }
    finally { setCreating(false); }
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

  const openBookModal = (mentor) => {
    setSelectedMentor(mentor);
    setBookingForm({ name:'', email:'', topic:'', message:'', preferredTime:'' });
    setBookingStatus('');
    setShowBookModal(true);
  };

  const submitBooking = async () => {
    if (!bookingForm.name || !bookingForm.email || !bookingForm.topic) return;
    setBookingStatus('sending');
    try {
      await API.post('/mentorship/book', {
        mentorId:      selectedMentor._id,
        candidateName: bookingForm.name,
        candidateEmail: bookingForm.email,
        topic:         bookingForm.topic,
        message:       bookingForm.message,
        preferredTime: bookingForm.preferredTime,
      });
      setBookingStatus('sent');
      // Refresh mentor list to get updated session count
      fetchMentors();
    } catch (e) {
      console.error(e);
      setBookingStatus('error');
    }
  };

  const submitAddMentor = async () => {
    const { name, role, company, bio, email, experience, location } = addMentorForm;
    if (!name || !role || !company || !bio || !email || !experience || !location) {
      alert('Please fill all required fields (marked *)');
      return;
    }
    setAddMentorStatus('saving');
    try {
      await API.post('/mentorship/add', {
        ...addMentorForm,
        expertise: addMentorForm.expertise.split(',').map(s => s.trim()).filter(Boolean),
        languages: addMentorForm.languages.split(',').map(s => s.trim()).filter(Boolean),
        rating:    parseFloat(addMentorForm.rating) || 5.0,
        companyLogo: addMentorForm.companyLogo || getCompanyLogo(addMentorForm.company),
      });
      setAddMentorStatus('saved');
      fetchMentors();
      setTimeout(() => {
        setShowAddMentor(false);
        setAddMentorStatus('');
        setAddMentorForm({
          name:'', role:'', company:'', companyLogo:'', experience:'', location:'',
          bio:'', expertise:'', languages:'English', sessionDuration:'45 min',
          email:'', rating:'5.0', avatarColor:'#7c3aed', photoUrl:'',
        });
      }, 1500);
    } catch (e) {
      console.error(e);
      setAddMentorStatus('error');
    }
  };

  const filtered = meetings.filter(m => filter === 'all' ? true : m.status === filter);
  const stats = {
    total:      meetings.length,
    ongoing:    meetings.filter(m => m.status === 'ongoing').length,
    completed:  meetings.filter(m => m.status === 'completed').length,
    candidates: new Set(meetings.flatMap(m => m.participants?.map(p => p.user) || [])).size,
  };

  if (!user) return <div className="rdb-loading">Loading…</div>;

  return (
    <div className="rdb-root">

      {/* ── Nav ── */}
      <nav className="rdb-nav">
        <div className="rdb-nav-left">
          <div className="rdb-brand"><span className="rdb-icon">🚀</span><span className="rdb-name">HireMind</span></div>
          <span className="rdb-nav-sep" />
          <span className="rdb-nav-label">Recruiter Portal</span>
        </div>
        <div className="rdb-nav-right">
          <button className="rdb-btn-new" onClick={() => setShowNewModal(true)}>+ New Interview</button>
          <div className="rdb-user-chip">
            <div className="rdb-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="rdb-user-info">
              <span className="rdb-user-name">{user.name}</span>
              <span className="rdb-user-role">Recruiter</span>
            </div>
          </div>
          <button className="rdb-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="rdb-content">

        {/* ── Welcome ── */}
        <div className="rdb-welcome">
          <div>
            <h1 className="rdb-welcome-title">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
            <p className="rdb-welcome-sub">Manage sessions, share room links, and connect candidates with mentors.</p>
          </div>
          <div className="rdb-welcome-stats">
            <div className="rdb-ws"><span className="rdb-ws-val">{stats.ongoing}</span><span className="rdb-ws-lbl">Active Now</span></div>
            <div className="rdb-ws"><span className="rdb-ws-val">{stats.total}</span><span className="rdb-ws-lbl">Total Sessions</span></div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="rdb-stats-grid">
          {[
            { icon:'📋', val: stats.total,      label:'Total Sessions', variant:'blue'   },
            { icon:'🔴', val: stats.ongoing,    label:'Live Now',       variant:'red'    },
            { icon:'✅', val: stats.completed,  label:'Completed',      variant:'green'  },
            { icon:'👥', val: stats.candidates, label:'Candidates',     variant:'purple' },
          ].map(s => (
            <div key={s.label} className="rdb-stat-card" data-variant={s.variant}>
              <div className="rdb-sc-left">
                <div className="rdb-sc-icon">{s.icon}</div>
                <div>
                  <div className="rdb-sc-val">{s.val}</div>
                  <div className="rdb-sc-lbl">{s.label}</div>
                </div>
              </div>
              {s.variant === 'red' && s.val > 0 && (
                <div className="rdb-sc-pulse"><span className="rdb-live-dot" /></div>
              )}
              {s.variant === 'green' && (
                <div className="rdb-sc-arc">
                  <svg viewBox="0 0 36 36" width="48" height="48">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="#10b981" strokeWidth="3"
                      strokeDasharray={`${stats.total > 0 ? Math.round((stats.completed/stats.total)*100) : 0}, 100`}
                      strokeLinecap="round" />
                  </svg>
                </div>
              )}
              {s.variant === 'purple' && (
                <div className="rdb-sc-dots">
                  {[...Array(Math.min(s.val, 6))].map((_, i) => (
                    <div key={i} className="rdb-dot" style={{ animationDelay:`${i*0.15}s` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Action Cards ── */}
        <div className="rdb-actions">
          <div className="rdb-action-card rdb-action-primary" onClick={() => setShowNewModal(true)}>
            <div className="rdb-ac-icon">🎬</div>
            <div className="rdb-ac-content"><h3>Create New Session</h3><p>Start an interview room and share the Room ID</p></div>
            <span className="rdb-ac-arrow">→</span>
          </div>
          <div className="rdb-action-card" onClick={() => { const id = prompt('Enter Room ID:'); if (id?.trim()) navigate(`/room/${id.trim()}`); }}>
            <div className="rdb-ac-icon">🔗</div>
            <div className="rdb-ac-content"><h3>Rejoin Active Session</h3><p>Enter a Room ID to rejoin an ongoing interview</p></div>
            <span className="rdb-ac-arrow">→</span>
          </div>
          <div className="rdb-action-card rdb-action-disabled">
            <div className="rdb-ac-icon">📊</div>
            <div className="rdb-ac-content"><h3>Analytics & Reports</h3><p>View candidate scores and AI insights</p></div>
            <span className="rdb-coming">Soon</span>
          </div>
        </div>

        {/* ── Sessions ── */}
        <div className="rdb-sessions-card">
          <div className="rdb-sessions-hdr">
            <h2>Interview Sessions</h2>
            <div className="rdb-filters">
              {['all','ongoing','completed'].map(f => (
                <button key={f} className={`rdb-filter ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                  <span className="rdb-filter-n">{f==='all'?meetings.length:meetings.filter(m=>m.status===f).length}</span>
                </button>
              ))}
            </div>
          </div>

          {loadingM ? (
            <div className="rdb-empty"><div className="rdb-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="rdb-empty">
              <div className="rdb-empty-icon">📋</div>
              <h3>No sessions yet</h3>
              <p>Create your first interview session to get started</p>
              <button className="rdb-btn-new" onClick={() => setShowNewModal(true)}>+ Create First Session</button>
            </div>
          ) : (
            <div className="rdb-table">
              {filtered.map(m => (
                <div key={m._id} className="rdb-row">
                  <div className="rdb-row-main">
                    <div className={`rdb-status-dot ${m.status}`} />
                    <div>
                      <div className="rdb-row-title">{m.title}</div>
                      <div className="rdb-row-meta">
                        <span>📅 {new Date(m.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                        <span>🕐 {new Date(m.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span>
                        {m.participants?.length>1 && <span>👥 {m.participants.length} participants</span>}
                        {m.duration && <span>⏱ {m.duration} min</span>}
                      </div>
                    </div>
                  </div>
                  <div className="rdb-row-actions">
                    <div className="rdb-room-id-box">
                      <span className="rdb-room-lbl">Room ID</span>
                      <code className="rdb-room-code">{m.roomId.substring(0,16)}…</code>
                      <button className="rdb-copy-btn" onClick={() => copyRoomId(m.roomId)}>
                        {copiedId===m.roomId ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    {m.status==='ongoing' ? (
                      <button className="rdb-rejoin-btn" onClick={() => navigate(`/room/${m.roomId}`)}>Rejoin →</button>
                    ) : (
                      <button className="rdb-view-btn" disabled>View Report</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Mentorship Section ── */}
        <div className="rdb-mentor-section">
          <div className="rdb-mentor-hdr">
            <div>
              <h2 className="rdb-mentor-title">1-on-1 Mentorship</h2>
              <p className="rdb-mentor-sub">
                Connect candidates with real engineers from top tech companies —
                freshers with 1–2 years of Big Tech experience.
              </p>
            </div>
            <div className="rdb-mentor-hdr-right">
              <div className="rdb-mentor-badge">🎓 {mentors.length} mentors</div>
              <button className="rdb-add-mentor-btn" onClick={() => setShowAddMentor(true)}>
                + Add Mentor
              </button>
            </div>
          </div>

          {loadingMentors ? (
            <div className="rdb-empty" style={{ padding: '40px 0' }}>
              <div className="rdb-spinner" />
            </div>
          ) : mentors.length === 0 ? (
            <div className="rdb-mentor-empty">
              <div style={{ fontSize: 48 }}>🧑‍💻</div>
              <h3>No mentors added yet</h3>
              <p>Add real mentors so candidates can book 1-on-1 sessions.</p>
              <button className="rdb-book-btn" onClick={() => setShowAddMentor(true)}>+ Add First Mentor</button>
            </div>
          ) : (
            <div className="rdb-mentor-grid">
              {mentors.map(mentor => (
                <div key={mentor._id} className="rdb-mentor-card">
                  <div className="rdb-mc-top">
                    <div className="rdb-mc-avatar"
                      style={{ background: (mentor.avatarColor || '#7c3aed') + '20', color: mentor.avatarColor || '#7c3aed', border: `2px solid ${mentor.avatarColor || '#7c3aed'}40` }}>
                      {mentor.photoUrl
                        ? <img src={mentor.photoUrl} alt={mentor.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'inherit' }} />
                        : mentor.avatarInitials || mentor.name?.charAt(0)
                      }
                    </div>
                    <div className="rdb-mc-info">
                      <div className="rdb-mc-name">{mentor.name}</div>
                      <div className="rdb-mc-role">{mentor.role}</div>
                      <div className="rdb-mc-company">
                        <span>{mentor.companyLogo || getCompanyLogo(mentor.company)}</span>
                        <span>{mentor.company}</span>
                        <span className="rdb-mc-exp">· {mentor.experience}</span>
                      </div>
                    </div>
                    <div className="rdb-mc-rating">
                      <span className="rdb-mc-stars">★</span>
                      <span className="rdb-mc-rval">{Number(mentor.rating).toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="rdb-mc-bio">{mentor.bio}</p>

                  {mentor.expertise?.length > 0 && (
                    <div className="rdb-mc-tags">
                      {mentor.expertise.map(e => <span key={e} className="rdb-mc-tag">{e}</span>)}
                    </div>
                  )}

                  <div className="rdb-mc-footer">
                    <div className="rdb-mc-meta">
                      <span>⏱ {mentor.sessionDuration}</span>
                      <span>💬 {mentor.sessions} sessions</span>
                      <span>📍 {mentor.location}</span>
                    </div>
                    <button className="rdb-book-btn" onClick={() => openBookModal(mentor)}>
                      Book Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Guide ── */}
        <div className="rdb-guide">
          <h3>💡 How to invite candidates</h3>
          <div className="rdb-guide-steps">
            {['Click "+ New Interview" to create a session', 'Copy the Room ID using the 📋 button', 'Share the Room ID with your candidate', 'Candidate joins from their dashboard'].map((step, i) => (
              <div key={i} className="rdb-guide-step">
                <div className="rdb-step-n">{i+1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── New Session Modal ── */}
      {showNewModal && (
        <div className="rdb-modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="rdb-modal" onClick={e => e.stopPropagation()}>
            <div className="rdb-modal-hdr">
              <h3>🎬 Create New Interview Session</h3>
              <button className="rdb-modal-close" onClick={() => setShowNewModal(false)}>✕</button>
            </div>
            <div className="rdb-modal-body">
              <label>Position / Role *</label>
              <input className="rdb-modal-input" placeholder="e.g., Senior Frontend Developer"
                value={newPosition} onChange={e => setNewPosition(e.target.value)} autoFocus />
              <label>Candidate Name (optional)</label>
              <input className="rdb-modal-input" placeholder="e.g., John Smith"
                value={candidateName} onChange={e => setCandidateName(e.target.value)}
                onKeyDown={e => e.key==='Enter' && createSession()} />
              <div className="rdb-modal-note">💡 A unique Room ID will be generated. Share it with your candidate.</div>
            </div>
            <div className="rdb-modal-footer">
              <button className="rdb-modal-cancel" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button className="rdb-modal-create" onClick={createSession} disabled={creating || !newPosition.trim()}>
                {creating ? 'Creating…' : '🚀 Create & Start'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Mentor Modal ── */}
      {showAddMentor && (
        <div className="rdb-modal-overlay" onClick={() => setShowAddMentor(false)}>
          <div className="rdb-modal rdb-add-mentor-modal" onClick={e => e.stopPropagation()}>
            <div className="rdb-modal-hdr">
              <h3>🧑‍💻 Add Real Mentor</h3>
              <button className="rdb-modal-close" onClick={() => setShowAddMentor(false)}>✕</button>
            </div>

            {addMentorStatus === 'saved' ? (
              <div className="rdb-booking-success">
                <div className="rdb-success-icon">✅</div>
                <h3>Mentor Added!</h3>
                <p>The mentor will now appear in the mentorship section for candidates to book.</p>
              </div>
            ) : (
              <>
                <div className="rdb-modal-body rdb-add-form">
                  <div className="rdb-add-note">
                    📧 The mentor's email is stored securely in your database. It's <strong>never shown to candidates</strong> — it's only used to send them booking requests.
                  </div>

                  <div className="rdb-form-row">
                    <div className="rdb-form-group">
                      <label>Full Name *</label>
                      <input className="rdb-modal-input" placeholder="e.g., Priya Nair"
                        value={addMentorForm.name} onChange={e => setAddMentorForm(p=>({...p, name:e.target.value}))} />
                    </div>
                    <div className="rdb-form-group">
                      <label>Role / Title *</label>
                      <input className="rdb-modal-input" placeholder="e.g., Software Engineer II"
                        value={addMentorForm.role} onChange={e => setAddMentorForm(p=>({...p, role:e.target.value}))} />
                    </div>
                  </div>

                  <div className="rdb-form-row">
                    <div className="rdb-form-group">
                      <label>Company *</label>
                      <input className="rdb-modal-input" placeholder="e.g., Google"
                        value={addMentorForm.company} onChange={e => setAddMentorForm(p=>({...p, company:e.target.value}))} />
                    </div>
                    <div className="rdb-form-group">
                      <label>Experience *</label>
                      <input className="rdb-modal-input" placeholder="e.g., 2 years"
                        value={addMentorForm.experience} onChange={e => setAddMentorForm(p=>({...p, experience:e.target.value}))} />
                    </div>
                  </div>

                  <div className="rdb-form-row">
                    <div className="rdb-form-group">
                      <label>Location *</label>
                      <input className="rdb-modal-input" placeholder="e.g., Bangalore, India"
                        value={addMentorForm.location} onChange={e => setAddMentorForm(p=>({...p, location:e.target.value}))} />
                    </div>
                    <div className="rdb-form-group">
                      <label>Session Duration</label>
                      <select className="rdb-modal-input" value={addMentorForm.sessionDuration}
                        onChange={e => setAddMentorForm(p=>({...p, sessionDuration:e.target.value}))}>
                        <option>30 min</option>
                        <option>45 min</option>
                        <option>60 min</option>
                      </select>
                    </div>
                  </div>

                  <label>Bio * <span className="rdb-form-hint">(max 400 chars — what candidates will see)</span></label>
                  <textarea className="rdb-modal-input rdb-modal-textarea"
                    placeholder="e.g., SWE at Google working on Search. Cleared Google, Amazon & Meta. Happy to help freshers crack Big Tech."
                    rows={3} maxLength={400}
                    value={addMentorForm.bio} onChange={e => setAddMentorForm(p=>({...p, bio:e.target.value}))} />

                  <label>Expertise Tags <span className="rdb-form-hint">(comma-separated)</span></label>
                  <input className="rdb-modal-input" placeholder="e.g., DSA, System Design, Resume Review"
                    value={addMentorForm.expertise} onChange={e => setAddMentorForm(p=>({...p, expertise:e.target.value}))} />

                  <div className="rdb-form-row">
                    <div className="rdb-form-group">
                      <label>Languages <span className="rdb-form-hint">(comma-separated)</span></label>
                      <input className="rdb-modal-input" placeholder="English, Hindi"
                        value={addMentorForm.languages} onChange={e => setAddMentorForm(p=>({...p, languages:e.target.value}))} />
                    </div>
                    <div className="rdb-form-group">
                      <label>Rating</label>
                      <input className="rdb-modal-input" type="number" min="1" max="5" step="0.1" placeholder="5.0"
                        value={addMentorForm.rating} onChange={e => setAddMentorForm(p=>({...p, rating:e.target.value}))} />
                    </div>
                  </div>

                  <label>Photo URL <span className="rdb-form-hint">(optional — paste image link from LinkedIn/Cloudinary)</span></label>
                  <input className="rdb-modal-input" placeholder="https://... (leave blank to use initials avatar)"
                    value={addMentorForm.photoUrl} onChange={e => setAddMentorForm(p=>({...p, photoUrl:e.target.value}))} />

                  <label>Avatar Color <span className="rdb-form-hint">(used if no photo)</span></label>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <input type="color" value={addMentorForm.avatarColor}
                      onChange={e => setAddMentorForm(p=>({...p, avatarColor:e.target.value}))}
                      style={{ width:44, height:36, border:'1px solid #e8e5df', borderRadius:8, cursor:'pointer', padding:2 }} />
                    <span style={{ fontSize:13, color:'#78716c' }}>{addMentorForm.avatarColor}</span>
                  </div>

                  <div className="rdb-form-divider">
                    <span>🔒 Private — never shown to candidates</span>
                  </div>

                  <label>Mentor's Real Email * <span className="rdb-form-hint">(booking requests go here)</span></label>
                  <input className="rdb-modal-input" type="email" placeholder="mentor@gmail.com"
                    value={addMentorForm.email} onChange={e => setAddMentorForm(p=>({...p, email:e.target.value}))} />

                  {addMentorStatus === 'error' && (
                    <div style={{ background:'#fee2e2', color:'#991b1b', padding:'10px 14px', borderRadius:8, fontSize:13 }}>
                      ❌ Failed to add mentor. Check all required fields and try again.
                    </div>
                  )}
                </div>

                <div className="rdb-modal-footer">
                  <button className="rdb-modal-cancel" onClick={() => setShowAddMentor(false)}>Cancel</button>
                  <button className="rdb-modal-create" onClick={submitAddMentor}
                    disabled={addMentorStatus === 'saving'}>
                    {addMentorStatus === 'saving' ? '💾 Saving…' : '✅ Add Mentor'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Book Session Modal ── */}
      {showBookModal && selectedMentor && (
        <div className="rdb-modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="rdb-modal rdb-book-modal" onClick={e => e.stopPropagation()}>
            <div className="rdb-modal-hdr">
              <h3>Book a Session</h3>
              <button className="rdb-modal-close" onClick={() => setShowBookModal(false)}>✕</button>
            </div>

            {bookingStatus === 'sent' ? (
              <div className="rdb-booking-success">
                <div className="rdb-success-icon">🎉</div>
                <h3>Request Sent!</h3>
                <p>Your booking request has been emailed to <strong>{selectedMentor.name}</strong>.</p>
                <p>They'll reply with available time slots within 24–48 hours.</p>
                <p className="rdb-success-email">📬 Check your inbox at <strong>{bookingForm.email}</strong></p>
                <button className="rdb-modal-create" style={{ width:160 }} onClick={() => setShowBookModal(false)}>Done</button>
              </div>
            ) : bookingStatus === 'error' ? (
              <div className="rdb-booking-success">
                <div className="rdb-success-icon">❌</div>
                <h3>Something went wrong</h3>
                <p>Email sending failed. Make sure EMAIL_USER and EMAIL_PASS are set in your backend .env file.</p>
                <button className="rdb-modal-create" style={{ width:160 }} onClick={() => setBookingStatus('')}>Try Again</button>
              </div>
            ) : (
              <>
                <div className="rdb-book-mentor-info">
                  <div className="rdb-mc-avatar sm"
                    style={{ background:(selectedMentor.avatarColor||'#7c3aed')+'20', color:selectedMentor.avatarColor||'#7c3aed' }}>
                    {selectedMentor.photoUrl
                      ? <img src={selectedMentor.photoUrl} alt={selectedMentor.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'inherit' }} />
                      : selectedMentor.avatarInitials
                    }
                  </div>
                  <div>
                    <div className="rdb-mc-name">{selectedMentor.name}</div>
                    <div className="rdb-mc-company">{selectedMentor.companyLogo||getCompanyLogo(selectedMentor.company)} {selectedMentor.company} · {selectedMentor.role}</div>
                    <div className="rdb-mc-meta" style={{ marginTop:4 }}>
                      <span>⏱ {selectedMentor.sessionDuration}</span>
                      <span>★ {Number(selectedMentor.rating).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="rdb-modal-body">
                  <div className="rdb-form-row">
                    <div className="rdb-form-group">
                      <label>Your Name *</label>
                      <input className="rdb-modal-input" placeholder="Full name"
                        value={bookingForm.name} onChange={e => setBookingForm(p=>({...p, name:e.target.value}))} />
                    </div>
                    <div className="rdb-form-group">
                      <label>Your Email *</label>
                      <input className="rdb-modal-input" type="email" placeholder="your@email.com"
                        value={bookingForm.email} onChange={e => setBookingForm(p=>({...p, email:e.target.value}))} />
                    </div>
                  </div>

                  <label>Topic *</label>
                  <select className="rdb-modal-input" value={bookingForm.topic}
                    onChange={e => setBookingForm(p=>({...p, topic:e.target.value}))}>
                    <option value="">Select a topic…</option>
                    {selectedMentor.expertise?.map(e => <option key={e} value={e}>{e}</option>)}
                    <option value="Resume Review">Resume Review</option>
                    <option value="Mock Interview">Mock Interview</option>
                    <option value="Career Guidance">Career Guidance</option>
                    <option value="Other">Other</option>
                  </select>

                  <label>Preferred Time</label>
                  <input className="rdb-modal-input" placeholder="e.g., Weekday evenings IST"
                    value={bookingForm.preferredTime} onChange={e => setBookingForm(p=>({...p, preferredTime:e.target.value}))} />

                  <label>Message to Mentor</label>
                  <textarea className="rdb-modal-input rdb-modal-textarea"
                    placeholder="Describe your background and what you'd like help with…"
                    rows={4} value={bookingForm.message}
                    onChange={e => setBookingForm(p=>({...p, message:e.target.value}))} />

                  <div className="rdb-modal-note">
                    📬 Your request is emailed to the mentor. They'll reply with available slots within 24–48 hrs.
                  </div>
                </div>

                <div className="rdb-modal-footer">
                  <button className="rdb-modal-cancel" onClick={() => setShowBookModal(false)}>Cancel</button>
                  <button className="rdb-modal-create" onClick={submitBooking}
                    disabled={bookingStatus==='sending' || !bookingForm.name || !bookingForm.email || !bookingForm.topic}>
                    {bookingStatus==='sending' ? '📤 Sending…' : '📩 Send Booking Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}