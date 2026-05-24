"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DottedMap from "dotted-map";

interface MapDot {
  lat: number;
  lng: number;
  label?: string;
  img?: string;
  region?: string;
  status?: string;
  description?: string;
}

interface MapProps {
  dots?: Array<{
    start: MapDot;
    end: MapDot;
  }>;
  lineColor?: string;
  showLabels?: boolean;
  labelClassName?: string;
  animationDuration?: number;
  loop?: boolean;
}

export function WorldMap({ 
  dots = [], 
  lineColor = "#0ea5e9",
  showLabels = true,
  labelClassName = "text-sm",
  animationDuration = 2,
  loop = true
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<MapDot | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                         document.body.classList.contains('dark') ||
                         window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const map = useMemo(() => new DottedMap({ height: 100, grid: "diagonal" }), []);
  const svgMap = useMemo(() => map.getSVG({
    radius: 0.22,
    color: isDark ? "#FFFFFF40" : "#00000040",
    shape: "circle",
    backgroundColor: isDark ? "black" : "#ffffff",
  }), [map, isDark]);

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2;
  const fullCycleDuration = totalAnimationTime + pauseTime;

  return (
    <div 
      className="w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2/1] dark:bg-black bg-white rounded-lg relative font-sans overflow-hidden group/map"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute inset-0 opacity-0 group-hover/map:opacity-100 transition-opacity duration-1000 ${isDark ? 'bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.1)_0%,_transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.02)_0%,_transparent_70%)]'}`} />
      
      {/* Scanning Line Effect */}
      <motion.div 
        initial={{ top: "-100%" }}
        animate={{ top: "200%" }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className={`absolute left-0 right-0 h-[20%] pointer-events-none z-10 ${isDark ? 'bg-gradient-to-b from-transparent via-primary/5 to-transparent' : 'bg-gradient-to-b from-transparent via-black/5 to-transparent'}`}
      />

      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className={`h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none object-cover transition-all duration-700 ${hoveredPoint ? 'blur-[3px] scale-[1.03] opacity-30' : 'opacity-80'}`}
        alt="world map"
        draggable={false}
      />
      
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none z-20"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? "white" : "black"} stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor={isDark ? "white" : "black"} stopOpacity="0" />
          </linearGradient>
          
          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;
          
          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1.2"
                initial={{ pathLength: 0 }}
                animate={loop ? {
                  pathLength: [0, 0, 1, 1, 0],
                } : {
                  pathLength: 1
                }}
                transition={loop ? {
                  duration: fullCycleDuration,
                  times: [0, startTime, endTime, resetTime, 1],
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0,
                } : {
                  duration: animationDuration,
                  delay: i * staggerDelay,
                  ease: "easeInOut",
                }}
                className={`transition-opacity duration-500 ${hoveredPoint ? 'opacity-10' : 'opacity-100'}`}
              />
            </g>
          );
        })}

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          
          return (
            <g key={`points-group-${i}`}>
              {/* Point A */}
              <motion.g
                onHoverStart={() => setHoveredPoint(dot.start)}
                onHoverEnd={() => setHoveredPoint(null)}
                className="cursor-pointer pointer-events-auto"
                whileHover={{ scale: 1.25 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <circle cx={startPoint.x} cy={startPoint.y} r="3.5" fill={lineColor} filter="url(#glow)" />
                <circle cx={startPoint.x} cy={startPoint.y} r="3.5" fill={lineColor} opacity="0.4">
                  <animate attributeName="r" from="3.5" to="14" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="2.5s" repeatCount="indefinite" />
                </circle>
              </motion.g>

              {/* Point B */}
              <motion.g
                onHoverStart={() => setHoveredPoint(dot.end)}
                onHoverEnd={() => setHoveredPoint(null)}
                className="cursor-pointer pointer-events-auto"
                whileHover={{ scale: 1.25 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <circle cx={endPoint.x} cy={endPoint.y} r="3.5" fill={lineColor} filter="url(#glow)" />
                <circle cx={endPoint.x} cy={endPoint.y} r="3.5" fill={lineColor} opacity="0.4">
                  <animate attributeName="r" from="3.5" to="14" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </motion.g>
            </g>
          );
        })}
      </svg>
      
        {/* HUD Info Overlays */}
        <div className="absolute top-8 left-8 flex flex-col gap-3 z-30 pointer-events-none">
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-black tracking-[0.5em] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
            <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${isDark ? 'text-primary/70' : 'text-primary'}`}>Nodes Synchronized</span>
          </div>
        </div>

        <div className="absolute top-8 right-8 text-right z-30 pointer-events-none">
          <div className={`text-[11px] font-black tracking-[0.5em] uppercase mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Interactive Network</div>
          <div className={`text-[9px] font-mono tracking-tighter ${isDark ? 'text-white/20' : 'text-black/20'}`}>v4.0.2 / Orbital_Sync</div>
        </div>

        <div className="absolute bottom-8 right-8 text-right z-30 pointer-events-none">
          <div className={`text-[11px] font-black tracking-[0.5em] uppercase mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Discovery Mode</div>
          <div className={`text-[10px] font-black tracking-[0.3em] uppercase ${isDark ? 'text-white/60' : 'text-black/60'}`}>Hover to Converge</div>
        </div>

        {/* Zoom-in Preview Overlay */}
        <AnimatePresence mode="wait">
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.85, y: 30, filter: "blur(10px)" }}
              transition={{ 
                duration: 0.6, 
                ease: [0.16, 1, 0.3, 1]
              }}
              style={{
                left: Math.min(mousePos.x + 50, 500), // Prevent overflow
                top: Math.max(mousePos.y - 150, 20),
              }}
              className="absolute z-50 pointer-events-none w-80 md:w-96 p-1.5 rounded-[2.5rem] overflow-hidden"
            >
              <div className="relative rounded-[2.4rem] overflow-hidden dark:bg-black/90 bg-white shadow-[0_50px_150px_rgba(0,0,0,0.15)] border dark:border-white/20 border-black/10">
                {/* Background Image with Ken Burns Effect */}
                <div className="h-48 md:h-56 relative overflow-hidden">
                  <motion.img
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1.1 }}
                    src={hoveredPoint.img || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800"}
                    className="w-full h-full object-cover"
                    alt={hoveredPoint.label}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-black via-black/20 to-transparent' : 'from-white via-white/20 to-transparent'}`} />
                  
                  {/* Status Indicator Badge */}
                  <div className="absolute top-6 left-6 flex items-center gap-2.5 px-4 py-2 rounded-full dark:bg-black/60 bg-white/80 backdrop-blur-xl border dark:border-white/10 border-black/5 shadow-2xl">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-black tracking-[0.3em] dark:text-primary text-primary/80 uppercase">{hoveredPoint.status || "SYNCED"}</span>
                  </div>
                </div>

                {/* Content Layer */}
                <div className="p-8 md:p-10 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-[1px] bg-primary/40" />
                    <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>{hoveredPoint.region || "Global Node"}</span>
                  </div>
                  
                  <h3 className={`text-2xl md:text-3xl font-black mb-5 tracking-tighter uppercase leading-none ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    {hoveredPoint.label}
                  </h3>
                  
                  <p className={`text-[12px] md:text-sm font-medium leading-relaxed ${isDark ? 'text-white/60' : 'text-zinc-600'}`}>
                    {hoveredPoint.description || "Synthesizing localized exploratory data for high-intent architectural discovery and nodal optimization."}
                  </p>
                  
                  {/* Technical Meta Footer */}
                  <div className="mt-8 pt-8 border-t border-primary/10 flex justify-between items-center">
                    <div className="flex gap-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      ))}
                    </div>
                    <div className={`text-[9px] font-mono tracking-widest ${isDark ? 'text-white/20' : 'text-black/40'}`}>NODE_ID_{hoveredPoint.label?.substring(0, 3).toUpperCase()}_092</div>
                  </div>
                </div>
                
                {/* HUD Framing Accents */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t border-l dark:border-white/30 border-black/10 rounded-tl-[2.4rem]" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r dark:border-white/30 border-black/10 rounded-br-[2.4rem]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
