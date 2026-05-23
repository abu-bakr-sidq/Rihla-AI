import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTourPackages } from "@/hooks/use-tour-packages";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Globe, Star, Wallet, Calendar, Clock, Sparkles, X, Zap, Sun, Sunrise, Moon, CalendarDays, BarChart3, Lightbulb, Plane, MapPin, ChevronRight } from "lucide-react";
import AppInnerLayout from "@/components/AppInnerLayout";
import DashboardSlideshow from "@/components/ui/DashboardSlideshow";
import { usePlaceImage } from "@/hooks/use-place-image";
import { resolveApiUrl } from "@/lib/api-contract";

/* ─── Injected animation CSS ──────────────────────────────────── */
const ANIM_CSS = `
@keyframes shimmer-sweep {
  0%   { transform: translateX(-120%) skewX(-12deg); }
  100% { transform: translateX(240%)  skewX(-12deg); }
}
@keyframes pulse-ring {
  0%,100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 0;   transform: scale(1.18); }
}
@keyframes gen-glow {
  0%,100% { box-shadow: 0 0 10px 2px rgba(212,175,55,0.35); }
  50%      { box-shadow: 0 0 22px 6px rgba(212,175,55,0.65); }
}
.gen-btn { animation: gen-glow 2.4s ease-in-out infinite; }
.gen-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.38) 50%, transparent 100%);
  animation: shimmer-sweep 2.2s ease-in-out infinite;
  pointer-events: none;
}
.gen-btn:hover .gen-spark { animation: spin 0.6s linear; }
@keyframes spin { to { transform: rotate(360deg); } }
`;
if (typeof document !== 'undefined' && !document.getElementById('tp-anim')) {
  const s = document.createElement('style');
  s.id = 'tp-anim'; s.textContent = ANIM_CSS;
  document.head.appendChild(s);
}

/* ─── Destination Image using Google Places API ─────────────────── */

// Deterministic picsum fallback (always loads, unique per destination)
function seedHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h) % 900 + 100;
}

function DestImage({ destination }) {
  const query = `${destination} travel landmark`;
  const { src } = usePlaceImage(query);
  const fallback = `https://picsum.photos/seed/${seedHash(destination)}/640/430`;
  const imgSrc = src || fallback;

  return (
    <img
      src={imgSrc}
      alt={destination}
      className="absolute inset-0 w-full h-full object-cover"
      onError={(e) => { if (e.target.src !== fallback) e.target.src = fallback; }}
    />
  );
}


/* ─── Currency + Exchange Rate Engine ─────────────────────────── */

const CURRENCY_MAP = {
  japan: { sym: "¥", code: "JPY", rate: 149 }, kyoto: { sym: "¥", code: "JPY", rate: 149 }, tokyo: { sym: "¥", code: "JPY", rate: 149 },
  korea: { sym: "₩", code: "KRW", rate: 1320 }, seoul: { sym: "₩", code: "KRW", rate: 1320 },
  india: { sym: "₹", code: "INR", rate: 83 }, chennai: { sym: "₹", code: "INR", rate: 83 }, pondicherry: { sym: "₹", code: "INR", rate: 83 }, kanyakumari: { sym: "₹", code: "INR", rate: 83 },
  bali: { sym: "Rp", code: "IDR", rate: 15800 }, indonesia: { sym: "Rp", code: "IDR", rate: 15800 },
  thailand: { sym: "฿", code: "THB", rate: 35 }, phuket: { sym: "฿", code: "THB", rate: 35 },
  london: { sym: "£", code: "GBP", rate: 0.79 }, uk: { sym: "£", code: "GBP", rate: 0.79 },
  france: { sym: "€", code: "EUR", rate: 0.93 }, paris: { sym: "€", code: "EUR", rate: 0.93 },
  italy: { sym: "€", code: "EUR", rate: 0.93 }, rome: { sym: "€", code: "EUR", rate: 0.93 }, venice: { sym: "€", code: "EUR", rate: 0.93 }, amalfi: { sym: "€", code: "EUR", rate: 0.93 },
  spain: { sym: "€", code: "EUR", rate: 0.93 }, barcelona: { sym: "€", code: "EUR", rate: 0.93 },
  greece: { sym: "€", code: "EUR", rate: 0.93 }, santorini: { sym: "€", code: "EUR", rate: 0.93 },
  netherlands: { sym: "€", code: "EUR", rate: 0.93 }, amsterdam: { sym: "€", code: "EUR", rate: 0.93 },
  swiss: { sym: "CHF", code: "CHF", rate: 0.88 }, switzerland: { sym: "CHF", code: "CHF", rate: 0.88 },
  turkey: { sym: "₺", code: "TRY", rate: 32 }, istanbul: { sym: "₺", code: "TRY", rate: 32 },
  dubai: { sym: "AED", code: "AED", rate: 3.67 }, uae: { sym: "AED", code: "AED", rate: 3.67 },
  morocco: { sym: "MAD", code: "MAD", rate: 10 }, marrakech: { sym: "MAD", code: "MAD", rate: 10 },
  egypt: { sym: "EGP", code: "EGP", rate: 49 }, cairo: { sym: "EGP", code: "EGP", rate: 49 },
  jordan: { sym: "JOD", code: "JOD", rate: 0.71 }, petra: { sym: "JOD", code: "JOD", rate: 0.71 },
  peru: { sym: "PEN", code: "PEN", rate: 3.7 }, machu: { sym: "PEN", code: "PEN", rate: 3.7 },
  brazil: { sym: "R$", code: "BRL", rate: 4.98 }, rio: { sym: "R$", code: "BRL", rate: 4.98 },
  "south africa": { sym: "R", code: "ZAR", rate: 18.8 }, "cape town": { sym: "R", code: "ZAR", rate: 18.8 },
  "bora bora": { sym: "XPF", code: "XPF", rate: 110 }, polynesia: { sym: "XPF", code: "XPF", rate: 110 },
};
function getCurrency(dest) {
  const d = dest.toLowerCase();
  return Object.keys(CURRENCY_MAP).find(k => d.includes(k)) ? CURRENCY_MAP[Object.keys(CURRENCY_MAP).find(k => d.includes(k))] : { sym: "$", code: "USD", rate: 1 };
}
function estimateDailyUsd(dest, style = "") {
  const d = String(dest || "").toLowerCase();
  let base =
    d.includes("india") || d.includes("chennai") || d.includes("pondicherry") || d.includes("kanyakumari") ? 55 :
    d.includes("japan") || d.includes("tokyo") || d.includes("kyoto") ? 130 :
    d.includes("uae") || d.includes("dubai") ? 180 :
    d.includes("france") || d.includes("paris") || d.includes("italy") || d.includes("rome") || d.includes("venice") || d.includes("amalfi") || d.includes("spain") || d.includes("barcelona") ? 175 :
    d.includes("uk") || d.includes("london") ? 190 :
    d.includes("usa") || d.includes("new york") || d.includes("san francisco") ? 220 :
    140;
  const s = String(style || "").toLowerCase();
  if (s === "luxury") base *= 1.8;
  else if (s === "adventure") base *= 1.25;
  else if (s === "relaxation") base *= 1.15;
  else if (s === "budget") base *= 0.72;
  return Math.round(base);
}
function parsePackageBudget(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === "object") {
    return parsePackageBudget(value.total ?? value.amount ?? value.value ?? value.budget);
  }
  return null;
}
function getNormalizedPackageBudgetUsd(pkg, days) {
  const safeDays = Math.max(1, Number(days) || 1);
  const estimated = estimateDailyUsd(pkg?.destination, pkg?.travelStyle) * safeDays;
  const parsed = parsePackageBudget(pkg?.budget);
  if (!Number.isFinite(parsed) || parsed <= 0) return estimated;
  const expected = estimateDailyUsd(pkg?.destination, pkg?.travelStyle);
  const parsedPerDay = parsed / safeDays;
  if (parsedPerDay < expected * 0.6 || parsedPerDay > expected * 1.55) return estimated;
  return Math.round(parsed);
}
function fmtBudget(usd, cur, days) {
  const local = Math.round(usd * cur.rate);
  const fmtN = n => n >= 100000 ? `${(n/100000).toFixed(1)}L` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toString();
  return { local: `${cur.sym}${fmtN(local)}`, usd: `$${usd.toLocaleString()}`, perDay: `${cur.sym}${fmtN(Math.round(local/days))}/day` };
}

const DESTINATION_PRESETS_V2 = [
  { keys: ["kerala", "kochi", "munnar", "alleppey", "kovalam", "thiruvananthapuram", "india", "chennai", "pondicherry", "kanyakumari", "mumbai", "delhi", "jaipur", "goa", "hyderabad", "bangalore", "bengaluru", "kolkata"], sym: "₹", code: "INR", rate: 83, dailyUsd: 52 },
  { keys: ["tokyo", "kyoto", "osaka", "nara", "hakone", "sapporo", "japan"], sym: "¥", code: "JPY", rate: 149, dailyUsd: 128 },
  { keys: ["seoul", "busan", "jeju", "korea"], sym: "₩", code: "KRW", rate: 1320, dailyUsd: 118 },
  { keys: ["bali", "jakarta", "ubud", "indonesia"], sym: "Rp", code: "IDR", rate: 15800, dailyUsd: 82 },
  { keys: ["bangkok", "phuket", "chiang mai", "thailand"], sym: "฿", code: "THB", rate: 35, dailyUsd: 90 },
  { keys: ["kuala lumpur", "langkawi", "malaysia"], sym: "RM ", code: "MYR", rate: 4.7, dailyUsd: 88 },
  { keys: ["singapore"], sym: "S$", code: "SGD", rate: 1.35, dailyUsd: 150 },
  { keys: ["dubai", "abu dhabi", "uae"], sym: "AED ", code: "AED", rate: 3.67, dailyUsd: 180 },
  { keys: ["doha", "qatar"], sym: "QAR ", code: "QAR", rate: 3.64, dailyUsd: 175 },
  { keys: ["riyadh", "jeddah", "saudi", "madinah", "medina", "makkah", "mecca"], sym: "SAR ", code: "SAR", rate: 3.75, dailyUsd: 110 },
  { keys: ["muscat", "oman"], sym: "OMR ", code: "OMR", rate: 0.38, dailyUsd: 135 },
  { keys: ["kuwait"], sym: "KWD ", code: "KWD", rate: 0.31, dailyUsd: 170 },
  { keys: ["bahrain"], sym: "BHD ", code: "BHD", rate: 0.38, dailyUsd: 165 },
  { keys: ["istanbul", "cappadocia", "antalya", "turkey"], sym: "₺", code: "TRY", rate: 32, dailyUsd: 85 },
  { keys: ["cairo", "luxor", "sharm", "egypt"], sym: "EGP ", code: "EGP", rate: 49, dailyUsd: 78 },
  { keys: ["marrakech", "casablanca", "morocco"], sym: "MAD ", code: "MAD", rate: 10, dailyUsd: 82 },
  { keys: ["petra", "amman", "jordan"], sym: "JOD ", code: "JOD", rate: 0.71, dailyUsd: 105 },
  { keys: ["paris", "nice", "lyon", "france", "rome", "venice", "milan", "amalfi", "florence", "italy", "barcelona", "madrid", "seville", "spain", "amsterdam", "netherlands", "athens", "santorini", "greece", "berlin", "munich", "germany", "lisbon", "porto", "portugal", "vienna", "austria"], sym: "€", code: "EUR", rate: 0.93, dailyUsd: 165 },
  { keys: ["zurich", "lucerne", "interlaken", "switzerland"], sym: "CHF ", code: "CHF", rate: 0.88, dailyUsd: 210 },
  { keys: ["london", "manchester", "edinburgh", "uk", "united kingdom"], sym: "£", code: "GBP", rate: 0.79, dailyUsd: 185 },
  { keys: ["new york", "san francisco", "los angeles", "chicago", "miami", "usa", "united states"], sym: "$", code: "USD", rate: 1, dailyUsd: 220 },
  { keys: ["toronto", "vancouver", "canada"], sym: "C$", code: "CAD", rate: 1.37, dailyUsd: 175 },
  { keys: ["sydney", "melbourne", "australia"], sym: "A$", code: "AUD", rate: 1.52, dailyUsd: 180 },
  { keys: ["auckland", "queenstown", "new zealand"], sym: "NZ$", code: "NZD", rate: 1.66, dailyUsd: 175 },
  { keys: ["hong kong"], sym: "HK$", code: "HKD", rate: 7.81, dailyUsd: 170 },
  { keys: ["beijing", "shanghai", "china"], sym: "¥", code: "CNY", rate: 7.24, dailyUsd: 105 },
  { keys: ["machu", "cusco", "peru"], sym: "PEN ", code: "PEN", rate: 3.7, dailyUsd: 88 },
  { keys: ["rio", "sao paulo", "brazil"], sym: "R$", code: "BRL", rate: 4.98, dailyUsd: 92 },
  { keys: ["cape town", "johannesburg", "south africa"], sym: "R", code: "ZAR", rate: 18.8, dailyUsd: 95 },
  { keys: ["bora bora", "polynesia"], sym: "XPF ", code: "XPF", rate: 110, dailyUsd: 240 },
];

const DESTINATION_DAILY_USD_OVERRIDES = {
  INR: 34,
  JPY: 92,
  KRW: 85,
  IDR: 60,
  THB: 62,
  MYR: 66,
  SGD: 105,
  AED: 125,
  QAR: 120,
  SAR: 75,
  OMR: 95,
  KWD: 115,
  BHD: 110,
  TRY: 60,
  EGP: 52,
  MAD: 58,
  JOD: 72,
  EUR: 115,
  CHF: 150,
  GBP: 130,
  USD: 145,
  CAD: 105,
  AUD: 120,
  NZD: 118,
  HKD: 115,
  CNY: 72,
  PEN: 65,
  BRL: 68,
  ZAR: 70,
  XPF: 190,
};

const DESTINATION_PRESETS_V3 = DESTINATION_PRESETS_V2.map((entry) => ({
  ...entry,
  dailyUsd: DESTINATION_DAILY_USD_OVERRIDES[entry.code] ?? entry.dailyUsd,
}));

getCurrency = function getCurrencyV2(dest = "") {
  const d = String(dest || "").toLowerCase();
  return DESTINATION_PRESETS_V3.find((entry) => entry.keys.some((key) => d.includes(key))) || { sym: "$", code: "USD", rate: 1, dailyUsd: 88 };
};

estimateDailyUsd = function estimateDailyUsdV2(dest, style = "") {
  let base = getCurrency(dest).dailyUsd || 88;
  const s = String(style || "").toLowerCase();
  if (s === "luxury") base *= 1.8;
  else if (s === "adventure") base *= 1.25;
  else if (s === "relaxation") base *= 1.15;
  else if (s === "budget") base *= 0.72;
  return Math.round(base);
};

function formatLocalMoney(value, currency) {
  const amount = Math.max(0, Math.round(Number(value) || 0));
  const locale = currency.code === "INR" ? "en-IN" : "en";
  const compact = amount >= 1000
    ? new Intl.NumberFormat(locale, {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: amount >= 100000 ? 1 : 0,
      }).format(amount)
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
  return `${currency.sym}${compact}`.replace(/\s+/g, " ").trim();
}

function buildBudgetBreakdown(totalLocal, travelStyle, currency) {
  const style = String(travelStyle || "").toLowerCase();
  const ratios =
    style === "luxury"
      ? { accommodation: 0.4, food: 0.22, transport: 0.12, activities: 0.18, misc: 0.08 }
      : style === "adventure"
        ? { accommodation: 0.28, food: 0.2, transport: 0.18, activities: 0.24, misc: 0.1 }
        : style === "relaxation"
          ? { accommodation: 0.36, food: 0.22, transport: 0.14, activities: 0.16, misc: 0.12 }
          : { accommodation: 0.32, food: 0.22, transport: 0.16, activities: 0.2, misc: 0.1 };
  const accommodation = Math.round(totalLocal * ratios.accommodation);
  const food = Math.round(totalLocal * ratios.food);
  const transport = Math.round(totalLocal * ratios.transport);
  const activities = Math.round(totalLocal * ratios.activities);
  const misc = Math.max(0, totalLocal - accommodation - food - transport - activities);
  return {
    accommodation: formatLocalMoney(accommodation, currency),
    food: formatLocalMoney(food, currency),
    transport: formatLocalMoney(transport, currency),
    activities: formatLocalMoney(activities, currency),
    misc: formatLocalMoney(misc, currency),
    total: formatLocalMoney(totalLocal, currency),
  };
}

fmtBudget = function fmtBudgetV2(usd, cur, days) {
  const local = Math.round(usd * cur.rate);
  return {
    local: formatLocalMoney(local, cur),
    usd: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(usd),
    perDay: `${formatLocalMoney(Math.round(local / days), cur)}/day`,
    localRaw: local,
  };
};


/* ─── AI Plan Modal ────────────────────────────────────────────── */

const SESSION_CONFIG = {
  morning:   { Icon: Sunrise, color: "#F59E0B", label: "Morning" },
  afternoon: { Icon: Sun,     color: "#3B82F6", label: "Afternoon" },
  evening:   { Icon: Moon,    color: "#8B5CF6", label: "Evening" },
};
const BUDGET_CATS = [
  { key: "accommodation", label: "Accommodation", pct: 32, color: "#D4AF37" },
  { key: "food",          label: "Food & Dining", pct: 22, color: "#F59E0B" },
  { key: "transport",     label: "Transport", pct: 16, color: "#3B82F6" },
  { key: "activities",    label: "Activities", pct: 20, color: "#8B5CF6" },
  { key: "misc",          label: "Miscellaneous", pct: 10, color: "#14B8A6" },
];

function PlanModal({ pkg, onClose }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("itinerary");
  const currency = getCurrency(pkg.destination);
  const days = pkg.days || Math.max(1, Math.round((new Date(pkg.endDate || Date.now()) - new Date(pkg.startDate || Date.now())) / 86400000));
  const budget = fmtBudget(getNormalizedPackageBudgetUsd(pkg, days), currency, days);

  useEffect(() => {
    fetch(resolveApiUrl(`/api/tour-packages/${pkg._id}/preview`))
      .then(r => r.json())
      .then(d => { setPlan(d); setLoading(false); })
      .catch(() => {
        // Robust local fallback when API fails
        const places = (pkg.description || "").split(",").map(p => p.trim()).filter(Boolean);
        const localBudget = Math.round(getNormalizedPackageBudgetUsd(pkg, days) * currency.rate);
        const perDay = Math.round(localBudget / days);
        const fmtN = (n) => formatLocalMoney(n, currency);
        const breakdown = buildBudgetBreakdown(localBudget, pkg.travelStyle, currency);
        setPlan({
          overview: `A ${pkg.travelStyle} trip to ${pkg.destination} over ${days} days.`,
          bestTime: "October – March",
          currency: currency.code,
          currencySymbol: currency.sym,
          days: Array.from({ length: Math.min(days, 5) }, (_, i) => ({
            day: i + 1,
            title: `Day ${i + 1}: ${places[i] || pkg.destination.split(",")[0]}`,
            morning:   { activity: "Sightseeing & Exploration", place: places[i * 3] || pkg.destination.split(",")[0], cost: fmtN(Math.round(perDay * 0.25)), duration: "2–3 hrs" },
            afternoon: { activity: "Local Cuisine & Culture",   place: places[i * 3 + 1] || "Local Market",          cost: fmtN(Math.round(perDay * 0.40)), duration: "3–4 hrs" },
            evening:   { activity: "Sunset & Evening Walk",     place: places[i * 3 + 2] || "City Centre",           cost: fmtN(Math.round(perDay * 0.20)), duration: "2 hrs" },
            dayTotal: fmtN(perDay),
            tip: `Pre-book ${places[i] || "attractions"} for better rates.`
          })),
          budgetBreakdown: breakdown,
          tips: [
            `Carry ${currency.sym} cash for local markets.`,
            "Book accommodations 2–3 weeks in advance.",
            "Visit major sights early morning to avoid crowds."
          ]
        });
        setLoading(false);
      });
  }, [pkg._id]);

  const sym = plan?.currencySymbol || currency.sym;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center bg-black/85 backdrop-blur-xl"
      style={{ paddingTop: 68, paddingBottom: 12, paddingLeft: 10, paddingRight: 10 }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.93, y: 40 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 40 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        className="w-full flex flex-col rounded-[1.35rem] sm:rounded-2xl overflow-hidden"
        style={{ maxWidth: 520, maxHeight: "calc(100vh - 84px)", background: "#080808", border: "1px solid rgba(212,175,55,0.22)", boxShadow: "0 0 80px rgba(212,175,55,0.2)" }}
      >
        {/* ── Header image (fixed) ── */}
        <div className="relative shrink-0 overflow-hidden h-36 sm:h-40">
          <DestImage destination={pkg.destination} />
          <div className="absolute inset-0 z-[2]" style={{ background: "linear-gradient(to top, #080808 5%, rgba(0,0,0,0.3) 60%, transparent)" }} />
          <button onClick={onClose} className="absolute top-3 right-3 z-[6] p-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <X className="w-4 h-4 text-white/70" />
          </button>
          <div className="absolute bottom-3 left-4 z-[5] max-w-[52%] sm:max-w-none">
            <h2 className="text-base font-black text-white leading-tight">{pkg.destination}</h2>
            <p className="text-[10px] capitalize" style={{ color: "#D4AF37" }}>{pkg.travelStyle} · {days} Days</p>
          </div>
          {plan?.overview && (
            <div className="absolute bottom-3 right-4 z-[5] max-w-[42%] sm:max-w-[55%]">
              <p className="text-[8px] text-white/50 text-right line-clamp-2">{plan.overview}</p>
            </div>
          )}
        </div>

        {/* ── Stats bar (fixed) ── */}
        <div className="shrink-0 flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { icon: Wallet,   label: "Budget",   val: budget.local, sub: budget.usd },
            { icon: Calendar, label: "Duration",  val: `${days} Days` },
            { icon: Clock,    label: "Per Day",   val: budget.perDay },
          ].map(({ icon: Icon, label, val, sub }) => (
            <div key={label} className="flex-1 flex flex-col items-center py-2.5 gap-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
              <Icon className="w-3 h-3 mb-0.5" style={{ color: "rgba(212,175,55,0.55)" }} />
              <span className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
              <span className="text-[12px] font-black text-white">{val}</span>
              {sub && <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.28)" }}>{sub}</span>}
            </div>
          ))}
        </div>

        {/* ── Tab switcher (fixed) ── */}
        <div className="shrink-0 flex gap-1.5 px-4 pt-3 pb-2">
          <button onClick={() => setTab("itinerary")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
            style={{ background: tab === "itinerary" ? "#D4AF37" : "rgba(255,255,255,0.04)", color: tab === "itinerary" ? "#000" : "rgba(255,255,255,0.4)", border: tab === "itinerary" ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
            <CalendarDays className="w-3 h-3" /> Day-by-Day Plan
          </button>
          <button onClick={() => setTab("budget")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
            style={{ background: tab === "budget" ? "#D4AF37" : "rgba(255,255,255,0.04)", color: tab === "budget" ? "#000" : "rgba(255,255,255,0.4)", border: tab === "budget" ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
            <BarChart3 className="w-3 h-3" /> Budget Analysis
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div
          className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4 pt-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(212,175,55,0.3) transparent", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
          onWheel={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
        >
          {loading ? (
            <div className="space-y-3 py-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />)}
            </div>
          ) : tab === "itinerary" ? (
            <div className="space-y-3">
              {(!plan?.days || plan.days.length === 0) ? (
                <div className="text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-[10px]">Could not load itinerary. Try again.</p>
                </div>
              ) : plan.days.map((d, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  {/* Day header */}
                  <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "rgba(212,175,55,0.08)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">Day {d.day}</span>
                      <p className="text-[12px] font-black text-white leading-tight">{d.title}</p>
                    </div>
                    {d.dayTotal && (
                      <div className="text-right">
                        <p className="text-[7px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Day Total</p>
                        <p className="text-[13px] font-black text-[#D4AF37]">{d.dayTotal}</p>
                      </div>
                    )}
                  </div>
                  {/* Sessions */}
                  <div>
                    {["morning", "afternoon", "evening"].map((session, si) => {
                      const s = d[session];
                      const cfg = SESSION_CONFIG[session];
                      const SIcon = cfg.Icon;
                      if (!s) return null;
                      return (
                        <div key={session} className="flex items-start gap-2.5 px-3 py-2.5"
                          style={{ borderBottom: si < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                            <SIcon className="w-3 h-3" style={{ color: cfg.color }} />
                            <div className="w-px flex-1 rounded-full" style={{ background: `${cfg.color}30`, minHeight: 12 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[9px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                              {s.duration && <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.28)" }}>· {s.duration}</span>}
                            </div>
                            <p className="text-[10.5px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.9)" }}>{s.activity}</p>
                            <p className="text-[9px] italic mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                              <MapPin className="w-2.5 h-2.5 inline mr-0.5 mb-0.5" />{s.place}
                            </p>
                          </div>
                          {s.cost && (
                            <div className="shrink-0 text-right pt-0.5">
                              <p className="text-[11px] font-black text-[#D4AF37]">{s.cost}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Tip */}
                  {d.tip && (
                    <div className="flex items-start gap-2 px-3 py-2" style={{ background: "rgba(255,170,0,0.04)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-[#D4AF37]" />
                      <p className="text-[9px] italic" style={{ color: "rgba(255,255,255,0.45)" }}>{d.tip}</p>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Tips section */}
              {plan?.tips?.length > 0 && (
                <div className="rounded-xl p-3" style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Plane className="w-3 h-3 text-[#D4AF37]" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37]">Travel Tips</p>
                  </div>
                  {plan.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <ChevronRight className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5" />
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Budget Analysis tab */
            <div className="space-y-3 py-1">
              {/* Total */}
              <div className="rounded-xl p-3 text-center" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))", border: "1px solid rgba(212,175,55,0.2)" }}>
                <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Total Trip Budget</p>
                <p className="text-2xl font-black text-[#D4AF37]">{plan?.budgetBreakdown?.total || budget.local}</p>
                <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{budget.usd} · {days} days · {budget.perDay}</p>
              </div>

              {/* Breakdown bars */}
              {BUDGET_CATS.map(cat => {
                const val = plan?.budgetBreakdown?.[cat.key];
                return (
                  <div key={cat.key} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{cat.label}</span>
                      <span className="text-[11px] font-black" style={{ color: cat.color }}>{val || "—"}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${cat.pct}%` }} transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full" style={{ background: cat.color }} />
                    </div>
                    <p className="text-[7.5px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{cat.pct}% of total budget</p>
                  </div>
                );
              })}

              {/* Best time */}
              {plan?.bestTime && (
                <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <CalendarDays className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-[8px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Best Time to Visit</p>
                    <p className="text-[12px] font-black text-white">{plan.bestTime}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
const BG = ["https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1400&q=80","https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=80","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80","https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1400&q=80"];

export default function TourPackages() {
  const { data: packages = [], isLoading } = useTourPackages();
  const [, setLocation] = useLocation();
  const [previewPkg, setPreviewPkg] = useState(null);

  const handleBuild = (pkg) => {
    const d = pkg.days || Math.max(1, Math.round((new Date(pkg.endDate || Date.now()) - new Date(pkg.startDate || Date.now())) / 86400000));
    const start = new Date();
    const end = new Date(); end.setDate(end.getDate() + d);
    const currency = getCurrency(pkg.destination);
    const budgetUsd = getNormalizedPackageBudgetUsd(pkg, d);
    const p = new URLSearchParams({ autoGenerate: "true", destination: pkg.destination, startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0], budget: String(budgetUsd), currency: currency.code, travelStyle: pkg.travelStyle, preferences: (pkg.preferences||[]).join(", ") });
    setLocation(`/planner?${p.toString()}`);
  };

  return (
    <AppInnerLayout>
      <div className="relative min-h-screen">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <DashboardSlideshow customImages={BG} />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.68)" }} />
        </div>

        <div className="relative z-10 w-full px-3 sm:px-4 md:px-6 pt-16 md:pt-22 pb-16 md:pb-24 page-enter" style={{ maxWidth: 1500, margin: "0 auto" }}>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.05)" }}>
              <Globe className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Premium Curation</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight mb-3 text-white uppercase">
              Curated <span className="aurora-gradient-text">Packages</span>
            </h1>
            <p className="text-xs text-white/45 max-w-lg mx-auto">
              Sophisticated itineraries by Rihla AI — click <span className="text-[#D4AF37] font-semibold">Generate</span> to see a live AI preview.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" /></div>
          ) : (
            <div className="grid gap-4 md:gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 680px), 1fr))" }}>
              {packages.map((pkg, i) => {
                const currency = getCurrency(pkg.destination);
                const days = pkg.days || Math.max(1, Math.round((new Date(pkg.endDate || Date.now()) - new Date(pkg.startDate || Date.now())) / 86400000));
                const budget = fmtBudget(getNormalizedPackageBudgetUsd(pkg, days), currency, days);

                return (
                  <motion.div key={pkg._id}
                    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.44 }}
                    className="group flex flex-col rounded-2xl overflow-hidden md:flex-row"
                    style={{ background: "rgba(10,10,12,0.78)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", transition: "box-shadow 0.3s, border-color 0.3s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.28)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(212,175,55,0.14)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}
                  >
                    {/* Image */}
                    <div className="relative shrink-0 overflow-hidden w-full h-44 md:h-auto md:w-[215px]">
                      <DestImage destination={pkg.destination} />
                      <div className="absolute top-2.5 left-2.5 z-[4] flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
                        <Star className="w-2.5 h-2.5 text-[#D4AF37]" fill="currentColor" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#D4AF37]">{pkg.travelStyle}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between px-4 py-4 min-w-0">
                      <div>
                        <h3 className="text-[1.05rem] md:text-[15px] font-black leading-tight mb-1 break-words" style={{ color: "rgba(255,255,255,0.96)" }}>
                          {pkg.destination}
                        </h3>
                        <p className="text-[10px] italic mb-2.5" style={{ color: "rgba(212,175,55,0.72)" }}>by Rihla AI in {pkg.travelStyle} Packages</p>
                        {pkg.description && (
                          <p className="text-[10.5px] md:text-[11px] leading-snug line-clamp-3 md:line-clamp-2 pl-2.5" style={{ color: "rgba(255,255,255,0.68)", borderLeft: "2px solid rgba(212,175,55,0.3)" }}>
                            {pkg.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 mt-auto">
                        <p className="text-[10.5px]">
                          <span style={{ color: "rgba(255,255,255,0.38)" }}>Duration: </span>
                          <strong style={{ color: "rgba(255,255,255,0.82)" }}>{days} {days === 1 ? 'Day' : 'Days'}</strong>
                        </p>
                        <p className="text-[10.5px]">
                          <span style={{ color: "rgba(255,255,255,0.38)" }}>Budget: </span>
                          <strong className="text-[#D4AF37]">{budget.local}</strong>
                          <span className="ml-1.5 text-[9.5px]" style={{ color: "rgba(255,255,255,0.32)" }}>({days}d · {budget.perDay} · {budget.usd})</span>
                        </p>
                        {pkg.preferences?.length > 0 && (
                          <p className="text-[10.5px] truncate">
                            <span style={{ color: "rgba(255,255,255,0.38)" }}>For: </span>
                            <strong style={{ color: "rgba(255,255,255,0.72)" }}>{pkg.preferences.slice(0, 2).join(", ")}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="shrink-0 flex flex-col items-stretch justify-center gap-3 px-4 py-4 w-full md:w-[190px] border-t md:border-t-0 md:border-l bg-black/20"
                      style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.25)" }}
                    >

                      {/* Generate a Preview — animated */}
                      <div className="relative w-full">
                        <div className="absolute inset-0 rounded-full" style={{ animation: "pulse-ring 2.4s ease-in-out infinite", background: "rgba(212,175,55,0.28)", zIndex: 0 }} />
                        <button
                          onClick={() => setPreviewPkg(pkg)}
                          className="gen-btn relative w-full rounded-full flex items-center justify-center gap-1.5 font-black overflow-hidden"
                          style={{ padding: "10px 10px", fontSize: 9.5, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap", background: "linear-gradient(135deg, #D4AF37 0%, #F5D06E 50%, #B8860B 100%)", color: "#000", zIndex: 1, cursor: "pointer", border: "none", transition: "transform 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                          onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                          onMouseUp={e => e.currentTarget.style.transform = "scale(1.05)"}
                        >
                          <Zap className="gen-spark w-3 h-3 shrink-0" />
                          <span>Generate a Preview</span>
                        </button>
                      </div>

                      {/* Plan Now */}
                      <button onClick={() => handleBuild(pkg)}
                        className="w-full rounded-full font-black"
                        style={{ padding: "10px 10px", fontSize: 9.5, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap", background: "rgba(10,10,12,0.2)", border: "1.5px solid rgba(212,175,55,0.5)", color: "#D4AF37", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#D4AF37"; e.currentTarget.style.color = "#000"; e.currentTarget.style.transform = "scale(1.03)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#D4AF37"; e.currentTarget.style.transform = "scale(1)"; }}>
                        Plan Now
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence>
          {previewPkg && <PlanModal pkg={previewPkg} onClose={() => setPreviewPkg(null)} />}
        </AnimatePresence>
      </div>
    </AppInnerLayout>
  );
}
