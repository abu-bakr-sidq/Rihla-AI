import { appendFileSync } from "fs";
import OpenAI from "openai";

const EXTERNAL_FETCH_TIMEOUT_MS = 3000;
const commonsImageCache = new Map();
const DEBUG_LOG_PATH = "backend/debug.log";
const ITINERARY_GENERATOR_VERSION = "2026-03-11-r1";

const CROSS_LOCATION_CITIES = new Set([
  "dubai", "london", "paris", "tokyo", "singapore", "newyork", "new york", "mumbai", "delhi",
  "bangkok", "sydney", "barcelona", "amsterdam", "rome", "istanbul", "berlin", "toronto",
  "moscow", "beijing", "shanghai", "seoul", "kualalumpur", "dubai", "abudhabi", "doha",
  "cairo", "nairobi", "johannesburg", "sanfrancisco", "losangeles", "chicago", "miami",
  "kolkata", "hyderabad", "bangalore", "pune", "ahmedabad", "jaipur", "surat", "lucknow"
]);

const GENERIC_IMAGE_PATTERN = /(map(_of|s)|location_map|locator_map|blank_map|flag_of|coat_of_arms|logo|icon|symbol|emblem|seal_of|diagram|chart|graph|route_map|suburban_rail|metro_map|transit_map|system_map|network_map|scheme|transport_map|infrastructure|topology|connectivity|transportation_map|urban_rail|railway_map|transit_network|city_map|street_map|geographical_map|political_map|vector_map|interactive_map|transit_system|route_network|map_icon|transit_icon|navigation|gps_map|system_diagram|network_diagram|schematic|layout|blueprint|plan_of|topography|cartography)/i;

const CURATED_CITY_CENTERS = {
  chennai: {
    lat: 13.0827,
    lng: 80.2707,
    displayName: "Chennai, Tamil Nadu",
    boundingBox: {
      south: 12.78,
      north: 13.24,
      west: 80.12,
      east: 80.36
    }
  },
  london: {
    lat: 51.5072,
    lng: -0.1276,
    displayName: "London, United Kingdom",
    boundingBox: {
      south: 51.28,
      north: 51.70,
      west: -0.51,
      east: 0.23
    }
  },
  paris: {
    lat: 48.8566,
    lng: 2.3522,
    displayName: "Paris, France",
    boundingBox: {
      south: 48.79,
      north: 48.92,
      west: 2.22,
      east: 2.43
    }
  }
};

const CHENNAI_CURATED_PLACES = [
  { title: "Marina Beach", area: "Triplicane", category: "beach", lat: 13.0505, lng: 80.2824 },
  { title: "Elliot's Beach", area: "Besant Nagar", category: "beach", lat: 12.9983, lng: 80.2729 },
  { title: "Besant Nagar Beach", area: "Besant Nagar", category: "beach", lat: 12.9985, lng: 80.2732 },
  { title: "Ashtalakshmi Temple", area: "Besant Nagar", category: "temple", lat: 12.9988, lng: 80.2708 },
  { title: "Theosophical Society", area: "Adyar", category: "culture", lat: 13.0098, lng: 80.2662 },
  { title: "Kalakshetra Foundation", area: "Thiruvanmiyur", category: "culture", lat: 13.005, lng: 80.2576 },
  { title: "Tholkappia Poonga", area: "Adyar", category: "nature", lat: 13.0067, lng: 80.268 },
  { title: "Kasimedu Fishing Harbour", area: "Royapuram", category: "waterfront", lat: 13.1272, lng: 80.3001 },
  { title: "Santhome Basilica", area: "Santhome", category: "temple", lat: 13.0335, lng: 80.2785 },
  { title: "Kapaleeshwarar Temple", area: "Mylapore", category: "temple", lat: 13.0335, lng: 80.2697 },
  { title: "Nageswara Rao Park", area: "Mylapore", category: "park", lat: 13.0349, lng: 80.2548 },
  { title: "Vivekananda House", area: "Marina", category: "landmark", lat: 13.0476, lng: 80.283 },
  { title: "Chennai Lighthouse", area: "Marina", category: "landmark", lat: 13.0484, lng: 80.2821 },
  { title: "Parthasarathy Temple", area: "Triplicane", category: "temple", lat: 13.0527, lng: 80.2793 },
  { title: "Triplicane Heritage Streets", area: "Triplicane", category: "neighborhood", lat: 13.0558, lng: 80.2767 },
  { title: "Chepauk Stadium Exterior", area: "Chepauk", category: "landmark", lat: 13.0636, lng: 80.2805 },
  { title: "Government Museum Chennai", area: "Egmore", category: "museum", lat: 13.0723, lng: 80.2649 },
  { title: "Museum Theatre Egmore", area: "Egmore", category: "museum", lat: 13.0718, lng: 80.2643 },
  { title: "Connemara Public Library", area: "Egmore", category: "museum", lat: 13.0713, lng: 80.2638 },
  { title: "Ripon Building", area: "Park Town", category: "landmark", lat: 13.0813, lng: 80.2746 },
  { title: "Chennai Central Railway Heritage Facade", area: "Park Town", category: "landmark", lat: 13.0826, lng: 80.2754 },
  { title: "Fort St. George", area: "George Town", category: "landmark", lat: 13.0796, lng: 80.2871 },
  { title: "Madras High Court Exterior", area: "George Town", category: "landmark", lat: 13.0865, lng: 80.2878 },
  { title: "Armenian Church", area: "George Town", category: "culture", lat: 13.0957, lng: 80.2868 },
  { title: "Burma Bazaar Lanes", area: "George Town", category: "market", lat: 13.0894, lng: 80.286 },
  { title: "George Town Heritage Walk", area: "George Town", category: "neighborhood", lat: 13.0922, lng: 80.2858 },
  { title: "Sowcarpet Market Streets", area: "Sowcarpet", category: "market", lat: 13.0947, lng: 80.2828 },
  { title: "Flower Bazaar Wholesale Area", area: "Parry's Corner", category: "market", lat: 13.0919, lng: 80.281 },
  { title: "Royapuram Fishing Harbor", area: "Royapuram", category: "waterfront", lat: 13.1132, lng: 80.2967 },
  { title: "Valluvar Kottam", area: "Nungambakkam", category: "landmark", lat: 13.054, lng: 80.2446 },
  { title: "Semmozhi Poonga", area: "Teynampet", category: "park", lat: 13.0457, lng: 80.2527 },
  { title: "Pondy Bazaar", area: "T Nagar", category: "market", lat: 13.0417, lng: 80.2335 },
  { title: "T Nagar Shopping District", area: "T Nagar", category: "neighborhood", lat: 13.0419, lng: 80.2331 },
  { title: "Panagal Park", area: "T Nagar", category: "park", lat: 13.0412, lng: 80.2345 },
  { title: "Kodambakkam Bridge View", area: "Kodambakkam", category: "landmark", lat: 13.0565, lng: 80.2305 },
  { title: "Vadapalani Murugan Temple", area: "Vadapalani", category: "temple", lat: 13.0517, lng: 80.2125 },
  { title: "Chetpet Eco Park", area: "Chetpet", category: "park", lat: 13.074, lng: 80.2442 },
  { title: "Anna Nagar Tower Park", area: "Anna Nagar", category: "park", lat: 13.0855, lng: 80.2109 },
  { title: "VR Chennai", area: "Anna Nagar West", category: "mall", lat: 13.0719, lng: 80.1947 },
  { title: "Koyambedu Market", area: "Koyambedu", category: "market", lat: 13.0694, lng: 80.1947 },
  { title: "Ranganathan Street", area: "T Nagar", category: "market", lat: 13.0404, lng: 80.232 },
  { title: "Birla Planetarium Chennai", area: "Kotturpuram", category: "museum", lat: 13.0108, lng: 80.2432 },
  { title: "Guindy National Park", area: "Guindy", category: "nature", lat: 13.0068, lng: 80.2368 },
  { title: "Raj Bhavan Perimeter View", area: "Guindy", category: "nature", lat: 13.0185, lng: 80.2286 },
  { title: "St Thomas Mount Summit", area: "St Thomas Mount", category: "landmark", lat: 13.0057, lng: 80.2036 },
  { title: "Little Mount Shrine", area: "Saidapet", category: "temple", lat: 13.0153, lng: 80.2206 },
  { title: "Chennai Rail Museum", area: "Villivakkam", category: "museum", lat: 13.1078, lng: 80.2264 },
  { title: "Phoenix Marketcity", area: "Velachery", category: "mall", lat: 12.9913, lng: 80.2184 },
  { title: "Pallikaranai Marshland Viewpoint", area: "Pallikaranai", category: "nature", lat: 12.9492, lng: 80.2164 },
  { title: "Muttukadu Boat House", area: "ECR", category: "waterfront", lat: 12.8276, lng: 80.2416 },
  { title: "DakshinaChitra Museum", area: "ECR", category: "museum", lat: 12.8244, lng: 80.2482 },
  { title: "VGP Snow Kingdom", area: "Injambakkam", category: "landmark", lat: 12.9844, lng: 80.2495 },
  { title: "Kovalam Beach", area: "ECR", category: "beach", lat: 12.7873, lng: 80.2521 },
  { title: "Mahabalipuram Shore Temple", area: "Mahabalipuram", category: "landmark", lat: 12.6208, lng: 80.1932 },
  { title: "Mamallapuram Sculpture Streets", area: "Mahabalipuram", category: "market", lat: 12.6179, lng: 80.1924 },
  { title: "Cholamandal Artists Village", area: "Injambakkam", category: "culture", lat: 12.9218, lng: 80.254 },
  { title: "MGR Film City Roadside", area: "Taramani", category: "landmark", lat: 13.0083, lng: 80.2385 },
  { title: "Adyar Eco Park Riverside", area: "Adyar", category: "nature", lat: 13.0099, lng: 80.2571 },
  { title: "Broken Bridge Viewpoint", area: "Adyar", category: "waterfront", lat: 13.0126, lng: 80.2675 }
];

const LONDON_CURATED_PLACES = [
  { title: "The Regent's Park Mosque", area: "Regent's Park", category: "temple", lat: 51.5237, lng: -0.1586 },
  { title: "East London Mosque", area: "Whitechapel", category: "temple", lat: 51.5175, lng: -0.0634 },
  { title: "Westminster Abbey", area: "Westminster", category: "landmark", lat: 51.4993, lng: -0.1273 },
  { title: "St Paul's Cathedral", area: "City of London", category: "landmark", lat: 51.5138, lng: -0.0984 },
  { title: "Tower Bridge Riverside", area: "Southwark", category: "waterfront", lat: 51.5055, lng: -0.0754 },
  { title: "South Bank Promenade", area: "South Bank", category: "waterfront", lat: 51.5079, lng: -0.1169 },
  { title: "Borough Market", area: "Southwark", category: "market", lat: 51.5055, lng: -0.0910 },
  { title: "Leadenhall Market", area: "City of London", category: "market", lat: 51.5128, lng: -0.0838 },
  { title: "The British Museum", area: "Bloomsbury", category: "museum", lat: 51.5194, lng: -0.1269 },
  { title: "Victoria and Albert Museum", area: "South Kensington", category: "museum", lat: 51.4966, lng: -0.1722 },
  { title: "Kensington Gardens", area: "Kensington", category: "park", lat: 51.5066, lng: -0.1795 },
  { title: "Hyde Park Serpentine", area: "Hyde Park", category: "park", lat: 51.5050, lng: -0.1657 },
  { title: "Covent Garden Piazza", area: "Covent Garden", category: "neighborhood", lat: 51.5117, lng: -0.1230 },
  { title: "Notting Hill Streets", area: "Notting Hill", category: "neighborhood", lat: 51.5099, lng: -0.1974 },
  { title: "Dishoom Covent Garden", area: "Covent Garden", category: "food", lat: 51.5129, lng: -0.1269 },
  { title: "The Great Chase", area: "Clerkenwell", category: "food", lat: 51.5231, lng: -0.1095 },
  { title: "Harrods", area: "Knightsbridge", category: "mall", lat: 51.4994, lng: -0.1632 },
  { title: "Liberty London", area: "Soho", category: "mall", lat: 51.5138, lng: -0.1419 }
];

const PARIS_CURATED_PLACES = [
  { title: "Grande Mosquee de Paris", area: "Latin Quarter", category: "temple", lat: 48.8423, lng: 2.3553 },
  { title: "Paris Grand Mosque Courtyard", area: "5th Arrondissement", category: "temple", lat: 48.8419, lng: 2.3557 },
  { title: "Louvre Museum", area: "1st Arrondissement", category: "museum", lat: 48.8606, lng: 2.3376 },
  { title: "Musee d'Orsay", area: "7th Arrondissement", category: "museum", lat: 48.8600, lng: 2.3266 },
  { title: "Sainte-Chapelle", area: "Ile de la Cite", category: "landmark", lat: 48.8554, lng: 2.3450 },
  { title: "Pont Alexandre III", area: "7th Arrondissement", category: "waterfront", lat: 48.8638, lng: 2.3130 },
  { title: "Seine Riverside Walk", area: "Central Paris", category: "waterfront", lat: 48.8570, lng: 2.3410 },
  { title: "Tuileries Garden", area: "1st Arrondissement", category: "park", lat: 48.8635, lng: 2.3270 },
  { title: "Luxembourg Gardens", area: "6th Arrondissement", category: "park", lat: 48.8462, lng: 2.3372 },
  { title: "Le Marais Lanes", area: "Le Marais", category: "neighborhood", lat: 48.8578, lng: 2.3622 },
  { title: "Montmartre Streets", area: "18th Arrondissement", category: "neighborhood", lat: 48.8867, lng: 2.3431 },
  { title: "Galeries Lafayette", area: "Opera", category: "mall", lat: 48.8720, lng: 2.3320 },
  { title: "Printemps Haussmann", area: "Opera", category: "mall", lat: 48.8724, lng: 2.3295 },
  { title: "Marché des Enfants Rouges", area: "Le Marais", category: "market", lat: 48.8631, lng: 2.3626 },
  { title: "Rue Cler Food Street", area: "7th Arrondissement", category: "market", lat: 48.8559, lng: 2.3048 },
  { title: "Le Confidentiel", area: "1st Arrondissement", category: "food", lat: 48.8618, lng: 2.3402 },
  { title: "Mian Bar", area: "10th Arrondissement", category: "food", lat: 48.8721, lng: 2.3586 }
];

function logDebug(msg) {
  try {
    const timestamp = new Date().toISOString();
    appendFileSync(DEBUG_LOG_PATH, `[${timestamp}] ${msg}\n`);
  } catch (_) { }
}

function normalizeToken(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function formatDisplayName(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function keywordTokens(text) {
  return normalizeToken(text).split(" ").filter((w) => w.length >= 4);
}

function detectCuratedCityKey(destination) {
  const d = String(destination || "").toLowerCase();
  if (d.includes("chennai") || d.includes("madras")) return "chennai";
  if (d.includes("london")) return "london";
  if (d.includes("paris")) return "paris";
  return null;
}

function buildCuratedPlaceDescription(place, destinationLabel) {
  const title = place.title;
  const area = place.area;
  const byCategory = {
    beach: `${title} is a popular coastal stop in ${area}, ${destinationLabel}, suited for sunrise and evening walks.`,
    temple: `${title} is a significant spiritual landmark in ${area}, ${destinationLabel}, known for local heritage and architecture.`,
    museum: `${title} is a well-known museum and culture stop in ${area}, ${destinationLabel}, with strong educational value.`,
    park: `${title} is a green urban break in ${area}, ${destinationLabel}, ideal for relaxed walks and local leisure time.`,
    market: `${title} is a lively market zone in ${area}, ${destinationLabel}, suitable for street exploration and local shopping.`,
    waterfront: `${title} offers a strong waterfront atmosphere in ${area}, ${destinationLabel}, with practical nearby routes.`,
    culture: `${title} is a culture-focused stop in ${area}, ${destinationLabel}, useful for heritage-oriented exploration.`,
    mall: `${title} is a major commercial hub in ${area}, ${destinationLabel}, with dining and shopping options.`,
    nature: `${title} is a nature-oriented stop in ${area}, ${destinationLabel}, suitable for slower-paced outdoor visits.`,
    landmark: `${title} is a major city landmark in ${area}, ${destinationLabel}, often used as a key anchor point for sightseeing.`,
    neighborhood: `${title} highlights local neighborhood character in ${area}, ${destinationLabel}, with practical nearby routing.`
  };
  return byCategory[place.category] || `${title} is a notable local stop in ${area}, ${destinationLabel}.`;
}

function getCuratedCityCenter(destination) {
  const key = detectCuratedCityKey(destination);
  if (!key) return null;
  return CURATED_CITY_CENTERS[key] || null;
}

function getCuratedCityPlaces(destination) {
  const key = detectCuratedCityKey(destination);
  if (!key) return [];
  const destinationLabel = formatDisplayName(destination) || destination;
  if (key === "chennai") {
    return CHENNAI_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "london") {
    return LONDON_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "paris") {
    return PARIS_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  return [];
}

function chooseVariant(values, seed) {
  if (!Array.isArray(values) || values.length === 0) return "";
  const index = Math.abs(seed) % values.length;
  return values[index];
}

function rotateUnique(values, offset, count) {
  const safe = uniqueBy((Array.isArray(values) ? values : []).filter(Boolean), (v) => String(v).toLowerCase());
  if (safe.length === 0) return [];
  const normalizedOffset = Math.abs(offset) % safe.length;
  const rotated = safe.slice(normalizedOffset).concat(safe.slice(0, normalizedOffset));
  return rotated.slice(0, Math.min(count, rotated.length));
}

function uniqueBy(arr, keyFn) {
  const seen = new Set();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = EXTERNAL_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function seededOffset(index) {
  const value = Math.sin(index * 9973) * 1e4;
  return (value - Math.floor(value) - 0.5) * 0.18;
}

function imageUrlPassesCrossLocationCheck(imageUrl, destination) {
  const destNorm = normalizeToken(destination);
  const urlNorm = normalizeToken(decodeURIComponent(imageUrl || ""));
  for (const city of CROSS_LOCATION_CITIES) {
    if (city !== destNorm && !destNorm.includes(city) && urlNorm.includes(city)) return false;
  }
  return true;
}

async function fetchCommonsImages(query, destination, placeTitle, limit = 8) {
  const cacheKey = `${normalizeToken(query)}::${normalizeToken(destination)}::${normalizeToken(placeTitle)}::${limit}`;
  if (commonsImageCache.has(cacheKey)) return commonsImageCache.get(cacheKey);
  try {
    const strictQuery = `${placeTitle} ${destination}`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(strictQuery)}&gsrlimit=${Math.min(limit * 3, 30)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&format=json&origin=*`;
    const resp = await fetchWithTimeout(url, {}, 2500);
    if (!resp.ok) { commonsImageCache.set(cacheKey, []); return []; }
    const data = await resp.json();
    const pages = Object.values(data?.query?.pages || {});
    const placeTokensArr = keywordTokens(placeTitle);
    const destTokensArr = keywordTokens(destination);
    const normalized = pages.map((page) => {
      const title = String(page?.title || "");
      const image = page?.imageinfo?.[0];
      const imageUrl = image?.thumburl || image?.url || "";
      const description = String(image?.extmetadata?.ImageDescription?.value || "").toLowerCase();
      const categories = String(image?.extmetadata?.Categories?.value || "").toLowerCase();
      return { title, imageUrl, description, categories };
    }).filter((item) =>
      item.imageUrl.startsWith("http") &&
      /\.(jpg|jpeg|png|webp)(\?|$)/i.test(item.imageUrl) &&
      !GENERIC_IMAGE_PATTERN.test(item.imageUrl) &&
      !GENERIC_IMAGE_PATTERN.test(item.title) &&
      imageUrlPassesCrossLocationCheck(item.imageUrl, destination)
    );
    const strict = normalized.filter((item) => {
      const meta = `${normalizeToken(item.title)} ${item.description} ${item.categories}`;
      const hasPlace = placeTokensArr.length === 0 || placeTokensArr.some((t) => meta.includes(t));
      const hasDest = destTokensArr.length === 0 || destTokensArr.some((t) => meta.includes(t));
      return hasPlace && hasDest;
    }).map((i) => i.imageUrl);
    const relaxed = normalized.filter((item) => {
      const meta = `${normalizeToken(item.title)} ${item.description} ${item.categories}`;
      return destTokensArr.length === 0 || destTokensArr.some((t) => meta.includes(t));
    }).map((i) => i.imageUrl);
    const urls = strict.length > 0 ? strict : relaxed;
    const uniqueUrls = [...new Set(urls)].slice(0, limit);
    commonsImageCache.set(cacheKey, uniqueUrls);
    return uniqueUrls;
  } catch (_error) {
    commonsImageCache.set(cacheKey, []);
    return [];
  }
}

async function fetchWikipediaSummaryImage(title) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const resp = await fetchWithTimeout(url, {}, 2500);
    if (resp.status === 404) return null;
    const data = await resp.json();
    const imageUrl = data?.originalimage?.source || data?.thumbnail?.source || null;
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return null;
    if (imageUrl && (GENERIC_IMAGE_PATTERN.test(imageUrl) || GENERIC_IMAGE_PATTERN.test(data.title))) return null;
    return imageUrl;
  } catch (_error) {
    return null;
  }
}

async function buildVerifiedImageSet(destination, placeTitle, fallbackImageUrl) {
  const [q1, q2, q3] = await Promise.all([
    fetchCommonsImages(`${placeTitle} ${destination} landmark`, destination, placeTitle, 10),
    fetchCommonsImages(`${placeTitle} tourist attraction`, destination, placeTitle, 8),
    fetchCommonsImages(`${placeTitle} architecture heritage`, destination, placeTitle, 8)
  ]);
  let merged = uniqueBy(
    [fallbackImageUrl, ...q1, ...q2, ...q3].filter(Boolean),
    (url) => String(url).toLowerCase()
  );
  if (merged.length === 0) {
    const summaryImage = await fetchWikipediaSummaryImage(placeTitle);
    if (summaryImage) merged = [summaryImage];
  }
  if (merged.length === 0) {
    const destinationImage = await fetchWikipediaSummaryImage(destination);
    if (destinationImage) merged = [destinationImage];
  }
  return merged.slice(0, 8);
}

async function fetchWikipediaBulkThumbnails(titles) {
  const results = new Map();
  if (!Array.isArray(titles) || titles.length === 0) return results;
  const chunks = [];
  for (let i = 0; i < titles.length; i += 50) chunks.push(titles.slice(i, i + 50));
  await Promise.all(chunks.map(async (chunk) => {
    try {
      const titleParam = chunk.join('|');
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titleParam)}&prop=pageimages&pithumbsize=1200&format=json&origin=*`;
      const resp = await fetchWithTimeout(url, {}, 4000);
      if (!resp.ok) return;
      const data = await resp.json();
      for (const page of Object.values(data?.query?.pages || {})) {
        const thumb = page?.thumbnail?.source || null;
        if (thumb && page.title) results.set(normalizeToken(page.title), thumb);
      }
    } catch (_) { }
  }));
  return results;
}

function createStaticMapImageUrl(lat, lng, zoom = 14, label = "Location Preview") {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null;
  const palette = [
    ["#0F766E", "#0EA5E9"],
    ["#0369A1", "#2563EB"],
    ["#166534", "#059669"],
    ["#7C2D12", "#EA580C"]
  ];
  const seed = Math.abs(Math.round(nLat * 1e3) + Math.round(nLng * 1e3) + zoom);
  const [start, end] = palette[seed % palette.length];
  const safeLabel = String(label || "Location Preview").replace(/[<>&]/g, "").slice(0, 46);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='${start}'/>
      <stop offset='100%' stop-color='${end}'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='700' fill='url(#bg)'/>
  <g stroke='rgba(255,255,255,0.16)' stroke-width='1'>
    <path d='M0 140 H1200'/><path d='M0 280 H1200'/><path d='M0 420 H1200'/><path d='M0 560 H1200'/>
    <path d='M200 0 V700'/><path d='M400 0 V700'/><path d='M600 0 V700'/><path d='M800 0 V700'/><path d='M1000 0 V700'/>
  </g>
  <g transform='translate(600,320)'>
    <path d='M0 -78 C42 -78 76 -44 76 -2 C76 42 43 72 0 124 C-43 72 -76 42 -76 -2 C-76 -44 -42 -78 0 -78 Z' fill='white' fill-opacity='0.94'/>
    <circle cx='0' cy='-8' r='24' fill='${end}'/>
  </g>
  <text x='72' y='610' fill='white' font-size='40' font-family='Segoe UI, Arial, sans-serif' font-weight='700'>${safeLabel}</text>
  <text x='72' y='652' fill='rgba(255,255,255,0.94)' font-size='24' font-family='Segoe UI, Arial, sans-serif'>Lat ${nLat.toFixed(4)} | Lng ${nLng.toFixed(4)} | Zoom ${zoom}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function createStaticMapAlternatives(lat, lng) {
  return [
    createStaticMapImageUrl(lat, lng, 14, "Overview"),
    createStaticMapImageUrl(lat, lng, 16, "Zoomed In")
  ];
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizePlaceDescription(text, destination) {
  const destinationLabel = formatDisplayName(destination) || destination;
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return `Well-reviewed place to explore in ${destinationLabel}.`;
  const clipped = cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

function buildDailyInsights(destination, travelStyle, interests, day = 1, slotIndex = 0, placeTitle = "", totalDays = 1) {
  const destinationLabel = formatDisplayName(destination) || destination;
  const interestText = interests.length ? interests.join(", ") : "general sightseeing";
  const placeLabel = formatDisplayName(String(placeTitle || destinationLabel).trim()) || destinationLabel;
  const slotName = ["morning", "morning", "afternoon", "afternoon", "evening", "evening", "night", "night"][slotIndex] || "daytime";
  const styleProfile = getStyleProfile(travelStyle);
  const tripPhase = getTripPhase(day, totalDays);
  const daySeed = day * 17 + slotIndex * 31 + placeLabel.length;
  const districts = rotateUnique([
    "old quarter", "riverfront zone", "cultural belt", "central district",
    "garden-side neighborhood", "market streets", "arts district", "heritage lane",
    "local bazaar corridor"
  ], daySeed, 3);
  const routePatterns = travelStyle === "packed" ? [
    `Start ${placeLabel} early in the ${slotName} and keep transfers under 25 minutes.`,
    `Cluster ${placeLabel} with nearby stops in one loop to maintain a tight schedule.`,
    `Book timed entry first, then move to nearby streets before peak crowd windows.`,
    `Use direct transfers around ${placeLabel} to protect your same-day itinerary density.`
  ] : [
    `Keep a relaxed buffer around ${placeLabel} and avoid backtracking between neighborhoods.`,
    `Use one neighborhood loop around ${placeLabel} for the ${slotName} slot.`,
    `Pair ${placeLabel} with a nearby cafe or market stop to keep pacing comfortable.`,
    `Keep one flexible break after ${placeLabel} before moving to the next area.`
  ];
  const phaseLine = {
    arrival: `Use ${placeLabel} to set the tone for your first day in ${destinationLabel}.`,
    deep: `This part of the trip should make ${destinationLabel} feel more layered and less obvious.`,
    reset: `Keep the pacing easier here so the longer itinerary still has room to breathe.`,
    finale: `Let ${placeLabel} feel like part of a proper closing chapter for ${destinationLabel}.`,
    "finale-build": `Build gently toward the closing stretch instead of peaking too early.`,
  }[tripPhase] || "";
  return {
    nearbyHighlights: [`${placeLabel} surroundings`, `Walkable ${districts[0] || "city"} segment`, `${districts[1] || "viewpoint"} photo point`],
    travelSuggestion: `${chooseVariant(routePatterns, daySeed)} Day ${day} focus.`,
    localFood: `Focus on signature dishes in ${districts[0] || "nearby local areas"}. Preference focus: ${interestText}.`,
    transportationTip: "Shift transfers 20-30 minutes earlier to avoid peak traffic windows.",
    safetyTip: `Keep valuables secured around ${placeLabel} and avoid isolated stretches late evening.`,
    culturalInsight: `At ${placeLabel}, follow local etiquette and observe site-specific guidelines. ${styleProfile.note} ${phaseLine}`.trim()
  };
}

async function geocodeDestination(destination) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(destination)}&addressdetails=1`;
    const resp = await fetchWithTimeout(url, { headers: { "User-Agent": "AI-TP-Connection/1.0" } }, 2500);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const top = data[0];
    const centerLat = Number(top.lat);
    const centerLng = Number(top.lon);
    let box = Array.isArray(top.boundingbox) && top.boundingbox.length === 4 ? {
      south: Number(top.boundingbox[0]),
      north: Number(top.boundingbox[1]),
      west: Number(top.boundingbox[2]),
      east: Number(top.boundingbox[3])
    } : null;
    if (box) {
      const boxHeightKm = haversineKm(box.south, centerLng, box.north, centerLng);
      const boxWidthKm = haversineKm(centerLat, box.west, centerLat, box.east);
      const maxDimKm = Math.max(boxHeightKm, boxWidthKm);
      if (maxDimKm > 120) {
        const cap = 0.55; 
        box = { south: centerLat - cap, north: centerLat + cap, west: centerLng - cap, east: centerLng + cap };
      }
    }
    return { lat: centerLat, lng: centerLng, displayName: top.display_name || destination, boundingBox: box, isCityLevel: /(city|town|village|municipality|suburb|neighbourhood)/.test(String(top.type || top.class || "").toLowerCase()) };
  } catch (_) { return null; }
}

async function fetchWikiPlacesNear(destination, lat, lng, radiusM = 25000, limit = 80) {
  try {
    const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=${radiusM}&gslimit=${limit}&format=json&origin=*`;
    const geoResp = await fetchWithTimeout(geoUrl, {}, 2500);
    if (!geoResp.ok) return [];
    const geoData = await geoResp.json();
    const geoList = geoData?.query?.geosearch || [];
    if (!Array.isArray(geoList) || geoList.length === 0) return [];
    const pageIds = geoList.map((p) => p.pageid).slice(0, 80).join("|");
    const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=coordinates|pageimages|description|extracts&pageids=${pageIds}&exintro=1&explaintext=1&pithumbsize=1200&format=json&origin=*`;
    const detailsResp = await fetchWithTimeout(detailsUrl, {}, 2500);
    const details = detailsResp.ok ? await detailsResp.json() : {};
    const pagesObj = details?.query?.pages || {};
    const byId = new Map(Object.entries(pagesObj).map(([id, page]) => [Number(id), page]));
    const destTokens = destination ? keywordTokens(destination) : [];
    return geoList.map((geo) => {
      const detail = byId.get(Number(geo.pageid)) || {};
      return { title: geo.title || detail.title || "Local attraction", description: detail.extract || detail.description || `Popular place near ${geo.title || "city center"}.`, lat: Number(geo.lat), lng: Number(geo.lon), imageUrl: detail?.thumbnail?.source || null };
    }).filter((p) => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
      if (haversineKm(lat, lng, p.lat, p.lng) > 60) return false;
      if (destTokens.length > 0 && p.title && p.description) {
        const textBody = normalizeToken(`${p.title} ${p.description}`);
        if (!destTokens.some((t) => textBody.includes(t))) return false;
      }
      return true;
    });
  } catch (_) { return []; }
}

function activitySummaryByInterest(interests, seed = 0) {
  if (interests.includes("Food & Culinary")) return chooseVariant(["Focused on regional specialties.", "Built around authentic local cuisine.", "Combines culinary highlights."], seed);
  return chooseVariant(["Balanced city highlights.", "Designed for broad city coverage.", "Combines key local highlights."], seed);
}

function resolveStyleProfileKey(travelStyle = "") {
  const normalized = normalizeToken(travelStyle).replace(/\s+/g, "");
  if (!normalized) return "balanced";
  const match = Object.entries(STYLE_CITY_PROFILES).find(([, profile]) =>
    (profile.aliases || []).some((alias) => normalizeToken(alias).replace(/\s+/g, "") === normalized)
  );
  return match?.[0] || "balanced";
}

function getStyleProfile(travelStyle = "") {
  return STYLE_CITY_PROFILES[resolveStyleProfileKey(travelStyle)] || STYLE_CITY_PROFILES.balanced;
}

function getTripPhase(day = 1, totalDays = 1) {
  const safeDay = Math.max(1, Number(day) || 1);
  const safeTotal = Math.max(1, Number(totalDays) || 1);
  if (safeDay === 1) return "arrival";
  if (safeDay === safeTotal) return "finale";
  if (safeTotal <= 4) return safeDay === 2 ? "core" : "deep";
  const progress = safeDay / safeTotal;
  if (progress <= 0.28) return "core";
  if (progress <= 0.6) return "deep";
  if (progress <= 0.82) return "reset";
  return "finale-build";
}

function buildStyleDayTheme(travelStyle = "", day = 1, totalDays = 1) {
  const profile = getStyleProfile(travelStyle);
  const themes = Array.isArray(profile.dayThemes) && profile.dayThemes.length ? profile.dayThemes : CITY_ITINERARY_DAY_THEMES;
  const base = themes[(Math.max(1, day) - 1) % themes.length] || `Day ${day}`;
  const phase = getTripPhase(day, totalDays);
  const suffix = {
    reset: " - Slower Chapter",
    "finale-build": " - Closing Build",
    finale: " - Grand Finish",
  }[phase] || "";
  return `${base}${suffix}`;
}

function inferPlaceKind(place = {}) {
  const category = normalizeToken(place.category || "");
  const title = normalizeToken(place.title || "");
  const description = normalizeToken(place.description || "");
  const source = `${category} ${title} ${description}`;
  if (/temple|mosque|church|shrine|monastery|cathedral|basilica|sacred/.test(source)) return "temple";
  if (/museum|gallery|archive|heritage|culture/.test(source)) return "museum";
  if (/beach|coast|shore|promenade/.test(source)) return "beach";
  if (/waterfront|harbour|harbor|river|lake|marina|boat/.test(source)) return "waterfront";
  if (/park|garden|forest|nature|trail|hill|marsh|peak|valley/.test(source)) return "park";
  if (/market|bazaar|souk|shopping|mall/.test(source)) return "market";
  if (/neighborhood|neighbourhood|street|district|quarter/.test(source)) return "neighborhood";
  if (/landmark|fort|palace|tower|lighthouse|summit|view/.test(source)) return "landmark";
  return category || "generic";
}

function scorePlaceForStyle(place, travelStyle, slotName, day, totalDays) {
  const profile = getStyleProfile(travelStyle);
  const desired = profile.slotCategories?.[slotName] || profile.slotCategories?.morning || [];
  const kind = inferPlaceKind(place);
  let score = 0;
  if (desired.includes(kind)) score += 8;
  if (kind === "waterfront" && /coastal|cinematic|luxury/.test(resolveStyleProfileKey(travelStyle))) score += 4;
  if (kind === "temple" && /cultural|halal|wellness/.test(resolveStyleProfileKey(travelStyle))) score += 4;
  if (kind === "market" && /urban|halal|cultural/.test(resolveStyleProfileKey(travelStyle))) score += 3;
  if (kind === "park" && /wellness|adventure|cinematic|coastal/.test(resolveStyleProfileKey(travelStyle))) score += 3;
  if (kind === "museum" && /cultural|urban|luxury/.test(resolveStyleProfileKey(travelStyle))) score += 3;
  const phase = getTripPhase(day, totalDays);
  if (phase === "arrival" && /landmark|waterfront|park/.test(kind)) score += 2;
  if (phase === "reset" && /park|waterfront|beach|culture/.test(kind)) score += 2;
  if (phase === "finale" && /waterfront|landmark|culture|beach/.test(kind)) score += 2;
  score += (place.title || "").length % 3;
  return score;
}

const SLOT_TIME_LABELS = [
  "Morning",
  "Morning Activity",
  "Afternoon",
  "Afternoon Activity",
  "Evening",
  "Evening Activity",
  "Night",
  "Night Activity",
];

const SLOT_ACTIVITY_FOCUS = [
  "Begin the day with a scenic orientation and easy local discovery.",
  "Dive deeper with a guided route or hands-on cultural stop.",
  "Use the midday window for signature food, museum, or landmark coverage.",
  "Keep momentum with a second focused stop in the same district.",
  "Slow into golden-hour viewpoints and calmer public spaces.",
  "Shift toward local atmosphere, dining, and social energy.",
  "Use the night window for mood, lights, and premium evening pacing.",
  "Close the day with a relaxed final stop or stay experience.",
];

function makePlaceActivity(place, destination, budget, slotIndex, travelStyle, interests, day = 1, totalDays = 1, dayTheme = "") {
  const destinationLabel = formatDisplayName(destination) || destination;
  const concise = normalizePlaceDescription(place.description, destination);
  const insights = buildDailyInsights(destination, travelStyle, interests, day, slotIndex, place.title, totalDays);
  const revisitCount = Number(place.revisitCount || 1);
  const title = revisitCount > 1 ? `${place.title} (Visit ${revisitCount})` : place.title;
  const styleProfile = getStyleProfile(travelStyle);
  const phase = getTripPhase(day, totalDays);
  const styleKey = resolveStyleProfileKey(travelStyle);
  const styleClose = {
    luxury: "Favor atmosphere, comfort, and one standout premium moment.",
    cultural: "Let the strongest story or heritage layer guide the stop.",
    adventure: "Keep the momentum active without losing later-day recovery.",
    cinematic: "Give the best light or most rewarding frame enough time to matter.",
    urban: "Let one district reveal several layers instead of over-transferring.",
    wellness: "Protect spaciousness so the experience feels restorative, not packed.",
    halal: "Keep the route comfortable and easy to navigate around practical needs.",
    coastal: "Let the waterfront rhythm shape the pace instead of forcing it inland.",
    balanced: "Balance atmosphere, local texture, and a clear highlight.",
  }[styleKey] || "Balance atmosphere, local texture, and a clear highlight.";
  return {
    time: SLOT_TIME_LABELS[slotIndex] || "Anytime",
    title,
    description: `${concise}${concise.endsWith(".") ? "" : "."} ${SLOT_ACTIVITY_FOCUS[slotIndex] || "Enjoy a well-paced city moment."} ${activitySummaryByInterest(interests, day * 13 + slotIndex * 7 + title.length)} Day ${day} focus within the ${dayTheme || buildStyleDayTheme(travelStyle, day, totalDays)} chapter. ${styleClose}`,
    location: `${place.title}, ${destinationLabel}`,
    lat: place.lat,
    lng: place.lng,
    imageUrl: place.imageUrl || null,
    imageAlternatives: Array.isArray(place.imageAlternatives) ? place.imageAlternatives : [],
    cost: normalizeCost(budget, slotIndex + 1),
    tips: travelStyle === "packed" ? "Start early and pre-book timed entries." : `${styleProfile.note} Keep a 30-45 minute buffer.`,
    nearbyHighlights: insights.nearbyHighlights,
    travelSuggestion: insights.travelSuggestion,
    localFood: insights.localFood,
    transportationTip: insights.transportationTip || "Use verified transport.",
    safetyTip: insights.safetyTip || "Keep valuables secure.",
    culturalInsight: insights.culturalInsight || "Follow local etiquette."
  };
}

function normalizeCost(budget, idx) {
  if (budget === "luxury") return `$${120 + idx * 30}-${220 + idx * 40}`;
  if (budget === "moderate") return `$${40 + idx * 15}-${90 + idx * 20}`;
  return `$${10 + idx * 8}-${35 + idx * 10}`;
}

function isInsideBoundingBox(place, boundingBox) {
  if (!boundingBox) return true;
  return place.lat >= boundingBox.south && place.lat <= boundingBox.north && place.lng >= boundingBox.west && place.lng <= boundingBox.east;
}

function makeSyntheticPlace(destination, day, slot, fallbackBase) {
  const destinationLabel = formatDisplayName(destination) || destination;
  const slotName = [
    "Sunrise Orientation",
    "Heritage Walk",
    "Local Lunch Discovery",
    "Museum Or Craft Session",
    "Golden Hour Viewpoint",
    "Neighborhood Food Trail",
    "Night Lights Route",
    "Stay Wind-Down",
  ][slot] || "City Exploration";
  return {
    title: `${destinationLabel} Route ${day} - ${slotName}`,
    description: `A curated ${slotName.toLowerCase()} in ${destinationLabel}.`,
    lat: Number((fallbackBase.lat + seededOffset(day * 31 + slot * 7)).toFixed(6)),
    lng: Number((fallbackBase.lng + seededOffset(day * 37 + slot * 11)).toFixed(6)),
    imageUrl: null,
    synthetic: true
  };
}

function pickPlaceForSlot(candidates, usedKeys, travelStyle, slotName, day, totalDays, slotIndex = 0) {
  const ranked = [...(Array.isArray(candidates) ? candidates : [])]
    .sort((a, b) => {
      const scoreDiff = scorePlaceForStyle(b, travelStyle, slotName, day, totalDays) - scorePlaceForStyle(a, travelStyle, slotName, day, totalDays);
      if (scoreDiff !== 0) return scoreDiff;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });

  for (const candidate of ranked) {
    const key = normalizeToken(candidate.title);
    const usage = usedKeys.get(key) || 0;
    if (usage === 0 || (slotIndex >= 6 && usage < 2)) {
      usedKeys.set(key, usage + 1);
      return candidate;
    }
  }

  const fallback = ranked[slotIndex % Math.max(1, ranked.length)] || null;
  if (fallback) {
    const key = normalizeToken(fallback.title);
    usedKeys.set(key, (usedKeys.get(key) || 0) + 1);
  }
  return fallback;
}

const CITY_ITINERARY_DAY_THEMES = [
  "Historic Core",
  "Markets & Culture",
  "Green & Scenic",
  "Modern Local Flow",
  "Food & Evening Atmosphere",
  "Neighborhood Discovery",
];

const STYLE_CITY_PROFILES = {
  luxury: {
    aliases: ["luxury", "premium"],
    dayThemes: [
      "Arrival & Signature Comfort",
      "Private Heritage Flow",
      "Design, Dining & Refined Districts",
      "Scenic Leisure Chapter",
      "Boutique Culture & Shopping",
      "Soft Luxury & Local Details",
      "Waterfront Aperitif Rhythm",
      "Grand Finale & Night Ambience",
    ],
    slotCategories: {
      morning: ["landmark", "culture", "park", "beach"],
      afternoon: ["museum", "culture", "mall", "market"],
      evening: ["waterfront", "beach", "park", "landmark"],
      night: ["mall", "culture", "waterfront", "landmark"],
    },
    note: "Prioritize comfort, premium atmosphere, and one strong signature highlight over volume.",
  },
  cultural: {
    aliases: ["cultural", "history", "heritage"],
    dayThemes: [
      "Arrival & Historic Orientation",
      "Sacred Heritage Trail",
      "Museums & Story Layers",
      "Old Quarter Deep Dive",
      "Markets, Craft & Living Culture",
      "Traditions & Archive Moments",
      "Architecture & Quiet Details",
      "Farewell Through Heritage Streets",
    ],
    slotCategories: {
      morning: ["temple", "landmark", "culture", "museum"],
      afternoon: ["museum", "culture", "market", "neighborhood"],
      evening: ["landmark", "waterfront", "neighborhood", "culture"],
      night: ["culture", "landmark", "neighborhood", "market"],
    },
    note: "Use each day to deepen the destination's story instead of flattening it into generic sightseeing.",
  },
  adventure: {
    aliases: ["adventure", "active"],
    dayThemes: [
      "Arrival & Outdoor Orientation",
      "Active Morning Push",
      "Trail, Ridge & Scenic Movement",
      "Local Action & Recovery Balance",
      "Open-Air Discovery Day",
      "Challenge & Reward Circuit",
      "Waterfront or Peak Reset",
      "Finale Adventure Highlights",
    ],
    slotCategories: {
      morning: ["nature", "park", "waterfront", "landmark"],
      afternoon: ["nature", "park", "market", "neighborhood"],
      evening: ["waterfront", "park", "landmark", "beach"],
      night: ["neighborhood", "market", "culture", "waterfront"],
    },
    note: "Front-load movement and outdoor reward while protecting recovery later in the day.",
  },
  cinematic: {
    aliases: ["cinematic", "scenery", "photography"],
    dayThemes: [
      "Arrival & First Frames",
      "Panoramic Mornings",
      "Texture, Streets & Atmosphere",
      "Scenic Layers & Quiet Vistas",
      "Blue Hour Highlights",
      "Architecture & Light Study",
      "Golden-Hour Finale Build",
      "Farewell Through Best Views",
    ],
    slotCategories: {
      morning: ["beach", "park", "landmark", "nature"],
      afternoon: ["culture", "museum", "neighborhood", "market"],
      evening: ["waterfront", "beach", "landmark", "park"],
      night: ["landmark", "waterfront", "culture", "market"],
    },
    note: "Let light, scenery, and atmosphere decide the strongest moments of the day.",
  },
  urban: {
    aliases: ["urban", "city"],
    dayThemes: [
      "Arrival & City Pulse",
      "Boulevards & District Flow",
      "Markets, Cafes & Design",
      "Modern City Contrasts",
      "Street Culture & Food Energy",
      "Shopping, Skyline & Local Motion",
      "After-Dark Lifestyle Circuit",
      "Final City Highlights",
    ],
    slotCategories: {
      morning: ["landmark", "neighborhood", "park", "culture"],
      afternoon: ["market", "mall", "culture", "museum"],
      evening: ["waterfront", "landmark", "neighborhood", "market"],
      night: ["market", "mall", "neighborhood", "culture"],
    },
    note: "Favor walkable districts, modern local life, and layered city energy.",
  },
  wellness: {
    aliases: ["wellness", "relaxation"],
    dayThemes: [
      "Arrival & Nervous-System Reset",
      "Mindful Morning Flow",
      "Nature, Calm & Gentle Motion",
      "Spa, Tea & Quiet Corners",
      "Sacred Pause & Reflection",
      "Slow Coastal or Garden Day",
      "Deep Rest & Nourishing Meals",
      "Farewell Through Soft Rituals",
    ],
    slotCategories: {
      morning: ["park", "nature", "temple", "beach"],
      afternoon: ["park", "culture", "museum", "waterfront"],
      evening: ["waterfront", "beach", "park", "culture"],
      night: ["culture", "waterfront", "park", "neighborhood"],
    },
    note: "Protect calm, recovery, and low-friction pacing instead of maximizing stop count.",
  },
  halal: {
    aliases: ["halal", "halalfriendly"],
    dayThemes: [
      "Arrival & Prayer-Aware Orientation",
      "Mosques, Heritage & Halal Dining",
      "Family-Friendly City Flow",
      "Markets, Modest Comfort & Local Culture",
      "Sacred Architecture & Quiet Stops",
      "Halal Food Trail & Community Pacing",
      "Scenic Calm With Easy Access",
      "Farewell With Comfort & Reflection",
    ],
    slotCategories: {
      morning: ["temple", "culture", "landmark", "park"],
      afternoon: ["market", "culture", "museum", "waterfront"],
      evening: ["waterfront", "park", "neighborhood", "culture"],
      night: ["market", "culture", "neighborhood", "waterfront"],
    },
    note: "Keep the routing comfortable, respectful, and easy to navigate around practical needs.",
  },
  coastal: {
    aliases: ["coastal", "beach"],
    dayThemes: [
      "Arrival & Sea-Breeze Orientation",
      "Promenade & Beach Rhythm",
      "Harbourfront, Boats & Open Water",
      "Seafood, Sand & Slow Afternoons",
      "Clifftop or Island Views",
      "Coastal Culture & Boardwalk Life",
      "Golden-Hour Waterfront Finale",
      "Farewell Through the Shoreline",
    ],
    slotCategories: {
      morning: ["beach", "waterfront", "park", "nature"],
      afternoon: ["waterfront", "market", "culture", "park"],
      evening: ["beach", "waterfront", "landmark", "park"],
      night: ["waterfront", "market", "culture", "neighborhood"],
    },
    note: "Let the waterfront, promenade, and open-air rhythm shape the trip.",
  },
  balanced: {
    aliases: ["balanced"],
    dayThemes: CITY_ITINERARY_DAY_THEMES,
    slotCategories: {
      morning: ["landmark", "park", "temple", "beach"],
      afternoon: ["museum", "market", "culture", "neighborhood"],
      evening: ["waterfront", "landmark", "park", "beach"],
      night: ["market", "culture", "neighborhood", "waterfront"],
    },
    note: "Balance culture, scenery, food, and local atmosphere throughout the trip.",
  },
};

export async function createCityItinerary(destination, days, budget, travelStyle, interests) {
  try {
    const curatedCenter = getCuratedCityCenter(destination);
    const curatedPlaces = getCuratedCityPlaces(destination);
    const usingCurated = Array.isArray(curatedPlaces) && curatedPlaces.length > 0;
    const geo = usingCurated ? curatedCenter : await geocodeDestination(destination);
    const searchRadiusM = geo?.isCityLevel === false ? 40000 : 25000;
    let places = usingCurated ? curatedPlaces : geo ? await fetchWikiPlacesNear(destination, geo.lat, geo.lng, searchRadiusM, 80) : [];
    
    if (geo && !usingCurated) {
      if (geo.boundingBox) places = places.filter((p) => isInsideBoundingBox(p, geo.boundingBox));
      places = places.filter((p) => haversineKm(geo.lat, geo.lng, p.lat, p.lng) <= 60);
    }

    places = uniqueBy(places, (p) => normalizeToken(p.title));
    if (places.length < 3) return null;

    const fallbackBase = geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 };
    const placeImageCache = new Map();
    const placeUsage = new Map();
    let placeCursor = 0;

    if (usingCurated) {
      const wikiThumbs = await fetchWikipediaBulkThumbnails(places.map((p) => p.title));
      for (const p of places) {
        const key = normalizeToken(p.title);
        placeImageCache.set(key, [wikiThumbs.get(key), createStaticMapImageUrl(p.lat, p.lng, 15, p.title)].filter(Boolean));
      }
    } else {
      for (const p of places) {
        if (p.imageUrl) placeImageCache.set(normalizeToken(p.title), [p.imageUrl, createStaticMapImageUrl(p.lat, p.lng, 15, p.title)].filter(Boolean));
      }
    }

    const dayPlans = [];
    const styleProfile = getStyleProfile(travelStyle);
    const slotNames = ["morning", "morning", "afternoon", "afternoon", "evening", "evening", "night", "night"];
    for (let day = 1; day <= days; day++) {
      const activities = [];
      const dayTheme = buildStyleDayTheme(travelStyle, day, days);
      const rotatedPlaces = rotateUnique(places, day * 7 + destination.length, Math.max(places.length, 8));
      const dayUsedKeys = new Map();
      for (let slot = 0; slot < 8; slot++) {
        const slotName = slotNames[slot] || "morning";
        const preferredPool = rotatedPlaces.filter((candidate) =>
          (styleProfile.slotCategories?.[slotName] || []).includes(inferPlaceKind(candidate))
        );
        const sourcePool = preferredPool.length ? preferredPool : rotatedPlaces;
        const place = pickPlaceForSlot(sourcePool, dayUsedKeys, travelStyle, slotName, day, days, slot) || makeSyntheticPlace(destination, day, slot, fallbackBase);
        const key = normalizeToken(place.title);
        placeUsage.set(key, (placeUsage.get(key) || 0) + 1);
        placeCursor++;
        
        const images = placeImageCache.get(key) || [createStaticMapImageUrl(place.lat, place.lng, 14, place.title)];
        activities.push(makePlaceActivity({
          ...place,
          title: formatDisplayName(place.title),
          description: `${normalizePlaceDescription(place.description, destination)} This stop supports the day's ${dayTheme.toLowerCase()} rhythm.`,
          imageUrl: images[0],
          imageAlternatives: images.slice(1)
        }, destination, budget, slot, travelStyle, interests, day, days, dayTheme));
      }
      dayPlans.push({ day, title: `Day ${day} in ${destination}`, theme: dayTheme, activities });
    }

    const total = (budget === "luxury" ? 340 : budget === "moderate" ? 180 : 95) * days;
    return {
      itinerary: dayPlans,
      costBreakdown: { total, currency: "USD", source: usingCurated ? "curated" : "verified" }
    };
  } catch (err) {
    logDebug(`ERROR in createCityItinerary: ${err.message}`);
    return null;
  }
}
