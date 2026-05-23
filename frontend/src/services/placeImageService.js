const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const cache = new Map();

function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h) % 1000;
}

function picsumUrl(query) {
  const seed = hashStr(query.toLowerCase());
  return `https://picsum.photos/seed/${seed}/800/500`;
}

export async function getPlaceImage(place, city, time = "", imageQuery = "") {
  const baseQuery = imageQuery || `${place} ${city}`.trim();
  const key = `${baseQuery}::${time}`;

  if (cache.has(key)) return cache.get(key);

  const params = new URLSearchParams({
    query: baseQuery,
    photoIndex: "0",
  });

  let url = null;
  try {
    const res = await fetch(`${API_BASE_URL}/place-image?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      url = data?.url || null;
    }
  } catch {
    url = null;
  }

  if (!url) {
    url = picsumUrl(baseQuery);
  }

  cache.set(key, url);
  return url;
}
