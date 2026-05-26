const GOOGLE_CACHE_TTL = 60 * 60 * 1000;
const googlePlaceImageCache = new Map();

function getGooglePlacesKey() {
  return process.env.GOOGLE_PLACES_KEY || "";
}

function getCachedValue(cacheKey) {
  const hit = googlePlaceImageCache.get(cacheKey);
  if (!hit) return null;
  if (Date.now() - hit.ts > GOOGLE_CACHE_TTL) {
    googlePlaceImageCache.delete(cacheKey);
    return null;
  }
  return hit.value;
}

function setCachedValue(cacheKey, value) {
  googlePlaceImageCache.set(cacheKey, { value, ts: Date.now() });
}

async function fetchGooglePhotoRef(query, photoIndex = 0) {
  const cacheKey = `${String(query || "").trim().toLowerCase()}__ref_${photoIndex}`;
  const cached = getCachedValue(cacheKey);
  if (cached !== null) return cached;

  const googleKey = getGooglePlacesKey();
  if (!googleKey || !query) {
    setCachedValue(cacheKey, null);
    return null;
  }

  try {
    const findPlaceUrl =
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
      `?input=${encodeURIComponent(query)}` +
      `&inputtype=textquery` +
      `&fields=place_id,photos,name` +
      `&key=${googleKey}`;

    const res = await fetch(findPlaceUrl, { signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const data = await res.json();
      const place = data?.candidates?.[0];
      const photos = place?.photos || [];
      if (photos.length > 0) {
        const pick = photos[photoIndex % photos.length];
        const photoRef = pick?.photo_reference;
        if (photoRef) {
          const result = { photoRef, name: place?.name || query, source: "findplace" };
          setCachedValue(cacheKey, result);
          return result;
        }
      }
    }
  } catch (error) {
    console.warn("[PlaceImageService] findplace error:", error.message);
  }

  try {
    const textSearchUrl =
      `https://maps.googleapis.com/maps/api/place/textsearch/json` +
      `?query=${encodeURIComponent(query)}` +
      `&key=${googleKey}`;

    const res = await fetch(textSearchUrl, { signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const data = await res.json();
      const results = data?.results || [];
      if (results.length > 0) {
        const resultIndex = Math.floor(photoIndex / 5) % results.length;
        const place = results[resultIndex];
        const photos = place?.photos || [];
        if (photos.length > 0) {
          const photoRef = photos[photoIndex % photos.length]?.photo_reference;
          if (photoRef) {
            const result = { photoRef, name: place?.name || query, source: "textsearch" };
            setCachedValue(cacheKey, result);
            return result;
          }
        }
      }
    }
  } catch (error) {
    console.warn("[PlaceImageService] textsearch error:", error.message);
  }

  setCachedValue(cacheKey, null);
  return null;
}

async function fetchGooglePhotoRefs(query, maxPhotos = 6) {
  const safeMax = Math.max(1, Math.min(12, Number(maxPhotos) || 6));
  const cacheKey = `${String(query || "").trim().toLowerCase()}__refs_${safeMax}`;
  const cached = getCachedValue(cacheKey);
  if (cached !== null) return cached;

  const googleKey = getGooglePlacesKey();
  if (!googleKey || !query) {
    setCachedValue(cacheKey, []);
    return [];
  }

  const refs = [];
  const seen = new Set();
  const pushRef = (photoRef, name = query, source = "google_places") => {
    if (!photoRef || seen.has(photoRef) || refs.length >= safeMax) return;
    seen.add(photoRef);
    refs.push({ photoRef, name, source });
  };

  try {
    const findPlaceUrl =
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
      `?input=${encodeURIComponent(query)}` +
      `&inputtype=textquery` +
      `&fields=place_id,photos,name` +
      `&key=${googleKey}`;

    const res = await fetch(findPlaceUrl, { signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const data = await res.json();
      const place = data?.candidates?.[0];
      for (const photo of place?.photos || []) {
        pushRef(photo?.photo_reference, place?.name || query, "findplace");
      }
    }
  } catch (error) {
    console.warn("[PlaceImageService] findplace refs error:", error.message);
  }

  if (refs.length < safeMax) {
    try {
      const textSearchUrl =
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(query)}` +
        `&key=${googleKey}`;

      const res = await fetch(textSearchUrl, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const data = await res.json();
        for (const place of data?.results || []) {
          for (const photo of place?.photos || []) {
            pushRef(photo?.photo_reference, place?.name || query, "textsearch");
          }
          if (refs.length >= safeMax) break;
        }
      }
    } catch (error) {
      console.warn("[PlaceImageService] textsearch refs error:", error.message);
    }
  }

  setCachedValue(cacheKey, refs);
  return refs;
}

function normalizePlaceText(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCountryFromAddress(address = "") {
  const parts = String(address || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.at(-1) || "";
}

function scoreDestinationResult(place = {}, query = "") {
  const name = normalizePlaceText(place.name);
  const q = normalizePlaceText(query);
  const types = Array.isArray(place.types) ? place.types : [];
  const address = normalizePlaceText(place.formatted_address || place.vicinity || "");
  let score = 0;

  if (name === q) score += 90;
  else if (name.startsWith(q)) score += 48;
  else if (name.includes(q)) score += 28;

  if (types.includes("locality")) score += 42;
  if (types.includes("country")) score += 38;
  if (types.includes("administrative_area_level_1")) score += 28;
  if (types.includes("administrative_area_level_2")) score += 18;
  if (types.includes("tourist_attraction")) score += 18;
  if (types.includes("natural_feature")) score += 14;
  if (types.includes("point_of_interest")) score += 10;
  if (types.includes("political")) score += 8;
  if (Array.isArray(place.photos) && place.photos.length) score += 12;
  if (Number.isFinite(place.rating)) score += Math.min(8, place.rating);
  if (Number.isFinite(place.user_ratings_total)) score += Math.min(22, Math.log10(place.user_ratings_total + 1) * 8);

  // The search bar is destination-first, so avoid tiny businesses hijacking famous place names.
  if (types.includes("store") || types.includes("restaurant") || types.includes("food") || types.includes("lodging")) score -= 24;

  // Important religious/city disambiguation. This keeps "Mecca" from becoming random towns.
  if (q === "mecca" && /saudi arabia|makkah|makkah province/.test(address)) score += 120;
  if (q === "madinah" || q === "medina") {
    if (/saudi arabia|al madinah/.test(address)) score += 90;
  }

  return score;
}

function mapGoogleDestination(place = {}, query = "", index = 0, baseUrl = "") {
  const photoRef = place.photos?.[0]?.photo_reference;
  const country = parseCountryFromAddress(place.formatted_address || place.vicinity || "");
  return {
    title: place.name || query,
    location: country || place.formatted_address || "Global",
    address: place.formatted_address || place.vicinity || "",
    placeId: place.place_id || "",
    types: Array.isArray(place.types) ? place.types : [],
    lat: place.geometry?.location?.lat ?? null,
    lng: place.geometry?.location?.lng ?? null,
    src: photoRef ? buildGooglePlacePhotoProxyUrl(photoRef, 1000, baseUrl) : null,
    query: `${place.name || query} ${country}`.trim(),
    source: "google_places",
    score: scoreDestinationResult(place, query) - index,
  };
}

export async function searchGoogleDestinations(query, {
  limit = 8,
  baseUrl = "",
} = {}) {
  const safeQuery = String(query || "").trim();
  const safeLimit = Math.max(1, Math.min(12, Number(limit) || 8));
  const cacheKey = `${safeQuery.toLowerCase()}__destination_search_${safeLimit}`;
  const cached = getCachedValue(cacheKey);
  if (cached !== null) return cached;

  const googleKey = getGooglePlacesKey();
  if (!googleKey || safeQuery.length < 2) {
    setCachedValue(cacheKey, []);
    return [];
  }

  const fields = "place_id,name,formatted_address,types,photos,geometry,rating,user_ratings_total";
  const collected = [];

  const addResults = (places = []) => {
    places.forEach((place, index) => {
      if (!place?.place_id || !place?.name) return;
      collected.push(mapGoogleDestination(place, safeQuery, index, baseUrl));
    });
  };

  try {
    const findUrl =
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
      `?input=${encodeURIComponent(safeQuery)}` +
      `&inputtype=textquery` +
      `&fields=${encodeURIComponent(fields)}` +
      `&language=en` +
      `&key=${googleKey}`;
    const res = await fetch(findUrl, { signal: AbortSignal.timeout(6500) });
    if (res.ok) {
      const data = await res.json();
      addResults(data?.candidates || []);
    }
  } catch (error) {
    console.warn("[PlaceImageService] destination findplace error:", error.message);
  }

  try {
    const textUrl =
      `https://maps.googleapis.com/maps/api/place/textsearch/json` +
      `?query=${encodeURIComponent(safeQuery)}` +
      `&language=en` +
      `&key=${googleKey}`;
    const res = await fetch(textUrl, { signal: AbortSignal.timeout(6500) });
    if (res.ok) {
      const data = await res.json();
      addResults(data?.results || []);
    }
  } catch (error) {
    console.warn("[PlaceImageService] destination textsearch error:", error.message);
  }

  const seen = new Set();
  const ranked = collected
    .sort((a, b) => b.score - a.score)
    .filter((place) => {
      const key = place.placeId || `${normalizePlaceText(place.title)}|${normalizePlaceText(place.location)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return normalizePlaceText(place.title).includes(normalizePlaceText(safeQuery)) ||
        normalizePlaceText(place.address).includes(normalizePlaceText(safeQuery));
    })
    .slice(0, safeLimit)
    .map(({ score, ...place }) => place);

  setCachedValue(cacheKey, ranked);
  return ranked;
}

export function buildGooglePlacePhotoProxyUrl(photoRef, maxwidth = 800, baseUrl = "") {
  if (!photoRef) return null;
  const base = String(baseUrl || process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
  const path = `/api/place-image/photo?ref=${encodeURIComponent(photoRef)}&w=${maxwidth}`;
  return base ? `${base}${path}` : path;
}

export function buildGooglePlacePhotoApiUrl(photoRef, maxwidth = 800) {
  const googleKey = getGooglePlacesKey();
  if (!photoRef || !googleKey) return null;
  return (
    `https://maps.googleapis.com/maps/api/place/photo` +
    `?maxwidth=${maxwidth}` +
    `&photo_reference=${encodeURIComponent(photoRef)}` +
    `&key=${encodeURIComponent(googleKey)}`
  );
}

export async function getGooglePlaceImageUrl(query, {
  photoIndex = 0,
  maxwidth = 800,
  baseUrl = "",
} = {}) {
  const refResult = await fetchGooglePhotoRef(query, photoIndex);
  if (!refResult?.photoRef) return null;
  return {
    url: buildGooglePlacePhotoProxyUrl(refResult.photoRef, maxwidth, baseUrl),
    place: refResult.name || query,
    source: "google_places",
  };
}

export async function getGooglePlaceImageUrls(query, {
  startIndex = 0,
  maxResults = 6,
  maxwidth = 800,
  baseUrl = "",
} = {}) {
  const refs = await fetchGooglePhotoRefs(query, Math.max(1, startIndex + maxResults));
  return refs
    .slice(Math.max(0, startIndex), Math.max(0, startIndex) + Math.max(1, maxResults))
    .map((entry) => ({
      url: buildGooglePlacePhotoProxyUrl(entry.photoRef, maxwidth, baseUrl),
      place: entry.name || query,
      source: "google_places",
    }))
    .filter((entry) => entry.url);
}

export function hasGooglePlacesKey() {
  return Boolean(getGooglePlacesKey());
}
