import express from "express";
import {
  buildGooglePlacePhotoApiUrl,
  buildGooglePlacePhotoProxyUrl,
  getGooglePlaceImageUrl,
  getGooglePlaceImageUrls,
  hasGooglePlacesKey,
  searchGoogleDestinations,
} from "../services/placeImageService.js";

const router = express.Router();

setTimeout(() => {
  console.log(
    "[PlaceImage] GOOGLE_PLACES_KEY:",
    hasGooglePlacesKey() ? "loaded" : "NOT SET - check GOOGLE_PLACES_KEY in .env"
  );
}, 500);

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
  } catch (_) {
    return null;
  }
}

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
  } catch (_) {
    return null;
  }
}

router.get("/search", async (req, res) => {
  const { query, limit = "8" } = req.query;
  if (!query || String(query).trim().length < 2) {
    return res.json({ results: [], source: "no_query" });
  }

  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const results = await searchGoogleDestinations(String(query).trim(), {
      limit: Math.max(1, Math.min(12, parseInt(limit, 10) || 8)),
      baseUrl,
    });

    return res.json({
      results,
      source: results.length ? "google_places" : "empty",
    });
  } catch (error) {
    console.error("[PlaceSearch] Error:", error.message);
    return res.status(500).json({ results: [], source: "error" });
  }
});

router.get("/", async (req, res) => {
  const { query, onlyGoogle, photoIndex: rawPhotoIndex, maxResults: rawMaxResults } = req.query;
  if (!query) return res.json({ url: null, source: "no_query" });

  const strictGoogle = onlyGoogle === "1" || onlyGoogle === "true";
  const photoIndex = Math.max(0, parseInt(rawPhotoIndex, 10) || 0);
  const maxResults = Math.max(0, Math.min(12, parseInt(rawMaxResults, 10) || 0));
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  if (maxResults > 1) {
    const googleImages = await getGooglePlaceImageUrls(String(query).trim(), {
      startIndex: photoIndex,
      maxResults,
      maxwidth: 1100,
      baseUrl,
    });

    if (googleImages.length) {
      return res.json({
        url: googleImages[0]?.url || null,
        images: googleImages,
        source: "google_places",
      });
    }

    if (strictGoogle) {
      return res.json({ url: null, images: [], source: "google_required" });
    }
  }

  const googleResult = await getGooglePlaceImageUrl(String(query).trim(), {
    photoIndex,
    maxwidth: 800,
    baseUrl,
  });

  if (googleResult?.url) {
    return res.json({
      url: googleResult.url,
      source: googleResult.source,
      place: googleResult.place,
    });
  }

  if (strictGoogle) {
    return res.json({ url: null, source: "google_required" });
  }

  const words = String(query).trim().split(/\s+/).filter((word) => word.length > 2).slice(0, 4).join(" ");
  const wikipediaUrl = await getWikipediaImage(words);
  if (wikipediaUrl) return res.json({ url: wikipediaUrl, source: "wikipedia" });

  const wikimediaUrl = await getWikimediaImage(words);
  if (wikimediaUrl) return res.json({ url: wikimediaUrl, source: "wikimedia_commons" });

  return res.json({ url: null, source: "exhausted" });
});

router.get("/photo", async (req, res) => {
  const { ref, w = "800" } = req.query;
  if (!ref) return res.status(400).json({ error: "Missing ref" });
  if (!hasGooglePlacesKey()) return res.status(500).json({ error: "No Google key configured" });

  try {
    const googleUrl = buildGooglePlacePhotoApiUrl(String(ref), Number(w));
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
    res.setHeader("Cache-Control", "public, max-age=86400");

    const buffer = await photoRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("[PlacePhoto] Error:", error.message);
    res.status(500).json({ error: "Internal proxy error" });
  }
});

export default router;
