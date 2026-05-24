'use client'

import React, { useEffect, useRef, useState } from 'react';
import { SplineScene } from "@/components/ui/splite";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { MagneticWrapper } from "@/components/ui/luxury-animations";
import { useLocation } from "wouter";

/* ── Slide data: 12 Islamic + classic travel quotes ── */
const SLIDES = [
  {
    phrase: "EXPLORE THE\nUNKNOWN",
    quote: '"Do they not travel through the earth and see what was the end of those before them?"',
    author: "— QURAN 12:109",
  },
  {
    phrase: "TRAVERSE\nTHE EARTH",
    quote: '"He it is Who has made the earth subservient to you, so traverse its paths."',
    author: "— AL-MULK 67:15",
  },
  {
    phrase: "AI PRECISION\nTRAVEL",
    quote: '"Travel through the world and observe how He originated creation."',
    author: "— QURAN 29:20",
  },
  {
    phrase: "CHART YOUR\nJOURNEY",
    quote: '"I have indeed attained my desire of long wandering through the earth."',
    author: "— IBN BATTUTA",
  },
  {
    phrase: "SEEK\nKNOWLEDGE",
    quote: '"Whoever travels a path seeking knowledge, Allah eases for them a path to Paradise."',
    author: "— PROPHET MUHAMMAD ﷺ",
  },
  {
    phrase: "WANDER\nFREELY",
    quote: '"Leave your country in search of loftiness, and travel — in it are five benefits."',
    author: "— IMAM AL-SHAFI\'I",
  },
  {
    phrase: "BEYOND\nBOUNDARIES",
    quote: '"Life is either a daring adventure or nothing at all."',
    author: "— HELEN KELLER",
  },
  {
    phrase: "THE WORLD\nAWAITS",
    quote: '"The world is a book, and those who do not travel read only one page."',
    author: "— SAINT AUGUSTINE",
  },
  {
    phrase: "DISCOVER\nALL PATHS",
    quote: '"Travelling — it leaves you speechless, then turns you into a storyteller."',
    author: "— IBN BATTUTA",
  },
  {
    phrase: "NEURAL\nITINERARIES",
    quote: '"Not all those who wander are lost — some are guided by intelligence."',
    author: "— RIHLA AI",
  },
  {
    phrase: "TRAVERSE\nHISTORY",
    quote: '"Have they not traveled through the earth and observed the blessed end of those before them?"',
    author: "— QURAN 30:9",
  },
  {
    phrase: "PERFECT\nJOURNEY",
    quote: '"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes."',
    author: "— MARCEL PROUST",
  },
];

/* ── Luxury masked word reveal — each word slides up through a clip mask ── */
const MaskedWordReveal = ({ line, lineIndex, wordDelay = 0.14 }: { line: string; lineIndex: number; wordDelay?: number }) => {
  const words = line.split(" ");
  return (
    <div className="flex flex-wrap gap-x-4">
      {words.map((word, i) => (
        <div key={`${line}-${i}`} style={{ overflow: 'hidden', display: 'inline-block' }}>
          <motion.span
            initial={{ y: '105%' }}
            animate={{
              y: '0%',
              textShadow: ['0 0 40px rgba(212,175,55,0.55)', '0 0 0px rgba(212,175,55,0)'],
            }}
            exit={{ y: '-105%', transition: { duration: 0.4, delay: i * 0.04, ease: [0.55, 0, 1, 0.45] } }}
            transition={{
              y:          { duration: 0.85, delay: lineIndex * 0.32 + i * wordDelay, ease: [0.16, 1, 0.3, 1] },
              textShadow: { duration: 1.4,  delay: lineIndex * 0.32 + i * wordDelay, ease: 'easeOut' },
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </div>
      ))}
    </div>
  );
};

/* ── Heading: up to 2 lines, each line uses MaskedWordReveal ── */
const CinematicHeading = ({ phrase }: { phrase: string }) => {
  const lines = phrase.split('\n');
  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, lineIdx) => (
        <MaskedWordReveal key={`${phrase}-${lineIdx}`} line={line} lineIndex={lineIdx} />
      ))}
    </div>
  );
};

/* Count total words across all lines to compute quote delay */
function totalWords(phrase: string) {
  return phrase.split('\n').reduce((acc, line) => acc + line.split(' ').length, 0);
}

/* Quote — instant entry once quoteIdx updates (2200ms stagger is already in the hook) */
const SequentialQuote = ({ quote, author }: { quote: string; author: string }) => {
  const words = quote.split(" ");
  return (
    <motion.div
      className="space-y-2"
    >
      <div className="flex flex-wrap gap-x-1.5">
        {words.map((word, i) => (
          <motion.span
            key={`${quote}-${i}`}
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)", x: 10 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", x: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 1.1, 
              filter: "blur(8px)", 
              x: Math.random() * 40 - 20, 
              y: Math.random() * 20 - 10,
              transition: { duration: 0.6, delay: i * 0.02 } 
            }}
            transition={{ duration: 0.8, delay: 0.15 + i * 0.03, ease: [0.22, 1, 0.36, 1] }}
            className="text-[14px] leading-relaxed font-medium italic"
            style={{ color: 'hsl(var(--foreground))', display: 'inline-block' }}
          >
            {word}
          </motion.span>
        ))}
      </div>
      <motion.p 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10, filter: "blur(4px)" }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-[9px] uppercase tracking-[0.28em] font-black" 
        style={{ color: '#D4AF37' }}
      >
        {author}
      </motion.p>
    </motion.div>
  );
};

export function SplineHeroDemo() {
  const splineRef = useRef<any>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [quoteIdx,   setQuoteIdx]   = useState(0);
  const [, setLocation] = useLocation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Heading advances every 8s
  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % SLIDES.length), 8000);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!splineRef.current) return;
      const canvas = document.querySelector('#robot-canvas canvas') as HTMLElement;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (splineRef.current.emitEvent) splineRef.current.emitEvent('mouseMove', { x, y });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => { clearInterval(t); window.removeEventListener('mousemove', handleGlobalMouseMove); };
  }, []);

  // Compute distance from button to mouse for glow effect
  const [glowIntensity, setGlowIntensity] = useState(0);
  useEffect(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.sqrt(Math.pow(mousePos.x - centerX, 2) + Math.pow(mousePos.y - centerY, 2));
    const intensity = Math.max(0, 1 - dist / 300); // 300px radius
    setGlowIntensity(intensity);
  }, [mousePos]);

  // Quote lags 2200ms behind heading — heading word-reveals first, then quote fades in
  useEffect(() => {
    const timer = setTimeout(() => setQuoteIdx(slideIndex), 2200);
    return () => clearTimeout(timer);
  }, [slideIndex]);

  function onLoad(spline: any) { splineRef.current = spline; }

  const current      = SLIDES[slideIndex];
  const currentQuote = SLIDES[quoteIdx];

  return (
    /* Full viewport — always dark, no flash during theme transit */
    <div
      className="relative w-full h-screen"
      style={{ overflow: 'visible', transition: 'none' }}
    >

      {/* ── LEFT: text block ── */}
      <div
        className="absolute inset-y-0 left-0 w-full md:w-[55%] z-10
                    flex flex-col justify-center px-8 md:px-14 lg:px-20"
        style={{ background: 'none' }}
      >

        {/* Badge — premium gold minimal, /80 opacity for light-mode visibility */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="flex items-center gap-3 mb-8 w-fit select-none"
        >
          <div className="h-px w-7" style={{ background: 'linear-gradient(to right, transparent, #D4AF37)' }} />
          <div className="relative flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }} />
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: '#D4AF37', opacity: 0.45 }} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.32em]" style={{ color: 'hsl(var(--foreground)/0.80)' }}>
            Rihla AI · Travel Intelligence
          </span>
          <div className="h-px w-7" style={{ background: 'linear-gradient(to left, transparent, #D4AF37)' }} />
        </motion.div>

        {/* Cinematic heading — stagger word-reveal per slide */}
        <div className="mb-8" style={{ minHeight: '185px', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`heading-${slideIndex}`}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.35 } }}
              className="text-[clamp(54px,6.8vw,88px)] font-black text-foreground
                         tracking-[-0.03em] leading-[0.86]"
            >
              <CinematicHeading phrase={current.phrase} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quote — lags 2200ms behind heading for staggered reveal */}
        <div style={{ minHeight: '64px' }}>
          <AnimatePresence mode="wait">
            <SequentialQuote
              key={`quote-${quoteIdx}`}
              quote={currentQuote.quote}
              author={currentQuote.author}
            />
          </AnimatePresence>
        </div>

        {/* Slide indicators — vertical gold tick marks */}
        <div className="flex items-end gap-2.5 mt-6 mb-7">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlideIndex(i); }}
              aria-label={`Slide ${i + 1}`}
              className="flex-shrink-0 transition-all duration-500"
              style={{
                width: 2,
                height: i === slideIndex ? 26 : 10,
                borderRadius: 1,
                background: i === slideIndex
                  ? 'hsl(var(--foreground))'
                  : 'hsl(var(--muted-foreground)/0.22)',
              }}
            />
          ))}
        </div>

        {/* CTA — ultra-minimal text-link with animated gold underline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
        >
          <button
            ref={buttonRef}
            onClick={() => setLocation("/planner")}
            className="group flex items-center gap-4 bg-transparent border-none p-0 cursor-pointer relative"
          >
            {/* Reactive Glow Background */}
            <div 
              className="absolute -inset-x-8 -inset-y-4 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ 
                background: `radial-gradient(circle, hsl(var(--foreground) / ${0.15 * glowIntensity}) 0%, transparent 70%)`,
                filter: 'blur(12px)',
              }}
            />

            <span className="relative block overflow-hidden">
              <span
                className="block text-[10px] font-black uppercase tracking-[0.38em] transition-colors duration-300"
                style={{ color: glowIntensity > 0.5 ? 'hsl(var(--foreground))' : 'hsl(var(--foreground)/0.55)' }}
              >
                Generate Itinerary
              </span>
              {/* Gold underline sweeps in from left on hover */}
              <span
                className="absolute bottom-0 left-0 h-px transition-all duration-400 ease-out pointer-events-none"
                style={{ 
                  width: glowIntensity > 0.3 ? '100%' : '0%',
                  background: 'linear-gradient(to right, hsl(var(--foreground)), hsl(var(--foreground)/0.5))',
                  opacity: glowIntensity
                }}
              />
            </span>
            {/* Breathing arrow */}
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex-shrink-0"
              style={{ opacity: 0.5 + 0.5 * glowIntensity }}
            >
              <ArrowRight style={{ width: 11, height: 11, color: 'hsl(var(--foreground))', strokeWidth: 2.5 }} />
            </motion.span>
          </button>
        </motion.div>
      </div>
      {/* ── RIGHT: Spline robot canvas ── */}
      <div
        id="robot-canvas"
        className="absolute inset-y-0 hidden md:block"
        style={{ 
          overflow: 'visible', 
          zIndex: 1, 
          right: '-3%', 
          width: '56%', 
          top: 0, 
          bottom: 0,
          // Left-edge + bottom-edge alpha dissolve — works in all themes (no color dependency)
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 100%), linear-gradient(to top, transparent 0%, black 12%, black 100%)',
          WebkitMaskComposite: 'destination-in',
          maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 100%), linear-gradient(to top, transparent 0%, black 12%, black 100%)',
          maskComposite: 'intersect',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, filter: "blur(24px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 2.2, ease: "circOut" }}
          style={{ width: '100%', height: '100%', overflow: 'visible', position: 'relative' }}
        >
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
            onLoad={onLoad}
          />
          {/* Bottom dissolve — soft leg fade, max 0.22 opacity so no dark band forms */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: '60%',
              background: 'linear-gradient(to top, hsl(var(--background)/0.22) 0%, hsl(var(--background)/0.14) 18%, hsl(var(--background)/0.08) 38%, hsl(var(--background)/0.04) 60%, transparent 80%)',
              transition: 'none',
            }}
          />
        </motion.div>
      </div>

      {/* Left vignette — fades out before hero bottom so no dark band at boundary */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{
          width: '50%',
          zIndex: 3,
          background: 'linear-gradient(to right, hsl(var(--background)/0.7) 0%, hsl(var(--background)/0.65) 40%, hsl(var(--background)/0.25) 65%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 85%)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 85%)',
          transition: 'none',
        }}
      />

      {/* No section bridge — removed to eliminate the dark horizontal line at hero bottom */}
    </div>
  );
}
