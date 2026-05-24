/**
 * aiPlannerService.js
 * LLM-powered itinerary generation using Grok/xAI.
 * Supports two modes:
 *   1. generateItinerary(prompt) — basic prompt-based generation
 *   2. generateEnrichedItinerary(context) — chain-of-thought with real weather + places
 */
import OpenAI from "openai";

export function getGrokClient() {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Grok/xAI API key. Set XAI_API_KEY in your .env file.");
  }
  return new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
}

export function buildPlannerPrompt({ destination, days, budget, travelStyle, interests, preferences }) {
  const interestStr = Array.isArray(interests) && interests.length ? interests.join(", ") : "sightseeing";
  return `Create a detailed ${days}-day travel itinerary for ${destination}.
Budget: ${budget}. Style: ${travelStyle}. Interests: ${interestStr}.
${preferences?.specialRequests ? `Special requests: ${preferences.specialRequests}.` : ""}

Return strictly valid JSON with this structure:
{
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1 title",
      "theme": "Brief theme",
      "activities": [
        {
          "time": "Morning|Afternoon|Evening",
          "title": "Place name",
          "description": "2-3 sentence description",
          "location": "Address or area",
          "lat": 0.0,
          "lng": 0.0,
          "cost": "$20-40",
          "tips": "Practical tip"
        }
      ]
    }
  ],
  "costBreakdown": {
    "flights": 0,
    "hotel": 0,
    "food": 0,
    "activities": 0,
    "total": 0,
    "currency": "USD"
  }
}`;
}

/**
 * Chain-of-Thought enriched itinerary generation.
 * Receives live weather, real places from OSM, and user DNA.
 * Instructs the AI to act as a travel engineer optimizing geographic efficiency.
 */
export async function generateEnrichedItinerary({
  destination, days, budget, travelStyle, interests, preferences,
  weather, realPlaces, userDNA,
}) {
  const ai = getGrokClient();

  const interestStr = Array.isArray(interests) && interests.length ? interests.join(", ") : "sightseeing";

  // Build enrichment context block for the prompt
  const weatherBlock = weather
    ? `🌡️ LIVE WEATHER AT DESTINATION:
Temperature: ${weather.temp} (feels like ${weather.feelsLike})
Condition: ${weather.icon} ${weather.condition}
Humidity: ${weather.humidity} | Wind: ${weather.windSpeed}
→ Factor this into activity recommendations (indoor vs outdoor, timing).`
    : "";

  const placesBlock = realPlaces?.summary
    ? `📍 REAL-TIME LOCAL DATA (OpenStreetMap):
${realPlaces.summary}
→ Prioritize these REAL verified places in your itinerary over generic suggestions.
→ Use their actual coordinates for route planning.`
    : "";

  const dnaBlock = userDNA && userDNA.length > 0
    ? `🧬 USER TRAVEL DNA (Past preferences):
Past trips: ${userDNA.slice(0, 3).map(t => t.destination).join(", ")}
Preferred style: ${travelStyle}
→ Personalise the plan based on this history.`
    : "";

  const systemPrompt = `You are an elite AI Travel Architect with 20 years of expertise.
Your role: Design geographically optimized travel itineraries with REAL places.
Chain-of-Thought approach:
1. Analyze the destination's layout and cluster nearby attractions
2. Minimize travel time between activities (group by proximity)
3. Sequence Morning → Afternoon → Evening logically
4. Factor in live weather conditions
5. Prioritize REAL verified places from the provided data
6. Output strictly valid JSON only.`;


  const styleString = String(travelStyle || "").toLowerCase();
  const styleBlock = styleString.includes("halal")
    ? "STYLE ENFORCEMENT (HALAL): You MUST prioritize mosques, halal-certified dining, family-friendly spaces, and alcohol-free environments. STRICTLY EXCLUDE bars, pubs, clubs, nightlife venues, and non-halal food recommendations."
    : styleString.includes("adventure")
      ? "STYLE ENFORCEMENT (ADVENTURE): Prioritize hiking, water sports, outdoor trails, and high-energy activities. Exclude slow, purely passive sightseeing."
      : styleString.includes("coastal")
        ? "STYLE ENFORCEMENT (COASTAL): Prioritize beaches, waterfronts, sea-breeze walks, and coastal views. Stay near the water where possible."
        : `STYLE ENFORCEMENT: Ensure activities strictly align with the ${travelStyle} travel style.`;

  const userPrompt = `Design an optimized ${days}-day travel itinerary for ${destination}.

PARAMETERS:
- Budget tier: ${budget}
- Travel style: ${travelStyle}
- Interests: ${interestStr}
- Travelers: ${preferences?.travelers || 1}
${preferences?.specialRequests ? `- Special requests: ${preferences.specialRequests}` : ""}

${weatherBlock}

${placesBlock}

${dnaBlock}

${styleBlock}

    ENGINEERING REQUIREMENTS:
    - Group activities by geographical proximity (minimize travel time between spots)
    - Each day MUST have exactly 8 activities in this specific chronological order: Morning, Morning Activity, Afternoon, Afternoon Activity, Evening, Evening Activity, Night, Night Activity
    - MUST USE REAL, HIGHLY RECOMMENDED, FAMOUS PLACE NAMES for titles (e.g. "Uluwatu Temple", "Lempuyang Gates", "Rock Bar Bali"). NEVER use generic titles like "Morning Exploration" or "Gastronomy Lunch".
    - Include specific coordinates (lat/lng) for each activity for map plotting
    - Make descriptions vivid, specific, and useful — not generic
    - For restaurants, specify the actual cuisine and signature dish
    - Weather-appropriate activities (if rainy → include indoor options)

    Return ONLY this JSON structure (no markdown, no explanation):
    {
      "itinerary": [
        {
          "day": 1,
          "title": "Day 1: [Evocative Title]",
          "theme": "One-line theme",
          "morning": { "place": "Famous Place Name", "activity": "Rich actionable description with exact times", "location": "District/Area", "lat": 0.0000, "lng": 0.0000, "cost": 15, "tips": "Insider tip" },
          "morningActivity": { "place": "Famous Place Name", "activity": "Rich actionable description", "location": "District/Area", "lat": 0.0000, "lng": 0.0000, "cost": 25, "tips": "Insider tip" },
          "afternoon": { "place": "Famous Place Name", "activity": "Rich actionable description with exact times", "location": "District/Area", "lat": 0.0000, "lng": 0.0000, "cost": 20, "tips": "Insider tip" },
          "afternoonActivity": { "place": "Famous Place Name", "activity": "Rich actionable description", "location": "District/Area", "lat": 0.0000, "lng": 0.0000, "cost": 30, "tips": "Insider tip" },
          "evening": { "place": "Famous Place Name", "activity": "Rich actionable description with exact times", "location": "District/Area", "lat": 0.0000, "lng": 0.0000, "cost": 25, "tips": "Insider tip" },
          "eveningActivity": { "place": "Famous Place Name", "activity": "Rich actionable description", "location": "District/Area", "lat": 0.0000, "lng": 0.0000, "cost": 15, "tips": "Insider tip" },
          "night": { "place": "Famous Place Name", "activity": "Rich actionable description with exact times", "location": "District/Area", "lat": 0.0000, "lng": 0.0000, "cost": 40, "tips": "Insider tip" },
          "nightActivity": { "place": "Famous Place Name", "activity": "Rich actionable description", "location": "District/Area", "lat": 0.0000, "lng": 0.0000, "cost": 10, "tips": "Insider tip" }
        }
      ],
  "routeCoordinates": [{ "lat": 0.0, "lng": 0.0 }],
  "highlights": ["Top thing 1", "Top thing 2", "Top thing 3"],
  "costBreakdown": {
    "flights": 0, "hotel": 0, "food": 0, "activities": 0,
    "total": 0, "currency": "USD"
  }
}`;

  const response = await ai.chat.completions.create({
    model: "grok-3-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.65,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}

/** Basic itinerary generation (legacy fallback) */
export async function generateItinerary(prompt) {
  const ai = getGrokClient();
  const response = await ai.chat.completions.create({
    model: "grok-3-mini",
    messages: [
      { role: "system", content: "You are a professional travel planner API that strictly returns valid JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 3500,
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0].message.content);
}

/** Generates a vibrant description for admin tour packages */
export async function generatePackageDescription(destination, travelStyle, preferences) {
  try {
    const ai = getGrokClient();
    const prefs = Array.isArray(preferences) ? preferences.join(", ") : preferences;
    const prompt = `Write a short, engaging 2-sentence description for a curated travel package to ${destination}. The style is ${travelStyle} and highlights: ${prefs || 'local attractions'}. Do NOT use JSON formatting, just return raw plain text.`;

    const response = await ai.chat.completions.create({
      model: "grok-3-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.warn("Grok API error, falling back to static description:", err.message);
    const prefsStr = Array.isArray(preferences) ? preferences.join(", ") : preferences;
    return `Discover the incredible sights and sounds of ${destination}. This curated ${travelStyle} package highlights ${prefsStr || 'everything this amazing destination has to offer'}.`;
  }
}
