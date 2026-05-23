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
import { PlaceImage } from "@/hooks/use-place-image";
import { getTripCardImageQuery } from "@/lib/trip-itinerary";
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

function parseSafeNum(val) {
  if (val == null) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getTripBudgetAmount(trip = {}) {
  if (trip.itinerary?.total_budget?.total) return parseSafeNum(trip.itinerary.total_budget.total);
  if (trip.costBreakdown?.total) return parseSafeNum(trip.costBreakdown.total);
  if (trip.budget != null) return parseSafeNum(trip.budget);
  if (trip.preferences?.budgetAmount) return parseSafeNum(trip.preferences.budgetAmount);
  return 0;
}

function formatTripDate(dateValue) {
  if (!dateValue) return "Date flexible";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date flexible";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function calcTripDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(1, Math.ceil((end - start) / 86400000));
}

function getTripStatusMeta(status = "") {
  const normalized = String(status || "planned").toLowerCase();
  if (normalized === "completed") return { label: "Completed", color: "#4ade80" };
  if (normalized === "active") return { label: "Active", color: "#22d3ee" };
  if (normalized === "draft") return { label: "Draft", color: "#a1a1aa" };
  return { label: "Planned", color: "#D4AF37" };
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
                      <motion.div key={trip.id || trip._id || `${trip.destination}-${i}`} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 + i * 0.05 }} className="h-full">
                        <Link href={`/trips/${trip.id || trip._id}`}>
                          <div className="group relative h-[320px] overflow-hidden rounded-[26px] cursor-pointer transition-all duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)] hover:-translate-y-1 border border-white/[0.08]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_42%),linear-gradient(180deg,#162233_0%,#0a111d_100%)]" />
                            <div className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-110">
                              <PlaceImage
                                query={getTripCardImageQuery(trip)}
                                photoIndex={0}
                                onlyGoogle={true}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,12,0.96)_0%,rgba(2,6,12,0.45)_40%,rgba(2,6,12,0.08)_100%)]" />

                            {(() => {
                              const budget = getTripBudgetAmount(trip);
                              const currency = trip.currency || trip.preferences?.currency || "USD";
                              const travelers = trip.travelers || trip.preferences?.travelers || 1;
                              const travelStyle = trip.travelStyle || trip.preferences?.travelStyle || "Bespoke";
                              const days = trip.itinerary?.trip_overview?.total_days || trip.days || calcTripDays(trip.startDate, trip.endDate);
                              const statusMeta = getTripStatusMeta(trip.status);
                              return (
                                <>
                                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                                    <span
                                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md"
                                      style={{ color: statusMeta.color, border: `1px solid ${statusMeta.color}35` }}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusMeta.color }} />
                                      {statusMeta.label}
                                    </span>
                                    {days > 0 && (
                                      <span className="flex items-center gap-1 text-[9px] font-black text-white/70 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                        <Clock className="w-2.5 h-2.5" /> {days} Days
                                      </span>
                                    )}
                                  </div>

                                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 z-10 transition-transform duration-500 ease-out group-hover:-translate-y-10">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#D4AF37]/88 mb-2">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">{trip.destination}</span>
                                    </div>
                                    <h3 className="font-display font-bold text-white text-[1.5rem] leading-tight tracking-tight group-hover:text-[#D4AF37] transition-colors">
                                      {trip.destination}
                                    </h3>
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-white/72">
                                      <span className="flex items-center gap-1.5">
                                        <CalendarDays className="w-3.5 h-3.5 text-[#D4AF37]/65" />
                                        {formatTripDate(trip.startDate)}
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <Star className="w-3.5 h-3.5 text-[#D4AF37]/65" />
                                        <span className="capitalize">{travelStyle}</span>
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <PlaneTakeoff className="w-3.5 h-3.5 text-[#D4AF37]/65" />
                                        {travelers} Traveler{travelers > 1 ? "s" : ""}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="absolute left-0 right-0 -bottom-16 px-5 md:px-6 pb-5 z-10 transition-all duration-500 ease-out group-hover:bottom-0 opacity-0 group-hover:opacity-100">
                                    <div className="flex items-end justify-between rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl px-4 py-3">
                                      <div>
                                        <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.24em]">Planned Budget</p>
                                        <p className="text-base font-black text-[#D4AF37] mt-1">
                                          {formatCurrency(budget, currency)}
                                        </p>
                                      </div>
                                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-[0.16em]">
                                        Open Trip
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </span>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}

                            <div
                              className="absolute inset-0 rounded-[26px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                              style={{ boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.2)" }}
                            />
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
