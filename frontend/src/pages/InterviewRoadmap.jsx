// frontend/src/pages/InterviewRoadmap.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import './InterviewRoadmap.css';

const ROLES = [
  'Software Engineer','Frontend Developer','Backend Developer','Full Stack Developer',
  'Data Scientist','Data Analyst','Product Manager','Finance Analyst',
  'Marketing Manager','HR Manager','Business Analyst','DevOps Engineer',
  'UI/UX Designer','Machine Learning Engineer','Mobile Developer',
];

const EXPERIENCES = [
  { val:'fresher', label:'🎓 Fresher', sub:'0 years' },
  { val:'junior',  label:'🌱 Junior',  sub:'1–2 years' },
  { val:'mid',     label:'💼 Mid',     sub:'3–5 years' },
  { val:'senior',  label:'🚀 Senior',  sub:'6–10 years' },
  { val:'lead',    label:'👑 Lead',    sub:'10+ years' },
];

const COMPANIES = ['Google','Amazon','Microsoft','Meta','Apple','Netflix','Uber','Flipkart','Infosys','TCS','Startup'];

const TYPE_COLORS = {
  concept: { bg:'#eff6ff', text:'#1d4ed8', border:'#bfdbfe', icon:'📖' },
  practice:{ bg:'#f0fdf4', text:'#15803d', border:'#bbf7d0', icon:'💻' },
  project: { bg:'#faf5ff', text:'#7c3aed', border:'#e9d5ff', icon:'🔨' },
  mock:    { bg:'#fff7ed', text:'#c2410c', border:'#fed7aa', icon:'🎯' },
};

const PRIORITY_COLORS = {
  high:   { dot:'#ef4444', label:'High Priority' },
  medium: { dot:'#f59e0b', label:'Medium' },
  low:    { dot:'#94a3b8', label:'Low' },
};

export default function InterviewRoadmap() {
  const navigate = useNavigate();
  const [step, setStep]               = useState('setup');   // setup | generating | roadmap
  const [roadmap, setRoadmap]         = useState(null);
  const [activeWeek, setActiveWeek]   = useState(0);
  const [completedTopics, setCompletedTopics] = useState({});
  const [error, setError]             = useState('');

  // Form state
  const [role, setRole]               = useState('');
  const [customRole, setCustomRole]   = useState('');
  const [experience, setExperience]   = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [weakAreas, setWeakAreas]     = useState('');

  // Load saved roadmap from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hm_roadmap');
    if (saved) {
      try {
        const { roadmap: r, completedTopics: c } = JSON.parse(saved);
        setRoadmap(r);
        setCompletedTopics(c || {});
        setActiveWeek(0);
        setStep('roadmap');
      } catch {}
    }
  }, []);

  const toggleCompany = (c) => {
    setSelectedCompanies(p => p.includes(c) ? p.filter(x=>x!==c) : [...p, c]);
  };

  const generate = async () => {
    const finalRole = role === 'Other' ? customRole : role;
    if (!finalRole || !experience) { setError('Please select a role and experience level.'); return; }
    setError('');
    setStep('generating');

    try {
      const res = await API.post('/ai/generate-roadmap', {
        role: finalRole, experience,
        targetCompanies: selectedCompanies,
        weakAreas: weakAreas.split(',').map(s=>s.trim()).filter(Boolean),
      });
      const r = res.data.roadmap;
      setRoadmap(r);
      setCompletedTopics({});
      setActiveWeek(0);
      // Save to localStorage so it persists
      localStorage.setItem('hm_roadmap', JSON.stringify({ roadmap: r, completedTopics: {} }));
      setStep('roadmap');
    } catch (e) {
      setError('Failed to generate roadmap. Please try again.');
      setStep('setup');
    }
  };

  const toggleTopic = (weekIdx, topicIdx) => {
    const key = `${weekIdx}-${topicIdx}`;
    const next = { ...completedTopics, [key]: !completedTopics[key] };
    setCompletedTopics(next);
    if (roadmap) {
      localStorage.setItem('hm_roadmap', JSON.stringify({ roadmap, completedTopics: next }));
    }
  };

  const resetRoadmap = () => {
    localStorage.removeItem('hm_roadmap');
    setRoadmap(null);
    setCompletedTopics({});
    setRole(''); setExperience(''); setSelectedCompanies([]); setWeakAreas('');
    setStep('setup');
  };

  // ── Progress calculation ──────────────────────────────────────────────────
  const totalTopics = roadmap?.weeks?.reduce((a,w)=>a+w.topics.length,0) || 0;
  const doneTopics  = Object.values(completedTopics).filter(Boolean).length;
  const overallPct  = totalTopics > 0 ? Math.round((doneTopics/totalTopics)*100) : 0;

  const weekProgress = (wIdx) => {
    if (!roadmap) return 0;
    const w = roadmap.weeks[wIdx];
    const done = w.topics.filter((_,ti) => completedTopics[`${wIdx}-${ti}`]).length;
    return w.topics.length > 0 ? Math.round((done/w.topics.length)*100) : 0;
  };

  // ── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (step === 'setup') return (
    <div className="ir-root">
      <div className="ir-setup-page">

        {/* Back */}
        <button className="ir-back" onClick={()=>navigate('/dashboard')}>← Dashboard</button>

        <div className="ir-setup-hero">
          <div className="ir-setup-badge">AI-Powered</div>
          <h1 className="ir-setup-title">Interview Roadmap</h1>
          <p className="ir-setup-sub">
            Get a personalized week-by-week study plan built from your role, experience,
            and past ARIA performance data.
          </p>
        </div>

        <div className="ir-setup-card">

          {error && <div className="ir-error">⚠️ {error}</div>}

          {/* Role */}
          <div className="ir-field">
            <label className="ir-label">What role are you preparing for?</label>
            <div className="ir-role-grid">
              {[...ROLES,'Other'].map(r=>(
                <button key={r} className={`ir-role-chip ${role===r?'active':''}`}
                  onClick={()=>setRole(r)}>
                  {r}
                </button>
              ))}
            </div>
            {role==='Other'&&(
              <input className="ir-input" placeholder="Enter your role..."
                value={customRole} onChange={e=>setCustomRole(e.target.value)} autoFocus/>
            )}
          </div>

          {/* Experience */}
          <div className="ir-field">
            <label className="ir-label">Experience level</label>
            <div className="ir-exp-row">
              {EXPERIENCES.map(e=>(
                <button key={e.val} className={`ir-exp-chip ${experience===e.val?'active':''}`}
                  onClick={()=>setExperience(e.val)}>
                  <span className="ir-exp-label">{e.label}</span>
                  <span className="ir-exp-sub">{e.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target companies */}
          <div className="ir-field">
            <label className="ir-label">Target companies <span style={{color:'#94a3b8',fontWeight:400}}>(optional)</span></label>
            <div className="ir-company-row">
              {COMPANIES.map(c=>(
                <button key={c} className={`ir-company-chip ${selectedCompanies.includes(c)?'active':''}`}
                  onClick={()=>toggleCompany(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Weak areas */}
          <div className="ir-field">
            <label className="ir-label">Weak areas <span style={{color:'#94a3b8',fontWeight:400}}>(optional, comma separated)</span></label>
            <input className="ir-input" placeholder="e.g. system design, dynamic programming, behavioural questions"
              value={weakAreas} onChange={e=>setWeakAreas(e.target.value)}/>
          </div>

          <button className="ir-generate-btn" onClick={generate}
            disabled={!role || !experience}>
            <span>🗺️</span> Generate My Roadmap
          </button>

          <p className="ir-note">
            ✨ ARIA analyses your past interview scores to make this plan personal to you.
          </p>
        </div>
      </div>
    </div>
  );

  // ── GENERATING ────────────────────────────────────────────────────────────
  if (step === 'generating') return (
    <div className="ir-root">
      <div className="ir-generating">
        <div className="ir-gen-orb"/>
        <div className="ir-gen-spinner"/>
        <h2 className="ir-gen-title">Building your roadmap...</h2>
        <p className="ir-gen-sub">ARIA is analysing your profile and past performance</p>
        <div className="ir-gen-steps">
          {['Reviewing your interview history','Identifying skill gaps','Mapping week-by-week plan','Adding curated resources'].map((s,i)=>(
            <div key={i} className="ir-gen-step" style={{animationDelay:`${i*0.8}s`}}>
              <div className="ir-gen-step-dot"/>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── ROADMAP VIEW ──────────────────────────────────────────────────────────
  if (!roadmap) return null;
  const week = roadmap.weeks?.[activeWeek];

  return (
    <div className="ir-root">

      {/* Header */}
      <div className="ir-header">
        <div className="ir-header-left">
          <button className="ir-back-sm" onClick={()=>navigate('/dashboard')}>← Dashboard</button>
          <div>
            <h1 className="ir-header-title">{roadmap.title}</h1>
            <p className="ir-header-sub">{roadmap.summary}</p>
          </div>
        </div>
        <div className="ir-header-right">
          <div className="ir-overall-progress">
            <div className="ir-progress-ring-wrap">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#ede9fe" strokeWidth="5"/>
                <circle cx="32" cy="32" r="26" fill="none" stroke="#7c3aed" strokeWidth="5"
                  strokeDasharray={`${(overallPct/100)*163} 163`}
                  strokeLinecap="round" transform="rotate(-90 32 32)"
                  style={{transition:'stroke-dasharray 0.8s ease'}}/>
                <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7c3aed">
                  {overallPct}%
                </text>
              </svg>
            </div>
            <div>
              <div className="ir-progress-label">Overall Progress</div>
              <div className="ir-progress-sub">{doneTopics}/{totalTopics} topics done</div>
            </div>
          </div>
          <button className="ir-reset-btn" onClick={resetRoadmap}>↺ New Roadmap</button>
        </div>
      </div>

      <div className="ir-body">

        {/* Left sidebar */}
        <div className="ir-sidebar">

          {/* Stats */}
          <div className="ir-sidebar-stats">
            {[
              {icon:'⏱️', val:`${roadmap.estimatedHours}h`, label:'Total Study Time'},
              {icon:'🎯', val:`${roadmap.targetScore}/100`, label:'Target Score'},
              {icon:'📅', val:`${roadmap.weeks?.length} weeks`, label:'Duration'},
            ].map(s=>(
              <div key={s.label} className="ir-mini-stat">
                <span className="ir-mini-stat-icon">{s.icon}</span>
                <div>
                  <div className="ir-mini-stat-val">{s.val}</div>
                  <div className="ir-mini-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Week nav */}
          <div className="ir-week-nav">
            <div className="ir-week-nav-title">Weeks</div>
            {roadmap.weeks?.map((w,i)=>{
              const pct = weekProgress(i);
              const isActive = activeWeek===i;
              return (
                <button key={i} className={`ir-week-btn ${isActive?'active':''} ${pct===100?'done':''}`}
                  onClick={()=>setActiveWeek(i)}>
                  <div className="ir-week-btn-top">
                    <span className="ir-week-num">W{w.week}</span>
                    {pct===100 && <span className="ir-week-check">✓</span>}
                  </div>
                  <div className="ir-week-theme">{w.theme}</div>
                  <div className="ir-week-prog-bar">
                    <div style={{width:`${pct}%`,height:'100%',background:isActive?'#7c3aed':'#a78bfa',borderRadius:4,transition:'width 0.5s ease'}}/>
                  </div>
                  <div className="ir-week-pct">{pct}% done · {w.hours}h</div>
                </button>
              );
            })}
          </div>

          {/* Key skills */}
          {roadmap.keySkills?.length>0 && (
            <div className="ir-skills-card">
              <div className="ir-skills-title">Skill Targets</div>
              {roadmap.keySkills.map((s,i)=>(
                <div key={i} className="ir-skill-row">
                  <div className="ir-skill-name-row">
                    <span className="ir-skill-name">{s.skill}</span>
                    <span className="ir-skill-imp" style={{
                      background:s.importance==='high'?'#fee2e2':'#fef9c3',
                      color:s.importance==='high'?'#dc2626':'#92400e',
                    }}>
                      {s.importance}
                    </span>
                  </div>
                  <div className="ir-skill-bar-track">
                    <div style={{
                      width:`${(s.currentLevel/10)*100}%`,
                      background:'#e2e8f0',height:'100%',borderRadius:4,
                      position:'absolute',left:0,top:0,
                    }}/>
                    <div style={{
                      width:`${(s.targetLevel/10)*100}%`,
                      background:'linear-gradient(90deg,#7c3aed,#a78bfa)',
                      height:'100%',borderRadius:4,
                      position:'absolute',left:0,top:0,opacity:0.35,
                    }}/>
                    <div style={{
                      width:`${(s.currentLevel/10)*100}%`,
                      background:'linear-gradient(90deg,#7c3aed,#a78bfa)',
                      height:'100%',borderRadius:4,position:'absolute',left:0,top:0,
                    }}/>
                  </div>
                  <div className="ir-skill-levels">
                    <span>Now: {s.currentLevel}/10</span>
                    <span>Target: {s.targetLevel}/10</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="ir-main">

          {week && (
            <>
              {/* Week header */}
              <div className="ir-week-header">
                <div>
                  <div className="ir-week-tag">Week {week.week}</div>
                  <h2 className="ir-week-title">{week.theme}</h2>
                  <p className="ir-week-focus">Focus: {week.focus}</p>
                </div>
                <div className="ir-week-meta">
                  <div className="ir-week-hours">⏱ {week.hours}h this week</div>
                  <div className="ir-week-prog-pct">{weekProgress(activeWeek)}% complete</div>
                </div>
              </div>

              {/* Daily habit */}
              <div className="ir-daily-habit">
                <span className="ir-habit-icon">🌅</span>
                <div>
                  <div className="ir-habit-label">Daily 15-min habit</div>
                  <div className="ir-habit-text">{week.dailyTask}</div>
                </div>
              </div>

              {/* Topics */}
              <div className="ir-topics-label">Topics this week</div>
              <div className="ir-topics">
                {week.topics?.map((topic,ti)=>{
                  const key = `${activeWeek}-${ti}`;
                  const done = !!completedTopics[key];
                  const tc = TYPE_COLORS[topic.type] || TYPE_COLORS.concept;
                  const pc = PRIORITY_COLORS[topic.priority] || PRIORITY_COLORS.medium;
                  return (
                    <div key={ti} className={`ir-topic-card ${done?'done':''}`}>
                      <div className="ir-topic-top">
                        <div className="ir-topic-left">
                          <div className="ir-topic-badges">
                            <span className="ir-type-badge" style={{background:tc.bg,color:tc.text,border:`1px solid ${tc.border}`}}>
                              {tc.icon} {topic.type}
                            </span>
                            <span className="ir-priority-dot" style={{background:pc.dot}} title={pc.label}/>
                          </div>
                          <div className={`ir-topic-name ${done?'strikethrough':''}`}>{topic.name}</div>
                          <div className="ir-topic-tip">💡 {topic.tip}</div>
                        </div>
                        <button className={`ir-check-btn ${done?'checked':''}`}
                          onClick={()=>toggleTopic(activeWeek,ti)}>
                          {done ? '✓' : ''}
                        </button>
                      </div>

                      {topic.resources?.length>0 && (
                        <div className="ir-resources">
                          <span className="ir-resources-label">Resources:</span>
                          {topic.resources.map((res,ri)=>(
                            <span key={ri} className="ir-resource-chip">{res}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Milestone */}
              <div className="ir-milestone">
                <div className="ir-milestone-icon">🏆</div>
                <div>
                  <div className="ir-milestone-label">Week {week.week} Milestone</div>
                  <div className="ir-milestone-text">{week.milestone}</div>
                </div>
              </div>

              {/* Week nav arrows */}
              <div className="ir-week-arrows">
                <button className="ir-arrow-btn" disabled={activeWeek===0}
                  onClick={()=>setActiveWeek(p=>p-1)}>
                  ← Previous Week
                </button>
                {activeWeek < roadmap.weeks.length-1 ? (
                  <button className="ir-arrow-btn primary" onClick={()=>setActiveWeek(p=>p+1)}>
                    Next Week →
                  </button>
                ) : (
                  <button className="ir-arrow-btn primary" onClick={()=>navigate('/aria-setup')}>
                    🤖 Start Practice →
                  </button>
                )}
              </div>
            </>
          )}

          {/* Interview tips */}
          {roadmap.interviewTips?.length>0 && (
            <div className="ir-tips-card">
              <div className="ir-tips-title">⚡ Pro Interview Tips</div>
              {roadmap.interviewTips.map((tip,i)=>(
                <div key={i} className="ir-tip-row">
                  <span className="ir-tip-num">{i+1}</span>
                  <span className="ir-tip-text">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
