import { useEffect, useRef } from "react";

/**
 * TravelNatureBg – Ultra-Legend Pro Max Nature Adventure Background
 * Layers:
 *  1.  Twilight-to-night sky gradient
 *  2.  Static star field (SVG)
 *  3.  Aurora borealis bands (3 waves)
 *  4.  Distant hazy mountains (back)
 *  5.  Mid mountain range
 *  6.  Close dark ridgeline
 *  7.  Canvas: firefly particles + twinkling stars
 *  8.  Valley mist / fog layers
 *  9.  Slow cloud wisps
 * 10.  Navbar top-fade
 */
export default function TravelNatureBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let w = 0, h = 0;
    let particles = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const spawnParticle = () => ({
      x: Math.random() * (w || 1440),
      y: Math.random() * ((h || 800) * 0.80),
      r: Math.random() * 2.2 + 0.5,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -Math.random() * 0.28 - 0.04,
      alpha: Math.random() * 0.75 + 0.25,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.013 + Math.random() * 0.03,
      hue: [
        "212,175,55",   // gold
        "255,255,255",  // white
        "255,255,255",  // white (more common)
        "160,255,210",  // teal-green
        "200,240,255",  // ice-blue
        "255,200,120",  // warm amber
      ][Math.floor(Math.random() * 6)],
    });

    const init = () => {
      resize();
      particles = Array.from({ length: 130 }, spawnParticle);
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.y < -10 || p.x < -10 || p.x > w + 10) {
          Object.assign(p, spawnParticle());
          p.y = h * 0.78;
        }
        const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
        // glow ring
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `rgba(${p.hue},${a})`);
        g.addColorStop(1, `rgba(${p.hue},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        // core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},${Math.min(a * 1.6, 1)})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(tick);
    };

    init();
    tick();
    const onResize = () => { resize(); particles = Array.from({ length: 130 }, spawnParticle); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  // Pre-compute star positions (stable, not on every render)
  const STARS = [
    [5,4,0.9],[12,9,1.4],[18,3,0.7],[27,7,1.1],[35,5,0.8],[42,11,1.5],[52,2,0.9],[61,8,1.2],
    [70,4,0.7],[80,6,1.3],[88,3,0.8],[95,10,1.1],[3,16,0.9],[15,20,1.4],[22,14,0.7],[30,19,1.0],
    [40,15,0.8],[50,18,1.5],[60,13,0.9],[72,17,1.2],[83,21,0.7],[93,15,1.1],[8,25,1.3],
    [19,30,0.8],[28,23,0.9],[38,28,1.4],[48,24,0.7],[58,29,1.1],[68,22,1.5],[78,27,0.8],
    [90,25,0.9],[10,35,1.2],[25,38,0.7],[36,33,1.3],[47,37,0.8],[57,32,0.9],[67,36,1.4],
    [77,34,0.7],[89,38,1.1],[4,45,0.9],[20,42,1.4],[32,47,0.7],[44,43,1.2],[55,48,0.8],
    [65,44,1.5],[75,46,0.9],[87,41,1.1],[7,54,0.8],[17,58,1.3],[29,52,0.7],[41,56,0.9],
    [53,51,1.4],[63,55,0.8],[74,53,1.1],[85,57,0.7],[14,63,0.9],[26,67,1.2],[37,61,0.8],
    [49,65,1.5],[59,62,0.7],[71,66,1.1],[82,64,0.8],[2,72,0.9],[11,76,1.3],[23,71,0.7],
    [34,74,0.8],[46,70,1.4],[56,75,0.9],[66,73,1.1],[79,71,0.7],
  ];

  return (
    <>
      <style>{`
        @keyframes tnb-aurora1 {
          0%   { transform: translateX(0%) scaleY(1) skewX(0deg); opacity: 0.7; }
          25%  { transform: translateX(9%) scaleY(1.45) skewX(5deg); opacity: 0.9; }
          50%  { transform: translateX(-6%) scaleY(0.85) skewX(-4deg); opacity: 0.6; }
          75%  { transform: translateX(13%) scaleY(1.2) skewX(7deg); opacity: 0.85; }
          100% { transform: translateX(0%) scaleY(1) skewX(0deg); opacity: 0.7; }
        }
        @keyframes tnb-aurora2 {
          0%   { transform: translateX(0%) scaleY(1) skewX(0deg); opacity: 0.55; }
          33%  { transform: translateX(-12%) scaleY(1.55) skewX(-6deg); opacity: 0.75; }
          66%  { transform: translateX(8%) scaleY(0.8) skewX(5deg); opacity: 0.45; }
          100% { transform: translateX(0%) scaleY(1) skewX(0deg); opacity: 0.55; }
        }
        @keyframes tnb-aurora3 {
          0%   { transform: translateX(0%) scaleY(1); opacity: 0.45; }
          50%  { transform: translateX(18%) scaleY(1.6); opacity: 0.65; }
          100% { transform: translateX(0%) scaleY(1); opacity: 0.45; }
        }
        @keyframes tnb-cloud1 {
          0%   { transform: translateX(-25%); opacity: 0; }
          8%   { opacity: 0.6; }
          92%  { opacity: 0.6; }
          100% { transform: translateX(125%); opacity: 0; }
        }
        @keyframes tnb-cloud2 {
          0%   { transform: translateX(-35%); opacity: 0; }
          12%  { opacity: 0.4; }
          88%  { opacity: 0.4; }
          100% { transform: translateX(135%); opacity: 0; }
        }
        @keyframes tnb-mist1 {
          0%   { transform: translateX(-8%) scaleX(1.1); opacity: 0.45; }
          50%  { transform: translateX(6%) scaleX(1); opacity: 0.65; }
          100% { transform: translateX(-8%) scaleX(1.1); opacity: 0.45; }
        }
        @keyframes tnb-mist2 {
          0%   { transform: translateX(9%) scaleX(1); opacity: 0.35; }
          50%  { transform: translateX(-7%) scaleX(1.12); opacity: 0.55; }
          100% { transform: translateX(9%) scaleX(1); opacity: 0.35; }
        }
        @keyframes tnb-twinkle {
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 0.25; }
        }
        @keyframes tnb-horizon-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.8; }
        }
      `}</style>

      {/* ─── 1. SKY GRADIENT ──────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(
          180deg,
          #010610 0%,
          #030d26 12%,
          #061840 25%,
          #082248 38%,
          #092540 50%,
          #071e30 62%,
          #061828 74%,
          #050e18 84%,
          #030910 92%,
          #020710 100%
        )`,
      }} />

      {/* ─── 2. STAR FIELD ────────────────────────────────────────────────── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:1 }} xmlns="http://www.w3.org/2000/svg">
        {STARS.map(([cx, cy, r], i) => (
          <circle
            key={i}
            cx={`${cx}%`} cy={`${cy}%`} r={r}
            fill="white"
            style={{
              animation: `tnb-twinkle ${2 + (i % 5)}s ease-in-out ${(i * 0.37) % 4}s infinite`,
              opacity: 0.4 + (i % 6) * 0.1,
            }}
          />
        ))}
      </svg>

      {/* ─── 3. AURORA BOREALIS ───────────────────────────────────────────── */}
      {/* Wave A – vivid green-teal */}
      <div style={{
        position: "absolute",
        top: "5%", left: "-15%", right: "-15%",
        height: "38%",
        background: `radial-gradient(
          ellipse 75% 100% at 50% 0%,
          rgba(0,230,160,0.38) 0%,
          rgba(0,200,130,0.22) 30%,
          rgba(0,160,100,0.10) 60%,
          transparent 85%
        )`,
        filter: "blur(14px)",
        animation: "tnb-aurora1 13s ease-in-out infinite",
        transformOrigin: "center top",
      }} />
      {/* Wave B – electric blue-violet */}
      <div style={{
        position: "absolute",
        top: "10%", left: "-20%", right: "-20%",
        height: "32%",
        background: `radial-gradient(
          ellipse 65% 100% at 38% 0%,
          rgba(80,140,255,0.32) 0%,
          rgba(60,110,220,0.18) 38%,
          transparent 65%
        )`,
        filter: "blur(18px)",
        animation: "tnb-aurora2 17s ease-in-out 2.5s infinite",
        transformOrigin: "center top",
      }} />
      {/* Wave C – gold shimmer on right */}
      <div style={{
        position: "absolute",
        top: "3%", left: "25%", right: "-10%",
        height: "28%",
        background: `radial-gradient(
          ellipse 55% 100% at 65% 0%,
          rgba(212,175,55,0.22) 0%,
          rgba(212,175,55,0.08) 45%,
          transparent 75%
        )`,
        filter: "blur(28px)",
        animation: "tnb-aurora3 21s ease-in-out 6s infinite",
        transformOrigin: "center top",
      }} />

      {/* ─── HORIZON GLOW ─────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: "48%", left: 0, right: 0,
        height: "8%",
        background: "linear-gradient(to bottom, transparent, rgba(0,180,120,0.12), transparent)",
        filter: "blur(30px)",
        animation: "tnb-horizon-pulse 8s ease-in-out infinite",
      }} />

      {/* ─── 4. BACK MOUNTAIN (hazy, distant) ────────────────────────────── */}
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none"
        style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"52%", opacity:0.5 }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tnb-mtn-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c4060" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#061220" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M0,340 L55,270 L120,310 L195,220 L270,280 L350,175 L430,240 L510,145 
                 L590,215 L670,120 L750,190 L830,90 L910,165 L990,105 L1070,195 
                 L1150,140 L1230,210 L1340,155 L1440,230 L1440,400 L0,400 Z"
          fill="url(#tnb-mtn-bg)" />
      </svg>

      {/* ─── 5. MID MOUNTAIN RANGE ────────────────────────────────────────── */}
      <svg viewBox="0 0 1440 360" preserveAspectRatio="none"
        style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"42%", opacity:0.85 }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tnb-mtn-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e2a44" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#040e1e" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M0,310 L75,245 L150,285 L230,200 L315,260 L395,185 L475,248 
                 L545,165 L625,228 L705,140 L785,205 L865,118 L945,188 
                 L1025,148 L1105,215 L1185,168 L1265,235 L1360,185 L1440,255 
                 L1440,360 L0,360 Z"
          fill="url(#tnb-mtn-mid)" />
      </svg>

      {/* ─── 6. NEAR RIDGELINE ────────────────────────────────────────────── */}
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none"
        style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"30%", opacity:1 }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tnb-mtn-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#060f1a" stopOpacity="1" />
            <stop offset="100%" stopColor="#020810" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M0,290 L90,248 L170,278 L255,238 L335,262 L415,228 L495,255 
                 L570,222 L650,248 L730,212 L810,240 L890,218 L970,248 
                 L1050,232 L1130,258 L1215,238 L1305,262 L1375,245 L1440,260 
                 L1440,320 L0,320 Z"
          fill="url(#tnb-mtn-near)" />
      </svg>

      {/* ─── SNOW PEAKS highlight on back mountains ───────────────────────── */}
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none"
        style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"52%", opacity:0.22 }}
        xmlns="http://www.w3.org/2000/svg">
        {/* Snow caps on tallest peaks */}
        <path d="M820,90 L830,120 L840,90 Z" fill="white" />
        <path d="M500,145 L512,175 L524,145 Z" fill="white" />
        <path d="M660,120 L672,148 L684,120 Z" fill="white" />
        <path d="M340,175 L352,205 L364,175 Z" fill="white" />
        <path d="M980,105 L992,132 L1004,105 Z" fill="white" />
      </svg>

      {/* ─── 7. CANVAS FIREFLIES ──────────────────────────────────────────── */}
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} />

      {/* ─── 8. MIST / VALLEY FOG ─────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: "17%", left: "-8%", right: "-8%", height: "20%",
        background: `radial-gradient(ellipse 100% 100% at 50% 50%,
          rgba(120,200,230,0.28) 0%,
          rgba(80,160,200,0.14) 45%,
          transparent 75%)`,
        filter: "blur(28px)",
        animation: "tnb-mist1 17s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%", left: "-8%", right: "-8%", height: "14%",
        background: `radial-gradient(ellipse 100% 100% at 50% 50%,
          rgba(60,140,180,0.35) 0%,
          rgba(40,110,160,0.18) 50%,
          transparent 80%)`,
        filter: "blur(40px)",
        animation: "tnb-mist2 22s ease-in-out 5s infinite",
      }} />

      {/* ─── 9. CLOUD WISPS ───────────────────────────────────────────────── */}
      <div style={{
        position:"absolute", top:"30%", left:0, width:"55%", height:"10%",
        background:`radial-gradient(ellipse 100% 100% at 30% 50%,
          rgba(200,230,255,0.12) 0%, transparent 70%)`,
        filter:"blur(45px)",
        animation:"tnb-cloud1 65s linear 0s infinite",
      }} />
      <div style={{
        position:"absolute", top:"44%", left:0, width:"42%", height:"9%",
        background:`radial-gradient(ellipse 100% 100% at 40% 50%,
          rgba(160,210,240,0.09) 0%, transparent 70%)`,
        filter:"blur(55px)",
        animation:"tnb-cloud2 85s linear 22s infinite",
      }} />
      <div style={{
        position:"absolute", top:"22%", right:0, width:"48%", height:"9%",
        background:`radial-gradient(ellipse 100% 100% at 60% 50%,
          rgba(100,190,230,0.1) 0%, transparent 70%)`,
        filter:"blur(50px)",
        animation:"tnb-cloud2 95s linear 12s infinite reverse",
      }} />

      {/* ─── 10. TOP FADE ─────────────────────────────────────────────────── */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:140,
        background:"linear-gradient(to bottom, rgba(1,6,16,0.9) 0%, transparent 100%)",
        pointerEvents:"none",
      }} />

      {/* ─── BOTTOM GROUND FILL ───────────────────────────────────────────── */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, height:"8%",
        background:"#020710",
      }} />
    </>
  );
}
