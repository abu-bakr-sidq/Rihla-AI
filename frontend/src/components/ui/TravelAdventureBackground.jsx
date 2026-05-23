import { useEffect, useState, useRef } from "react";

/**
 * CinematicTravelBackground
 * ─────────────────────────────────────────────────────────────
 * Dynamically fetches 20 travel / nature / adventure /
 * green-forest landscape photos from Unsplash on mount.
 * Falls back to 8 hardcoded photos if the API is unavailable.
 * Ken Burns slow zoom/pan + crossfade every 8 s.
 * Cinematic vignette + color-grade overlay.
 */

const UNSPLASH_KEY = "e5Kg6F5Hll-FnB6Mg9XDaay-BbsmedFqr5V57svuKks";

// 6 Ken-Burns variants – the component cycles through them
const KEN = [
  "ken-tl",  // top-left → centre (zoom in)
  "ken-tr",  // top-right → centre (zoom in)
  "ken-bl",  // bottom-left → centre (zoom in)
  "ken-br",  // bottom-right → centre (zoom in)
  "ken-out", // centre → outward (zoom out)
  "ken-pan", // left → right pan
];

// 8 beautiful fall-back photos (verified Unsplash IDs, all landscape, NO HUMANS)
const FALLBACK_URLS = [
  // Bali rice terraces - lush nature
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=90&w=2400&auto=format&fit=crop",
  // Maldives turquoise water
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=90&w=2400&auto=format&fit=crop",
  // Misty pine forest
  "https://images.unsplash.com/photo-1518710843675-2540dd79065c?q=90&w=2400&auto=format&fit=crop",
  // Tropical rainforest
  "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=90&w=2400&auto=format&fit=crop",
  // African Savanna Landscape
  "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=90&w=2400&auto=format&fit=crop",
  // Deep Ocean / Coastal
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=90&w=2400&auto=format&fit=crop",
  // Grand Canyon / Earth
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=90&w=2400&auto=format&fit=crop",
  // Snowy Peak
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=90&w=2400&auto=format&fit=crop",
];

const STAY = 8000;   // ms fully visible
const FADE = 1400;   // ms crossfade

// Keyframes injected once
const CSS = `
@keyframes ken-tl  { 0%{transform:scale(1.00) translate( 0%,   0%)} 100%{transform:scale(1.14) translate(-3%,  -2%)} }
@keyframes ken-tr  { 0%{transform:scale(1.00) translate( 0%,   0%)} 100%{transform:scale(1.14) translate( 3%,  -2%)} }
@keyframes ken-bl  { 0%{transform:scale(1.00) translate( 0%,   0%)} 100%{transform:scale(1.14) translate(-3%,   2%)} }
@keyframes ken-br  { 0%{transform:scale(1.00) translate( 0%,   0%)} 100%{transform:scale(1.14) translate( 3%,   2%)} }
@keyframes ken-out { 0%{transform:scale(1.14) translate( 0%,   0%)} 100%{transform:scale(1.00) translate( 0%,   0%)} }
@keyframes ken-pan { 0%{transform:scale(1.10) translate(-4%,   0%)} 100%{transform:scale(1.10) translate( 4%,   0%)} }
@keyframes cf-in   { from{opacity:0} to{opacity:1} }
@keyframes cf-out  { from{opacity:1} to{opacity:0} }
@keyframes shimmer { 0%,100%{opacity:0} 50%{opacity:1} }
`;

export default function CinematicTravelBackground() {
  const [slides, setSlides] = useState(
    FALLBACK_URLS.map((url, i) => ({ url, ken: KEN[i % KEN.length] }))
  );
  const [curr, setCurr]     = useState(0);
  const [prev, setPrev]     = useState(null);
  const slideRef            = useRef(slides);
  slideRef.current          = slides;

  // ── Fetch real photos from Unsplash API ───────────────────────────────────
  useEffect(() => {
    const QUERIES = [
      "lush green forest landscape -human -people",
      "mountain range turquoise lake day -human",
      "aerial tropical beach coast sunny -human",
      "dramatic waterfall forest nature -people",
      "majestic canyon desert landscape -human",
      "rolling green hills mist morning -human",
    ];
    const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];

    fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&count=20&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
    )
      .then(r => (r.ok ? r.json() : null))
      .then(photos => {
        if (!Array.isArray(photos) || photos.length === 0) return;
        const fetched = photos.map((p, i) => ({
          url: p.urls.regular,   
          ken: KEN[i % KEN.length],
        }));
        // Shuffle & merge with fresh green fallbacks
        const merged = [...fetched, ...FALLBACK_URLS.map((url, i) => ({ url, ken: KEN[i % KEN.length] }))];
        setSlides(merged);
      })
      .catch(() => { /* keep fallbacks */ });
  }, []);

  // ── Slide timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const sl = slideRef.current;
      setCurr(c => {
        setPrev(c);
        return (c + 1) % sl.length;
      });
      setTimeout(() => setPrev(null), FADE + 120);
    }, STAY + FADE);
    return () => clearInterval(iv);
  }, []);

  // ── Shimmer particles ─────────────────────────────────────────────────────
  const particles = useRef(
    Array.from({ length: 25 }, (_, i) => ({
      left  : `${Math.sin(i * 2.8) * 45 + 50}%`,
      top   : `${20 + (i % 8) * 10}%`,
      size  : 1.5 + (i % 3),
      delay : `${(i * 0.9) % 8}s`,
      dur   : `${6 + (i % 5) * 2}s`,
      alpha : 0.08 + (i % 4) * 0.04,
    }))
  ).current;

  const totalDur = `${(STAY + FADE) / 1000}s`;

  const layerStyle = (slide, role) => ({
    position : "absolute", inset: 0,
    backgroundImage   : `url(${slide.url})`,
    backgroundSize    : "cover",
    backgroundPosition: "center",
    animation : [
      `${slide.ken} ${parseFloat(totalDur) * (slides.length > 0 ? slides.length : 1)}s ease-in-out infinite`,
      role === "in"  ? `cf-in  ${FADE / 1000}s ease-in-out forwards`  : "",
      role === "out" ? `cf-out ${FADE / 1000}s ease-in-out forwards`  : "",
    ].filter(Boolean).join(", "),
    willChange: "transform, opacity",
  });

  return (
    <>
      <style>{CSS}</style>

      <div style={{
        position: "absolute", inset: 0, overflow: "hidden",
        zIndex: 0, pointerEvents: "none", userSelect: "none",
      }}>
        {/* Current slide */}
        <div style={layerStyle(slides[curr] || {url:FALLBACK_URLS[0], ken:KEN[0]}, prev !== null ? "in" : "base")} />

        {/* Previous slide fading out */}
        {prev !== null && (
          <div key={prev} style={layerStyle(slides[prev] || {url:FALLBACK_URLS[0], ken:KEN[0]}, "out")} />
        )}

        {/* ── Cinematic overlay stack ──────────────────────────── */}

        {/* Subtle vignette (daylight feel) */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,20,10,0.35) 100%)",
        }} />

        {/* Top Scrim (Sun - optimized for light text) */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,15,30,0.45) 0%, rgba(0,15,30,0.1) 40%, transparent 70%)",
        }} />

        {/* Bottom anchor (Ground) */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,10,15,0.60) 0%, rgba(0,10,15,0.1) 30%, transparent 55%)",
        }} />

        {/* Lush Greenery Color Grade */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(212,175,55,0.04) 50%, rgba(20,83,45,0.08) 100%)",
          mixBlendMode: "soft-light",
        }} />

        {/* Dust/Shimmer particles (Sunny/Misty) */}
        {particles.map((p, i) => (
          <div key={i} style={{
            position: "absolute",
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            borderRadius: "50%",
            background: `rgba(255,255,255,${p.alpha})`,
            animation: `shimmer ${p.dur} ${p.delay} ease-in-out infinite`,
          }} />
        ))}
      </div>
    </>
  );
}
