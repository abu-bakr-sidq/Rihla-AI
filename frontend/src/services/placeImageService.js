/**
 * placeImageService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetch a real photo for a named place.
 *
 * Priority:
 *  1. Google Places API  (if VITE_GOOGLE_PLACES_KEY is set)
 *  2. Unsplash           (if VITE_UNSPLASH_KEY is set)
 *  3. Picsum seeded hash (always works, deterministic per place name)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { resolveApiUrl } from "@/lib/api-contract";

const GOOGLE_KEY   = import.meta.env.VITE_GOOGLE_PLACES_KEY  || "";
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_KEY       || "";

// ── In-memory cache: query → URL ────────────────────────────────────────────
const cache = new Map();

// Simple hash (djb2) for stable Picsum seed
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h) % 1000;
}

// ── Layer 3: Picsum deterministic fallback ───────────────────────────────────
function picsumUrl(query) {
  const seed = hashStr(query.toLowerCase());
  return `https://picsum.photos/seed/${seed}/800/500`;
}

// ── Layer 2: Unsplash ────────────────────────────────────────────────────────
async function unsplashUrl(query) {
  if (!UNSPLASH_KEY) return null;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&client_id=${UNSPLASH_KEY}`;
  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (!data?.results?.length) return null;
    // Randomise within first 5 to avoid always the same image
    const pick = data.results[Math.floor(Math.random() * Math.min(5, data.results.length))];
    return pick.urls?.regular || null;
  } catch { return null; }
}

// ── Layer 1: Google Places ───────────────────────────────────────────────────
async function googlePlacesUrl(query) {
  try {
    const params = new URLSearchParams({
      query,
      photoIndex: "0",
      onlyGoogle: "1",
    });
    const searchRes = await fetch(resolveApiUrl(`/api/place-image?${params.toString()}`));
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    return searchData?.url || null;
  } catch { return null; }
}

// ── Main export ──────────────────────────────────────────────────────────────
/**
 * getPlaceImage(place, city, time?, imageQuery?)
 * Returns a real image URL for the given place.
 *
 * @param {string} place       - e.g. "Marina Beach"
 * @param {string} city        - e.g. "Chennai"
 * @param {string} [time]      - "morning" | "afternoon" | "evening" | "night"
 * @param {string} [imageQuery] - AI-generated query e.g. "Marina Beach Chennai tourism"
 * @returns {Promise<string>}  — always resolves (never rejects)
 */
export async function getPlaceImage(place, city, time = "", imageQuery = "") {
  const baseQuery = imageQuery || `${place} ${city}`.trim();
  const key       = `${baseQuery}::${time}`;

  if (cache.has(key)) return cache.get(key);

  // Time-of-day context enriches Unsplash queries (Google Places uses base query)
  const timeCtx = {
    morning:   "sunrise morning",
    afternoon: "daytime exterior",
    evening:   "sunset evening",
    night:     "night illuminated",
  }[time] || "";

  const unsplashQuery = timeCtx ? `${baseQuery} ${timeCtx}` : baseQuery;

  const url =
    (await googlePlacesUrl(baseQuery)) ||
    (await unsplashUrl(unsplashQuery))  ||
    picsumUrl(baseQuery);

  cache.set(key, url);
  return url;
}
