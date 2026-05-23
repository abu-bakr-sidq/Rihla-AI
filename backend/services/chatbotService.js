import OpenAI from "openai";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const XAI_MODEL = "grok-3-mini";

const SYSTEM_PROMPT = `You are RIHLA AI, a smart general AI assistant with strong travel-planning skills.

Rules:
1. If the user asks for an itinerary, return a detailed day-by-day plan using real, searchable places.
2. If possible, include a JSON block inside a \`\`\`json fence with destination, total_days, and days[].
3. Keep itinerary output lively, clear, and useful.
4. Avoid repeated places across the same itinerary.
5. For general questions outside travel, answer naturally and directly without turning the reply into a trip plan.
6. Do not add travel suggestions unless the user is clearly asking about travel.
7. If the user asks a short general question like a greeting, identity question, knowledge question, or concept explanation, answer that exact question first.`;

const DESTINATION_LIBRARY = {
  chennai: {
    arrival: ["Kapaleeshwarar Temple", "San Thome Basilica", "Marina Beach promenade", "Government Museum Chennai"],
    heritage: ["Mylapore tank streets", "Fort St. George Museum", "Parthasarathy Temple", "DakshinaChitra"],
    food: ["Ratna Cafe", "Murugan Idli Shop", "Sowcarpet food lane", "ECR seafood dining"],
    culture: ["Kalakshetra Foundation", "Theosophical Society gardens", "Cholamandal Artists' Village", "Egmore Museum galleries"],
    sunset: ["Besant Nagar beach", "Broken Bridge viewpoint", "Elliot's Beach", "Kovalam coast drive"],
    night: ["Amethyst cafe courtyard", "Pondy Bazaar evening walk", "Mylapore heritage dinner", "Adyar riverside dining"],
  },
  kyoto: {
    arrival: ["Fushimi Inari Taisha", "Kiyomizu-dera", "Sannenzaka streets", "Yasaka Shrine"],
    heritage: ["Nijo Castle", "Nishiki Market", "Kennin-ji Temple", "To-ji Temple"],
    food: ["Gion kaiseki lunch", "Nishiki tasting route", "Pontocho dinner lane", "Arashiyama tea house"],
    culture: ["Kyoto National Museum", "Philosopher's Path", "Gion alleys", "Nanzen-ji precinct"],
    sunset: ["Arashiyama riverbank", "Kamo River promenade", "Kodaiji viewpoint", "Maruyama Park"],
    night: ["Pontocho riverside dining", "Gion lantern walk", "Kiyamachi nightlife strip", "Traditional machiya stay"],
  },
  dubai: {
    arrival: ["Burj Khalifa district", "Dubai Fountain boardwalk", "Souk Al Bahar", "Dubai Opera promenade"],
    heritage: ["Al Fahidi Historical Neighborhood", "Dubai Creek abra ride", "Al Seef waterfront", "Jumeirah Mosque"],
    food: ["Time Out Market Dubai", "Al Khayma Heritage Restaurant", "JBR dining strip", "Kite Beach cafes"],
    culture: ["Museum of the Future", "Etihad Museum", "Alserkal Avenue", "Dubai Frame"],
    sunset: ["Palm West Beach", "Bluewaters boardwalk", "Madinat Jumeirah canals", "Dubai Marina promenade"],
    night: ["Souk Madinat dinner", "Downtown skyline lounge", "La Mer evening stroll", "Desert-style dinner venue"],
  },
  goa: {
    arrival: ["Fontainhas Latin Quarter", "Miramar promenade", "Dona Paula viewpoint", "Panjim riverside walk"],
    heritage: ["Basilica of Bom Jesus", "Se Cathedral", "Reis Magos Fort", "Chorao island trail"],
    food: ["Mapusa local lunch", "Goan seafood shack", "Candolim brunch stop", "Assagao cafe trail"],
    culture: ["Anjuna flea area", "Aguada fort circuit", "Divar Island village roads", "Saligao church quarter"],
    sunset: ["Chapora Fort", "Ashwem beach", "Palolem sands", "Sinquerim waterfront"],
    night: ["Baga lane dinner", "Vagator clifftop dining", "Feni tasting bar", "Mandovi river cruise"],
  },
  mecca: {
    arrival: ["Masjid al-Haram outer precinct", "Ajyad district walk", "Abraj Al Bait frontage", "Jabal Omar promenade"],
    heritage: ["Makkah Museum", "Jabal al-Nour approach", "Jannat al-Mu'alla area", "Clock Tower museum zone"],
    food: ["Al Aziziyah dining street", "Hijazi breakfast stop", "Makkah mall food court", "Jabal Omar dining lounge"],
    culture: ["Library and museum quarter", "Historic Makkah streets", "Souq route near central hotels", "Faith heritage exhibit"],
    sunset: ["Jabal Omar skyline terrace", "Clock Tower outlook", "Northern ring scenic drive", "Harbiya ridge view"],
    night: ["Late evening prayer district walk", "Traditional dinner hall", "Calm tea lounge", "Hotel skyline dining"],
  },
  canada: {
    arrival: ["Old Montreal waterfront", "Distillery District", "Stanley Park seawall", "Parliament Hill outlook"],
    heritage: ["Notre-Dame Basilica area", "Gastown lanes", "ByWard Market", "Old Quebec streets"],
    food: ["St. Lawrence Market", "Granville Island food hall", "Kensington Market lunch", "Waterfront bistro stop"],
    culture: ["Royal Ontario Museum", "Montreal Museum of Fine Arts", "Vancouver Art Gallery", "Canadian Museum of History"],
    sunset: ["English Bay", "Toronto Islands skyline point", "Banff lakeside trail", "Montreal Old Port evening view"],
    night: ["Harbourfront dinner", "Old Town jazz venue", "Local craft beer district", "Riverside evening food hall"],
  },
};

function getDestinationKey(destination) {
  const lower = String(destination || "").toLowerCase();
  return Object.keys(DESTINATION_LIBRARY).find((key) => lower.includes(key)) || null;
}

function uniqueByValue(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item).toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickPlace(destination, slotType, dayNumber, offset = 0) {
  const key = getDestinationKey(destination);
  const library = key ? DESTINATION_LIBRARY[key] : null;
  const pool = library?.[slotType];
  if (pool?.length) {
    return pool[(dayNumber + offset - 1) % pool.length];
  }
  return null;
}

function detectDays(text) {
  const match = String(text || "").match(/(\d+)\s*day/i);
  return match ? Math.max(1, parseInt(match[1], 10)) : 3;
}

function countDays(text) {
  const matches = String(text || "").match(/Day\s*\d+/gi);
  return matches ? new Set(matches.map((m) => m.toLowerCase())).size : 0;
}

function extractDestination(message) {
  const text = String(message || "").trim();
  const knownDestination = Object.keys(DESTINATION_LIBRARY).find((key) =>
    text.toLowerCase().includes(key),
  );
  if (knownDestination) {
    return knownDestination.charAt(0).toUpperCase() + knownDestination.slice(1);
  }

  const patterns = [
    /(?:weekend in|trip to|days in|visit|travel to|go to|plan(?: a| an)? trip to|plan to|plan)\s+([A-Za-z][A-Za-z\s,-]{1,60})/i,
    /([A-Za-z][A-Za-z\s-]{1,40})\s+for\s+\d+\s*days?/i,
    /(?:in)\s+([A-Za-z][A-Za-z\s,-]{1,60})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1]
        .replace(/[?.!,]+$/g, "")
        .replace(/\b(luxury|budget|adventure|family|romantic|trip|itinerary|plan)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (cleaned) return cleaned;
    }
  }

  const compact = text
    .replace(/[?.!,]+$/g, "")
    .replace(/\b(plan|trip|itinerary|days?|day|weekend|luxury|budget|adventure|family|romantic|in|to|for)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (compact && compact.length <= 40) {
    return compact;
  }

  return "your destination";
}

function inferStyle(message) {
  const text = String(message || "").toLowerCase();
  if (text.includes("luxury")) return "Luxury";
  if (text.includes("budget")) return "Budget";
  if (text.includes("adventure")) return "Adventure";
  if (text.includes("cultural")) return "Cultural";
  if (text.includes("family")) return "Family";
  return "Balanced";
}

function isItineraryRequest(message) {
  return /\b(\d+)\s*day|\bplan\b|\btrip\b|\bitinerary\b|\bvisit\b|\bschedule\b/i.test(
    String(message || ""),
  );
}

function isGreetingOrGeneralChat(message) {
  const text = String(message || "").trim().toLowerCase();
  if (!text) return true;

  if (/^(hi|hello|hey|hii|yo|hola|namaste|salam|assalamualaikum|good morning|good afternoon|good evening)[!. ]*$/i.test(text)) {
    return true;
  }

  if (/^(how are you|who are you|what can you do|help|thanks|thank you|ok|okay)[?.! ]*$/i.test(text)) {
    return true;
  }

  if (text.split(/\s+/).length <= 3 && !isItineraryRequest(text)) {
    return true;
  }

  return false;
}

function isGeneralKnowledgeQuestion(message) {
  const text = String(message || "").trim().toLowerCase();
  if (!text) return false;
  if (isItineraryRequest(text)) return false;
  return /^(who|what|when|where|why|how|can|could|would|should|is|are|do|does|did)\b/.test(text);
}

function buildDayPlan(destination, dayNumber, style) {
  const themes = [
    {
      title: "Arrival and First Impressions",
      plans: [
        ["08:00", "arrival", `Check in near ${destination} Old Quarter`, `Settle in and ease into ${destination} with a smooth arrival flow.`],
        ["10:00", "heritage", `${destination} Central Landmark Walk`, `Start with a signature district walk to understand the local rhythm.`],
        ["12:30", "food", `${destination} Local Lunch Market`, `Taste a well-loved local lunch stop with regional specialties.`],
        ["14:30", "culture", `${destination} Museum or Heritage Gallery`, `Add cultural context before the city gets busier.`],
        ["17:00", "sunset", `${destination} Sunset Viewpoint`, `Use golden hour for your most memorable first-day visuals.`],
        ["19:30", "dining", `${destination} Evening Dining Street`, `Wind down with an atmospheric dinner in a lively corridor.`],
      ],
      streetFinds: [
        `${destination} tea corner`,
        `${destination} street snack stall`,
        `${destination} local craft shop`,
        `${destination} riverside walk`,
      ],
      exploreOptions: [
        `Ask your hotel for the quietest entrance route into ${destination}'s main district before peak hours.`,
        `Look for one elevated terrace or rooftop in ${destination} for a panoramic reset before dinner.`,
        `Save one unplanned hour to follow a side street that feels especially local and active.`,
      ],
    },
    {
      title: "Signature Sights and Local Flavor",
      plans: [
        ["08:00", "morning", `${destination} Iconic Shrine or Monument`, `Visit a headline attraction before the dense visitor window begins.`],
        ["10:00", "walk", `${destination} Historic Street Circuit`, `Pair the landmark with a neighborhood walk full of smaller discoveries.`],
        ["12:30", "food", `${destination} Chef-Recommended Lunch Spot`, `Use lunch for a stronger taste of the city's signature dishes.`],
        ["14:30", "design", `${destination} Design or Artisan Quarter`, `Shift into shops, ateliers, and slower browsing spaces.`],
        ["17:00", "break", `${destination} Garden Pause`, `Take a calm scenic break before the evening stretch.`],
        ["19:30", "night", `${destination} Night Market and Food Lane`, `End with lights, local energy, and flexible grazing stops.`],
      ],
      streetFinds: [
        `${destination} dessert cafe`,
        `${destination} handmade souvenirs`,
        `${destination} hidden photo alley`,
        `${destination} evening food lane`,
      ],
      exploreOptions: [
        `Use the first half of the day for the biggest attraction and keep the second half neighborhood-led.`,
        `If a queue feels heavy, step into the closest side lane and return 30 minutes later.`,
        `Choose one meal in a smaller family-run spot instead of only famous venues.`,
      ],
    },
    {
      title: "Culture and Neighborhood Life",
      plans: [
        ["08:00", "culture", `${destination} Heritage District`, `See architectural character and local routines in softer morning light.`],
        ["10:00", "gallery", `${destination} Art Walk`, `Blend small galleries, bookshops, and design stops into one route.`],
        ["12:30", "food", `${destination} Neighborhood Lunch House`, `Take lunch where regulars go rather than tourist-heavy main streets.`],
        ["14:30", "local", `${destination} Hidden Courtyard Circuit`, `Step into lesser-known courtyards, lanes, and smaller landmarks.`],
        ["17:00", "tea", `${destination} Tea or Coffee Stop`, `Recharge in a strong local cafe before your evening plan.`],
        ["19:30", "dining", `${destination} Cultural Dinner Venue`, `Choose a dinner setting that reflects the city's identity and mood.`],
      ],
      streetFinds: [
        `${destination} bookshop`,
        `${destination} local bakery`,
        `${destination} handmade textiles`,
        `${destination} hidden courtyard`,
      ],
      exploreOptions: [
        `Talk with one shop owner or museum docent for a more personal neighborhood recommendation.`,
        `Prioritize one district deeply instead of crossing too many parts of the city in a single afternoon.`,
        `Leave space for a low-key coffee stop where locals linger rather than rush.`,
      ],
    },
    {
      title: "Scenic Leisure and Evening Glow",
      plans: [
        ["08:00", "scenic", `${destination} Scenic Waterfront or Park`, `Start with open space and a calmer pace before re-entering the urban flow.`],
        ["10:00", "market", `${destination} Fresh Market Stroll`, `Catch local produce, breakfast vendors, and everyday city life.`],
        ["12:30", "food", `${destination} Specialty Lunch Table`, `Use lunch to try a signature dish you have not covered yet.`],
        ["14:30", "spa", `${destination} Slow Afternoon Lounge`, `Reserve time for rest, shopping, or a slower luxury pause.`],
        ["17:00", "sunset", `${destination} Golden Hour Promenade`, `Choose a waterside, hilltop, or skyline-facing route for evening light.`],
        ["19:30", "night", `${destination} Refined Night Out`, `Finish with a memorable dinner or music-led venue.`],
      ],
      streetFinds: [
        `${destination} waterfront snacks`,
        `${destination} premium dessert bar`,
        `${destination} artisan market`,
        `${destination} sunset photo point`,
      ],
      exploreOptions: [
        `Build this day around fewer stops so the city feels calmer and more luxurious.`,
        `Use late afternoon for your best photos, then transition directly into dinner.`,
        `Choose one flexible evening venue that lets you extend the night if the mood is right.`,
      ],
    },
  ];

  const theme = themes[(dayNumber - 1) % themes.length];
  const styleNote =
    style === "Luxury"
      ? "Prefer premium access, polished stays, and standout dining."
      : style === "Budget"
        ? "Favor smart-value routes, public areas, and strong local eats."
        : style === "Adventure"
          ? "Lean into more active movement, outdoor time, and scenic energy."
          : style === "Cultural"
            ? "Prioritize story-rich sites, heritage zones, and local context."
            : "Balance iconic stops with room for slower local discovery.";

  const usedPlaces = new Set();
  const plans = theme.plans.map(([time, slot, place, description], index) => {
    const slotKey =
      slot === "arrival" ? "arrival"
        : slot === "heritage" || slot === "morning" ? "heritage"
        : slot === "food" ? "food"
        : slot === "culture" || slot === "gallery" || slot === "design" || slot === "local" ? "culture"
        : slot === "sunset" || slot === "break" || slot === "tea" || slot === "scenic" || slot === "market" || slot === "spa" ? "sunset"
        : "night";

    let resolvedPlace = pickPlace(destination, slotKey, dayNumber, index) || place;
    if (usedPlaces.has(resolvedPlace.toLowerCase())) {
      resolvedPlace = pickPlace(destination, slotKey, dayNumber, index + 1) || `${destination} ${slotKey} stop ${index + 1}`;
    }
    usedPlaces.add(resolvedPlace.toLowerCase());

    const richerDescription =
      slotKey === "food"
        ? `Make this stop your most flavorful break of the day with a well-reviewed local table near ${resolvedPlace}.`
        : slotKey === "sunset"
          ? `Use this window for softer light, scenic pacing, and a more cinematic view of ${destination}.`
          : `${description} Base this segment around ${resolvedPlace} so the route feels grounded and easy to follow.`;

    return {
      time,
      slot,
      place: resolvedPlace,
      city: destination,
      description: richerDescription,
      duration: slot === "arrival" ? "1-2h" : slot === "food" ? "1-1.5h" : "2-3h",
      transit: slot === "night" ? "Taxi or metro" : "Walk or short cab",
      image_query: `${resolvedPlace} ${destination} tourism`,
    };
  });

  return {
    day: dayNumber,
    title: theme.title,
    styleNote,
    streetFinds: uniqueByValue([
      ...theme.streetFinds,
      `${plans[1]?.place || destination} coffee stop`,
      `${plans[2]?.place || destination} dessert counter`,
    ]).slice(0, 4),
    exploreOptions: uniqueByValue([
      ...theme.exploreOptions,
      `Search the side lanes around ${plans[1]?.place || destination} for calmer photo angles and local details.`,
      `If timing is tight, keep ${plans[4]?.place || destination} for golden hour and compress one indoor stop earlier.`,
    ]).slice(0, 4),
    plans,
  };
}

function buildFallbackItinerary(message) {
  const destination = extractDestination(message);
  const totalDays = detectDays(message);
  const style = inferStyle(message);
  const days = Array.from({ length: totalDays }, (_, index) =>
    buildDayPlan(destination, index + 1, style),
  );

  return {
    destination,
    total_days: totalDays,
    style,
    trip_overview: {
      destination,
      total_days: totalDays,
      budget_estimate: style === "Luxury" ? 3200 * totalDays : style === "Budget" ? 700 * totalDays : 1600 * totalDays,
      vibe: style,
    },
    days,
  };
}

function fallbackTextFromItinerary(itinerary) {
  const intro = `Here's a lively ${itinerary.total_days}-day plan for ${itinerary.destination}.`;
  const body = itinerary.days
    .map((day) => {
      const lines = day.plans.map(
        (plan) => `- ${plan.time}: ${plan.place} - ${plan.description}`,
      );
      return `Day ${day.day}: ${day.title}\n${lines.join("\n")}`;
    })
    .join("\n\n");

  return `${intro}\n\n${body}`;
}

export function parseItineraryFromChat(raw) {
  const fenceRx = /```json\s*([\s\S]*?)```/i;
  const match = String(raw || "").match(fenceRx);

  if (!match) return { text: String(raw || "").trim(), itinerary: null };

  const text = String(raw || "").replace(fenceRx, "").trim();

  try {
    const itinerary = JSON.parse(match[1].trim());

    if (!Array.isArray(itinerary?.days) || itinerary.days.length === 0) {
      return { text, itinerary: null };
    }

    itinerary.days.forEach((day) => {
      if (Array.isArray(day.plans)) {
        day.plans.forEach((plan) => {
          if (!plan.image_query && plan.place && plan.city) {
            plan.image_query = `${plan.place} ${plan.city} tourism`;
          }
        });
      }
    });

    return { text, itinerary };
  } catch {
    return { text, itinerary: null };
  }
}

export function smartFallback(msg, mode = "general") {
  const currentMode = String(mode || "general").toLowerCase();

  if (currentMode === "planner" || isItineraryRequest(msg)) {
    const itinerary = buildFallbackItinerary(msg);
    return {
      text: fallbackTextFromItinerary(itinerary),
      itinerary,
    };
  }

  if (isGreetingOrGeneralChat(msg)) {
    return {
      text:
        "Hi! I'm Rihla AI. I can answer general questions, explain concepts, and also help with destinations, budgets, visas, weather, route ideas, food areas, and full day-by-day travel plans.",
      itinerary: null,
    };
  }

  return {
    text:
      "I can help with general questions and travel planning. Ask me anything, or say something like `Plan 5 days in Dubai` for a full itinerary.",
    itinerary: null,
  };
}

function hasUsableKey(value = "") {
  const key = String(value || "").trim();
  return Boolean(key) && !/your_(groq|grok|xai)_api_key_here/i.test(key) && !/provide_me/i.test(key);
}

function getChatProvider() {
  const xaiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (hasUsableKey(xaiKey)) {
    return { type: "xai", key: xaiKey };
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (hasUsableKey(groqKey)) {
    return { type: "groq", key: groqKey };
  }
  return null;
}

async function callGroq(messages, apiKey) {
  if (!hasUsableKey(apiKey)) {
    throw new Error("GROQ_API_KEY is missing or still set to a placeholder value.");
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 5000,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

async function callXai(messages, apiKey) {
  if (!hasUsableKey(apiKey)) {
    throw new Error("XAI_API_KEY/GROK_API_KEY is missing or still set to a placeholder value.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
  });

  const response = await client.chat.completions.create({
    model: XAI_MODEL,
    temperature: 0.2,
    max_tokens: 5000,
    messages,
  });

  return response?.choices?.[0]?.message?.content || "";
}

async function callChatModel(messages) {
  const provider = getChatProvider();
  if (!provider) {
    throw new Error("No usable AI provider key configured for chatbot.");
  }

  if (provider.type === "xai") {
    return callXai(messages, provider.key);
  }

  return callGroq(messages, provider.key);
}

export async function getChatbotResponse(message, history = [], mode = "general") {
  try {
    const currentMode = String(mode || "general").toLowerCase();
    const forcePlannerMode = currentMode === "planner";
    const forceGeneralMode = currentMode === "general";

    if (!getChatProvider()) {
      return smartFallback(message, currentMode);
    }

    const days = detectDays(message);
    const wantsItinerary = forcePlannerMode || isItineraryRequest(message);
    const chatHistory = (Array.isArray(history) ? history : [])
      .map((h) => ({
        role: h.role === "bot" ? "assistant" : h.role === "user" ? "user" : "assistant",
        content: String(h.content || ""),
      }))
      .filter((h) => h.role === "user" || h.role === "assistant")
      .slice(-12);

    const raw = await callChatModel([
      {
        role: "system",
        content:
          wantsItinerary
            ? `${SYSTEM_PROMPT}\n\nGenerate exactly ${days} days when the user requests an itinerary. Keep the JSON valid and useful.`
            : `${SYSTEM_PROMPT}\n\nThis user is asking a general question, not for an itinerary. Reply directly, naturally, and do not include JSON unless they explicitly ask for a structured plan.`,
      },
      ...chatHistory,
      { role: "user", content: String(message || "") },
    ]);

    if (!raw) {
      return smartFallback(message, currentMode);
    }

    const parsed = parseItineraryFromChat(raw);
    if (wantsItinerary && (!parsed.itinerary || countDays(parsed.text) < Math.min(days, 2))) {
      return smartFallback(message, currentMode);
    }

    if (!wantsItinerary && (forceGeneralMode || isGeneralKnowledgeQuestion(message) || isGreetingOrGeneralChat(message))) {
      return {
        text: parsed.text || raw,
        itinerary: null,
      };
    }

    return parsed;
  } catch (err) {
    console.error("[chatbot] Error:", err.message);
    return smartFallback(message, mode);
  }
}
