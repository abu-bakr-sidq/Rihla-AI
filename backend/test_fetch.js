import fetch from 'node-fetch';

function normalizeToken(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function keywordTokens(text) {
  return normalizeToken(text).split(" ").filter((w) => w.length >= 4);
}

const CROSS_LOCATION_CITIES = new Set([
  "dubai","london","paris","tokyo","singapore","newyork","new york","mumbai","delhi",
  "bangkok","sydney","barcelona","amsterdam","rome","istanbul","berlin","toronto",
  "moscow","beijing","shanghai","seoul","kualalumpur","dubai","abudhabi","doha",
  "cairo","nairobi","johannesburg","sanfrancisco","losangeles","chicago","miami",
  "kolkata","hyderabad","bangalore","pune","ahmedabad","jaipur","surat","lucknow"
]);
const GENERIC_IMAGE_PATTERN = /(map(_of|s)|location_map|locator_map|blank_map|flag_of|coat_of_arms|logo|icon|symbol|emblem|seal_of|diagram|chart|graph|route_map|suburban_rail|metro_map|transit_map|system_map|network_map|scheme|transport_map|infrastructure|topology|connectivity|transportation_map|urban_rail|railway_map|transit_network|city_map|street_map|geographical_map|political_map|vector_map|interactive_map|transit_system|route_network|map_icon|transit_icon|navigation|gps_map|system_diagram|network_diagram|schematic|layout|blueprint|plan_of|topography|cartography)/i;

function imageUrlPassesCrossLocationCheck(imageUrl, destination) {
  const destNorm = normalizeToken(destination);
  const urlNorm = normalizeToken(decodeURIComponent(imageUrl || ""));
  for (const city of CROSS_LOCATION_CITIES) {
    if (city !== destNorm && !destNorm.includes(city) && urlNorm.includes(city)) return false;
  }
  return true;
}

async function fetchCommonsImages(query, destination, placeTitle, limit = 8) {
  try {
    const strictQuery = `${placeTitle} ${destination}`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(strictQuery)}&gsrlimit=${Math.min(limit * 3, 30)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&format=json&origin=*`;
    const resp = await fetch(url);
    if (!resp.ok) { return []; }
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

    console.log("Strict length:", strict.length);
    console.log("Relaxed length:", relaxed.length);
    console.log("Total normalized:", normalized.length);

    const urls = strict.length > 0 ? strict : relaxed;
    
    // If urls == 0 return normalized mapping.
    if (urls.length === 0 && normalized.length > 0) {
      console.log("Returning normalized directly");
      return normalized.map(i => i.imageUrl).slice(0, Math.max(2, limit));
    }
    
    return [...new Set(urls)].slice(0, limit);
  } catch (_error) {
    console.log(_error);
    return [];
  }
}

fetchCommonsImages("Marina Beach Chennai landmark", "Chennai", "Marina Beach").then(urls => console.log(urls));
