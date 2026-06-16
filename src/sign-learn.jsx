import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
//  CONSTANTS & DATA
// ═══════════════════════════════════════════════════════════

const HINTS = {
  A:"Fist, thumb beside fingers",B:"4 fingers up, thumb tucked",C:"Curved hand like a C",
  D:"Index up, others curl to thumb",E:"All fingers bent, thumb tucked",F:"Index+thumb touch, others up",
  G:"Index points sideways",H:"Index+middle point sideways",I:"Pinky up, fist closed",
  J:"Pinky up, trace J in air",K:"Index up, middle angled, thumb between",L:"L shape — index up, thumb out",
  M:"3 fingers folded over thumb",N:"2 fingers folded over thumb",O:"Fingers+thumb form an O",
  P:"Like K pointing down",Q:"Like G pointing down",R:"Index+middle crossed",
  S:"Fist, thumb over fingers",T:"Thumb between index+middle",U:"Index+middle together up",
  V:"Index+middle up, spread apart",W:"Index, middle+ring up, spread",X:"Index finger hooked",
  Y:"Thumb+pinky out",Z:"Index traces a Z in air",
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MOTION_LETTERS = new Set(["J", "Z"]);

const CATEGORIES = [
  { id:"all",      label:"Full Alphabet", letters: ALPHABET,                             icon:"🔤" },
  { id:"a-g",      label:"A – G",         letters: ALPHABET.slice(0,7),                  icon:"🌱" },
  { id:"h-n",      label:"H – N",         letters: ALPHABET.slice(7,14),                 icon:"🌿" },
  { id:"o-z",      label:"O – Z",         letters: ALPHABET.slice(14),                   icon:"🌳" },
  { id:"vowels",   label:"Vowels",         letters: ["A","E","I","O","U"],                icon:"🔵" },
  { id:"numbers",  label:"Numbers 1–5",    letters: ["ONE","TWO","THREE","FOUR","FIVE"],  icon:"🔢" },
];

// ═══════════════════════════════════════════════════════════
//  SVG HAND DIAGRAM COMPONENT
// ═══════════════════════════════════════════════════════════

function HandDiagram({ letter, size = 160 }) {
  const W = size, H = size * 1.2;
  const s = size / 120;
  const acc = "#7c6af7", teal = "#3ecfb8", bg = "#161624";

  // Finger props: [x, yBase]
  const FP = [[33,74],[41,70],[50,72],[58,76]].map(([x,y]) => [x*s, y*s]);
  const palmCX = 50*s, palmCY = 80*s;

  function finger(i, ext, bent=0) {
    const [fx, fy] = FP[i];
    const maxLen = 38*s;
    const curl = 1 - ext;
    if (curl > 0.9) return <rect key={i} x={fx-4*s} y={fy-10*s} width={8*s} height={10*s} rx={3*s} fill={acc}/>;
    if (curl < 0.05) return <rect key={i} x={fx-4*s} y={fy-maxLen} width={8*s} height={maxLen} rx={4*s} fill={acc}/>;
    const s1 = maxLen * 0.55;
    const angle = curl * 100;
    return (
      <g key={i}>
        <rect x={fx-4*s} y={fy-s1} width={8*s} height={s1} rx={4*s} fill={acc}/>
        <rect x={fx-4*s} y={fy-s1-(maxLen-s1)} width={8*s} height={maxLen-s1} rx={3*s} fill={acc}
          transform={`rotate(${angle} ${fx} ${fy-s1})`}/>
      </g>
    );
  }

  function thumb(extended) {
    if (!extended) return <rect x={22*s} y={66*s} width={11*s} height={16*s} rx={5*s} fill={teal}/>;
    return (
      <g>
        <rect x={4*s} y={74*s} width={26*s} height={11*s} rx={5.5*s} fill={teal}/>
        <circle cx={4*s} cy={80*s} r={5.5*s} fill={teal}/>
      </g>
    );
  }

  const palm = (
    <g>
      <ellipse cx={palmCX} cy={palmCY} rx={26*s} ry={18*s} fill={bg} stroke={acc} strokeWidth={1.5}/>
      <rect x={36*s} y={86*s} width={28*s} height={22*s} rx={8*s} fill={bg} stroke={acc} strokeWidth={1.5}/>
      {[33,41,50,58].map(x => <circle key={x} cx={x*s} cy={76*s} r={2.5*s} fill="#252535"/>)}
    </g>
  );

  // Define poses
  const poses = {
    A: { f:[0,0,0,0], th:false },  B: { f:[1,1,1,1], th:false },
    C: { f:[.5,.5,.5,.5], th:true },  D: { f:[1,0,0,0], th:false, dToThumb:true },
    E: { f:[.2,.2,.2,.2], th:false },  F: { f:[0,1,1,1], th:false },
    G: { f:[1,0,0,0], th:false, sideways:true },  H: { f:[1,1,0,0], th:false, sideways:true },
    I: { f:[0,0,0,1], th:false },  J: { f:[0,0,0,1], th:false },
    K: { f:[1,1,0,0], th:true },  L: { f:[1,0,0,0], th:true },
    M: { f:[.3,.3,.3,0], th:false },  N: { f:[.3,.3,0,0], th:false },
    O: { f:[.4,.4,.4,.4], th:false, oShape:true },
    P: { f:[1,1,0,0], th:false },  Q: { f:[1,0,0,0], th:false },
    R: { f:[1,1,0,0], th:false, crossed:true },  S: { f:[0,0,0,0], th:false, thumbOver:true },
    T: { f:[0,0,0,0], th:false },  U: { f:[1,1,0,0], th:false },
    V: { f:[1,1,0,0], th:false, spread:true },  W: { f:[1,1,1,0], th:false },
    X: { f:[.4,0,0,0], th:false },  Y: { f:[0,0,0,1], th:true },
    Z: { f:[1,0,0,0], th:false },
  };

  const pose = poses[letter] || { f:[1,1,1,1], th:true };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{display:"block"}}>
      <rect width={W} height={H} rx={10} fill={bg}/>
      {palm}
      {pose.f.map((ext,i) => finger(i, ext))}
      {thumb(pose.th)}
      {pose.oShape && <ellipse cx={46*s} cy={62*s} rx={14*s} ry={16*s} fill="none" stroke={acc} strokeWidth={8*s}/>} 
      {pose.spread && <line x1={33*s} y1={45*s} x2={26*s} y2={25*s} stroke={acc} strokeWidth={7*s} strokeLinecap="round"/>}
      {pose.crossed && <line x1={37*s} y1={40*s} x2={44*s} y2={40*s} stroke={teal} strokeWidth={3*s} strokeDasharray={`${3*s} ${2*s}`}/>}
      {(letter==="J"||letter==="Z") && (
        <path d={letter==="J"
          ? `M${58*s},${38*s} Q${70*s},${28*s} ${65*s},${54*s}`
          : `M${33*s},${38*s} L${52*s},${38*s} L${33*s},${58*s} L${52*s},${58*s}`}
          fill="none" stroke={teal} strokeWidth={2*s} strokeDasharray={`${3*s} ${2*s}`} strokeLinecap="round"/>
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
//  HAND TRACKING ENGINE
// ═══════════════════════════════════════════════════════════

function useHandTracking({ onResult, enabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const smoothLMRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error | nohand
  const [errorMsg, setErrorMsg] = useState("");

  const smoothLandmarks = useCallback((raw) => {
    const SMOOTH = 0.42;
    if (!smoothLMRef.current) {
      smoothLMRef.current = raw.map(p => ({ x: p.x, y: p.y, z: p.z }));
      return smoothLMRef.current;
    }
    for (let i = 0; i < raw.length; i++) {
      smoothLMRef.current[i].x += (raw[i].x - smoothLMRef.current[i].x) * SMOOTH;
      smoothLMRef.current[i].y += (raw[i].y - smoothLMRef.current[i].y) * SMOOTH;
    }
    return smoothLMRef.current;
  }, []);

  const getFingers = useCallback((lm) => {
    function angBend(mcp, pip, tip) {
      const v1 = { x: lm[pip].x - lm[mcp].x, y: lm[pip].y - lm[mcp].y };
      const v2 = { x: lm[tip].x - lm[pip].x, y: lm[tip].y - lm[pip].y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag = Math.sqrt(v1.x**2+v1.y**2) * Math.sqrt(v2.x**2+v2.y**2);
      return mag < 0.0001 ? 0 : Math.acos(Math.max(-1, Math.min(1, dot/mag))) * 180 / Math.PI;
    }
    function ext(mcp, pip, tip) { return angBend(mcp,pip,tip) < 50 && lm[tip].y < lm[mcp].y - 0.015; }
    const palmDir = lm[5].x < lm[17].x;
    return {
      thumb: palmDir ? lm[4].x < lm[3].x - 0.035 : lm[4].x > lm[3].x + 0.035,
      index: ext(5,6,8), middle: ext(9,10,12), ring: ext(13,14,16), pinky: ext(17,18,20),
      indexCurl: angBend(5,6,8) > 80, middleCurl: angBend(9,10,12) > 80,
      ringCurl: angBend(13,14,16) > 80, pinkyCurl: angBend(17,18,20) > 80,
    };
  }, []);

  const classifyLetter = useCallback((lm) => {
    const f = getFingers(lm);
    const d = (a, b) => Math.sqrt((lm[a].x-lm[b].x)**2 + (lm[a].y-lm[b].y)**2);
    const allCurled = f.indexCurl && f.middleCurl && f.ringCurl && f.pinkyCurl;
    const allExt = f.index && f.middle && f.ring && f.pinky;

    if (allCurled && !f.thumb && d(4,8) > 0.05) return { letter:"A", conf:0.88 };
    if (allCurled && d(4,8) < 0.06) return { letter:"S", conf:0.85 };
    if (allExt && !f.thumb) return { letter:"B", conf:0.88 };
    if (f.index && f.middle && f.ring && f.pinky && f.thumb) return { letter:"B", conf:0.7 }; // flat hand
    if (d(4,8)<0.07 && d(4,12)<0.08 && d(8,12)<0.06) return { letter:"O", conf:0.82 };
    if (!f.index && f.middle && f.ring && f.pinky && d(4,8)<0.055) return { letter:"F", conf:0.80 };
    if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb) return { letter:"L", conf:0.88 };
    if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
      const horiz = Math.abs(lm[8].x-lm[5].x) > Math.abs(lm[8].y-lm[5].y)*1.3;
      if (horiz) return { letter:"G", conf:0.78 };
      return { letter:"D", conf:0.78 };
    }
    if (!f.index && !f.middle && !f.ring && f.pinky && !f.thumb) return { letter:"I", conf:0.88 };
    if (!f.index && !f.middle && !f.ring && f.pinky && f.thumb) return { letter:"Y", conf:0.88 };
    if (f.index && f.middle && !f.ring && !f.pinky) {
      const spread = d(8,12);
      const horiz = Math.abs(lm[8].x-lm[5].x) > Math.abs(lm[8].y-lm[5].y)*1.2;
      if (horiz) return { letter:"H", conf:0.78 };
      if (spread < 0.04) return { letter:"R", conf:0.78 };
      if (f.thumb && d(4,12)<0.12) return { letter:"K", conf:0.75 };
      if (spread > 0.07) return { letter:"V", conf:0.84 };
      return { letter:"U", conf:0.82 };
    }
    if (f.index && f.middle && f.ring && !f.pinky) return { letter:"W", conf:0.84 };
    if (!f.index && !f.middle && !f.ring && !f.pinky && f.thumb && lm[4].y < lm[3].y)
      return { letter:"Y", conf:0.80 };
    if (allCurled && lm[4].y > lm[9].y - 0.02) return { letter:"M", conf:0.72 };
    if (!f.index && f.index===false && f.middle===false && !f.ring && !f.pinky)
      return { letter:"E", conf:0.75 };
    return null;
  }, [getFingers]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    const VOTE_WIN = 8;
    let votes = [];

    async function init() {
      setStatus("loading");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" }, audio: false
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        videoRef.current.srcObject = stream;
        await new Promise(r => { videoRef.current.onloadedmetadata = r; });
        await videoRef.current.play();
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      } catch(e) {
        console.error('getUserMedia error:', e);
        setErrorMsg(e?.message || String(e));
        setStatus("error");
        return;
      }

      const Hands = window.Hands;
      const Camera = window.Camera;
      const drawConnectors = window.drawConnectors;
      const drawLandmarks = window.drawLandmarks;
      const HAND_CONNECTIONS = window.HAND_CONNECTIONS;

      if (!Hands) { setErrorMsg('MediaPipe Hands not available'); setStatus("error"); return; }

      const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
      hands.setOptions({ maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.70, minTrackingConfidence:0.65 });
      handsRef.current = hands;

      const ctx = canvasRef.current.getContext("2d");

      hands.onResults(results => {
        ctx.clearRect(0, 0, 640, 480);
        if (!results.multiHandLandmarks?.length) {
          smoothLMRef.current = null;
          votes = [];
          onResult({ lm: null, detected: null, confidence: 0 });
          return;
        }
        const raw = results.multiHandLandmarks[0];
        const lm = smoothLandmarks(raw);

        // Mirror for drawing
        const mirrored = raw.map(p => ({ ...p, x: 1-p.x }));
        drawConnectors(ctx, mirrored, HAND_CONNECTIONS, { color:"rgba(124,106,247,0.5)", lineWidth:2.5 });
        drawLandmarks(ctx, mirrored, { color:"#3ecfb8", lineWidth:1, radius:4 });
        // Fingertip glows
        [4,8,12,16,20].forEach(i => {
          const x = (1-raw[i].x)*640, y = raw[i].y*480;
          ctx.beginPath(); ctx.arc(x,y,7,0,Math.PI*2);
          ctx.fillStyle = "rgba(62,207,184,0.3)"; ctx.fill();
          ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2);
          ctx.fillStyle = "#3ecfb8"; ctx.fill();
        });

        const raw_pred = classifyLetter(lm);
        votes.push(raw_pred ? 1 : 0);
        if (votes.length > VOTE_WIN) votes.shift();
        const conf = votes.reduce((a,b)=>a+b,0) / votes.length;
        onResult({ lm, detected: raw_pred?.letter || null, confidence: conf });
      });

      await hands.initialize();
      setStatus("ready");

      const camera = new Camera(videoRef.current, {
        onFrame: async () => { await hands.send({ image: videoRef.current }); },
        width: 640, height: 480
      });
      cameraRef.current = camera;
      camera.start();
    }

    init();

    return () => {
      active = false;
      cameraRef.current?.stop();
      handsRef.current?.close();
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
      smoothLMRef.current = null;
    };
  }, [enabled, onResult, smoothLandmarks, classifyLetter]);

  return { videoRef, canvasRef, status, errorMsg };
}

// ═══════════════════════════════════════════════════════════
//  STYLES (inline for portability)
// ═══════════════════════════════════════════════════════════

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#07080f;--surf:#0d0f1a;--surf2:#131625;--border:#1e2235;
    --accent:#7c6af7;--teal:#3ecfb8;--gold:#f5c842;--ok:#3df5a0;--err:#ff4f6e;
    --text:#eeeeff;--muted:#5a5f7a;--soft:#9097b8;
    --ff-h:'Syne',sans-serif;--ff-b:'DM Sans',sans-serif;
  }
  body{background:var(--bg);color:var(--text);font-family:var(--ff-b);font-size:14px;line-height:1.6;overflow-x:hidden;}
  button{cursor:pointer;font-family:var(--ff-b);} 

  /* LAYOUT */
  .app{min-height:100vh;display:flex;flex-direction:column;}
  
  /* SCREENS */
  .screen{min-height:100vh;display:flex;flex-direction:column;}

  /* ── INTRO ── */
  .intro{align-items:center;justify-content:flex-start;padding:3rem 2rem 2rem;gap:1.5rem;background:var(--bg);position:relative;overflow:hidden;}
  .intro-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:44px 44px;opacity:.4;pointer-events:none;}
  .intro-glow{position:absolute;top:20%;left:50%;transform:translateX(-50%);width:600px;height:300px;background:radial-gradient(ellipse,rgba(124,106,247,.12) 0%,transparent 70%);pointer-events:none;}
  .logo{font-family:var(--ff-h);font-size:clamp(2.8rem,7vw,5rem);font-weight:800;letter-spacing:-.04em;line-height:1;text-align:center;position:relative;}
  .logo em{color:var(--accent);font-style:normal;}
  .logo-sub{font-family:var(--ff-h);font-size:.72rem;letter-spacing:.25em;text-transform:uppercase;color:var(--muted);text-align:center;margin-top:.3rem;}
  .intro-desc{font-size:.9rem;color:var(--soft);max-width:380px;text-align:center;line-height:1.7;font-weight:300;}
  .cat-label{font-family:var(--ff-h);font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);} 
  .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:480px;width:100%;}
  .cat-btn{background:var(--surf);border:1.5px solid var(--border);border-radius:10px;padding:.85rem 1rem;
    display:flex;flex-direction:column;align-items:center;gap:5px;transition:all .2s;color:var(--text);} 
  .cat-btn:hover{border-color:var(--accent);background:rgba(124,106,247,.08);transform:translateY(-2px);} 
  .cat-btn.selected{border-color:var(--accent);background:rgba(124,106,247,.14);} 
  .cat-btn-icon{font-size:1.4rem;} 
  .cat-btn-label{font-family:var(--ff-h);font-size:.78rem;font-weight:600;} 
  .cat-btn-count{font-size:.62rem;color:var(--muted);} 
  .start-btn{background:var(--accent);color:#fff;border:none;padding:.9rem 2.8rem;border-radius:8px;
    font-family:var(--ff-h);font-size:.95rem;font-weight:700;letter-spacing:.04em;
    transition:transform .15s,opacity .15s;width:100%;max-width:280px;} 
  .start-btn:hover{transform:translateY(-2px);opacity:.92;} 
  .start-btn:disabled{opacity:.3;transform:none;cursor:not-allowed;} 
  .cam-note{font-size:.68rem;color:var(--muted);text-align:center;max-width:280px;} 

  /* ── TUTORIAL ── */
  .tutorial{align-items:center;justify-content:flex-start;padding:2rem 1.5rem 3rem;gap:1.1rem;overflow-y:auto;} 
  .tut-badge{font-family:var(--ff-h);font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);} 
  .tut-word-row{display:flex;align-items:center;gap:.75rem;} 
  .tut-letter{font-family:var(--ff-h);font-size:clamp(4rem,12vw,6rem);font-weight:800;letter-spacing:-.04em;line-height:1;color:var(--accent);} 
  .tut-illus{background:var(--surf);border:1px solid var(--border);border-radius:14px;overflow:hidden;position:relative;} 
  .tut-motion-badge{position:absolute;top:8px;right:8px;background:rgba(245,200,66,.15);border:1px solid rgba(245,200,66,.3);
    color:var(--gold);font-size:.6rem;padding:.2rem .5rem;border-radius:4px;font-family:var(--ff-h);letter-spacing:.1em;} 
  .tut-hint{font-family:var(--ff-h);font-size:.78rem;font-weight:600;color:var(--soft);text-align:center;max-width:220px;} 
  .tut-steps{display:flex;flex-direction:column;gap:.5rem;width:100%;max-width:420px;} 
  .tut-step{display:flex;gap:.7rem;align-items:flex-start;background:var(--surf);border:1px solid var(--border);border-radius:9px;padding:.65rem .9rem;} 
  .step-n{font-family:var(--ff-h);font-size:.65rem;font-weight:700;color:var(--accent);min-width:18px;padding-top:1px;} 
  .step-t{font-size:.82rem;color:var(--soft);line-height:1.5;} 
  .tut-nav{display:flex;gap:10px;width:100%;max-width:420px;} 
  .tut-nav-btn{flex:1;padding:.65rem;border-radius:8px;font-family:var(--ff-b);font-size:.82rem;font-weight:500;border:1.5px solid var(--border);background:transparent;color:var(--soft);transition:all .2s;} 
  .tut-nav-btn:hover{border-color:var(--soft);color:var(--text);} 
  .tut-nav-btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-family:var(--ff-h);font-weight:700;} 
  .tut-nav-btn.primary:hover{opacity:.88;} 
  .tut-dots{display:flex;gap:6px;} 
  .tut-dot{width:7px;height:7px;border-radius:50%;background:var(--border);transition:background .2s;} 
  .tut-dot.done{background:var(--teal);} 
  .tut-dot.active{background:var(--accent);} 

  /* ── GAME ── */
  .game{flex-direction:row;height:100vh;overflow:hidden;} 
  .cam-side{flex:1;position:relative;background:#000;min-width:0;overflow:hidden;} 
  .cam-side video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;} 
  .cam-side canvas{position:absolute;inset:0;width:100%;height:100%;} 
  .cam-hud-top{position:absolute;top:14px;left:14px;right:14px;display:flex;justify-content:space-between;z-index:4;pointer-events:none;} 
  .live-badge{display:flex;align-items:center;gap:6px;background:rgba(7,8,15,.75);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:.28rem .8rem;font-size:.66rem;color:rgba(255,255,255,.5);backdrop-filter:blur(10px);} 
  .live-dot{width:7px;height:7px;border-radius:50%;background:var(--ok);box-shadow:0 0 6px var(--ok);animation:lp 1.4s ease-in-out infinite;} 
  @keyframes lp{0%,100%{opacity:1}50%{opacity:.3}} 
  .letter-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:3;} 
  .letter-bg{font-family:var(--ff-h);font-size:min(40vw,40vh);font-weight:800;color:rgba(124,106,247,.07);letter-spacing:-.05em;line-height:1;user-select:none;} 
  .det-badge{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);z-index:4;background:rgba(7,8,15,.85);border:1px solid var(--border);border-radius:10px;padding:.4rem 1rem;display:flex;align-items:center;gap:.55rem;backdrop-filter:blur(12px);white-space:nowrap;pointer-events:none;} 
  .det-lbl{font-size:.65rem;color:var(--muted);} 
  .det-val{font-family:var(--ff-h);font-size:1.4rem;font-weight:700;color:var(--teal);min-width:3ch;text-align:center;} 
  .det-conf{font-size:.65rem;color:var(--muted);} 
  .hold-arc{position:absolute;top:14px;right:14px;width:52px;height:52px;z-index:4;pointer-events:none;transition:opacity .2s;} 
  .cam-border-flash{position:absolute;inset:0;z-index:5;pointer-events:none;border:3px solid transparent;transition:border-color .25s,box-shadow .25s;} 
  .cam-border-flash.ok{border-color:var(--ok);box-shadow:inset 0 0 60px rgba(61,245,160,.06);} 
  .cam-border-flash.detecting{border-color:var(--gold);} 
  .load-over{position:absolute;inset:0;background:rgba(7,8,15,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.85rem;z-index:20;backdrop-filter:blur(4px);} 
  .spinner{width:34px;height:34px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .85s linear infinite;} 
  @keyframes spin{to{transform:rotate(360deg)}} 
  .load-txt{font-size:.8rem;color:var(--muted);font-weight:300;text-align:center;max-width:200px;} 
  .err-txt{font-size:.8rem;color:var(--err);text-align:center;max-width:220px;} 

  /* RIGHT PANEL */
  .right-panel{width:280px;background:var(--surf);border-left:1px solid var(--border);display:flex;flex-direction:column;padding:1.1rem;gap:.9rem;overflow-y:auto;flex-shrink:0;height:100vh;} 
  .stats-row{display:flex;gap:7px;} 
  .stat-box{flex:1;background:var(--surf2);border-radius:8px;padding:.6rem .5rem;text-align:center;} 
  .stat-num{font-family:var(--ff-h);font-size:1.2rem;font-weight:700;} 
  .stat-lbl{font-size:.58rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-top:1px;} 
  .target-card{background:var(--surf2);border:1px solid var(--border);border-radius:13px;padding:1.1rem;text-align:center;} 
  .tc-cat{font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:.3rem;} 
  .tc-letter{font-family:var(--ff-h);font-size:2.2rem;font-weight:800;line-height:1;margin-bottom:.15rem;} 
  .tc-letter.pulse{animation:pulse .4s ease;} 
  @keyframes pulse{0%{transform:scale(1)}50%{transform:scale(1.2);color:var(--ok)}100%{transform:scale(1)}} 
  .tc-illus-wrap{width:88px;height:106px;margin:.6rem auto;border-radius:9px;overflow:hidden;cursor:pointer;border:1px solid var(--border);} 
  .tc-hint-link{font-size:.6rem;color:var(--accent);cursor:pointer;margin-top:2px;} 
  .tc-hint{font-size:.75rem;color:var(--soft);margin-top:.5rem;font-style:italic;line-height:1.4;} 
  .fb{border-radius:8px;padding:.62rem .85rem;font-size:.8rem;font-weight:500;text-align:center;min-height:38px;display:flex;align-items:center;justify-content:center;transition:all .25s;} 
  .fb-idle{background:var(--surf2);color:var(--muted);border:1px dashed var(--border);} 
  .fb-hold{background:rgba(245,200,66,.1);color:var(--gold);border:1px solid rgba(245,200,66,.25);} 
  .fb-ok{background:rgba(61,245,160,.1);color:var(--ok);border:1px solid rgba(61,245,160,.25);} 
  .fb-wrong{background:rgba(255,79,110,.07);color:var(--err);border:1px solid rgba(255,79,110,.18);} 
  .fb-nohand{background:var(--surf2);color:var(--muted);border:1px dashed var(--border);} 
  .hold-bar-wrap{height:4px;background:var(--surf2);border-radius:2px;overflow:hidden;} 
  .hold-bar-fill{height:100%;background:var(--gold);border-radius:2px;transition:width .05s linear;} 
  .prog-row{display:flex;justify-content:space-between;font-size:.64rem;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;} 
  .prog-outer{height:4px;background:var(--surf2);border-radius:2px;overflow:hidden;margin-top:4px;} 
  .prog-inner{height:100%;background:var(--accent);border-radius:2px;transition:width .4s ease;} 
  .alpha-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;} 
  .alpha-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-family:var(--ff-h);font-size:.72rem;font-weight:700;border-radius:5px;background:var(--surf2);color:var(--muted);border:1px solid var(--border);transition:all .25s;} 
  .alpha-cell.done{background:rgba(61,245,160,.12);color:var(--ok);border-color:rgba(61,245,160,.3);} 
  .alpha-cell.curr{background:rgba(124,106,247,.2);color:var(--accent);border-color:var(--accent);animation:cb 1s ease-in-out infinite;} 
  @keyframes cb{0%,100%{opacity:1}50%{opacity:.5}} 
  .alpha-cell.motion{background:rgba(245,200,66,.1);color:var(--gold);border-color:rgba(245,200,66,.25);} 
  .skip-btn{background:transparent;border:1px solid var(--border);color:var(--muted);padding:.45rem;border-radius:7px;font-family:var(--ff-b);font-size:.76rem;transition:all .2s;width:100%;} 
  .skip-btn:hover{border-color:var(--soft);color:var(--text);} 
  .hint-btn{background:transparent;border:1px solid rgba(124,106,247,.3);color:var(--accent);padding:.45rem;border-radius:7px;font-family:var(--ff-b);font-size:.76rem;transition:all .2s;width:100%;} 
  .hint-btn:hover{border-color:var(--accent);background:rgba(124,106,247,.07);} 

  /* RESULTS */
  .results{align-items:center;justify-content:center;gap:1.5rem;padding:3rem 2rem;text-align:center;} 
  .win-title{font-family:var(--ff-h);font-size:clamp(2.5rem,7vw,5rem);font-weight:800;letter-spacing:-.04em;} 
  .win-title em{color:var(--accent);font-style:normal;} 
  .res-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:360px;width:100%;} 
  .res-card{background:var(--surf);border:1px solid var(--border);border-radius:11px;padding:.9rem .7rem;} 
  .res-val{font-family:var(--ff-h);font-size:2rem;font-weight:800;} 
  .res-lbl{font-size:.63rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:2px;} 
  .res-summary{font-size:.85rem;color:var(--soft);max-width:360px;text-align:center;line-height:1.85;} 
  .res-summary strong{color:var(--ok);} 
  .btn-row{display:flex;gap:10px;} 
  .res-btn{background:var(--accent);color:#fff;border:none;padding:.7rem 1.6rem;border-radius:8px;font-family:var(--ff-h);font-size:.88rem;font-weight:700;transition:transform .15s,opacity .15s;} 
  .res-btn:hover{transform:translateY(-2px);opacity:.9;} 
  .res-btn.ghost{background:transparent;color:var(--muted);border:1.5px solid var(--border);} 
  .res-btn.ghost:hover{border-color:var(--soft);color:var(--text);} 
`;

// ═══════════════════════════════════════════════════════════
//  TUTORIAL STEP DATA
// ═══════════════════════════════════════════════════════════

const STEPS = {
  A:["Make a fist with all fingers curled","Rest your thumb against the side of your index finger","Hold steady — fist shape, thumb beside not over"],
  B:["Extend all four fingers straight up","Keep them together, flat and upright","Tuck your thumb across your palm"],
  C:["Curve all fingers as if holding a ball","Thumb curves to match, forming a C gap","Open hand, curved — like holding a cup"],
  D:["Point your index finger straight up","Curl your middle, ring, and pinky to meet your thumb","Index up, others circle the thumb tip"],
  E:["Bend all four fingers forward at the knuckles","Tuck your thumb under your bent fingers","Like a claw — fingertips point toward palm"],
  F:["Touch your index fingertip to your thumb tip","Extend your middle, ring, and pinky straight up","Three up, two in a circle"],
  G:["Extend your index finger sideways (horizontal)","Thumb extends parallel, pointing the same way","Like pointing at something to the side"],
  H:["Extend index and middle fingers together sideways","Keep both fingers horizontal, side by side","Two fingers pointing to the side"],
  I:["Make a fist","Extend only your pinky finger straight up","Just the little finger — hold it steady"],
  J:["Start with I shape — pinky up","Trace a J in the air with your pinky","Arc down, then hook left at the bottom"],
  K:["Extend index finger upward","Place thumb between index and middle finger","Middle finger angled outward — like a peace sign with thumb"],
  L:["Extend index finger straight up","Extend thumb out to the side","L-shape — right angle between them"],
  M:["Fold index, middle, and ring fingers over your thumb","Pinky is curled in","Three fingers tucked over thumb"],
  N:["Fold index and middle fingers over your thumb","Ring and pinky are curled in","Two fingers tucked over thumb"],
  O:["Bring all fingertips together to meet your thumb","Form a round O shape","All tips touching in a circle"],
  P:["Like K, but point your hand downward","Index finger points down, thumb between fingers","K rotated toward the floor"],
  Q:["Like G, but point your hand downward","Index and thumb both point down","Pointing down with index and thumb"],
  R:["Extend index and middle fingers upward","Cross the middle finger over the index finger","Crossed fingers — like crossing your fingers for luck"],
  S:["Make a fist","Wrap your thumb over your curled fingers","Thumb crosses over the front — tighter than A"],
  T:["Make a fist","Tuck your thumb between index and middle finger","Thumb peeking between the two fingers"],
  U:["Extend index and middle fingers straight up","Keep them together side by side","Two fingers together — like the letter U"],
  V:["Extend index and middle fingers upward","Spread them apart in a V shape","Peace sign — spread fingers"],
  W:["Extend index, middle, and ring fingers upward","Spread them slightly apart","Three fingers up — like a W"],
  X:["Extend your index finger","Curl or hook it slightly inward","Hooked index — like beckoning someone"],
  Y:["Extend thumb out to the side","Extend pinky up","Middle three fingers curl — hang loose sign"],
  Z:["Extend your index finger","Trace a Z in the air — right, diagonal down-left, right","Three strokes forming a Z shape"],
};

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════

export default function SignLearn() {
  const [screen, setScreen] = useState("intro"); // intro | tutorial | game | results
  const [selectedCat, setSelectedCat] = useState(null);
  const [letters, setLetters] = useState([]);
  const [letterIdx, setLetterIdx] = useState(0);
  const [tutIdx, setTutIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState([]);
  const [missed, setMissed] = useState([]);
  const [feedback, setFeedback] = useState({ type:"idle", msg:"Show your hand" });
  const [holdPct, setHoldPct] = useState(0);
  const [borderState, setBorderState] = useState("");
  const [detectedLetter, setDetectedLetter] = useState(null);
  const [detConf, setDetConf] = useState(0);
  const [showTutModal, setShowTutModal] = useState(false);

  const holdStartRef = useRef(null);
  const HOLD_MS = 950;
  const VOTE_WIN = 8;
  const votesRef = useRef([]);

  // Hand tracking result handler
  const handleResult = useCallback(({ lm, detected, confidence }) => {
    if (screen !== "game") return;
    const curLetter = letters[letterIdx];
    if (!curLetter) return;

    setDetectedLetter(detected);
    setDetConf(confidence);

    if (!lm) {
      if (holdStartRef.current) {
        holdStartRef.current = null;
        setHoldPct(0);
        setFeedback({ type:"nohand", msg:"Hand left frame — hold broken" });
        setBorderState("");
      } else {
        setFeedback({ type:"nohand", msg:"No hand detected — show your hand" });
      }
      votesRef.current = [];
      return;
    }

    const match = detected === curLetter && confidence >= 0.60;

    if (match) {
      setBorderState("detecting");
      const now = Date.now();
      if (!holdStartRef.current) {
        holdStartRef.current = now;
        setFeedback({ type:"hold", msg:`Hold "${curLetter}" steady…` });
      } else {
        const elapsed = now - holdStartRef.current;
        const pct = Math.min(100, elapsed / HOLD_MS * 100);
        setHoldPct(pct);
        if (elapsed >= HOLD_MS) {
          holdStartRef.current = null;
          setHoldPct(0);
          confirmLetter(curLetter);
        } else {
          setFeedback({ type:"hold", msg:`Hold it! ${((HOLD_MS-elapsed)/1000).toFixed(1)}s…` });
        }
      }
    } else {
      if (holdStartRef.current) {
        holdStartRef.current = null;
        setHoldPct(0);
        setFeedback({ type:"idle", msg:`Sign "${curLetter}"` });
        setBorderState("");
      } else if (detected) {
        setFeedback({ type:"wrong", msg:`Seeing "${detected}" — need "${curLetter}"` });
        setBorderState("");
      } else {
        setFeedback({ type:"idle", msg:`Sign "${curLetter}"` });
        setBorderState("");
      }
    }
  }, [screen, letters, letterIdx]);

  const { videoRef, canvasRef, status, errorMsg } = useHandTracking({
    enabled: screen === "game",
    onResult: handleResult,
  });

  function confirmLetter(letter) {
    const bonus = 10 + streak * 3;
    setScore(s => s + bonus);
    const newStreak = streak + 1;
    setStreak(newStreak);
    setBestStreak(b => Math.max(b, newStreak));
    setXp(x => x + 15 + Math.floor(newStreak/3)*8);
    setDone(d => [...d, letter]);
    setBorderState("ok");
    setFeedback({ type:"ok", msg:`✓ "${letter}" — +${bonus} pts` });
    votesRef.current = [];
    setTimeout(() => {
      setBorderState("");
      const next = letterIdx + 1;
      if (next >= letters.length) {
        setScreen("results");
      } else {
        setLetterIdx(next);
        setFeedback({ type:"idle", msg:`Sign "${letters[next]}"` });
      }
    }, 900);
  }

  function skipLetter() {
    const cur = letters[letterIdx];
    setMissed(m => [...m, cur]);
    setStreak(0);
    holdStartRef.current = null;
    setHoldPct(0);
    votesRef.current = [];
    const next = letterIdx + 1;
    if (next >= letters.length) {
      setScreen("results");
    } else {
      setLetterIdx(next);
      setFeedback({ type:"idle", msg:`Sign "${letters[next]}"` });
      setBorderState("");
    }
  }

  function startSession() {
    if (!selectedCat) return;
    const ls = [...selectedCat.letters].sort(() => Math.random() - .5);
    setLetters(ls);
    setTutIdx(0);
    setLetterIdx(0);
    setScore(0); setStreak(0); setBestStreak(0); setXp(0);
    setDone([]); setMissed([]);
    votesRef.current = [];
    holdStartRef.current = null;
    setHoldPct(0);
    setBorderState("");
    setFeedback({ type:"idle", msg:"Show your hand" });
    setScreen("tutorial");
  }

  function beginGame() {
    setScreen("game");
    setTimeout(() => {
      setFeedback({ type:"idle", msg:`Sign "${letters[0]}"` });
    }, 200);
  }

  const curLetter = letters[tutIdx] || letters[0] || "A";
  const gameLetter = letters[letterIdx] || "";
  const isMotion = MOTION_LETTERS.has(gameLetter);

  // ── SCREENS ──

  if (screen === "intro") return (
    <>
      <style>{css}</style>
      <div className="screen intro" style={{textAlign:"center",alignItems:"center"}}>
        <div className="intro-grid"/>
        <div className="intro-glow"/>
        <div>
          <div className="logo">Sign<em>Learn</em></div>
          <div className="logo-sub">ASL Fingerspelling</div>
        </div>
        <p className="intro-desc">
          Learn the ASL alphabet using your webcam. Your hand signs each letter — the camera confirms it in real time.
        </p>
        <span className="cat-label">Choose a set</span>
        <div className="cat-grid">
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              className={`cat-btn${selectedCat?.id===cat.id?" selected":""}`}
              onClick={() => setSelectedCat(cat)}>
              <span className="cat-btn-icon">{cat.icon}</span>
              <span className="cat-btn-label">{cat.label}</span>
              <span className="cat-btn-count">{cat.letters.length} letters</span>
            </button>
          ))}
        </div>
        <button className="start-btn" disabled={!selectedCat} onClick={startSession}>
          Start signing →
        </button>
        <p className="cam-note">Camera required · Works best in Chrome · Good lighting helps</p>
      </div>
    </>
  );

  if (screen === "tutorial") return (
    <>
      <style>{css}</style>
      <div className="screen tutorial" style={{alignItems:"center"}}>
        <div className="tut-badge">
          Letter {tutIdx+1} of {letters.length} — {selectedCat?.label}
        </div>
        <div className="tut-word-row">
          <div className="tut-letter">{curLetter}</div>
        </div>
        <div className="tut-illus" style={{width:200,height:240}}>
          <HandDiagram letter={curLetter} size={200}/>
          {MOTION_LETTERS.has(curLetter) && (
            <div className="tut-motion-badge">MOTION</div>
          )}
        </div>
        <p className="tut-hint">{HINTS[curLetter]}</p>
        <div className="tut-steps">
          {(STEPS[curLetter]||[]).map((s,i) => (
            <div key={i} className="tut-step">
              <span className="step-n">0{i+1}</span>
              <span className="step-t">{s}</span>
            </div>
          ))}
          {MOTION_LETTERS.has(curLetter) && (
            <div className="tut-step" style={{borderColor:"rgba(245,200,66,.3)",background:"rgba(245,200,66,.05)"}}>
              <span className="step-n" style={{color:"var(--gold)"}}>⚠</span>
              <span className="step-t" style={{color:"var(--gold)"}}>
                This letter requires a motion path. In Phase 1, we detect the starting handshape only. Full motion detection coming in Phase 2.
              </span>
            </div>
          )}
        </div>
        <div className="tut-dots">
          {letters.map((_,i) => (
            <div key={i} className={`tut-dot${i<tutIdx?" done":i===tutIdx?" active":""}`}/>
          ))}
        </div>
        <div className="tut-nav">
          {tutIdx > 0 && (
            <button className="tut-nav-btn" onClick={() => setTutIdx(t=>t-1)}>← Back</button>
          )}
          <button className="tut-nav-btn primary"
            onClick={() => tutIdx < letters.length-1 ? setTutIdx(t=>t+1) : beginGame()}>
            {tutIdx < letters.length-1 ? "Got it — next →" : "Start signing! →"}
          </button>
        </div>
        <button style={{fontSize:".72rem",color:"var(--muted)",background:"none",border:"none",marginTop:"-.3rem"}}
          onClick={() => setScreen("intro")}>
          ← Back to menu
        </button>
      </div>
    </>
  );

  if (screen === "game") return (
    <>
      <style>{css}</style>
      <div className="screen game">

        {/* ── CAMERA SIDE ── */}
        <div className="cam-side">
          <video ref={videoRef} autoPlay playsInline muted style={{transform:"scaleX(-1)"}}/>
          <canvas ref={canvasRef} style={{transform:"none"}}/>
          <div className={`cam-border-flash ${borderState}`}/>

          {/* Big ghost letter behind */}
          <div className="letter-overlay">
            <div className="letter-bg">{gameLetter}</div>
          </div>

          {/* Top HUD */}
          <div className="cam-hud-top">
            <div className="live-badge">
              <div className="live-dot"/>
              {status === "ready" ? "TRACKING" : status === "loading" ? "LOADING…" : "LIVE"}
            </div>
            {isMotion && (
              <div style={{
                background:"rgba(245,200,66,.15)",border:"1px solid rgba(245,200,66,.3)",
                color:"var(--gold)",fontSize:".62rem",padding:".28rem .75rem",
                borderRadius:"20px",backdropFilter:"blur(10px)"
              }}>
                Motion letter — Phase 2
              </div>
            )}
          </div>

          {/* Hold arc */}
          <svg className="hold-arc" viewBox="0 0 52 52"
            style={{opacity: holdPct > 0 ? 1 : 0}}>
            <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(245,200,66,.15)" strokeWidth="4"/>
            <circle cx="26" cy="26" r="20" fill="none" stroke="#f5c842" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="125.7"
              strokeDashoffset={125.7*(1-holdPct/100)}
              transform="rotate(-90 26 26)"/>
          </svg>

          {/* Detection badge */}
          <div className="det-badge">
            <span className="det-lbl">Detecting:</span>
            <span className="det-val">{detectedLetter || "–"}</span>
            {detConf > 0.2 && <span className="det-conf">{Math.round(detConf*100)}%</span>}
          </div>

          {/* Loading overlay */}
          {(status === "loading" || status === "idle") && (
            <div className="load-over">
              <div className="spinner"/>
              <div className="load-txt">
                {status === "idle" ? "Starting camera…" : "Loading hand tracking model…"}
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="load-over">
              <div className="err-txt">{errorMsg || 'Camera access denied — please allow camera and refresh.'}</div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-num" style={{color:"var(--ok)"}}>{score}</div>
              <div className="stat-lbl">Score</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{color:"var(--teal)"}}>{streak}</div>
              <div className="stat-lbl">Streak</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{color:"var(--accent)"}}>{xp}</div>
              <div className="stat-lbl">XP</div>
            </div>
          </div>

          {/* Target card */}
          <div className="target-card">
            <div className="tc-cat">{selectedCat?.label}</div>
            <div className={`tc-letter${borderState==="ok"?" pulse":""}`}>{gameLetter}</div>
            <div className="tc-illus-wrap" onClick={() => setShowTutModal(true)}>
              <HandDiagram letter={gameLetter} size={88}/>
            </div>
            <div className="tc-hint-link" onClick={() => setShowTutModal(true)}>
              👁 Tap to see how to sign this
            </div>
            <div className="tc-hint">{HINTS[gameLetter]}</div>
          </div>

          {/* Feedback */}
          <div className={`fb fb-${feedback.type}`}>{feedback.msg}</div>
          <div className="hold-bar-wrap">
            <div className="hold-bar-fill" style={{width:`${holdPct}%`}}/>
          </div>

          {/* Progress */}
          <div>
            <div className="prog-row">
              <span>Progress</span>
              <span>{letterIdx} / {letters.length}</span>
            </div>
            <div className="prog-outer">
              <div className="prog-inner" style={{width:`${letters.length>0?letterIdx/letters.length*100:0}%`}}/>
            </div>
          </div>

          {/* Alphabet grid */}
          <div className="alpha-grid">
            {letters.map((l,i) => (
              <div key={l} className={`alpha-cell${done.includes(l)?" done":i===letterIdx?" curr":MOTION_LETTERS.has(l)?" motion":""}`}>
                {l.length===1?l:l[0]}
              </div>
            ))}
          </div>

          <button className="hint-btn" onClick={() => setShowTutModal(true)}>
            💡 Replay tutorial
          </button>
          <button className="skip-btn" onClick={skipLetter}>
            Skip letter →
          </button>
        </div>

        {/* Tutorial modal */}
        {showTutModal && (
          <div style={{
            position:"fixed",inset:0,background:"rgba(7,8,15,.85)",display:"flex",
            alignItems:"center",justifyContent:"center",zIndex:50,backdropFilter:"blur(8px)"
          }} onClick={() => setShowTutModal(false)}>
            <div style={{
              background:"var(--surf)",border:"1px solid var(--border)",borderRadius:16,
              padding:"1.5rem",maxWidth:340,width:"90%",display:"flex",flexDirection:"column",
              gap:"1rem",alignItems:"center"
            }} onClick={e => e.stopPropagation()}>
              <div style={{fontFamily:"var(--ff-h)",fontSize:"1.8rem",fontWeight:800,color:"var(--accent)"}}>{gameLetter}</div>
              <HandDiagram letter={gameLetter} size={180}/>
              <p style={{fontSize:".8rem",color:"var(--soft)",textAlign:"center",fontStyle:"italic"}}>{HINTS[gameLetter]}</p>
              {(STEPS[gameLetter]||[]).map((s,i) => (
                <div key={i} style={{display:"flex",gap:".6rem",alignItems:"flex-start",width:"100%"}}>
                  <span style={{fontFamily:"var(--ff-h)",fontSize:".62rem",color:"var(--accent)",minWidth:18,paddingTop:2}}>0{i+1}</span>
                  <span style={{fontSize:".8rem",color:"var(--soft)",lineHeight:1.5}}>{s}</span>
                </div>
              ))}
              <button onClick={() => setShowTutModal(false)} style={{
                background:"var(--accent)",color:"#fff",border:"none",padding:".65rem 2rem",
                borderRadius:8,fontFamily:"var(--ff-h)",fontWeight:700,fontSize:".88rem",width:"100%"
              }}>Got it — back to signing</button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (screen === "results") {
    const masteredLetters = done;
    const missedLetters = missed;
    return (
      <>
        <style>{css}</style>
        <div className="screen results">
          <div className="win-title">Well <em>Signed</em> ✋</div>
          <div className="res-grid">
            <div className="res-card">
              <div className="res-val" style={{color:"var(--ok)"}}>{score}</div>
              <div className="res-lbl">Score</div>
            </div>
            <div className="res-card">
              <div className="res-val" style={{color:"var(--teal)"}}>{bestStreak}</div>
              <div className="res-lbl">Best streak</div>
            </div>
            <div className="res-card">
              <div className="res-val" style={{color:"var(--accent)"}}>{xp}</div>
              <div className="res-lbl">XP earned</div>
            </div>
          </div>
          <div className="res-summary">
            {masteredLetters.length > 0 && (
              <div style={{marginBottom:".4rem"}}>
                <strong>Mastered:</strong> {masteredLetters.join(", ")}
              </div>
            )}
            {missedLetters.length > 0 && (
              <div style={{color:"var(--soft)"}}>
                Practice more: {missedLetters.join(", ")}
              </div>
            )}
          </div>
          <div className="btn-row">
            <button className="res-btn" onClick={startSession}>Practice again</button>
            <button className="res-btn ghost" onClick={() => setScreen("intro")}>Change set</button>
          </div>
        </div>
      </>
    );
  }

  return null;
}
