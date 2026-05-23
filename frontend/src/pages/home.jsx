/**
 * About Page — Travel-themed, wrapped in AppInnerLayout (dashboard navbar).
 * Adventure · Hiking · Trip Planning vibe. No robots, no tech animations.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import AppInnerLayout from "@/components/AppInnerLayout";
import BrandLogo from "@/components/BrandLogo";
import {
  Sparkles, Globe, Mountain, MapPin, Compass, Heart, Users,
  Star, Plane, Camera, ArrowRight, ChevronRight, Wind, Leaf,
  Tent, Map, Sun, Wallet, PlaneTakeoff, ShieldCheck
} from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import {
  HoverSlider,
  TextStaggerHover,
  HoverSliderImageWrap,
  HoverSliderImage,
} from "@/components/ui/animated-slideshow";
import { AnimatedTestimonials } from "@/components/ui/travel-testimonials";

/* ── Travel photo slideshow for hero ── */
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1600",
];

/* ── Team / mission columns ── */
const PILLARS = [
  {
    Icon: Compass,
    title: "AI-Powered Planning",
    desc: "Our engine processes millions of data points — climate, culture, halal venues, logistics — to build itineraries that feel personally handcrafted.",
    color: "from-amber-500/20 to-transparent",
    accent: "#D4AF37",
  },
  {
    Icon: Heart,
    title: "Built for Explorers",
    desc: "Rihla AI was born at the intersection of wanderlust and technology. Every feature is designed with the modern adventurer at heart.",
    color: "from-rose-500/20 to-transparent",
    accent: "#f43f5e",
  },
  {
    Icon: Globe,
    title: "Global Intelligence",
    desc: "From the mountains of Cappadocia to the shores of Maldives — our geospatial engine discovers hidden gems beyond the tourist grid.",
    color: "from-cyan-500/20 to-transparent",
    accent: "#06b6d4",
  },
  {
    Icon: Users,
    title: "Community Driven",
    desc: "Millions of travelers trust Rihla AI to plan perfect journeys. Every trip teaches our AI something new — making the next plan even better.",
    color: "from-emerald-500/20 to-transparent",
    accent: "#10b981",
  },
];

const STATS = [
  { value: "55+", label: "Destinations", Icon: MapPin },
  { value: "150+", label: "Currencies", Icon: Star },
  { value: "AI", label: "Powered", Icon: Sparkles },
  { value: "100%", label: "Halal", Icon: Leaf },
];

const JOURNEY_IMAGES = [
  { src: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=800", label: "Plan" },
  { src: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=800", label: "Explore" },
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", label: "Discover" },
  { src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800", label: "Adventure" },
];

function HeroSlideshow() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % HERO_IMAGES.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.img
          key={idx}
          src={HERO_IMAGES[idx]}
          alt="Travel"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      {/* Layered overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#060b18]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
    </div>
  );
}

export default function Home() {
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveImg(i => (i + 1) % JOURNEY_IMAGES.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <AppInnerLayout noPadding transparent>
      <div className="relative bg-[#060b18] text-white overflow-x-hidden">

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <HeroSlideshow />


          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 mb-8">
                <Tent className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Rihla AI · Your Journey Begins</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
                Explore the{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-[#D4AF37] to-amber-600">
                  Unknown
                </span>
                <br />
                <span className="text-white/80">Plan the</span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Perfect
                </span>
              </h1>

              <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                AI-powered travel planning that crafts personalized itineraries for every adventure — from mountain treks to coastal retreats.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/planner">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-3 px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(212,175,55,0.4)]"
                    style={{ background: "linear-gradient(135deg,#D4AF37,#B8860B)", color: "#000" }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Start Planning
                  </motion.button>
                </Link>
                <Link href="/explore">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-3 px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest border border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-all"
                  >
                    <Globe className="w-4 h-4" />
                    Explore Destinations
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto"
            >
              {STATS.map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
                  <s.Icon className="w-5 h-5" style={{ color: "#D4AF37" }} />
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── OUR STORY ── */}
        <section className="py-32 relative overflow-hidden">
          {/* Ambient background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.06)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.05)_0%,transparent_60%)]" />

          <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/70">Our Story</span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-6">
                Built for <span className="text-[#D4AF37]">Explorers</span>,<br />
                <span className="text-white/50">by Explorers</span>
              </h2>
              <p className="text-white/50 text-base max-w-2xl mx-auto leading-relaxed">
                Born at the intersection of AI and wanderlust — Rihla AI is the definitive compass for the modern discoverer.
              </p>
            </motion.div>

            {/* Journey Photo Mosaic + Story */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
              {/* Animated photo grid */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-2 gap-3 h-[480px]"
              >
                {JOURNEY_IMAGES.map((img, i) => (
                  <motion.div
                    key={img.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.7 }}
                    className={`relative overflow-hidden rounded-2xl group cursor-default border border-white/[0.08] ${i === 0 ? "row-span-2" : ""}`}
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <img
                      src={img.src}
                      alt={img.label}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      style={{ transitionDuration: "3s" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37]/80">{img.label}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <blockquote className="text-xl md:text-2xl font-bold text-white/90 leading-relaxed italic border-l-4 border-[#D4AF37] pl-6">
                  "We synthesize the infinite complexity of the globe into singular moments of perfect discovery."
                </blockquote>

                <p className="text-white/50 leading-relaxed">
                  Rihla AI processes millions of data points — climate patterns, cultural events, halal-certified venues, and flight logistics — to generate itineraries that feel personally crafted for every unique traveler.
                </p>

                <div className="space-y-4">
                  {[
                    { Icon: Mountain, text: "Adventure travel to mountains, deserts & beyond" },
                    { Icon: Camera, text: "Hidden gems beyond the usual tourist trail" },
                    { Icon: Sun, text: "Climate-perfect timing for every destination" },
                    { Icon: Map, text: "Fully customizable day-by-day itineraries" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
                        <item.Icon className="w-5 h-5" style={{ color: "#D4AF37" }} />
                      </div>
                      <span className="text-sm text-white/70 font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                <Link href="/planner">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-3 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest mt-4"
                    style={{ background: "linear-gradient(135deg,#D4AF37,#B8860B)", color: "#000" }}
                  >
                    <Plane className="w-4 h-4" />
                    Plan Your Journey
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </motion.div>
            </div>

            {/* Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PILLARS.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.7 }}
                  className="group relative p-7 rounded-2xl cursor-default overflow-hidden hover:-translate-y-2 transition-all duration-500"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${p.accent}15`, border: `1px solid ${p.accent}30` }}>
                      <p.Icon className="w-5 h-5" style={{ color: p.accent }} />
                    </div>
                    <h3 className="text-base font-black text-white mb-3 tracking-tight">{p.title}</h3>
                    <p className="text-xs text-white/40 leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT WE OFFER — HoverSlider ── */}
        <section className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.05)_0%,transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-[9px] font-black uppercase tracking-[0.45em] text-[#D4AF37]/60">What We Offer</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                Built for Every <span style={{ color: "#D4AF37" }}>Journey</span>
              </h2>
              <p className="text-white/35 text-sm mt-4 max-w-md">Hover a feature to see it in action.</p>
            </motion.div>

            <HoverSlider
              className="grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-16"
              defaultIndex={0}
            >
              {/* Feature list */}
              <div className="flex flex-col gap-1">
                {[
                  { name: "AI Itinerary Planning", icon: Sparkles    },
                  { name: "Halal Destinations",    icon: ShieldCheck  },
                  { name: "Budget Tracker",        icon: Wallet       },
                  { name: "Explore The Globe",     icon: Globe        },
                  { name: "Multi-Day Planner",     icon: Map          },
                  { name: "Smart Booking",         icon: PlaneTakeoff },
                ].map(({ name, icon: Icon }, i) => (
                  <div key={name} className="flex items-center gap-4 py-3 px-4 rounded-2xl group cursor-pointer transition-all hover:bg-white/[0.04]">
                    <Icon className="w-4 h-4 text-white/20 group-hover:text-[#D4AF37] transition-colors shrink-0" />
                    <TextStaggerHover
                      index={i}
                      text={name}
                      className="font-black text-xl md:text-2xl lg:text-3xl uppercase tracking-tighter text-white cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Image preview — fills the full right column */}
              <div className="w-full h-full">
                <HoverSliderImageWrap
                  className="rounded-2xl overflow-hidden w-full"
                  style={{ aspectRatio: "16/10", height: "100%" }}
                >
                  {[
                    "1469854523086-cc02fe5d8800",
                    "1539020140153-e479b8c22e70",
                    "1488646953014-85cb44e25828",
                    "1513415277900-a62401e19be4",
                    "1501785888041-af3ef285b470",
                    "1436491865332-7a61a109cc05",
                  ].map((photoId, i) => (
                    <HoverSliderImage
                      key={photoId}
                      index={i}
                      src={`https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&q=80&w=1200`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ))}
                </HoverSliderImageWrap>
              </div>
            </HoverSlider>
          </div>
        </section>

        {/* ── TRAVELER TESTIMONIALS ── */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.05)_0%,transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-4"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-[9px] font-black uppercase tracking-[0.45em] text-[#D4AF37]/60">Traveler Stories</span>
                <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
                World <span style={{ color: "#D4AF37" }}>Voices</span>
              </h2>
            </motion.div>
            <AnimatedTestimonials />
          </div>
        </section>

        {/* ── ADVENTURE BANNER ── */}
        <section className="relative overflow-hidden py-2">
          <div className="relative h-[380px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1600"
              alt="Adventure"
              className="absolute inset-0 w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060b18] via-black/60 to-[#060b18]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-4">Quran 29:20</p>
                <p className="text-2xl md:text-4xl font-black italic text-white max-w-3xl leading-tight">
                  "Travel through the earth and see how He originated creation."
                </p>
                <div className="mt-8 flex gap-4 justify-center">
                  <Link href="/planner">
                    <button className="px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest" style={{ background: "linear-gradient(135deg,#D4AF37,#B8860B)", color: "#000" }}>
                      Begin Your Rihla
                    </button>
                  </Link>
                  <Link href="/explore">
                    <button className="px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest border border-white/30 text-white hover:bg-white/10 transition-all">
                      Explore Destinations
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="relative overflow-hidden border-t border-white/[0.05]">
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)" }} />

          {/* Quote banner */}
          <div className="border-b border-white/[0.05]">
            <div className="container mx-auto px-6 md:px-10 max-w-7xl py-14 text-center">
              <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}>
                Rihla AI — The Journey
              </div>
              <p className="text-xl md:text-3xl font-black italic text-white max-w-3xl mx-auto leading-snug">
                "Travel through the earth and observe how He originated creation."
              </p>
              <p className="text-xs mt-4 font-bold tracking-[0.2em] uppercase text-white/50">— Quran 29:20</p>
            </div>
          </div>

          {/* Footer grid */}
          <div className="container mx-auto px-6 md:px-10 max-w-7xl py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-1">
                <BrandLogo size={32} />
                <p className="text-sm text-white/40 mt-5 leading-relaxed max-w-xs">
                  The world's most advanced halal travel intelligence platform — precision-crafted itineraries for the modern Muslim traveler.
                </p>
                <div className="flex gap-3 mt-7">
                  {[
                    { label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" },
                    { label: "IG", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
                  ].map(({ label, path }) => (
                    <a key={label} href="#" className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d={path} /></svg>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white">Platform</h4>
                <ul className="space-y-3">
                  {[["Dashboard", "/dashboard"], ["Explore", "/explore"], ["My Trips", "/my-trips"], ["Plan a Trip", "/planner"]].map(([name, path]) => (
                    <li key={name}><Link href={path}><span className="text-sm text-white/40 hover:text-white transition-colors cursor-pointer">{name}</span></Link></li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white">Company</h4>
                <ul className="space-y-3">
                  {["About Rihla", "How It Works", "Halal Standards", "Privacy Policy", "Terms of Service"].map(item => (
                    <li key={item}><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">{item}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white">Begin Your Rihla</h4>
                <div className="space-y-4">
                  <p className="text-sm text-white/40 leading-relaxed">
                    Start planning your perfect halal journey with AI-powered precision.
                  </p>
                  <p className="text-xs text-white/30 flex items-center gap-2">✉ support@rihla.ai</p>
                  <p className="text-xs text-white/30 flex items-center gap-2">◎ Available globally · 100% Halal Certified</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="container mx-auto px-6 md:px-10 max-w-7xl py-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-white/30">© 2026 Rihla AI · All rights reserved · Built with <span className="text-[#D4AF37]">♥</span> for the Ummah</p>
              <div className="flex items-center gap-6">
                {["Privacy", "Terms", "Cookies"].map(item => (
                  <a key={item} href="#" className="text-xs text-white/30 hover:text-white transition-colors">{item}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AppInnerLayout>
  );
}
