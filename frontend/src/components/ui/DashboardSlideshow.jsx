import { useState, useEffect, useMemo, useRef } from "react";

const IMAGES = [
  // Nature & Landscapes
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1433086466342-c740170a4401?w=1400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&q=80&auto=format&fit=crop",
  // Adventure
  "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1400&q=80&auto=format&fit=crop",
  // Travel & Places
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502602228474-5084ce11ef2d?w=1400&q=80&auto=format&fit=crop",
];

const INTERVAL = 7000;        // 7s per slide
const FADE_MS  = 2000;        // 2s CSS crossfade

// CSS injected once for Ken Burns animation
const KB_CSS = `
@keyframes kb-zoom-in  { from { transform: scale(1.15) translate(1%, 1%);  } to { transform: scale(1.05) translate(0%, 0%); } }
@keyframes kb-zoom-out { from { transform: scale(1.05) translate(0%, 0%);  } to { transform: scale(1.15) translate(-1%, -1%); } }
@keyframes kb-pan-left { from { transform: scale(1.15) translate(2%, 0%);  } to { transform: scale(1.05) translate(-2%, 0%); } }
@keyframes kb-pan-right{ from { transform: scale(1.15) translate(-2%, 0%); } to { transform: scale(1.05) translate(2%, 0%); } }
.kb-0 { animation: kb-zoom-in   30s infinite alternate ease-in-out; }
.kb-1 { animation: kb-zoom-out  32s infinite alternate ease-in-out; }
.kb-2 { animation: kb-pan-left  34s infinite alternate ease-in-out; }
.kb-3 { animation: kb-pan-right 33s infinite alternate ease-in-out; }
.kb-4 { animation: kb-zoom-in   36s infinite alternate ease-in-out; }
`;

let cssInjected = false;

export default function DashboardSlideshow({ customImages = null }) {
  const imagesSource = useMemo(
    () => (customImages && customImages.length > 0 ? customImages : IMAGES),
    [customImages]
  );
  const imageKey = imagesSource.join("|");
  const [readyImages, setReadyImages] = useState([imagesSource[0]]); // first image shown immediately
  const [current, setCurrent]         = useState(0);
  const timerRef                      = useRef(null);

  // Inject Ken Burns keyframes once globally
  useEffect(() => {
    if (!cssInjected) {
      const style = document.createElement("style");
      style.textContent = KB_CSS;
      document.head.appendChild(style);
      cssInjected = true;
    }
  }, []);

  useEffect(() => {
    setReadyImages([imagesSource[0]]);
    setCurrent(0);
  }, [imageKey]);

  // Stream images in one-by-one after initial render
  useEffect(() => {
    let cancelled = false;
    const remaining = imagesSource.slice(1);

    const loadNext = (idx) => {
      if (idx >= remaining.length || cancelled) return;
      const img = new Image();
      img.src = remaining[idx];
      img.onload  = () => {
        if (!cancelled) {
          setReadyImages((prev) => [...prev, remaining[idx]]);
          setTimeout(() => loadNext(idx + 1), 400); // 400ms gap
        }
      };
      img.onerror = () => { if (!cancelled) loadNext(idx + 1); };
    };

    const t = setTimeout(() => loadNext(0), 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, [imageKey]);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % readyImages.length);
    }, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [readyImages]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900">
      {/* ── CSS Keyframe Cinematic Layers ── */}
      {readyImages.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 will-change-transform kb-${i % 5}`}
          style={{
            opacity:    i === current ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
            zIndex:     i === current ? 2 : 1,
          }}
        >
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover object-center"
            draggable={false}
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Cinematic overlays */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.5)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/35" />
      </div>
    </div>
  );
}
