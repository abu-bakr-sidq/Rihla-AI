/**
 * Dashboard — Premium post-login landing.
 * Hero welcome • Stats • AI Features strip • Recent Trips • Insight banner
 */
import React, { useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useTrips } from "@/hooks/use-trips";
import AppInnerLayout from "@/components/AppInnerLayout";
import DashboardSlideshow from "@/components/ui/DashboardSlideshow";
import { LampContainer } from "@/components/ui/lamp";
import { 
  Sparkles, TrendingUp, Clock, CheckCircle2, ArrowRight, Zap, Shield, Layout, Globe, MapPin, CalendarDays, Compass, PlaneTakeoff, Bell, Search, Plus, Activity, Star, Lock, Bot
} from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

function formatCurrency(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function AnimatedValue({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.floor);
  const formatted = useTransform(rounded, (latest) => new Intl.NumberFormat('en-US').format(latest));

  const strVal = String(value);
  // Match prefix, number (with optional commas), and suffix
  const match = strVal.match(/^([^0-9]*)([0-9,]+)(.*)$/);

  useEffect(() => {
    if (match) {
      const numStr = match[2].replace(/,/g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num)) {
        const controls = animate(count, num, { duration: 1.8, ease: "easeOut" });
        return controls.stop;
      }
    }
  }, [value, count, match]);

  if (match && !isNaN(parseInt(match[2].replace(/,/g, ''), 10))) {
    const prefix = match[1];
    const suffix = match[3];
    return (
      <span className="inline-flex items-center">
        {prefix}
        <motion.span>{formatted}</motion.span>
        {suffix}
      </span>
    );
  }

  // Fallback for purely text strings like "Explorer"
  return <span>{value}</span>;
}

export default function Dashboard() {
  const [, nav] = useLocation();
  const { data: user, isLoading } = useUser();
  const { data: trips = [] } = useTrips();

  // Guest mode: use empty trips when not logged in
  const safeTripList = user ? trips : [];
  const activeTrips    = safeTripList.filter(t => t.status === "active" || t.status === "planned");
  const completedTrips = safeTripList.filter(t => t.status === "completed");

  // Dynamic Intelligence Calculations
  const uniqueDestinations = new Set(safeTripList.map(t => t.destination)).size;
  const totalBudget = safeTripList.reduce((acc, t) => acc + (Number(t.budget) || 0), 0);
  
  // Calculate Top Travel Style DNA
  const styleCount = safeTripList.reduce((acc, t) => {
    if (t.travelStyle) acc[t.travelStyle] = (acc[t.travelStyle] || 0) + 1;
    return acc;
  }, {});
  const topStyle = Object.keys(styleCount).sort((a,b) => styleCount[b] - styleCount[a])[0] || "Explorer";

  // Dynamic User Stats
  const dynamicStats = [
    { label: "Places Explored", value: uniqueDestinations,        Icon: MapPin,       color: "text-emerald-400",    note: "Destinations" },
    { label: "Active Trips",    value: activeTrips.length,        Icon: CalendarDays, color: "text-[#D4AF37]",    note: "Upcoming" },
    { label: "Travel DNA",      value: topStyle,                  Icon: Zap,          color: "text-purple-400",     note: "Travel Vibe", capitalize: true },
    { label: "Total Logs",      value: safeTripList.length,       Icon: Activity,     color: "text-blue-400",       note: "Saved Itineraries" },
  ];

  // Generic AI Features for Guests
  const aiFeats = [
    { tag: "INTELLIGENCE",  title: "Smart AI Planner",    desc: "Intelligent itineraries tailored to your style, budget, and travel philosophy.", Icon: Sparkles },
    { tag: "FINANCE",       title: "Budget Optimizer",    desc: "Real-time cost analysis across 150+ currencies with zero-drift forecasting.",    Icon: TrendingUp },
    { tag: "GEOSPATIAL",    title: "Global Discovery",    desc: "Geospatial intelligence surfacing hidden gems well beyond the tourist grid.",     Icon: Globe },
    { tag: "ADAPTIVE",      title: "AI Personalization",  desc: "Learns your preferences and refines every recommendation to perfection.",        Icon: Zap },
  ];

  return (
    <AppInnerLayout>
      <div className="relative min-h-screen">
        {/* Premium Ken Burns Background Slideshow */}
        <div className="fixed inset-0 z-[-1]">
          <DashboardSlideshow />
          <div className="absolute inset-0 bg-black/50 pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-8 space-y-8 md:space-y-10 page-enter">
          
          {/* ── HERO WELCOME with LAMP ── */}
          <LampContainer className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              className="flex flex-col items-center text-center"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-black text-white leading-[0.95] mb-4 tracking-tighter uppercase" 
                style={{ fontSize: "clamp(2.25rem,5vw,4rem)" }}
              >
                {user ? (
                  <>Welcome back, <br />
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-yellow-200 to-[#D4AF37] drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
                  >
                    {user?.username}
                  </motion.span></>
                ) : (
                  <>
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                      className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-yellow-200 to-[#D4AF37] drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
                    >
                      RIHLA AI
                    </motion.span>
                    <br />Your AI Travel Partner
                  </>
                )}
              </motion.h1>
              
              <p className="text-white/90 text-base font-jakarta max-w-2xl mb-6 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                {user 
                  ? "Your Intelligence Center is online. Track your global footprint, active deployments, and travel architecture."
                  : "Discover, plan, and explore your perfect journey with AI-powered precision. Sign in to unlock all features."
                }
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/planner">
                  <button className="btn-gold px-8 py-3.5 text-xs font-black uppercase tracking-widest shadow-[0_20px_60px_rgba(212,175,55,0.3)] transition-all rounded-xl">
                    <Sparkles className="w-4 h-4" /> Initiate AI Planning
                  </button>
                </Link>
                {user && (
                  <Link href="/my-trips">
                    <button className="btn-outline-white px-8 py-3.5 text-xs font-black uppercase tracking-widest bg-black/40 backdrop-blur-md hover:bg-white/10 transition-all rounded-xl border-white/20 flex items-center gap-2">
                      <Compass className="w-4 h-4" /> Explore Now
                    </button>
                  </Link>
                )}
              </div>
            </motion.div>
          </LampContainer>

          {user ? (
            /* ── LOGGED IN INTELLIGENCE CENTER ── */
            <div className="space-y-8 md:space-y-10">
              
              {/* Personalized Dynamic Stats */}
              <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
                <div className="flex items-center gap-3 mb-4 px-4">
                  <Activity className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="font-display font-bold text-white text-2xl tracking-tight uppercase">Travel Analytics</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
                  {dynamicStats.map((s, i) => (
                    <GlowingCard key={i} className="p-6 relative overflow-hidden group/stat">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shadow-inner group-hover/stat:scale-110 transition-transform duration-500">
                          <s.Icon className={`w-4 h-4 ${s.color}`} strokeWidth={2} />
                        </div>
                        <div className="text-[10px] font-black tracking-[0.2em] text-zinc-300 uppercase pt-2">{s.note}</div>
                      </div>
                      
                      <div className="space-y-0.5 relative z-10">
                        <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.15em]">{s.label}</div>
                        <div className={`font-display font-medium text-white text-3xl tracking-tight ${s.capitalize ? 'capitalize' : ''} truncate`}>
                          <AnimatedValue value={s.value} />
                        </div>
                      </div>
                    </GlowingCard>
                  ))}
                </div>
              </motion.section>

              {/* Comprehensive Recent Activity */}
              <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-5 px-4">
                  <div>
                    <h2 className="font-display font-bold text-white text-3xl tracking-tight uppercase flex items-center gap-3">
                      <Compass className="w-7 h-7 text-[#D4AF37]" /> Recent Trips
                    </h2>
                    <p className="text-zinc-300 text-sm mt-2">Your most recently crafted travel itineraries and dream destinations.</p>
                  </div>
                  <Link href="/my-trips">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:border-[#D4AF37]/40 text-[#D4AF37] text-xs font-black uppercase tracking-widest transition-all bg-black/40 backdrop-blur-sm shadow-xl">
                      View All Trips <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>

                {trips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-4">
                    {trips.slice(0, 6).map((trip, i) => (
                      <motion.div key={trip.id} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 + i * 0.05 }} className="h-full">
                        <Link href={`/trips/${trip.id}`}>
                          <div className="h-full bg-black/40 backdrop-blur-xl border border-white/[0.08] hover:border-[#D4AF37]/40 rounded-2xl overflow-hidden cursor-pointer group transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col relative">
                            {/* Card Accent */}
                            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent group-hover:via-[#D4AF37] transition-colors" />
                            
                            <div className="p-5 flex-1 flex flex-col relative z-10">
                              <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-inner">
                                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md bg-white/[0.05] text-[#D4AF37] border border-[#D4AF37]/20 flex items-center gap-1.5 shadow-[0_0_10px_rgba(212,175,55,0.05)]">
                                  <div className={`w-1.5 h-1.5 rounded-full ${trip.status === 'completed' ? 'bg-emerald-400' : 'bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]'}`} />
                                  {trip.status || "planned"}
                                </span>
                              </div>
                              <h3 className="font-display font-bold text-white text-xl truncate tracking-tight mb-3 group-hover:text-[#D4AF37] transition-colors">{trip.destination}</h3>
                              <div className="space-y-2 mt-auto">
                                <div className="flex items-center gap-2 text-xs text-white/60">
                                  <CalendarDays className="w-3.5 h-3.5 text-[#D4AF37]/60" /> 
                                  <span className="font-medium tracking-wide">{trip.startDate}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-t border-white/[0.05] pt-3 mt-3">
                                  <span className="flex items-center gap-1.5 text-white/50 uppercase tracking-widest text-[9px] font-bold">
                                    <Star className="w-3 h-3 text-[#D4AF37]/60" /> {trip.travelStyle || "Bespoke"}
                                  </span>
                                  <span className="text-[#D4AF37] font-black tracking-widest">{formatCurrency(trip.budget || 0, trip.currency)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4">
                    <Link href="/planner">
                      <div className="glass-card rounded-3xl p-6 md:p-10 text-center border-dashed border-white/[0.1] hover:border-[#D4AF37]/50 relative group overflow-hidden bg-black/30 backdrop-blur-xl cursor-pointer transition-all duration-500 shadow-[0_0_30px_transparent] hover:shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col items-center">
                        
                        {/* AI Robot + Thought Bubble */}
                        <div className="relative mb-8 flex flex-col items-center">
                          {/* Thought Bubble */}
                          <div className="relative bg-white/[0.04] border border-[#D4AF37]/40 rounded-3xl px-6 py-4 backdrop-blur-md mb-6 transform group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
                            <p className="text-[#D4AF37] font-display font-medium text-lg md:text-xl tracking-tight leading-relaxed max-w-sm">"You've got no plans yet... Let's start mapping out your next dream vacation!"</p>
                            
                            {/* Tail of the thought bubble (Connecting to Robot) */}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#0a0a0a]/50 backdrop-blur-sm border-b border-r border-[#D4AF37]/40 rotate-45 transform" />
                            <div className="absolute -bottom-7 left-1/2 translate-x-4 w-3 h-3 rounded-full bg-[#0a0a0a]/50 backdrop-blur-sm border border-[#D4AF37]/40 shadow-sm" />
                            <div className="absolute -bottom-11 left-1/2 translate-x-7 w-1.5 h-1.5 rounded-full bg-[#0a0a0a]/50 backdrop-blur-sm border border-[#D4AF37]/40 shadow-sm" />
                          </div>
                      
                          {/* Bot Base */}
                          <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 flex items-center justify-center group-hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all duration-700 relative z-10">
                            <Bot className="w-9 h-9 text-[#D4AF37]" />
                          </div>
                        </div>

                        <button className="btn-gold px-12 py-4 text-xs font-black tracking-widest uppercase rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.2)] transition-all flex items-center gap-2 group-hover:scale-105 group-hover:shadow-[0_0_60px_rgba(212,175,55,0.4)]">
                          <Sparkles className="w-4 h-4" /> Start Planning
                        </button>
                      </div>
                    </Link>
                  </div>
                )}
              </motion.section>
            </div>
          ) : (
            /* ── GUEST MODE: MARKETING & AI FEATURES ── */
            <div className="space-y-16">
              {/* Static Stats Bento */}
              <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
                  {[
                    { label: "Currency Support", value: "150+", Icon: Globe, color: "text-[#D4AF37]", note: "Global" },
                    { label: "Generation Time",  value: "< 3s", Icon: Zap, color: "text-[#D4AF37]", note: "Speed" },
                    { label: "Data Points",      value: "10M+", Icon: Search, color: "text-[#D4AF37]", note: "Scale" },
                    { label: "Optimization",     value: "99%",  Icon: TrendingUp, color: "text-[#D4AF37]", note: "Precision" },
                  ].map((s, i) => (
                    <GlowingCard key={i} className="p-8 group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                          <s.Icon className={`w-5 h-5 ${s.color}`} strokeWidth={1.5} />
                        </div>
                        <div className="text-[10px] font-black tracking-[0.2em] text-zinc-300 uppercase pt-2">{s.note}</div>
                      </div>
                      
                      <div className="space-y-1 relative z-10">
                        <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">{s.label}</div>
                        <div className="font-display font-medium text-white text-3xl tracking-tight">
                          <AnimatedValue value={s.value} />
                        </div>
                      </div>
                    </GlowingCard>
                  ))}
                </div>
              </motion.section>

              {/* AI Features Strip */}
              <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="px-4">
                <div className="text-center mb-16">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.05)" }}
                  >
                    <Globe className="w-3 h-3 text-[#D4AF37]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">RIHLA INTELLIGENCE CORE</span>
                  </motion.div>
                  <h2 className="font-display font-bold text-white text-4xl md:text-5xl tracking-tight mb-4 uppercase">
                    Precision <span className="aurora-gradient-text">Engineering</span>
                  </h2>
                  <p className="text-white/80 text-base max-w-lg mx-auto leading-relaxed">
                    Where sophisticated algorithms meet the human art of global exploration.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {aiFeats.map((f, i) => (
                    <GlowingCard key={i} className="p-8 h-full bg-black/40 backdrop-blur-xl border border-white/[0.08]">
                      <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center mb-8 group-hover/card:bg-[#D4AF37]/10 transition-colors relative z-10 shadow-inner">
                        <f.Icon className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
                      </div>
                      <div className="text-[10px] font-black tracking-[0.25em] text-[#D4AF37]/80 uppercase mb-3 relative z-10">{f.tag}</div>
                      <h3 className="font-display font-bold text-white text-xl mb-3 tracking-tight relative z-10">{f.title}</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed relative z-10 font-medium">{f.desc}</p>
                    </GlowingCard>
                  ))}
                </div>
              </motion.section>

              {/* Guest CTA */}
              <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
                <div className="px-4">
                  <div className="glass-card rounded-[3rem] p-20 text-center border-solid border-white/[0.08] relative group overflow-hidden bg-black/40 backdrop-blur-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                      <PlaneTakeoff className="w-10 h-10 text-white/40 group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                    <h3 className="font-display font-bold text-white text-4xl mb-4 tracking-tight uppercase">Begin your Matrix.</h3>
                    <p className="text-white/80 text-lg mb-10 max-w-md mx-auto font-jakarta leading-relaxed">
                      Initialize your account to save calculations, track your telemetry, and access the global exploration logs.
                    </p>
                    <Link href="/auth">
                      <button className="btn-gold px-12 py-5 text-sm font-black uppercase tracking-widest rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all hover:scale-105 flex mx-auto items-center gap-3">
                        <Lock className="w-5 h-5" /> Initialize Access
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.section>
            </div>
          )}

        </div>
      </div>
    </AppInnerLayout>
  );
}
