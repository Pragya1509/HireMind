import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export default function FaceAnalyzer({ videoRef, isActive, onReport, onMultiFace }) {
  const canvasRef      = useRef(null);
  const intervalRef    = useRef(null);
  const historyRef     = useRef([]);
  const loadedRef      = useRef(false);
  const analyzeRef     = useRef(null);
  const noFaceRef      = useRef(0);
  const multiFaceRef   = useRef(0); // consecutive multi-face frames

  const [status, setStatus]           = useState('loading');
  const [faceCount, setFaceCount]     = useState(0);  // LIVE count, updates every frame
  const [noFace, setNoFace]           = useState(false);

  // Load models
  useEffect(() => {
    const load = async () => {
      if (loadedRef.current) { setStatus('ready'); return; }
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
        ]);
        loadedRef.current = true;
        setStatus('ready');
      } catch (e) {
        console.error('❌ Face model error:', e);
        setStatus('error');
      }
    };
    load();
    return () => clearInterval(intervalRef.current);
  }, []);

  const buildReport = (history) => {
    const total = history.length;
    if (total === 0) return null;

    const eyeValues  = history.map(h => h.eyeScore);
    const confValues = history.map(h => h.confScore);
    const eyePct     = Math.round(eyeValues.reduce((a,b)=>a+b,0) / total);
    const confScore  = Math.round(confValues.reduce((a,b)=>a+b,0) / total);
    const attnScore  = Math.round((eyePct * 0.55) + (confScore * 0.45));

    const multiFaceCount = history.filter(h => h.faceCount > 1).length;
    const noFaceCount    = history.filter(h => h.faceCount === 0).length;

    const freq = {};
    history.forEach(h => { if (h.expression) freq[h.expression] = (freq[h.expression]||0) + 1; });
    const expressionBreakdown = Object.entries(freq)
      .map(([k,v]) => ({ expression:k, pct:Math.round((v/total)*100) }))
      .sort((a,b) => b.pct - a.pct);

    // Per-question breakdown of attention if timestamps exist
    return {
      totalFrames:         total,
      eyeContactPct:       Math.min(100, Math.max(0, eyePct)),
      confidenceScore:     Math.min(100, Math.max(0, confScore)),
      attentionScore:      Math.min(100, Math.max(0, attnScore)),
      multiFacePct:        Math.round((multiFaceCount / total) * 100),
      noFacePct:           Math.round((noFaceCount    / total) * 100),
      expressionBreakdown,
      dominantExpression:  expressionBreakdown[0]?.expression || 'neutral',
    };
  };

  const analyze = useCallback(async () => {
    const video  = videoRef?.current;
    const canvas = canvasRef?.current;
    if (!video || !canvas) return;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    const ctx = canvas.getContext('2d');
    const displaySize = {
      width:  video.clientWidth  || video.videoWidth  || 320,
      height: video.clientHeight || video.videoHeight || 240,
    };
    canvas.width  = displaySize.width;
    canvas.height = displaySize.height;

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224, scoreThreshold: 0.38,
      });

      // Detect ALL faces every frame
      const allFaces = await faceapi.detectAllFaces(video, options);
      const count    = allFaces.length;

      // ── ALWAYS update faceCount state — this makes warnings dynamic ──
      setFaceCount(count);

      if (count > 1) {
        noFaceRef.current  = 0;
        setNoFace(false);
        onMultiFace?.();

        // Draw red boxes around extra faces
        faceapi.matchDimensions(canvas, displaySize);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const resizedAll = faceapi.resizeResults(allFaces, displaySize);
        resizedAll.forEach((det, i) => {
          ctx.strokeStyle = i === 0 ? 'rgba(99,102,241,0.4)' : '#ef4444';
          ctx.lineWidth   = i === 0 ? 1.5 : 2.5;
          ctx.strokeRect(det.box.x, det.box.y, det.box.width, det.box.height);
        });
        setStatus('detecting');
      } else if (count === 0) {
        // No face — clear canvas immediately
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        noFaceRef.current += 1;
        if (noFaceRef.current >= 5) setNoFace(true);
        setStatus('ready');
        // Still record this frame
        historyRef.current.push({
          time: Date.now(), expression: null,
          eyeScore: 0, confScore: 0, faceCount: 0,
        });
        return;
      } else {
        // Exactly 1 face — clear and draw subtle box
        noFaceRef.current = 0;
        setNoFace(false);
        setStatus('detecting');
      }

      // Full analysis on primary face
      const result = await faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks(true)
        .withFaceExpressions();

      if (!result) return;

      faceapi.matchDimensions(canvas, displaySize);
      const resized = faceapi.resizeResults(result, displaySize);

      // Single face: just draw thin box, NO landmarks
      if (count === 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const box = resized.detection.box;
        ctx.strokeStyle = 'rgba(99,102,241,0.3)';
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      }

      // Eye contact score (0–100, smooth)
      const lms = result.landmarks.positions;
      const lec = {
        x: lms.slice(36,42).reduce((s,p)=>s+p.x,0)/6,
        y: lms.slice(36,42).reduce((s,p)=>s+p.y,0)/6,
      };
      const rec = {
        x: lms.slice(42,48).reduce((s,p)=>s+p.x,0)/6,
        y: lms.slice(42,48).reduce((s,p)=>s+p.y,0)/6,
      };
      const nose    = lms[30], chin  = lms[8];
      const eyeMidX = (lec.x + rec.x) / 2;
      const eyeMidY = (lec.y + rec.y) / 2;
      const eyeW    = Math.abs(rec.x - lec.x);
      const faceH   = Math.abs(chin.y - eyeMidY);
      const noseH   = Math.abs(nose.y - eyeMidY);

      const horizOffset = Math.abs(nose.x - eyeMidX) / (eyeW + 1);
      const vertRatio   = noseH / (faceH + 1);

      const horizScore = Math.max(0, 100 - (horizOffset / 0.25) * 100);
      const vertScore  = vertRatio >= 0.28 && vertRatio <= 0.58
        ? 100
        : vertRatio < 0.28
          ? Math.max(0, (vertRatio / 0.28) * 100)
          : Math.max(0, ((0.72 - vertRatio) / 0.14) * 100);
      const eyeScore = Math.round((horizScore * 0.6) + (vertScore * 0.4));

      // Confidence score (0–100, smooth)
      const exp      = result.expressions;
      const positive = (exp.neutral||0) + (exp.happy||0);
      const negative = (exp.fearful||0) + (exp.sad||0) + (exp.angry||0)*1.5;
      const confScore = Math.round(Math.min(100, Math.max(0,
        (positive * 100) - (negative * 60)
      )));

      const sorted = Object.entries(exp).sort((a,b)=>b[1]-a[1]);
      const top    = sorted[0];

      historyRef.current.push({
        time:       Date.now(),
        expression: top[0],
        eyeScore,
        confScore,
        faceCount:  count,
      });

    } catch {
      setStatus('ready');
    }
  }, [videoRef, onMultiFace]);

  useEffect(() => { analyzeRef.current = analyze; }, [analyze]);

  useEffect(() => {
    clearInterval(intervalRef.current);

    if (status === 'ready' && isActive) {
      const t = setTimeout(() => {
        intervalRef.current = setInterval(() => analyzeRef.current?.(), 1000);
      }, 800);
      return () => { clearTimeout(t); clearInterval(intervalRef.current); };
    }

    if (!isActive && historyRef.current.length > 0) {
      const report = buildReport(historyRef.current);
      if (report) onReport?.(report);
      historyRef.current = [];
    }

    return () => clearInterval(intervalRef.current);
  }, [status, isActive]);

  return (
    <>
      {/* Canvas — thin box only */}
      <canvas ref={canvasRef} style={{
        position:'absolute', top:0, left:0,
        width:'100%', height:'100%',
        pointerEvents:'none', zIndex:5,
      }}/>

      {/* ── DYNAMIC multi-face warning — shows/hides based on LIVE faceCount ── */}
      {isActive && faceCount > 1 && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, zIndex:20,
          background:'rgba(220,38,38,0.95)',
          padding:'8px 10px',
          display:'flex', alignItems:'center', gap:8,
          animation:'fadeIn 0.2s ease',
        }}>
          <span style={{fontSize:15,flexShrink:0}}>⚠️</span>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:'white',lineHeight:1.3}}>
              {faceCount} PEOPLE DETECTED
            </div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.88)'}}>
              Only you should be visible during the interview
            </div>
          </div>
        </div>
      )}

      {/* ── DYNAMIC no-face warning — shows/hides based on LIVE state ── */}
      {isActive && noFace && faceCount === 0 && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, zIndex:20,
          background:'rgba(217,119,6,0.95)',
          padding:'8px 10px',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <span style={{fontSize:15,flexShrink:0}}>👤</span>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:'white',lineHeight:1.3}}>
              FACE NOT DETECTED
            </div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.88)'}}>
              Move closer and look at the camera
            </div>
          </div>
        </div>
      )}

      {/* Tiny status dot */}
      {isActive && (
        <div style={{
          position:'absolute', bottom:8, right:8, zIndex:10,
          width:6, height:6, borderRadius:'50%', opacity:0.7,
          background: status==='detecting'?'#10b981':status==='error'?'#ef4444':'#f59e0b',
        }}/>
      )}
    </>
  );
}