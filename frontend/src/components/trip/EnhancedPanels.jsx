import { useEffect, useMemo, useState } from "react";
import {
  Bed,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  ExternalLink,
  Lightbulb,
  Moon,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Users,
  Utensils,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceImage, usePlaceImage } from "@/hooks/use-place-image";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { sanitizeTextList, sanitizeVisibleText } from "@/lib/display-text";
import { buildDestinationHeroQueries } from "@/lib/trip-itinerary";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function mapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function normalizeDestination(destination = "") {
  return sanitizeVisibleText(destination.split(",")[0], "Destination");
}

function ensureFourItems(items = [], fallbacks = []) {
  const cleanItems = sanitizeTextList(items);
  const cleanFallbacks = sanitizeTextList(fallbacks);
  const merged = [];

  for (const item of cleanItems) {
    if (item && !merged.includes(item)) merged.push(item);
  }

  for (const item of cleanFallbacks) {
    if (item && !merged.includes(item)) merged.push(item);
  }

  return merged.slice(0, 4);
}

function titleFromTip(tip = "", index = 0, destination = "") {
  const clean = sanitizeVisibleText(tip);
  if (!clean) return `Field Note ${index + 1}`;
  const parts = clean
    .replace(/^cultural note:\s*/i, "")
    .replace(/^getting around:\s*/i, "")
    .split(/[.!?-]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const base = parts[0] || clean;
  const short = base.split(/\s+/).slice(0, 4).join(" ");
  if (/^field note/i.test(short)) return `${sanitizeVisibleText(destination || "Trip")} Tip ${index + 1}`;
  return short;
}

function buildSectionItems({ title, destination, aiSuggestions = {}, travelStyle = "", dayTheme = "" }) {
  const dest = normalizeDestination(destination);
  const style = sanitizeVisibleText(travelStyle || "balanced");
  const theme = sanitizeVisibleText(dayTheme || "signature");

  const hiddenGems = sanitizeTextList(aiSuggestions.hidden_gems || []);
  const foodPlaces = sanitizeTextList(aiSuggestions.food_places || aiSuggestions.food || []);
  const lodging = sanitizeTextList(aiSuggestions.lodging || aiSuggestions.stays || []);
  const photoSpots = sanitizeTextList(aiSuggestions.photo_spots || []);
  const tips = sanitizeTextList(aiSuggestions.tips || []);

  const defaults = {
    gems: [
      `${dest} Heritage Quarter`,
      `${dest} Artisan Souk`,
      `${dest} Panoramic Sunset Walk`,
      `${dest} Courtyard Garden Retreat`,
    ],
    food: [
      `${dest} Signature Kitchen`,
      `${dest} Traditional Street Bites`,
      `${dest} Rooftop Dining Lounge`,
      `${dest} Family Heritage Cafe`,
    ],
    stays: [
      `${dest} Boutique Residence`,
      `${dest} Heritage Courtyard Stay`,
      `${dest} Skyline Grand Hotel`,
      `${dest} Quiet Garden Suites`,
    ],
    tips: [
      `Arrive early for the smoothest flow through ${dest}'s most visited zones.`,
      `Keep one flexible hour open each afternoon for spontaneous discoveries.`,
      `Ask locals for the street or lane just beyond the main attraction.`,
      `Use sunset hours for your most scenic stops and memorable photos.`,
    ],
    photos: [
      `${dest} Golden Gateway`,
      `${dest} Reflection Terrace`,
      `${dest} Skyline Frame`,
      `${dest} Lantern Alley`,
    ],
  };

  const scenicVisuals = ensureFourItems(photoSpots, defaults.photos);

  const sectionMap = {
    "Top & Hidden Spots": {
      icon: Compass,
      accent: "#38BDF8",
      items: ensureFourItems(hiddenGems, defaults.gems).map((name, index) => ({
        title: name,
        subtitle: `A lively ${theme.toLowerCase()} discovery shaped for your ${style.toLowerCase()} trip rhythm.`,
        href: mapsUrl(`${name} ${dest}`),
        imageQueries: [
          `${name} ${dest}`,
          `${name}`,
          `${scenicVisuals[index] || dest} ${dest}`,
          `${dest} landmark`,
        ],
        badge: index === 0 ? "Featured" : "Explore",
      })),
    },
    "Popular Food Places": {
      icon: Utensils,
      accent: "#22D3EE",
      items: ensureFourItems(foodPlaces, defaults.food).map((name, index) => ({
        title: name,
        subtitle: index % 2 === 0
          ? "Popular with returning visitors for authentic regional flavour and atmosphere."
          : `A strong pick for a memorable meal stop while exploring ${dest}.`,
        href: mapsUrl(`${name} ${dest}`),
        imageQueries: [
          `${name} ${dest}`,
          `${name} restaurant ${dest}`,
          `${name} cafe ${dest}`,
          `${dest} food`,
        ],
        badge: "Dine",
      })),
    },
    "Lodging Options": {
      icon: Bed,
      accent: "#60A5FA",
      items: ensureFourItems(lodging, defaults.stays).map((name, index) => ({
        title: name,
        subtitle: `A stay option aligned to your ${style.toLowerCase()} comfort level and pacing.`,
        href: mapsUrl(`${name} ${dest}`),
        imageQueries: [
          `${name} ${dest}`,
          `${name} hotel ${dest}`,
          `${name} stay ${dest}`,
          `${scenicVisuals[index] || dest} ${dest}`,
        ],
        badge: "Stay",
      })),
    },
    "Local Tips & Briefing": {
      icon: Lightbulb,
      accent: "#34D399",
      items: ensureFourItems(tips, defaults.tips).map((tip, index) => ({
        title: titleFromTip(tip, index, dest),
        subtitle: tip,
        href: mapsUrl(`${dest} ${tip}`),
        imageQueries: [
          `${scenicVisuals[index] || dest} ${dest}`,
          `${dest} local area`,
          `${dest} street view`,
          `${dest} landmark`,
        ],
        badge: "Tip",
      })),
    },
  };

  return {
    title,
    ...sectionMap[title],
  };
}

function AccordionShell({ title, Icon, accent, defaultOpen = true, children, isLight = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-[28px] overflow-hidden border backdrop-blur-xl transition-colors duration-300",
        isLight ? "border-slate-300/55" : "border-white/10"
      )}
      style={{
        background: isLight
          ? "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(241,245,249,0.98) 100%)"
          : "linear-gradient(180deg, rgba(16,23,37,0.96) 0%, rgba(8,13,24,0.92) 100%)",
        boxShadow: isLight
          ? "0 18px 46px rgba(148,163,184,0.16)"
          : "0 18px 50px rgba(0,0,0,0.25)",
      }}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 text-left transition-colors",
          isLight ? "hover:bg-slate-900/[0.025]" : "hover:bg-white/[0.02]"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: `${accent}16`, color: accent, boxShadow: `0 0 24px ${accent}22` }}
          >
            <Icon size={16} />
          </div>
          <div>
            <p className={cn("text-[14px] font-black tracking-tight", isLight ? "text-slate-900" : "text-white")}>{title}</p>
            <p className={cn("text-[10px] uppercase tracking-[0.28em]", isLight ? "text-slate-400" : "text-white/25")}>Curated For This Journey</p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "transition-transform duration-300",
            open ? "rotate-180" : "",
            isLight ? "text-slate-400" : "text-white/40"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExplorationItem({ item, accent, photoIndex = 0, isLight = false }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex min-h-[120px] gap-4 rounded-[22px] border p-3.5 transition-all",
        isLight
          ? "border-slate-300/55 bg-white/72 hover:bg-white hover:border-slate-400/45 shadow-[0_12px_30px_rgba(148,163,184,0.10)]"
          : "border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/[0.12]"
      )}
    >
      <div className={cn(
        "relative w-[96px] h-[96px] rounded-[22px] overflow-hidden shrink-0",
        isLight ? "bg-slate-200 shadow-[0_12px_28px_rgba(148,163,184,0.22)]" : "bg-[#142033] shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
      )}>
        <PlaceImage
          queries={item.imageQueries}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          photoIndex={photoIndex}
        />
        <div
          className="absolute inset-0"
          style={{ background: isLight ? "linear-gradient(180deg, transparent 24%, rgba(15,23,42,0.62) 100%)" : "linear-gradient(180deg, transparent 20%, rgba(3,8,18,0.78) 100%)" }}
        />
        <span
          className="absolute left-2.5 bottom-2.5 text-[8px] font-black uppercase tracking-[0.24em]"
          style={{ color: accent }}
        >
          {item.badge}
        </span>
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className={cn("text-[15px] font-black leading-tight", isLight ? "text-slate-900" : "text-white")}>{item.title}</h4>
            <p className={cn("text-[12px] leading-relaxed mt-1.5 line-clamp-3", isLight ? "text-slate-600" : "text-white/56")}>{item.subtitle}</p>
          </div>
          <div className={cn(
            "shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
            isLight
              ? "border border-slate-300/55 bg-slate-100 text-slate-400 group-hover:text-slate-700 group-hover:border-slate-400/55"
              : "border border-white/[0.06] bg-white/[0.03] text-white/25 group-hover:text-white/60 group-hover:border-white/[0.12]"
          )}>
            <ExternalLink size={15} />
          </div>
        </div>
      </div>
    </a>
  );
}

export function AIExplorationDeck({ destination, aiSuggestions, travelStyle, dayTheme, isLight = false }) {
  const sections = useMemo(() => ([
    "Top & Hidden Spots",
    "Popular Food Places",
    "Lodging Options",
    "Local Tips & Briefing",
  ].map((title) => buildSectionItems({ title, destination, aiSuggestions, travelStyle, dayTheme }))), [destination, aiSuggestions, travelStyle, dayTheme]);

  return (
    <div className={cn("mt-12 pt-8 pb-4", isLight ? "border-t border-slate-300/45" : "border-t border-white/10")}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center",
          isLight ? "bg-[#38BDF8]/12 shadow-[0_10px_30px_rgba(56,189,248,0.14)]" : "bg-[#38BDF8]/10 shadow-[0_0_24px_rgba(56,189,248,0.18)]"
        )}>
          <Sparkles size={17} className="text-[#38BDF8]" />
        </div>
        <div>
          <h3 className={cn("text-[15px] font-black uppercase tracking-[0.16em]", isLight ? "text-slate-900" : "text-white")}>AI Exploration Deck</h3>
          <p className={cn("text-[11px]", isLight ? "text-slate-500" : "text-white/45")}>Richer visuals, stronger place links, and destination-aware discovery prompts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        {sections.map((section, sectionIndex) => (
          <AccordionShell
            key={section.title}
            title={section.title}
            Icon={section.icon}
            accent={section.accent}
            defaultOpen={false}
            isLight={isLight}
          >
            <div className="grid grid-cols-1 gap-3 pt-1">
              {section.items.map((item, itemIndex) => (
                <ExplorationItem
                  key={`${section.title}-${item.title}`}
                  item={item}
                  accent={section.accent}
                  photoIndex={(sectionIndex * 4) + itemIndex}
                  isLight={isLight}
                />
              ))}
            </div>
          </AccordionShell>
        ))}
      </div>
    </div>
  );
}

export function TripPrayerTimesCard({ destination, dateStr, dayIdx, onPrev, onNext, isLight = false }) {
  const { times, hijriDate, loading } = usePrayerTimes(destination, dateStr);
  const dest = normalizeDestination(destination);
  const rows = [
    { key: "Fajr", color: "#7C8CFF", Icon: Moon, glow: "rgba(124,140,255,0.22)" },
    { key: "Sunrise", color: "#F5B43A", Icon: Sunrise, glow: "rgba(245,180,58,0.22)" },
    { key: "Dhuhr", color: "#F6C453", Icon: Sun, glow: "rgba(246,196,83,0.22)" },
    { key: "Asr", color: "#FB923C", Icon: Sun, glow: "rgba(251,146,60,0.22)" },
    { key: "Maghrib", color: "#F97366", Icon: Sunset, glow: "rgba(249,115,102,0.22)" },
    { key: "Isha", color: "#9B6BFF", Icon: Moon, glow: "rgba(155,107,255,0.22)" },
  ];
  const liveRows = rows.filter((row) => times?.[row.key]);
  const nextPrayer = useMemo(() => liveRows.find((row) => row.key !== "Sunrise") || liveRows[0] || null, [liveRows]);

  return (
    <AccordionShell title="Islamic Prayer Times" Icon={Moon} accent="#10B981" defaultOpen={true} isLight={isLight}>
      <div className="pt-1">
        <div
          className={cn("rounded-[24px] overflow-hidden border", isLight ? "border-slate-200/85" : "border-white/10")}
          style={{ background: isLight ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)" : "linear-gradient(180deg, rgba(11,19,31,0.98) 0%, rgba(7,12,22,0.99) 100%)" }}
        >
          <div
            className={cn(
              "px-4 py-3.5 relative overflow-hidden border-b",
              isLight ? "border-slate-200/80" : "border-white/[0.05]"
            )}
            style={{
              background: isLight
                ? "linear-gradient(135deg, rgba(238,247,243,0.96) 0%, rgba(247,250,252,0.98) 100%)"
                : "linear-gradient(135deg, rgba(13,27,26,0.92) 0%, rgba(12,23,36,0.96) 100%)"
            }}
          >
            <div className={cn("absolute inset-0", isLight ? "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_34%)]" : "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_34%)]")} />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-2xl", isLight ? "bg-emerald-500/10" : "bg-emerald-400/10")}>
                      <Moon size={13} className={isLight ? "text-emerald-600" : "text-emerald-300"} />
                    </div>
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.18em]", isLight ? "text-slate-600" : "text-white/72")}>Prayer Schedule</span>
                  </div>
                  <p className={cn("text-[12px] font-bold leading-snug max-w-[180px]", isLight ? "text-slate-900" : "text-white")}>{hijriDate || "Calculating..."}</p>
                  <p className={cn("text-[10px] mt-1", isLight ? "text-slate-500" : "text-white/58")}>{dest}</p>
                </div>
                <div className={cn(
                  "shrink-0 rounded-[14px] border px-2.5 py-1.5 text-right",
                  isLight ? "border-emerald-200/80 bg-white/72" : "border-emerald-400/15 bg-emerald-400/8"
                )}>
                  <p className={cn("text-[7px] font-black uppercase tracking-[0.16em]", isLight ? "text-emerald-700/70" : "text-emerald-300/70")}>Next</p>
                  <p className={cn("mt-0.5 text-[11px] font-black", isLight ? "text-slate-900" : "text-white")}>{nextPrayer?.key || "Prayer"}</p>
                  <p className={cn("text-[9px]", isLight ? "text-slate-500" : "text-white/60")}>{(times && nextPrayer && times[nextPrayer.key]) || "--:--"}</p>
                </div>
              </div>
            </div>
            <Moon size={54} className={cn("absolute right-2 top-2", isLight ? "text-emerald-500/6" : "text-white/5")} strokeWidth={1.1} />
          </div>

          <div className="px-3 py-3">
            {loading ? (
              <div className={cn("py-8 text-center text-[11px]", isLight ? "text-slate-500" : "text-white/35")}>Loading prayer schedule...</div>
            ) : !times ? (
              <div className={cn("py-8 text-center text-[11px]", isLight ? "text-slate-500" : "text-white/35")}>Prayer timings unavailable for this destination.</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {rows.map(({ key, color, glow, Icon }) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-between rounded-[16px] px-3 py-2.5 border",
                      isLight ? "border-slate-200/80 bg-white/90" : "border-white/[0.06] bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-[14px] border"
                        style={{
                          background: isLight ? `${color}12` : `${color}14`,
                          borderColor: isLight ? `${color}33` : `${color}26`,
                          boxShadow: `0 0 0 1px ${color}10, 0 8px 18px ${glow}`,
                        }}
                      >
                        <Icon size={15} style={{ color }} />
                      </div>
                      <div>
                        <p className={cn("text-[12px] font-black", isLight ? "text-slate-900" : "text-white/92")}>{key}</p>
                        <p className={cn("text-[9px] uppercase tracking-[0.16em]", isLight ? "text-slate-400" : "text-white/28")}>
                          {key === "Sunrise" ? "Sun event" : "Prayer window"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[13px] font-black tabular-nums", isLight ? "text-slate-950" : "text-white")}>{times[key] || "--:--"}</p>
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        <Clock3 size={10} className={isLight ? "text-slate-400" : "text-white/28"} />
                        <span className={cn("text-[9px]", isLight ? "text-slate-400" : "text-white/28")}>Local time</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={cn("flex items-center justify-between px-3 py-3 border-t", isLight ? "border-slate-200/80 bg-slate-50/80" : "border-white/[0.05] bg-white/[0.02]")}>
            <button onClick={onPrev} disabled={!onPrev} className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-colors", onPrev ? (isLight ? "border-slate-300/70 text-slate-500 hover:border-slate-400 hover:text-slate-950" : "border-white/10 text-white/55 hover:border-white/20 hover:text-white") : (isLight ? "border-slate-200 text-slate-300 cursor-not-allowed" : "border-white/[0.05] text-white/15 cursor-not-allowed"))}>
              <ChevronLeft size={14} />
            </button>
            <span className={cn("min-w-[150px] text-center text-[10px] font-bold tracking-wide tabular-nums", isLight ? "text-slate-500" : "text-white/45")}>Day {dayIdx} - {sanitizeVisibleText(dateStr, "Date TBA")}</span>
            <button onClick={onNext} disabled={!onNext} className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-colors", onNext ? (isLight ? "border-slate-300/70 text-slate-500 hover:border-slate-400 hover:text-slate-950" : "border-white/10 text-white/55 hover:border-white/20 hover:text-white") : (isLight ? "border-slate-200 text-slate-300 cursor-not-allowed" : "border-white/[0.05] text-white/15 cursor-not-allowed"))}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </AccordionShell>
  );
}

export function TripPreviewCard({ destination, imageUrl, selectedItem, currency, fmtCur, totalDays, travelers, travelStyle, totalBudget, slotCfg, isLight = false }) {
  const dest = normalizeDestination(destination);
  const focusQueries = selectedItem?.place
    ? [`${selectedItem.place} ${dest}`, `${selectedItem.place}`, `${dest} travel landmark`]
    : buildDestinationHeroQueries(dest);
  const { src } = usePlaceImage(focusQueries, { photoIndex: selectedItem ? 1 : 0 });
  const [activeImage, setActiveImage] = useState(imageUrl || src || null);
  useEffect(() => {
    setActiveImage(imageUrl || src || null);
  }, [imageUrl, src]);
  const displayImage = activeImage;
  const metaItems = selectedItem
    ? [
        { label: "Time", value: slotCfg?.time || "-" },
        { label: "Duration", value: sanitizeVisibleText(selectedItem.duration, "1-2 hours") },
        { label: "Travel", value: sanitizeVisibleText(selectedItem.travel, "Local transfer") },
        { label: "Cost", value: fmtCur(selectedItem.cost || 0, currency) },
      ]
    : [
        { label: "Days", value: `${totalDays || 0} Days` },
        { label: "Travellers", value: String(travelers || 1) },
        { label: "Style", value: sanitizeVisibleText(travelStyle || "Balanced") },
        { label: "Budget", value: fmtCur(totalBudget || 0, currency) },
      ];

  return (
    <div className={cn(
      "rounded-[28px] overflow-hidden border transition-colors duration-300",
      isLight ? "border-slate-300/55 shadow-[0_20px_50px_rgba(148,163,184,0.18)]" : "border-white/10 shadow-[0_20px_55px_rgba(0,0,0,0.3)]"
    )} style={{ background: isLight ? "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,246,251,0.98) 100%)" : "linear-gradient(180deg,rgba(18,28,44,0.98) 0%,rgba(9,14,24,0.98) 100%)" }}>
      <div className={cn("relative h-[240px]", isLight ? "bg-slate-200" : "bg-[#111f30]")}>
        {displayImage ? (
          <img
            src={displayImage}
            alt={selectedItem?.place || dest}
            className="w-full h-full object-cover"
            onError={(e) => {
              if (src && displayImage !== src) {
                setActiveImage(src);
                return;
              }
              setActiveImage(null);
            }}
          />
        ) : (
          <div className={cn("absolute inset-0", isLight ? "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_58%),linear-gradient(180deg,#dcebf8_0%,#bdd0e2_100%)]" : "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_58%),linear-gradient(180deg,#142033_0%,#0b1321_100%)]")} />
        )}
        <div className={cn("absolute inset-0", isLight ? "bg-[linear-gradient(to_top,rgba(248,250,252,0.98)_0%,rgba(248,250,252,0.38)_50%,transparent_100%)]" : "bg-[linear-gradient(to_top,rgba(7,12,20,0.96)_0%,rgba(7,12,20,0.42)_48%,transparent_100%)]")} />
        <div className="absolute left-5 right-5 bottom-4">
          {selectedItem ? (
            <>
              <p className="text-[9px] font-black uppercase tracking-[0.36em] text-[#D4AF37] mb-1">Selected Stop</p>
              <h3 className={cn("text-[22px] font-black leading-tight", isLight ? "text-slate-950" : "text-white")}>{sanitizeVisibleText(selectedItem.place, dest)}</h3>
              <p className="text-[13px] font-black text-[#D4AF37] mt-1">{fmtCur(selectedItem.cost || 0, currency)}</p>
            </>
          ) : (
            <>
              <p className="text-[9px] font-black uppercase tracking-[0.36em] text-[#D4AF37] mb-1">Your Destination</p>
              <h3 className={cn("text-[24px] font-black uppercase leading-tight", isLight ? "text-slate-950" : "text-white")}>{dest}</h3>
            </>
          )}
        </div>
      </div>

      <div className="p-5">
        {selectedItem && (
          <p className={cn("text-[12px] leading-relaxed mb-4", isLight ? "text-slate-600" : "text-white/58")}>{sanitizeVisibleText(selectedItem.activity)}</p>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          {metaItems.map((item) => (
            <div key={item.label} className={cn("rounded-2xl px-3 py-3.5", isLight ? "bg-slate-50 border border-slate-300/55" : "bg-white/[0.04] border border-white/[0.05]")}>
              <p className={cn("text-[8px] font-black uppercase tracking-[0.24em] mb-1", isLight ? "text-slate-400" : "text-white/25")}>{item.label}</p>
              <p className={cn("text-[12px] font-black truncate capitalize", isLight ? "text-slate-900" : "text-white")}>{item.value}</p>
            </div>
          ))}
        </div>
        {selectedItem && (
          <a
            href={mapsUrl(`${sanitizeVisibleText(selectedItem.place)} ${dest}`)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-[#38BDF8] hover:text-[#7DD3FC] transition-colors"
          >
            Open place on map <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
}

export function TripHighlightsCard({ destination, totalDays, travelers, travelStyle, isLight = false }) {
  const dest = normalizeDestination(destination);
  const style = sanitizeVisibleText(travelStyle || "Balanced");

  const rows = [
    {
      title: "Best Visit Window",
      text: `Your ${dest} routing is paced to favour softer light, calmer movement windows, and more rewarding stop timing.`,
      icon: Sun,
      accent: "#D4AF37",
    },
    {
      title: `${travelers || 1} Traveller${(travelers || 1) > 1 ? "s" : ""}`,
      text: `The flow is tuned for ${travelers || 1} traveller${(travelers || 1) > 1 ? "s" : ""} across ${totalDays || 0} days without feeling rushed.`,
      icon: Users,
      accent: "#34D399",
    },
    {
      title: `${style} Flow`,
      text: `Activities, food stops, and recovery moments are balanced around your ${style.toLowerCase()} travel style.`,
      icon: Compass,
      accent: "#818CF8",
    },
  ];

  return (
    <div className={cn(
      "rounded-[28px] p-5 border transition-colors duration-300",
      isLight ? "border-slate-300/55 shadow-[0_18px_42px_rgba(148,163,184,0.14)]" : "border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
    )} style={{ background: isLight ? "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,246,251,0.98) 100%)" : "linear-gradient(180deg,rgba(18,28,44,0.96) 0%,rgba(9,14,24,0.96) 100%)" }}>
      <p className={cn("text-[9px] font-black uppercase tracking-[0.5em] mb-4", isLight ? "text-slate-400" : "text-white/28")}>Trip Highlights</p>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.title} className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: isLight ? `${row.accent}16` : `${row.accent}14` }}>
              <row.icon size={15} className="shrink-0" style={{ color: row.accent }} />
            </div>
            <div>
              <p className={cn("text-[13px] font-black", isLight ? "text-slate-900" : "text-white")}>{row.title}</p>
              <p className={cn("text-[11px] mt-1 leading-relaxed", isLight ? "text-slate-600" : "text-white/45")}>{row.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CuratedInsightsCard({ aiSuggestions = {}, destination, travelStyle, isLight = false }) {
  const dest = normalizeDestination(destination);
  const style = sanitizeVisibleText(travelStyle || "balanced");
  const gems = sanitizeTextList(aiSuggestions.hidden_gems || []).slice(0, 2);
  const photos = sanitizeTextList(aiSuggestions.photo_spots || []).slice(0, 2);
  const tips = sanitizeTextList(aiSuggestions.tips || []).slice(0, 2);
  const avoid = sanitizeTextList(aiSuggestions.avoid || []).slice(0, 2);

  const groups = [
    {
      key: "gems",
      label: "Hidden Gems",
      color: "#D4AF37",
      Icon: Compass,
      items: gems.length ? gems : [`Slow-walk the quieter lanes just beyond ${dest}'s main attraction.`, `Look for the most atmospheric corner of ${dest} after sunset.`],
    },
    {
      key: "photos",
      label: "Photo Spots",
      color: "#818CF8",
      Icon: Camera,
      items: photos.length ? photos : [`Frame ${dest} during the first golden hour window.`, `Use elevated viewpoints for cleaner skyline compositions.`],
    },
    {
      key: "tips",
      label: "Local Tips",
      color: "#34D399",
      Icon: Lightbulb,
      items: tips.length ? tips : [`Your ${style} pacing works best with one unplanned discovery stop each day.`, `Book headline stops early, then keep evenings flexible.`],
    },
    {
      key: "avoid",
      label: "Avoid",
      color: "#F87171",
      Icon: Sunset,
      items: avoid.length ? avoid : [`Avoid compressing too many major stops into one midday block.`, `Skip generic tourist strips when a local quarter gives the better experience.`],
    },
  ];

  return (
    <div className={cn(
      "rounded-[28px] p-5 border transition-colors duration-300",
      isLight ? "border-slate-300/55 shadow-[0_18px_42px_rgba(148,163,184,0.14)]" : "border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
    )} style={{ background: isLight ? "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,246,251,0.98) 100%)" : "linear-gradient(180deg,rgba(18,28,44,0.96) 0%,rgba(9,14,24,0.96) 100%)" }}>
      <p className={cn("text-[9px] font-black uppercase tracking-[0.5em] mb-4", isLight ? "text-slate-400" : "text-white/28")}>Curated Insights</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groups.map((group) => (
          <div key={group.key} className={cn("rounded-[22px] p-4 min-h-[160px]", isLight ? "bg-slate-50 border border-slate-300/50" : "bg-white/[0.03] border border-white/[0.04]")}>
            <div className="flex items-center gap-2 mb-3">
              <group.Icon size={13} style={{ color: group.color }} />
              <span className="text-[10px] font-black uppercase tracking-[0.32em]" style={{ color: group.color }}>{group.label}</span>
            </div>
            <ul className="space-y-2">
              {group.items.map((item, index) => (
                <li key={`${group.key}-${index}`} className={cn("text-[11px] leading-relaxed", isLight ? "text-slate-600" : "text-white/60")}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
