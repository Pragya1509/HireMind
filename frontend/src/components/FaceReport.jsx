// frontend/src/components/FaceReport.jsx

const EXPRESSION_LABELS = {
  happy:     { label: 'Positive',  color: '#10b981', icon: '😊' },
  sad:       { label: 'Sad',       color: '#6366f1', icon: '😢' },
  angry:     { label: 'Tense',     color: '#ef4444', icon: '😠' },
  fearful:   { label: 'Nervous',   color: '#f59e0b', icon: '😨' },
  disgusted: { label: 'Uneasy',    color: '#8b5cf6', icon: '😒' },
  surprised: { label: 'Surprised', color: '#06b6d4', icon: '😲' },
  neutral:   { label: 'Composed',  color: '#3b82f6', icon: '😐' },
};

function gradeColor(pct) {
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

function gradeLabel(pct) {
  if (pct >= 85) return 'Excellent';
  if (pct >= 70) return 'Good';
  if (pct >= 50) return 'Needs Work';
  return 'Poor';
}

export default function FaceReport({ report, onClose }) {
  if (!report) return null;

  const {
    eyeContactPct,
    eyesOpenPct,
    forwardPct,
    lookingDownPct,
    headTurnPct,
    confidenceScore,
    expressionBreakdown,
    dominantExpression,
    overallScore,
    totalFrames,
  } = report;

  // ── Generate strict interview feedback ───────────────────────────────────
  const feedback = [];

  if (eyeContactPct < 50)
    feedback.push({ type: 'bad',  text: `Eye contact was only ${eyeContactPct}% of the time. Interviewers expect consistent eye contact — it signals confidence and engagement.` });
  else if (eyeContactPct < 75)
    feedback.push({ type: 'warn', text: `Eye contact was ${eyeContactPct}%. Aim for 80%+ in a real interview to appear fully engaged.` });
  else
    feedback.push({ type: 'good', text: `Strong eye contact at ${eyeContactPct}% — you came across as engaged and confident.` });

  if (eyesOpenPct < 80)
    feedback.push({ type: 'bad',  text: `Your eyes were closed or partially closed ${100 - eyesOpenPct}% of the time. This signals disengagement or fatigue to interviewers.` });

  if (lookingDownPct > 15)
    feedback.push({ type: 'bad',  text: `You looked down ${lookingDownPct}% of the time. This suggests reading notes or lack of confidence — avoid it in real interviews.` });

  if (headTurnPct > 20)
    feedback.push({ type: 'warn', text: `Your head turned away ${headTurnPct}% of the time. Face the camera directly throughout the interview.` });

  if (forwardPct >= 80)
    feedback.push({ type: 'good', text: `Excellent head positioning — you faced the camera ${forwardPct}% of the time.` });

  if (confidenceScore < 40)
    feedback.push({ type: 'bad',  text: `Your expressions appeared mostly nervous or negative. Practice mock interviews to build composure under pressure.` });
  else if (confidenceScore < 65)
    feedback.push({ type: 'warn', text: `Your confidence expression score was ${confidenceScore}%. Work on maintaining a calm, composed expression when answering.` });
  else
    feedback.push({ type: 'good', text: `You maintained a composed, positive expression for ${confidenceScore}% of the interview.` });

  const nervousEntry = expressionBreakdown.find(e => e.expression === 'fearful');
  if (nervousEntry?.pct > 25)
    feedback.push({ type: 'bad', text: `Nervousness was detected in ${nervousEntry.pct}% of frames. Try the 4-7-8 breathing technique before interviews.` });

  const angryEntry = expressionBreakdown.find(e => e.expression === 'angry');
  if (angryEntry?.pct > 15)
    feedback.push({ type: 'warn', text: `Tense expressions were detected ${angryEntry.pct}% of the time. Relax your jaw and forehead — avoid appearing frustrated.` });

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: 20, padding: 32,
        maxWidth: 560, width: '100%', maxHeight: '92vh', overflowY: 'auto',
        color: '#e2e8f0', fontFamily: 'Inter, sans-serif',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🎭 Interview Behaviour Report</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>
              Based on {totalFrames} analysis frames
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #1e293b',
            borderRadius: 8, color: '#94a3b8', padding: '6px 12px', cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* Overall score */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
          border: '1px solid #312e81', borderRadius: 16,
          padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="#1e293b" strokeWidth="7" />
              <circle cx="45" cy="45" r="38" fill="none"
                stroke={gradeColor(overallScore)} strokeWidth="7"
                strokeDasharray={`${(overallScore / 100) * 238.76} 238.76`}
                strokeLinecap="round" transform="rotate(-90 45 45)"
                style={{ transition: 'stroke-dasharray 1.2s ease' }}
              />
              <text x="45" y="50" textAnchor="middle" fontSize="22"
                fontWeight="900" fill={gradeColor(overallScore)}>
                {overallScore}
              </text>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Overall Interview Score</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: gradeColor(overallScore), marginBottom: 6 }}>
              {gradeLabel(overallScore)}
            </div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              Weighted: Eye contact (35%) · Confidence (30%) · Head pose (20%) · Eyes open (15%)
            </div>
          </div>
        </div>

        {/* Score cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <ScoreCard label="Eye Contact"   value={eyeContactPct}   icon="👁️" />
          <ScoreCard label="Composure"     value={confidenceScore} icon="💪" />
          <ScoreCard label="Head Forward"  value={forwardPct}      icon="🎯" />
          <ScoreCard label="Eyes Open"     value={eyesOpenPct}     icon="👀" />
        </div>

        {/* Head pose breakdown */}
        {(lookingDownPct > 0 || headTurnPct > 0) && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle>📐 Head Pose Issues</SectionTitle>
            {lookingDownPct > 0 && (
              <MiniBar label="Looking Down" value={lookingDownPct} color="#ef4444" />
            )}
            {headTurnPct > 0 && (
              <MiniBar label="Head Turned Away" value={headTurnPct} color="#f59e0b" />
            )}
          </div>
        )}

        {/* Expression breakdown */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>😶 Expression Breakdown</SectionTitle>
          {expressionBreakdown.map(e => {
            const meta = EXPRESSION_LABELS[e.expression] || { label: e.expression, color: '#667eea', icon: '😐' };
            return (
              <div key={e.expression} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span>{meta.icon} {meta.label}</span>
                  <span style={{ color: meta.color, fontWeight: 700 }}>{e.pct}%</span>
                </div>
                <div style={{ height: 6, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${e.pct}%`,
                    background: meta.color, borderRadius: 4,
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Strict feedback */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>💬 Interviewer Feedback</SectionTitle>
          {feedback.map((f, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, marginBottom: 10,
              background: f.type === 'bad' ? '#1f0f0f' : f.type === 'warn' ? '#1f180a' : '#0a1f14',
              border: `1px solid ${f.type === 'bad' ? '#7f1d1d' : f.type === 'warn' ? '#78350f' : '#14532d'}`,
              borderRadius: 10, padding: '10px 14px',
            }}>
              <span style={{ flexShrink: 0, fontSize: 15 }}>
                {f.type === 'bad' ? '❌' : f.type === 'warn' ? '⚠️' : '✅'}
              </span>
              <span style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>{f.text}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{
          width: '100%', padding: 13, borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Close Report
        </button>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, icon }) {
  const color = gradeColor(value);
  return (
    <div style={{
      background: '#111827', border: '1px solid #1e293b',
      borderRadius: 12, padding: '14px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}%</div>
      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 2 }}>{gradeLabel(value)}</div>
      <div style={{ marginTop: 8, height: 4, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

function MiniBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: '#94a3b8' }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h4 style={{
      fontSize: 12, color: '#475569', margin: '0 0 12px',
      textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>
      {children}
    </h4>
  );
}
