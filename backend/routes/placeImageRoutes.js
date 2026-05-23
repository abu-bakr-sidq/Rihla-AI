import express from "express";

const router = express.Router();

// Dynamically reads the key on every call so it still works if env is loaded later.
const getKey = () => process.env.GOOGLE_PLACES_KEY || "";

// Log at startup
setTimeout(() => {
  const k = getKey();
  console.log("[PlaceImage] GOOGLE_PLACES_KEY:", k
    ? `loaded (${k.slice(0, 8)}...)`
    : "NOT SET - check GOOGLE_PLACES_KEY in .env");
}, 500);

// â”€â”€ In-memory cache (key â†’ { url, ts }) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const _cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const getCached = (key) => {
  const hit = _cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return hit.url;
};
const setCache = (key, url) => _cache.set(key, { url, ts: Date.now() });

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Call Google Places to get a photo_reference for a query.
 * Strategy 1: Find Place From Text (supports fields=photos â€” most accurate)
 * Strategy 2: Text Search (broader, also has photos array)
 */
async function getGooglePhotoRef(query, photoIndex = 0) {
  const GOOGLE_KEY = getKey();
  if (!GOOGLE_KEY) return null;

  // Strategy 1: Find Place From Text returns up to 10 photos per place.
  try {
    const fpUrl =
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
      `?input=${encodeURIComponent(query)}` +
      `&inputtype=textquery` +
      `&fields=place_id,photos,name` +
      `&key=${GOOGLE_KEY}`;

    const res = await fetch(fpUrl, { signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const data = await res.json();
      const place = data?.candidates?.[0];
      const photos = place?.photos || [];
      if (photos.length > 0) {
        // Use photoIndex modulo total available photos to rotate uniquely.
        const pick = photos[photoIndex % photos.length];
        const photoRef = pick?.photo_reference;
        if (photoRef) {
          console.log(`[Places] findplace: "${query}" -> ${place.name} (photo ${photoIndex % photos.length}/${photos.length})`);
          return { photoRef, name: place.name };
        }
      }
    }
  } catch (e) { console.warn("[Places] findplace error:", e.message); }

  // Strategy 2: Text Search is broader and can still return photos.
  try {
    const tsUrl =
      `https://maps.googleapis.com/maps/api/place/textsearch/json` +
      `?query=${encodeURIComponent(query)}` +
      `&key=${GOOGLE_KEY}`;

    const res = await fetch(tsUrl, { signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const data = await res.json();
      const results = data?.results || [];
      if (results.length > 0) {
        // Rotate across different result places and their photos for better uniqueness.
        const resultIdx = Math.floor(photoIndex / 5) % results.length;
        const place = results[resultIdx];
        const photos = place?.photos || [];
        if (photos.length > 0) {
          const photoRef = photos[photoIndex % photos.length]?.photo_reference;
          if (photoRef) {
            console.log(`[Places] textsearch: "${query}" -> ${place.name} (result ${resultIdx}, photo ${photoIndex % photos.length})`);
            return { photoRef, name: place.name };
          }
        }
      }
    }
  } catch (e) { console.warn("[Places] textsearch error:", e.message); }

  return null;
}

/** Proxy URL for photo binary â€” keeps API key server-side */
function buildProxiedPhotoUrl(photoRef, maxwidth = 800) {
  return `/api/place-image/photo?ref=${encodeURIComponent(photoRef)}&w=${maxwidth}`;
}

// â”€â”€ Fallback: Wikipedia thumbnail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getWikipediaImage(words) {
  try {
    const title = encodeURIComponent(words.replace(/ /g, "_"));
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { headers: { "User-Agent": "RihlaAI/2.0 (travel-planner)" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data?.thumbnail?.source || data?.originalimage?.source;
    if (thumb?.startsWith("http")) return thumb.replace(/\/\d+px-/, "/800px-");
    return null;
  } catch (_) { return null; }
}

// â”€â”€ Fallback: Wikimedia Commons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getWikimediaImage(words) {
  try {
    const search = encodeURIComponent(words);
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${search}&srnamespace=6&srlimit=5&format=json&origin=*`,
      { headers: { "User-Agent": "RihlaAI/2.0" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hits = data?.query?.search || [];
    for (const hit of hits) {
      const { title } = hit;
      if (!title.match(/\.(jpe?g|png|webp)$/i)) continue;
      const thumbRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`,
        { headers: { "User-Agent": "RihlaAI/2.0" }, signal: AbortSignal.timeout(5000) }
      );
      if (!thumbRes.ok) continue;
      const thumbData = await thumbRes.json();
      const pages = thumbData?.query?.pages || {};
      const page = Object.values(pages)[0];
      const url = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
      if (url) return url;
      break;
    }
    return null;
  } catch (_) { return null; }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Route 1: GET /api/place-image?query=<place name>
// Returns { url, source }
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/", async (req, res) => {
  const { query, nocache, photoIndex: rawPhotoIdx, onlyGoogle } = req.query;
  if (!query) return res.json({ url: null, source: "no_query" });
  const strictGoogle = onlyGoogle === "1" || onlyGoogle === "true";

  // photoIndex lets callers request different photos of the SAME place
  // This guarantees unique images across all 8 slots Ã— N days
  const photoIndex = Math.max(0, parseInt(rawPhotoIdx, 10) || 0);

  // Cache key includes photoIndex so each unique slot has its own entry
  const cacheKey = query.trim().toLowerCase() + `__pi${photoIndex}`;

  // Allow cache bypass with ?nocache=1
  if (!nocache) {
    const cached = getCached(cacheKey);
    if (cached) return res.json({ url: cached, source: "cache" });
  }

  const clean = query.trim();
  const words = clean.split(/\s+/).filter(w => w.length > 2).slice(0, 4).join(" ");

  // â”€â”€ Tier 1: Google Places API with photo index rotation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const GOOGLE_KEY = getKey();
  if (GOOGLE_KEY) {
    const result = await getGooglePhotoRef(clean, photoIndex);
    if (result?.photoRef) {
      const proxyUrl = buildProxiedPhotoUrl(result.photoRef, 800);
      setCache(cacheKey, proxyUrl);
      return res.json({ url: proxyUrl, source: "google_places", place: result.name });
    }
  } else {
    console.warn("[PlaceImage] Google Places skipped - GOOGLE_PLACES_KEY not set");
  }

  if (strictGoogle) {
    return res.json({ url: null, source: "google_required" });
  }

  // â”€â”€ Tier 2: Wikipedia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const wikiUrl = await getWikipediaImage(words);
  if (wikiUrl) {
    setCache(cacheKey, wikiUrl);
    return res.json({ url: wikiUrl, source: "wikipedia" });
  }

  // â”€â”€ Tier 3: Wikimedia Commons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const commonsUrl = await getWikimediaImage(words);
  if (commonsUrl) {
    setCache(cacheKey, commonsUrl);
    return res.json({ url: commonsUrl, source: "wikimedia_commons" });
  }

  return res.json({ url: null, source: "exhausted" });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Route 2: GET /api/place-image/photo?ref=<reference>&w=<width>
// Proxies the Google Place Photo binary â€” keeps API key server-side
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/photo", async (req, res) => {
  const { ref, w = "800" } = req.query;
  if (!ref) return res.status(400).json({ error: "Missing ref" });

  const GOOGLE_KEY = getKey();
  if (!GOOGLE_KEY) return res.status(500).json({ error: "No Google key configured" });

  try {
    const googleUrl =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=${w}` +
      `&photo_reference=${encodeURIComponent(ref)}` +
      `&key=${GOOGLE_KEY}`;

    const photoRes = await fetch(googleUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!photoRes.ok) {
      console.error(`[PlacePhoto] Google returned ${photoRes.status}`);
      return res.status(photoRes.status).json({ error: "Google photo fetch failed" });
    }

    const contentType = photoRes.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // 24hr browser cache

    const buffer = await photoRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[PlacePhoto] Error:", err.message);
    res.status(500).json({ error: "Internal proxy error" });
  }
});

export default router;

