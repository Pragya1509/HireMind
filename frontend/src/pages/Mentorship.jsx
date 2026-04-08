// frontend/src/pages/Mentorship.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import './Mentorship.css';

const COMPANY_LOGOS = {
  google: '🔵', amazon: '🟠', meta: '🔷', apple: '🍎',
  netflix: '🔴', microsoft: '🪟', flipkart: '🟦', uber: '⬛',
};
const getLogo = (company = '') =>
  COMPANY_LOGOS[company.toLowerCase()] || '🏢';

const EXPERTISE_FILTERS = [
  'All', 'DSA', 'System Design', 'Behavioral', 'Resume Review',
  'Mock Interview', 'Frontend', 'Backend', 'ML / Data Science',
  'DevOps', 'Career Guidance',
];

export default function Mentorship() {
  const navigate  = useNavigate();
  const [mentors, setMentors]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('All');
  const [companyFilter, setCompanyFilter]   = useState('All');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [bookingForm, setBookingForm]       = useState({ name:'', email:'', topic:'', preferredTime:'', message:'' });
  const [bookingStatus, setBookingStatus]   = useState(''); // '' | 'sending' | 'sent' | 'error'
  const [showModal, setShowModal]           = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    fetchMentors();
    // Pre-fill name and email from logged-in user
    setBookingForm(p => ({ ...p, name: user.name || '', email: user.email || '' }));
  }, []);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const res = await API.get('/mentorship');
      setMentors(res.data.mentors || []);
    } catch (e) {
      console.error('Failed to fetch mentors:', e);
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  const openBooking = (mentor) => {
    setSelectedMentor(mentor);
    setBookingStatus('');
    setBookingForm(p => ({
      ...p,
      topic: mentor.expertise?.[0] || '',
      message: '',
      preferredTime: '',
    }));
    setShowModal(true);
  };

  const submitBooking = async () => {
    if (!bookingForm.name || !bookingForm.email || !bookingForm.topic) return;
    setBookingStatus('sending');
    try {
      await API.post('/mentorship/book', {
        mentorId:       selectedMentor._id,
        candidateName:  bookingForm.name,
        candidateEmail: bookingForm.email,
        topic:          bookingForm.topic,
        message:        bookingForm.message,
        preferredTime:  bookingForm.preferredTime,
      });
      setBookingStatus('sent');
      fetchMentors(); // refresh session counts
    } catch (e) {
      console.error(e);
      setBookingStatus('error');
    }
  };

  // Derived data
  const companies = ['All', ...new Set(mentors.map(m => m.company).filter(Boolean))];

  const filtered = mentors.filter(m => {
    const matchSearch = !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.company?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase()) ||
      m.expertise?.some(e => e.toLowerCase().includes(search.toLowerCase()));
    const matchExp = expertiseFilter === 'All' ||
      m.expertise?.some(e => e.toLowerCase().includes(expertiseFilter.toLowerCase()));
    const matchCo  = companyFilter === 'All' || m.company === companyFilter;
    return matchSearch && matchExp && matchCo;
  });

  return (
    <div className="mn-root">

      {/* ── Nav ── */}
      <header className="mn-nav">
        <button className="mn-back" onClick={() => navigate('/candidate-dashboard')}>
          ← Dashboard
        </button>
        <div className="mn-nav-brand">
          <span>🎓</span>
          <div>
            <div className="mn-nav-title">1-on-1 Mentorship</div>
            <div className="mn-nav-sub">Real engineers from top tech companies</div>
          </div>
        </div>
        <div className="mn-nav-right">
          <div className="mn-user-chip">
            <div className="mn-user-av">{user.name?.charAt(0)?.toUpperCase()}</div>
            <span className="mn-user-name">{user.name}</span>
          </div>
        </div>
      </header>

      <div className="mn-body">

        {/* ── Hero Banner ── */}
        <div className="mn-hero">
          <div className="mn-hero-left">
            <div className="mn-hero-tag">PEER MENTORSHIP</div>
            <h1 className="mn-hero-title">
              Learn from engineers<br />who cracked Big Tech
            </h1>
            <p className="mn-hero-sub">
              Book a 1-on-1 session with freshers (1–2 yrs exp) from Google,
              Amazon, Meta, Apple and more. Get real advice on DSA, system design,
              resumes, and everything in between.
            </p>
            <div className="mn-hero-stats">
              <div className="mn-hs"><strong>{mentors.length}</strong><span>Mentors</span></div>
              <div className="mn-hs-sep" />
              <div className="mn-hs"><strong>{[...new Set(mentors.map(m=>m.company))].length}</strong><span>Companies</span></div>
              <div className="mn-hs-sep" />
              <div className="mn-hs"><strong>{mentors.reduce((s,m)=>s+(m.sessions||0),0)}</strong><span>Sessions done</span></div>
            </div>
          </div>
          <div className="mn-hero-right">
            <div className="mn-floating-cards">
              {mentors.slice(0, 3).map((m, i) => (
                <div key={m._id} className="mn-float-card" style={{ animationDelay:`${i*0.4}s` }}>
                  <div className="mn-fc-avatar"
                    style={{ background:(m.avatarColor||'#7c3aed')+'22', color:m.avatarColor||'#7c3aed' }}>
                    {m.photoUrl
                      ? <img src={m.photoUrl} alt={m.name} style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit' }} />
                      : m.avatarInitials
                    }
                  </div>
                  <div>
                    <div className="mn-fc-name">{m.name}</div>
                    <div className="mn-fc-co">{getLogo(m.company)} {m.company}</div>
                  </div>
                  <div className="mn-fc-star">★ {Number(m.rating).toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div className="mn-filters-bar">
          <div className="mn-search-wrap">
            <span className="mn-search-icon">🔍</span>
            <input
              className="mn-search"
              placeholder="Search by name, company, skill…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="mn-clr" onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="mn-filter-row">
            <div className="mn-filter-group">
              <span className="mn-filter-label">Company</span>
              <div className="mn-chips">
                {companies.map(c => (
                  <button key={c}
                    className={`mn-chip ${companyFilter===c?'active':''}`}
                    onClick={() => setCompanyFilter(c)}>
                    {c !== 'All' && getLogo(c)} {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="mn-filter-group">
              <span className="mn-filter-label">Expertise</span>
              <div className="mn-chips">
                {EXPERTISE_FILTERS.map(e => (
                  <button key={e}
                    className={`mn-chip ${expertiseFilter===e?'active':''}`}
                    onClick={() => setExpertiseFilter(e)}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Results count ── */}
        {!loading && (
          <div className="mn-results-bar">
            <span className="mn-results-count">
              {filtered.length} mentor{filtered.length !== 1 ? 's' : ''} found
            </span>
            {(search || expertiseFilter !== 'All' || companyFilter !== 'All') && (
              <button className="mn-clear-all" onClick={() => { setSearch(''); setExpertiseFilter('All'); setCompanyFilter('All'); }}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Mentor Grid ── */}
        {loading ? (
          <div className="mn-loading">
            <div className="mn-spinner" />
            <p>Finding mentors for you…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mn-empty">
            <div className="mn-empty-icon">🧑‍💻</div>
            <h3>{mentors.length === 0 ? 'No mentors added yet' : 'No mentors match your filter'}</h3>
            <p>{mentors.length === 0
              ? 'Ask your recruiter to add mentors — they\'ll appear here once added.'
              : 'Try changing your search or filters.'
            }</p>
            {(search || expertiseFilter !== 'All' || companyFilter !== 'All') && (
              <button className="mn-book-btn" onClick={() => { setSearch(''); setExpertiseFilter('All'); setCompanyFilter('All'); }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="mn-grid">
            {filtered.map((mentor, idx) => (
              <div key={mentor._id} className="mn-card" style={{ animationDelay:`${idx*0.06}s` }}>

                {/* Card top */}
                <div className="mn-card-top">
                  <div className="mn-avatar-wrap">
                    <div className="mn-avatar"
                      style={{ background:(mentor.avatarColor||'#7c3aed')+'18', color:mentor.avatarColor||'#7c3aed', border:`2px solid ${mentor.avatarColor||'#7c3aed'}35` }}>
                      {mentor.photoUrl
                        ? <img src={mentor.photoUrl} alt={mentor.name} className="mn-avatar-img" />
                        : <span>{mentor.avatarInitials || mentor.name?.charAt(0)}</span>
                      }
                    </div>
                  </div>
                  <div className="mn-card-info">
                    <div className="mn-card-name">{mentor.name}</div>
                    <div className="mn-card-role">{mentor.role}</div>
                    <div className="mn-card-company">
                      <span>{mentor.companyLogo || getLogo(mentor.company)}</span>
                      <span className="mn-company-name">{mentor.company}</span>
                      <span className="mn-exp-badge">{mentor.experience}</span>
                    </div>
                  </div>
                  <div className="mn-card-rating">
                    <div className="mn-rating-val">★ {Number(mentor.rating||5).toFixed(1)}</div>
                    <div className="mn-sessions-val">{mentor.sessions || 0} sessions</div>
                  </div>
                </div>

                {/* Bio */}
                <p className="mn-card-bio">{mentor.bio}</p>

                {/* Expertise tags */}
                {mentor.expertise?.length > 0 && (
                  <div className="mn-card-tags">
                    {mentor.expertise.map(e => (
                      <span key={e} className="mn-tag"
                        style={{ borderColor:(mentor.avatarColor||'#7c3aed')+'40', color:mentor.avatarColor||'#7c3aed', background:(mentor.avatarColor||'#7c3aed')+'0d' }}>
                        {e}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="mn-card-footer">
                  <div className="mn-card-meta">
                    {mentor.sessionDuration && <span>⏱ {mentor.sessionDuration}</span>}
                    {mentor.location && <span>📍 {mentor.location}</span>}
                    {mentor.languages?.length > 0 && <span>💬 {mentor.languages.join(', ')}</span>}
                  </div>
                  <button className="mn-book-btn" onClick={() => openBooking(mentor)}>
                    Book Session →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── How it works ── */}
        {!loading && mentors.length > 0 && (
          <div className="mn-how-it-works">
            <h2 className="mn-hiw-title">How it works</h2>
            <div className="mn-hiw-steps">
              {[
                { icon:'🔍', step:'1', title:'Browse mentors', desc:'Find the right mentor by company, expertise, or role.' },
                { icon:'📩', step:'2', title:'Send a request', desc:'Fill a short form — mentor gets an email with your details.' },
                { icon:'📅', step:'3', title:'Get a time slot', desc:'Mentor replies with available slots within 24–48 hrs.' },
                { icon:'🎓', step:'4', title:'Join the session', desc:'Connect and get personalized guidance for your goals.' },
              ].map(s => (
                <div key={s.step} className="mn-hiw-step">
                  <div className="mn-hiw-icon">{s.icon}</div>
                  <div className="mn-hiw-num">Step {s.step}</div>
                  <div className="mn-hiw-step-title">{s.title}</div>
                  <div className="mn-hiw-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
      {showModal && selectedMentor && (
        <div className="mn-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="mn-modal" onClick={e => e.stopPropagation()}>

            {bookingStatus === 'sent' ? (
              <div className="mn-success">
                <div className="mn-success-icon">🎉</div>
                <h3>Request Sent!</h3>
                <p>Your booking request has been emailed to <strong>{selectedMentor.name}</strong>.</p>
                <p>They'll reply with available slots within <strong>24–48 hours</strong>. Check your inbox at <strong>{bookingForm.email}</strong>.</p>
                <div className="mn-success-next">
                  <div className="mn-success-step">📬 Wait for mentor's reply</div>
                  <div className="mn-success-step">📅 Confirm a time slot</div>
                  <div className="mn-success-step">🎓 Join your session</div>
                </div>
                <button className="mn-submit-btn" onClick={() => setShowModal(false)}>Done ✓</button>
              </div>
            ) : bookingStatus === 'error' ? (
              <div className="mn-success">
                <div className="mn-success-icon">⚠️</div>
                <h3>Email not configured</h3>
                <p>The backend email is not set up yet. Ask your recruiter to add EMAIL_USER and EMAIL_PASS to the backend .env file.</p>
                <button className="mn-submit-btn" onClick={() => setBookingStatus('')}>Try Again</button>
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div className="mn-modal-hdr">
                  <div className="mn-modal-mentor-info">
                    <div className="mn-modal-avatar"
                      style={{ background:(selectedMentor.avatarColor||'#7c3aed')+'18', color:selectedMentor.avatarColor||'#7c3aed' }}>
                      {selectedMentor.photoUrl
                        ? <img src={selectedMentor.photoUrl} alt={selectedMentor.name} className="mn-avatar-img" />
                        : selectedMentor.avatarInitials
                      }
                    </div>
                    <div>
                      <div className="mn-modal-name">{selectedMentor.name}</div>
                      <div className="mn-modal-role">
                        {selectedMentor.companyLogo || getLogo(selectedMentor.company)} {selectedMentor.company} · {selectedMentor.role}
                      </div>
                      <div className="mn-modal-meta">
                        <span>⏱ {selectedMentor.sessionDuration}</span>
                        <span>★ {Number(selectedMentor.rating||5).toFixed(1)}</span>
                        <span>💬 {selectedMentor.sessions||0} sessions</span>
                      </div>
                    </div>
                  </div>
                  <button className="mn-modal-close" onClick={() => setShowModal(false)}>✕</button>
                </div>

                {/* Form */}
                <div className="mn-modal-body">
                  <div className="mn-form-row">
                    <div className="mn-form-group">
                      <label>Your Name *</label>
                      <input className="mn-input" placeholder="Full name"
                        value={bookingForm.name}
                        onChange={e => setBookingForm(p=>({...p,name:e.target.value}))} />
                    </div>
                    <div className="mn-form-group">
                      <label>Your Email *</label>
                      <input className="mn-input" type="email" placeholder="your@email.com"
                        value={bookingForm.email}
                        onChange={e => setBookingForm(p=>({...p,email:e.target.value}))} />
                    </div>
                  </div>

                  <div className="mn-form-group">
                    <label>What do you need help with? *</label>
                    <select className="mn-input"
                      value={bookingForm.topic}
                      onChange={e => setBookingForm(p=>({...p,topic:e.target.value}))}>
                      <option value="">Select a topic…</option>
                      {selectedMentor.expertise?.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                      <option value="Resume Review">Resume Review</option>
                      <option value="Mock Interview">Mock Interview</option>
                      <option value="Career Guidance">Career Guidance</option>
                      <option value="Interview Prep">Interview Prep</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="mn-form-group">
                    <label>Preferred Time Slot</label>
                    <input className="mn-input" placeholder="e.g., Weekday evenings IST, Saturday mornings"
                      value={bookingForm.preferredTime}
                      onChange={e => setBookingForm(p=>({...p,preferredTime:e.target.value}))} />
                  </div>

                  <div className="mn-form-group">
                    <label>Message to {selectedMentor.name?.split(' ')[0]}</label>
                    <textarea className="mn-input mn-textarea"
                      rows={4}
                      placeholder={`Tell ${selectedMentor.name?.split(' ')[0]} about your background, what you're preparing for, and what specific help you need…`}
                      value={bookingForm.message}
                      onChange={e => setBookingForm(p=>({...p,message:e.target.value}))} />
                  </div>

                  <div className="mn-booking-note">
                    📬 Your request will be emailed to <strong>{selectedMentor.name}</strong>. They'll reply with their available time slots within 24–48 hours. Your email address will be shared with them so they can respond.
                  </div>
                </div>

                <div className="mn-modal-footer">
                  <button className="mn-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="mn-submit-btn"
                    onClick={submitBooking}
                    disabled={bookingStatus==='sending' || !bookingForm.name || !bookingForm.email || !bookingForm.topic}>
                    {bookingStatus==='sending' ? '📤 Sending request…' : '📩 Send Booking Request'}
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