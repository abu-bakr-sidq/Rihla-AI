/**
 * use-place-image.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared React hook for fetching Google Places photos via the backend proxy.
 * Pure JS (no JSX) so this file stays as .js without needing Vite JSX transform.
 */

import { useState, useEffect, createElement } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

// Module-level cache: query → resolved URL (persists across component remounts)
const _cache = new Map();
const _pending = new Map();

function primeImage(url) {
  if (!url || typeof Image === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
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
  if (_pending.has(cacheKey)) return _pending.get(cacheKey);

  const pendingPromise = (async () => {
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

        const res = await fetch(`${API_BASE_URL}/place-image?${params.toString()}`, {
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
          primeImage(url);
          _cache.set(cacheKey, url);
          return url;
        }
      } catch (_) {
        // Try next candidate query
      }
    }

    _cache.set(cacheKey, null);
    return null;
  })();

  _pending.set(cacheKey, pendingPromise);
  try {
    return await pendingPromise;
  } finally {
    _pending.delete(cacheKey);
  }
}

export async function preloadPlaceImageQueries(queries, options = {}) {
  const list = Array.isArray(queries) ? queries : [queries];
  await Promise.all(
    list
      .filter(Boolean)
      .map((query, index) => resolvePlaceImage(query, { photoIndex: index, ...options }).catch(() => null)),
  );
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
export function PlaceImage({ query, queries, alt, className, fallbackSrc, style, photoIndex = 0, onlyGoogle = false }) {
  const lookup = Array.isArray(queries) && queries.length ? queries : query;
  const { src, loading } = usePlaceImage(lookup, { photoIndex, onlyGoogle });
  const displaySrc = src || fallbackSrc;
  const cls = className || "absolute inset-0 w-full h-full object-cover";

  if (loading && !displaySrc) {
    // Spinner while loading
    return createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,rgba(212,175,55,0.05) 0%,rgba(15,22,35,0.8) 100%)",
        width: "100%",
        height: "100%",
        ...style,
      },
    },
      createElement("div", {
        style: {
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "2px solid rgba(212,175,55,0.2)",
          borderTopColor: "#D4AF37",
          animation: "spin 0.9s linear infinite",
        },
      })
    );
  }

  if (!displaySrc) return null;

  return createElement("img", {
    src: displaySrc,
    alt: alt || (Array.isArray(lookup) ? lookup[0] : lookup),
    className: cls,
    style,
    loading: "eager",
    fetchPriority: "high",
    onError: (e) => {
      if (!onlyGoogle && fallbackSrc && e.target.src !== fallbackSrc) {
        e.target.src = fallbackSrc;
      } else {
        e.target.style.display = "none";
      }
    },
  });
}

export default usePlaceImage;
