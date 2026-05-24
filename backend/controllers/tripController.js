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
import mongoose from "mongoose";
import { createCityItinerary } from "../services/locationEnhancedPlanner.js";
import { generateEnrichedItinerary } from "../services/aiPlannerService.js";
import { getWeatherForDestination, geocodeCity } from "../services/weatherService.js";
import { getTopPlaces } from "../services/placesService.js";

// ─── helpers ────────────────────────────────────────────────────────────────

function getDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 7;
  return Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));
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
    const normDays = Number(days) || getDayCount(startDate, endDate) || 7;
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
    const cached = await TripCache.findOne({ cacheKey }).lean();

    if (cached) {
      console.log(`[TripCache] HIT for "${destination}" — serving instantly`);
      await TripCache.updateOne({ cacheKey }, { $inc: { hitCount: 1 } });

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
        itinerary: cached.data.itinerary || [],
        costBreakdown: cached.data.costBreakdown || {},
        routeCoordinates: cached.data.routeCoordinates || [],
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

      if (!generatedPayload) {
        console.error("[AI Architect] Current itinerary engines did not return a trip");
        return res.status(502).json({ message: "Failed to generate itinerary with the current planner engines" });
      }
    }

    // ── 5. Write to cache ─────────────────────────────────────────────────────
    const effectiveItinerary = itinerary || generatedPayload?.itinerary || [];
    const effectiveCostBreakdown = costBreakdown || generatedPayload?.costBreakdown || {};

    const cacheData = {
      itinerary: effectiveItinerary,
      costBreakdown: effectiveCostBreakdown,
      routeCoordinates: generatedPayload?.routeCoordinates || [],
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
      itinerary: effectiveItinerary,
      costBreakdown: effectiveCostBreakdown,
      routeCoordinates: generatedPayload?.routeCoordinates || [],
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
    const normDays = Number(days) || getDayCount(startDate, endDate) || 7;
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
        travelStyle,
        interests: normInterests,
        preferences: { ...preferences, travelers: normTravelers },
        weather,
        realPlaces,
        userDNA,
      }), 12000, "AI itinerary generation");
    } catch (llmErr) {
      console.warn("[generateAITrip] AI generation fallback:", llmErr.message);
      try {
        generatedPayload = await withTimeout(
          createCityItinerary(destination, normDays, normBudget, travelStyle, normInterests),
          12000,
          "Location itinerary fallback"
        );
      } catch (fallbackErr) {
        console.warn("[generateAITrip] location fallback failed:", fallbackErr.message);
      }
    }

    if (!generatedPayload) {
      try {
        generatedPayload = await createCityItinerary(
          destination,
          normDays,
          normBudget,
          travelStyle,
          normInterests
        );
      } catch (fallbackRetryErr) {
        console.warn("[generateAITrip] final location-engine retry failed:", fallbackRetryErr.message);
      }
    }

    if (!generatedPayload) {
      return res.status(502).json({ message: "Failed to generate trip with the current planner engines" });
    }

    return res.status(200).json({
      destination,
      days: normDays,
      travelers: normTravelers,
      currency,
      itinerary: generatedPayload?.itinerary || generatedPayload,
      costBreakdown: generatedPayload?.costBreakdown || {},
      routeCoordinates: generatedPayload?.routeCoordinates || [],
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
