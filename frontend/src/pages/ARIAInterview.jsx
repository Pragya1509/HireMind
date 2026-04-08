// frontend/src/pages/ARIAInterview.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateQuestions, analyzeAnswer, saveReport, createMeeting, endMeeting } from '../api/api';
import FaceAnalyzer from '../components/FaceAnalyzer';
import './ARIAInterview.css';

const QUESTION_TIME = 90;

const LANG_PROMPTS = {
  english: {
    intro: (r,e) => `Hello! I'm ARIA, your AI interviewer. Let's begin your ${e} level ${r} interview.`,
    ack:   ()    => `Thank you.`,
    done:  ()    => `Interview complete. Well done today.`,
    warn:  ()    => `15 seconds remaining.`,
  },
};

const EXPRESSION_LABELS = {
  happy:'Happy', sad:'Sad', angry:'Angry',
  fearful:'Nervous', disgusted:'Disgusted',
  surprised:'Surprised', neutral:'Confident',
};

const FILLERS      = ['um','uh','aa','er','like','you know','basically','literally','actually','right'];
const countFillers = (t) => FILLERS.reduce((n,f) => n + (t.toLowerCase().match(new RegExp(`\\b${f}\\b`,'g'))?.length||0), 0);
const wordCount    = (t) => t.trim().split(/\s+/).filter(Boolean).length;

// ── ARIA Avatar ───────────────────────────────────────────────────────────────
function ARIAAvatar({ speaking }) {
  return (
    <div style={{
      width:'100%', height:248,
      background:'linear-gradient(180deg,#110826 0%,#08031a 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      position:'relative', overflow:'hidden', flexShrink:0,
    }}>
      <style>{`
        @keyframes av-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes av-glow{0%,100%{opacity:0.3}50%{opacity:0.6}}
        @keyframes av-ring{0%{transform:scale(0.9);opacity:0.5}100%{transform:scale(1.85);opacity:0}}
        @keyframes av-bar{0%,100%{height:3px}50%{height:14px}}
        @keyframes av-pulse{0%,100%{opacity:1}50%{opacity:0.45}}
      `}</style>

      <div style={{position:'absolute',width:230,height:230,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(109,40,217,0.11) 0%,transparent 70%)',
        animation:'av-glow 3s ease-in-out infinite',zIndex:1,pointerEvents:'none'}}/>

      {speaking && [0,1,2].map(i=>(
        <div key={i} style={{
          position:'absolute',width:185,height:185,borderRadius:'50%',
          border:'1px solid rgba(109,40,217,0.28)',
          animation:'av-ring 2.2s ease-out infinite',
          animationDelay:`${i*0.65}s`,opacity:0,zIndex:1,
          top:'50%',left:'50%',marginTop:-92,marginLeft:-92,
        }}/>
      ))}

      <div style={{animation:'av-float 4s ease-in-out infinite',position:'relative',zIndex:2,flexShrink:0}}>
        <svg width="180" height="200" viewBox="0 0 180 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="skG" cx="50%" cy="38%" r="62%">
              <stop offset="0%" stopColor="#FDDCB5"/><stop offset="100%" stopColor="#EEB07C"/>
            </radialGradient>
            <radialGradient id="ckG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F9A8C0" stopOpacity="0.5"/><stop offset="100%" stopColor="#F9A8C0" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="hkG" cx="50%" cy="0%" r="80%">
              <stop offset="0%" stopColor="#4A2870"/><stop offset="100%" stopColor="#261344"/>
            </radialGradient>
            <linearGradient id="lkG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E86078"/><stop offset="100%" stopColor="#C22E58"/>
            </linearGradient>
            <filter id="fkG"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#00000044"/></filter>
          </defs>
          <ellipse cx="90" cy="74" rx="60" ry="66" fill="url(#hkG)"/>
          <rect x="76" y="146" width="28" height="28" rx="10" fill="url(#skG)"/>
          <path d="M 16 200 Q 26 162 56 156 Q 71 152 90 153 Q 109 152 124 156 Q 154 162 164 200 Z" fill="#5535A0"/>
          <path d="M 74 156 Q 90 168 106 156" fill="none" stroke="#7355C4" strokeWidth="1.8"/>
          <ellipse cx="90" cy="99" rx="52" ry="57" fill="url(#skG)" filter="url(#fkG)"/>
          <path d="M 38 82 Q 34 44 58 27 Q 72 17 90 15 Q 108 17 122 27 Q 146 44 142 82 Q 134 54 120 41 Q 106 31 90 29 Q 74 31 60 41 Q 44 54 38 82 Z" fill="url(#hkG)"/>
          <ellipse cx="60" cy="111" rx="13" ry="9" fill="url(#ckG)"/>
          <ellipse cx="120" cy="111" rx="13" ry="9" fill="url(#ckG)"/>
          <ellipse cx="68" cy="93" rx="13" ry="9" fill="white"/>
          <circle cx="68" cy="93" r="6" fill="#5535A0"/>
          <circle cx="68" cy="93" r="3.2" fill="#0e0620"/>
          <circle cx="70" cy="91" r="1.6" fill="white" opacity="0.92"/>
          <path d="M 55 88 Q 68 84 81 88" fill="none" stroke="#271445" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M 53 80 Q 68 74 83 78" fill="none" stroke="#3C1E5E" strokeWidth="2.3" strokeLinecap="round"/>
          <ellipse cx="112" cy="93" rx="13" ry="9" fill="white"/>
          <circle cx="112" cy="93" r="6" fill="#5535A0"/>
          <circle cx="112" cy="93" r="3.2" fill="#0e0620"/>
          <circle cx="114" cy="91" r="1.6" fill="white" opacity="0.92"/>
          <path d="M 99 88 Q 112 84 125 88" fill="none" stroke="#271445" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M 97 80 Q 112 74 127 78" fill="none" stroke="#3C1E5E" strokeWidth="2.3" strokeLinecap="round"/>
          <path d="M 90 99 Q 86 111 82 115 Q 90 119 98 115 Q 94 111 90 99" fill="none" stroke="#CC8850" strokeWidth="1.1" strokeLinecap="round" opacity="0.48"/>
          {speaking ? (
            <g>
              <path d="M 72 127 Q 90 135 108 127" fill="#AA1A3A"/>
              <ellipse cx="90" cy="130" rx="14" ry="6.5" fill="#760A26"/>
              <path d="M 72 127 Q 80 122 90 124 Q 100 122 108 127" fill="url(#lkG)"/>
            </g>
          ) : (
            <g>
              <path d="M 73 125 Q 80 121 90 123 Q 100 121 107 125" fill="url(#lkG)"/>
              <path d="M 73 125 Q 90 133 107 125" fill="url(#lkG)"/>
            </g>
          )}
          <ellipse cx="38"  cy="99" rx="5.5" ry="8.5" fill="#EEB07C"/>
          <ellipse cx="142" cy="99" rx="5.5" ry="8.5" fill="#EEB07C"/>
          <circle cx="38"  cy="109" r="3.8" fill="#7C3AED" opacity="0.85"/>
          <circle cx="38"  cy="109" r="1.8" fill="#C4B5FD"/>
          <circle cx="142" cy="109" r="3.8" fill="#7C3AED" opacity="0.85"/>
          <circle cx="142" cy="109" r="1.8" fill="#C4B5FD"/>
        </svg>
      </div>

      <div style={{position:'absolute',top:8,left:0,right:0,display:'flex',justifyContent:'center',zIndex:6,pointerEvents:'none'}}>
        <div style={{background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',borderRadius:20,padding:'3px 14px',display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:speaking?'#a78bfa':'#4c1d95',boxShadow:speaking?'0 0 7px #a78bfa':'none',transition:'all 0.3s'}}/>
          <span style={{fontSize:10,fontWeight:800,color:'#e2e8f0',letterSpacing:2.5,textTransform:'uppercase'}}>ARIA</span>
          <span style={{fontSize:8,color:speaking?'#c4b5fd':'#6d28d9',letterSpacing:1.5,textTransform:'uppercase'}}>{speaking?'SPEAKING':'LISTENING'}</span>
        </div>
      </div>

      {speaking && (
        <div style={{position:'absolute',bottom:8,left:0,right:0,zIndex:7,display:'flex',justifyContent:'center',alignItems:'flex-end',gap:2,height:18,pointerEvents:'none'}}>
          {[...Array(13)].map((_,i)=>(
            <div key={i} style={{width:3,minHeight:3,background:`hsl(${256+i*5},65%,${63+i*2}%)`,borderRadius:2,animation:'av-bar 0.44s ease-in-out infinite alternate',animationDelay:`${i*0.056}s`}}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size=64 }) {
  const r=size/2-6, c=2*Math.PI*r;
  const col=score>=75?'#16a34a':score>=50?'#d97706':'#dc2626';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="5"
        strokeDasharray={`${(score/100)*c} ${c-(score/100)*c}`}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:'stroke-dasharray 1s ease'}}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize={size*0.22} fontWeight="800" fill={col}>{score}</text>
    </svg>
  );
}

// ── Answer quality breakdown ──────────────────────────────────────────────────
function AnswerQualityBreakdown({ records }) {
  const answered = records.filter(r => !r.skipped && r.wordCount > 0);
  if (answered.length === 0) return null;
  const avgWords  = Math.round(answered.reduce((a,r) => a+r.wordCount, 0) / answered.length);
  const totalFill = records.reduce((a,r) => a+r.fillerCount, 0);
  const strongPct = Math.round((records.filter(r => r.score>=70).length / records.length) * 100);

  const metrics = [
    {
      label:'Avg Answer Length', value:`${avgWords} words`, icon:'📝',
      sub:   avgWords>=80 ? 'Ideal range' : avgWords>=50 ? 'A bit short — aim for 80–120 words' : 'Too brief — elaborate more',
      col:   avgWords>=80&&avgWords<=120 ? '#16a34a' : avgWords>=50 ? '#d97706' : '#ef4444',
      pct:   Math.min(100, Math.round((avgWords/120)*100)),
    },
    {
      label:'Total Filler Words', value:totalFill, icon:'⚠️',
      sub:   totalFill===0 ? 'Excellent — none detected' : totalFill<=3 ? 'Very few — well done' : totalFill<=8 ? 'Moderate — try to reduce' : 'High — practise pausing',
      col:   totalFill===0 ? '#16a34a' : totalFill<=3 ? '#10b981' : totalFill<=8 ? '#d97706' : '#ef4444',
      pct:   Math.max(0, 100-Math.min(100, totalFill*8)),
    },
    {
      label:'Strong Answers (≥70)', value:`${strongPct}%`, icon:'💪',
      sub:   strongPct>=70 ? 'Excellent performance' : strongPct>=40 ? 'Good — keep improving' : 'Focus on structure & examples',
      col:   strongPct>=70 ? '#16a34a' : strongPct>=40 ? '#d97706' : '#ef4444',
      pct:   strongPct,
    },
  ];

  return (
    <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'16px 18px',marginBottom:18,boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
      <div style={{fontSize:13,fontWeight:800,color:'#0f172a',marginBottom:4}}>📊 Answer Quality Analysis</div>
      <div style={{fontSize:11,color:'#94a3b8',marginBottom:14}}>Breakdown across all questions</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
        {metrics.map(m => (
          <div key={m.label} style={{background:'#f8fafc',borderRadius:10,padding:'12px',border:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
              <div style={{fontSize:10,color:'#64748b',fontWeight:600,lineHeight:1.4}}>{m.icon} {m.label}</div>
              <span style={{fontSize:16,fontWeight:900,color:m.col,marginLeft:4,flexShrink:0}}>{m.value}</span>
            </div>
            <div style={{height:4,background:'#e2e8f0',borderRadius:4,overflow:'hidden',marginBottom:6}}>
              <div style={{height:'100%',width:`${m.pct}%`,background:m.col,borderRadius:4,transition:'width 1s ease'}}/>
            </div>
            <div style={{fontSize:10,color:m.col,lineHeight:1.4}}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ARIAInterview() {
  const location = useLocation();
  const navigate  = useNavigate();
  const config    = location.state || {};
  const {
    role          = 'Software Engineer',
    experience    = 'mid',
    interviewType = 'general',
    difficulty    = 'medium',
    duration      = 5,
    cameraOn      = true,
    micOn         = true,
  } = config;

  const phrases = LANG_PROMPTS.english;

  const [phase, setPhase]                     = useState('loading');
  const [questions, setQuestions]             = useState([]);
  const [qIndex, setQIndex]                   = useState(0);
  const [answer, setAnswer]                   = useState('');
  const [records, setRecords]                 = useState([]);
  const [speaking, setSpeaking]               = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [timeLeft, setTimeLeft]               = useState(QUESTION_TIME);
  const [timerOn, setTimerOn]                 = useState(false);
  const [warned, setWarned]                   = useState(false);
  const [showReport, setShowReport]           = useState(false);
  const [isMuted, setIsMuted]                 = useState(!micOn);
  const [isCamOff, setIsCamOff]               = useState(!cameraOn);
  const [faceReport, setFaceReport]           = useState(null);
  const [faceAnalysisOn, setFaceAnalysisOn]   = useState(true);
  const [isListening, setIsListening]         = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimText, setInterimText]         = useState('');
  const [multiFaceCount, setMultiFaceCount]   = useState(0);

  const localVideoRef  = useRef(null);
  const localStream    = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);
  const timerRef       = useRef(null);
  const submitRef      = useRef(null);
  const recognitionRef = useRef(null);
  const loadedRef      = useRef(false);
  // ── ADD 1: roomId ref to track the created meeting ──────────────────────────
  const roomIdRef      = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setSpeechSupported(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraOn ? { width:640, height:480, facingMode:'user' } : false,
          audio: micOn,
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        localStream.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (e) { console.error('Camera/mic error:', e); }
    };
    startCamera();
    return () => {
      mounted = false;
      localStream.current?.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const speakRef = useRef(null);
  speakRef.current = (text) => new Promise(resolve => {
    if (!text?.trim()) return resolve();
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) { try { rec.stop(); } catch {} }
    setIsListening(false);
    setInterimText('');
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.87; u.pitch = 1.08; u.volume = 1;
    const voices = synthRef.current.getVoices();
    const v = voices.find(v => ['Samantha','Google UK English Female','Microsoft Zira','Karen'].some(p => v.name.includes(p)));
    if (v) u.voice = v;
    u.onstart = () => setSpeaking(true);
    u.onend   = () => { setSpeaking(false); resolve(); };
    u.onerror = () => { setSpeaking(false); resolve(); };
    synthRef.current.speak(u);
  });

  const speak = useCallback((text) => speakRef.current(text), []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) { try { rec.stop(); } catch {} }
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (synthRef.current.speaking) return;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    r.onstart = () => setIsListening(true);
    r.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + ' '; else interim += t;
      }
      if (final) setAnswer(p => (p + final).trimStart());
      setInterimText(interim);
    };
    r.onerror = (e) => { if (e.error !== 'aborted') setIsListening(false); };
    r.onend = () => {
      setInterimText('');
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { setIsListening(false); }
      } else { setIsListening(false); }
    };
    recognitionRef.current = r;
    try { r.start(); } catch {}
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening(); else startListening();
  }, [isListening, startListening, stopListening]);

  const startTimer = useCallback(() => {
    setTimeLeft(QUESTION_TIME); setTimerOn(true); setWarned(false);
  }, []);

  const stopTimer = useCallback(() => {
    setTimerOn(false); clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!timerOn) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current); setTimerOn(false); submitRef.current?.(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerOn]);

  useEffect(() => {
    if (timerOn && timeLeft === 15 && !warned) { setWarned(true); speak(phrases.warn()); }
  }, [timeLeft, timerOn, warned, speak, phrases]);

  // ── Load questions ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      try {
        await new Promise(resolve => {
          const voices = synthRef.current.getVoices();
          if (voices.length > 0) return resolve();
          window.speechSynthesis.onvoiceschanged = resolve;
          setTimeout(resolve, 1500);
        });

        // ── ADD 2: create meeting so session shows in dashboard ──────────────
        try {
          const mtg = await createMeeting({ title: `AI Practice — ${role}` });
          roomIdRef.current = mtg.data?.meeting?.roomId || null;
          console.log('✅ Meeting created:', roomIdRef.current);
        } catch (e) {
          console.warn('Could not create meeting (non-fatal):', e.message);
        }
        // ────────────────────────────────────────────────────────────────────

        const rolePrompt = `${difficulty} ${interviewType} ${role} ${experience} level`;
        const res = await generateQuestions(rolePrompt, duration);
        const qs  = res.data?.questions;

        if (!qs || !Array.isArray(qs) || qs.length === 0) { setPhase('error'); return; }

        setQuestions(qs);
        setPhase('interview');
        await speak(phrases.intro(role, experience));
        await speak(`Question 1: ${qs[0]}`);
        startTimer();

      } catch (err) {
        console.error('Load questions error:', err);
        setPhase('error');
      }
    };

    load();

    return () => {
      synthRef.current.cancel();
      clearInterval(timerRef.current);
      stopListening();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit answer ─────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async (auto = false) => {
    stopTimer();
    stopListening();

    const ans = answer.trim();
    const q   = questions[qIndex];
    const wc  = wordCount(ans);
    const fc  = countFillers(ans);

    setLoading(true);

    let result = { analysis:'', score:0, strengths:[], improvements:[], modelAnswer:'' };

    try {
      if (ans) {
        const r = await analyzeAnswer(q, ans, role);
        const d = r.data || r;
        result = {
          analysis:     d.analysis     || '',
          score:        typeof d.score === 'number' ? d.score : 0,
          strengths:    Array.isArray(d.strengths)    ? d.strengths    : [],
          improvements: Array.isArray(d.improvements) ? d.improvements : [],
          modelAnswer:  d.modelAnswer || d.model_answer || d.sampleAnswer || d.sample_answer || '',
        };
        console.log('✅ Score:', result.score, '| modelAnswer length:', result.modelAnswer.length);
      }
    } catch (e) { console.error('analyzeAnswer error:', e); }

    const newRec = {
      question: q, answer: ans || '(no answer)',
      score: result.score, analysis: result.analysis,
      strengths: result.strengths, improvements: result.improvements,
      modelAnswer: result.modelAnswer,
      wordCount: wc, fillerCount: fc,
      skipped: !ans, autoSubmit: auto,
      timeUsed: QUESTION_TIME - timeLeft,
    };

    setRecords(p => [...p, newRec]);
    setLoading(false);

    const next = qIndex + 1;

    if (next >= questions.length) {
      stopTimer();
      setPhase('done');
      setTimeout(() => setFaceAnalysisOn(false), 800);
      await speak(phrases.done());

      // ── ADD 3: end meeting + save report ────────────────────────────────────
      const newRecords = [...records, newRec]; // get latest records (state not yet updated)
      const newScores  = newRecords.map(r => r.score);
      const avg = newScores.length
        ? Math.round(newScores.reduce((a,b)=>a+b,0)/newScores.length)
        : 0;

      if (roomIdRef.current) {
        try { await endMeeting(roomIdRef.current); console.log('✅ Meeting ended'); } catch (e) { console.warn('endMeeting:', e.message); }
      }

      try {
        await saveReport({
          role,
          avgScore:          avg,
          totalQuestions:    questions.length,
          answeredQuestions: newRecords.filter(r => !r.skipped).length,
          strongAnswers:     newRecords.filter(r => r.score >= 70).length,
          records:           newRecords.map(r => ({
            question:     r.question     || '',
            answer:       r.answer       || '',
            analysis:     r.analysis     || '',
            score:        r.score        || 0,
            strengths:    r.strengths    || [],
            improvements: r.improvements || [],
            modelAnswer:  r.modelAnswer  || '',
            wordCount:    r.wordCount    || 0,
            fillerCount:  r.fillerCount  || 0,
            skipped:      r.skipped      || false,
          })),
        });
        console.log('✅ Report saved, avg score:', avg);
      } catch (saveErr) { console.error('Could not save report:', saveErr.message); }
      // ────────────────────────────────────────────────────────────────────────

      setShowReport(true);
    } else {
      setQIndex(next);
      setAnswer('');
      setInterimText('');
      await new Promise(r => setTimeout(r, 600));
      await speak(`Question ${next + 1}: ${questions[next]}`);
      startTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, questions, qIndex, role, timeLeft, records, speak, stopTimer, stopListening, startTimer, phrases]);

  useEffect(() => { submitRef.current = () => submitAnswer(true); }, [submitAnswer]);

  // ── Skip question ─────────────────────────────────────────────────────────
  const skipQuestion = useCallback(async () => {
    stopTimer();
    stopListening();

    const q = questions[qIndex];
    let modelAnswer = '';
    try {
      const r = await analyzeAnswer(q, 'The candidate skipped this question. Please provide only the ideal model answer.', role);
      const d = r.data || r;
      modelAnswer = d.modelAnswer || d.model_answer || d.sampleAnswer || d.sample_answer || '';
    } catch (e) { console.error('Skip — model answer fetch error:', e); }

    const newRec = {
      question: q, answer: '(skipped)', score: 0, analysis: '',
      strengths: [], improvements: ['Always attempt — even a partial answer scores better than skipping.'],
      modelAnswer, wordCount: 0, fillerCount: 0, skipped: true, autoSubmit: false, timeUsed: QUESTION_TIME,
    };

    setRecords(p => [...p, newRec]);

    const next = qIndex + 1;
    if (next >= questions.length) {
      setPhase('done');
      setTimeout(() => setFaceAnalysisOn(false), 800);
      await speak(phrases.done());

      // ── ADD 4: end meeting + save report on skip-to-end ────────────────────
      const newRecords = [...records, newRec];
      const newScores  = newRecords.map(r => r.score);
      const avg = newScores.length
        ? Math.round(newScores.reduce((a,b)=>a+b,0)/newScores.length)
        : 0;

      if (roomIdRef.current) {
        try { await endMeeting(roomIdRef.current); } catch {}
      }

      try {
        await saveReport({
          role,
          avgScore:          avg,
          totalQuestions:    questions.length,
          answeredQuestions: newRecords.filter(r => !r.skipped).length,
          strongAnswers:     newRecords.filter(r => r.score >= 70).length,
          records:           newRecords.map(r => ({
            question:     r.question     || '',
            answer:       r.answer       || '',
            analysis:     r.analysis     || '',
            score:        r.score        || 0,
            strengths:    r.strengths    || [],
            improvements: r.improvements || [],
            modelAnswer:  r.modelAnswer  || '',
            wordCount:    r.wordCount    || 0,
            fillerCount:  r.fillerCount  || 0,
            skipped:      r.skipped      || false,
          })),
        });
      } catch (e) { console.error('Could not save report (skip):', e.message); }
      // ────────────────────────────────────────────────────────────────────────

      setShowReport(true);
    } else {
      setQIndex(next);
      setAnswer('');
      setInterimText('');
      await new Promise(r => setTimeout(r, 400));
      await speak(`Question ${next + 1}: ${questions[next]}`);
      startTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, qIndex, role, records, speak, stopTimer, stopListening, startTimer, phrases]);

  const toggleCam = () => {
    const t = localStream.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsCamOff(!t.enabled); }
  };
  const toggleMic = () => {
    const t = localStream.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); if (!t.enabled) stopListening(); }
  };

  // ── ADD 5: endMeeting on manual exit ──────────────────────────────────────
  const endCall = () => {
    localStream.current?.getTracks().forEach(t => t.stop());
    synthRef.current.cancel();
    clearInterval(timerRef.current);
    stopListening();
    if (roomIdRef.current) { try { endMeeting(roomIdRef.current); } catch {} }
    navigate('/dashboard');
  };

  const avgScore   = records.length ? Math.round(records.reduce((a,b) => a+b.score, 0) / records.length) : 0;
  const wc         = wordCount(answer);
  const fillers    = countFillers(answer);
  const timerColor = timeLeft>30 ? '#22c55e' : timeLeft>15 ? '#f59e0b' : '#ef4444';
  const timerPct   = (timeLeft / QUESTION_TIME) * 100;
  const quality    = wc<20 ? {label:'Too short',col:'#ef4444'} : wc<40 ? {label:'Build on this',col:'#f59e0b'} : wc<=120 ? {label:'Good length',col:'#22c55e'} : {label:'Keep it concise',col:'#f59e0b'};
  const scoreColor = s => s>=75 ? '#16a34a' : s>=50 ? '#d97706' : '#dc2626';
  const scoreBg    = s => s>=75 ? '#f0fdf4' : s>=50 ? '#fffbeb' : '#fef2f2';
  const scoreBorder= s => s>=75 ? '#bbf7d0' : s>=50 ? '#fde68a' : '#fecaca';
  const scoreLabel = s => s>=75 ? 'Strong'  : s>=50 ? 'Decent'  : 'Needs work';

  return (
    <div className="aria-interview-page">

      <div className="aria-interview-header">
        <div className="aria-header-left">
          <span className="aria-live-dot"/>
          <span className="aria-header-title">ARIA Interview</span>
          <span className="aria-header-meta">{role} · {experience} · {interviewType}</span>
        </div>
        <div className="aria-header-right">
          {phase === 'interview' && <span className="aria-header-q">Q{qIndex+1}/{questions.length}</span>}
          <button className="aria-end-btn" onClick={endCall}>End Session</button>
        </div>
      </div>

      <div className="aria-interview-body">

        <div className="aria-video-col">
          <div className={`aria-avatar-feed ${speaking ? 'aria-speaking' : ''}`}>
            <ARIAAvatar speaking={speaking}/>
          </div>

          <div className="aria-user-feed" style={{position:'relative'}}>
            {isCamOff ? (
              <div className="aria-cam-off"><span>📷</span><span>Camera off</span></div>
            ) : (
              <video ref={localVideoRef} autoPlay muted playsInline className="aria-user-video"
                style={{width:'100%',height:160,objectFit:'cover',display:'block'}}/>
            )}
            {!isCamOff && (
              <FaceAnalyzer
                videoRef={localVideoRef}
                isActive={faceAnalysisOn}
                onReport={r => { if (r) setFaceReport(r); }}
                onMultiFace={() => setMultiFaceCount(p => p+1)}
              />
            )}
            <div className="aria-feed-label">
              <span className="aria-status-dot green"/>
              You
              {isListening && (
                <span style={{marginLeft:5,fontSize:9,color:'#ef4444',background:'rgba(239,68,68,0.1)',padding:'1px 5px',borderRadius:7}}>🔴 mic</span>
              )}
            </div>
          </div>

          <div className="aria-controls">
            <button onClick={toggleMic} className={`aria-ctrl-btn ${isMuted?'danger':''}`}>{isMuted?'🔇':'🎤'}</button>
            <button onClick={toggleCam} className={`aria-ctrl-btn ${isCamOff?'danger':''}`}>{isCamOff?'📷':'📹'}</button>
            <button onClick={endCall}   className="aria-ctrl-btn danger">📞</button>
          </div>
        </div>

        <div className="aria-qa-col">

          {phase === 'loading' && (
            <div className="aria-loading">
              <div className="aria-spinner"/>
              <p>ARIA is preparing your interview...</p>
              <p style={{fontSize:12,color:'#64748b',marginTop:4}}>Generating {duration} tailored questions for {role}</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="aria-loading">
              <p style={{color:'#ef4444',marginBottom:12}}>Failed to load questions. Please check your connection.</p>
              <button className="aria-btn-primary" onClick={() => navigate('/aria-setup')}>← Back to Setup</button>
            </div>
          )}

          {phase === 'interview' && !showReport && (
            <>
              <div style={{marginBottom:18}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontSize:12,color:'#64748b',fontWeight:500}}>Time remaining</span>
                  <span style={{fontSize:24,fontWeight:900,color:timerColor,fontVariantNumeric:'tabular-nums',letterSpacing:1,transition:'color 0.5s',animation:timeLeft<=15?'av-pulse 0.7s infinite':'none'}}>
                    {String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}
                  </span>
                </div>
                <div style={{width:'100%',height:7,background:'rgba(255,255,255,0.07)',borderRadius:8,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${timerPct}%`,borderRadius:8,background:`linear-gradient(90deg,${timerColor}cc,${timerColor})`,boxShadow:`0 0 8px ${timerColor}66`,transition:'width 1s linear,background 0.5s',minWidth:timerPct>0?4:0}}/>
                </div>
              </div>

              <div className="aria-question-box">
                <div className="aria-q-header">
                  <span className="aria-q-badge">Q{qIndex+1}</span>
                  <button onClick={() => speak(`Question ${qIndex+1}: ${questions[qIndex]}`)} disabled={speaking} className="aria-replay-btn">🔊 Replay</button>
                </div>
                <p className="aria-q-text">{questions[qIndex]}</p>
              </div>

              <label className="aria-ans-label">
                Your Answer
                {speechSupported && <span style={{fontSize:11,color:'#64748b',fontWeight:400,marginLeft:8}}>— type or speak</span>}
              </label>

              <div style={{position:'relative'}}>
                <textarea className="aria-textarea" rows={6}
                  placeholder={isListening ? '🔴 Listening — speak your answer...' : 'Type your answer or press 🎤 to speak...'}
                  value={answer + (interimText ? ' ' + interimText : '')}
                  onChange={e => { stopListening(); setAnswer(e.target.value); }}
                  disabled={loading || speaking}
                  style={{border: isListening ? '2px solid #ef4444' : undefined, paddingRight:52}}
                />
                {speechSupported && (
                  <button onClick={toggleListening} disabled={speaking || loading}
                    style={{position:'absolute',bottom:10,right:10,width:38,height:38,borderRadius:'50%',border:'none',cursor:speaking||loading?'not-allowed':'pointer',background:isListening?'linear-gradient(135deg,#ef4444,#b91c1c)':'linear-gradient(135deg,#667eea,#764ba2)',color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isListening?'0 0 0 4px rgba(239,68,68,0.2)':'0 2px 8px rgba(102,126,234,0.3)',opacity:speaking||loading?0.4:1,transition:'all 0.2s'}}>
                    {isListening ? '⏹' : '🎤'}
                  </button>
                )}
              </div>

              {interimText && (
                <div style={{background:'#1e293b',border:'1px solid #ef4444',borderRadius:8,padding:'6px 10px',marginTop:4,fontSize:12,color:'#fca5a5',fontStyle:'italic',display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'#ef4444',flexShrink:0}}/>{interimText}
                </div>
              )}

              <div className="aria-indicators" style={{marginTop:8}}>
                <span className="aria-indicator" style={{background:`${quality.col}12`,color:quality.col,border:`1px solid ${quality.col}28`}}>{wc} words · {quality.label}</span>
                {fillers > 0 && <span className="aria-indicator" style={{background:'rgba(245,158,11,0.08)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.2)'}}>⚠️ {fillers} filler{fillers>1?'s':''}</span>}
                {isListening && <span className="aria-indicator" style={{background:'rgba(239,68,68,0.08)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)'}}>🔴 Recording</span>}
              </div>

              <div className="aria-action-row">
                <button className="aria-btn-primary" onClick={() => submitAnswer(false)} disabled={loading || (!answer.trim() && !interimText) || speaking}>
                  {loading ? '⏳ Analyzing...' : '✅ Submit Answer'}
                </button>
                <button className="aria-btn-ghost" onClick={skipQuestion} disabled={loading || speaking}>Skip (0 pts)</button>
              </div>
            </>
          )}

          {showReport && (
            <div style={{fontFamily:'Inter,sans-serif',color:'#1e293b'}}>

              {/* Saved confirmation */}
              <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'9px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#166534',fontWeight:600}}>
                ✅ Session & report saved — view in Dashboard → Performance Reports
              </div>

              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
                <button onClick={() => window.print()} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 18px',borderRadius:10,background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',border:'none',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  📄 Download PDF
                </button>
              </div>

              <div style={{background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',borderRadius:18,padding:'26px 22px',marginBottom:18,color:'white',textAlign:'center',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',inset:0,opacity:0.07,backgroundImage:'radial-gradient(circle at 25% 75%,white 1px,transparent 1px)',backgroundSize:'32px 32px'}}/>
                <div style={{position:'relative',zIndex:1}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:3,textTransform:'uppercase',opacity:0.75,marginBottom:4}}>Interview Performance Report</div>
                  <h1 style={{fontSize:21,fontWeight:900,margin:'0 0 2px'}}>{role} Interview</h1>
                  <p style={{fontSize:11,opacity:0.7,margin:'0 0 16px'}}>{experience} · {interviewType} · {difficulty}</p>
                  <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',justifyContent:'center',width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.14)',border:'4px solid rgba(255,255,255,0.4)',marginBottom:8}}>
                    <div style={{fontSize:32,fontWeight:900,lineHeight:1}}>{avgScore}</div>
                    <div style={{fontSize:9,opacity:0.75}}>/ 100</div>
                  </div>
                  <div style={{fontSize:14,fontWeight:700}}>{avgScore>=85?'🌟 Excellent':avgScore>=70?'✨ Good':avgScore>=50?'📈 Keep Practising':'💪 Needs Work'}</div>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
                {[
                  {n:questions.length,                                   l:'Questions', icon:'📋', c:'#667eea'},
                  {n:records.filter(r=>!r.skipped).length,               l:'Answered',  icon:'✍️', c:'#10b981'},
                  {n:records.filter(r=>r.score>=70).length,              l:'Strong',    icon:'💪', c:'#f59e0b'},
                  {n:records.filter(r=>r.skipped||r.autoSubmit).length,  l:'Missed',    icon:'⏭', c:'#ef4444'},
                ].map(s => (
                  <div key={s.l} style={{background:'#fff',border:`2px solid ${s.c}18`,borderTop:`3px solid ${s.c}`,borderRadius:12,padding:'11px 8px',textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                    <div style={{fontSize:17,marginBottom:3}}>{s.icon}</div>
                    <div style={{fontSize:21,fontWeight:900,color:s.c}}>{s.n}</div>
                    <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>

              <AnswerQualityBreakdown records={records}/>

              {faceReport && (
                <div style={{background:'#faf5ff',border:'1px solid #e9d5ff',borderRadius:14,padding:'16px 18px',marginBottom:18}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#7c3aed,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🎭</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:800,color:'#7c3aed'}}>Behavioural Analysis</div>
                      <div style={{fontSize:10,color:'#94a3b8'}}>Eye contact · Confidence · Emotions</div>
                    </div>
                  </div>
                  {multiFaceCount > 3 && (
                    <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,padding:'9px 12px',marginBottom:12,display:'flex',alignItems:'center',gap:9}}>
                      <span style={{fontSize:16}}>🚨</span>
                      <div><div style={{fontSize:12,fontWeight:700,color:'#dc2626'}}>Integrity Alert</div><div style={{fontSize:11,color:'#ef4444'}}>Multiple faces detected {multiFaceCount} times.</div></div>
                    </div>
                  )}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                    {[
                      {label:'Eye Contact', value:faceReport.eyeContactPct,  icon:'👁️', good:'Consistent with camera.', bad:'Look at the camera lens more.'},
                      {label:'Confidence',  value:faceReport.confidenceScore, icon:'💪', good:'Appeared calm.',          bad:'Sit upright, breathe steadily.'},
                    ].map(m => {
                      const col = m.value>=70?'#16a34a':m.value>=40?'#d97706':'#dc2626';
                      const bg  = m.value>=70?'#f0fdf4':m.value>=40?'#fffbeb':'#fef2f2';
                      return (
                        <div key={m.label} style={{background:bg,border:`1px solid ${col}28`,borderRadius:11,padding:'11px 10px',textAlign:'center'}}>
                          <div style={{fontSize:17,marginBottom:3}}>{m.icon}</div>
                          <div style={{fontSize:21,fontWeight:900,color:col,marginBottom:3}}>{m.value}%</div>
                          <div style={{fontSize:10,color:'#64748b',fontWeight:600,marginBottom:5}}>{m.label}</div>
                          <div style={{height:4,background:'rgba(0,0,0,0.06)',borderRadius:4,overflow:'hidden',marginBottom:5}}>
                            <div style={{height:'100%',width:`${m.value}%`,background:col,borderRadius:4}}/>
                          </div>
                          <div style={{fontSize:9,color:col,lineHeight:1.4}}>{m.value>=60?m.good:m.bad}</div>
                        </div>
                      );
                    })}
                  </div>
                  {faceReport.expressionBreakdown?.length > 0 && (
                    <div style={{background:'#fff',borderRadius:10,padding:'12px'}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#374151',marginBottom:8}}>Emotion Profile</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {faceReport.expressionBreakdown.filter(e => e.pct > 2).map(e => {
                          const colors={happy:'#16a34a',neutral:'#3b82f6',fearful:'#f59e0b',sad:'#6366f1',angry:'#ef4444',surprised:'#0891b2',disgusted:'#7c3aed'};
                          const icons= {happy:'😊',neutral:'😐',fearful:'😨',sad:'😢',angry:'😠',surprised:'😲',disgusted:'😒'};
                          const col=colors[e.expression]||'#667eea';
                          return (
                            <div key={e.expression} style={{flex:1,minWidth:56,background:'#f8fafc',borderRadius:9,padding:'7px 5px',textAlign:'center',border:`1px solid ${col}22`}}>
                              <div style={{fontSize:17,marginBottom:2}}>{icons[e.expression]||'😐'}</div>
                              <div style={{fontSize:13,fontWeight:800,color:col}}>{e.pct}%</div>
                              <div style={{fontSize:9,color:'#94a3b8',marginTop:1}}>{EXPRESSION_LABELS[e.expression]||e.expression}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{fontSize:15,fontWeight:800,color:'#0f172a',marginBottom:12}}>📝 Question Breakdown</div>

              {records.map((r, i) => (
                <div key={i} style={{background:'#fff',border:`1px solid ${scoreBorder(r.score)}`,borderRadius:14,marginBottom:16,overflow:'hidden',boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                  <div style={{background:scoreBg(r.score),padding:'12px 16px',borderBottom:`1px solid ${scoreBorder(r.score)}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1,paddingRight:12}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,flexWrap:'wrap'}}>
                        <span style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:1,color:scoreColor(r.score),background:`${scoreColor(r.score)}14`,padding:'2px 8px',borderRadius:12,border:`1px solid ${scoreBorder(r.score)}`}}>
                          Q{i+1}{r.skipped?' · Skipped':r.autoSubmit?' · Time ran out':''}
                        </span>
                        <span style={{fontSize:11,color:scoreColor(r.score),fontWeight:600}}>{scoreLabel(r.score)}</span>
                      </div>
                      <p style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:0,lineHeight:1.5}}>{r.question}</p>
                    </div>
                    <ScoreRing score={r.score} size={54}/>
                  </div>
                  <div style={{padding:'13px 15px'}}>
                    {!r.skipped && (
                      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:9}}>
                        <span style={{fontSize:11,padding:'2px 8px',borderRadius:12,background:'#f1f5f9',color:'#475569',border:'1px solid #e2e8f0'}}>📝 {r.wordCount} words</span>
                        {r.fillerCount > 0 && <span style={{fontSize:11,padding:'2px 8px',borderRadius:12,background:'#fffbeb',color:'#d97706',border:'1px solid #fde68a'}}>⚠️ {r.fillerCount} filler{r.fillerCount>1?'s':''}</span>}
                      </div>
                    )}
                    <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:'9px 12px',marginBottom:9}}>
                      <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>Your Answer</div>
                      <div style={{fontSize:13,color:'#374151',lineHeight:1.7,fontStyle:r.skipped?'italic':'normal'}}>{r.answer}</div>
                    </div>
                    {r.strengths?.length > 0 && (
                      <div style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0',borderLeft:'4px solid #16a34a',borderRadius:'0 10px 10px 0',padding:'10px 12px',marginBottom:8}}>
                        <div style={{fontSize:10,fontWeight:800,color:'#16a34a',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>✅ What You Did Well</div>
                        {r.strengths.map((s, j) => (
                          <div key={j} style={{display:'flex',gap:7,marginBottom:j<r.strengths.length-1?4:0,fontSize:13,color:'#166534',lineHeight:1.6}}>
                            <span style={{color:'#16a34a',flexShrink:0,fontWeight:700}}>✓</span><span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.improvements?.length > 0 && r.score < 70 && (
                      <div style={{background:'linear-gradient(135deg,#fffbeb,#fef9c3)',border:'1px solid #fde68a',borderLeft:'4px solid #d97706',borderRadius:'0 10px 10px 0',padding:'10px 12px',marginBottom:8}}>
                        <div style={{fontSize:10,fontWeight:800,color:'#d97706',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>💡 Key Gaps</div>
                        {r.improvements.slice(0,2).map((s, j) => (
                          <div key={j} style={{display:'flex',gap:7,marginBottom:j<1?4:0,fontSize:13,color:'#92400e',lineHeight:1.6}}>
                            <span style={{color:'#d97706',flexShrink:0}}>→</span><span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',border:'1px solid #c4b5fd',borderLeft:'4px solid #7c3aed',borderRadius:'0 12px 12px 0',padding:'12px 14px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                        <span style={{background:'linear-gradient(135deg,#7c3aed,#a78bfa)',color:'white',borderRadius:6,padding:'2px 9px',fontSize:9,fontWeight:800,letterSpacing:1,flexShrink:0}}>{r.skipped?'IDEAL ANSWER':'SAMPLE ANSWER'}</span>
                        <span style={{fontSize:11,color:'#7c3aed',fontWeight:600}}>🎯 How a strong candidate would answer</span>
                      </div>
                      <div style={{fontSize:13,color:'#3b0764',lineHeight:1.85,background:'white',borderRadius:8,padding:'10px 12px',border:'1px solid #ddd6fe',minHeight:48}}>
                        {r.modelAnswer ? r.modelAnswer : <span style={{color:'#94a3b8',fontStyle:'italic',fontSize:12}}>Sample answer unavailable.</span>}
                      </div>
                      {r.modelAnswer && <div style={{marginTop:7,fontSize:10,color:'#7c3aed',opacity:0.85}}>{r.skipped?'💡 You skipped this — read and practise before next session.':'💡 Study this — notice the depth, structure, and specific examples.'}</div>}
                    </div>
                  </div>
                </div>
              ))}

              <div style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0',borderRadius:14,padding:'15px 18px',marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:800,color:'#166534',marginBottom:9}}>🚀 Your Action Plan</div>
                {[
                  'Read every ideal answer — notice the Situation → Action → measurable Result pattern.',
                  avgScore < 50  && 'Scores are low — focus on giving specific real examples from your experience.',
                  records.some(r => r.fillerCount > 3) && 'Cut filler words — pause instead of saying "um" or "like".',
                  records.some(r => r.wordCount > 0 && r.wordCount < 40 && !r.skipped) && 'Some answers were too brief — aim for 80–120 words.',
                  records.some(r => r.skipped) && 'You skipped some questions — always attempt, even partial answers score points.',
                  'Include at least one specific number or metric per answer.',
                  avgScore < 70  && 'Retake in 2–3 days after reviewing all ideal answers above.',
                ].filter(Boolean).map((tip, i) => (
                  <div key={i} style={{display:'flex',gap:9,marginBottom:6,fontSize:12,color:'#166534',lineHeight:1.6}}>
                    <span style={{flexShrink:0,fontWeight:700}}>✓</span><span>{tip}</span>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:10}}>
                <button className="aria-btn-primary" onClick={() => navigate('/aria-setup')} style={{flex:1,padding:12,fontSize:14}}>🔄 Practice Again</button>
                <button className="aria-btn-ghost"   onClick={() => navigate('/dashboard')}  style={{padding:'12px 20px',fontSize:14}}>Dashboard</button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
