import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Sparkles,
  Minimize2,
  RotateCcw,
  CalendarDays,
  Clock3,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BrandMark } from "@/components/BrandLogo";
import { sanitizeVisibleText } from "@/lib/display-text";
import { PlaceImage } from "@/hooks/use-place-image";

const PREDEFINED_QUESTIONS = [
  "Plan a 3-day trip to Goa",
  "5 days Dubai luxury trip",
  "Weekend in Pondicherry",
  "Budget trip in Ooty",
];

const INITIAL_MESSAGES = [
  {
    id: "welcome",
    role: "bot",
    content:
      "Hi! I'm **Rihla AI**, your personal travel planner.\n\nTell me your destination and number of days and I'll build a cleaner day-by-day plan with real places, timed stops, and images right here in chat.\n\n*Try: \"Plan 3 days in Chennai\"*",
    itinerary: null,
  },
];

const DESTINATION_FALLBACKS = {
  goa: [
    ["Fontainhas Latin Quarter", "heritage lanes and pastel streets"],
    ["Se Cathedral", "historic architecture and a calm walk"],
    ["Candolim beach belt", "coastal lunch and laid-back atmosphere"],
    ["Aguada Fort", "scenic views and sea-facing history"],
    ["Chapora Fort", "golden-hour cliffside photos"],
    ["Vagator dinner strip", "night energy and local dining"],
  ],
  chennai: [
    ["Kapaleeshwarar Temple", "Dravidian detail and local rhythm"],
    ["San Thome Basilica", "story-rich architecture"],
    ["Government Museum Chennai", "culture and art context"],
    ["Mylapore tank streets", "street life and heritage mood"],
    ["Besant Nagar beach", "sunset breathing room"],
    ["Murugan Idli Shop", "strong regional comfort food"],
  ],
  dubai: [
    ["Burj Khalifa district", "modern skyline arrival energy"],
    ["Al Fahidi Historical Neighborhood", "older Dubai and quieter lanes"],
    ["Dubai Creek abra route", "waterfront perspective"],
    ["Museum of the Future", "signature contemporary stop"],
    ["Palm West Beach", "sunset and polished coastal vibe"],
    ["Souk Madinat", "night dining and atmosphere"],
  ],
  pondicherry: [
    ["White Town promenade", "French-quarter first impressions"],
    ["Sri Aurobindo Ashram area", "slow reflective energy"],
    ["Baker Street cafe stop", "easy brunch pacing"],
    ["Manakula Vinayagar Temple", "local spiritual texture"],
    ["Rock Beach", "sunset and sea breeze"],
    ["Mission Street dinner lane", "compact evening walk"],
  ],
  ooty: [
    ["Ooty Lake circuit", "gentle mountain start"],
    ["Botanical Garden", "green breathing room"],
    ["Tea Factory viewpoint", "hill-country identity"],
    ["Doddabetta Peak", "wide scenic views"],
    ["Stone House quarter", "heritage and slower walking"],
    ["Charring Cross dinner stop", "cozy evening finish"],
  ],
};

function isPlanPrompt(text = "") {
  return /\b(\d+)\s*day|\bplan\b|\btrip\b|\bitinerary\b|\bvisit\b|\bschedule\b|\bweekend\b/i.test(String(text));
}

function isCasualChatPrompt(text = "") {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return true;
  if (/^(hi|hello|hey|hii|yo|hola|namaste|good morning|good afternoon|good evening)[!. ]*$/i.test(value)) {
    return true;
  }
  if (/^(how are you|who are you|what can you do|help|thanks|thank you|ok|okay)[?.! ]*$/i.test(value)) {
    return true;
  }
  return value.split(/\s+/).length <= 3 && !isPlanPrompt(value);
}

function getRequestedDays(text = "") {
  const match = String(text).match(/(\d+)\s*day/i);
  return match ? Math.max(1, parseInt(match[1], 10)) : /weekend/i.test(String(text)) ? 2 : 3;
}

function titleCase(value = "") {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getRequestedDestination(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return "your destination";

  const directMatch = Object.keys(DESTINATION_FALLBACKS).find((item) => raw.toLowerCase().includes(item));
  if (directMatch) return titleCase(directMatch);

  const patterns = [
    /(?:weekend in|plan(?: a| an)? trip to|trip to|days in|visit|travel to|go to|plan to|plan)\s+([A-Za-z][A-Za-z\s,-]{1,60})/i,
    /([A-Za-z][A-Za-z\s-]{1,40})\s+for\s+\d+\s*days?/i,
    /(?:in)\s+([A-Za-z][A-Za-z\s,-]{1,60})/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1]
        .replace(/[?.!,]+$/g, "")
        .replace(/\b(luxury|budget|adventure|family|romantic|trip|itinerary|plan)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (cleaned) return titleCase(cleaned);
    }
  }

  const compact = raw
    .replace(/[?.!,]+$/g, "")
    .replace(/\b(plan|trip|itinerary|days?|day|weekend|luxury|budget|adventure|family|romantic|in|to|for)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (compact && compact.length <= 40) return titleCase(compact);
  return "your destination";
}

function buildClientFallbackItinerary(prompt = "") {
  const destination = getRequestedDestination(prompt);
  const totalDays = getRequestedDays(prompt);
  const key = Object.keys(DESTINATION_FALLBACKS).find((item) => destination.toLowerCase().includes(item));
  const destinationStops = DESTINATION_FALLBACKS[key] || [
    [`${destination} Old Quarter`, "arrival and neighborhood grounding"],
    [`${destination} Main Landmark`, "signature city context"],
    [`${destination} Market Lunch Stop`, "regional flavors and walkable energy"],
    [`${destination} Museum District`, "culture and slower discovery"],
    [`${destination} Scenic Viewpoint`, "golden-hour pacing"],
    [`${destination} Dinner Street`, "night atmosphere and food"],
  ];
  const timeSlots = ["08:00", "10:00", "12:30", "14:30", "17:00", "19:30"];
  const slotLabels = ["arrival", "landmark", "lunch", "culture", "sunset", "dinner"];
  const dayThemes = [
    "Arrival and First Impressions",
    "Signature Sights and Local Flavor",
    "Culture and Neighborhood Life",
    "Scenic Leisure and Evening Glow",
  ];

  return {
    destination,
    total_days: totalDays,
    trip_overview: {
      destination,
      total_days: totalDays,
      travel_style: "Balanced",
    },
    days: Array.from({ length: totalDays }, (_, index) => ({
      day: index + 1,
      title: dayThemes[index % dayThemes.length],
      plans: timeSlots.map((time, stopIndex) => {
        const [place, vibe] = destinationStops[(index + stopIndex) % destinationStops.length];
        return {
          time,
          slot: slotLabels[stopIndex] || "activity",
          place,
          city: destination,
          description: `Build this stop around ${place} for ${vibe}, so the route feels grounded, visual, and easy to follow.`,
          image_query: `${place} ${destination}`,
          image_queries: buildStopImageQueries(place, destination, slotLabels[stopIndex] || "activity"),
        };
      }),
    })),
  };
}

function normalizePlanItem(plan, destination, fallbackIndex = 0) {
  if (!plan || typeof plan !== "object") return null;

  const time =
    sanitizeVisibleText(
      plan.time ||
        plan.start_time ||
        plan.startTime ||
        plan.hour ||
        plan.timing ||
        plan.slot_time,
      "",
    ) || ["08:00", "10:00", "12:30", "14:30"][fallbackIndex % 4];

  const place =
    sanitizeVisibleText(
      plan.place ||
        plan.name ||
        plan.location ||
        plan.title,
      "",
    ) || `${destination} stop ${fallbackIndex + 1}`;

  const slot =
    sanitizeVisibleText(
      plan.slot ||
        plan.type ||
        plan.category ||
        plan.label,
      "",
    ) || ["arrival", "landmark", "food", "culture"][fallbackIndex % 4];

  const description =
    sanitizeVisibleText(
      plan.description ||
        plan.summary ||
        plan.note ||
        plan.details,
      "",
    ) || `Spend time around ${place} for a cleaner ${slot} stop in ${destination}.`;
  const flow = buildTimeFlow(time, slot);
  const existingMoments = Array.isArray(plan.timeline_moments)
    ? plan.timeline_moments
        .map((item) => sanitizeVisibleText(item, "").trim())
        .filter(Boolean)
    : [];
  const timelineMoments = existingMoments.length >= 4 ? existingMoments.slice(0, 4) : flow.moments;

  return {
    time,
    time_range: flow.range,
    timeline_moments: timelineMoments,
    place,
    slot,
    description,
    city: sanitizeVisibleText(plan.city || destination, destination),
    image_query: sanitizeVisibleText(
      plan.image_query || plan.imageQuery || `${place} ${destination}`,
      `${place} ${destination}`,
    ),
    image_queries: Array.from(
      new Set(
        [
          ...(Array.isArray(plan.image_queries) ? plan.image_queries : []),
          ...(Array.isArray(plan.imageQueries) ? plan.imageQueries : []),
          plan.image_query,
          plan.imageQuery,
          ...buildStopImageQueries(place, destination, slot),
        ]
          .map((item) => sanitizeVisibleText(item, "").trim())
          .filter(Boolean),
      ),
    ),
  };
}

function normalizeDayItem(day, destination, index = 0) {
  if (!day || typeof day !== "object") return null;

  const rawPlans = [
    ...(Array.isArray(day.plans) ? day.plans : []),
    ...(Array.isArray(day.activities) ? day.activities : []),
    ...(Array.isArray(day.stops) ? day.stops : []),
    ...(Array.isArray(day.itinerary) ? day.itinerary : []),
  ];

  const plans = rawPlans
    .map((plan, planIndex) => normalizePlanItem(plan, destination, planIndex))
    .filter(Boolean)
    .slice(0, 4);

  if (!plans.length) {
    return null;
  }

  return {
    day: Number(day.day || day.dayNumber || index + 1) || index + 1,
    title: sanitizeVisibleText(
      day.title || day.theme || day.name || `Day ${index + 1}`,
      `Day ${index + 1}`,
    ),
    plans,
  };
}

function normalizeChatItinerary(itinerary, prompt = "") {
  const destination = sanitizeVisibleText(
    itinerary?.destination || itinerary?.trip_overview?.destination || getRequestedDestination(prompt),
    getRequestedDestination(prompt),
  );

  const sourceDays = Array.isArray(itinerary?.days)
    ? itinerary.days
    : Array.isArray(itinerary?.itinerary)
      ? itinerary.itinerary
      : [];

  const days = sourceDays
    .map((day, index) => normalizeDayItem(day, destination, index))
    .filter(Boolean);

  if (!days.length) {
    return buildClientFallbackItinerary(prompt);
  }

  return {
    ...itinerary,
    destination,
    total_days:
      itinerary?.total_days ||
      itinerary?.trip_overview?.total_days ||
      days.length,
    trip_overview: {
      ...(itinerary?.trip_overview || {}),
      destination,
      total_days:
        itinerary?.trip_overview?.total_days ||
        itinerary?.total_days ||
        days.length,
    },
    days,
  };
}

function summarizeStructuredPlan(itinerary) {
  const destination = sanitizeVisibleText(
    itinerary?.destination || itinerary?.trip_overview?.destination,
    "Destination",
  );
  const totalDays =
    itinerary?.total_days || itinerary?.trip_overview?.total_days || itinerary?.days?.length || 1;
  return `${destination} plan ready - ${totalDays} day${totalDays === 1 ? "" : "s"} with timed ideas and images below.`;
}

function formatChatDate(dayIndex) {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(0, dayIndex - 1));
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getDayAccent(dayNumber) {
  const accents = [
    { glow: "rgba(212,175,55,0.2)", border: "rgba(212,175,55,0.32)", pill: "#D4AF37" },
    { glow: "rgba(14,165,233,0.2)", border: "rgba(14,165,233,0.3)", pill: "#38BDF8" },
    { glow: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.28)", pill: "#4ADE80" },
    { glow: "rgba(244,114,182,0.18)", border: "rgba(244,114,182,0.28)", pill: "#FB7185" },
  ];
  return accents[(Math.max(1, dayNumber) - 1) % accents.length];
}

function getDestinationTheme(destination = "") {
  const text = String(destination || "").toLowerCase();
  if (text.includes("dubai")) {
    return { glow: "rgba(56,189,248,0.18)", border: "rgba(56,189,248,0.3)", pill: "#38BDF8", gradient: "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(212,175,55,0.08))" };
  }
  if (text.includes("goa")) {
    return { glow: "rgba(45,212,191,0.18)", border: "rgba(45,212,191,0.28)", pill: "#2DD4BF", gradient: "linear-gradient(135deg, rgba(45,212,191,0.18), rgba(212,175,55,0.08))" };
  }
  if (text.includes("pondicherry")) {
    return { glow: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.28)", pill: "#FB923C", gradient: "linear-gradient(135deg, rgba(251,146,60,0.18), rgba(212,175,55,0.08))" };
  }
  if (text.includes("chennai")) {
    return { glow: "rgba(251,113,133,0.18)", border: "rgba(251,113,133,0.28)", pill: "#FB7185", gradient: "linear-gradient(135deg, rgba(251,113,133,0.18), rgba(212,175,55,0.08))" };
  }
  if (text.includes("ooty")) {
    return { glow: "rgba(74,222,128,0.18)", border: "rgba(74,222,128,0.28)", pill: "#4ADE80", gradient: "linear-gradient(135deg, rgba(74,222,128,0.18), rgba(212,175,55,0.08))" };
  }
  return { glow: "rgba(212,175,55,0.18)", border: "rgba(212,175,55,0.28)", pill: "#D4AF37", gradient: "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(56,189,248,0.08))" };
}

function getPlaceBadge(slot = "", place = "") {
  const text = `${slot} ${place}`.toLowerCase();
  if (/beach|coast|bay|shore|sunset|waterfront/.test(text)) return "Beach";
  if (/temple|fort|basilica|museum|ashram|shrine|cathedral|heritage/.test(text)) return "Heritage";
  if (/lunch|food|dinner|cafe|market|brunch/.test(text)) return "Food";
  if (/viewpoint|garden|park|lake|peak/.test(text)) return "Scenic";
  return "Local";
}

function buildStopImageQueries(place = "", destination = "", slot = "") {
  const safePlace = sanitizeVisibleText(place, "").trim();
  const safeDestination = sanitizeVisibleText(destination, "").trim();
  const badge = getPlaceBadge(slot, place).toLowerCase();
  const slotHints = {
    beach: ["beach", "shoreline", "waterfront", "sunset beach"],
    heritage: ["heritage", "historic landmark", "architecture", "tourism"],
    food: ["restaurant", "local cuisine", "dining", "food"],
    scenic: ["viewpoint", "panorama", "nature", "scenic"],
    local: ["street view", "neighborhood", "district", "travel"],
  };

  const queries = [
    safePlace,
    `${safePlace} ${safeDestination}`,
    `${safePlace} ${safeDestination} ${badge}`,
    `${safePlace} ${safeDestination} ${slot}`,
    `${safePlace} ${badge}`,
    `${safePlace} ${safeDestination} tourism`,
    `${safePlace} ${safeDestination} photography`,
    `${safeDestination} ${safePlace}`,
  ];

  (slotHints[badge] || slotHints.local).forEach((hint) => {
    queries.push(`${safePlace} ${safeDestination} ${hint}`);
  });

  return Array.from(
    new Set(
      queries
        .map((item) => sanitizeVisibleText(item, "").trim())
        .filter((item) => item && item.length > 2),
    ),
  );
}

function parseClockLabel(label = "") {
  const match = String(label).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function formatClock(minutes) {
  const safe = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function buildTimeFlow(startLabel = "", slot = "") {
  const startMinutes = parseClockLabel(startLabel);
  if (startMinutes == null) {
    return { range: startLabel || "Flexible", moments: [startLabel || "Flexible"] };
  }

  const slotText = String(slot || "").toLowerCase();
  const duration =
    slotText.includes("food") || slotText.includes("lunch") || slotText.includes("dinner")
      ? 90
      : slotText.includes("sunset") || slotText.includes("scenic")
        ? 105
        : 120;

  const moments = [0, 30, 75, duration].map((offset) => formatClock(startMinutes + offset));
  return {
    range: `${formatClock(startMinutes)}-${formatClock(startMinutes + duration)}`,
    moments: Array.from(new Set(moments)),
  };
}

function buildTimeAgenda(plan) {
  const slot = String(plan?.slot || "").toLowerCase();
  const place = sanitizeVisibleText(plan?.place, "the stop");
  const existingMoments = Array.isArray(plan?.timeline_moments)
    ? plan.timeline_moments
        .map((item) => sanitizeVisibleText(item, "").trim())
        .filter(Boolean)
    : [];
  const rebuiltFlow = buildTimeFlow(plan?.time || "08:00", slot);
  const moments = existingMoments.length >= 4 ? existingMoments.slice(0, 4) : rebuiltFlow.moments;

  const templates = {
    arrival: [
      `Arrive at ${place}`,
      `Explore the first stretch`,
      `Photo stop and local details`,
      `Move onward to the next district`,
    ],
    landmark: [
      `Arrive at ${place}`,
      `Explore the main highlights`,
      `Photo stop and key details`,
      `Move to the next district`,
    ],
    food: [
      `Arrive and get seated`,
      `Order the signature dish`,
      `Enjoy the meal at an easy pace`,
      `Finish and head onward`,
    ],
    lunch: [
      `Arrive and get seated`,
      `Order the signature dish`,
      `Enjoy the meal at an easy pace`,
      `Finish and head onward`,
    ],
    dinner: [
      `Arrive for the dinner seating`,
      `Start with the house pick`,
      `Take your time over the meal`,
      `End with dessert or tea`,
    ],
    culture: [
      `Enter ${place}`,
      `Explore the main cultural route`,
      `Photo stop and details`,
      `Move onward through the district`,
    ],
    sunset: [
      `Reach the best viewing point`,
      `Take in the changing light`,
      `Slow down for photos`,
      `Stay through the final glow`,
    ],
    scenic: [
      `Reach the scenic point`,
      `Walk the strongest stretch`,
      `Pause for views and photos`,
      `Ease into the next stop`,
    ],
    local: [
      `Arrive in the local quarter`,
      `Explore the liveliest stretch`,
      `Photo stop and side-lane details`,
      `Move onward through the district`,
    ],
  };

  const fallback = [
    `Arrive at ${place}`,
    `Explore the core highlights`,
    `Slow down for local details`,
    `Wrap and move to the next stop`,
  ];

  const agenda = templates[slot] || fallback;
  return moments.slice(0, 4).map((moment, index) => ({
    time: moment,
    label: agenda[Math.min(index, agenda.length - 1)],
  }));
}

function RihlaAvatar({ size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        flexShrink: 0,
        background: "linear-gradient(135deg, #0f1e38 0%, #0c1828 100%)",
        border: "1px solid rgba(212,175,55,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <BrandMark size={size * 0.72} />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-2 max-w-[85%]">
      <RihlaAvatar size={30} />
      <div
        className="flex items-center gap-1.5 rounded-3xl rounded-tl-sm px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span
            key={i}
            className="block h-2 w-2 rounded-full"
            style={{ background: "#D4AF37" }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay }}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineStop({ plan, index, accent }) {
  const safePlace = sanitizeVisibleText(plan?.place, "Trip idea");
  const safeDescription = sanitizeVisibleText(plan?.description, "A travel stop suggestion.");
  const imageQueries = Array.from(
    new Set(
      [
        ...(Array.isArray(plan?.image_queries) ? plan.image_queries : []),
        ...(Array.isArray(plan?.imageQueries) ? plan.imageQueries : []),
        plan?.image_query,
        ...buildStopImageQueries(safePlace, plan?.city || "", plan?.slot || ""),
      ]
        .map((item) => sanitizeVisibleText(item, "").trim())
        .filter(Boolean),
    ),
  );
  const badge = getPlaceBadge(plan?.slot, safePlace);
  const agenda = buildTimeAgenda(plan);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "grid",
        gap: 0,
        borderRadius: 22,
        alignItems: "start",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div style={{ position: "relative", height: "clamp(132px, 24vw, 176px)", overflow: "hidden" }}>
        <PlaceImage
          queries={imageQueries}
          alt={safePlace}
          className="absolute inset-0 h-full w-full object-cover scale-110 blur-sm opacity-35"
          photoIndex={index}
          onlyGoogle
          fallbackSrc="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=720"
        />
        <PlaceImage
          queries={imageQueries}
          alt={safePlace}
          className="absolute inset-0 h-full w-full object-contain"
          photoIndex={index}
          onlyGoogle
          fallbackSrc="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=720"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, rgba(5,10,18,0.94), rgba(5,10,18,0.22) 58%, ${accent.glow})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 12,
            top: 12,
            minWidth: 46,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(5,10,18,0.78)",
            border: `1px solid ${accent.border}`,
            color: accent.pill,
            fontSize: 10,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          {index + 1}
        </div>

        <div
          style={{
            position: "absolute",
            right: 12,
            top: 12,
            padding: "5px 10px",
            borderRadius: 999,
            background: "rgba(5,10,18,0.76)",
            border: `1px solid ${accent.border}`,
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {badge}
        </div>

        <div style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(5,10,18,0.72)",
                color: accent.pill,
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: "0.06em",
                border: `1px solid ${accent.border}`,
              }}
            >
              <Clock3 size={11} />
              {plan?.time_range || plan?.time || "Flexible"}
            </div>
            <span style={{ color: "rgba(255,255,255,0.68)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {sanitizeVisibleText(plan?.slot || "Stop")}
            </span>
          </div>

          <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, lineHeight: 1.1, maxWidth: "85%" }}>
            {safePlace}
          </div>
        </div>
      </div>

      <div style={{ minWidth: 0, padding: "14px 16px 14px", background: "rgba(16,24,39,0.82)" }}>
        <div style={{ marginBottom: 10, color: "rgba(255,255,255,0.5)", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Hour By Hour Plan
        </div>

        <div
          style={{
            display: "grid",
            gap: 6,
            marginBottom: 8,
            padding: "10px 10px 8px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {agenda.map((item, agendaIndex) => (
            <div
              key={`${safePlace}-${item.time}-${agendaIndex}`}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr",
                gap: 8,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  color: accent.pill,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  paddingTop: 1,
                }}
              >
                {item.time}
              </div>
              <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 11.5, lineHeight: 1.35 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            color: "rgba(255,255,255,0.56)",
            fontSize: 11.5,
            lineHeight: 1.45,
            margin: 0,
          }}
        >
          {safeDescription}
        </p>
      </div>
    </div>
  );
}

function ChatItineraryInline({ itinerary }) {
  if (!itinerary?.days?.length) return null;

  const dest = sanitizeVisibleText(itinerary.destination || itinerary.trip_overview?.destination, "Destination");
  const days = itinerary.total_days || itinerary.trip_overview?.total_days || itinerary.days.length;
  const [activeDay, setActiveDay] = useState(0);
  const safeDays = itinerary.days.slice(0, Math.max(1, days));
  const currentDay = safeDays[Math.min(activeDay, safeDays.length - 1)];
  const currentAccent = getDestinationTheme(dest);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 18,
          background: currentAccent.gradient,
          border: `1px solid ${currentAccent.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Sparkles size={13} style={{ color: currentAccent.pill }} />
          <span style={{ color: currentAccent.pill, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Trip Ideas Ready
          </span>
        </div>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
          {dest} - {days} day{days === 1 ? "" : "s"}
        </div>
        <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 11, lineHeight: 1.5 }}>
          Four timed stops per day, one clean day view at a time.
        </div>
      </div>

      <div
        style={{
          borderRadius: 22,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: `linear-gradient(180deg, ${currentAccent.glow}, rgba(255,255,255,0.02))`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <CalendarDays size={12} style={{ color: currentAccent.pill }} />
            <span style={{ color: currentAccent.pill, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Day By Day Plan
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(90px, 1fr)",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x proximity",
              overscrollBehaviorX: "contain",
            }}
          >
            {safeDays.map((day, index) => (
              <button
                key={day.day}
                onClick={() => setActiveDay(index)}
                style={{
                  textAlign: "left",
                  borderRadius: 16,
                  padding: "10px 12px",
                  border: index === activeDay ? `1px solid ${currentAccent.border}` : "1px solid rgba(255,255,255,0.08)",
                  background: index === activeDay
                    ? `linear-gradient(135deg, ${currentAccent.glow}, rgba(255,255,255,0.04))`
                    : "rgba(255,255,255,0.03)",
                  color: "#fff",
                  scrollSnapAlign: "start",
                  minWidth: safeDays.length === 1 ? 180 : 104,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: index === activeDay ? currentAccent.pill : "rgba(255,255,255,0.5)" }}>
                  Day {day.day}
                </div>
                <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.78)" }}>
                  {formatChatDate(day.day)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                {sanitizeVisibleText(currentDay.title, `Day ${currentDay.day}`)}
              </div>
              <div style={{ color: "rgba(255,255,255,0.56)", fontSize: 12, fontWeight: 700 }}>
                {formatChatDate(currentDay.day)} · 4 planned stops with hour flow
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => setActiveDay((prev) => Math.max(0, prev - 1))}
                disabled={activeDay === 0}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: activeDay === 0 ? "rgba(255,255,255,0.22)" : currentAccent.pill,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setActiveDay((prev) => Math.min(safeDays.length - 1, prev + 1))}
                disabled={activeDay >= safeDays.length - 1}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: activeDay >= safeDays.length - 1 ? "rgba(255,255,255,0.22)" : currentAccent.pill,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
          {(currentDay.plans || []).slice(0, 4).map((plan, index) => (
            <TimelineStop key={`${currentDay.day}-${index}-${plan.place}`} plan={plan} index={index} accent={currentAccent} />
          ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const safeContent = sanitizeVisibleText(msg.content, "I have an update for your trip plan.");
  const isItineraryMessage = Boolean(msg.itinerary);

  if (isItineraryMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3"
      >
        <div className="mt-0.5 shrink-0">
          <RihlaAvatar size={32} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={12} style={{ color: "#D4AF37" }} />
            <span style={{ color: "#D4AF37", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              New Trip Ready
            </span>
          </div>
          <ChatItineraryInline itinerary={msg.itinerary} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex max-w-[87%] gap-3 ${isUser ? "ml-auto flex-row-reverse" : ""}`}
    >
      {isUser ? (
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <span className="text-[10px] font-black text-white/50">U</span>
        </div>
      ) : (
        <div className="mt-0.5 shrink-0">
          <RihlaAvatar size={32} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div
          className={`rounded-3xl px-3.5 py-2.5 text-[14px] leading-relaxed ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
          style={
            isUser
              ? {
                  background: "linear-gradient(135deg,#0ea5e9,#0284c7)",
                  color: "#fff",
                  fontWeight: 500,
                }
              : {
                  background: isItineraryMessage ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
                  border: isItineraryMessage ? "1px solid rgba(212,175,55,0.14)" : "1px solid rgba(255,255,255,0.09)",
                  color: "#e2e8f0",
                }
          }
        >
          {isUser ? (
            <span>{safeContent}</span>
          ) : isItineraryMessage ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Sparkles size={12} style={{ color: "#D4AF37" }} />
                <span style={{ color: "#D4AF37", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  New Trip Ready
                </span>
              </div>
              <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 700, lineHeight: 1.45 }}>
                {safeContent}
              </div>
            </div>
          ) : (
            <div style={{ lineHeight: 1.6 }}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ marginBottom: 6 }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ color: "#D4AF37", fontWeight: 800 }}>{children}</strong>,
                  em: ({ children }) => <em style={{ color: "rgba(255,255,255,0.65)" }}>{children}</em>,
                  ul: ({ children }) => <ul style={{ marginTop: 6, marginBottom: 6, paddingLeft: 12, listStyle: "none" }}>{children}</ul>,
                  li: ({ children }) => (
                    <li style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                      <span style={{ color: "#D4AF37", flexShrink: 0, marginTop: 1 }}>•</span>
                      <span>{children}</span>
                    </li>
                  ),
                  h1: ({ children }) => <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 14, marginBottom: 4 }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 13, marginBottom: 3 }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{children}</h3>,
                  code: ({ children }) => (
                    <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 4px", borderRadius: 3, fontSize: 11 }}>
                      {children}
                    </code>
                  ),
                }}
              >
                {safeContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}

export function ChatWindow({ onClose, onItinerary }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState("general");
  const scrollRef = useRef(null);
  const messageRefs = useRef(new Map());
  const pendingScrollTargetRef = useRef(null);
  const prevTypingRef = useRef(false);

  useEffect(() => {
    setMessages(INITIAL_MESSAGES);
    setInputVal("");
    setIsTyping(false);
    setChatMode("general");
  }, []);

  useEffect(() => {
    if (pendingScrollTargetRef.current) {
      const node = messageRefs.current.get(pendingScrollTargetRef.current);
      if (node) {
        requestAnimationFrame(() => {
          node.scrollIntoView({ block: "start", behavior: "smooth" });
          pendingScrollTargetRef.current = null;
        });
        return;
      }
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const wasTyping = prevTypingRef.current;
    prevTypingRef.current = isTyping;

    if (!scrollRef.current) return;
    if (!isTyping) return;
    if (!wasTyping && isTyping) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isTyping]);

  const handleWheelScroll = (event) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop += event.deltaY;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSend = (text) => {
    const t = (text || inputVal).trim();
    if (!t || isTyping) return;
    const startedAt = Date.now();

    const shouldPlan = chatMode === "planner" || (isPlanPrompt(t) && !isCasualChatPrompt(t));
    const userMsg = { id: Date.now() + "u", role: "user", content: t, itinerary: null };
    setMessages((prev) => (shouldPlan ? [INITIAL_MESSAGES[0], userMsg] : [...prev, userMsg]));
    setInputVal("");
    setIsTyping(true);

    fetch("/api/chat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: t,
        mode: chatMode,
        history: messages
          .map((m) => ({ role: m.role === "bot" ? "assistant" : m.role, content: m.content }))
          .filter((m) => m.role !== "system"),
      }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        const elapsed = Date.now() - startedAt;
        const minThinking = 850;
        if (elapsed < minThinking) {
          await new Promise((resolve) => setTimeout(resolve, minThinking - elapsed));
        }
        const backendReply = sanitizeVisibleText(data.reply, "I encountered an error. Please try again.");
        const shouldPlan = chatMode === "planner" || (isPlanPrompt(t) && !isCasualChatPrompt(t));
        const plainTextOnlyPlan =
          shouldPlan &&
          !data.itinerary &&
          (backendReply.length > 220 || /day\s*1|itinerary|08:00|10:00|12:30/i.test(backendReply));
        const needsClientFallback =
          shouldPlan &&
          (!data.itinerary ||
            plainTextOnlyPlan ||
            /GROQ_API_KEY|service unavailable|please check/i.test(backendReply));
        const fallbackItinerary = needsClientFallback ? buildClientFallbackItinerary(t) : null;
        const finalItinerary = shouldPlan ? normalizeChatItinerary(data.itinerary || fallbackItinerary || null, t) : null;
        const safeReply = finalItinerary ? summarizeStructuredPlan(finalItinerary) : backendReply;

        setMessages((prev) => {
          const nextMessage = {
            id: Date.now() + "a",
            role: "bot",
            content: safeReply,
            itinerary: finalItinerary,
          };
          if (shouldPlan) {
            pendingScrollTargetRef.current = nextMessage.id;
          }
          return shouldPlan ? [INITIAL_MESSAGES[0], userMsg, nextMessage] : [...prev, nextMessage];
        });

        if (finalItinerary && onItinerary) onItinerary(finalItinerary);
      })
      .catch(async (err) => {
        console.error("Chat error:", err);
        const elapsed = Date.now() - startedAt;
        const minThinking = 850;
        if (elapsed < minThinking) {
          await new Promise((resolve) => setTimeout(resolve, minThinking - elapsed));
        }
        const shouldPlan = chatMode === "planner" || (isPlanPrompt(t) && !isCasualChatPrompt(t));
        const fallbackItinerary = shouldPlan ? buildClientFallbackItinerary(t) : null;
        const finalItinerary = fallbackItinerary ? normalizeChatItinerary(fallbackItinerary, t) : null;
        setMessages((prev) => {
          const nextMessage = {
            id: Date.now() + "e",
            role: "bot",
            content: finalItinerary
              ? summarizeStructuredPlan(finalItinerary)
              : "Sorry, I'm having trouble connecting right now. Please try again.",
            itinerary: finalItinerary,
          };
          if (shouldPlan) {
            pendingScrollTargetRef.current = nextMessage.id;
          }
          return shouldPlan ? [INITIAL_MESSAGES[0], userMsg, nextMessage] : [...prev, nextMessage];
        });
        if (finalItinerary && onItinerary) onItinerary(finalItinerary);
      })
      .finally(() => setIsTyping(false));
  };

  const handleReset = () => setMessages(INITIAL_MESSAGES);
  const showSuggestions = messages.length === 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{
        transformOrigin: "bottom right",
        position: "fixed",
        bottom: 88,
        right: 24,
        width: "min(460px, calc(100vw - 24px))",
        height: "min(720px, calc(100vh - 110px))",
        zIndex: 9999,
        borderRadius: 20,
        background: "linear-gradient(160deg, #0b1422 0%, #060e1c 100%)",
        border: "1px solid rgba(212,175,55,0.18)",
        boxShadow: "0 24px 70px rgba(0,0,0,0.75), 0 0 0 1px rgba(212,175,55,0.07), inset 0 1px 0 rgba(255,255,255,0.04)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "8%",
          right: "8%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(6,14,28,0.7)",
          backdropFilter: "blur(16px)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <RihlaAvatar size={38} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 13.5, fontFamily: "'Sora','Inter',system-ui,sans-serif", letterSpacing: "0.04em" }}>
              Rihla AI
            </span>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px rgba(34,197,94,0.75)",
                flexShrink: 0,
              }}
            />
          </div>
          <div style={{ color: "rgba(212,175,55,0.65)", fontSize: 10, marginTop: 2, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {chatMode === "planner" ? "Travel Planner Mode" : "General AI Mode"}
          </div>
        </div>

        <button
          onClick={handleReset}
          title="New chat"
          style={{
            padding: 7,
            borderRadius: 9,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.3)",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#D4AF37";
            e.currentTarget.style.background = "rgba(212,175,55,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.3)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <RotateCcw size={13} />
        </button>

        <button
          onClick={onClose}
          style={{
            padding: 7,
            borderRadius: 9,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.3)",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.3)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Minimize2 size={13} />
        </button>
      </div>

      <div
        ref={scrollRef}
        onWheel={handleWheelScroll}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "linear-gradient(180deg,rgba(11,20,34,0.98) 0%, rgba(6,14,28,0.98) 100%)",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          scrollbarGutter: "stable",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "2px 0 2px",
            position: "sticky",
            top: 0,
            zIndex: 3,
            background: "linear-gradient(180deg,rgba(11,20,34,0.98) 0%, rgba(11,20,34,0.88) 100%)",
            backdropFilter: "blur(10px)",
          }}
        >
          {[
            { key: "general", label: "General AI" },
            { key: "planner", label: "Travel Planner" },
          ].map((modeOption) => {
            const active = chatMode === modeOption.key;
            return (
              <button
                key={modeOption.key}
                onClick={() => {
                  setChatMode(modeOption.key);
                  setMessages(INITIAL_MESSAGES);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: active ? "1px solid rgba(212,175,55,0.28)" : "1px solid rgba(255,255,255,0.08)",
                  background: active ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                  color: active ? "#F8D66D" : "rgba(255,255,255,0.72)",
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                }}
              >
                {modeOption.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              ref={(node) => {
                if (node) {
                  messageRefs.current.set(msg.id, node);
                } else {
                  messageRefs.current.delete(msg.id);
                }
              }}
            >
              <MessageBubble msg={msg} />
            </div>
          ))}
        </AnimatePresence>

        <AnimatePresence>{isTyping && <TypingDots />}</AnimatePresence>

        {showSuggestions && (
          <div className="mt-1 flex flex-wrap gap-2">
            {PREDEFINED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
                style={{
                  background: "rgba(14,165,233,0.1)",
                  color: "#7dd3fc",
                  border: "1px solid rgba(14,165,233,0.18)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: "10px 12px 12px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(6,14,28,0.82)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            padding: 9,
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(212,175,55,0.24)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={chatMode === "planner" ? "Plan any trip with days, places, and timing..." : "Ask anything..."}
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 14,
              lineHeight: 1.45,
              maxHeight: 96,
              minHeight: 22,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isTyping}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed"
            style={{
              background: inputVal.trim() && !isTyping ? "linear-gradient(135deg,#0ea5e9,#0284c7)" : "rgba(255,255,255,0.04)",
              color: inputVal.trim() && !isTyping ? "#fff" : "rgba(255,255,255,0.2)",
              boxShadow: inputVal.trim() && !isTyping ? "0 8px 24px rgba(14,165,233,0.28)" : "none",
            }}
          >
            <Send size={15} />
          </button>
        </div>
        <div style={{ marginTop: 6, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
          Enter to send - Shift+Enter for new line
        </div>
      </div>
    </motion.div>
  );
}

export default ChatWindow;
