/**
 * Explore — World destination discovery.
 * Premium fixed hero + seamless search results section.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, Globe, Sparkles, X, Loader2, ArrowRight } from "lucide-react";
import { sanitizeVisibleText } from "@/lib/display-text";
import AppInnerLayout from "@/components/AppInnerLayout";
import DashboardSlideshow from "@/components/ui/DashboardSlideshow";
import { DestinationCard } from "@/components/ui/card-21";
import { usePlaceImage, PlaceImage } from "@/hooks/use-place-image";

function normalizeSearchValue(value = "") {
  return sanitizeVisibleText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasSearchSignal(query = "") {
  const compact = normalizeSearchValue(query).replace(/[\s'-]/g, "");
  if (compact.length < 3) return false;
  if (/^(.)\1+$/.test(compact)) return false;
  return new Set(compact.split("")).size >= 3;
}

function isValidPlaceLabel(name = "") {
  const compact = normalizeSearchValue(name).replace(/[\s'-]/g, "");
  if (compact.length < 3) return false;
  if (/^(.)\1+$/.test(compact)) return false;
  return new Set(compact.split("")).size >= 3;
}

// ─── All static destinations ──────────────────────────────────────────────────
const DESTINATIONS = [
  { id: 1, name: "Kyoto", country: "Japan", score: 98, tags: ["Cultural", "Spiritual"], region: "Asia", theme: "30 60% 20%", photo: "1640546088631-fd6e3e88dec0" }, // Fushimi Inari (from planner GALLERY)
  { id: 2, name: "Santorini", country: "Greece", score: 99, tags: ["Luxury", "Scenic"], region: "Europe", theme: "210 70% 25%", photo: "1570077188670-e3a8d69ac5ff" }, // Blue domes (known working)
  { id: 3, name: "Dubai", country: "UAE", score: 97, tags: ["Luxury", "Shopping"], region: "Middle East", theme: "250 50% 28%", photo: "1512453979798-5ea266f8880c" }, // Burj Khalifa (from planner)
  { id: 4, name: "Istanbul", country: "Turkey", score: 95, tags: ["Cultural", "History"], region: "Middle East", theme: "0 55% 22%", photo: "1524231757912-21f4fe3a7200" }, // Known working
  { id: 5, name: "Marrakech", country: "Morocco", score: 92, tags: ["Cultural", "Adventure"], region: "Africa", theme: "28 65% 22%", photo: "1539020140153-e479b8c22e70" }, // Known working
  { id: 6, name: "Bali", country: "Indonesia", score: 94, tags: ["Relaxation", "Nature"], region: "Asia", theme: "150 45% 20%", photo: "1537953773345-d172ccf13cf1" }, // Known working
  { id: 7, name: "Paris", country: "France", score: 93, tags: ["Cultural", "Romance"], region: "Europe", theme: "220 45% 25%", photo: "1431274172761-fca41d930114" }, // Eiffel Tower verified
  { id: 8, name: "Cappadocia", country: "Turkey", score: 96, tags: ["Adventure", "Scenic"], region: "Middle East", theme: "24 55% 22%", photo: "1570939274717-7eda259b50ed" }, // Cappadocia balloons verified
  { id: 9, name: "Maldives", country: "Maldives", score: 98, tags: ["Luxury", "Beach"], region: "Asia", theme: "185 65% 22%", photo: "1514282401047-d79a71a590e8" }, // Known working
  { id: 10, name: "New York", country: "USA", score: 91, tags: ["Urban", "Culture"], region: "Americas", theme: "220 40% 25%", photo: "1522083165195-3424ed129620" }, // NYC skyline verified
  { id: 11, name: "Petra", country: "Jordan", score: 94, tags: ["History", "Adventure"], region: "Middle East", theme: "20 50% 22%", photo: "1580834341580-8c17a3a630ca" }, // Petra Treasury rose-red verified
  { id: 12, name: "Samarkand", country: "Uzbekistan", score: 93, tags: ["History", "Silk Road"], region: "Asia", theme: "35 55% 22%", photo: "https://images.unsplash.com/photo-1715540335594-2ad77795ba09?auto=format&fit=crop&q=82&w=720" },
  { id: 13, name: "Reykjavik", country: "Iceland", score: 95, tags: ["Nature", "Aurora"], region: "Europe", theme: "200 60% 20%", photo: "1476514525535-07fb3b4ae5f1" }, // Iceland landscape verified
  { id: 14, name: "Mecca", country: "Saudi Arabia", score: 100, tags: ["Spiritual", "Halal"], region: "Middle East", theme: "40 50% 22%", photo: "https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?auto=format&fit=crop&q=82&w=720" },
  { id: 15, name: "Medina", country: "Saudi Arabia", score: 99, tags: ["Spiritual", "Halal"], region: "Middle East", theme: "38 48% 22%", photo: "https://images.unsplash.com/photo-1729931421786-7bbd6c7d78f6?auto=format&fit=crop&q=82&w=720" },
  { id: 16, name: "Tokyo", country: "Japan", score: 96, tags: ["Cultural", "Modern"], region: "Asia", theme: "350 50% 22%", photo: "1540959733332-eab4deabeeaf" }, // Shibuya crossing (from planner)
  { id: 17, name: "Rome", country: "Italy", score: 94, tags: ["History", "Cultural"], region: "Europe", theme: "15 55% 22%", photo: "1552832230-c0197dd311b5" }, // Colosseum (known working)
  { id: 18, name: "Barcelona", country: "Spain", score: 93, tags: ["Cultural", "Beach"], region: "Europe", theme: "10 55% 22%", photo: "1583422409516-2895a77efded" }, // Known working
  { id: 19, name: "Venice", country: "Italy", score: 92, tags: ["Luxury", "Romance"], region: "Europe", theme: "200 50% 22%", photo: "1523906834658-6e24ef2386f9" }, // Known working
  { id: 20, name: "Singapore", country: "Singapore", score: 98, tags: ["Modern", "Urban"], region: "Asia", theme: "160 45% 20%", photo: "1702085241418-e87b3b60a497" }, // Known working
  { id: 21, name: "Amalfi Coast", country: "Italy", score: 96, tags: ["Luxury", "Romance"], region: "Europe", theme: "185 50% 20%", photo: "1537996194471-e657df975ab4" }, // Known working
  { id: 22, name: "Chennai", country: "India", score: 90, tags: ["Culture", "History"], region: "Asia", theme: "200 45% 22%", photo: "1661366698983-3cb843219300" }, // Known working (from planner)
  { id: 23, name: "Amsterdam", country: "Netherlands", score: 93, tags: ["Culture", "Canals"], region: "Europe", theme: "195 55% 22%", photo: "1512470876302-972faa2aa9a4" }, // Known working
  { id: 24, name: "London", country: "UK", score: 94, tags: ["History", "Culture"], region: "Europe", theme: "210 45% 22%", photo: "1533929736458-ca588d08c8be" }, // Big Ben/Tower Bridge verified
];

const REGIONS = ["All", "Asia", "Europe", "Middle East", "Americas", "Africa"];

const EXPLORE_IMAGES = [
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1400&q=80&auto=format&fit=crop", // Airplane window / Travel
  "https://images.unsplash.com/photo-1517511620798-cec17d428bc0?w=1400&q=80&auto=format&fit=crop", // Hot air balloons (Cappadocia)
  "https://images.unsplash.com/photo-1600018868616-e575ee7072cc?w=1400&q=80&auto=format&fit=crop", // Angkor Wat, Cambodia (Historical)
  "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1400&q=80&auto=format&fit=crop", // Northern Lights / Arctic (Adventure)
  "https://images.unsplash.com/photo-1548013146-72479768bada?w=1400&q=80&auto=format&fit=crop", // Taj Mahal (Historical)
  "https://images.unsplash.com/photo-1508804185872-d7bad800d9b4?w=1400&q=80&auto=format&fit=crop", // Great Wall of China (Historical)
  "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1400&q=80&auto=format&fit=crop", // Himalayan Mountains (Adventure)
  "https://images.unsplash.com/photo-1555992828-ca4dbe41d294?w=1400&q=80&auto=format&fit=crop", // Acropolis of Athens (Historical)
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1400&q=80&auto=format&fit=crop", // Asian temples (Historical)
  "https://images.unsplash.com/photo-1505521216430-8b73b2067df0?w=1400&q=80&auto=format&fit=crop", // Canyon Exploration (Adventure)
  "https://images.unsplash.com/photo-1620215707736-eb216ccfbaff?w=1400&q=80&auto=format&fit=crop", // Amazon River / Jungle (Adventure)
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1400&q=80&auto=format&fit=crop", // Venice Canals
  "https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?w=1400&q=80&auto=format&fit=crop", // Global adventure vibe
];

// ─── Search hook: Nominatim + Google Places API ──────────────────────────────
function useDestSearch(query) {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    setEmpty(false);
    const normalizedQuery = normalizeSearchValue(query);
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    if (!hasSearchSignal(query)) {
      setResults([]);
      setIsSearching(false);
      setEmpty(query.trim().length >= 3);
      return;
    }
    setIsSearching(true);
    const ctrl = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        // 1. Nominatim — real place validation
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&accept-language=en`,
          { signal: ctrl.signal }
        );
        const places = await nomRes.json();
        if (!places.length) { setResults([]); setEmpty(true); setIsSearching(false); return; }

        const mappedPlaces = places
          .map((place) => {
            const rawName = sanitizeVisibleText(place.display_name?.split(",")[0], "");
            const country = sanitizeVisibleText(
              place.address?.country || place.display_name?.split(",").slice(-1)[0],
              ""
            );
            return {
              rawName,
              country,
              normalizedName: normalizeSearchValue(rawName),
              importance: Number(place.importance) || 0,
              place,
            };
          })
          .filter(({ rawName, country, normalizedName }) =>
            rawName &&
            country &&
            isValidPlaceLabel(rawName) &&
            normalizedName.includes(normalizedQuery)
          );

        const exactMatches = mappedPlaces.filter(({ normalizedName }) => normalizedName === normalizedQuery);
        const prioritizedPlaces = (exactMatches.length ? exactMatches : mappedPlaces)
          .sort((a, b) => b.importance - a.importance);

        const seen = new Set();
        const unique = prioritizedPlaces.filter(({ rawName, country }) => {
          const key = `${normalizeSearchValue(rawName)}|${normalizeSearchValue(country)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (!unique.length) {
          setResults([]);
          setEmpty(true);
          setIsSearching(false);
          return;
        }

        // 3. Fetch Google Places photo for each via backend proxy
        const cards = await Promise.all(
          unique.slice(0, 4).map(async ({ rawName, country }) => {
            const displayName = sanitizeVisibleText(rawName, "Destination");
            // Use Google Places via backend proxy — query includes country context for accuracy
            const searchQuery = `${rawName}${country ? " " + country : ""}`;
            let src = null;
            try {
              const r = await fetch(`/api/place-image?query=${encodeURIComponent(searchQuery)}`, { signal: ctrl.signal });
              if (r.ok) {
                const d = await r.json();
                src = d?.url || null;
              }
            } catch { }
            if (!src) src = `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=720`;
            return { title: displayName, location: country, src, query: searchQuery };
          })
        );

        const cardSeen = new Set();
        const dedupedCards = cards.filter((card) => {
          const key = `${normalizeSearchValue(card.title)}|${normalizeSearchValue(card.location)}`;
          if (cardSeen.has(key)) return false;
          cardSeen.add(key);
          return true;
        });

        setResults(dedupedCards);
        setEmpty(dedupedCards.length === 0);
      } catch (e) {
        if (e.name !== "AbortError") setEmpty(true);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => { clearTimeout(timeout); ctrl.abort(); };
  }, [query]);

  return { isSearching, results, empty };
}

// ─── Static Destination Card with Google Places image ─────────────────────────
function ExploreDestCard({ dest }) {
  const query = `${dest.name} ${dest.country} landmark`;
  const { src } = usePlaceImage(query);
  // Unsplash fallback while Google Places loads or if unavailable
  const fallbackImg = dest.photo.startsWith("http")
    ? dest.photo
    : `https://images.unsplash.com/photo-${dest.photo}?auto=format&fit=crop&q=82&w=720`;
  const imgUrl = src || fallbackImg;

  return (
    <DestinationCard
      imageUrl={imgUrl}
      location={dest.name}
      country={dest.country}
      score={dest.score}
      tags={dest.tags}
      themeColor={dest.theme}
      plannerHref={`/planner?dest=${encodeURIComponent(dest.name)}`}
      className="h-full"
    />
  );
}

// ─── Premium Destination Card (for search results) ────────────────────────────
function SearchResultCard({ card, idx, onSelect }) {
  const safeTitle = sanitizeVisibleText(card.title, "Destination");
  const safeLocation = sanitizeVisibleText(card.location);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onSelect(card)}
      layoutId={`dest-${card.title}`}
      className="glass-card rounded-[2rem] border border-white/[0.08] shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] transition-all duration-500 flex flex-col group relative overflow-hidden cursor-pointer"
      style={{ height: 280 }}
    >
      {/* Subtle top glare */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-20 pointer-events-none" />

      {/* Image */}
        <img
          src={card.src}
          alt={safeTitle}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        onError={e => { e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=720"; }}
      />
      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 70% 5%,rgba(212,175,55,0.15) 0%,transparent 60%)" }} />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: "rgba(212,175,55,0.9)" }}>
          <MapPin className="inline w-3 h-3 mr-1.5" />{safeLocation}
        </p>
        <h3 className="font-display text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight group-hover:text-[#D4AF37] transition-colors">{safeTitle}</h3>

        {/* CTA */}
        <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
          <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em]">Plan This Trip</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Explore Page ────────────────────────────────────────────────────────
export default function Explore() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [, setLocation] = useLocation();
  const resultsRef = useRef(null);
  const inputRef = useRef(null);

  const { isSearching, results, empty } = useDestSearch(search);
  const isSearchMode = search.trim().length >= 2;

  // Scroll to results — only when search MODE first activates (not on every result update)
  const prevSearchMode = useRef(false);
  useEffect(() => {
    if (isSearchMode && !prevSearchMode.current && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
    prevSearchMode.current = isSearchMode;
  }, [isSearchMode]);

  const filteredStatic = DESTINATIONS.filter(d =>
    (region === "All" || d.region === region)
  );

  const handleSelect = useCallback((card) => {
    setLocation(`/planner?dest=${encodeURIComponent(card.title)}`);
  }, [setLocation]);

  return (
    <AppInnerLayout noPadding>

      {/* ── Full-page cinematic background — Fixed to viewport ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <DashboardSlideshow customImages={EXPLORE_IMAGES} />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* ── HERO — constrained height ─────────────────────────── */}
      <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16 flex flex-col items-center justify-center text-center px-4"
        style={{ zIndex: 10 }}>

        {/* Top gradient for navbar legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* Ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(212,175,55,0.08) 0%,transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(6,182,212,0.06) 0%,transparent 70%)", filter: "blur(50px)" }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-3xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#D4AF37]/35 mb-8"
            style={{ backdropFilter: "blur(16px)", background: "rgba(212,175,55,0.08)" }}
          >
            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Rihla AI — World Discovery Engine</span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-black text-white leading-[0.9] uppercase mb-4"
            style={{ fontSize: "clamp(2.5rem,5vw,4rem)", letterSpacing: "-0.02em" }}>
            Explore{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-[#D4AF37] to-amber-500">
              The World
            </span>
          </h1>

          <p className="text-white/60 text-sm md:text-base font-semibold max-w-xl mx-auto mb-10 leading-relaxed">
            Search any city, country, or landmark on Earth. Powered by real-time global intelligence.
          </p>

          {/* ── SEARCH BAR ─────────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto relative">
            {/* Glow aura */}
            <div className="absolute -inset-1 rounded-3xl opacity-0 focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: "radial-gradient(ellipse,rgba(212,175,55,0.12) 0%,transparent 70%)", filter: "blur(20px)" }} />

            <div className="relative flex items-center rounded-2xl border border-white/12 focus-within:border-[#D4AF37]/50 transition-all duration-400"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(30px)" }}>
              <div className="pl-6 shrink-0 transition-all duration-300">
                {isSearching
                  ? <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                  : <Search className="w-5 h-5 text-[#D4AF37]" />}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cities, countries, or landmarks - Chennai, London, Petra..."
                className="w-full bg-transparent py-5 pl-4 pr-4 text-white text-sm md:text-base placeholder:text-white/25 focus:outline-none font-medium"
              />
              {search && (
                <button onClick={() => { setSearch(""); inputRef.current?.focus(); }}
                  className="pr-6 text-white/25 hover:text-white/70 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="mt-3 text-white/20 text-[9px] font-black uppercase tracking-[0.35em] text-center">
              {isSearchMode ? "Searching trusted places..." : "Type at least 3 strong letters to discover real destinations"}
            </p>
          </div>

          {/* Region filters — only when not searching */}
          {!isSearchMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-2 mt-6"
            >
              {REGIONS.map(r => (
                <motion.button
                  key={r}
                  onClick={() => setRegion(r)}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300"
                  style={region === r
                    ? { background: "#D4AF37", color: "#000", borderColor: "#D4AF37", boxShadow: "0 0 22px rgba(212,175,55,0.5)" }
                    : { background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.1)" }
                  }
                >{r}</motion.button>
              ))}
            </motion.div>
          )}

          {/* Scroll hint */}
          {!isSearchMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-12 flex flex-col items-center gap-2"
            >
              <span className="text-white/20 text-[9px] uppercase tracking-[0.5em] font-black">Browse Destinations</span>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                className="w-px h-8 bg-gradient-to-b from-[#D4AF37]/50 to-transparent" />
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── CONTENT SECTION ─────────────────────────────────────────────── */}
      <div className="relative z-10" ref={resultsRef}>
        {/* Semi-transparent dark layer — softly ramps up to ensure text legibility over images without a hard horizontal cut */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.95) 100%)" }} />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pb-32">

          <AnimatePresence mode="wait">

            {/* ── SEARCH RESULTS ─────────────────────────────────────────── */}
            {isSearchMode && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="pt-8"
              >
                {/* Section header */}
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_16px_rgba(212,175,55,0.5)]" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/60 mb-0.5">Rihla AI</p>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {isSearching ? "Scanning the World..." :
                        empty ? `No results for "${search}"` :
                          `${results.length} ${results.length === 1 ? "Destination" : "Destinations"} Found`}
                    </h2>
                  </div>
                </div>

                {isSearching ? (
                  /* ── Scanning animation ── */
                  <div className="flex flex-col items-center justify-center py-28 space-y-6">
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/20" />
                      <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
                      <div className="absolute inset-3 rounded-full border-b-2 border-[#D4AF37]/40"
                        style={{ animation: "spin 1.5s linear infinite reverse" }} />
                      <Globe className="absolute inset-0 m-auto w-8 h-8 text-[#D4AF37] animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-[#D4AF37] font-black text-[11px] tracking-[0.5em] uppercase animate-pulse">
                        Scanning the World...
                      </p>
                      <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.3em]">
                        Querying global location database
                      </p>
                    </div>
                  </div>
                ) : empty ? (
                  /* ── Empty state ── */
                  <div className="flex flex-col items-center justify-center py-28 space-y-4">
                    <Globe className="w-12 h-12 text-white/10" />
                    <p className="text-white/35 text-base font-semibold">No trusted destination found for "{search}"</p>
                    <p className="text-white/15 text-[10px] tracking-[0.35em] uppercase font-black">Try a full city, country, or landmark name</p>
                  </div>
                ) : (
                  /* ── Results grid ── */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {results.map((card, i) => (
                        <SearchResultCard key={card.title + i} card={card} idx={i} onSelect={handleSelect} />
                      ))}
                    </div>
                    <p className="text-center text-white/15 text-[9px] uppercase tracking-[0.4em] font-black pt-4">
                      Click any destination to open the AI planner
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── BROWSE GRID ─────────────────────────────────────────────── */}
            {!isSearchMode && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="pt-6"
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_16px_rgba(212,175,55,0.5)]" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/60 mb-0.5">Rihla AI</p>
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        {region === "All" ? "All Destinations" : `${region} - ${filteredStatic.length} found`}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/15">
                    <Star className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-wider">AI-Scored</span>
                  </div>
                </div>

                {filteredStatic.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredStatic.map((dest, i) => {
                      // Use a Google-Places-aware dynamic component for each card
                      return (
                        <motion.div
                          key={dest.id}
                          initial={{ opacity: 0, y: 28 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.04, 0.5), duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                          style={{ height: 300 }}
                        >
                          <ExploreDestCard dest={dest} />
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-28">
                    <Globe className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/25 text-sm">No destinations in this region.</p>
                    <button onClick={() => setRegion("All")}
                      className="mt-4 text-[#D4AF37] text-xs font-black uppercase tracking-wider hover:underline">
                      Show All
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </AppInnerLayout>
  );
}

