/**
 * weatherService.js
 * Real-time weather via Open-Meteo API (free, no API key required).
 * WMO weather code → human readable condition mapping.
 */

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const NOMINATIM_BASE  = "https://nominatim.openstreetmap.org/search";

const WMO_CONDITIONS = {
  0: { label: "Clear Sky",          icon: "☀️"  },
  1: { label: "Mainly Clear",       icon: "🌤️"  },
  2: { label: "Partly Cloudy",      icon: "⛅"   },
  3: { label: "Overcast",           icon: "☁️"  },
  45:{ label: "Foggy",              icon: "🌫️"  },
  48:{ label: "Icy Fog",            icon: "🌫️"  },
  51:{ label: "Light Drizzle",      icon: "🌦️"  },
  53:{ label: "Drizzle",            icon: "🌦️"  },
  55:{ label: "Heavy Drizzle",      icon: "🌧️"  },
  61:{ label: "Light Rain",         icon: "🌧️"  },
  63:{ label: "Rain",               icon: "🌧️"  },
  65:{ label: "Heavy Rain",         icon: "🌧️"  },
  71:{ label: "Light Snow",         icon: "🌨️"  },
  73:{ label: "Snow",               icon: "❄️"  },
  75:{ label: "Heavy Snow",         icon: "❄️"  },
  80:{ label: "Rain Showers",       icon: "🌦️"  },
  95:{ label: "Thunderstorm",       icon: "⛈️"  },
  99:{ label: "Severe Thunderstorm",icon: "⛈️"  },
};

function getCondition(code) {
  return WMO_CONDITIONS[code] ?? { label: "Unknown", icon: "🌡️" };
}

async function fetchWithTimeout(url, options = {}, ms = 4000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Geocode a destination string to lat/lng using Nominatim.
 * Returns { lat, lng } or null.
 */
export async function geocodeCity(destination) {
  try {
    const url = `${NOMINATIM_BASE}?format=json&limit=1&q=${encodeURIComponent(destination)}`;
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": "RihlaAI/1.0" } }, 3500);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch (_) { return null; }
}

/**
 * Get current weather for a lat/lng pair.
 * Returns { temp, feelsLike, condition, icon, humidity, windSpeed, code } or null.
 */
export async function getCurrentWeather(lat, lng) {
  try {
    const params = new URLSearchParams({
      latitude:  lat,
      longitude: lng,
      current:   "temperature_2m,apparent_temperature,weathercode,relative_humidity_2m,wind_speed_10m",
      timezone:  "auto",
    });
    const url = `${OPEN_METEO_BASE}?${params}`;
    const res = await fetchWithTimeout(url, {}, 4000);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data?.current;
    if (!c) return null;
    const code = c.weathercode ?? 0;
    const { label, icon } = getCondition(code);
    return {
      temp:       `${Math.round(c.temperature_2m ?? 0)}°C`,
      feelsLike:  `${Math.round(c.apparent_temperature ?? 0)}°C`,
      condition:  label,
      icon,
      humidity:   `${c.relative_humidity_2m ?? 0}%`,
      windSpeed:  `${Math.round(c.wind_speed_10m ?? 0)} km/h`,
      code,
    };
  } catch (_) { return null; }
}

/**
 * Full workflow: geocode destination (if no coords given) then fetch weather.
 * lat/lng are optional — if provided, skips geocoding.
 */
export async function getWeatherForDestination(destination, lat = null, lng = null) {
  try {
    let coords = (lat && lng) ? { lat, lng } : await geocodeCity(destination);
    if (!coords) return null;
    const weather = await getCurrentWeather(coords.lat, coords.lng);
    return weather ? { ...weather, coordinates: coords } : null;
  } catch (_) { return null; }
}
