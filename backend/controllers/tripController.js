/**
 * tripController.js — AI Travel Architect Pipeline
 *
 * createTrip flow:
 *   1. Geocode destination → lat/lng
 *   2. Parallel: weather + real places + user DNA
 *   3. Check TripCache for identical request
 *   4. If cache hit → return immediately
 *   5. Generate enriched LLM itinerary with context
 *   6. Write to TripCache (7-day TTL)
 *   7. Save full trip to MongoDB
 */
import { Trip } from "../models/Trip.js";
import { TripCache, buildCacheKey } from "../models/TripCache.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import { createCityItinerary } from "../services/locationEnhancedPlanner.js";
import { generateEnrichedItinerary, generateItinerary, buildPlannerPrompt } from "../services/aiPlannerService.js";
import { getWeatherForDestination, geocodeCity } from "../services/weatherService.js";
import { getTopPlaces } from "../services/placesService.js";

// ─── helpers ────────────────────────────────────────────────────────────────

function getDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 7;
  return Math.min(30, Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1));
}

function withTimeout(promise, ms, label = "Operation") {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function pickScalar(raw, fallback = "") {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (Array.isArray(raw)) {
    return pickScalar(raw.find((item) => typeof item === "string" || typeof item === "number"), fallback);
  }
  if (raw && typeof raw === "object") {
    for (const key of ["category", "label", "budget", "value", "total"]) {
      if (raw[key] !== undefined && raw[key] !== null) return pickScalar(raw[key], fallback);
    }
  }
  return fallback;
}

function normalizeBudget(raw) {
  const scalar = pickScalar(raw, "moderate");
  if (typeof scalar === "number") {
    if (scalar <= 1500) return "budget";
    if (scalar <= 4500) return "moderate";
    if (scalar <= 9000) return "premium";
    return "luxury";
  }
  return String(scalar || "moderate").toLowerCase()
    .replace(/budget.*/, "budget")
    .replace(/moderate.*/, "moderate")
    .replace(/premium.*/, "premium")
    .replace(/luxury.*/, "luxury")
    .trim() || "moderate";
}

function normalizeTravelStyle(raw) {
  return String(pickScalar(raw, "balanced") || "balanced").trim().toLowerCase() || "balanced";
}

function normalizeCostBreakdown(raw, fallback = {}) {
  const source = raw && typeof raw === "object" ? raw : fallback;
  const base = {
    ...(fallback && typeof fallback === "object" ? fallback : {}),
    ...(source && typeof source === "object" ? source : {}),
  };
  const toAmount = (value) => Math.max(0, Math.round(Number(value) || 0));
  const total = toAmount(base.total);
  if (!total) return base;

  const weights = [
    toAmount(base.stay),
    toAmount(base.food),
    toAmount(base.transport),
    toAmount(base.activities),
  ];
  const weightTotal = weights.reduce((sum, value) => sum + value, 0) || 1;
  const scaled = weights.map((value) => Math.round((value / weightTotal) * total));
  const delta = total - scaled.reduce((sum, value) => sum + value, 0);
  scaled[scaled.length - 1] += delta;

  return {
    ...base,
    stay: scaled[0],
    food: scaled[1],
    transport: scaled[2],
    activities: scaled[3],
    total,
  };
}

const STYLE_FALLBACK_THEMES = {
  luxury: ["Arrival & Signature Comfort", "Private Heritage Flow", "Dining & Design Districts", "Scenic Leisure", "Boutique Culture", "Soft Luxury", "Waterfront Indulgence", "Grand Finale"],
  cultural: ["Arrival & Historic Orientation", "Sacred Heritage Trail", "Museums & Story Layers", "Old Quarter Deep Dive", "Craft & Living Culture", "Archive Moments", "Architecture Details", "Farewell Through Heritage Streets"],
  adventure: ["Arrival & Outdoor Orientation", "Active Morning Push", "Trail & Scenic Movement", "Action With Recovery", "Open-Air Discovery", "Challenge & Reward", "Reset By Water", "Finale Adventure Highlights"],
  cinematic: ["Arrival & First Frames", "Panoramic Mornings", "Texture & Atmosphere", "Scenic Layers", "Blue Hour Highlights", "Architecture & Light Study", "Golden-Hour Build", "Farewell Through Best Views"],
  urban: ["Arrival & City Pulse", "Boulevards & District Flow", "Markets & Design", "Modern City Contrasts", "Street Culture Energy", "Shopping & Skyline", "After-Dark Lifestyle", "Final City Highlights"],
  wellness: ["Arrival & Nervous-System Reset", "Mindful Morning Flow", "Nature & Gentle Motion", "Spa & Quiet Corners", "Sacred Pause", "Slow Coastal Day", "Deep Rest", "Farewell Through Soft Rituals"],
  halal: ["Arrival & Prayer-Aware Orientation", "Mosques & Halal Dining", "Family-Friendly Flow", "Comfort & Local Culture", "Sacred Architecture", "Halal Food Trail", "Scenic Calm", "Farewell With Reflection"],
  coastal: ["Arrival & Sea-Breeze Orientation", "Promenade & Beach Rhythm", "Harbourfront & Open Water", "Sand & Slow Afternoons", "Clifftop Or Island Views", "Boardwalk Life", "Waterfront Finale", "Farewell Through The Shoreline"],
  balanced: ["Arrival & First Impressions", "Historic Core", "Markets & Culture", "Green & Scenic", "Modern Local Flow", "Food & Evening Atmosphere", "Neighborhood Discovery", "Farewell Highlights"],
};

const SLOT_LABELS = [
  "Morning",
  "Morning Activity",
  "Afternoon",
  "Afternoon Activity",
  "Evening",
  "Evening Activity",
  "Night",
  "Night Activity",
];

const SLOT_KEYS = [
  "morning",
  "morningActivity",
  "afternoon",
  "afternoonActivity",
  "evening",
  "eveningActivity",
  "night",
  "nightActivity",
];

const SLOT_CATEGORY_SEQUENCE = [
  "sightseeing",
  "activity",
  "food",
  "culture",
  "viewpoint",
  "food",
  "night",
  "stay",
];

function toAmount(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function parseActivityCost(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  const matches = String(value || "").match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) return 0;
  const numbers = matches.map((item) => Number(item)).filter(Number.isFinite);
  if (!numbers.length) return 0;
  return Math.round(numbers.reduce((sum, item) => sum + item, 0) / numbers.length);
}

function buildBudgetFramework({ days, budget, travelers, currency = "USD" }) {
  const totalDays = Math.max(1, Number(days) || 1);
  const totalTravelers = Math.max(1, Number(travelers) || 1);
  const tierDailyBase = {
    budget: 95,
    moderate: 180,
    premium: 290,
    luxury: 430,
  }[normalizeBudget(budget)] || 180;
  const total = tierDailyBase * totalDays * totalTravelers;
  const perDay = Math.round(total / totalDays);
  const categoryWeights = {
    stay: 0.34,
    food: 0.23,
    transport: 0.16,
    activities: 0.19,
    buffer: 0.08,
  };

  const stay = Math.round(total * categoryWeights.stay);
  const food = Math.round(total * categoryWeights.food);
  const transport = Math.round(total * categoryWeights.transport);
  const activities = Math.round(total * categoryWeights.activities);
  const used = stay + food + transport + activities;
  const buffer = Math.max(0, total - used);

  return {
    total,
    perDay,
    currency,
    travelers: totalTravelers,
    stay,
    food,
    transport,
    activities,
    buffer,
  };
}

function splitDailyBudget(total, dayCount) {
  const normalizedDays = Math.max(1, Number(dayCount) || 1);
  const base = Math.floor(total / normalizedDays);
  const remainder = total - (base * normalizedDays);
  return Array.from({ length: normalizedDays }, (_, index) => base + (index < remainder ? 1 : 0));
}

function buildDailyBreakdown({
  totalDays,
  framework,
  itineraryDays,
  destination,
  travelStyle,
  realPlaces,
}) {
  const totalsByCategory = {
    stay: splitDailyBudget(framework.stay, totalDays),
    food: splitDailyBudget(framework.food, totalDays),
    transport: splitDailyBudget(framework.transport, totalDays),
    activities: splitDailyBudget(framework.activities, totalDays),
    buffer: splitDailyBudget(framework.buffer, totalDays),
  };

  const hotelPool = Array.isArray(realPlaces?.hotels) ? realPlaces.hotels : [];
  const restaurantPool = Array.isArray(realPlaces?.restaurants) ? realPlaces.restaurants : [];

  return Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const dayPlan = itineraryDays[index] || {};
    const hotel = hotelPool[index % Math.max(hotelPool.length, 1)] || null;
    const restaurant = restaurantPool[index % Math.max(restaurantPool.length, 1)] || null;
    const stay = totalsByCategory.stay[index];
    const food = totalsByCategory.food[index];
    const transport = totalsByCategory.transport[index];
    const activities = totalsByCategory.activities[index];
    const buffer = totalsByCategory.buffer[index];
    const total = stay + food + transport + activities + buffer;

    return {
      day: dayNumber,
      total,
      stay,
      food,
      transport,
      activities,
      buffer,
      hotelSuggestion: hotel?.title || hotel?.name || `${destination} ${normalizeTravelStyle(travelStyle)} stay pick`,
      mealSuggestion: restaurant?.title || restaurant?.name || dayPlan?.activities?.find((item) => item.category === "food")?.title || `Local ${destination} dining stop`,
    };
  });
}

function buildTripCostBreakdown({
  budget,
  days,
  travelers,
  currency,
  itineraryDays,
  rawCostBreakdown,
  destination,
  travelStyle,
  realPlaces,
}) {
  const framework = buildBudgetFramework({ days, budget, travelers, currency });
  const incomingTotal = toAmount(rawCostBreakdown?.total);
  if (incomingTotal > 0) {
    framework.total = incomingTotal;
    framework.perDay = Math.round(incomingTotal / Math.max(1, days));
    framework.stay = toAmount(rawCostBreakdown?.stay || rawCostBreakdown?.hotel) || framework.stay;
    framework.food = toAmount(rawCostBreakdown?.food) || framework.food;
    framework.transport = toAmount(rawCostBreakdown?.transport || rawCostBreakdown?.flights) || framework.transport;
    framework.activities = toAmount(rawCostBreakdown?.activities) || framework.activities;
    const remainder = framework.total - (framework.stay + framework.food + framework.transport + framework.activities);
    framework.buffer = Math.max(0, remainder);
  }

  return {
    currency: framework.currency,
    total: framework.total,
    perDayBudget: framework.perDay,
    travelers: framework.travelers,
    stay: framework.stay,
    food: framework.food,
    transport: framework.transport,
    activities: framework.activities,
    buffer: framework.buffer,
    daily: buildDailyBreakdown({
      totalDays: Math.max(1, days),
      framework,
      itineraryDays,
      destination,
      travelStyle,
      realPlaces,
    }),
    source: rawCostBreakdown?.source || "planner-engine",
  };
}

function makeFallbackActivity(day, slotIndex, destination, theme, travelStyle, budget) {
  const time = SLOT_LABELS[slotIndex] || "Anytime";
  const title = `${destination} ${time}`;
  return {
    time,
    title,
    description: `Use this ${time.toLowerCase()} slot for a ${normalizeTravelStyle(travelStyle)} experience shaped around ${theme.toLowerCase()} in ${destination}.`,
    location: destination,
    lat: 0,
    lng: 0,
    cost: parseActivityCost(budget === "luxury" ? 120 : budget === "moderate" ? 55 : 22),
    tips: "Keep a comfortable time buffer between transfers.",
    category: SLOT_CATEGORY_SEQUENCE[slotIndex] || "activity",
    imageUrl: null,
    imageAlternatives: [],
    nearbyHighlights: [],
    localFood: `Look for well-rated local dining near ${destination}.`,
    transportationTip: "Use a direct route between stops whenever possible.",
    safetyTip: "Keep valuables secure and stay on well-lit routes after dark.",
    culturalInsight: `Follow local etiquette and site rules while exploring ${destination}.`,
  };
}

function normalizeActivity(rawActivity, fallback = {}) {
  const activity = rawActivity && typeof rawActivity === "object" ? rawActivity : {};
  const place = String(activity.place || activity.title || fallback.title || fallback.place || fallback.time || "Local Highlight").trim();
  const description = String(
    activity.activity ||
    activity.description ||
    fallback.description ||
    `Spend time at ${place} with a route that matches the day plan.`
  ).trim();
  const time = String(activity.time || fallback.time || "Anytime").trim();
  const imageCandidates = [
    activity.imageUrl,
    ...(Array.isArray(activity.imageAlternatives) ? activity.imageAlternatives : []),
    activity.photo,
  ].filter((value, index, list) => value && list.indexOf(value) === index);

  return {
    time,
    title: place,
    description,
    location: String(activity.location || fallback.location || place).trim(),
    lat: Number(activity.lat) || 0,
    lng: Number(activity.lng) || 0,
    cost: parseActivityCost(activity.cost || fallback.cost),
    tips: String(activity.tips || fallback.tips || "Keep enough transition time between stops.").trim(),
    category: String(activity.category || fallback.category || "activity").trim(),
    imageUrl: imageCandidates[0] || null,
    imageAlternatives: imageCandidates.slice(1),
    nearbyHighlights: Array.isArray(activity.nearbyHighlights) ? activity.nearbyHighlights.slice(0, 3) : (fallback.nearbyHighlights || []),
    travelSuggestion: String(activity.travelSuggestion || fallback.travelSuggestion || "").trim(),
    localFood: String(activity.localFood || fallback.localFood || "").trim(),
    transportationTip: String(activity.transportationTip || fallback.transportationTip || "").trim(),
    safetyTip: String(activity.safetyTip || fallback.safetyTip || "").trim(),
    culturalInsight: String(activity.culturalInsight || fallback.culturalInsight || "").trim(),
  };
}

function normalizeDayActivities(rawDay, dayNumber, destination, travelStyle, budget) {
  const theme = String(rawDay?.theme || buildStyleFallbackTheme(travelStyle, dayNumber)).trim();
  const activityList = [];

  if (Array.isArray(rawDay?.activities) && rawDay.activities.length) {
    rawDay.activities.forEach((activity, index) => {
      activityList.push(normalizeActivity(activity, makeFallbackActivity(dayNumber, index, destination, theme, travelStyle, budget)));
    });
  }

  SLOT_KEYS.forEach((slotKey, slotIndex) => {
    if (rawDay?.[slotKey] && typeof rawDay[slotKey] === "object") {
      activityList.push(normalizeActivity(rawDay[slotKey], makeFallbackActivity(dayNumber, slotIndex, destination, theme, travelStyle, budget)));
    }
  });

  const seen = new Set();
  const uniqueActivities = [];
  for (const activity of activityList) {
    const key = `${String(activity.title || "").toLowerCase()}|${String(activity.time || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueActivities.push(activity);
  }

  while (uniqueActivities.length < 8) {
    uniqueActivities.push(makeFallbackActivity(dayNumber, uniqueActivities.length, destination, theme, travelStyle, budget));
  }

  return uniqueActivities.slice(0, 8).map((activity, index) => ({
    ...activity,
    time: SLOT_LABELS[index] || activity.time,
    category: activity.category || SLOT_CATEGORY_SEQUENCE[index] || "activity",
  }));
}

function normalizeGeneratedPayload({
  payload,
  destination,
  days,
  budget,
  travelStyle,
  travelers,
  currency,
  realPlaces,
}) {
  const sourceDays = Array.isArray(payload?.itinerary)
    ? payload.itinerary
    : Array.isArray(payload)
      ? payload
      : [];

  const itinerary = Array.from({ length: Math.max(1, days) }, (_, index) => {
    const dayNumber = index + 1;
    const rawDay = sourceDays[index] || {};
    const theme = String(rawDay?.theme || buildStyleFallbackTheme(travelStyle, dayNumber)).trim();
    return {
      day: dayNumber,
      title: String(rawDay?.title || `Day ${dayNumber} in ${destination}`).trim(),
      theme,
      activities: normalizeDayActivities(rawDay, dayNumber, destination, travelStyle, budget),
    };
  });

  const routeCoordinates = Array.isArray(payload?.routeCoordinates)
    ? payload.routeCoordinates.filter((point) => Number(point?.lat) || Number(point?.lng))
    : itinerary.flatMap((day) => day.activities.map((activity) => ({
      lat: activity.lat,
      lng: activity.lng,
    }))).filter((point) => point.lat || point.lng);

  const costBreakdown = buildTripCostBreakdown({
    budget,
    days,
    travelers,
    currency,
    itineraryDays: itinerary,
    rawCostBreakdown: payload?.costBreakdown || {},
    destination,
    travelStyle,
    realPlaces,
  });

  return {
    itinerary,
    routeCoordinates,
    highlights: Array.isArray(payload?.highlights) ? payload.highlights.slice(0, 5) : [],
    costBreakdown,
  };
}

function buildStyleFallbackTheme(travelStyle = "balanced", day = 1) {
  const style = normalizeTravelStyle(travelStyle);
  const themes = STYLE_FALLBACK_THEMES[style] || STYLE_FALLBACK_THEMES.balanced;
  return themes[(Math.max(1, day) - 1) % themes.length] || `Day ${day}`;
}

async function findTripByIdentifier(identifier, { lean = false } = {}) {
  if (!identifier) return null;
  const query = mongoose.Types.ObjectId.isValid(identifier)
    ? { $or: [{ _id: identifier }, { tripId: identifier }] }
    : { tripId: identifier };
  const finder = Trip.findOne(query);
  return lean ? finder.lean() : finder;
}

function toTripResponse(doc) {
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
  return {
    ...obj,
    id: String(obj._id || obj.id),
  };
}

// Get last 5 trips for user "Travel DNA"
async function getUserDNA(userId) {
  try {
    return await Trip.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
  } catch (_) { return []; }
}

// Fallback itinerary when everything else fails
function buildFallbackItinerary({ destination, days, budget, travelStyle, interests }) {
  const style = normalizeTravelStyle(travelStyle);
  const dayPlans = [];
  for (let d = 1; d <= Number(days); d++) {
    const theme = buildStyleFallbackTheme(style, d);
    dayPlans.push({
      day: d,
      title: `Day ${d} in ${destination}`,
      theme,
      activities: [
        { time: "Morning", title: `${destination} — ${theme} Start`, description: `Begin ${destination} through a ${style}-aware morning chapter shaped around ${theme.toLowerCase()}.`, location: destination, lat: 0, lng: 0, cost: `$${budget === "luxury" ? "80-150" : "20-40"}` },
        { time: "Afternoon", title: `${destination} — ${style === "cultural" ? "Story-Led" : style === "adventure" ? "Active" : style === "luxury" ? "Refined" : "Curated"} Midday Flow`, description: `Use the middle of the day to deepen the ${style} rhythm of your trip in ${destination}.`, location: destination, lat: 0, lng: 0, cost: `$${budget === "luxury" ? "60-120" : "15-30"}` },
        { time: "Evening", title: `${destination} — ${style === "coastal" ? "Waterfront" : style === "cinematic" ? "Golden Hour" : style === "urban" ? "City Lights" : "Evening"} Close`, description: `Close day ${d} with an evening chapter that still fits your ${style} travel style in ${destination}.`, location: destination, lat: 0, lng: 0, cost: `$${budget === "luxury" ? "40-80" : "10-20"}` },
      ],
    });
  }
  const perDay = budget === "luxury" ? 400 : budget === "moderate" ? 180 : 80;
  return {
    itinerary: dayPlans,
    costBreakdown: { total: perDay * days, currency: "USD", source: "fallback" },
    routeCoordinates: [],
  };
}

function buildRichFallbackItinerary({ destination, days, budget, travelStyle = "balanced" }) {
  const dayThemes = [
    {
      label: "Historic Core",
      slots: [
        ["Morning", "Sunrise Orientation", `Begin with a scenic introduction to ${destination}.`],
        ["Morning Activity", "Heritage Walk", `Explore historic corners and local character in ${destination}.`],
        ["Afternoon", "Local Cuisine", `Enjoy signature daytime food experiences in ${destination}.`],
        ["Afternoon Activity", "Museum Or Craft Stop", `Spend the mid-afternoon on culture, craft, or a landmark session in ${destination}.`],
        ["Evening", "Sunset Views", `Catch the golden-hour highlights and best evening scenery in ${destination}.`],
        ["Evening Activity", "Neighborhood Stroll", `Walk a lively district and experience the local evening rhythm in ${destination}.`],
        ["Night", "Dining Experience", `Settle into a more atmospheric dinner or lounge moment in ${destination}.`],
        ["Night Activity", "Stay Wind-Down", `Close the day with a calmer final stop or stay experience in ${destination}.`],
      ],
    },
    {
      label: "Markets & Culture",
      slots: [
        ["Morning", "Old Quarter Start", `Ease into the day with a walk through the older heart of ${destination}.`],
        ["Morning Activity", "Temple Or Landmark Route", `Focus on a major spiritual or civic landmark in ${destination}.`],
        ["Afternoon", "Market Lunch Trail", `Use lunch hours to explore local market flavor in ${destination}.`],
        ["Afternoon Activity", "Gallery Or Museum Session", `Spend the afternoon on an arts, history, or museum stop in ${destination}.`],
        ["Evening", "Golden Hour Viewpoint", `Move toward a photogenic evening viewpoint in ${destination}.`],
        ["Evening Activity", "Street Food Stroll", `Follow the after-hours food rhythm and casual crowd flow in ${destination}.`],
        ["Night", "Signature Dinner Stop", `Anchor the night around one strong dining or social stop in ${destination}.`],
        ["Night Activity", "Late Evening Pause", `Finish with a slower final stop before closing the day in ${destination}.`],
      ],
    },
    {
      label: "Green & Scenic",
      slots: [
        ["Morning", "Garden District Start", `Open the day with a calmer park, lake, or garden-side introduction to ${destination}.`],
        ["Morning Activity", "Scenic Route", `Take a visually rewarding route through one scenic side of ${destination}.`],
        ["Afternoon", "Cafe & Local Lunch", `Break midday with a comfortable lunch and local cafe atmosphere in ${destination}.`],
        ["Afternoon Activity", "Craft Quarter Session", `Use the afternoon for craft, design, or a cultural quarter stop in ${destination}.`],
        ["Evening", "Waterfront Or Ridge View", `Catch softer evening light from one of the better outlooks in ${destination}.`],
        ["Evening Activity", "Local Rhythm Walk", `Follow the neighborhood energy as the day transitions into night in ${destination}.`],
        ["Night", "Atmospheric Dinner", `Keep the night refined with a more atmospheric dinner or lounge setting in ${destination}.`],
        ["Night Activity", "Quiet Stay Finish", `End the day with a calmer close and a comfortable stay experience in ${destination}.`],
      ],
    },
    {
      label: "Modern Local Flow",
      slots: [
        ["Morning", "City Pulse Start", `Start with a fresh look at the contemporary side of ${destination}.`],
        ["Morning Activity", "Boulevard Discovery", `Explore a walkable modern district or public boulevard in ${destination}.`],
        ["Afternoon", "Lunch Discovery Loop", `Use the lunch window for a strong local stop and nearby discovery in ${destination}.`],
        ["Afternoon Activity", "Design Or Specialty Stop", `Spend the afternoon on a specialty, design, or niche local attraction in ${destination}.`],
        ["Evening", "Skyline Or Open View", `Shift into the evening with a wider city view or open-air scenic pause in ${destination}.`],
        ["Evening Activity", "Lifestyle District Walk", `Take in the social energy of a more active lifestyle district in ${destination}.`],
        ["Night", "Premium Night Stop", `Use the night for one elevated dining or premium local experience in ${destination}.`],
        ["Night Activity", "Stay Recovery Window", `Finish the route with a relaxed final stop and recovery pace in ${destination}.`],
      ],
    },
  ];

  const dayPlans = [];
  for (let d = 1; d <= Number(days); d++) {
    const theme = dayThemes[(d - 1) % dayThemes.length];
    const styleTheme = buildStyleFallbackTheme(travelStyle, d);
    dayPlans.push({
      day: d,
      title: `Day ${d} in ${destination}`,
      theme: styleTheme,
      activities: theme.slots.map((slot, idx) => ({
        time: slot[0],
        title: `${destination} - ${slot[1]}`,
        description: `${slot[2]} Day ${d} focus within the ${styleTheme.toLowerCase()} chapter.`,
        location: `${destination} ${styleTheme} ${slot[1]}`,
        lat: 0,
        lng: 0,
        cost: `$${budget === "luxury" ? 80 + idx * 20 : budget === "moderate" ? 20 + idx * 10 : 10 + idx * 5}-${budget === "luxury" ? 150 + idx * 25 : budget === "moderate" ? 40 + idx * 12 : 25 + idx * 6}`,
      })),
    });
  }
  const perDay = budget === "luxury" ? 400 : budget === "moderate" ? 180 : 80;
  return {
    itinerary: dayPlans,
    costBreakdown: { total: perDay * days, currency: "USD", source: "fallback" },
    routeCoordinates: [],
  };
}

// ─── MAIN: createTrip ────────────────────────────────────────────────────────

export const createTrip = async (req, res) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      destination, startDate, endDate, days,
      travelers = 1, budget = "moderate", currency = "USD", travelStyle = "balanced",
      interests = [], preferences = {}, itinerary, costBreakdown,
      lat: inLat, lng: inLng, status = "planned",
    } = req.body;

    if (!destination) return res.status(400).json({ message: "Destination is required" });

    const normBudget = normalizeBudget(budget);
    const normTravelStyle = normalizeTravelStyle(travelStyle);
    const normDays = Math.min(30, Math.max(1, Number(days) || getDayCount(startDate, endDate) || 7));
    const normTravelers = Number(travelers) || 1;
    const normInterests = Array.isArray(interests) ? interests : [];
    const now = new Date();
    const normStart = startDate ? new Date(startDate) : now;
    const normEnd = endDate ? new Date(endDate) : new Date(now.getTime() + normDays * 86400000);

    // ── 1. Geocode (use provided coords or geocode) ──────────────────────────
    let geoCoords = (inLat && inLng) ? { lat: Number(inLat), lng: Number(inLng) } : null;
    if (!geoCoords) {
      geoCoords = await geocodeCity(destination).catch(() => null);
    }

    // ── 2. Check cache ────────────────────────────────────────────────────────
    const cacheKey = buildCacheKey(destination, normDays, normBudget, normTravelStyle);
    const cached = itinerary ? null : await TripCache.findOne({ cacheKey }).lean();

    if (cached) {
      console.log(`[TripCache] HIT for "${destination}" — serving instantly`);
      await TripCache.updateOne({ cacheKey }, { $inc: { hitCount: 1 } });

      const cachedPayload = normalizeGeneratedPayload({
        payload: {
          itinerary: cached.data.itinerary || [],
          costBreakdown: cached.data.costBreakdown || {},
          routeCoordinates: cached.data.routeCoordinates || [],
        },
        destination,
        days: normDays,
        budget: normBudget,
        travelStyle: normTravelStyle,
        travelers: normTravelers,
        currency,
        realPlaces: cached.data.realPlaces || {},
      });

      const newTrip = await Trip.create({
        tripId: crypto.randomUUID(),
        userId,
        destination,
        destinationMeta: {
          name: destination,
          coordinates: geoCoords || { lat: 0, lng: 0 },
        },
        startDate: normStart,
        endDate: normEnd,
        days: normDays,
        budget: normBudget,
        currency,
        travelStyle: normTravelStyle,
        interests: normInterests,
        travelers: normTravelers,
        status,
        climate: cached.data.climate || {},
        realPlaces: cached.data.realPlaces || {},
        itinerary: cachedPayload.itinerary,
        costBreakdown: cachedPayload.costBreakdown,
        routeCoordinates: cachedPayload.routeCoordinates,
        preferences: { travelStyle: normTravelStyle, interests: normInterests, travelers: normTravelers, currency, specialRequests: preferences?.specialRequests || req.body.specialRequirements || "" },
        servedFromCache: true,
      });

      return res.status(201).json(toTripResponse(newTrip));
    }

    // ── 3. Parallel data enrichment ───────────────────────────────────────────
    console.log(`[AI Architect] Enriching context for "${destination}"...`);
    const [weather, realPlaces, userDNA] = await Promise.all([
      geoCoords
        ? getWeatherForDestination(destination, geoCoords.lat, geoCoords.lng)
        : getWeatherForDestination(destination),
      geoCoords
        ? getTopPlaces(geoCoords.lat, geoCoords.lng, destination)
        : Promise.resolve(null),
      getUserDNA(userId),
    ]);

    if (weather) console.log(`[Weather] ${destination}: ${weather.temp} ${weather.condition}`);
    if (realPlaces) console.log(`[Places] Found ${realPlaces.attractions?.length || 0} attractions`);

    // ── 4. AI Generation ──────────────────────────────────────────────────────
    let generatedPayload = null;

    // Only use LLM if client didn't pass in an itinerary
    if (!itinerary) {
      try {
        // Try enriched LLM first (chain-of-thought with real data)
        generatedPayload = await generateEnrichedItinerary({
          destination,
          days: normDays,
          budget: normBudget,
          travelStyle: normTravelStyle,
          interests: normInterests,
          preferences,
          weather,
          realPlaces,
          userDNA,
        });
        console.log(`[AI Architect] Enriched itinerary generated for "${destination}"`);
      } catch (llmErr) {
        console.error("[AI Architect] LLM fallback to locationEnhancedPlanner:", llmErr.message);
        try {
          // Fallback 1: locationEnhancedPlanner (Wikipedia + curated data)
          generatedPayload = await createCityItinerary(
            destination, normDays, normBudget, normTravelStyle, normInterests
          );
        } catch (_) { }
      }

      // Fallback 2: synthetic itinerary
      if (!generatedPayload) {
        console.warn("[AI Architect] Using fallback synthetic itinerary");
        generatedPayload = buildRichFallbackItinerary({
          destination, days: normDays, budget: normBudget, travelStyle: normTravelStyle, interests: normInterests,
        });
      }
    }

    // ── 5. Write to cache ─────────────────────────────────────────────────────
    const normalizedPayload = normalizeGeneratedPayload({
      payload: itinerary ? {
        itinerary,
        costBreakdown: costBreakdown || generatedPayload?.costBreakdown || {},
        routeCoordinates: generatedPayload?.routeCoordinates || [],
      } : generatedPayload,
      destination,
      days: normDays,
      budget: normBudget,
      travelStyle: normTravelStyle,
      travelers: normTravelers,
      currency,
      realPlaces,
    });

    const cacheData = {
      itinerary: normalizedPayload.itinerary,
      costBreakdown: normalizedPayload.costBreakdown,
      routeCoordinates: normalizedPayload.routeCoordinates,
      climate: weather || {},
      realPlaces: realPlaces || {},
    };

    TripCache.create({
      cacheKey, destination,
      days: normDays, budget: normBudget, travelStyle: normTravelStyle,
      data: cacheData,
    }).catch(err => {
      if (err.code !== 11000) console.error("[TripCache] Write error:", err.message);
    });

    // ── 6. Save to MongoDB ────────────────────────────────────────────────────
    const newTrip = await Trip.create({
      tripId: crypto.randomUUID(),
      userId,
      destination,
      destinationMeta: {
        name: destination,
        coordinates: geoCoords || { lat: 0, lng: 0 },
      },
      startDate: normStart,
      endDate: normEnd,
      days: normDays,
      budget: normBudget,
      currency,
      travelStyle: normTravelStyle,
      interests: normInterests,
      travelers: normTravelers,
      status,
      climate: weather || {},
      realPlaces: realPlaces || {},
      itinerary: normalizedPayload.itinerary,
      costBreakdown: normalizedPayload.costBreakdown,
      routeCoordinates: normalizedPayload.routeCoordinates,
      preferences: {
        travelStyle: normTravelStyle,
        interests: normInterests,
        travelers: normTravelers,
        currency,
        specialRequests: preferences?.specialRequests || req.body.specialRequirements || "",
      },
      servedFromCache: false,
    });

    console.log(`[AI Architect] Trip saved: ${newTrip.tripId} for "${destination}"`);
    res.status(201).json(toTripResponse(newTrip));

  } catch (err) {
    console.error("[createTrip ERROR]", err.message, err.errors);
    res.status(500).json({ message: "Failed to create trip", error: err.message });
  }
};

// ─── getUserTrips ─────────────────────────────────────────────────────────────
export const getUserTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id || req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    const mapped = trips.map(t => ({ ...t, id: String(t._id) }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trips", error: err.message });
  }
};

// ─── getTripById ──────────────────────────────────────────────────────────────
export const getTripById = async (req, res) => {
  try {
    const trip = await findTripByIdentifier(req.params.id, { lean: true });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    if (String(trip.userId) !== String(req.user._id || req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json({ ...trip, id: String(trip._id) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trip", error: err.message });
  }
};

// ─── deleteTrip ──────────────────────────────────────────────────────────────
export const deleteTrip = async (req, res) => {
  try {
    const trip = await findTripByIdentifier(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    if (String(trip.userId) !== String(req.user._id || req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await trip.deleteOne();
    res.json({ message: "Trip deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete trip", error: err.message });
  }
};

// ─── deleteAllTrips ──────────────────────────────────────────────────────────
export const deleteAllTrips = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await Trip.deleteMany({ userId });
    res.json({ message: "All trips deleted", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete all trips", error: err.message });
  }
};

// ─── updateTrip ──────────────────────────────────────────────────────────────
export const updateTrip = async (req, res) => {
  try {
    const trip = await findTripByIdentifier(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    if (String(trip.userId) !== String(req.user._id || req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    Object.assign(trip, req.body);
    await trip.save();
    res.json(toTripResponse(trip));
  } catch (err) {
    res.status(500).json({ message: "Failed to update trip", error: err.message });
  }
};

// ─── generateAITrip (legacy endpoint support) ────────────────────────────────
export const generateAITrip = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      days,
      travelers = 1,
      budget = "moderate",
      currency = "USD",
      travelStyle = "balanced",
      interests = [],
      preferences = {},
    } = req.body || {};

    if (!destination) {
      return res.status(400).json({ message: "Destination is required" });
    }

    const normBudget = normalizeBudget(budget);
    const normTravelStyle = normalizeTravelStyle(travelStyle);
    const normDays = Math.min(30, Math.max(1, Number(days) || getDayCount(startDate, endDate) || 7));
    const normInterests = Array.isArray(interests) ? interests : [];
    const normTravelers = Number(travelers) || 1;

    let geoCoords = null;
    try {
      geoCoords = await withTimeout(geocodeCity(destination), 2500, "Destination geocoding");
    } catch (geoErr) {
      console.warn("[generateAITrip] geocoding skipped:", geoErr.message);
    }

    const [weatherResult, placesResult, userDNAResult] = await Promise.allSettled([
      geoCoords
        ? withTimeout(getWeatherForDestination(destination, geoCoords.lat, geoCoords.lng), 3500, "Weather fetch")
        : withTimeout(getWeatherForDestination(destination), 3500, "Weather fetch"),
      geoCoords
        ? withTimeout(getTopPlaces(geoCoords.lat, geoCoords.lng, destination), 4500, "Places fetch")
        : Promise.resolve(null),
      req.user?._id || req.user?.id
        ? withTimeout(getUserDNA(req.user._id || req.user.id), 1500, "User DNA fetch")
        : Promise.resolve([]),
    ]);

    const weather = weatherResult.status === "fulfilled" ? weatherResult.value : null;
    const realPlaces = placesResult.status === "fulfilled" ? placesResult.value : null;
    const userDNA = userDNAResult.status === "fulfilled" ? userDNAResult.value : [];

    let generatedPayload = null;

    try {
      generatedPayload = await withTimeout(generateEnrichedItinerary({
        destination,
        days: normDays,
        budget: normBudget,
        travelStyle: normTravelStyle,
        interests: normInterests,
        preferences: { ...preferences, travelers: normTravelers },
        weather,
        realPlaces,
        userDNA,
      }), Math.min(90000, 10000 + (normDays * 3000)), "AI itinerary generation");
    } catch (llmErr) {
      console.warn("[generateAITrip] AI generation fallback:", llmErr.message);
      try {
        generatedPayload = await withTimeout(
          createCityItinerary(destination, normDays, normBudget, normTravelStyle, normInterests),
          Math.min(45000, 8000 + (normDays * 1200)),
          "Location itinerary fallback"
        );
      } catch (fallbackErr) {
        console.warn("[generateAITrip] location fallback failed:", fallbackErr.message);
      }
    }

    if (!generatedPayload) {
      generatedPayload = buildRichFallbackItinerary({
        destination,
        days: normDays,
        budget: normBudget,
        travelStyle: normTravelStyle,
        interests: normInterests,
      });
    }

    const normalizedPayload = normalizeGeneratedPayload({
      payload: generatedPayload,
      destination,
      days: normDays,
      budget: normBudget,
      travelStyle: normTravelStyle,
      travelers: normTravelers,
      currency,
      realPlaces,
    });

    return res.status(200).json({
      destination,
      days: normDays,
      travelers: normTravelers,
      currency,
      travelStyle: normTravelStyle,
      itinerary: normalizedPayload.itinerary,
      costBreakdown: normalizedPayload.costBreakdown,
      routeCoordinates: normalizedPayload.routeCoordinates,
      climate: weather || {},
      realPlaces: realPlaces || {},
    });
  } catch (err) {
    console.error("[generateAITrip ERROR]", err.message, err.errors);
    return res.status(500).json({ message: "Failed to generate trip", error: err.message });
  }
};

// ─── getCacheStats (admin utility) ───────────────────────────────────────────
export const getCacheStats = async (req, res) => {
  try {
    const count = await TripCache.countDocuments();
    const topHits = await TripCache.find().sort({ hitCount: -1 }).limit(5).lean();
    res.json({ totalCached: count, topHits: topHits.map(c => ({ destination: c.destination, hits: c.hitCount })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
