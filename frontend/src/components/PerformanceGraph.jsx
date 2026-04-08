// frontend/src/components/PerformanceGraph.jsx
import { useState, useEffect } from 'react';
import { getMyReports } from '../api/api';
import './PerformanceGraph.css';

export default function PerformanceGraph({ onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    getMyReports()
      .then(r => setReports(r.data.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── SVG line chart ────────────────────────────────────────────────────────
  const Chart = ({ reports }) => {
    if (reports.length < 2) return null;

    const sorted = [...reports].sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));
    const scores = sorted.map(r => r.avgScore);
    const W=540, H=150, pL=32, pR=16, pT=20, pB=28;
    const cW = W-pL-pR, cH = H-pT-pB;

    const xOf = i  => pL + (i/(scores.length-1))*cW;
    const yOf = s  => pT + cH - (s/100)*cH;

    const line = scores.map((s,i)=>`${xOf(i)},${yOf(s)}`).join(' ');
    const area = `${pL},${pT+cH} ${line} ${xOf(scores.length-1)},${pT+cH}`;

    const diff   = scores[scores.length-1] - scores[0];
    const tCol   = diff>5?'#16a34a':diff<-5?'#ef4444':'#6366f1';
    const tLabel = diff>5?`↑ +${diff} pts`:diff<-5?`↓ ${diff} pts`:'→ Consistent';

    return (
      <div className="pg-chart-card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="pg-card-label">Score Trend</div>
          <span style={{fontSize:12,fontWeight:700,color:tCol,background:`${tCol}12`,padding:'3px 10px',borderRadius:20,border:`1px solid ${tCol}28`}}>
            {tLabel}
          </span>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
          <defs>
            <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          {[25,50,75,100].map(g=>{
            const y=yOf(g);
            return (
              <g key={g}>
                <line x1={pL} y1={y} x2={W-pR} y2={y} stroke="#ede9fe" strokeWidth="1"/>
                <text x={pL-5} y={y+4} fontSize="9" fill="#a78bfa" textAnchor="end">{g}</text>
              </g>
            );
          })}
          <polygon points={area} fill="url(#pgGrad)"/>
          <polyline points={line} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {scores.map((s,i)=>{
            const x=xOf(i), y=yOf(s);
            const col=s>=75?'#16a34a':s>=50?'#d97706':'#ef4444';
            const date=new Date(sorted[i].createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'});
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill={col} stroke="white" strokeWidth="2"/>
                <text x={x} y={y-10} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="700">{s}</text>
                <text x={x} y={H-2} textAnchor="middle" fontSize="8" fill="#94a3b8">{date}</text>
              </g>
            );
          })}
        </svg>

        {/* Min/Avg/Max */}
        <div style={{display:'flex',gap:8,marginTop:10}}>
          {[
            {label:'Best',    val:Math.max(...scores), col:'#16a34a'},
            {label:'Latest',  val:scores[scores.length-1], col:tCol},
            {label:'Average', val:Math.round(scores.reduce((a,b)=>a+b,0)/scores.length), col:'#7c3aed'},
          ].map(s=>(
            <div key={s.label} style={{flex:1,textAlign:'center',background:'white',borderRadius:10,padding:'8px 6px',border:'1px solid #ede9fe'}}>
              <div style={{fontSize:20,fontWeight:900,color:s.col,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:10,color:'#94a3b8',marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Score colour helpers ──────────────────────────────────────────────────
  const scoreCol = s => s>=75?'#16a34a':s>=50?'#d97706':'#ef4444';
  const scoreBg  = s => s>=75?'#d1fae5':s>=50?'#fef3c7':'#fee2e2';

  return (
    <div className="pg-overlay" onClick={onClose}>
      <div className="pg-panel" onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="pg-header">
          <div className="pg-header-left">
            <span className="pg-header-icon">📈</span>
            <div>
              <p className="pg-title">Performance Reports</p>
              <p className="pg-subtitle">Your ARIA interview history & progress</p>
            </div>
          </div>
          <button className="pg-close" onClick={onClose}>✕</button>
        </div>

        <div className="pg-body">

          {loading && (
            <div className="pg-loading">
              <div className="pg-spin"/>
              <p style={{color:'#64748b',fontSize:14}}>Loading your reports...</p>
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="pg-empty">
              <div className="pg-empty-icon">📭</div>
              <h3>No reports yet</h3>
              <p>Complete an ARIA interview to see your performance here.</p>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <>
              {/* Stats */}
              <div className="pg-stats-row">
                {[
                  {label:'Sessions',  val:reports.length,                                                                     c:'#7c3aed'},
                  {label:'Avg Score', val:Math.round(reports.reduce((a,r)=>a+r.avgScore,0)/reports.length),                   c:'#667eea'},
                  {label:'Best',      val:Math.max(...reports.map(r=>r.avgScore)),                                            c:'#16a34a'},
                  {label:'Strong Qs', val:reports.reduce((a,r)=>a+(r.strongAnswers||0),0),                                    c:'#f59e0b'},
                ].map(s=>(
                  <div key={s.label} className="pg-stat" style={{'--c':s.c}}>
                    <div className="pg-stat-val">{s.val}</div>
                    <div className="pg-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Trend chart */}
              <Chart reports={reports}/>

              {/* Session list */}
              <div className="pg-history-label">All Sessions</div>
              <div className="pg-history">
                {reports.map((r,i)=>{
                  const isOpen = openIdx===i;
                  return (
                    <div key={r._id||i} className={`pg-row ${isOpen?'pg-row-open':''}`}
                      onClick={()=>setOpenIdx(isOpen?null:i)}>

                      <div className="pg-row-main">
                        <div className="pg-row-left">
                          <div className="pg-row-role">{r.role} Interview</div>
                          <div className="pg-row-date">
                            {new Date(r.createdAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
                          </div>
                          <div className="pg-row-chips">
                            <span className="pg-chip pg-chip-qs">{r.answeredQuestions}/{r.totalQuestions} answered</span>
                            <span className="pg-chip pg-chip-strong">{r.strongAnswers} strong</span>
                          </div>
                        </div>
                        <div className="pg-row-right">
                          <svg width="52" height="52" viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="20" fill="none" stroke="#ede9fe" strokeWidth="4"/>
                            <circle cx="26" cy="26" r="20" fill="none"
                              stroke={scoreCol(r.avgScore)} strokeWidth="4"
                              strokeDasharray={`${(r.avgScore/100)*125.6} 125.6`}
                              strokeLinecap="round" transform="rotate(-90 26 26)"/>
                            <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill={scoreCol(r.avgScore)}>
                              {r.avgScore}
                            </text>
                          </svg>
                          <span className="pg-caret">{isOpen?'▲':'▼'}</span>
                        </div>
                      </div>

                      {/* Expanded breakdown */}
                      {isOpen && r.records?.length > 0 && (
                        <div className="pg-breakdown">
                          {r.records.map((rec,j)=>(
                            <div key={j} className="pg-qa">
                              <div className="pg-qa-top">
                                <span className="pg-qa-num">Q{j+1}</span>
                                <span className="pg-qa-score" style={{
                                  color:scoreCol(rec.score),
                                  background:scoreBg(rec.score),
                                  borderColor:scoreCol(rec.score)+'44',
                                }}>
                                  {rec.score}/100
                                </span>
                              </div>
                              <p className="pg-qa-q">{rec.question}</p>
                              <p className="pg-qa-a">{rec.answer}</p>
                              {rec.analysis && <p className="pg-qa-fb">{rec.analysis}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
