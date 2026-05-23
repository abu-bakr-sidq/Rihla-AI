/**
 * MyTrips — Cinematic travel passport.
 * Full-page DashboardSlideshow bg. No banner card.
 * Empty: clean text over bg + card-21 destination grid.
 * Has trips: search/filter + card-7 grid + card-21 suggestions.
 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTrips, useDeleteTrip, useDeleteAllTrips } from "@/hooks/use-trips";
import { useToast } from "@/hooks/use-toast";
import AppInnerLayout from "@/components/AppInnerLayout";
import DashboardSlideshow from "@/components/ui/DashboardSlideshow";
import { DestinationCard } from "@/components/ui/card-21";
import { PlaceImage } from "@/hooks/use-place-image";
import { getTripCardImageQuery } from "@/lib/trip-itinerary";
import {
  MapPin, Calendar, Trash2, ArrowRight, Loader2, Sparkles,
  Users, ExternalLink, Clock, PlaneTakeoff, Globe,
  Search, X, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";

/* ─── Photo map ─────────────────────────────────────────────────── */
const DEST_PHOTO = {
  dubai: "1512453979798-5ea266f8880c",
  istanbul: "1524231757912-21f4fe3a7200",
  maldives: "1514282401047-d79a71a590e8",
  kyoto: "1493976040374-85c8e12f0c0e",
  santorini: "1570077188670-e3a8d69ac5ff",
  marrakech: "1539020140153-e479b8c22e70",
  petra: "1547560947-8e06a3e07f21",
  bali: "1537953773345-d172ccf13cf1",
  tokyo: "1540959733332-eab4deabeeaf",
  paris: "1502602228474-5084ce11ef2d",
  rome: "1552832230-c0197dd311b5",
  barcelona: "1583422409516-2895a77efded",
  singapore: "1483683804023-6ccdb62f86ef",
  cappadocia: "1501233321-242857440498",
  default: "1469854523086-cc02fe5d8800",
};

const STATUS_CFG = {
  planned: { label: "Planned", color: "#D4AF37" },
  active: { label: "Active", color: "#22d3ee" },
  completed: { label: "Done", color: "#4ade80" },
  draft: { label: "Draft", color: "#71717a" },
};

/* Card-21 theme colors per destination */
const DEST_THEME = {
  "Kyoto": "30 60% 20%",
  "Santorini": "210 70% 25%",
  "Maldives": "185 65% 22%",
  "Cappadocia": "24 55% 22%",
  "Bali": "150 45% 20%",
  "Dubai": "250 50% 28%",
  "Istanbul": "0 55% 22%",
  "Paris": "220 45% 25%",
  "Marrakech": "28 65% 22%",
  "Petra": "20 50% 22%",
};

const SUGGESTED_CARDS = [
  { name: "Kyoto", country: "Japan", score: 98, tags: ["Cultural", "Spiritual"], photo: "1493976040374-85c8e12f0c0e" },
  { name: "Santorini", country: "Greece", score: 99, tags: ["Luxury", "Scenic"], photo: "1570077188670-e3a8d69ac5ff" },
  { name: "Maldives", country: "Maldives", score: 98, tags: ["Beach", "Luxury"], photo: "1514282401047-d79a71a590e8" },
  { name: "Cappadocia", country: "Turkey", score: 96, tags: ["Adventure", "Scenic"], photo: "1501233321-242857440498" },
  { name: "Bali", country: "Indonesia", score: 94, tags: ["Nature", "Relax"], photo: "1537953773345-d172ccf13cf1" },
  { name: "Dubai", country: "UAE", score: 97, tags: ["Luxury", "Modern"], photo: "1512453979798-5ea266f8880c" },
  { name: "Paris", country: "France", score: 93, tags: ["Romance", "Cultural"], photo: "1502602228474-5084ce11ef2d" },
  { name: "Istanbul", country: "Turkey", score: 95, tags: ["History", "Cultural"], photo: "1524231757912-21f4fe3a7200" },
];

function getTripPhoto(dest = "") {
  const k = Object.keys(DEST_PHOTO).find(k => dest.toLowerCase().includes(k)) ?? "default";
  return `https://images.unsplash.com/photo-${DEST_PHOTO[k]}?q=80&w=900&auto=format&fit=crop`;
}
function fmtCur(n, cur = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n); }
  catch { return `$${n}`; }
}
function fmtDate(d) {
  if (!d) return "-";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
}
function calcDays(s, e) {
  if (!s || !e) return 0;
  return Math.max(1, Math.ceil((new Date(e) - new Date(s)) / 86400000));
}

/* ════════════════════════════════════════════════════════════════════
   DELETE DIALOG
   ════════════════════════════════════════════════════════════════════ */
function DeleteDialog({ trip, onConfirm, onCancel, isPending }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 16 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xs rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
        style={{ background: "#0c1420", border: "1px solid rgba(239,68,68,0.2)" }}>
        <div className="relative h-28 overflow-hidden">
          <PlaceImage
            query={getTripCardImageQuery(trip)}
            onlyGoogle={true}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/30 to-[#0c1420]" />
          <p className="absolute bottom-3 left-4 text-white font-black text-sm">{trip?.destination}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-white/60 text-xs leading-relaxed">Delete this itinerary permanently?</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-xs font-black uppercase tracking-wider transition-all">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)", color: "#fff" }}>
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   DELETE ALL DIALOG
   ════════════════════════════════════════════════════════════════════ */
function DeleteAllDialog({ onConfirm, onCancel, isPending }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 16 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
        style={{ background: "#0c1420", border: "1px solid rgba(239,68,68,0.2)" }}>

        <div className="p-6 text-center space-y-4 shadow-inner">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-red-500/10 border border-red-500/20 mb-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-black text-white">Erase Passport?</h3>
          <p className="text-white/60 text-sm leading-relaxed pb-2">
            This will permanently incinerate <strong>every single trip</strong> you have ever planned. This action cannot be reversed.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white text-xs font-black uppercase tracking-wider transition-all">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={isPending}
              className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)", color: "#fff", boxShadow: "0 8px 24px rgba(239,68,68,0.3)" }}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Erase All
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TRIP CARD (card-7 hover style)
   ════════════════════════════════════════════════════════════════════ */
function TripCard({ trip, onDelete, i }) {
  const parseSafeNum = (val) => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/[^0-9.]/g, '');
    return Number(clean) || 0;
  };

  const getBudgetAmount = () => {
    if (trip.itinerary?.total_budget?.total) return parseSafeNum(trip.itinerary.total_budget.total);
    if (trip.costBreakdown?.total) return parseSafeNum(trip.costBreakdown.total);
    if (trip.budget && !isNaN(trip.budget)) return Number(trip.budget);
    if (trip.preferences?.budgetAmount) return parseSafeNum(trip.preferences.budgetAmount);
    return 0;
  };
  const budget = getBudgetAmount();
  const currency = trip.currency || trip.preferences?.currency || "USD";
  const travelers = trip.travelers || trip.preferences?.travelers || 1;
  const tStyle = trip.travelStyle || trip.preferences?.travelStyle || "";
  const status = (trip.status || "planned").toLowerCase();
  const days = trip.itinerary?.trip_overview?.total_days || trip.days || calcDays(trip.startDate, trip.endDate);
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  const tripImageQuery = getTripCardImageQuery(trip);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(i * 0.07, 0.5), duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="group relative w-full overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)] hover:-translate-y-1"
        style={{ height: 320, border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_42%),linear-gradient(180deg,#162233_0%,#0a111d_100%)]" />
        <div className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-110">
          <PlaceImage
            query={tripImageQuery}
            photoIndex={0}
            onlyGoogle={true}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,12,0.96)_0%,rgba(2,6,12,0.38)_45%,rgba(2,6,12,0.08)_100%)]" />

        {/* Status + days */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-full"
            style={{ color: cfg.color, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: `1px solid ${cfg.color}30` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
            {cfg.label}
          </span>
          {days > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black text-white/55 bg-black/50 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
              <Clock className="w-2.5 h-2.5" />{days}d
            </span>
          )}
        </div>

        {/* Content slides up */}
        <div className="absolute bottom-0 left-0 right-0 p-5 transition-transform duration-500 ease-out group-hover:-translate-y-14">
          <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]/88 mb-1">
            <MapPin className="w-2.5 h-2.5" />{trip.destination}
          </p>
          <h3 className="text-[1.15rem] font-black text-white leading-tight tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]">{trip.destination}</h3>
          {tStyle && <p className="text-[10px] text-white/58 font-medium capitalize mt-0.5">{tStyle} style</p>}
          <div className="flex items-center gap-3 mt-2 opacity-100 transition-opacity duration-300 delay-75">
            <span className="flex items-center gap-1 text-[10px] text-white/72">
              <Calendar className="w-3 h-3" />{fmtDate(trip.startDate)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/72">
              <Users className="w-3 h-3" />{travelers}
            </span>
          </div>
        </div>

        {/* Action CTA from below */}
        <div className="absolute -bottom-16 left-0 right-0 px-5 pb-4 transition-all duration-500 ease-out group-hover:bottom-0 opacity-0 group-hover:opacity-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] text-white/25 font-black uppercase tracking-widest">Budget</p>
              <p className="text-sm font-black text-[#D4AF37] mt-0.5">{fmtCur(budget, currency)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/trips/${trip.id || trip._id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
                style={{ background: "#D4AF37", color: "#000" }}
              >
                <ExternalLink className="w-3 h-3" /> View
              </Link>
              <button onClick={() => onDelete(trip)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/[0.06]">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.2)" }} />
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SUGGESTED DESTINATIONS — card-21 grid (replaces big carousel)
   ════════════════════════════════════════════════════════════════════ */
function SuggestedGrid() {
  return (
    <section className="pt-12 pb-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.45em] text-[#D4AF37]/50 mb-1.5">Rihla AI Picks</p>
          <h2 className="font-black text-white text-2xl md:text-3xl tracking-tight">Explore Destinations</h2>
        </div>
        <Link href="/explore">
          <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white/30 hover:text-[#D4AF37] transition-colors">
            See All <ArrowRight className="w-3 h-3" />
          </button>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {SUGGESTED_CARDS.map((dest, i) => (
          <motion.div
            key={dest.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: 280 }}
          >
            <DestinationCard
              imageUrl={`https://images.unsplash.com/photo-${dest.photo}?auto=format&fit=crop&q=82&w=720`}
              location={dest.name}
              country={dest.country}
              score={dest.score}
              tags={dest.tags}
              themeColor={DEST_THEME[dest.name] || "212 60% 22%"}
              plannerHref={`/planner?dest=${encodeURIComponent(dest.name)}`}
              className="h-full"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   EMPTY STATE — text over the slideshow bg, no card/banner
   ════════════════════════════════════════════════════════════════════ */
function EmptyState() {
  return (
    <div>
      {/* Centered hero text over the full-page slideshow background */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center text-center py-28"
      >
        <p className="text-[9px] font-black uppercase tracking-[0.55em] text-[#D4AF37]/70 mb-5">Your Passport Awaits</p>
        <h2 className="font-black text-white tracking-tighter uppercase leading-none mb-5"
          style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)", textShadow: "0 2px 30px rgba(0,0,0,0.7)" }}>
          No Trips<br /><span style={{ color: "#D4AF37" }}>Planned Yet</span>
        </h2>
        <p className="text-white/50 text-sm max-w-md leading-relaxed mb-10"
          style={{ textShadow: "0 1px 12px rgba(0,0,0,0.8)" }}>
          Let Rihla AI architect your perfect journey — curated itinerary, smart budget, and day-by-day plans.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/planner">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-black text-sm uppercase tracking-widest"
              style={{ background: "linear-gradient(135deg,#D4AF37,#B8860B)", color: "#000", boxShadow: "0 8px 32px rgba(212,175,55,0.5)" }}>
              <Sparkles className="w-4 h-4" /> Plan Your First Trip
            </motion.button>
          </Link>
          <Link href="/explore">
            <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest text-white/55 hover:text-white transition-colors border border-white/15 hover:border-white/30 backdrop-blur-sm">
              <Globe className="w-3.5 h-3.5" /> Browse Destinations
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Card-21 destination grid below */}
      <div className="mt-4 pt-10 border-t border-white/[0.06]">
        <SuggestedGrid />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function MyTrips() {
  const { data: trips = [], isLoading } = useTrips();
  const deleteMutation = useDeleteTrip();
  const deleteAllMutation = useDeleteAllTrips();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [toDelete, setToDelete] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const FILTERS = ["All", "Planned", "Active", "Completed", "Draft"];

  const filtered = trips.filter(t => {
    const dest = (t.destination || "").toLowerCase();
    const status = (t.status || "planned").toLowerCase();
    return dest.includes(search.toLowerCase()) &&
      (filter === "All" || status === filter.toLowerCase());
  });

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast({ title: "Deleted", description: `${toDelete.destination} removed.` });
    } catch {
      toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
    } finally { setToDelete(null); }
  };

  const handleConfirmDeleteAll = async () => {
    try {
      await deleteAllMutation.mutateAsync();
      toast({ title: "Wiped", description: "All trips permanently erased." });
    } catch {
      toast({ title: "Error", description: "Failed to erase trips.", variant: "destructive" });
    } finally { setShowDeleteAll(false); }
  };

  return (
    <AppInnerLayout>
      {/* Full-page cinematic background — same as Dashboard */}
      <div className="fixed inset-0 z-[-1]">
        <DashboardSlideshow />
      </div>
      {/* Dark scrim so content is readable */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-black/50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-10 py-10 page-enter">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.45em] text-[#D4AF37]/60 mb-2">Travel Passport</p>
            <h1 className="font-black text-white leading-none uppercase tracking-tighter text-4xl md:text-5xl">
              My <span style={{ color: "#D4AF37" }}>Trips</span>
            </h1>
            {!isLoading && trips.length > 0 && (
              <p className="text-white/30 mt-2 text-xs font-medium">
                {trips.length} itinerar{trips.length !== 1 ? "ies" : "y"} saved
              </p>
            )}
          </div>
          {!isLoading && trips.length > 0 && (
            <div className="flex gap-3 shrink-0 items-center">
              <motion.button onClick={() => setShowDeleteAll(true)}
                disabled={deleteAllMutation.isPending}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center w-12 h-12 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all font-black"
                title="Delete All Trips">
                {deleteAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </motion.button>

              <Link href="/planner">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center h-12 gap-2 px-7 rounded-full font-black text-[10px] uppercase tracking-widest"
                  style={{ background: "linear-gradient(135deg,#D4AF37,#B8860B)", color: "#000", boxShadow: "0 6px 24px rgba(212,175,55,0.35)" }}>
                  <Sparkles className="w-3.5 h-3.5" /> Plan New Trip
                </motion.button>
              </Link>
            </div>
          )}
        </div>

        {/* Gold divider */}
        <div className="h-px mb-8" style={{ background: "linear-gradient(to right,rgba(212,175,55,0.25),rgba(255,255,255,0.03),transparent)" }} />

        {/* LOADING */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
              <PlaneTakeoff className="absolute inset-0 m-auto w-5 h-5 text-[#D4AF37]" />
            </div>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em]">Loading…</p>
          </div>

        ) : trips.length === 0 ? (
          /* EMPTY STATE */
          <EmptyState />

        ) : (
          /* HAS TRIPS */
          <>
            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-8">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search trips…"
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 font-medium focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }} />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all"
                    style={filter === f
                      ? { background: "#D4AF37", color: "#000" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }
                    }>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Trip grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <Globe className="w-9 h-9 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No trips match your filter.</p>
                <button onClick={() => { setSearch(""); setFilter("All"); }}
                  className="mt-3 text-[#D4AF37] text-xs font-black uppercase tracking-wider hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filtered.map((trip, i) => (
                    <TripCard key={trip.id} trip={trip} i={i} onDelete={t => setToDelete(t)} />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {/* Suggested destinations below trips */}
            <div className="mt-16 pt-10 border-t border-white/[0.05]">
              <SuggestedGrid />
            </div>
          </>
        )}
      </div>

      {/* DELETE DIALOGS */}
      <AnimatePresence>
        {toDelete && (
          <DeleteDialog trip={toDelete} onConfirm={handleConfirmDelete}
            onCancel={() => setToDelete(null)} isPending={deleteMutation.isPending} />
        )}
        {showDeleteAll && (
          <DeleteAllDialog onConfirm={handleConfirmDeleteAll}
            onCancel={() => setShowDeleteAll(false)} isPending={deleteAllMutation.isPending} />
        )}
      </AnimatePresence>
    </AppInnerLayout>
  );
}

