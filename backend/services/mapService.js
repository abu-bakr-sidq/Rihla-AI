const CROSS_LOCATION_CITIES = new Set([
  "dubai","london","paris","tokyo","singapore","newyork","new york","mumbai","delhi",
  "bangkok","sydney","barcelona","amsterdam","rome","istanbul","berlin","toronto",
  "moscow","beijing","shanghai","seoul","kualalumpur","dubai","abudhabi","doha",
  "cairo","nairobi","johannesburg","sanfrancisco","losangeles","chicago","miami",
  "kolkata","hyderabad","bangalore","pune","ahmedabad","jaipur","surat","lucknow"
]);
const GENERIC_IMAGE_PATTERN = /(map(_of|s)|location_map|locator_map|blank_map|flag_of|coat_of_arms|logo|icon|symbol|emblem|seal_of|diagram|chart|graph|route_map|suburban_rail|metro_map|transit_map|system_map|network_map|scheme|transport_map|infrastructure|topology|connectivity|transportation_map|urban_rail|railway_map|transit_network|city_map|street_map|geographical_map|political_map|vector_map|interactive_map|transit_system|route_network|map_icon|transit_icon|navigation|gps_map|system_diagram|network_diagram|schematic|layout|blueprint|plan_of|topography|cartography)/i;
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const EXTERNAL_FETCH_TIMEOUT_MS = 3000;

export function normalizeToken(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
export function formatDisplayName(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
export function keywordTokens(text) {
  return normalizeToken(text).split(" ").filter((w) => w.length >= 4);
}

// ... Additional Map Logic will reside here, e.g. geocoding and image fetching

export async function fetchWithTimeout(url, options = {}, timeoutMs = EXTERNAL_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocodeDestination(destination) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(destination)}&addressdetails=1`;
    const resp = await fetchWithTimeout(url, {
      headers: { "User-Agent": "AI-TP-Connection/1.0" }
    }, 2500);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const top = data[0];
    const centerLat = Number(top.lat);
    const centerLng = Number(top.lon);
    return {
      lat: centerLat,
      lng: centerLng,
      displayName: top.display_name || destination
    };
  } catch (_error) {
    return null;
  }
}
