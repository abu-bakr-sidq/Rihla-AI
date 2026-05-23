/**
 * placesService.js
 * Real-time nearby places using OpenStreetMap Overpass API (free, no key).
 * Returns top attractions, restaurants, and hotels near a lat/lng.
 */

const OVERPASS_BASE = "https://overpass-api.de/api/interpreter";
const TIMEOUT_MS    = 5000;
const DEFAULT_RADIUS_M = 5000; // 5km radius

async function fetchWithTimeout(url, opts = {}, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function buildOverpassQuery(lat, lng, radiusM, tags) {
  const tagFilters = tags.map(([k, v]) =>
    `node["${k}"="${v}"](around:${radiusM},${lat},${lng});
     way["${k}"="${v}"](around:${radiusM},${lat},${lng});`
  ).join("\n");
  return `[out:json][timeout:12];
(
  ${tagFilters}
);
out body center 30;`;
}

function extractName(el) {
  return el.tags?.name || el.tags?.["name:en"] || null;
}

function extractRating(el) {
  // OSM doesn't have ratings; use stars or estab. year as proxy
  return el.tags?.stars ? Number(el.tags.stars) : null;
}

function parseElements(elements, category, limit = 8) {
  return elements
    .map(el => ({
      name:     extractName(el),
      lat:      el.lat  ?? el.center?.lat ?? null,
      lng:      el.lon  ?? el.center?.lon ?? null,
      category,
      website:  el.tags?.website || el.tags?.url || null,
      phone:    el.tags?.phone   || null,
      address:  el.tags?.["addr:street"]
                  ? `${el.tags["addr:housenumber"] ?? ""} ${el.tags["addr:street"]}`.trim()
                  : null,
      cuisine:  el.tags?.cuisine?.replace(/_/g, " ") || null,
      rating:   extractRating(el),
      openingHours: el.tags?.opening_hours || null,
    }))
    .filter(p => p.name && p.lat && p.lng)
    .slice(0, limit);
}

async function fetchCategory(lat, lng, tags, category, radiusM = DEFAULT_RADIUS_M) {
  try {
    const query = buildOverpassQuery(lat, lng, radiusM, tags);
    const res = await fetchWithTimeout(OVERPASS_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    `data=${encodeURIComponent(query)}`,
    }, TIMEOUT_MS);
    if (!res.ok) return [];
    const data = await res.json();
    return parseElements(data.elements || [], category);
  } catch (_) { return []; }
}

/**
 * Get top places near lat/lng: attractions, restaurants, hotels.
 * Runs all three Overpass queries in parallel.
 */
export async function getTopPlaces(lat, lng, destination = "") {
  const [attractions, restaurants, hotels] = await Promise.all([
    fetchCategory(lat, lng, [
      ["tourism", "attraction"],
      ["historic", "monument"],
    ], "attraction", 6000),
    fetchCategory(lat, lng, [
      ["amenity", "restaurant"],
    ], "restaurant", 3000),
    fetchCategory(lat, lng, [
      ["tourism", "hotel"],
    ], "hotel", 5000),
  ]);

  // Build a summary string for LLM context injection
  const summaryLines = [];
  if (attractions.length) {
    summaryLines.push(`Top Attractions: ${attractions.slice(0, 5).map(a => a.name).join(", ")}`);
  }
  if (restaurants.length) {
    summaryLines.push(`Best Restaurants: ${restaurants.slice(0, 5).map(r => `${r.name}${r.cuisine ? ` (${r.cuisine})` : ""}`).join(", ")}`);
  }
  if (hotels.length) {
    summaryLines.push(`Hotels Nearby: ${hotels.slice(0, 5).map(h => h.name).join(", ")}`);
  }

  return {
    attractions: attractions.slice(0, 6),
    restaurants: restaurants.slice(0, 6),
    hotels:      hotels.slice(0, 4),
    summary:     summaryLines.join(". ") || `Real-time place data for ${destination}.`,
    source:      "OpenStreetMap Overpass API",
  };
}

/**
 * Get only attraction coordinates for route drawing on the map.
 */
export async function getAttractionCoordinates(lat, lng) {
  const attractions = await fetchCategory(lat, lng, [
    ["tourism", "attraction"],
    ["historic", "monument"],
  ], "attraction", 5000);
  return attractions.map(a => ({ lat: a.lat, lng: a.lng, name: a.name }));
}
