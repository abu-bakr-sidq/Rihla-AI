function parseCost(value) {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value).trim();
  const parts = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0])).filter(Number.isFinite);
  if (!parts.length) return 0;
  if (parts.length >= 2 && /[-–to]/i.test(text)) {
    return Math.round(parts.reduce((sum, part) => sum + part, 0) / parts.length);
  }
  return parts[0] || 0;
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

function pickVariant(list = [], seed = 0, fallback = []) {
  const source = Array.isArray(list) && list.length ? list : fallback;
  if (!source.length) return [];
  return source[Math.abs(seed) % source.length] || source[0];
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
  const seed = `${place}|${slotKey}|${destination}`.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
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

  const isTemple = /temple|mosque|church|shrine|mandir|masjid|kovil|pagoda|basilica|cathedral|dargah/i.test(sourceText);
  const isBeach = /beach|coast|shore|bay|promenade|marina|pier|waterfront|lake|river/i.test(sourceText);
  const isMarket = /market|bazaar|bazar|souk|mall|shopping|vendor|street food/i.test(sourceText);
  const isFood = /restaurant|cafe|coffee|dining|food|eat|kitchen|bistro|tea|chai|bakery|dhaba/i.test(sourceText);
  const isMuseum = /museum|gallery|art|heritage|history|palace|fort|castle|exhibit|archive/i.test(sourceText);
  const isPark = /park|garden|forest|nature|wildlife|botanical|hill|mountain|valley|viewpoint/i.test(sourceText);
  const isStay = /hotel|suite|room|resort|stay|villa|palace stay|inn|lodge|ryokan|courtyard stay|residence/i.test(sourceText);
  const isNightSlot = /^night/i.test(slotKey);

  let profile = "generic";
  if (isStay || isNightSlot) profile = "stay";
  else if (isTemple) profile = "sacred";
  else if (isBeach) profile = "coastal";
  else if (isMarket) profile = "market";
  else if (isFood) profile = "food";
  else if (isMuseum) profile = "culture";
  else if (isPark) profile = "nature";

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

  const scheduleVariantsByProfile = {
    stay: [
      [
        `Start around ${times[0]} by settling into ${place} and taking a first look at the property and its atmosphere.`,
        `Around ${times[1]}, use the best window for a slower hotel moment, whether that means a lounge break, terrace view, or reset before dinner.`,
        `Toward ${times[2]}, step out around ${area} for a short neighbourhood stroll or ease back in for a calmer night close.`,
      ],
      [
        `Begin around ${times[0]} with check-in rhythm at ${place}, then give yourself time to absorb the mood instead of rushing onward.`,
        `Around ${times[1]}, lean into the signature comfort of ${place} such as its heritage spaces, rooftop angle, or quiet corners.`,
        `Toward ${times[2]}, choose between a nearby evening walk in ${area} or a softer in-house unwind before the night settles.`,
      ],
      [
        `Ease into ${place} around ${times[0]} and let this stop act as your reset point for the evening.`,
        `By ${times[1]}, focus on the most memorable part of the stay experience, from design details to a drink, tea, or skyline-facing pause.`,
        `Closer to ${times[2]}, keep the pace gentle with either a short local loop near ${area} or a relaxed return indoors.`,
      ],
    ],
    sacred: [
      [
        `Start around ${times[0]} at ${place} while the approach still feels quieter and more reflective.`,
        `Around ${times[1]}, focus on the strongest ritual, architectural, or symbolic details inside the main precinct.`,
        `Toward ${times[2]}, drift into the surrounding lanes around ${place} for offerings, small counters, and lived-in local rhythm.`,
      ],
      [
        `Reach ${place} near ${times[0]} to catch the area before it turns fully busy.`,
        `By ${times[1]}, give your best time to the central shrine, prayer hall, or sacred courtyard rather than trying to rush every corner.`,
        `Around ${times[2]}, use the outer streets near ${area} for quieter details and human-scale moments.`,
      ],
    ],
    coastal: [
      [
        `Start around ${times[0]} at ${place} and take the first stretch slowly for light, breeze, and orientation.`,
        `Around ${times[1]}, focus on the most scenic edge of ${place} rather than staying in the busiest pocket.`,
        `Toward ${times[2]}, peel into the promenade or back streets around ${area} for snacks, views, and smaller local finds.`,
      ],
      [
        `Begin near ${times[0]} with the calmer side of ${place} before the footfall thickens.`,
        `By ${times[1]}, make your way to the signature waterfront angle or promenade section that gives the place its personality.`,
        `Around ${times[2]}, let the stop loosen into a nearby cafe, sunset chai point, or slower wander beyond the main edge.`,
      ],
    ],
    market: [
      [
        `Start around ${times[0]} with a full first pass through ${place} so the layout makes sense before you stop to buy.`,
        `Around ${times[1]}, return to the lanes or stalls that felt strongest and give your time to their best details.`,
        `Toward ${times[2]}, use the deeper side rows near ${area} for more local texture and better small finds.`,
      ],
      [
        `Begin near ${times[0]} by reading the rhythm of ${place} before making decisions too quickly.`,
        `Around ${times[1]}, spend your main window on the section of ${place} that feels most distinctive for craft, food, or atmosphere.`,
        `By ${times[2]}, step into the narrower offshoot lanes where the market usually feels less generic and more local.`,
      ],
    ],
    food: [
      [
        `Start around ${times[0]} at ${place}, settle in, and let the first few minutes tell you what the room or street corner does best.`,
        `Around ${times[1]}, focus on the signature order or freshest local recommendation instead of over-ordering too early.`,
        `Toward ${times[2]}, stretch the stop into dessert, tea, or a short food-street walk around ${area}.`,
      ],
      [
        `Begin near ${times[0]} with a lighter first pass at ${place} so you can read the menu or local cues properly.`,
        `By ${times[1]}, commit to the strongest dish or tasting moment that makes ${place} worth the stop.`,
        `Closer to ${times[2]}, keep the rhythm easy with a nearby sweet, coffee, or late snack loop around ${area}.`,
      ],
    ],
    culture: [
      [
        `Start around ${times[0]} at ${place} and use the first phase to understand the context before chasing highlights.`,
        `Around ${times[1]}, give your best time to the central galleries, courtyard, or historic rooms that define the stop.`,
        `Toward ${times[2]}, move outside the main path around ${area} for architecture, bookshops, or quieter details.`,
      ],
      [
        `Begin near ${times[0]} with the broadest orientation pass through ${place}.`,
        `By ${times[1]}, narrow your attention to the strongest rooms, objects, or heritage details instead of trying to cover everything.`,
        `Around ${times[2]}, use the edges of ${place} and the neighbouring block for slower, less obvious discoveries.`,
      ],
    ],
    nature: [
      [
        `Start around ${times[0]} at ${place} from the widest or calmest approach so the setting opens up properly.`,
        `Around ${times[1]}, focus on one lookout, trail, or garden pocket instead of scattering your energy.`,
        `Toward ${times[2]}, move into the quieter paths around ${area} for a more unforced local rhythm.`,
      ],
      [
        `Begin near ${times[0]} by letting ${place} reveal its pace before you pick a direction.`,
        `By ${times[1]}, give your strongest attention to the most scenic or rewarding part of the grounds.`,
        `Around ${times[2]}, use the softer corners of ${place} for benches, tea, or one final slower loop.`,
      ],
    ],
    generic: [
      [
        `Start around ${times[0]} at ${place} and ease into the area before the main crowd builds.`,
        `Around ${times[1]}, focus on the strongest part of ${place} and its most rewarding details.`,
        `Toward ${times[2]}, move into the nearby lanes around ${place} for a more local rhythm.`,
      ],
      [
        `Begin near ${times[0]} with a first pass through ${place} so the stop feels grounded instead of rushed.`,
        `By ${times[1]}, spend your best energy on the part of ${place} that gives it the clearest character.`,
        `Closer to ${times[2]}, let the stop spill into the surrounding streets near ${area} for smaller and more local details.`,
      ],
    ],
  };

  const streetFindVariantsByProfile = {
    stay: [
      [`${place} lobby lounge`, `${place} tea service corner`, `${area} quiet evening cafe`, `${area} short heritage walk`],
      [`${place} rooftop or terrace bar`, `${place} concierge-recommended dinner spot`, `${area} late dessert counter`, `${area} softly lit side street`],
      [`${place} in-house patisserie or coffee bar`, `${place} spa or wellness wing`, `${area} calm night drive route`, `${area} hotel-lined boulevard`],
    ],
    food: [
      [`${place} dessert counter`, `${place} tea or coffee pairing`, `${area} nearby snack stop`, `${area} late sweet shop`],
      [`${place} house special counter`, `${place} bakery or pastry shelf`, `${area} local chai point`, `${area} short after-dinner lane`],
    ],
    culture: [
      [`${place} museum store`, `${place} postcard and print corner`, `${place} cafe or tea room`, `${place} local history bookshop`],
      [`${place} side courtyard`, `${place} archive wing or annex`, `${area} architecture photo angle`, `${area} heritage book stall`],
    ],
    coastal: [
      [`${place} promenade snack carts`, `${place} tender coconut stand`, `${place} shell craft stalls`, `${place} sunset chai point`],
      [`${place} quieter waterfront edge`, `${area} seaside cafe`, `${area} evening gelato stop`, `${place} lookout rail or jetty`],
    ],
    market: [
      [`${place} handloom and textile shops`, `${place} spice and dry goods lane`, `${place} antique and craft corner`, `${place} fresh juice stall`],
      [`${place} local produce section`, `${place} hidden back-lane vendor`, `${area} chai break point`, `${area} everyday shopping row`],
    ],
    sacred: [
      [`${place} flower garland lane`, `${place} prasadam shop row`, `${place} brass lamp and incense stores`, `${place} coconut water stand`],
      [`${place} quieter side shrine`, `${area} offering counter`, `${area} prayer goods stall`, `${place} outer courtyard lane`],
    ],
    nature: [
      [`${place} entry chai stall`, `${place} cycle or buggy rental point`, `${place} shaded bench area`, `${place} bird-view corner`],
      [`${place} quiet lookout`, `${area} tea kiosk`, `${area} low-traffic trail edge`, `${place} sunset bench line`],
    ],
    generic: [
      [`${place} local snack stall`, `${place} photo point`, `${place} nearby souvenir shop`, `${area} tea corner near ${place}`],
      [`${place} side lane cafe`, `${place} tucked-away view line`, `${area} local shopfront cluster`, `${area} slower walking segment`],
    ],
  };

  const ideaVariantsByProfile = {
    stay: [
      [`Use ${place} as a reset point, not just a sleep stop, and give yourself one slow hour to enjoy it properly.`, `Ask the staff at ${place} which nearby street feels best after dark for a short, safe stroll.`, `If the property has a rooftop, courtyard, or heritage lounge, use that as your most memorable final pause of the day.`],
      [`Treat ${place} as part of the experience by pairing it with one small neighbourhood walk in ${area}.`, `The best hotel moments are usually the unhurried ones: tea, skyline, pool deck, or simply the quietest corner.`, `Ask for one local recommendation within 10 minutes of ${place} rather than heading back into the busiest district.`],
    ],
    food: [
      [`Pair your stop at ${place} with one extra local bite nearby instead of making the whole meal happen in one place.`, `Ask what regulars order first at ${place}; it usually tells you more than the menu headings do.`, `If the energy is good, extend the stop into a dessert or tea walk around ${area}.`],
      [`Let ${place} set the tone, then use the next lane for a second, smaller food moment.`, `The best version of this stop is usually one signature dish plus one local recommendation.`, `Use the surrounding block around ${place} for the kind of casual food find you would miss by cab-hopping away too quickly.`],
    ],
    culture: [
      [`After the main galleries or heritage rooms, step outside ${place} and look for the details most visitors walk past.`, `Use one slower lap through ${place} instead of trying to cover every section equally.`, `The block around ${place} often explains the stop better than the final label on the wall does.`],
      [`Look for one room, courtyard, or view line inside ${place} that feels quieter than the headline route.`, `Ask staff which corner of ${place} they would show first to someone who only had ten minutes.`, `Pair the formal visit with a looser architecture walk around ${area}.`],
    ],
    coastal: [
      [`Walk a little past the busiest pocket of ${place}; that is usually where the atmosphere gets better.`, `Use the promenade behind ${place} for a second angle instead of staying fixed in one photo spot.`, `The best coastal stops often come from combining the view with one small food or tea moment nearby.`],
      [`Treat ${place} as more than a photo stop by giving time to the edge streets and pause points too.`, `If the front side feels crowded, the return path through ${area} often feels more personal and local.`, `Stay long enough at ${place} for the light to change once; that shift often transforms the mood.`],
    ],
    market: [
      [`Walk ${place} once without buying, then go back with clearer instincts.`, `The more interesting vendors at ${place} are often one lane deeper than the obvious first row.`, `Ask what locals actually come to ${place} for; that answer usually reveals the real specialty.`],
      [`Use the first half of the stop to observe how ${place} moves, then spend in the second half.`, `If ${place} feels too polished, hunt for the narrower row where everyday shopping still dominates.`, `The strongest market memories usually come from one conversation and one unplanned side purchase.`],
    ],
    sacred: [
      [`Arrive early enough at ${place} to notice how the space changes before and after the crowd thickens.`, `One quieter lane around ${place} usually says more than the busiest central approach.`, `Look for ritual details at the edges of ${place}; those are often the most human moments.`],
      [`Use the first minutes at ${place} to settle into the tone before reaching for photos.`, `The small counters and side shrines around ${area} often hold the most grounded local texture.`, `Ask which entrance or path locals prefer at ${place}; it often changes the whole feel of the stop.`],
    ],
    nature: [
      [`Stay with one section of ${place} long enough for it to feel slower and quieter.`, `The most rewarding part of ${place} is often not the first viewpoint but the second or third pause beyond it.`, `Use benches, tea stalls, and shaded corners around ${area} as part of the stop rather than rushing past them.`],
      [`Move through ${place} in one deliberate loop instead of zig-zagging for every angle.`, `If you hear yourself rushing, pick one path inside ${place} and follow it to the end.`, `Look where locals linger inside ${place}; that is usually the most naturally rewarding zone.`],
    ],
    generic: [
      [`Use ${place} as your anchor, then let the nearby streets around ${area} supply the more memorable details.`, `One extra lane beyond ${place} usually tells you more than the most obvious frontage does.`, `Ask a nearby vendor what people typically pair with a visit to ${place}.`],
      [`Do not try to complete ${place} too quickly; the best version of the stop usually comes from one slower detour.`, `Use the edges of ${area} to balance the headline stop with a more local perspective.`, `The best finds near ${place} are often small, unplanned, and only one block away.`],
    ],
  };

  streetFinds = pickVariant(streetFindVariantsByProfile[profile], seed, [streetFinds]);
  ideas = pickVariant(ideaVariantsByProfile[profile], seed, [ideas]);
  const schedule = buildUniqueLines(pickVariant(scheduleVariantsByProfile[profile], seed, scheduleVariantsByProfile.generic[0]));

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
    const normalizedPlace = resolvePlannedPlaceName(
      cleanDisplayText(basePlace) || cleanDisplayText(activity.location) || cleanDisplayText(activity.title) || "",
      destination,
      slotKey,
      Math.max(0, slotSeed)
    ) || "Local stop";
    const companionPlace = normalizedPlace;
    const seedContent = generatePlaceCardFallbackContent(normalizedPlace, activity.description || activity.title || "", destination, slotKey);
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
      const place = resolvePlannedPlaceName(activity.location || activity.title || "", destination, slotKey, slotIndex) || `Stop ${slotIndex + 1}`;
      const cost = baseCostOverride == null ? parseCost(activity.cost) : baseCostOverride;
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


