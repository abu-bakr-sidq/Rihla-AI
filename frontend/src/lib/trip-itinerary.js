function parseCost(value) {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  return Number(cleaned) || 0;
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
  ];

  if (genericPatterns.some((pattern) => pattern.test(text))) return true;
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

export function generatePlaceCardFallbackContent(placeName = "", activity = "", destination = "", slotKey = "") {
  const place = resolvePlannedPlaceName(placeName || activity, destination, slotKey);
  const area = getAreaLabel(placeName, destination);
  const sourceText = `${placeName} ${activity}`.toLowerCase();
  const times = {
    morning: ["08:00", "08:45", "09:30"],
    morningActivity: ["10:00", "10:50", "11:40"],
    afternoon: ["12:30", "13:20", "14:10"],
    afternoonActivity: ["14:30", "15:20", "16:10"],
    evening: ["17:00", "18:00", "19:15"],
    eveningActivity: ["19:30", "20:15", "21:00"],
    night: ["21:00", "21:45", "22:30"],
    nightActivity: ["22:30", "23:00", "23:30"],
  }[slotKey] || ["10:00", "10:45", "11:30"];

  const isTemple = /temple|mosque|church|shrine|mandir|masjid|kovil|pagoda|basilica|cathedral|dargah/i.test(sourceText);
  const isBeach = /beach|coast|shore|bay|promenade|marina|pier|waterfront|lake|river/i.test(sourceText);
  const isMarket = /market|bazaar|bazar|souk|mall|shopping|vendor|street food/i.test(sourceText);
  const isFood = /restaurant|cafe|coffee|dining|food|eat|kitchen|bistro|tea|chai|bakery|dhaba/i.test(sourceText);
  const isMuseum = /museum|gallery|art|heritage|history|palace|fort|castle|exhibit|archive/i.test(sourceText);
  const isPark = /park|garden|forest|nature|wildlife|botanical|hill|mountain|valley|viewpoint/i.test(sourceText);

  let streetFinds = [
    `${place} local snack stall`,
    `${place} photo point`,
    `${place} nearby souvenir shop`,
    `${area} tea corner near ${place}`,
  ];
  let ideas = [
    `Take one extra lane around ${place} to see how ${area} feels beyond the headline stop.`,
    `Use ${place} as your anchor, then walk outward for calmer photo angles and small local finds.`,
    `Ask one nearby vendor what locals usually pair with a visit to ${place}.`,
  ];

  if (isTemple) {
    streetFinds = [
      `${place} flower garland lane`,
      `${place} prasadam shop row`,
      `${place} brass lamp and incense stores`,
      `${place} coconut water stand`,
    ];
    ideas = [
      `Arrive a little early at ${place} to watch the entrance streets wake up before the crowd builds.`,
      `Circle one side lane around ${place} for quieter shrines, ritual counters, and smaller photo moments.`,
      `Look for the oldest shopfront near ${place}; it is often the best place for local offerings and stories.`,
    ];
  } else if (isBeach) {
    streetFinds = [
      `${place} promenade snack carts`,
      `${place} tender coconut stand`,
      `${place} shell craft stalls`,
      `${place} sunset chai point`,
    ];
    ideas = [
      `Walk beyond the busiest part of ${place} for a calmer stretch and cleaner views.`,
      `Use the edge streets behind ${place} to find local cafes and breezier routes back.`,
      `Pause near the fishing or promenade side of ${place} for the most grounded local atmosphere.`,
    ];
  } else if (isMarket) {
    streetFinds = [
      `${place} handloom and textile shops`,
      `${place} spice and dry goods lane`,
      `${place} antique and craft corner`,
      `${place} fresh juice stall`,
    ];
    ideas = [
      `Walk the full length of ${place} once before buying so the best lane and prices reveal themselves.`,
      `Check the side rows branching off ${place}; that is usually where the more unique stores sit.`,
      `Ask which section of ${place} locals use for everyday shopping instead of souvenir browsing.`,
    ];
  } else if (isFood) {
    streetFinds = [
      `${place} bakery counter`,
      `${place} chai or coffee stall`,
      `${place} dessert shop nearby`,
      `${area} fruit juice kiosk near ${place}`,
    ];
    ideas = [
      `Pair your stop at ${place} with a short food walk in the surrounding block for one extra local favorite.`,
      `Check what the staff around ${place} recommend as the freshest thing on the street today.`,
      `Use ${place} as the center point, then explore the next lane for sweets, drinks, or late snacks.`,
    ];
  } else if (isMuseum) {
    streetFinds = [
      `${place} museum store`,
      `${place} postcard and print corner`,
      `${place} cafe or tea room`,
      `${place} local history bookshop`,
    ];
    ideas = [
      `After the main galleries, step outside ${place} and check the adjoining block for architecture and quieter details.`,
      `Look for a side courtyard, annex, or smaller entrance around ${place} that most people walk past.`,
      `Use the streets around ${place} for slower photo stops once you finish the main exhibit flow.`,
    ];
  } else if (isPark) {
    streetFinds = [
      `${place} entry chai stall`,
      `${place} cycle or buggy rental point`,
      `${place} shaded bench area`,
      `${place} bird-view corner`,
    ];
    ideas = [
      `Start at the widest view in ${place}, then move into the quieter paths for the best contrast.`,
      `Keep one relaxed loop around ${place} instead of rushing between exits and viewpoints.`,
      `Watch where locals pause inside ${place}; those small resting areas are usually the most rewarding.`,
    ];
  }

  const schedule = buildUniqueLines([
    `${times[0]} Arrive at ${place} and get your bearings around the main approach`,
    `${times[1]} Focus on the signature stretch of ${place} and its most interesting details`,
    `${times[2]} Step into the nearby lanes around ${place} for smaller shops and local rhythm`,
  ]);

  return {
    schedule,
    streetFinds: buildUniqueLines(streetFinds).slice(0, 6),
    ideas: buildUniqueLines(ideas).slice(0, 6),
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

  const normalizedDays = days.map((day, index) => {
    const activities = Array.isArray(day?.activities) ? day.activities : [];
    const slots = {};
    let activityBudget = 0;

    slotKeys.forEach((slotKey, slotIndex) => {
      const activity = activities[slotIndex];
      if (!activity) return;

      const place = activity.location || activity.title || `Stop ${slotIndex + 1}`;
      const cost = parseCost(activity.cost);
      activityBudget += cost;

      slots[slotKey] = {
        place,
        activity: activity.description || activity.title || "",
        title: activity.title || "",
        cost,
        travel: activity.travelSuggestion || slotTimes[slotKey],
        duration: activity.duration || "1-2h",
        imageUrl: activity.imageUrl || "",
        imageQuery: extractPlaceImageQuery(place, destination),
        reason: activity.culturalInsight || activity.tips || activity.description || "",
        tips: activity.tips || "",
        timePlan: Array.isArray(activity.timePlan) ? activity.timePlan : [],
        nearbyHighlights: Array.isArray(activity.nearbyHighlights) ? activity.nearbyHighlights : [],
        streetFinds: Array.isArray(activity.streetFinds) ? activity.streetFinds : [],
        exploreIdeas: Array.isArray(activity.exploreIdeas) ? activity.exploreIdeas : [],
        transportationTip: activity.transportationTip || "",
        localFood: activity.localFood || "",
        safetyTip: activity.safetyTip || "",
        culturalInsight: activity.culturalInsight || "",
        lat: activity.lat,
        lng: activity.lng,
      };
    });

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

  return {
    trip_overview: {
      destination,
      dates: startLabel && endLabel ? `${startLabel} - ${endLabel}` : "",
      total_days: normalizedDays.length,
      travel_style: travelStyle,
      passengers: travelers,
      budget: parseCost(costBreakdown?.total || computedTotal),
      currency,
    },
    days: normalizedDays,
    total_budget: {
      stay: parseCost(costBreakdown?.stay),
      food: parseCost(costBreakdown?.food),
      transport: parseCost(costBreakdown?.transport),
      activities: parseCost(costBreakdown?.activities) || computedTotal,
      total: parseCost(costBreakdown?.total) || computedTotal,
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


