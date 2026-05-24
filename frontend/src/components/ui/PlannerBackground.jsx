import { useEffect, useRef } from "react";

/**
 * PlannerBackground
 * Premium dark-animated background for the Rihla planner.
 * Layers (bottom → top):
 *  1. Deep navy gradient base
 *  2. Perspective grid with gold accent lines
 *  3. Canvas particle network (floating stars/nodes)
 *  4. Three glowing aurora orbs (animated with CSS keyframes)
 *  5. Subtle scanline overlay
 */
export default function PlannerBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let w, h;

    // ── Particle definition ─────────────────────────────────────
    const MAX = 90;
    let particles = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const spawn = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.55 + 0.15,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.008 + Math.random() * 0.012,
      color: Math.random() > 0.75 ? "#D4AF37" : "#ffffff",
    });

    const init = () => {
      resize();
      particles = Array.from({ length: MAX }, spawn);
    };

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const op = (1 - dist / 130) * 0.12;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(212,175,55,${op})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      drawConnections();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // Wrap edges
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;

        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle =
          p.color === "#D4AF37"
            ? `rgba(212,175,55,${a})`
            : `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(tick);
    };

    init();
    tick();

    window.addEventListener("resize", () => {
      resize();
      particles = Array.from({ length: MAX }, spawn);
    });

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* ── Injected keyframes ──────────────────────────────────── */}
      <style>{`
        @keyframes orb-drift-1 {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(60px, -40px) scale(1.15); }
          66%  { transform: translate(-30px, 50px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes orb-drift-2 {
          0%   { transform: translate(0, 0) scale(1); }
          40%  { transform: translate(-80px, 60px) scale(1.2); }
          75%  { transform: translate(40px, -30px) scale(0.85); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes orb-drift-3 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(50px, 40px) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes grid-scroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 80px; }
        }
        @keyframes scanline-drift {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      {/* 1 ── Deep base gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 120% 80% at 50% 0%, #050d1f 0%, #02060e 60%, #000000 100%)",
        }}
      />

      {/* 2 ── Perspective grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(212,175,55,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          animation: "grid-scroll 6s linear infinite",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.6) 70%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.6) 70%, transparent 100%)",
        }}
      />

      {/* 3 ── Canvas particle network */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* 4 ── Aurora orbs */}
      {/* Orb A – gold-amber, top-left */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "8%",
          width: 640,
          height: 640,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 40%, transparent 70%)",
          filter: "blur(80px)",
          animation: "orb-drift-1 22s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* Orb B – indigo, bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          right: "6%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0.05) 45%, transparent 70%)",
          filter: "blur(90px)",
          animation: "orb-drift-2 28s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* Orb C – teal, center */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "40%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,204,177,0.10) 0%, rgba(0,204,177,0.03) 50%, transparent 70%)",
          filter: "blur(70px)",
          animation: "orb-drift-3 18s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* 5 ── Scanline shimmer (very subtle) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0.03,
        }}
      >
        <div
          style={{
            width: "100%",
            height: 3,
            background:
              "linear-gradient(to right, transparent, rgba(212,175,55,0.8), transparent)",
            animation: "scanline-drift 8s linear infinite",
          }}
        />
      </div>

      {/* 6 ── Top vignette to blend with navbar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 180,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
