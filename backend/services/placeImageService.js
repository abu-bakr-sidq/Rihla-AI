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

export function hasGooglePlacesKey() {
  return Boolean(getGooglePlacesKey());
}
