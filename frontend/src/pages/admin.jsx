import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useLogout, useUpdateProfile, useUpdatePassword, useRevokeSessions } from "@/hooks/use-auth";
import { useAdmin, useUpdateUserStatus, useDeleteUser } from "@/hooks/use-admin";
import { useDeleteTrip } from "@/hooks/use-trips";
import { useTourPackages, useCreateTourPackage, useDeleteTourPackage } from "@/hooks/use-tour-packages";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTheme } from "next-themes";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Shield, Users, Globe, BarChart2, Activity, Database,
  Server, Zap, Search, Loader2, ArrowUpRight, ArrowDownRight,
  RefreshCw, Trash2, CheckCircle2, AlertCircle, Clock,
  MapPin, TrendingUp, MessageSquare, Settings, LayoutDashboard,
  LogOut, Bell, LogIn, PlusCircle, Pencil, ChevronLeft, ChevronRight, Star,
  Sun, Moon, ExternalLink, Briefcase, Sparkles, Calendar as CalendarIcon
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import BrandLogo, { BrandMark } from "@/components/BrandLogo";
import AnoAI from "@/components/ui/animated-shader-background";
import { Link } from "wouter";
import DashboardSlideshow from "@/components/ui/DashboardSlideshow";
import { format } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarGrid, isDisabled } from "./planner";
import { resolveApiUrl } from "@/lib/api-contract";

/* ── Mini Planner Calendar Wrapper ── */
function MiniPlannerCalendar({ selectedDate, onSelect, dateLabel = "Departure" }) {
  const initDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewDate, setViewDate] = useState(new Date(initDate.getFullYear(), initDate.getMonth(), 1));
  const [hoverDate, setHoverDate] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handleDayClick = (d, m, y) => {
    if (isDisabled(d, m, y)) return;
    const clicked = new Date(y, m, d);
    clicked.setHours(0, 0, 0, 0);
    onSelect(clicked);
  };

  return (
    <div className="relative pt-2 pb-1 bg-transparent w-[320px]">
      <div className="absolute top-4 left-0 right-0 flex justify-between px-5 pointer-events-none z-20">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded-full text-white/30 hover:text-[#D4AF37] hover:bg-white/5 pointer-events-auto transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded-full text-white/30 hover:text-[#D4AF37] hover:bg-white/5 pointer-events-auto transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <CalendarGrid
        y={year}
        m={month}
        start={selectedDate ? new Date(selectedDate) : null}
        end={null}
        hoverDate={hoverDate}
        onDayClick={handleDayClick}
        onHover={setHoverDate}
        dateLabel={dateLabel}
      />
    </div>
  );
}

/* ── Admin background (Cinematic Blur Slideshow) ── */
function AdminBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ filter: "none", transform: "scale(1.05)" }}>
        <DashboardSlideshow />
      </div>
      <div className="absolute inset-0 bg-background/60 dark:bg-background/85 transition-colors duration-500" />
    </div>
  );
}

const PIE_COLORS = ["#7c3aed", "#be185d", "#0ea5e9", "#f59e0b", "#10b981", "#f43f5e"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const SPEND_PIE = [
  { name: "Hotels", value: 30 }, { name: "Food", value: 22 },
  { name: "Transport", value: 18 }, { name: "Activities", value: 15 },
  { name: "Shopping", value: 10 }, { name: "Misc", value: 5 },
];

/* ── Custom tooltip ── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-4 py-3 rounded-xl text-sm shadow-2xl"
      style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", backdropFilter: "blur(12px)" }}>
      <p className="font-bold mb-1 text-foreground">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs">{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

const NAV_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "trips", label: "Trips", icon: Globe },
  { id: "tour-packages", label: "Tour Packages", icon: Briefcase },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
];

/* ── Stat Card ── */
function AdminStat({ label, value, icon: Icon, delta, color, delay = 0 }) {
  const pos = delta >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="p-5 rounded-2xl relative overflow-hidden group"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--panel-border, rgba(255,255,255,0.07))" }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 0% 100%, ${color}10, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <span className={`text-[9px] font-black rounded-full px-2 py-1 flex items-center gap-0.5 ${pos ? "text-emerald-400" : "text-red-400"}`}
            style={{ background: pos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
            {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta)}%
          </span>
        </div>
        <div className="text-3xl font-black tracking-tight">{typeof value === "number" ? value.toLocaleString() : value}</div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--admin-text-muted)] mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function PlatformIcon({ user }) {
  if (user?.googleId) {
    return (
      <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" title="Google Auth">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    )
  }
  return <div title="Rihla AI (Email)"><BrandMark size={14} className="opacity-70 grayscale" /></div>
}


/* ── Mocks & Data ── */
const AI_SUGGESTIONS = [
  // Tamil Nadu & Nearby
  { title: "Chennai", src: "https://images.unsplash.com/photo-1661366698983-3cb843219300?q=80&w=800&auto=format&fit=crop" },
  { title: "Ooty", src: "https://images.unsplash.com/photo-1721195807443-6e95be23273c?q=80&w=800&auto=format&fit=crop" },
  { title: "Kodaikanal", src: "https://images.unsplash.com/photo-1671949391384-a649337fd942?q=80&w=800&auto=format&fit=crop" },
  { title: "Madurai", src: "https://images.unsplash.com/photo-1603766806347-54cdf3745953?q=80&w=800&auto=format&fit=crop" },
  { title: "Pondicherry", src: "https://images.unsplash.com/photo-1772633634752-7b7611e839fc?q=80&w=800&auto=format&fit=crop" },
  { title: "Coimbatore", src: "https://images.unsplash.com/photo-1561006289-4fe1a09bf743?q=80&w=800&auto=format&fit=crop" },
  { title: "Kanyakumari", src: "https://images.unsplash.com/photo-1653675838191-2f17f0cdf278?q=80&w=800&auto=format&fit=crop" },
  { title: "Rameswaram", src: "https://images.unsplash.com/photo-1567673644470-bda1f8ca761b?q=80&w=800&auto=format&fit=crop" },
  { title: "Thanjavur", src: "https://images.unsplash.com/photo-1675677044118-3fd84f9deaf0?q=80&w=800&auto=format&fit=crop" },
  { title: "Mahabalipuram", src: "https://images.unsplash.com/photo-1668766158906-9bffd77d67a0?q=80&w=800&auto=format&fit=crop" },
  // International
  { title: "Santorini, Greece", src: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80" },
  { title: "Kyoto, Japan", src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80" },
  { title: "Maldives", src: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80" },
  { title: "Bali, Indonesia", src: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=800&q=80" },
  { title: "Istanbul, Turkey", src: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80" },
  { title: "Dubai, UAE", src: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80" },
  { title: "Paris, France", src: "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=800&q=80" },
  { title: "London, UK", src: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=800&q=80" },
  { title: "Tokyo, Japan", src: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80" },
  { title: "Rome, Italy", src: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80" },
  { title: "Barcelona, Spain", src: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80" },
  { title: "Singapore", src: "https://images.unsplash.com/photo-1702085241418-e87b3b60a497?auto=format&fit=crop&w=800&q=80" },
  { title: "Sydney, Australia", src: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80" },
  { title: "Amsterdam", src: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80" },
  { title: "Venice, Italy", src: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80" }
];

const stylePreferencesMap = {
  cultural: ["Museums", "Historical Sites", "Local Cuisine", "Art Galleries", "Architecture", "Local Markets"],
  adventure: ["Water Sports", "Mountaineering", "Off-road Safari", "Skydiving", "Extreme Sports"],
  nature: ["Hiking Paths", "Wildlife", "National Parks", "Camping", "Eco-Lodges", "Scenic Drives"],
  luxury: ["Private Jets", "Yachting", "Fine Dining", "Personal Shopper", "Exclusive Access"],
  relaxation: ["Spa & Wellness", "Beachfront", "Luxury Dining", "Private Tours", "Resort Stay", "Slow Pace"]
};

const normalizeSearchValue = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasSearchSignal = (value = "") => {
  const compact = normalizeSearchValue(value).replace(/[\s'-]/g, "");
  if (compact.length < 3) return false;
  if (/^(.)\1+$/.test(compact)) return false;
  return new Set(compact.split("")).size >= 3;
};

const isValidPlaceLabel = (name = "") => {
  const compact = normalizeSearchValue(name).replace(/[\s'-]/g, "");
  if (compact.length < 3) return false;
  if (/^(.)\1+$/.test(compact)) return false;
  return new Set(compact.split("")).size >= 3;
};

const TRUSTED_DESTINATION_TYPES = new Set([
  "city",
  "town",
  "village",
  "municipality",
  "county",
  "state",
  "province",
  "region",
  "country",
  "island",
  "archipelago",
  "hamlet",
]);

// ── Currency Intelligence Engine ──
const getCurrencySymbol = (dest) => {
  if (!dest) return "$";
  const map = {
    ooty: "india", chennai: "india", mumbai: "india", delhi: "india",
    kolkata: "india", bangalore: "india", hyderabad: "india", madurai: "india",
    kodaikanal: "india", rameswaram: "india", pondicherry: "india",
    thanjavur: "india", coimbatore: "india", kanyakumari: "india",
    mahabalipuram: "india", goa: "india", jaipur: "india", agra: "india",
    dubai: "uae", "abu dhabi": "uae", sharjah: "uae",
    tokyo: "japan", kyoto: "japan", osaka: "japan", hiroshima: "japan",
    paris: "france", nice: "france", lyon: "france", london: "uk",
    rome: "italy", venice: "italy", barcelona: "spain",
    santorini: "greece", amsterdam: "netherlands",
    "new york": "usa", toronto: "canada", sydney: "australia",
    bangkok: "thailand", bali: "indonesia", singapore: "singapore",
    istanbul: "turkey", maldives: "maldives",
  };
  const symbols = {
    india: "₹", uae: "د.إ", japan: "¥", france: "€", spain: "€",
    italy: "€", greece: "€", netherlands: "€", usa: "$", canada: "$",
    australia: "$", uk: "£", singapore: "S$", thailand: "฿",
    indonesia: "Rp", turkey: "₺", maldives: "$"
  };
  const dLower = dest.toLowerCase();
  const country = Object.keys(map).find(k => dLower.includes(k));
  return symbols[map[country]] || "$";
};

const DESTINATION_CURRENCY_PRESETS = [
  { keys: ["kerala", "kochi", "munnar", "alleppey", "kovalam", "thiruvananthapuram", "india", "chennai", "pondicherry", "kanyakumari", "mumbai", "delhi", "jaipur", "goa", "hyderabad", "bangalore", "bengaluru", "kolkata"], glyph: "₹", code: "INR", rate: 83, dailyUsd: 34 },
  { keys: ["tokyo", "kyoto", "osaka", "nara", "hakone", "sapporo", "japan"], glyph: "¥", code: "JPY", rate: 149, dailyUsd: 92 },
  { keys: ["seoul", "busan", "jeju", "korea"], glyph: "₩", code: "KRW", rate: 1320, dailyUsd: 85 },
  { keys: ["bali", "jakarta", "ubud", "indonesia"], glyph: "Rp ", code: "IDR", rate: 15800, dailyUsd: 60 },
  { keys: ["bangkok", "phuket", "chiang mai", "thailand"], glyph: "฿", code: "THB", rate: 35, dailyUsd: 62 },
  { keys: ["kuala lumpur", "langkawi", "malaysia"], glyph: "RM ", code: "MYR", rate: 4.7, dailyUsd: 66 },
  { keys: ["singapore"], glyph: "S$", code: "SGD", rate: 1.35, dailyUsd: 105 },
  { keys: ["dubai", "abu dhabi", "uae"], glyph: "AED ", code: "AED", rate: 3.67, dailyUsd: 125 },
  { keys: ["doha", "qatar"], glyph: "QAR ", code: "QAR", rate: 3.64, dailyUsd: 120 },
  { keys: ["riyadh", "jeddah", "saudi", "madinah", "medina", "makkah", "mecca"], glyph: "SAR ", code: "SAR", rate: 3.75, dailyUsd: 75 },
  { keys: ["muscat", "oman"], glyph: "OMR ", code: "OMR", rate: 0.38, dailyUsd: 95 },
  { keys: ["kuwait"], glyph: "KWD ", code: "KWD", rate: 0.31, dailyUsd: 115 },
  { keys: ["bahrain"], glyph: "BHD ", code: "BHD", rate: 0.38, dailyUsd: 110 },
  { keys: ["istanbul", "cappadocia", "antalya", "turkey"], glyph: "₺", code: "TRY", rate: 32, dailyUsd: 60 },
  { keys: ["cairo", "luxor", "sharm", "egypt"], glyph: "EGP ", code: "EGP", rate: 49, dailyUsd: 52 },
  { keys: ["marrakech", "casablanca", "morocco"], glyph: "MAD ", code: "MAD", rate: 10, dailyUsd: 58 },
  { keys: ["petra", "amman", "jordan"], glyph: "JOD ", code: "JOD", rate: 0.71, dailyUsd: 72 },
  { keys: ["paris", "nice", "lyon", "france", "rome", "venice", "milan", "amalfi", "florence", "italy", "barcelona", "madrid", "seville", "spain", "amsterdam", "netherlands", "athens", "santorini", "greece", "berlin", "munich", "germany", "lisbon", "porto", "portugal", "vienna", "austria"], glyph: "€", code: "EUR", rate: 0.93, dailyUsd: 115 },
  { keys: ["zurich", "lucerne", "interlaken", "switzerland"], glyph: "CHF ", code: "CHF", rate: 0.88, dailyUsd: 150 },
  { keys: ["london", "manchester", "edinburgh", "uk", "united kingdom"], glyph: "£", code: "GBP", rate: 0.79, dailyUsd: 130 },
  { keys: ["new york", "san francisco", "los angeles", "chicago", "miami", "usa", "united states"], glyph: "$", code: "USD", rate: 1, dailyUsd: 145 },
  { keys: ["toronto", "vancouver", "canada"], glyph: "C$", code: "CAD", rate: 1.37, dailyUsd: 105 },
  { keys: ["sydney", "melbourne", "australia"], glyph: "A$", code: "AUD", rate: 1.52, dailyUsd: 120 },
  { keys: ["auckland", "queenstown", "new zealand"], glyph: "NZ$", code: "NZD", rate: 1.66, dailyUsd: 118 },
  { keys: ["hong kong"], glyph: "HK$", code: "HKD", rate: 7.81, dailyUsd: 115 },
  { keys: ["beijing", "shanghai", "china"], glyph: "¥", code: "CNY", rate: 7.24, dailyUsd: 72 },
  { keys: ["machu", "cusco", "peru"], glyph: "PEN ", code: "PEN", rate: 3.7, dailyUsd: 65 },
  { keys: ["rio", "sao paulo", "brazil"], glyph: "R$", code: "BRL", rate: 4.98, dailyUsd: 68 },
  { keys: ["cape town", "johannesburg", "south africa"], glyph: "R", code: "ZAR", rate: 18.8, dailyUsd: 70 },
  { keys: ["bora bora", "polynesia"], glyph: "XPF ", code: "XPF", rate: 110, dailyUsd: 190 },
];

function getDestinationCurrencyMeta(dest = "") {
  const text = String(dest || "").toLowerCase();
  return DESTINATION_CURRENCY_PRESETS.find((entry) => entry.keys.some((key) => text.includes(key))) || {
    glyph: "$",
    code: "USD",
    rate: 1,
    dailyUsd: 88,
  };
}

function estimatePackageDailyUsd(dest, style = "") {
  let base = getDestinationCurrencyMeta(dest).dailyUsd || 88;
  const s = String(style || "").toLowerCase();
  if (s === "luxury") base *= 1.55;
  else if (s === "adventure") base *= 1.18;
  else if (s === "relaxation") base *= 1.08;
  else if (s === "budget") base *= 0.72;
  return Math.round(base);
}

function getRecommendedPackageBudgetUsd(dest, days = 7, style = "") {
  const safeDays = Math.max(1, Number(days) || 1);
  return Math.max(150, Math.round(estimatePackageDailyUsd(dest, style) * safeDays));
}

function formatDestinationMoneyFromUsd(usdAmount, dest = "") {
  const meta = getDestinationCurrencyMeta(dest);
  const localAmount = Math.max(0, Math.round((Number(usdAmount) || 0) * meta.rate));
  const locale = meta.code === "INR" ? "en-IN" : "en";
  return `${meta.glyph}${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(localAmount)}`.replace(/\s+/g, " ").trim();
}

/* ── Add Package Modal Component (Internal Scroll Engine + Custom Scrollbars) ── */
function AddPackageModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [results, setResults] = useState(() =>
    AI_SUGGESTIONS.slice(0, 6).map((d) => ({ title: d.title, location: d.country || "", src: d.src }))
  );
  const [budgetTouched, setBudgetTouched] = useState(false);

  const [form, setForm] = useState({
    destination: "", src: "", days: 7, budget: 3000, travelStyle: "cultural"
  });
  const [preferences, setPreferences] = useState([]);

  const createTourPackage = useCreateTourPackage();
  const currencyMeta = getDestinationCurrencyMeta(form.destination);
  const displayBudget = formatDestinationMoneyFromUsd(form.budget, form.destination);
  const recommendedBudgetUsd = getRecommendedPackageBudgetUsd(form.destination, form.days, form.travelStyle);

  useEffect(() => {
    if (!form.destination || budgetTouched) return;
    setForm((prev) => ({ ...prev, budget: getRecommendedPackageBudgetUsd(prev.destination, prev.days, prev.travelStyle) }));
  }, [form.destination, form.days, form.travelStyle, budgetTouched]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(AI_SUGGESTIONS.slice(0, 6).map((d) => ({ title: d.title, location: d.country || "", src: d.src })));
      setIsSearching(false);
      if (!query) {
        setForm((f) => ({ ...f, destination: "", src: "" }));
      }
      return;
    }

    if (!hasSearchSignal(query)) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();

    const doSearch = async () => {
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1&accept-language=en`,
          { signal: controller.signal }
        );
        const places = await nomRes.json();
        const normalizedQuery = normalizeSearchValue(query);

        const mappedPlaces = Array.isArray(places) ? places
          .map((place) => {
            const rawName = String(place.display_name?.split(",")[0] || "").trim();
            const country = String(
              place.address?.country || place.display_name?.split(",").slice(-1)[0] || ""
            ).trim();

            return {
              rawName,
              country,
              normalizedName: normalizeSearchValue(rawName),
              importance: Number(place.importance) || 0,
              destinationType: String(place.addresstype || place.type || "").toLowerCase(),
              destinationClass: String(place.class || "").toLowerCase(),
            };
          })
          .filter(({ rawName, country, normalizedName, destinationType, destinationClass }) =>
            rawName &&
            country &&
            isValidPlaceLabel(rawName) &&
            normalizedName.includes(normalizedQuery) &&
            (TRUSTED_DESTINATION_TYPES.has(destinationType) || destinationClass === "place" || destinationClass === "boundary")
          ) : [];

        const exactMatches = mappedPlaces.filter(({ normalizedName }) => normalizedName === normalizedQuery);
        const prioritizedPlaces = (exactMatches.length ? exactMatches : mappedPlaces)
          .sort((a, b) => b.importance - a.importance);

        const trustedSeen = new Set();
        const trustedUnique = prioritizedPlaces.filter(({ rawName, country }) => {
          const key = `${normalizeSearchValue(rawName)}|${normalizeSearchValue(country)}`;
          if (trustedSeen.has(key)) return false;
          trustedSeen.add(key);
          return true;
        });

        if (trustedUnique.length > 0) {
          const trustedCards = await Promise.all(
            trustedUnique.slice(0, 6).map(async ({ rawName, country }, idx) => {
              let src = null;
              try {
                const gRes = await fetch(
                  resolveApiUrl(`/api/place-image?query=${encodeURIComponent(`${rawName} ${country}`)}&photoIndex=${idx}&onlyGoogle=1`),
                  { signal: controller.signal }
                );
                if (gRes.ok) {
                  const gData = await gRes.json();
                  if (gData?.url) src = gData.url;
                }
              } catch { }
              return {
                title: rawName,
                location: country,
                src: src || AI_SUGGESTIONS.find((item) => normalizeSearchValue(item.title) === normalizeSearchValue(rawName))?.src || null,
                query: `${rawName} ${country}`.trim(),
              };
            })
          );

          const cardSeen = new Set();
          const dedupedTrustedCards = trustedCards.filter((card) => {
            const key = `${normalizeSearchValue(card.title)}|${normalizeSearchValue(card.location)}`;
            if (cardSeen.has(key)) return false;
            cardSeen.add(key);
            return true;
          });

          if (!controller.signal.aborted) {
            setResults(dedupedTrustedCards);
            setIsSearching(false);
          }
          return;
        }

        if (!controller.signal.aborted) {
          setResults([]);
          setIsSearching(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults(
            AI_SUGGESTIONS
              .filter((d) => normalizeSearchValue(d.title).includes(normalizeSearchValue(query)))
              .slice(0, 6)
              .map((d) => ({ title: d.title, location: d.country || "", src: d.src }))
          );
          setIsSearching(false);
        }
      }
    };

    const timer = setTimeout(doSearch, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelectDest = (r) => {
    setQuery(r.title);
    setBudgetTouched(false);
    setForm(f => ({
      ...f,
      destination: r.title,
      src: r.src,
      budget: getRecommendedPackageBudgetUsd(r.title, f.days, f.travelStyle),
    }));
    setShowDropdown(false);
  };

  const togglePref = (p) => {
    setPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.destination) return;
    try {
      if (createTourPackage) { await createTourPackage.mutateAsync({ ...form, preferences }); }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-20 pb-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-white/[0.03] backdrop-blur-[40px] rounded-[1.5rem] md:rounded-[2rem] border border-[#D4AF37]/20 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_40px_rgba(212,175,55,0.15)] flex flex-col max-h-full overflow-hidden"
          >
            {/* Header (Locked) */}
            <div className="shrink-0 px-6 pt-5 pb-3 border-b border-[#D4AF37]/10 relative z-20 bg-gradient-to-b from-white/[0.05] to-transparent">
              <h3 className="font-display text-xl font-black text-white flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" /> Create AI Tour Package
              </h3>
            </div>

            {/* Internal Scroll Body (Visible Custom Scrollbar!) */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 md:px-6 py-3 relative z-10 w-full text-left">
              <form id="create-package-form" onSubmit={handleCreate} className="space-y-3 w-full">

                {/* Destination */}
                <div className="relative z-50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-1 block">AI Destination Search</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
                    <input
                      type="text" value={query}
                      onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full bg-white/[0.04] border border-[#D4AF37]/20 rounded-xl pl-11 pr-4 py-2 text-sm outline-none focus:border-[#D4AF37] transition-all text-white placeholder-[#D4AF37]/50"
                      placeholder="Where should the package lead? e.g. Alps, Switzerland"
                    />
                  </div>
                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#0f0f0f]/95 backdrop-blur-2xl border border-[#D4AF37]/30 rounded-2xl overflow-y-auto overscroll-contain touch-pan-y shadow-2xl max-h-[14.5rem] md:max-h-80 z-[100] custom-scrollbar"
                      >
                        {isSearching && results.length === 0 ? (
                          <div className="p-4 flex items-center justify-center gap-2 text-center text-[#D4AF37]/50 text-xs uppercase tracking-widest">
                            <Loader2 className="w-4 h-4 animate-spin" /> Scanning World Database...
                          </div>
                        ) : (
                          <>
                            {results.map((r, i) => (
                              <div key={i} onClick={() => handleSelectDest(r)} className="group relative h-20 md:h-24 md:hover:h-28 cursor-pointer flex border-b border-[#D4AF37]/10 last:border-0 transition-all duration-300 overflow-hidden">
                                {r.src ? <img src={r.src} alt={r.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#2a2412] via-[#161616] to-[#0b0b0b]" />}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                                <div className="relative z-10 p-4 flex flex-col justify-end h-full">
                                  <h4 className="text-white font-black text-lg group-hover:text-[#D4AF37] transition-colors">{r.title}</h4>
                                  {!!r.location && <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/70 mt-1 font-bold">{r.location}</p>}
                                </div>
                              </div>
                            ))}
                            {query.trim().length > 2 && !results.some(r => r.title.toLowerCase() === query.trim().toLowerCase()) && (
                              <div
                                onClick={() => {
                                  const fq = query.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                  setBudgetTouched(false);
                                  handleSelectDest({
                                    title: fq,
                                    src: `https://loremflickr.com/800/450/${encodeURIComponent(query.trim().toLowerCase().replace(/[^a-z0-9]/g, '')) || 'city'},landscape/all`,
                                    dynamic: true
                                  });
                                }}
                                className="group relative h-20 md:h-24 md:hover:h-28 cursor-pointer flex border-t border-[#D4AF37]/20 transition-all duration-300 overflow-hidden bg-[#050505]"
                              >
                                <img
                                  src={`https://loremflickr.com/800/450/${encodeURIComponent(query.trim().toLowerCase().replace(/[^a-z0-9]/g, '')) || 'city'},landscape/all`}
                                  alt="Global Match"
                                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

                                <div className="relative z-10 px-5 flex items-center gap-4 h-full w-full">
                                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.2)] backdrop-blur-md">
                                    <Globe className="w-5 h-5 text-[#D4AF37]" />
                                  </div>
                                  <div className="flex flex-col justify-center">
                                    <h4 className="text-white font-black text-lg group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                                      {query.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    </h4>
                                    <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/70 mt-1 flex items-center gap-1.5 font-bold">
                                      <Search className="w-3 h-3" /> Global Database Match
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {results.length === 0 && !isSearching && (
                              <div className="p-4 text-center text-[#D4AF37]/40 text-xs uppercase tracking-widest">
                                {query.trim().length <= 2 ? "Type at least 3 strong letters..." : `No trusted destination found for "${query.trim()}"`}
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Days Input */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-1 block">Number of Days</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => { setBudgetTouched(false); setForm(f => { const days = Math.max(1, f.days - 1); return { ...f, days, budget: getRecommendedPackageBudgetUsd(f.destination, days, f.travelStyle) }; }); }}
                      className="w-10 h-10 rounded-xl bg-white/[0.04] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] hover:bg-white/[0.08] hover:border-[#D4AF37]/50 transition-all">
                      <span className="text-lg font-black">-</span>
                    </button>
                    <div className="flex-1 h-10 bg-white/[0.04] border border-[#D4AF37]/20 rounded-xl flex items-center justify-center text-white font-black">
                      {form.days} {form.days === 1 ? 'Day' : 'Days'}
                    </div>
                    <button type="button" onClick={() => { setBudgetTouched(false); setForm(f => { const days = Math.min(30, f.days + 1); return { ...f, days, budget: getRecommendedPackageBudgetUsd(f.destination, days, f.travelStyle) }; }); }}
                      className="w-10 h-10 rounded-xl bg-white/[0.04] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] hover:bg-white/[0.08] hover:border-[#D4AF37]/50 transition-all">
                      <span className="text-lg font-black">+</span>
                    </button>
                  </div>
                  <p className="text-[8px] text-[#D4AF37]/50 mt-1 uppercase tracking-wider pl-1">Users will select their preferred start dates</p>
                </div>

                {/* Budget */}
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Precision Budget Engine</label>
                    <div className="px-2 py-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] font-black text-[10px] shadow-[0_0_15px_rgba(212,175,55,0.2)] self-start sm:self-auto">
                      {displayBudget}
                      <span className="ml-2 text-[9px] text-white/35">
                        ({currencyMeta.code} · ${form.budget.toLocaleString()})
                      </span>
                    </div>
                  </div>
                  <input type="range" min="150" max="8000" step="50" value={form.budget} onChange={e => { setBudgetTouched(true); setForm({ ...form, budget: parseInt(e.target.value, 10) }); }} className="w-full h-1 rounded-full bg-[#D4AF37]/20 appearance-none cursor-pointer" />
                  {!!form.destination && !budgetTouched && (
                    <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35">
                      Smart baseline for {form.days} days · {form.travelStyle}
                    </p>
                  )}

                  {/* Budget Split */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    {[{ l: "Stay", p: 0.35, c: "from-emerald-500/20" }, { l: "Travel", p: 0.25, c: "from-blue-500/20" }, { l: "Food", p: 0.30, c: "from-orange-500/20" }, { l: "Misc", p: 0.10, c: "from-yellow-500/20" }].map(b => (
                      <div key={b.l} className="bg-white/[0.03] border border-[#D4AF37]/10 rounded-xl p-2 relative overflow-hidden group hover:border-[#D4AF37]/40 transition-colors">
                        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${b.c} to-transparent group-hover:h-full group-hover:opacity-10 transition-all`} />
                        <div className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37]/70 mb-0.5">{b.l}</div>
                        <div className="text-sm font-black text-white">{formatDestinationMoneyFromUsd(Math.round(form.budget * b.p), form.destination)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Travel Architecture */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-1.5 block">Travel Architecture</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {Object.keys(stylePreferencesMap).map(style => (
                      <button type="button" key={style} onClick={() => { setBudgetTouched(false); setForm((prev) => ({ ...prev, travelStyle: style, budget: getRecommendedPackageBudgetUsd(prev.destination, prev.days, style) })); setPreferences([]); }}
                        className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${form.travelStyle === style ? 'bg-gradient-to-br from-[#D4AF37]/20 to-transparent border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-105' : 'bg-white/[0.03] border-[#D4AF37]/10 hover:border-[#D4AF37]/30'}`}
                      >
                        {style === "cultural" && <Globe className={`w-4 h-4 ${form.travelStyle === style ? 'text-[#D4AF37]' : 'text-[#D4AF37]/40'}`} />}
                        {style === "adventure" && <Activity className={`w-4 h-4 ${form.travelStyle === style ? 'text-[#D4AF37]' : 'text-[#D4AF37]/40'}`} />}
                        {style === "nature" && <Sun className={`w-4 h-4 ${form.travelStyle === style ? 'text-[#D4AF37]' : 'text-[#D4AF37]/40'}`} />}
                        {style === "luxury" && <Star className={`w-4 h-4 ${form.travelStyle === style ? 'text-[#D4AF37]' : 'text-[#D4AF37]/40'}`} />}
                        {style === "relaxation" && <Briefcase className={`w-4 h-4 ${form.travelStyle === style ? 'text-[#D4AF37]' : 'text-[#D4AF37]/40'}`} />}
                        <span className={`text-[8px] font-black uppercase tracking-widest ${form.travelStyle === style ? 'text-[#D4AF37]' : 'text-[#D4AF37]/40'}`}>{style}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {form.travelStyle && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
                        <div className="bg-white/[0.03] border border-[#D4AF37]/20 rounded-xl p-3 backdrop-blur-xl">
                          <label className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] mb-2 block flex items-center gap-2"><Settings className="w-3 h-3 text-[#D4AF37]" /> Sub-Preferences Matrix</label>
                          <div className="flex gap-2 flex-wrap">
                            {stylePreferencesMap[form.travelStyle].map(pref => {
                              const active = preferences.includes(pref);
                              return (
                                <button type="button" key={pref} onClick={() => togglePref(pref)}
                                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shadow-md ${active ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black border-transparent shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105' : 'bg-black/80 text-[#D4AF37]/60 border-[#D4AF37]/20 hover:text-[#D4AF37] hover:border-[#D4AF37]/50'}`}
                                >
                                  {pref}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>

            </div>

            {/* Footer Base Strip */}
            <div className="shrink-0 px-4 md:px-6 py-3 border-t border-[#D4AF37]/10 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-black/20 relative z-20">
              <button type="button" onClick={onClose} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/5 rounded-xl">CANCEL</button>
              <button type="button" onClick={handleCreate} disabled={createTourPackage?.isPending} className="bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 text-black font-black uppercase tracking-widest py-2 px-5 rounded-xl text-[10px] flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105 transition-all">
                {createTourPackage?.isPending ? <Loader2 className="w-3 h-3 animate-spin text-black" /> : <Sparkles className="w-3 h-3" />}
                {createTourPackage?.isPending ? "CONNECTING..." : "FINALIZE"}
              </button>
            </div>

            <AnimatePresence>
              {createTourPackage?.isPending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-center items-center">
                  <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
                  <div className="text-[#D4AF37] font-black tracking-widest text-xl">SAVING AI MATRIX</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function Admin() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: adminData, isLoading: adminLoading, refetch } = useAdmin();
  const [localTheme, setLocalTheme] = useState("dark");
  const logout = useLogout();

  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");

  // Modal States
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null); // stores userId
  const [confirmUpdateStatus, setConfirmUpdateStatus] = useState(null); // stores { userId, status }
  const [confirmDeleteTrip, setConfirmDeleteTrip] = useState(null); // stores tripId
  const [confirmDeletePackage, setConfirmDeletePackage] = useState(null); // stores package object
  const [packagesRefreshing, setPackagesRefreshing] = useState(false);

  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const revokeSessions = useRevokeSessions();
  const updateUserStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const deleteTrip = useDeleteTrip();
  const fileInputRef = useRef(null);

  const {
    data: tourPackages = [],
    isLoading: packagesLoading,
    isFetching: packagesFetching,
    refetch: refetchPackages,
  } = useTourPackages();
  const createTourPackage = useCreateTourPackage();
  const deleteTourPackage = useDeleteTourPackage();
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState({
    destination: "", days: 7, budget: 3000, travelStyle: "cultural", preferences: ""
  });

  // Standard Hydration Fix for next-themes
  useEffect(() => { setMounted(true); }, []);

  const activeTheme = mounted ? localTheme : "dark";
  const isDark = activeTheme === "dark";

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || ""
  });
  const [pwdModal, setPwdModal] = useState({ open: false, currentPassword: "", newPassword: "" });

  // Sync form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({ username: user.username, email: user.email });
    }
  }, [user]);

  const handleSaveSettings = async () => {
    try {
      await updateProfile.mutateAsync({ username: formData.username, email: formData.email });
      toast({ title: "Success", description: "Profile updated successfully!", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to update profile", variant: "destructive" });
    }
  };

  const handleChangeAvatar = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateProfile.mutate({ profilePicture: ev.target.result }, {
        onSuccess: () => toast({ title: "Success", description: "Avatar updated!", variant: "success" }),
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePasswordReset = async () => {
    try {
      await updatePassword.mutateAsync({ currentPassword: pwdModal.currentPassword, newPassword: pwdModal.newPassword });
      toast({ title: "Success", description: "Password updated!", variant: "success" });
      setPwdModal({ open: false, currentPassword: "", newPassword: "" });
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to update password", variant: "destructive" });
    }
  };

  const handleRevokeSessions = () => {
    revokeSessions.mutate(undefined, {
      onSuccess: () => toast({ title: "Sessions Revoked", description: "All other sessions terminated.", variant: "success" }),
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      await updateUserStatus.mutateAsync({ userId, status });
      toast({ title: "Updated", description: `User status changed to ${status}.` });
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to update user", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser.mutateAsync(userId);
      toast({ title: "Deleted", description: "User has been removed permanently.", variant: "destructive" });
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to delete user", variant: "destructive" });
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await deleteTrip.mutateAsync(tripId);
      toast({ title: "Cancelled", description: "Trip has been cancelled successfully." });
      refetch();
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to cancel trip", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => { window.location.href = "/"; } });
  };

  const handleRefreshPackages = async () => {
    setPackagesRefreshing(true);
    try {
      const result = await refetchPackages();
      if (result.error) throw result.error;
      toast({
        title: "Packages refreshed",
        description: `${Array.isArray(result.data) ? result.data.length : tourPackages.length} packages loaded.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Refresh failed",
        description: err?.message || "Could not refresh packages right now.",
        variant: "destructive",
      });
    } finally {
      setPackagesRefreshing(false);
    }
  };

  const handleDeletePackage = async (pkg) => {
    try {
      await deleteTourPackage.mutateAsync(pkg?._id);
      toast({
        title: "Package deleted",
        description: `${pkg?.destination || "Tour package"} has been removed.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.message || "Failed to delete package.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      await createTourPackage.mutateAsync({
        ...packageForm,
        preferences: typeof packageForm.preferences === 'string' ? packageForm.preferences.split(",").map(p => p.trim()).filter(Boolean) : packageForm.preferences
      });
      toast({ title: "Success", description: "Tour Package Created!", variant: "success" });
      setPackageModalOpen(false);
      setPackageForm({ destination: "", days: 7, budget: 3000, travelStyle: "cultural", preferences: "" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (userLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Shield className="w-8 h-8" style={{ color: "#7c3aed" }} />
        </motion.div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        <AdminBackground />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-sm px-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <Shield className="w-10 h-10" style={{ color: "#7c3aed" }} />
          </div>
          <h1 className="text-3xl font-black mb-3">Access Restricted</h1>
          <p className="text-[var(--admin-text-muted)] text-sm mb-2">Admin privileges required to view this panel.</p>
          <p className="text-xs text-[var(--admin-text-muted)] mb-8 p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
            Admin: <span className="font-bold text-foreground">{import.meta.env.VITE_ADMIN_EMAIL || "jabubackersiddiq@gmail.com"}</span>
          </p>
          <Link href="/auth">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest"
              style={{ background: "linear-gradient(135deg,#7c3aed,#be185d)", color: "#fff" }}>
              <LogIn className="w-4 h-4" />
              Sign In as Admin
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const users = adminData?.users || [];
  const trips = adminData?.trips || [];
  const logs = adminData?.activity || [];
  const stats = adminData?.stats || {};

  const totalUsers = stats.totalUsers ?? users.length;
  const totalTrips = stats.totalTrips ?? trips.length;
  const aiGen = stats.aiGenerations ?? trips.length;
  const activeToday = stats.activeToday ?? Math.max(1, Math.floor(totalUsers * 0.08));

  const filteredUsers = users.filter(u => u.role !== "admin" && `${u.username} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
  const filteredTrips = trips.filter(t =>
    (t.destination || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.userId?.username || "").toLowerCase().includes(search.toLowerCase())
  );
  const CHART_DATA = stats.platformGrowth || [
    { name: "Jan", users: 100, trips: 40 },
    { name: "Feb", users: 120, trips: 50 },
    { name: "Mar", users: 150, trips: 80 },
    { name: "Apr", users: 180, trips: 100 },
    { name: "May", users: 200, trips: 130 },
    { name: "Jun", users: 240, trips: 160 },
    { name: "Jul", users: 280, trips: 190 },
  ];

  /* ── Tab Content ── */
  const renderContent = () => {
    switch (tab) {
      case "overview": return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <AdminStat label="Total Users" value={totalUsers} icon={Users} delta={12} color="#7c3aed" delay={0} />
            <AdminStat label="Total Trips" value={totalTrips} icon={Globe} delta={8} color="#0ea5e9" delay={0.05} />
            <AdminStat label="AI Generations" value={aiGen} icon={Zap} delta={-3} color="#be185d" delay={0.1} />
            <AdminStat label="Active Today" value={activeToday} icon={TrendingUp} delta={5} color="#10b981" delay={0.15} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 p-4 rounded-xl admin-panel">
              <h3 className="font-black mb-1">Platform Growth</h3>
              <p className="text-xs text-[var(--admin-text-muted)] mb-5">Users & trips over 7 months</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={CHART_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#be185d" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#be185d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--item-bg, rgba(255,255,255,0.04))" />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-muted, rgba(255,255,255,0.35))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted, rgba(255,255,255,0.35))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="users" name="Users" stroke="#7c3aed" strokeWidth={2} fill="url(#uGrad)" />
                  <Area type="monotone" dataKey="trips" name="Trips" stroke="#be185d" strokeWidth={2} fill="url(#tGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col p-4 rounded-xl admin-panel">
              <h3 className="font-black mb-1">Category Split</h3>
              <p className="text-xs text-[var(--admin-text-muted)] mb-4">Budget distribution</p>
              <div className="flex justify-center mb-4">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={SPEND_PIE} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={3} dataKey="value">
                      {SPEND_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {SPEND_PIE.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-xs text-[var(--admin-text-muted)] flex-1">{d.name}</span>
                    <span className="text-xs font-black text-foreground">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl admin-panel">
            <h3 className="font-black mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {logs.slice(0, 2).map((a, i) => (
                <Link prefetch="false" href={`/trips/${a.id}`} key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--admin-hover-bg)] transition-colors border border-white/[0.02]">
                  <span className="text-lg">{a.icon}</span>
                  <span className={`text-sm font-medium flex-1 ${a.color}`}>{a.text}</span>
                  <span className="text-[10px] text-[var(--admin-text-muted)] whitespace-nowrap">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
              {logs.length === 0 && <p className="text-center py-8 text-[var(--admin-text-muted)] text-sm">No recent activity.</p>}
            </div>
          </div>
        </div>
      );

      case "users": return (
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--admin-text-muted)]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                className="w-full h-10 pl-10 pr-3 rounded-xl text-sm outline-none transition-colors"
              />
            </div>
            <span className="text-sm text-[var(--admin-text-muted)]">{filteredUsers.length} users</span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--panel-border, rgba(255,255,255,0.07))" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(124,58,237,0.05)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["User", "Email", "Role", "Updated", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[9px] font-black uppercase tracking-[0.3em] text-[var(--admin-text-muted)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? filteredUsers.map((u, i) => (
                  <tr key={u._id || u.id} className="admin-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-[var(--admin-text-main)] overflow-hidden shrink-0 relative"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#be185d)" }}>
                          <span className="absolute">{(u.username || "U")[0].toUpperCase()}</span>
                          {u.profilePicture && (
                            <img src={u.profilePicture} alt={u.username} className="w-full h-full object-cover relative z-10" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.style.display = 'none'} />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-foreground">{u.username}</span>
                          <PlatformIcon user={u} />
                        </div>
                        {u.status === "suspended" && (
                          <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest">
                            Suspended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--admin-text-muted)] text-xs">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                        style={{
                          background: u.role === "admin" ? "rgba(124,58,237,0.15)" : "var(--item-bg, rgba(255,255,255,0.04))",
                          color: u.role === "admin" ? "#7c3aed" : "inherit",
                          border: `1px solid ${u.role === "admin" ? "rgba(124,58,237,0.3)" : "var(--item-border, rgba(255,255,255,0.08))"}`
                        }}>
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--admin-text-muted)] text-xs">
                      <div className="flex flex-col gap-1">
                        <span>{u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—")}</span>
                        {u.updatedAt && u.createdAt && new Date(u.updatedAt).getTime() > new Date(u.createdAt).getTime() + 60000 ? (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-cyan-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                            Account Updated
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const status = u.status === "suspended" ? "active" : "suspended";
                          setConfirmUpdateStatus({ userId: u._id || u.id, status });
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${u.status === "suspended" ? "text-emerald-400 hover:bg-emerald-400/10" : "text-amber-400 hover:bg-amber-400/10"}`}
                        title={u.status === "suspended" ? "Activate User" : "Suspend User"}
                      >
                        {u.status === "suspended" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteUser(u._id || u.id)}
                        className="p-1.5 rounded-lg text-[var(--admin-text-muted)]/50 hover:text-red-400 transition-colors hover:bg-red-400/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-[var(--admin-text-muted)]">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );

      case "trips": return (
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--admin-text-muted)]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trips…"
                className="w-full h-10 pl-10 pr-3 rounded-xl text-sm outline-none"
              />
            </div>
            <span className="text-sm text-[var(--admin-text-muted)]">{filteredTrips.length} trips</span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--panel-border, rgba(255,255,255,0.07))" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(14,165,233,0.05)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["User", "Destination", "Days", "Budget", "Style", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[9px] font-black uppercase tracking-[0.3em] text-[var(--admin-text-muted)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length > 0 ? filteredTrips.map(t => {
                  const resolvedUser = adminData?.users?.find(u => u._id === (t.userId?._id || t.userId)) || t.userId;
                  const targetPic = resolvedUser?.profilePicture;
                  return (
                    <tr key={t._id || t.id} className="admin-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-5 py-3.5 font-bold">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white overflow-hidden shrink-0 relative"
                            style={{ background: "linear-gradient(135deg,#0ea5e9,#be185d)" }}>
                            <span className="absolute">{(t.userId?.username || "U")[0].toUpperCase()}</span>
                            {targetPic && (
                              <img src={targetPic} alt={t.userId?.username} className="w-full h-full object-cover relative z-10" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.style.display = 'none'} />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[var(--admin-text-main)] truncate">{t.userId?.username || "Unknown"}</span>
                            <PlatformIcon user={resolvedUser} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-black">{t.destination}</td>
                      <td className="px-5 py-3.5 text-[var(--admin-text-muted)] text-xs">{t.days || "—"}d</td>
                      <td className="px-5 py-3.5 capitalize text-[var(--admin-text-muted)] text-xs">{t.budget || "—"}</td>
                      <td className="px-5 py-3.5 capitalize text-[var(--admin-text-muted)] text-xs">{t.travelStyle || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black"
                          style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                          <CheckCircle2 className="w-2.5 h-2.5" /> {(t.status || "active").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 flex items-center gap-2">
                        <Link
                          href={`/trips/${t._id || t.id}`}
                          className="p-1.5 rounded-lg text-[var(--admin-text-muted)]/50 hover:text-[#0ea5e9] transition-colors hover:bg-[#0ea5e9]/10"
                          title="View Trip"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setConfirmDeleteTrip(t._id || t.id)}
                          className="p-1.5 rounded-lg text-[var(--admin-text-muted)]/50 hover:text-red-400 transition-colors hover:bg-red-400/10"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-[var(--admin-text-muted)]">No trips found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );

      case "tour-packages": return (
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">All Packages <span className="text-xs font-normal text-[var(--admin-text-muted)] ml-2">({tourPackages.length})</span></h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshPackages}
                disabled={packagesRefreshing || packagesFetching}
                className="text-[11px] tracking-widest font-black uppercase px-4 py-2.5 rounded-lg transition-all border border-white/10 hover:border-cyan-500/50 text-[var(--admin-text-muted)] hover:text-cyan-400 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${(packagesRefreshing || packagesFetching) ? "animate-spin" : ""}`} /> Refresh
              </button>
              <button onClick={() => setPackageModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] tracking-widest font-black uppercase px-6 py-2.5 rounded-lg transition-all shadow-lg flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add New Package
              </button>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--panel-border, rgba(255,255,255,0.07))" }}>
            {packagesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
                <span className="ml-3 text-sm text-[var(--admin-text-muted)]">Loading packages...</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(14,165,233,0.05)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Creator", "Event (Package)", "Start Date", "End Date", "Country/Dest", "Actions"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[9px] font-black uppercase tracking-[0.3em] text-[var(--admin-text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tourPackages.length > 0 ? tourPackages.map(p => (
                    <tr key={p._id} className="admin-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-5 py-3.5 text-xs text-[var(--admin-text-main)] font-black">Admin</td>
                      <td className="px-5 py-3.5 font-bold">{p.destination} - {p.travelStyle}</td>
                      <td className="px-5 py-3.5 text-[var(--admin-text-muted)] text-xs">{new Date(p.startDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-[var(--admin-text-muted)] text-xs">{new Date(p.endDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-[var(--admin-text-muted)] text-xs font-bold">{p.destination}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setConfirmDeletePackage(p)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-300 transition-colors hover:bg-red-400/10 hover:text-red-200"
                          title={`Delete ${p.destination}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-[var(--admin-text-muted)]">No active tour packages.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <AddPackageModal isOpen={packageModalOpen} onClose={() => setPackageModalOpen(false)} />
        </div>
      );

      case "analytics": return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "API Health", icon: Server, detail: stats.analytics?.apiHealth || "99.9% Uptime", color: "#10b981" },
              { label: "AI Accuracy", icon: Zap, detail: stats.analytics?.aiAccuracy || "Gemini 1.5 Pro", color: "#7c3aed" },
              { label: "Memory Load", icon: Activity, detail: stats.analytics?.memoryLoad || "42% Usage", color: "#0ea5e9" },
              { label: "DB Latency", icon: Database, detail: stats.analytics?.dbLatency || "12ms Avg", color: "#f59e0b" },
            ].map(({ label, icon: Icon, detail, color }) => (
              <div key={label} className="p-5 rounded-2xl admin-panel">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>Status: OK</div>
                </div>
                <p className="font-black text-sm">{label}</p>
                <p className="text-[10px] text-[var(--admin-text-muted)] mt-0.5 uppercase tracking-tighter">{detail}</p>
              </div>
            ))}
          </div>
          <div className="p-6 rounded-2xl admin-panel">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6">Real-time Traffic</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="anaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted, rgba(255,255,255,0.3))', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted, rgba(255,255,255,0.3))', fontSize: 10 }} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={3} fill="url(#anaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case "settings": return (
        <div className="max-w-4xl mx-auto p-12 rounded-[24px] admin-panel">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-12 text-[var(--admin-text-main)] border-b border-[var(--admin-panel-border)] pb-4">
            Admin Profile
          </h3>

          <div className="flex flex-col md:flex-row gap-16">
            {/* Avatar Section */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="w-32 h-32 rounded-full overflow-hidden relative group cursor-pointer border-[3px]"
                style={{ borderColor: 'var(--admin-panel-border)' }}
                onClick={handleChangeAvatar}
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Admin" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : (
                  <div className="w-full h-full bg-[var(--admin-hover-bg)] flex items-center justify-center">
                    <BrandMark size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Pencil className="w-6 h-6 text-white" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <button onClick={handleChangeAvatar} className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--admin-text-muted)] hover:text-cyan-400 transition-colors">
                Change Picture
              </button>
            </div>

            {/* Flat Form Grid */}
            <div className="flex-1 space-y-10 pt-2">
              <div className="border-b" style={{ borderColor: 'var(--admin-chart-grid)' }}>
                <label className="text-[10px] font-bold uppercase tracking-widest block mb-2 text-[var(--admin-text-muted)]">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full text-lg font-bold bg-transparent outline-none p-0 pb-2 text-[var(--admin-text-main)] transition-colors focus:text-cyan-400"
                />
              </div>

              <div className="border-b" style={{ borderColor: 'var(--admin-chart-grid)' }}>
                <label className="text-[10px] font-bold uppercase tracking-widest block mb-2 text-[var(--admin-text-muted)]">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-lg font-bold bg-transparent outline-none p-0 pb-2 text-[var(--admin-text-main)] transition-colors focus:text-cyan-400"
                />
              </div>

              <div className="pt-8">
                <button
                  onClick={handleSaveSettings}
                  disabled={updateProfile.isPending}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[11px] tracking-widest font-black uppercase px-12 py-3.5 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50 flex items-center gap-3"
                >
                  {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden no-scrollbar admin-root ${isDark ? "dark" : ""}`}>
      <div className="fixed inset-0 z-[-2]">
        <DashboardSlideshow />
      </div>
      <div className="fixed inset-0 z-[-1] pointer-events-none transition-colors duration-700 bg-[var(--admin-panel-bg)] backdrop-blur-[30px]" />

      <style dangerouslySetInnerHTML={{
        __html: `
        .admin-root {
          /* Light Mode */
          --admin-text-main: #0f172a;
          --admin-text-muted: #334155;
          --admin-panel-bg: rgba(255, 255, 255, 0.65);
          --admin-panel-border: rgba(255, 255, 255, 0.4);
          --admin-hover-bg: rgba(0, 0, 0, 0.05);
          --admin-chart-grid: rgba(0, 0, 0, 0.05);
        }
        .admin-root.dark {
          /* Dark Mode */
          --admin-text-main: #ffffff;
          --admin-text-muted: rgba(255, 255, 255, 0.5);
          --admin-panel-bg: rgba(0, 0, 0, 0.4);
          --admin-panel-border: rgba(255, 255, 255, 0.05);
          --admin-hover-bg: rgba(255, 255, 255, 0.05);
          --admin-chart-grid: rgba(255, 255, 255, 0.05);
        }
        
        .admin-root { color: var(--admin-text-main); transition: color 0.3s ease; }
        
        .admin-panel {
          background: var(--admin-panel-bg);
          border: 1px solid var(--admin-panel-border);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
          border-radius: 1rem;
          transition: all 0.3s ease;
        }
        
        .admin-row {
          border-bottom: 1px solid var(--admin-chart-grid);
          transition: background 0.2s ease;
        }
        .admin-row:hover {
          background: var(--admin-hover-bg);
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />


      {/* ── PREMIUM TRAVEL NAVBAR ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Top accent gradient */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4, #f59e0b, #ec4899, #7c3aed)' }} />

        <div className="w-full h-[68px] bg-[var(--admin-panel-bg)] backdrop-blur-2xl border-b border-[var(--admin-panel-border)] flex justify-center">
          <div className="w-full max-w-[1600px] px-8 md:px-14 xl:px-20 h-full grid grid-cols-[1fr,auto,1fr] items-center">

            {/* Left: Brand + Admin Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center justify-start"
            >
              <Link href="/" className="hover:opacity-80 transition-all duration-300 animate-float">
                <BrandLogo size={32} titleClassName="text-[17px] text-shimmer-prismatic font-black tracking-tight leading-tight" />
              </Link>
            </motion.div>

            {/* Center: Navigation Tabs */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="hidden md:flex items-center justify-center"
            >
              <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: 'var(--admin-hover-bg)', border: '1px solid var(--admin-panel-border)' }}>
                {NAV_TABS.map(({ id, label, icon: TabIcon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`relative px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all duration-300 ${tab === id
                      ? 'text-[var(--admin-text-main)]'
                      : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                      }`}
                  >
                    {tab === id && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'var(--admin-panel-bg)', border: '1px solid var(--admin-panel-border)', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.2)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                    <TabIcon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Right: Theme + Profile + Logout */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-end gap-3"
            >
              {/* Theme Toggle */}
              <button
                onClick={() => setLocalTheme(isDark ? 'light' : 'dark')}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition-all duration-300 hover:bg-[var(--admin-hover-bg)]"
                style={{ border: '1px solid var(--admin-panel-border)' }}
                title={isDark ? 'Switch to Light' : 'Switch to Dark'}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDark ? 'moon' : 'sun'}
                    initial={{ rotate: -90, opacity: 0, scale: 0 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* Divider */}
              <div className="w-px h-7" style={{ background: 'var(--admin-panel-border)' }} />

              {/* Profile Pill */}
              <div
                onClick={() => setTab('settings')}
                className={`h-10 pl-1.5 pr-4 rounded-full flex items-center gap-3 cursor-pointer transition-all duration-300 ${tab === 'settings'
                  ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                  : 'hover:bg-[var(--admin-hover-bg)]'
                  }`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 transition-all ${tab === 'settings' ? 'ring-2 ring-cyan-400/50' : 'ring-1 ring-[var(--admin-panel-border)]'}`}>
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <div className={`w-full h-full items-center justify-center text-[10px] font-black text-white ${user?.profilePicture ? 'hidden' : 'flex'}`}
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
                    {(user?.username || 'A')[0].toUpperCase()}
                  </div>
                </div>
                {/* Name + Status */}
                <div className="hidden lg:flex flex-col">
                  <span className={`text-[10px] font-black tracking-widest leading-none uppercase ${tab === 'settings' ? 'text-cyan-400' : 'text-[var(--admin-text-main)]'}`}>
                    {user?.username || 'Admin'}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">Online</span>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--admin-text-muted)] hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 active:scale-95"
                style={{ border: '1px solid var(--admin-panel-border)' }}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <div className="fixed top-[70px] left-0 right-0 z-40 md:hidden">
        <div className="h-12 bg-[var(--admin-panel-bg)] backdrop-blur-xl border-b border-[var(--admin-panel-border)] flex items-center justify-center px-4">
          <div className="flex items-center gap-1 p-1 rounded-xl w-full max-w-sm" style={{ background: 'var(--admin-hover-bg)' }}>
            {NAV_TABS.map(({ id, label, icon: TabIcon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${tab === id
                  ? 'text-[var(--admin-text-main)] bg-[var(--admin-panel-bg)] shadow-sm'
                  : 'text-[var(--admin-text-muted)]'
                  }`}
                style={tab === id ? { border: '1px solid var(--admin-panel-border)' } : {}}
              >
                <TabIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="relative pt-[84px] z-10 no-scrollbar">
        <div className="max-w-[1600px] mx-auto px-8 md:px-14 xl:px-20 pb-4">
          {/* Page title bar */}
          <div className="flex items-center justify-between mb-3 pt-0">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-px w-6" style={{ background: "linear-gradient(90deg,#7c3aed,transparent)" }} />
                <span className="text-[8px] font-black uppercase tracking-[0.5em]" style={{ color: "rgba(124,58,237,0.7)" }}>Control Center</span>
              </div>
              <h1 className="text-2xl font-black">{NAV_TABS.find(n => n.id === tab)?.label || "Dashboard"}</h1>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black px-3 py-2 rounded-xl"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
              All Systems Online
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Premium Modals */}
      <ConfirmDialog
        open={!!confirmDeleteUser}
        onOpenChange={(open) => !open && setConfirmDeleteUser(null)}
        onConfirm={() => {
          handleDeleteUser(confirmDeleteUser);
          setConfirmDeleteUser(null);
        }}
        title="Delete User Account?"
        description="This action is permanent. All associated data will be lost forever."
      />

      <ConfirmDialog
        open={!!confirmUpdateStatus}
        onOpenChange={(open) => !open && setConfirmUpdateStatus(null)}
        onConfirm={() => {
          handleUpdateUserStatus(confirmUpdateStatus.userId, confirmUpdateStatus.status);
          setConfirmUpdateStatus(null);
        }}
        variant="default"
        title={confirmUpdateStatus?.status === "suspended" ? "Suspend User?" : "Activate User?"}
        description={confirmUpdateStatus?.status === "suspended"
          ? "The user will no longer be able to log in to the platform."
          : "The user will regain access to all features."}
        confirmText={confirmUpdateStatus?.status === "suspended" ? "Suspend" : "Activate"}
      />

      <ConfirmDialog
        open={!!confirmDeleteTrip}
        onOpenChange={(open) => !open && setConfirmDeleteTrip(null)}
        onConfirm={() => {
          handleDeleteTrip(confirmDeleteTrip);
          setConfirmDeleteTrip(null);
        }}
        title="Cancel Trip Plan?"
        description="This will remove the generated itinerary and itinerary data."
      />

      <ConfirmDialog
        open={!!confirmDeletePackage}
        onOpenChange={(open) => !open && setConfirmDeletePackage(null)}
        onConfirm={() => {
          handleDeletePackage(confirmDeletePackage);
          setConfirmDeletePackage(null);
        }}
        title="Delete Tour Package?"
        description={`This will permanently remove ${confirmDeletePackage?.destination || "this package"} from the packages list.`}
        confirmText="Delete Package"
      />

      {/* Password Reset Modal */}
      <AnimatePresence>
        {pwdModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPwdModal({ ...pwdModal, open: false })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-[24px] p-8 border"
              style={{ background: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Change Password</h3>
              <p className="text-sm text-slate-400 mb-6">Enter your current and new password.</p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Current Password</label>
                  <input type="password" value={pwdModal.currentPassword} onChange={e => setPwdModal({ ...pwdModal, currentPassword: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold text-white focus:border-violet-500/50 transition-all outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">New Password</label>
                  <input type="password" value={pwdModal.newPassword} onChange={e => setPwdModal({ ...pwdModal, newPassword: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold text-white focus:border-violet-500/50 transition-all outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={() => setPwdModal({ ...pwdModal, open: false })} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={handlePasswordReset} disabled={updatePassword.isPending || !pwdModal.currentPassword || !pwdModal.newPassword}
                  className="px-5 py-2.5 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-400 disabled:opacity-50 transition-all flex items-center gap-2">
                  {updatePassword.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Update Password
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
