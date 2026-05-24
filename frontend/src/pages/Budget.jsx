/**
 * Budget — "Financial Intelligence" data dashboard.
 * Left: vertical trip list with mini spend bar.
 * Right: large donut-style ring chart + breakdown cards.
 * Now integrated with AppInnerLayout and Aurora theme.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/use-auth";
import { useTrips } from "@/hooks/use-trips";
import {
  Wallet, TrendingUp, BarChart3, Plane, Sparkles,
  Loader2
} from "lucide-react";
import AppInnerLayout from "@/components/AppInnerLayout";

const SPLITS = {
  micro:    { Hotel:35, Food:30, Activities:15, Transport:12, Misc:8 },
  budget:   { Hotel:35, Food:28, Activities:18, Transport:12, Misc:7 },
  mid:      { Hotel:38, Food:25, Activities:20, Transport:10, Misc:7 },
  moderate: { Hotel:38, Food:25, Activities:20, Transport:10, Misc:7 },
  premium:  { Hotel:42, Food:25, Activities:18, Transport:9,  Misc:6 },
  luxury:   { Hotel:45, Food:25, Activities:18, Transport:7,  Misc:5 },
  ultra:    { Hotel:50, Food:25, Activities:15, Transport:6,  Misc:4 },
};

const CAT_META = {
  Hotel:      { color: "#a855f7", Icon: "🏨" }, // Violet
  Food:       { color: "#22d3b8", Icon: "🍽" }, // Cyan (was gold)
  Activities: { color: "#06b6d4", Icon: "🎯" }, // Sky
  Transport:  { color: "#6366f1", Icon: "✈️" }, // Indigo
  Misc:       { color: "#ec4899", Icon: "💼" }, // Pink
};

const CUR_SYMBOLS = { USD:"$", EUR:"€", GBP:"£", INR:"₹", JPY:"¥", AED:"د.إ", default:"$" };

/* SVG Donut chart */
function DonutChart({ splits, total, sym }) {
  const SIZE = 200;
  const STROKE = 28;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  const slices = Object.entries(splits).map(([k, pct]) => {
    const len = (pct / 100) * CIRC;
    const slice = { k, pct, len, offset };
    offset += len;
    return slice;
  });
  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
        {slices.map(({ k, len, offset: off }, i) => (
          <motion.circle key={k} cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
            stroke={CAT_META[k]?.color || "#fff"} strokeWidth={STROKE}
            strokeDasharray={`${len} ${CIRC}`} strokeDashoffset={-off}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${CIRC}` }}
            animate={{ strokeDasharray: `${len} ${CIRC}` }}
            transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }} />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Total</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>{sym}{(total/1000).toFixed(1)}k</div>
      </div>
    </div>
  );
}

export default function Budget() {
  const { data: user, isLoading } = useUser();
  const [, nav] = useLocation();
  const { data: trips = [] } = useTrips();
  const [sel, setSel] = useState(null);

  useEffect(() => { if (trips.length > 0 && !sel) setSel(trips[0]); }, [trips]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  );

  const grandTotal = trips.reduce((s, t) => s + (t.preferences?.budgetAmount || 0), 0);
  const currency = sel?.preferences?.currency || "USD";
  const sym = CUR_SYMBOLS[currency] || "$";
  const budgetAmt = sel?.preferences?.budgetAmount || 0;
  const days = Math.max(1, sel?.days || 1);
  const lvKey = sel?.preferences?.budgetLevel || sel?.budget || "mid";
  const splits = SPLITS[lvKey] || SPLITS.mid;

  return (
    <AppInnerLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-12 page-enter">
        
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-tag mb-4">SPEND OVERVIEW</div>
          <h1 className="font-display font-bold text-white leading-tight mb-4" style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}>
            Budget <span className="aurora-gradient-text">Intelligence</span>
          </h1>
          <p className="text-zinc-500 text-sm max-w-2xl">
            Financial AI analysis for your global journeys. Track spends and optimize travel costs.
          </p>
        </motion.div>

        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Planned", value: `${sym}${grandTotal.toLocaleString()}`, Icon: Wallet, color: "#22d3b8" },
            { label: "Trips",         value: trips.length,                        Icon: Plane,  color: "#a855f7" },
            { label: "Avg per Trip",  value: trips.length > 0 ? `${sym}${Math.round(grandTotal / trips.length).toLocaleString()}` : "—", Icon: BarChart3, color: "#06b6d4" },
            { label: "Avg per Day",   value: sel && budgetAmt > 0 ? `${sym}${Math.round(budgetAmt / days)}` : "—", Icon: TrendingUp, color: "#6366f1" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <s.Icon size={16} style={{ color: s.color }} className="mb-4" />
              <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {trips.length === 0 ? (
          <div className="glass-card rounded-3xl p-20 text-center border-dashed border-white/10">
            <Wallet className="w-12 h-12 text-zinc-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">No budgets yet</h3>
            <p className="text-zinc-500 text-sm mb-8">Plan your first trip to unlock AI budget analysis</p>
            <button onClick={() => nav("/planner")} className="btn-aurora">
              <Sparkles className="w-4 h-4" /> Plan a Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

            {/* Trip selector */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6">
                <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-4">Select Journey</div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {trips.map((t, i) => {
                    const active = sel?.id === t.id || sel?._id === t._id;
                    const ta = t.preferences?.budgetAmount || 0;
                    return (
                      <button key={i} onClick={() => setSel(t)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 border ${
                          active 
                            ? "bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20" 
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                        }`}>
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{t.destination || "Untitled"}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{t.days || "?"} days</div>
                          </div>
                          <div className={`text-xs font-bold ${active ? "text-cyan-400" : "text-zinc-400"}`}>
                            {sym}{ta.toLocaleString()}
                          </div>
                        </div>
                        {grandTotal > 0 && (
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(ta / grandTotal) * 100}%` }}
                              className={`h-full rounded-full ${active ? "bg-cyan-500" : "bg-zinc-700"}`} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main analysis */}
            {sel && (
              <motion.div key={sel.id || sel._id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

                {/* Header card with Donut */}
                <div className="glass-card rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full" />
                  
                  {/* Donut */}
                  <DonutChart splits={splits} total={budgetAmt} sym={sym} />
                  
                  {/* Legend */}
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-2">Selected Trip</div>
                    <h2 className="text-3xl font-bold text-white mb-2">{sel.destination}</h2>
                    <p className="text-xs text-zinc-500 mb-6 font-medium capitalize">{days} days · {lvKey} class</p>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(splits).map(([k]) => (
                        <div key={k} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_META[k]?.color }} />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{k}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="flex flex-col gap-3 shrink-0">
                    {[
                      { l: "Per Day",    v: `${sym}${Math.round(budgetAmt/days)}`,                           c: "text-cyan-400" },
                      { l: "Per Night",  v: `${sym}${Math.round(budgetAmt/Math.max(1,days-1))}`,             c: "text-violet-400" },
                      { l: "Hotel Avg",  v: `${sym}${Math.round(budgetAmt*splits.Hotel/100/Math.max(1,days-1))}`, c: "text-fuchsia-400" },
                    ].map((x, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-[140px]">
                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{x.l}</div>
                        <div className={`text-xl font-bold ${x.c}`}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category breakdown grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Object.entries(splits).map(([k, pct]) => {
                    const catAmt = Math.round(budgetAmt * pct / 100);
                    const perDay = Math.round(catAmt / days);
                    const { color } = CAT_META[k] || { color: "#fff" };
                    return (
                      <motion.div key={k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}80, transparent)` }} />
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">{k}</div>
                        <div className="text-3xl font-bold mb-2 transition-transform duration-500 group-hover:translate-x-1" style={{ color }}>{sym}{catAmt.toLocaleString()}</div>
                        <div className="text-[11px] text-zinc-500 font-medium">{sym}{perDay}/day · {pct}% of total</div>
                        
                        <div className="mt-6 h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} 
                            style={{ background: color }} className="h-full rounded-full" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </AppInnerLayout>
  );
}
