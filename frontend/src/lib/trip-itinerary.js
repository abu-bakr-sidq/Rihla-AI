function parseCost(value) {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value).trim().replace(/(?<=\d),(?=\d)/g, "");
  const parts = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0])).filter(Number.isFinite);
  if (!parts.length) return 0;
  if (parts.length >= 2 && /(?:-|–|\bto\b)/i.test(text)) {
    return Math.round(parts.reduce((sum, part) => sum + part, 0) / parts.length);
  }
  return parts[0] || 0;
}

const BUDGET_SLOT_KEYS = ["morning", "morningActivity", "afternoon", "afternoonActivity", "evening", "eveningActivity", "night", "nightActivity"];

function splitBudgetByWeights(total, weights = []) {
  const safeTotal = Math.max(0, Math.round(Number(total) || 0));
  const safeWeights = Array.isArray(weights) && weights.length ? weights : [1];
  const totalWeight = safeWeights.reduce((sum, weight) => sum + Math.max(0, Number(weight) || 0), 0) || safeWeights.length;
  const values = safeWeights.map((weight) => Math.floor((safeTotal * (Math.max(0, Number(weight) || 0) || 1)) / totalWeight));
  let remainder = safeTotal - values.reduce((sum, value) => sum + value, 0);

  for (let i = 0; i < values.length && remainder > 0; i += 1) {
    values[i] += 1;
    remainder -= 1;
  }

  return values;
}

function resolveBudgetParts(costBreakdown = {}, total = 0) {
  const safeTotal = Math.max(0, Math.round(Number(total) || 0));
  const stay = parseCost(costBreakdown?.stay);
  const food = parseCost(costBreakdown?.food);
  const transport = parseCost(costBreakdown?.transport);
  const activities = parseCost(costBreakdown?.activities);
  const partsTotal = stay + food + transport + activities;

  if (safeTotal > 0 && partsTotal > 0) {
    const scale = safeTotal / partsTotal;
    const [finalStay, finalFood, finalTransport] = [stay, food, transport].map((value) => Math.max(0, Math.round(value * scale)));
    return {
      stay: finalStay,
      food: finalFood,
      transport: finalTransport,
      activities: Math.max(0, safeTotal - finalStay - finalFood - finalTransport),
      total: safeTotal,
      currency: costBreakdown?.currency,
    };
  }

  const [finalStay, finalFood, finalTransport, finalActivities] = splitBudgetByWeights(safeTotal, [0.4, 0.24, 0.11, 0.25]);
  return {
    stay: finalStay,
    food: finalFood,
    transport: finalTransport,
    activities: finalActivities,
    total: safeTotal,
    currency: costBreakdown?.currency,
  };
}

const DESTINATION_PLACE_LIBRARY = {
  chennai: {
    morning: ["Kapaleeshwarar Temple", "San Thome Basilica", "Marina Beach promenade", "Government Museum Chennai"],
    afternoon: ["Murugan Idli Shop", "DakshinaChitra", "Kalakshetra Foundation", "Egmore Museum galleries"],
    evening: ["Besant Nagar Beach", "Broken Bridge viewpoint", "Mylapore tank streets", "Elliot's Beach"],
    night: ["Amethyst cafe courtyard", "Pondy Bazaar evening walk", "Adyar riverside dining", "Mylapore heritage dinner"],
  },
  canada: {
    morning: ["Old Montreal waterfront", "Distillery District", "Stanley Park seawall", "Parliament Hill"],
    afternoon: ["St. Lawrence Market", "Granville Island food hall", "Royal Ontario Museum", "ByWard Market"],
    evening: ["English Bay", "Toronto Islands skyline point", "Old Quebec streets", "Montreal Old Port"],
    night: ["Harbourfront dinner", "Old Town jazz venue", "Riverside evening food hall", "Local craft beer district"],
  },
  dubai: {
    morning: ["Burj Khalifa district", "Al Fahidi Historical Neighborhood", "Jumeirah Mosque", "Dubai Fountain boardwalk"],
    afternoon: ["Museum of the Future", "Alserkal Avenue", "Al Seef waterfront", "Kite Beach cafes"],
    evening: ["Palm West Beach", "Bluewaters boardwalk", "Madinat Jumeirah canals", "Dubai Marina promenade"],
    night: ["Souk Madinat dinner", "Downtown skyline lounge", "JBR dining strip", "La Mer evening stroll"],
  },
  london: {
    morning: ["The Regent's Park Mosque", "St Paul's Cathedral", "Westminster Abbey", "Tower Bridge riverside"],
    afternoon: ["Borough Market halal kitchens", "The British Museum", "Leadenhall Market", "South Kensington museums"],
    evening: ["South Bank promenade", "Kensington Gardens", "Tower Bridge sunset walk", "Covent Garden lanes"],
    night: ["Dishoom Covent Garden", "The Great Chase halal fine dining", "South Bank family dinner", "Mayfair evening tea lounge"],
  },
  paris: {
    morning: ["Grande Mosquee de Paris", "Sainte-Chapelle", "Tuileries Garden", "Montmartre sunrise streets"],
    afternoon: ["Louvre Museum", "Le Marais halal bistros", "Galeries Lafayette", "Musee d'Orsay"],
    evening: ["Seine river promenade", "Pont Alexandre III", "Palais Royal arcades", "Champ de Mars golden hour"],
    night: ["Le Confidentiel halal dining", "Saint-Germain dessert salon", "Seine dinner cruise", "Opera district evening stroll"],
  },
  kyoto: {
    morning: ["Fushimi Inari Taisha", "Kiyomizu-dera", "Yasaka Shrine", "Sannenzaka streets"],
    afternoon: ["Nishiki Market", "Kyoto National Museum", "Nanzen-ji precinct", "Gion tea house"],
    evening: ["Kamo River promenade", "Arashiyama riverbank", "Maruyama Park", "Gion lantern walk"],
    night: ["Pontocho riverside dining", "Kiyamachi nightlife strip", "Traditional machiya stay", "Gion dinner alley"],
  },
  goa: {
    morning: ["Fontainhas Latin Quarter", "Basilica of Bom Jesus", "Se Cathedral", "Reis Magos Fort"],
    afternoon: ["Mapusa local lunch", "Candolim cafe trail", "Divar Island village roads", "Anjuna flea area"],
    evening: ["Chapora Fort", "Ashwem beach", "Palolem sands", "Sinquerim waterfront"],
    night: ["Baga lane dinner", "Vagator clifftop dining", "Mandovi river cruise", "Feni tasting bar"],
  },
  ooty: {
    morning: ["Government Botanical Garden", "Ooty Lake promenade", "Doddabetta Peak", "St. Stephen's Church"],
    afternoon: ["Tea Factory Museum", "Charing Cross food stop", "Thread Garden", "Rose Garden Ooty"],
    evening: ["Wenlock Downs", "Pykara viewpoint", "Tea estate valley trail", "Boat House lakeside walk"],
    night: ["Upper Bazaar dinner stop", "Colonial tea lounge", "Bonfire hillside retreat", "Town market dessert stop"],
  },
  kodaikanal: {
    morning: ["Coaker's Walk", "Bryant Park", "Kodaikanal Lake", "Pillar Rocks"],
    afternoon: ["Chettiar Park", "Homemade chocolate lane", "Green Valley View", "Pine Forest trail"],
    evening: ["Silver Cascade viewpoint", "Upper Lake View", "Lake road cycling loop", "Sunset ridge trail"],
    night: ["Lakeside dinner", "Bazaar road cafe", "Campfire lookout", "Quiet hill stay"],
  },
  pondicherry: {
    morning: ["Promenade Beach", "French Quarter streets", "Sri Aurobindo Ashram", "Basilica of the Sacred Heart"],
    afternoon: ["White Town cafe trail", "Pondicherry Museum", "Auroville Bakery", "Botanical Garden"],
    evening: ["Rock Beach sunset walk", "Serenity Beach", "Heritage lane photo stop", "Goubert Avenue"],
    night: ["White Town dinner", "Rooftop creperie", "Beach road gelato stop", "French colony night stroll"],
  },
  puducherry: {
    morning: ["Promenade Beach", "French Quarter streets", "Sri Aurobindo Ashram", "Basilica of the Sacred Heart"],
    afternoon: ["White Town cafe trail", "Pondicherry Museum", "Auroville Bakery", "Botanical Garden"],
    evening: ["Rock Beach sunset walk", "Serenity Beach", "Heritage lane photo stop", "Goubert Avenue"],
    night: ["White Town dinner", "Rooftop creperie", "Beach road gelato stop", "French colony night stroll"],
  },
};

export const STYLE_TRAVEL_PROFILES = {
  luxury: {
    aliases: ["luxury", "premium"],
    pace: "refined",
    placeBias: ["stay", "food", "culture", "coastal", "generic"],
    dayThemes: [
      "Arrival & Signature Comfort",
      "Heritage With Private Touches",
      "Fine Dining & Design Districts",
      "Scenic Leisure & Soft Luxury",
      "Curated Shopping & Lounge Moments",
      "Slow Culture & Premium Corners",
      "Waterfront Indulgence",
      "Grand Finale & Night Ambience",
    ],
    slotLabels: {
      morning: ["Suite Arrival Ritual", "Elegant Heritage Opening", "Private Morning Circuit", "Spa & Slow Start"],
      afternoon: ["Chef-Led Lunch Chapter", "Boutique Culture Session", "Private Gallery Flow", "Refined District Pause"],
      evening: ["Golden Hour Terrace Drift", "Waterfront Aperitif Route", "Sunset Lounge Sequence", "Evening Signature Views"],
      night: ["Fine Dining Experience", "Rooftop Night Finish", "Boutique Stay Wind-Down", "After-Dark Luxury Pause"],
    },
    narrative: {
      schedule: [
        "Keep this chapter polished and low-friction, with one standout moment instead of too many small pivots.",
        "Favor comfort, atmosphere, and one premium highlight over checklist pacing.",
      ],
      ideas: [
        "For a luxury rhythm, let the strongest single experience lead instead of stacking too many medium ones.",
        "A memorable luxury day usually lands best when one stay, dining, or sunset moment becomes the anchor.",
      ],
    },
  },
  cultural: {
    aliases: ["cultural", "history", "heritage"],
    pace: "immersive",
    placeBias: ["culture", "sacred", "market", "generic", "food"],
    dayThemes: [
      "Arrival & Historic Orientation",
      "Sacred Heritage Trail",
      "Museums & Story Layers",
      "Old Quarter Deep Dive",
      "Markets, Craft & Living Culture",
      "Local Traditions & Archive Moments",
      "Architecture & Quiet Details",
      "Farewell Through Heritage Streets",
    ],
    slotLabels: {
      morning: ["Monument Opening Loop", "Temple & Heritage Start", "Old Quarter Orientation", "Museum Preview Route"],
      afternoon: ["Historic Core Deep Dive", "Archive & Gallery Session", "Craft & Storytelling Stop", "Culture District Walk"],
      evening: ["Lantern Street Stroll", "Golden Hour Heritage Circuit", "Waterfront History Pause", "Twilight Facade Walk"],
      night: ["Cultural Dinner Session", "Classical Evening Finish", "Heritage Stay Wind-Down", "Old Town Night Pause"],
    },
    narrative: {
      schedule: [
        "Use this stop to understand the story of the place, not just its most photographed angle.",
        "Let one monument, archive, or sacred detail shape the pace here.",
      ],
      ideas: [
        "For a history-led trip, pair the formal site with one surrounding street or bookshop so the story feels lived-in.",
        "The most memorable cultural days usually combine one major anchor with one quieter, more local follow-up.",
      ],
    },
  },
  adventure: {
    aliases: ["adventure", "active"],
    pace: "energetic",
    placeBias: ["nature", "coastal", "generic", "market", "food"],
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
    slotLabels: {
      morning: ["Sunrise Trail Start", "Lookout & Active Warm-Up", "Outdoor Discovery Loop", "Early Scenic Push"],
      afternoon: ["Adrenaline Window", "Cliffside or Forest Route", "Active Midday Detour", "Terrain Shift Session"],
      evening: ["Golden Hour Recovery Walk", "Viewpoint Cool-Down", "Adventure Debrief Stroll", "Sunset Edge Route"],
      night: ["Campfire or Lounge Finish", "Recovery Dinner Stop", "Low-Key Night Reset", "Rest & Recharge Sequence"],
    },
    narrative: {
      schedule: [
        "Keep the energy front-loaded, then protect recovery so the next day still feels strong.",
        "Adventure days work best when you alternate high-output windows with calmer reset pockets.",
      ],
      ideas: [
        "A strong adventure rhythm usually earns one proper recovery stop later in the day.",
        "Use the first half for movement and the second half for scenery, food, or reset so the trip can sustain itself.",
      ],
    },
  },
  cinematic: {
    aliases: ["cinematic", "scenery", "photography"],
    pace: "visual",
    placeBias: ["coastal", "nature", "culture", "generic", "stay"],
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
    slotLabels: {
      morning: ["Sunrise Frame Walk", "Panoramic Opening Loop", "Soft-Light View Route", "Landmark Lens Start"],
      afternoon: ["Texture & Detail Session", "Landscape Midday Sweep", "Photo Story Stopover", "Visual Culture Circuit"],
      evening: ["Golden Hour Walk", "Sunset Frame Sequence", "Blue Hour Streets", "Waterside View Drift"],
      night: ["Night Photography Pause", "Skyline Reflection Finish", "City Lights Wind-Down", "After-Dark Composition Stop"],
    },
    narrative: {
      schedule: [
        "Let light and vantage points decide the pace here more than the map does.",
        "Treat this stop like a visual chapter, with time for both the obvious frame and the quieter second angle.",
      ],
      ideas: [
        "Scenery-led days feel strongest when you save room for a second look after the first good frame.",
        "The best cinematic memories usually come from timing, light, and one slower pause, not just famous coordinates.",
      ],
    },
  },
  urban: {
    aliases: ["urban", "city"],
    pace: "dynamic",
    placeBias: ["market", "food", "culture", "generic", "stay"],
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
    slotLabels: {
      morning: ["City Pulse Start", "Boulevard Discovery", "Modern District Opening", "Cafe Quarter Loop"],
      afternoon: ["Design & Market Circuit", "Urban Lunch Discovery", "Creative Quarter Walk", "Retail & Culture Session"],
      evening: ["Skyline Drift", "Riverside City Walk", "Lifestyle District Stroll", "Golden Hour Urban Flow"],
      night: ["Nightlife Preview", "Late Dining Sequence", "City Lights Finish", "Downtown Wind-Down"],
    },
    narrative: {
      schedule: [
        "Use this stop to feel the city in motion, not just to tick off a landmark.",
        "Urban pacing works best when one district carries multiple small discoveries in one walkable sweep.",
      ],
      ideas: [
        "The strongest urban days usually combine one modern district, one food pause, and one street-level surprise.",
        "Avoid over-transferring; let one neighborhood reveal its own layers before you jump again.",
      ],
    },
  },
  wellness: {
    aliases: ["wellness", "relaxation"],
    pace: "restorative",
    placeBias: ["nature", "stay", "coastal", "sacred", "food"],
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
    slotLabels: {
      morning: ["Mindful Opening Walk", "Yoga & Sunrise Reset", "Garden Calm Start", "Quiet Ritual Loop"],
      afternoon: ["Spa or Tea Chapter", "Slow Nature Session", "Restorative Lunch Pause", "Gentle Cultural Drift"],
      evening: ["Sunset Unwind Route", "Calm Waterfront Drift", "Soft-Light Reflection Walk", "Quiet District Pause"],
      night: ["Sleep-First Wind-Down", "Tea & Recovery Finish", "Low-Stimulus Evening Close", "Stay Reset Sequence"],
    },
    narrative: {
      schedule: [
        "Protect spaciousness here; the point is to leave more grounded than when you arrived.",
        "Wellness pacing works best when you deliberately stop adding tasks once the rhythm feels right.",
      ],
      ideas: [
        "A wellness trip gets better when one calm place is allowed to be enough.",
        "Use meals, gardens, and slower walks as part of the recovery plan, not as filler between bigger stops.",
      ],
    },
  },
  halal: {
    aliases: ["halal", "halalfriendly"],
    pace: "considered",
    placeBias: ["sacred", "food", "culture", "market", "stay"],
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
    slotLabels: {
      morning: ["Prayer-Space Start", "Mosque & Heritage Loop", "Quiet Family Walk", "Sacred District Opening"],
      afternoon: ["Halal Lunch Route", "Family-Friendly Culture Stop", "Community Market Session", "Comfort-Led Midday Pause"],
      evening: ["Sunset & Prayer-Aware Drift", "Waterfront Family Stroll", "Cultural Evening Pause", "After-Maghrib Walk"],
      night: ["Halal Signature Dinner", "Gentle Family Close", "Stay & Reflection Finish", "Calm Night Circuit"],
    },
    narrative: {
      schedule: [
        "Keep the routing comfortable, halal-food aware, and respectful of prayer timing and family ease.",
        "This day works best when comfort, access, and atmosphere stay in balance.",
      ],
      ideas: [
        "For a halal-friendly trip, let meal certainty and prayer-space access guide the flow instead of forcing detours later.",
        "Family-comfort pacing usually creates a better day than trying to maximize the number of stops.",
      ],
    },
  },
  coastal: {
    aliases: ["coastal", "beach"],
    pace: "breezy",
    placeBias: ["coastal", "food", "nature", "stay", "market"],
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
    slotLabels: {
      morning: ["Beach Opening Loop", "Promenade Start", "Waterfront Reset", "Sea-Breeze Walk"],
      afternoon: ["Seafood Lunch Drift", "Harbour Discovery", "Boardwalk Session", "Coastal Midday Pause"],
      evening: ["Sunset Shore Route", "Pier & Viewpoint Circuit", "Golden Hour Waterfront", "Seaside Wind-Down"],
      night: ["Beachfront Dinner Finish", "Late Promenade Pause", "Coastal Stay Sequence", "After-Dark Sea View Close"],
    },
    narrative: {
      schedule: [
        "Coastal days improve when you let the shoreline set the tempo instead of racing inland and back.",
        "Use the waterfront as the spine of the day and keep the transitions easy.",
      ],
      ideas: [
        "A strong coastal day often blends one scenic walk, one good food pause, and one light change at the water.",
        "Save enough energy for the evening edge of the coast; that is often when the place feels most itself.",
      ],
    },
  },
  balanced: {
    aliases: ["balanced", "_default"],
    pace: "balanced",
    placeBias: ["culture", "coastal", "food", "market", "nature", "generic"],
    dayThemes: [
      "Arrival & First Impressions",
      "Heritage & Culture",
      "Hidden Gems & Local Life",
      "Scenic Highlights",
      "Adventure Day",
      "Leisure & Relaxation",
      "Food & Evening Atmosphere",
      "Farewell Highlights",
    ],
    slotLabels: {
      morning: ["Sunrise Heritage Circuit", "Temple & Landmark Trail", "Quiet Neighborhood Walk", "Gardens & Facades Start"],
      afternoon: ["Museum & Culture Circuit", "Lunch Discovery Route", "Craft & Gallery Session", "Historic Core Deep Dive"],
      evening: ["Golden Hour Walk", "Sunset Viewpoint Route", "Cultural Quarter Stroll", "Promenade & Cafe Loop"],
      night: ["Signature Dinner Stop", "Boutique Stay Experience", "Skyline Night Circuit", "Heritage Hotel Wind-Down"],
    },
    narrative: {
      schedule: [],
      ideas: [],
    },
  },
};

function cleanDisplayText(value) {
  return String(value || "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTravelLine(value) {
  const text = cleanDisplayText(value);
  if (!text) return "";

  const simple = text.match(/^(\d+)\s*m(?:in)?\s+([a-zA-Z]+)$/i);
  if (simple) {
    const [, minutes, mode] = simple;
    return `Getting there: about ${minutes} min by ${mode.toLowerCase()}`;
  }

  return /^getting there:/i.test(text) ? text : `Getting there: ${text}`;
}

function formatDurationLine(value) {
  const text = cleanDisplayText(value);
  if (!text) return "";

  const hoursOnly = text.match(/^(\d+(?:\.\d+)?)\s*h$/i);
  if (hoursOnly) {
    return `Recommended rhythm: plan for about ${hoursOnly[1]} hours here`;
  }

  const hourRange = text.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*h$/i);
  if (hourRange) {
    return `Recommended rhythm: plan for ${hourRange[1]}-${hourRange[2]} hours here`;
  }

  return /^recommended rhythm:/i.test(text) ? text : `Recommended rhythm: ${text}`;
}

function getDestinationLibraryKey(destination = "") {
  const lower = cleanDisplayText(destination).toLowerCase();
  return Object.keys(DESTINATION_PLACE_LIBRARY).find((key) => lower.includes(key)) || null;
}

function getSlotBucket(slotKey = "") {
  if (/^morning/i.test(slotKey)) return "morning";
  if (/^afternoon/i.test(slotKey)) return "afternoon";
  if (/^evening/i.test(slotKey)) return "evening";
  if (/^night/i.test(slotKey)) return "night";
  return "morning";
}

function compactPlaceName(value) {
  const cleaned = cleanDisplayText(value)
    .replace(/\bat\s+/gi, "")
    .replace(/\bin\s+/gi, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .trim();

  if (!cleaned) return "";
  return cleaned.split(",")[0].trim();
}

function extractSubjectPlaceName(value = "") {
  const cleaned = cleanDisplayText(value);
  if (!cleaned) return "";
  const match = cleaned.match(/^(.{3,90}?)\s+(?:is|offers|sits|stands|serves|gives|marks|anchors)\b/i);
  return compactPlaceName(match?.[1] || "");
}

function getAreaLabel(placeName = "", destination = "") {
  const place = cleanDisplayText(placeName);
  const dest = cleanDisplayText(destination);
  const placeParts = place.split(",").map((part) => part.trim()).filter(Boolean);
  const destParts = dest.split(",").map((part) => part.trim()).filter(Boolean);
  return placeParts[1] || destParts[0] || placeParts[0] || "the area";
}

function buildUniqueLines(items = []) {
  const seen = new Set();
  return items
    .map((item) => cleanDisplayText(item))
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function pickVariant(list = [], seed = 0, fallback = []) {
  const source = Array.isArray(list) && list.length ? list : fallback;
  if (!source.length) return [];
  return source[Math.abs(seed) % source.length] || source[0];
}

function hashSeed(value = "") {
  return String(value)
    .split("")
    .reduce((acc, ch, index) => ((acc * 33) + ch.charCodeAt(0) + index) >>> 0, 5381);
}

export function resolveStyleProfileKey(style = "") {
  const normalized = cleanDisplayText(style).toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) return "balanced";
  const match = Object.entries(STYLE_TRAVEL_PROFILES).find(([, profile]) =>
    [profile.aliases || [], [profile.aliases?.[0]], [normalized]].flat().filter(Boolean).some((alias) =>
      normalized === String(alias).toLowerCase().replace(/[^a-z]/g, ""),
    ));
  return match?.[0] || "balanced";
}

export function getStyleTravelProfile(style = "") {
  return STYLE_TRAVEL_PROFILES[resolveStyleProfileKey(style)] || STYLE_TRAVEL_PROFILES.balanced;
}

export function getTripPhase(dayNumber = 1, totalDays = 1) {
  const day = Math.max(1, Number(dayNumber) || 1);
  const total = Math.max(1, Number(totalDays) || 1);
  if (day === 1) return "arrival";
  if (day === total) return "finale";
  if (total <= 4) return day === 2 ? "core" : "deep";
  const progress = day / total;
  if (progress <= 0.28) return "core";
  if (progress <= 0.6) return "deep";
  if (progress <= 0.82) return "reset";
  return "finale-build";
}

export function buildStyleAwareDayTheme(style = "", dayNumber = 1, totalDays = 1) {
  const profile = getStyleTravelProfile(style);
  const phase = getTripPhase(dayNumber, totalDays);
  const themes = Array.isArray(profile.dayThemes) && profile.dayThemes.length
    ? profile.dayThemes
    : STYLE_TRAVEL_PROFILES.balanced.dayThemes;
  const base = themes[(Math.max(1, dayNumber) - 1) % themes.length] || `Day ${dayNumber}`;
  const phaseSuffix = {
    arrival: "",
    core: "",
    deep: "",
    reset: " - Slower Chapter",
    "finale-build": " - Closing Build",
    finale: " - Grand Finish",
  }[phase] || "";
  return `${base}${phaseSuffix}`;
}

function pickOne(list = [], seed = 0, fallback = "") {
  const source = Array.isArray(list) && list.length ? list : fallback ? [fallback] : [];
  if (!source.length) return "";
  return source[Math.abs(seed) % source.length] || source[0];
}

function pickMany(list = [], count = 3, seed = 0) {
  const source = Array.isArray(list) ? list.filter(Boolean) : [];
  if (!source.length) return [];
  const picked = [];
  const used = new Set();
  for (let i = 0; i < Math.min(count, source.length); i += 1) {
    const baseIndex = Math.abs(seed + i * 7) % source.length;
    let finalIndex = baseIndex;
    let offset = 0;
    while (used.has(finalIndex) && offset < source.length) {
      offset += 1;
      finalIndex = (baseIndex + offset) % source.length;
    }
    used.add(finalIndex);
    picked.push(source[finalIndex]);
  }
  return picked;
}

function fillTemplate(template = "", values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_match, key) => values[key] ?? "");
}

function inferPlaceProfile(sourceText = "", slotKey = "") {
  const text = String(sourceText || "").toLowerCase();
  const isTemple = /temple|mosque|church|shrine|mandir|masjid|kovil|pagoda|basilica|cathedral|dargah|monastery/i.test(text);
  const isBeach = /beach|coast|shore|bay|promenade|marina|pier|waterfront|lake|river|harbor|harbour|lagoon/i.test(text);
  const isMarket = /market|bazaar|bazar|souk|mall|shopping|vendor|street food|handloom|textile/i.test(text);
  const isFood = /restaurant|cafe|coffee|dining|food|eat|kitchen|bistro|tea|chai|bakery|dhaba|brunch|grill/i.test(text);
  const isMuseum = /museum|gallery|art|heritage|history|palace|fort|castle|exhibit|archive|monument|memorial/i.test(text);
  const isPark = /park|garden|forest|nature|wildlife|botanical|hill|mountain|valley|viewpoint|trail|reserve/i.test(text);
  const isStay = /hotel|suite|room|resort|stay|villa|inn|lodge|ryokan|residence|retreat|hostel/i.test(text);
  const isNightSlot = /^night/i.test(slotKey);

  if (isStay || isNightSlot) return "stay";
  if (isTemple) return "sacred";
  if (isBeach) return "coastal";
  if (isMarket) return "market";
  if (isFood) return "food";
  if (isMuseum) return "culture";
  if (isPark) return "nature";
  return "generic";
}

function isGenericPlaceLabel(value = "", destination = "") {
  const text = cleanDisplayText(value).toLowerCase();
  const dest = cleanDisplayText(destination).toLowerCase();
  if (!text) return true;

  const genericPatterns = [
    /\bmorning exploration\b/,
    /\bguided city walk\b/,
    /\bhistoric district tour\b/,
    /\bcultural deep dive\b/,
    /\blocal gastronomy lunch\b/,
    /\bmain square discovery\b/,
    /\bsunset vistas\b/,
    /\batmospheric evening stroll\b/,
    /\bpremium dining experience\b/,
    /\bboutique hotel rest\b/,
    /\bcity lights tour\b/,
    /\bcurated stop\b/,
    /\broute \d+\b/,
    /\bprayer-aware orientation\b/,
    /\bstory-led\b/,
    /\bmidday flow\b/,
    /\bevening close\b/,
    /\bgolden hour\b/,
    /\bneighborhood stroll\b/,
    /\bdining experience\b/,
    /\bstay wind-down\b/,
    /\bsunrise orientation\b/,
    /\bsunset views\b/,
  ];

  if (genericPatterns.some((pattern) => pattern.test(text))) return true;
  if (dest && text.startsWith(dest) && /(orientation|flow|walk|views|cuisine|dining|wind-?down|route|start|close|experience|chapter)/.test(text)) {
    return true;
  }
  return !!dest && text === dest;
}

export function resolvePlannedPlaceName(placeName = "", destination = "", slotKey = "", fallbackIndex = 0) {
  const cleaned = compactPlaceName(placeName);
  if (cleaned && !isGenericPlaceLabel(cleaned, destination)) return cleaned;

  const destinationKey = getDestinationLibraryKey(destination);
  const slotBucket = getSlotBucket(slotKey);
  const pool = destinationKey ? DESTINATION_PLACE_LIBRARY[destinationKey]?.[slotBucket] : null;
  if (Array.isArray(pool) && pool.length) {
    return pool[Math.abs(fallbackIndex) % pool.length];
  }

  return cleaned || compactPlaceName(destination) || "Local stop";
}

export function pickBestActivityPlace(activity = {}, destination = "", slotKey = "", fallbackIndex = 0) {
  const candidates = [
    activity?.place,
    activity?.title,
    activity?.name,
    activity?.location,
    extractSubjectPlaceName(activity?.description),
    extractSubjectPlaceName(activity?.activity),
  ]
    .map((value) => compactPlaceName(value))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);

  const exact = candidates.find((value) => !isGenericPlaceLabel(value, destination));
  if (exact) return exact;

  const firstCandidate = candidates[0] || "";
  return resolvePlannedPlaceName(firstCandidate, destination, slotKey, fallbackIndex);
}

function isStreetFindCandidateUseful(value = "", resolvedPlace = "", destination = "") {
  const text = cleanDisplayText(value).toLowerCase();
  const place = cleanDisplayText(resolvedPlace).toLowerCase();
  const dest = cleanDisplayText(destination).toLowerCase();
  if (!text) return false;
  if (/recommended rhythm|getting there|safety tip|cultural note|preference focus|transport/i.test(text)) return false;
  if (/surroundings|walkable .* segment|photo point|local area|city center/i.test(text) && !(place && text.includes(place)) && !(dest && text.includes(dest))) return false;
  return true;
}

export function buildStreetFindChips(activityData = {}, fallbackContent = {}, context = {}) {
  const { placeName = "", destination = "", slotKey = "", fallbackIndex = 0 } = context;
  const resolvedPlace = resolvePlannedPlaceName(placeName, destination, slotKey, fallbackIndex);
  const primary = buildUniqueLines([
    ...(Array.isArray(activityData.streetFinds) ? activityData.streetFinds : []),
    ...(Array.isArray(activityData.nearbyHighlights) ? activityData.nearbyHighlights : []),
    activityData.localFood || "",
  ]).filter((item) => isStreetFindCandidateUseful(item, resolvedPlace, destination));
  const fallback = buildUniqueLines(Array.isArray(fallbackContent.streetFinds) ? fallbackContent.streetFinds : []);
  const labels = (primary.length ? primary : fallback).slice(0, 6);

  return labels.map((label) => ({
    label,
    query: `${label} near ${resolvedPlace}, ${destination}`.replace(/\s+/g, " ").trim(),
  }));
}

export function generatePlaceCardFallbackContent(placeName = "", activity = "", destination = "", slotKey = "", options = {}) {
  const place = resolvePlannedPlaceName(placeName || activity, destination, slotKey);
  const area = getAreaLabel(placeName, destination);
  const sourceText = `${placeName} ${activity}`.toLowerCase();
  const seed = hashSeed(`${place}|${slotKey}|${destination}|${activity}`);
  const profileKey = resolveStyleProfileKey(options.travelStyle);
  const styleProfile = getStyleTravelProfile(profileKey);
  const tripPhase = getTripPhase(options.dayNumber, options.totalDays);
  const times = {
    morning: ["8:00 AM", "9:15 AM", "10:30 AM"],
    morningActivity: ["10:45 AM", "11:30 AM", "12:15 PM"],
    afternoon: ["12:30 PM", "1:30 PM", "2:30 PM"],
    afternoonActivity: ["2:45 PM", "3:45 PM", "4:45 PM"],
    evening: ["5:30 PM", "6:30 PM", "7:30 PM"],
    eveningActivity: ["6:45 PM", "7:45 PM", "8:45 PM"],
    night: ["8:15 PM", "9:00 PM", "10:00 PM"],
    nightActivity: ["9:15 PM", "10:00 PM", "10:45 PM"],
  }[slotKey] || ["10:00 AM", "11:00 AM", "12:00 PM"];

  const profile = inferPlaceProfile(sourceText, slotKey);
  const areaLabel = cleanDisplayText(area) || cleanDisplayText(destination).split(",")[0] || "the surrounding area";
  const vars = {
    place,
    area: areaLabel,
    destination: cleanDisplayText(destination).split(",")[0] || areaLabel,
    t0: times[0],
    t1: times[1],
    t2: times[2],
  };

  const banks = {
    stay: {
      scheduleOpen: [
        "Start around {t0} by settling into {place} and letting the property itself shape the mood of the stop.",
        "Reach {place} near {t0} and use the first stretch to absorb the feel of the stay before adding anything else.",
        "Ease into {place} around {t0} and treat this as your reset point, not just a place to sleep.",
        "Begin around {t0} with a slower arrival at {place}, giving the stay room to feel like part of the journey.",
      ],
      scheduleFocus: [
        "By {t1}, lean into the best part of the stay experience, whether that means a lounge pause, skyline angle, courtyard, or quieter heritage detail.",
        "Around {t1}, focus on one memorable comfort moment at {place} instead of rushing straight through the stop.",
        "Use the {t1} window to enjoy the signature atmosphere of {place}, from its calmer corners to the spaces that make it worth staying in.",
        "Around {t1}, keep the rhythm soft and give your attention to the most rewarding in-house corner, terrace, or unwind point.",
      ],
      scheduleClose: [
        "Toward {t2}, step out around {area} for a short neighbourhood loop or ease back indoors for a gentler night close.",
        "Closer to {t2}, choose between a nearby stroll in {area} and a quieter return indoors so the day closes without friction.",
        "By {t2}, let the stop taper into either a short local walk near {area} or an easy final unwind back at the property.",
        "Toward {t2}, keep movement minimal and use the surrounding block of {area} only if it adds to the calm rather than breaking it.",
      ],
      streetFinds: [
        "{place} lobby lounge",
        "{place} tea service corner",
        "{place} terrace or rooftop pocket",
        "{area} quiet evening cafe",
        "{area} softly lit side street",
        "{area} short heritage walk loop",
      ],
      ideas: [
        "Use {place} as a reset point, not just a sleep stop, and give yourself one unhurried hour to actually enjoy it.",
        "Ask the staff at {place} which nearby lane or block in {area} feels best after dark for a short, low-stress stroll.",
        "The strongest hotel moments usually come from one small ritual: tea, skyline view, courtyard pause, or simply the quietest corner.",
        "If {place} has a rooftop, lounge, or heritage common area, make that your final memorable pause instead of forcing another big activity.",
        "Treat the stay itself as part of the trip story, especially if the mood in {area} is better explored on foot than by another long transfer.",
      ],
    },
    sacred: {
      scheduleOpen: [
        "Reach {place} near {t0} to catch the area while it still feels more reflective and less compressed.",
        "Start around {t0} at {place} and use the quieter first minutes to settle into the tone before the flow thickens.",
        "Arrive at {place} around {t0} so the sacred precinct still has enough calm to read the setting properly.",
        "Use the {t0} window to enter {place} before the busiest rhythm takes over the surrounding streets.",
      ],
      scheduleFocus: [
        "By {t1}, give your best time to the central shrine, prayer hall, or symbolic core rather than trying to rush every corner.",
        "Around {t1}, focus on the strongest ritual or architectural layer of {place} and let that shape the stop.",
        "Use the {t1} stretch for the most meaningful sacred courtyard, hall, or ceremonial detail instead of over-scattering your attention.",
        "By {t1}, narrow your energy to the central spiritual or visual anchor of {place}.",
      ],
      scheduleClose: [
        "Around {t2}, use the outer streets near {area} for quieter details and more human-scale moments.",
        "Toward {t2}, drift into the edges of {area} where counters, side shrines, and smaller rituals tend to feel more grounded.",
        "By {t2}, let the formal visit soften into the surrounding lanes around {area} rather than ending too abruptly.",
        "Closer to {t2}, use the outer approach around {area} for slower details most visitors skim past.",
      ],
      streetFinds: [
        "{place} quieter side shrine",
        "{area} offering counter",
        "{area} prayer goods stall",
        "{place} outer courtyard lane",
        "{area} flower or incense seller",
        "{place} side entrance detail",
      ],
      ideas: [
        "Use the first minutes at {place} to settle into the tone before reaching for photos.",
        "The small counters and side shrines around {area} often hold the most grounded local texture.",
        "Ask which entrance or path locals usually prefer at {place}; it often changes the feel of the stop completely.",
        "One quieter lane around {place} usually says more than the busiest central frontage.",
        "If the main sacred core feels crowded, look at the outer ritual details in {area} before moving on.",
      ],
    },
    coastal: {
      scheduleOpen: [
        "Start around {t0} at {place} and let the first stretch stay loose enough for light, breeze, and orientation.",
        "Reach {place} near {t0} while the waterfront still feels more open than crowded.",
        "Use the {t0} window to take in {place} before the stop turns into pure foot traffic.",
        "Begin around {t0} with the calmer edge of {place} rather than the most obvious front-facing pocket.",
      ],
      scheduleFocus: [
        "By {t1}, focus on the most scenic edge of {place} rather than staying fixed in the busiest patch.",
        "Around {t1}, give your attention to the stretch of {place} that best captures its mood, not just its headline angle.",
        "Use {t1} to lean into the strongest view line, promenade pocket, or waterfront rhythm at {place}.",
        "Around {t1}, let the best visual part of {place} carry the stop instead of chasing every angle.",
      ],
      scheduleClose: [
        "Toward {t2}, peel into the promenade or back streets around {area} for snacks, views, and smaller local finds.",
        "By {t2}, let the stop loosen into a nearby cafe, tea point, or slower wander beyond the main edge.",
        "Around {t2}, use the streets behind {area} for a softer second chapter to the waterfront stop.",
        "Closer to {t2}, move just beyond the obvious frontage of {place} for a more grounded close.",
      ],
      streetFinds: [
        "{place} promenade snack carts",
        "{place} quieter waterfront edge",
        "{area} seaside cafe",
        "{area} sunset chai point",
        "{place} shell or craft stall",
        "{place} lookout rail or jetty",
      ],
      ideas: [
        "Walk a little past the busiest pocket of {place}; that is usually where the atmosphere gets better.",
        "Treat {place} as more than a photo stop by giving time to the edge streets and pause points too.",
        "The best coastal memories often come from combining the view with one small food or tea moment nearby.",
        "If the front side of {place} feels crowded, the return path through {area} often feels more personal and local.",
        "Stay long enough for the light to change once at {place}; that shift often transforms the mood.",
      ],
    },
    market: {
      scheduleOpen: [
        "Start around {t0} with a full first pass through {place} so the layout makes sense before you stop to buy.",
        "Begin near {t0} by reading the rhythm of {place} before making decisions too quickly.",
        "Use the opening window to orient yourself to {place} rather than spending at the first interesting stall.",
        "Reach {place} around {t0} and let the market reveal its shape before you commit to one lane.",
      ],
      scheduleFocus: [
        "By {t1}, return to the rows that felt strongest and give your energy to the best details instead of everything at once.",
        "Around {t1}, spend your main window on the section of {place} that feels most distinctive for craft, food, or atmosphere.",
        "Use {t1} for the lane or vendor cluster that actually makes {place} memorable rather than generic.",
        "By {t1}, narrow down to the strongest market pocket and let that shape the stop.",
      ],
      scheduleClose: [
        "Toward {t2}, use the deeper side rows near {area} for more local texture and better small finds.",
        "By {t2}, step into the narrower offshoot lanes where the market usually feels less polished and more real.",
        "Around {t2}, let the stop taper into the edges of {area} where everyday shopping still dominates.",
        "Closer to {t2}, use the back lanes near {area} for the kind of details that do not appear in the main strip.",
      ],
      streetFinds: [
        "{place} local produce row",
        "{place} spice and dry goods lane",
        "{place} hidden back-lane vendor",
        "{area} chai break point",
        "{area} everyday shopping row",
        "{place} craft or textile pocket",
      ],
      ideas: [
        "Walk {place} once without buying, then go back with clearer instincts.",
        "The more interesting vendors at {place} are often one lane deeper than the obvious first row.",
        "Ask what locals actually come to {place} for; that answer usually reveals the real specialty.",
        "The strongest market memories usually come from one conversation and one unplanned side purchase.",
        "If {place} feels too polished, look for the narrower row where everyday shopping still dominates.",
      ],
    },
    food: {
      scheduleOpen: [
        "Start around {t0} at {place}, settle in, and let the first few minutes tell you what the room or street corner does best.",
        "Begin near {t0} with a lighter first pass at {place} so you can read the menu or local cues properly.",
        "Reach {place} around {t0} and use the opening stretch to understand the mood before over-ordering.",
        "Use the first phase to let {place} reveal its pace, staff energy, and strongest menu signals.",
      ],
      scheduleFocus: [
        "By {t1}, commit to the strongest dish or tasting moment that makes {place} worth the stop.",
        "Around {t1}, focus on the signature order or freshest local recommendation instead of trying to do everything.",
        "Use {t1} for the course or dish that gives {place} its real character.",
        "By {t1}, let one standout food moment anchor the stop rather than turning it into a checklist meal.",
      ],
      scheduleClose: [
        "Toward {t2}, stretch the stop into dessert, tea, or a short food-street walk around {area}.",
        "Closer to {t2}, keep the rhythm easy with a nearby sweet, coffee, or late snack loop around {area}.",
        "By {t2}, let the meal taper naturally into a second, smaller flavour stop nearby.",
        "Around {t2}, use the surrounding block of {area} for one softer final bite or drink.",
      ],
      streetFinds: [
        "{place} dessert counter",
        "{place} house special corner",
        "{area} local tea or coffee point",
        "{area} nearby sweet shop",
        "{place} bakery or pastry shelf",
        "{area} short after-dinner lane",
      ],
      ideas: [
        "Pair your stop at {place} with one extra local bite nearby instead of making the whole meal happen in one place.",
        "Ask what regulars order first at {place}; it usually tells you more than the menu headings do.",
        "The best version of this stop is usually one signature dish plus one local recommendation.",
        "Let {place} set the tone, then use the next lane for a second, smaller food moment.",
        "If the energy is right, extend the stop into dessert, tea, or one quieter block around {area}.",
      ],
    },
    culture: {
      scheduleOpen: [
        "Start around {t0} at {place} and use the first phase to understand the context before chasing highlights.",
        "Begin near {t0} with the broadest orientation pass through {place}.",
        "Use the opening window to read the setting of {place} before narrowing into the headline rooms or galleries.",
        "Reach {place} around {t0} and let the stop open with context rather than immediacy.",
      ],
      scheduleFocus: [
        "By {t1}, narrow your attention to the strongest rooms, objects, or heritage details instead of trying to cover everything.",
        "Around {t1}, give your best time to the central galleries, courtyard, or historic spaces that define the stop.",
        "Use {t1} for the section of {place} that actually carries its story, rather than flattening the whole visit into one pace.",
        "By {t1}, let one core part of {place} take the lead instead of dispersing your attention.",
      ],
      scheduleClose: [
        "Toward {t2}, move outside the main path around {area} for architecture, bookshops, or quieter details.",
        "Around {t2}, use the edges of {place} and the neighbouring block for slower, less obvious discoveries.",
        "By {t2}, let the formal visit soften into the street life, side courts, or quieter frontage around {area}.",
        "Closer to {t2}, finish in the surrounding block of {area}, where the stop often makes more sense at human scale.",
      ],
      streetFinds: [
        "{place} side courtyard",
        "{place} archive wing or annex",
        "{area} architecture photo angle",
        "{area} heritage book stall",
        "{place} print or postcard corner",
        "{place} cafe or tea room",
      ],
      ideas: [
        "After the main galleries or heritage rooms, step outside {place} and look for the details most visitors walk past.",
        "Use one slower lap through {place} instead of trying to cover every section equally.",
        "The block around {place} often explains the stop better than the final label on the wall does.",
        "Ask staff which corner of {place} they would show first to someone who only had ten minutes.",
        "Pair the formal visit with a looser architecture walk around {area}.",
      ],
    },
    nature: {
      scheduleOpen: [
        "Start around {t0} at {place} from the widest or calmest approach so the setting opens up properly.",
        "Begin near {t0} by letting {place} reveal its pace before you pick a direction.",
        "Use the opening window to settle into the landscape of {place} rather than hurrying toward the obvious first viewpoint.",
        "Reach {place} around {t0} and let the stop breathe before turning it into a route.",
      ],
      scheduleFocus: [
        "By {t1}, give your strongest attention to the most scenic or rewarding part of the grounds.",
        "Around {t1}, focus on one lookout, trail, or garden pocket instead of scattering your energy.",
        "Use {t1} for the section of {place} that feels most restorative or visually distinct.",
        "By {t1}, commit to the most rewarding path or view line rather than chasing all of them.",
      ],
      scheduleClose: [
        "Toward {t2}, move into the quieter paths around {area} for a more unforced local rhythm.",
        "Around {t2}, use the softer corners of {place} for benches, tea, or one final slower loop.",
        "By {t2}, let the stop end in the calmest part of {area}, not the busiest return route.",
        "Closer to {t2}, keep the final movement gentle and let one quieter path carry the close.",
      ],
      streetFinds: [
        "{place} quiet lookout",
        "{area} tea kiosk",
        "{area} low-traffic trail edge",
        "{place} shaded bench line",
        "{place} cycle or buggy point",
        "{place} bird-view corner",
      ],
      ideas: [
        "Stay with one section of {place} long enough for it to feel slower and quieter.",
        "The most rewarding part of {place} is often not the first viewpoint but the second or third pause beyond it.",
        "Use benches, tea stalls, and shaded corners around {area} as part of the stop rather than rushing past them.",
        "Move through {place} in one deliberate loop instead of zig-zagging for every angle.",
        "Look where locals linger inside {place}; that is usually the most naturally rewarding zone.",
      ],
    },
    generic: {
      scheduleOpen: [
        "Start around {t0} at {place} and let the stop settle naturally before the busier rhythm arrives.",
        "Reach {place} near {t0} so the first phase feels more grounded than rushed.",
        "Use the opening window to orient yourself to {place} before chasing the obvious highlights.",
        "Begin near {t0} with a slower first pass through {place}.",
      ],
      scheduleFocus: [
        "By {t1}, spend your best energy on the part of {place} that gives it the clearest character.",
        "Around {t1}, focus on the strongest part of {place} rather than trying to flatten the whole stop into one pace.",
        "Use the {t1} stretch for the section of {place} that feels most distinct or memorable.",
        "By {t1}, let one core pocket of {place} take the lead.",
      ],
      scheduleClose: [
        "Toward {t2}, let the stop spill into the surrounding streets near {area} for smaller and more local details.",
        "Around {t2}, move into the nearby lanes around {area} where the place often feels more human-scale.",
        "By {t2}, use the last phase for edges, side lanes, and local texture rather than only the main frontage.",
        "Closer to {t2}, let the stop widen into whatever part of {area} feels less obvious and more lived-in.",
      ],
      streetFinds: [
        "{place} side lane cafe",
        "{place} tucked-away view line",
        "{area} local shopfront cluster",
        "{area} slower walking segment",
        "{place} smaller photo angle",
        "{area} tea or snack point",
      ],
      ideas: [
        "Use {place} as your anchor, then let the nearby streets around {area} supply the more memorable details.",
        "One extra lane beyond {place} usually tells you more than the most obvious frontage does.",
        "Ask a nearby vendor what people typically pair with a visit to {place}.",
        "Do not try to complete {place} too quickly; the best version of the stop usually comes from one slower detour.",
        "The best finds near {place} are often small, unplanned, and only one block away.",
      ],
    },
  };

  const bank = banks[profile] || banks.generic;
  const styleScheduleNudges = {
    luxury: {
      arrival: "Keep the first chapter polished and easy, with comfort and atmosphere doing more work than volume.",
      core: "Let one premium highlight lead this stop rather than over-stacking secondary detours.",
      deep: "Use the slower middle stretch for a more elevated or intimate version of the experience.",
      reset: "Protect ease and recovery so the day still feels refined rather than crowded.",
      finale: "Let the close feel memorable and polished rather than rushed.",
      "finale-build": "Build gently toward the evening so the final chapter lands with atmosphere.",
    },
    cultural: {
      arrival: "Treat this as an orientation stop that gives the wider story context for the days ahead.",
      core: "Give your time to the strongest heritage layer instead of flattening every detail into one pace.",
      deep: "Use the middle of the trip to notice quieter archive, ritual, or street-level details.",
      reset: "Keep the rhythm thoughtful and absorb what the surrounding area adds to the main site.",
      finale: "Close with one meaningful heritage or sacred detail that leaves a lasting story.",
      "finale-build": "Let the day build through story, context, and a calmer final cultural note.",
    },
    adventure: {
      arrival: "Front-load the energy while the body is fresh, then leave space to recover later.",
      core: "Use this slot for forward motion and stronger outdoor payoff rather than lingering too long.",
      deep: "Let the trip's middle days carry the most active or rewarding movement.",
      reset: "Pull back slightly here so the next active chapter still feels exciting.",
      finale: "Use the last chapter for one satisfying push followed by an easy scenic close.",
      "finale-build": "Build momentum without burning too much energy before the final highlight.",
    },
    cinematic: {
      arrival: "Let first impressions and changing light matter as much as the stop itself.",
      core: "Give yourself enough time to catch both the obvious frame and the quieter second angle.",
      deep: "Use the middle stretch for atmosphere, texture, and stronger visual storytelling.",
      reset: "Keep this chapter visually soft and less rushed so the scenery can carry it.",
      finale: "Save space for the final light or skyline moment to feel complete.",
      "finale-build": "Let the visuals build gradually so the best frame lands later in the day.",
    },
    urban: {
      arrival: "Let one district reveal multiple layers before you transfer again.",
      core: "Use this stop to feel the city in motion rather than just passing through it.",
      deep: "The middle of an urban trip is where side streets, design, and food usually open up best.",
      reset: "Soften the pace slightly so the city still feels exciting instead of noisy.",
      finale: "Close on a district with stronger night energy or skyline payoff.",
      "finale-build": "Let the city build toward the evening rather than peaking too early.",
    },
    wellness: {
      arrival: "Protect calm and spaciousness even if that means doing a little less here.",
      core: "Let the restorative part of the stop matter more than coverage.",
      deep: "Use the deeper middle days for nervous-system reset, nature, and softer rituals.",
      reset: "Treat this as a deliberate exhale, not just a gap between bigger activities.",
      finale: "Close with ease, comfort, and something you will actually remember as calming.",
      "finale-build": "Keep the energy gentle so the final day still feels restorative.",
    },
    halal: {
      arrival: "Keep the route easy, respectful, and comfortable from the start.",
      core: "Let prayer-space access, halal dining, and family ease quietly guide the pace.",
      deep: "The middle stretch is best for deeper cultural moments that still remain comfortable to navigate.",
      reset: "Use this slot to protect comfort rather than maximizing the number of stops.",
      finale: "Close in a way that feels calm, accessible, and easy to enjoy together.",
      "finale-build": "Build the day carefully so the final evening stays smooth and welcoming.",
    },
    coastal: {
      arrival: "Let the shoreline or sea-breeze setting establish the rhythm without forcing it.",
      core: "Use this chapter to stay close to the water or its atmosphere rather than zig-zagging inland.",
      deep: "The middle of a coastal trip works best when views, food, and slower walking blend together.",
      reset: "Keep the movement airy and easy so the coast still feels relaxing.",
      finale: "Save some energy for the final waterside light or evening edge.",
      "finale-build": "Build slowly toward the strongest waterfront or sunset moment later on.",
    },
  };
  const schedule = buildUniqueLines([
    fillTemplate(pickOne(bank.scheduleOpen, seed), vars),
    fillTemplate(pickOne(bank.scheduleFocus, seed + 11), vars),
    fillTemplate(pickOne(bank.scheduleClose, seed + 23), vars),
    styleScheduleNudges[profileKey]?.[tripPhase] || "",
    pickOne(styleProfile.narrative?.schedule, seed + 67),
  ]);
  const streetFinds = buildUniqueLines(
    pickMany(bank.streetFinds, 4, seed + 31).map((item) => fillTemplate(item, vars)),
  ).slice(0, 6);
  const ideas = buildUniqueLines([
    ...pickMany(bank.ideas, 4, seed + 47).map((item) => fillTemplate(item, vars)),
    pickOne(styleProfile.narrative?.ideas, seed + 79),
    tripPhase === "arrival"
      ? `Use this first chapter in ${vars.destination} to set the tone for the rest of the trip instead of trying to complete too much too early.`
      : "",
    tripPhase === "deep"
      ? `This part of the trip is where ${vars.destination} should start feeling more layered, local, and less obvious.`
      : "",
    tripPhase === "reset"
      ? "Let this stop function as a recovery or reflection pocket so the longer trip keeps its shape."
      : "",
    tripPhase === "finale"
      ? `Make this one of the memories that feels like a proper close to your time in ${vars.destination}.`
      : "",
  ]).slice(0, 6);

  return {
    schedule,
    streetFinds,
    ideas,
  };
}

export function extractPlaceImageQuery(placeName, destination = "") {
  if (!placeName) return destination || "";

  const dest = destination || "";
  const atMatch = placeName.match(/\bat\s+(.+)$/i);
  if (atMatch) return `${atMatch[1].trim()} ${dest}`.trim();

  const inMatch = placeName.match(/\bin\s+(.+)$/i);
  if (inMatch) return `${inMatch[1].trim()} ${dest}`.trim();

  let cleaned = placeName
    .replace(/\b(sunrise|sunset|morning|evening|afternoon|night|guided|premium|luxury|classic|curated|traditional|live|private|exclusive)\b/gi, "")
    .replace(/\b(tour|walk|visit|stroll|trek|hike|excursion|ride|cruise|session|class|workshop|retreat|show|performance|ceremony|experience|adventure|exploration|discovery|immersion|journey|tasting|sampling|dining|lunch|dinner|breakfast)\b/gi, "")
    .replace(/\b(yoga|meditation|massage|spa|wellness|relaxation|fitness|workout|deep|dive|cultural)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length > 3) return `${cleaned} ${dest}`.trim();
  return `${placeName.split(" ").slice(0, 4).join(" ")} ${dest}`.trim();
}

export function normalizeLegacyArrayItinerary(days = [], options = {}) {
  const {
    destination = "",
    startDate,
    endDate,
    travelers = 1,
    travelStyle = "",
    currency = "USD",
    costBreakdown = {},
  } = options;

  const slotKeys = ["morning", "morningActivity", "afternoon", "afternoonActivity", "evening", "eveningActivity", "night", "nightActivity"];
  const compactSlotKeys = ["morning", "afternoon", "evening", "night"];
  const slotTimes = {
    morning: "08:00 AM",
    morningActivity: "10:00 AM",
    afternoon: "12:30 PM",
    afternoonActivity: "02:30 PM",
    evening: "05:00 PM",
    eveningActivity: "07:30 PM",
    night: "09:00 PM",
    nightActivity: "10:30 PM",
  };

  const companionNarratives = {
    morningActivity: "Take a deeper guided look around",
    afternoonActivity: "Continue with a focused cultural stop near",
    eveningActivity: "Shift into the local evening rhythm around",
    nightActivity: "Wind down the day with a calmer final experience near",
  };

  const createCompanionSlot = (activity = {}, basePlace = "", slotKey = "", cost = 0) => {
    const slotSeed =
      slotKeys.indexOf(slotKey) >= 0 ? slotKeys.indexOf(slotKey) : compactSlotKeys.indexOf(getSlotBucket(slotKey));
    const normalizedPlace = pickBestActivityPlace(
      {
        ...activity,
        place: cleanDisplayText(basePlace) || activity?.place || "",
      },
      destination,
      slotKey,
      Math.max(0, slotSeed)
    ) || "Local stop";
    const companionPlace = normalizedPlace;
    const seedContent = generatePlaceCardFallbackContent(normalizedPlace, activity.description || activity.title || "", destination, slotKey, {
      travelStyle,
    });
    const fallbackActivityLine = `${companionNarratives[slotKey] || "Continue exploring"} ${normalizedPlace}.`;
    return {
      place: companionPlace,
      activity: fallbackActivityLine,
      title: companionPlace,
      cost: Math.max(0, Math.round(cost * 0.45)),
      travel: activity.travelSuggestion || slotTimes[slotKey],
      duration: activity.duration || "1-2h",
      imageUrl: activity.imageUrl || "",
      imageQuery: extractPlaceImageQuery(companionPlace, destination),
      reason: activity.culturalInsight || activity.tips || activity.description || "",
      tips: activity.tips || "",
      timePlan: Array.isArray(activity.timePlan) && activity.timePlan.length ? activity.timePlan : seedContent.schedule,
      nearbyHighlights: Array.isArray(activity.nearbyHighlights) && activity.nearbyHighlights.length ? activity.nearbyHighlights : seedContent.streetFinds,
      streetFinds: Array.isArray(activity.streetFinds) && activity.streetFinds.length ? activity.streetFinds : seedContent.streetFinds,
      exploreIdeas: Array.isArray(activity.exploreIdeas) && activity.exploreIdeas.length ? activity.exploreIdeas : seedContent.ideas,
      transportationTip: activity.transportationTip || "",
      localFood: activity.localFood || "",
      safetyTip: activity.safetyTip || "",
      culturalInsight: activity.culturalInsight || "",
      lat: activity.lat,
      lng: activity.lng,
    };
  };

  const normalizedDays = days.map((day, index) => {
    const activities = Array.isArray(day?.activities) ? day.activities : [];
    const slots = {};
    let activityBudget = 0;
    const createSlotPayload = (activity, slotKey, slotIndex, baseCostOverride = null) => {
      if (!activity) return null;
      const place = pickBestActivityPlace(activity, destination, slotKey, slotIndex) || `Stop ${slotIndex + 1}`;
      const cost = baseCostOverride == null ? parseCost(activity.cost) : baseCostOverride;
      const seedContent = generatePlaceCardFallbackContent(place, activity.description || activity.title || "", destination, slotKey, {
        travelStyle,
        dayNumber: index + 1,
        totalDays: days.length,
      });
      return {
        place,
        activity: activity.description || activity.title || "",
        title: place,
        cost,
        travel: activity.travelSuggestion || slotTimes[slotKey],
        duration: activity.duration || "1-2h",
        imageUrl: activity.imageUrl || "",
        imageQuery: extractPlaceImageQuery(place, destination),
        reason: activity.culturalInsight || activity.tips || activity.description || "",
        tips: activity.tips || "",
        timePlan: Array.isArray(activity.timePlan) && activity.timePlan.length ? activity.timePlan : seedContent.schedule,
        nearbyHighlights: Array.isArray(activity.nearbyHighlights) && activity.nearbyHighlights.length ? activity.nearbyHighlights : seedContent.streetFinds,
        streetFinds: Array.isArray(activity.streetFinds) && activity.streetFinds.length ? activity.streetFinds : seedContent.streetFinds,
        exploreIdeas: Array.isArray(activity.exploreIdeas) && activity.exploreIdeas.length ? activity.exploreIdeas : seedContent.ideas,
        transportationTip: activity.transportationTip || "",
        localFood: activity.localFood || "",
        safetyTip: activity.safetyTip || "",
        culturalInsight: activity.culturalInsight || "",
        lat: activity.lat,
        lng: activity.lng,
      };
    };

    if (activities.length > 0 && activities.length <= 4) {
      compactSlotKeys.forEach((mainSlot, idx) => {
        const activity = activities[Math.min(idx, activities.length - 1)];
        if (!activity) return;
        const cost = parseCost(activity.cost);
        const mainPayload = createSlotPayload(activity, mainSlot, idx, Math.max(0, Math.round(cost * 0.55)));
        if (mainPayload) {
          slots[mainSlot] = mainPayload;
          activityBudget += mainPayload.cost;
        }
        const activitySlot = `${mainSlot}Activity`;
        const companion = createCompanionSlot(activity, mainPayload?.place || "", activitySlot, cost);
        if (slotKeys.includes(activitySlot)) {
          slots[activitySlot] = companion;
          activityBudget += companion.cost;
        }
      });
    } else {
      slotKeys.forEach((slotKey, slotIndex) => {
        const activity = activities[slotIndex];
        if (!activity) return;
        const payload = createSlotPayload(activity, slotKey, slotIndex);
        if (!payload) return;
        slots[slotKey] = payload;
        activityBudget += payload.cost;
      });
    }

    const dateObj = startDate ? new Date(startDate) : null;
    if (dateObj && !Number.isNaN(dateObj.getTime())) {
      dateObj.setDate(dateObj.getDate() + index);
    }

    return {
      day: day?.day || index + 1,
      date: day?.date || (dateObj && !Number.isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : ""),
      theme: day?.theme || day?.title || `Day ${index + 1}`,
      ...slots,
      budget: {
        stay: 0,
        food: 0,
        transport: 0,
        activities: activityBudget,
        total: activityBudget,
      },
    };
  });

  const startLabel = startDate ? new Date(startDate).toLocaleDateString("en-US") : "";
  const endLabel = endDate ? new Date(endDate).toLocaleDateString("en-US") : "";
  const computedTotal = normalizedDays.reduce((sum, day) => sum + (day.budget?.total || 0), 0);
  const providedTotal = parseCost(costBreakdown?.total);
  const finalTotal = providedTotal || computedTotal;
  const finalParts = resolveBudgetParts({ ...costBreakdown, currency }, finalTotal);
  const finalStay = finalParts.stay;
  const finalFood = finalParts.food;
  const finalTransport = finalParts.transport;
  const finalActivities = finalParts.activities;

  if (finalTotal > 0 && normalizedDays.length > 0) {
    const safeDays = normalizedDays.length;
    const weights = normalizedDays.map((day) => Math.max(1, Number(day.budget?.total) || 0));
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0) || safeDays;
    const allocate = (amount) => {
      const total = Math.max(0, Math.round(Number(amount) || 0));
      let used = 0;
      return weights.map((weight, index) => {
        if (index === safeDays - 1) return Math.max(0, total - used);
        const value = Math.round((total * weight) / weightTotal);
        used += value;
        return value;
      });
    };
    const dayStay = allocate(finalStay);
    const dayFood = allocate(finalFood);
    const dayTransport = allocate(finalTransport);
    const dayActivities = allocate(finalActivities);
    const slotKeysForBudget = slotKeys;

    normalizedDays.forEach((day, dayIndex) => {
      const activityBudget = dayActivities[dayIndex] || 0;
      const slotWeights = slotKeysForBudget.map((slotKey) => Math.max(1, Number(day[slotKey]?.cost) || 0));
      const slotWeightTotal = slotWeights.reduce((sum, weight) => sum + weight, 0) || slotKeysForBudget.length;
      let usedSlotBudget = 0;
      slotKeysForBudget.forEach((slotKey, slotIndex) => {
        if (!day[slotKey]) return;
        const value = slotIndex === slotKeysForBudget.length - 1
          ? Math.max(0, activityBudget - usedSlotBudget)
          : Math.round((activityBudget * slotWeights[slotIndex]) / slotWeightTotal);
        usedSlotBudget += value;
        day[slotKey].cost = value;
      });
      const total = (dayStay[dayIndex] || 0) + (dayFood[dayIndex] || 0) + (dayTransport[dayIndex] || 0) + activityBudget;
      day.budget = {
        stay: dayStay[dayIndex] || 0,
        food: dayFood[dayIndex] || 0,
        transport: dayTransport[dayIndex] || 0,
        activities: activityBudget,
        total,
      };
    });
  }

  return {
    trip_overview: {
      destination,
      dates: startLabel && endLabel ? `${startLabel} - ${endLabel}` : "",
      total_days: normalizedDays.length,
      travel_style: travelStyle,
      passengers: travelers,
      budget: finalTotal,
      currency,
    },
    days: normalizedDays,
    total_budget: {
      stay: finalStay,
      food: finalFood,
      transport: finalTransport,
      activities: finalActivities,
      total: finalTotal,
      currency,
    },
    ai_suggestions: {
      hidden_gems: [],
      photo_spots: [],
      tips: [],
      avoid: [],
    },
  };
}

export function reconcileItineraryBudget(itinerary = {}, costBreakdown = {}) {
  if (!itinerary || typeof itinerary !== "object" || !Array.isArray(itinerary.days)) return itinerary;

  const cloned = {
    ...itinerary,
    trip_overview: { ...(itinerary.trip_overview || {}) },
    total_budget: { ...(itinerary.total_budget || {}) },
    days: itinerary.days.map((day) => ({ ...day })),
  };
  const currency = costBreakdown?.currency || cloned.total_budget?.currency || cloned.trip_overview?.currency;
  const total = parseCost(
    costBreakdown?.total ||
    cloned.total_budget?.total ||
    cloned.trip_overview?.budget ||
    cloned.days.reduce((sum, day) => sum + parseCost(day?.budget?.total), 0)
  );

  if (!total || !cloned.days.length) return cloned;

  const parts = resolveBudgetParts({ ...cloned.total_budget, ...costBreakdown, currency }, total);
  const dayWeights = cloned.days.map((day) => {
    const budgetTotal = parseCost(day?.budget?.total);
    if (budgetTotal > 0) return budgetTotal;
    const slotTotal = BUDGET_SLOT_KEYS.reduce((sum, slotKey) => sum + parseCost(day?.[slotKey]?.cost), 0);
    return Math.max(1, slotTotal);
  });
  const dayTotals = splitBudgetByWeights(total, dayWeights);

  cloned.days = cloned.days.map((day, dayIndex) => {
    const nextDay = { ...day };
    const [dayStay, dayFood, dayTransport, dayActivities] = splitBudgetByWeights(
      dayTotals[dayIndex] || 0,
      [parts.stay, parts.food, parts.transport, parts.activities]
    );
    const existingSlots = BUDGET_SLOT_KEYS.filter((slotKey) => nextDay[slotKey]);
    const slotWeights = existingSlots.map((slotKey) => Math.max(1, parseCost(nextDay[slotKey]?.cost)));
    const slotCosts = splitBudgetByWeights(dayActivities || 0, slotWeights);

    existingSlots.forEach((slotKey, slotIndex) => {
      nextDay[slotKey] = {
        ...nextDay[slotKey],
        cost: slotCosts[slotIndex] || 0,
      };
    });

    nextDay.budget = {
      stay: dayStay || 0,
      food: dayFood || 0,
      transport: dayTransport || 0,
      activities: dayActivities || 0,
      total: dayTotals[dayIndex] || 0,
    };
    return nextDay;
  });

  cloned.total_budget = {
    ...parts,
    currency,
  };
  cloned.trip_overview = {
    ...cloned.trip_overview,
    total_days: cloned.trip_overview.total_days || cloned.days.length,
    budget: total,
    currency,
  };

  return cloned;
}

export function getTripCardImageQuery(trip) {
  const itinerary = trip?.itinerary;
  const destination = trip?.destination || "";
  const normalizedDays = Array.isArray(itinerary?.days) ? itinerary.days : [];

  const firstDay = normalizedDays[0];
  if (firstDay) {
    const primarySlot = [
      firstDay.morningActivity,
      firstDay.morning,
      firstDay.afternoonActivity,
      firstDay.afternoon,
      firstDay.eveningActivity,
      firstDay.evening,
    ].find(Boolean);

    if (primarySlot?.place) {
      return `${extractPlaceImageQuery(primarySlot.place, destination)} landmark`;
    }
  }

  return `${destination} landmark travel`;
}

export function buildActivityDisplayContent(activityData = {}, fallbackContent = {}) {
  const unique = (items = []) => {
    const seen = new Set();
    return items
      .map((item) => (typeof item === "string" ? cleanDisplayText(item) : ""))
      .filter(Boolean)
      .filter((item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const fallbackSchedule = Array.isArray(fallbackContent.schedule) ? fallbackContent.schedule : [];
  const fallbackStreetFinds = Array.isArray(fallbackContent.streetFinds) ? fallbackContent.streetFinds : [];
  const fallbackIdeas = Array.isArray(fallbackContent.ideas) ? fallbackContent.ideas : [];
  const rawTimePlan = Array.isArray(activityData.timePlan) ? activityData.timePlan : [];

  const schedule = unique([
    ...rawTimePlan,
    ...(rawTimePlan.length >= 3 ? [] : fallbackSchedule),
    activityData.travel ? formatTravelLine(activityData.travel) : "",
    activityData.duration ? formatDurationLine(activityData.duration) : "",
  ]).slice(0, 5);

  const streetFinds = unique([
    ...(Array.isArray(activityData.streetFinds) ? activityData.streetFinds : []),
    ...(Array.isArray(activityData.nearbyHighlights) ? activityData.nearbyHighlights : []),
    activityData.localFood || "",
    ...fallbackStreetFinds,
  ]).slice(0, 6);

  const ideas = unique([
    ...fallbackIdeas,
    ...(Array.isArray(activityData.exploreIdeas) ? activityData.exploreIdeas : []),
    activityData.reason || "",
    activityData.tips || "",
    activityData.transportationTip ? `Getting around: ${activityData.transportationTip}` : "",
    activityData.culturalInsight ? `Cultural note: ${activityData.culturalInsight}` : "",
    activityData.safetyTip ? `Safety tip: ${activityData.safetyTip}` : "",
  ]).slice(0, 6);

  return {
    schedule: schedule.length ? schedule : unique(fallbackSchedule),
    streetFinds: streetFinds.length ? streetFinds : unique(fallbackStreetFinds),
    ideas: ideas.length ? ideas : unique(fallbackIdeas),
  };
}


