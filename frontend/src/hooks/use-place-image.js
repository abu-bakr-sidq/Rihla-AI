/**
 * use-place-image.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared React hook for fetching Google Places photos via the backend proxy.
 * Pure JS (no JSX) so this file stays as .js without needing Vite JSX transform.
 */

import { useState, useEffect, createElement } from "react";
import { resolveApiUrl } from "@/lib/api-contract";

// Module-level cache: query → resolved URL (persists across component remounts)
const _cache = new Map();

function buildUnsplashFallback(query, photoIndex = 0) {
  const queries = Array.isArray(query) ? query.filter(Boolean) : [query];
  const primary = String(queries[0] || "travel destination scenic").trim();
  const cleaned = primary
    .replace(/[^\w\s,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const featuredQuery = encodeURIComponent(
    `${cleaned || "travel destination"} scenic landmark`,
  );

  const staticFallbacks = [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=1200",
  ];

  return [
    `https://images.unsplash.com/featured/1200x800/?${featuredQuery}`,
    staticFallbacks[Math.abs(photoIndex) % staticFallbacks.length],
  ];
}

/**
 * Resolve an image URL for a given search query.
 * Calls /api/place-image which:
 *   1. Uses Google Places Text Search + Photo API (primary)
 *   2. Falls back to Wikipedia, then Wikimedia Commons
 * Returns the URL string or null on failure.
 */
async function resolvePlaceImage(query, options = {}) {
  const { photoIndex = 0, onlyGoogle = false } = options;
  const queries = Array.isArray(query) ? query.filter(Boolean) : [query];
  const normalizedQueries = queries
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (!normalizedQueries.length) return null;

  const cacheKey = `${normalizedQueries.join("||").toLowerCase()}__pi${photoIndex}__og${onlyGoogle ? 1 : 0}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  for (const currentQuery of normalizedQueries) {
    const key = `${currentQuery.toLowerCase()}__pi${photoIndex}__og${onlyGoogle ? 1 : 0}`;
    if (_cache.has(key)) {
      const cached = _cache.get(key);
      if (cached) {
        _cache.set(cacheKey, cached);
        return cached;
      }
      continue;
    }

    try {
      const params = new URLSearchParams({
        query: currentQuery,
        photoIndex: String(photoIndex || 0),
      });
      if (onlyGoogle) params.set("onlyGoogle", "1");

      const res = await fetch(resolveApiUrl(`/api/place-image?${params.toString()}`), {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (onlyGoogle && data?.source !== "google_places" && data?.source !== "cache") {
        _cache.set(key, null);
        continue;
      }
      const url = data?.url || null;
      _cache.set(key, url);
      if (url) {
        _cache.set(cacheKey, url);
        return url;
      }
    } catch (_) {
      // Try next candidate query
    }
  }

  _cache.set(cacheKey, null);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: usePlaceImage(query) → { src, loading }
// ─────────────────────────────────────────────────────────────────────────────
export function usePlaceImage(query, options = {}) {
  const { photoIndex = 0, onlyGoogle = false } = options;
  const [src, setSrc] = useState(() => {
    const queries = Array.isArray(query) ? query.filter(Boolean) : [query];
    const normalized = queries.map((item) => String(item || "").trim()).filter(Boolean);
    const key = normalized.length
      ? `${normalized.join("||").toLowerCase()}__pi${photoIndex}__og${onlyGoogle ? 1 : 0}`
      : null;
    return key && _cache.has(key) ? _cache.get(key) : null;
  });
  const [loading, setLoading] = useState(!src);

  useEffect(() => {
    if (!query) { setSrc(null); setLoading(false); return; }
    let alive = true;

    const queries = Array.isArray(query) ? query.filter(Boolean) : [query];
    const normalized = queries.map((item) => String(item || "").trim()).filter(Boolean);
    const key = `${normalized.join("||").toLowerCase()}__pi${photoIndex}__og${onlyGoogle ? 1 : 0}`;
    if (_cache.has(key)) {
      setSrc(_cache.get(key));
      setLoading(false);
      return;
    }

    setLoading(true);
    resolvePlaceImage(query, { photoIndex, onlyGoogle }).then((url) => {
      if (!alive) return;
      setSrc(url);
      setLoading(false);
    });

    return () => { alive = false; };
  }, [query, photoIndex, onlyGoogle]);

  return { src, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component: PlaceImage — renders an <img> with Google Places src
// Written with createElement to avoid requiring JSX in a .js file
// ─────────────────────────────────────────────────────────────────────────────
export function usePlaceImageGallery(query, options = {}) {
  const { photoIndex = 0, maxResults = 8, onlyGoogle = true } = options;
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queries = Array.isArray(query) ? query.filter(Boolean) : [query].filter(Boolean);
    const normalized = queries.map((item) => String(item || "").trim()).filter(Boolean);
    if (!normalized.length) {
      setImages([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    (async () => {
      for (const currentQuery of normalized) {
        try {
          const params = new URLSearchParams({
            query: currentQuery,
            photoIndex: String(photoIndex || 0),
            maxResults: String(Math.max(2, Math.min(12, Number(maxResults) || 8))),
          });
          if (onlyGoogle) params.set("onlyGoogle", "1");

          const res = await fetch(resolveApiUrl(`/api/place-image?${params.toString()}`), {
            signal: AbortSignal.timeout(9000),
          });
          if (!res.ok) continue;
          const data = await res.json();
          const nextImages = Array.isArray(data?.images) ? data.images.filter((item) => item?.url) : [];
          if (nextImages.length) {
            if (alive) setImages(nextImages);
            return;
          }
        } catch (_) {
          // Try the next exact place query.
        }
      }

      if (alive) setImages([]);
    })().finally(() => {
      if (alive) setLoading(false);
    });

    return () => { alive = false; };
  }, [query, photoIndex, maxResults, onlyGoogle]);

  return { images, loading };
}

export function PlaceImage({ query, queries, alt, className, fallbackSrc, style, photoIndex = 0, onlyGoogle = false, placeholderLabel = "Rihla image", placeholderAccent = "#D4AF37" }) {
  const lookup = Array.isArray(queries) && queries.length ? queries : query;
  const { src, loading } = usePlaceImage(lookup, { photoIndex, onlyGoogle });
  const fallbackChain = onlyGoogle ? [] : [fallbackSrc, ...buildUnsplashFallback(lookup, photoIndex)].filter(Boolean);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const displaySrc = (!primaryFailed && src) || fallbackChain[fallbackIndex] || null;
  const cls = className || "absolute inset-0 w-full h-full object-cover";

  useEffect(() => {
    setFallbackIndex(0);
    setPrimaryFailed(false);
  }, [src, fallbackSrc, lookup, photoIndex, onlyGoogle]);

  if (loading && !displaySrc) {
    // Spinner while loading
    return createElement("div", {
      className: cls,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 8,
        background: `radial-gradient(circle at 50% 35%, ${placeholderAccent}22, transparent 34%), linear-gradient(135deg,rgba(8,14,24,0.96) 0%,rgba(15,22,35,0.88) 100%)`,
        width: "100%",
        height: "100%",
        ...style,
      },
    },
      createElement("div", {
        style: {
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: `2px solid ${placeholderAccent}30`,
          borderTopColor: placeholderAccent,
          animation: "spin 0.9s linear infinite",
        },
      }),
      createElement("span", {
        style: {
          color: "rgba(255,255,255,0.72)",
          fontSize: 8,
          fontWeight: 900,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          padding: "0 14px",
          textAlign: "center",
        },
      }, "Locking place image")
    );
  }

  if (!displaySrc) {
    return createElement("div", {
      className: cls,
      style: {
        display: "flex",
        alignItems: "end",
        background: `radial-gradient(circle at 20% 10%, ${placeholderAccent}24, transparent 30%), linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 48%, rgba(14,165,233,0.18) 100%)`,
        ...style,
      },
    }, createElement("span", {
      style: {
        color: "rgba(255,255,255,0.78)",
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        padding: 14,
        textShadow: "0 2px 12px rgba(0,0,0,0.85)",
      },
    }, placeholderLabel));
  }

  return createElement("img", {
    src: displaySrc,
    alt: alt || (Array.isArray(lookup) ? lookup[0] : lookup),
    className: cls,
    style,
    onError: (e) => {
      if (!primaryFailed && src) {
        setPrimaryFailed(true);
        return;
      }
      if (fallbackIndex < fallbackChain.length - 1) {
        setFallbackIndex((prev) => prev + 1);
        return;
      }
      e.target.style.display = "none";
    },
  });
}

export default usePlaceImage;
