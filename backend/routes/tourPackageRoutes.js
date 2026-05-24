import express from "express";
import { TourPackage } from "../models/TourPackage.js";
import { ensureAdmin } from "../middleware/auth.js";
import { createCityItinerary } from "../services/locationEnhancedPlanner.js";

const router = express.Router();

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "EUR ",
  GBP: "GBP ",
  JPY: "JPY ",
  INR: "INR ",
  KRW: "KRW ",
  THB: "THB ",
  AED: "AED ",
  IDR: "IDR ",
  TRY: "TRY ",
  MAD: "MAD ",
  JOD: "JOD ",
  EGP: "EGP ",
  PEN: "PEN ",
  BRL: "BRL ",
  ZAR: "ZAR ",
  XPF: "XPF ",
  CHF: "CHF ",
  SGD: "SGD ",
  MYR: "MYR ",
  VND: "VND ",
  SAR: "SAR ",
  QAR: "QAR ",
  OMR: "OMR ",
  KWD: "KWD ",
  BHD: "BHD ",
  CNY: "CNY ",
  HKD: "HKD ",
  AUD: "AUD ",
  NZD: "NZD ",
  CAD: "CAD ",
};

const DESTINATION_PRESETS = [
  { keys: ["kerala", "kochi", "munnar", "alleppey", "kovalam", "thiruvananthapuram", "india", "chennai", "pondicherry", "kanyakumari", "mumbai", "delhi", "jaipur", "goa", "hyderabad", "bangalore", "bengaluru", "kolkata", "ooty", "kodaikanal", "rameswaram", "mahabalipuram", "coimbatore"], code: "INR", rate: 83, dailyUsd: 34 },
  { keys: ["tokyo", "kyoto", "osaka", "nara", "hakone", "sapporo", "japan"], code: "JPY", rate: 149, dailyUsd: 92 },
  { keys: ["seoul", "busan", "jeju", "korea"], code: "KRW", rate: 1320, dailyUsd: 85 },
  { keys: ["bali", "jakarta", "ubud", "indonesia"], code: "IDR", rate: 15800, dailyUsd: 60 },
  { keys: ["bangkok", "phuket", "chiang mai", "thailand"], code: "THB", rate: 35, dailyUsd: 62 },
  { keys: ["kuala lumpur", "langkawi", "malaysia"], code: "MYR", rate: 4.7, dailyUsd: 66 },
  { keys: ["singapore"], code: "SGD", rate: 1.35, dailyUsd: 105 },
  { keys: ["dubai", "abu dhabi", "uae"], code: "AED", rate: 3.67, dailyUsd: 125 },
  { keys: ["doha", "qatar"], code: "QAR", rate: 3.64, dailyUsd: 120 },
  { keys: ["riyadh", "jeddah", "saudi", "madinah", "medina", "makkah", "mecca"], code: "SAR", rate: 3.75, dailyUsd: 75 },
  { keys: ["muscat", "oman"], code: "OMR", rate: 0.38, dailyUsd: 95 },
  { keys: ["kuwait"], code: "KWD", rate: 0.31, dailyUsd: 115 },
  { keys: ["bahrain"], code: "BHD", rate: 0.38, dailyUsd: 110 },
  { keys: ["istanbul", "cappadocia", "antalya", "turkey"], code: "TRY", rate: 32, dailyUsd: 60 },
  { keys: ["cairo", "luxor", "sharm", "egypt"], code: "EGP", rate: 49, dailyUsd: 52 },
  { keys: ["marrakech", "casablanca", "morocco"], code: "MAD", rate: 10, dailyUsd: 58 },
  { keys: ["petra", "amman", "jordan"], code: "JOD", rate: 0.71, dailyUsd: 72 },
  { keys: ["paris", "nice", "lyon", "france", "rome", "venice", "milan", "amalfi", "florence", "italy", "barcelona", "madrid", "seville", "spain", "amsterdam", "netherlands", "athens", "santorini", "greece", "berlin", "munich", "germany", "lisbon", "porto", "portugal", "vienna", "austria"], code: "EUR", rate: 0.93, dailyUsd: 115 },
  { keys: ["zurich", "lucerne", "interlaken", "switzerland"], code: "CHF", rate: 0.88, dailyUsd: 150 },
  { keys: ["london", "manchester", "edinburgh", "uk", "united kingdom"], code: "GBP", rate: 0.79, dailyUsd: 130 },
  { keys: ["new york", "san francisco", "los angeles", "chicago", "miami", "usa", "united states"], code: "USD", rate: 1, dailyUsd: 145 },
  { keys: ["toronto", "vancouver", "canada"], code: "CAD", rate: 1.37, dailyUsd: 105 },
  { keys: ["sydney", "melbourne", "australia"], code: "AUD", rate: 1.52, dailyUsd: 120 },
  { keys: ["auckland", "queenstown", "new zealand"], code: "NZD", rate: 1.66, dailyUsd: 118 },
  { keys: ["hong kong"], code: "HKD", rate: 7.81, dailyUsd: 115 },
  { keys: ["beijing", "shanghai", "china"], code: "CNY", rate: 7.24, dailyUsd: 72 },
  { keys: ["machu", "cusco", "peru"], code: "PEN", rate: 3.7, dailyUsd: 65 },
  { keys: ["rio", "sao paulo", "brazil"], code: "BRL", rate: 4.98, dailyUsd: 68 },
  { keys: ["cape town", "johannesburg", "south africa"], code: "ZAR", rate: 18.8, dailyUsd: 70 },
  { keys: ["bora bora", "polynesia"], code: "XPF", rate: 110, dailyUsd: 190 },
];

function getPackageCurrencyMeta(destination = "") {
  const text = String(destination || "").toLowerCase();
  const preset = DESTINATION_PRESETS.find((entry) => entry.keys.some((key) => text.includes(key)));
  if (preset) {
    return { ...preset, symbol: CURRENCY_SYMBOLS[preset.code] || preset.code };
  }
  return { code: "USD", rate: 1, dailyUsd: 88, symbol: "$" };
}

function parseBudgetNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object") {
    return parseBudgetNumber(value.total ?? value.amount ?? value.value ?? value.budget);
  }
  return null;
}

function getStoredBudgetMeta(value, destination = "") {
  const destinationMeta = getPackageCurrencyMeta(destination);
  if (typeof value === "number" && Number.isFinite(value)) {
    return { amount: value, currency: "USD", exchangeRate: 1 };
  }
  if (typeof value === "string") {
    const parsed = parseBudgetNumber(value);
    return { amount: parsed, currency: "USD", exchangeRate: 1 };
  }
  if (value && typeof value === "object") {
    const amount = parseBudgetNumber(value.total ?? value.amount ?? value.value ?? value.budget);
    const currency = String(value.currency || value.code || destinationMeta.code || "USD").toUpperCase();
    const exchangeRate = Number(value.exchangeRate || value.rate || (currency === destinationMeta.code ? destinationMeta.rate : 1)) || 1;
    return { amount, currency, exchangeRate };
  }
  return { amount: null, currency: destinationMeta.code, exchangeRate: destinationMeta.rate };
}

function normalizePackageBudgetUsd(pkg, days) {
  const safeDays = Math.max(1, Number(days) || 1);
  const meta = getPackageCurrencyMeta(pkg.destination);
  const style = String(pkg.travelStyle || "").toLowerCase();
  const styleMultiplier =
    style === "luxury" ? 1.8 :
    style === "adventure" ? 1.25 :
    style === "relaxation" ? 1.15 :
    style === "budget" ? 0.72 : 1;
  const estimatedTotalUsd = Math.round(meta.dailyUsd * styleMultiplier * safeDays);
  const storedBudget = getStoredBudgetMeta(pkg.budget, pkg.destination);
  const parsedBudget = storedBudget.amount;

  if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) return estimatedTotalUsd;

  const parsedBudgetUsd =
    storedBudget.currency === "USD"
      ? parsedBudget
      : storedBudget.currency === meta.code
        ? Math.round(parsedBudget / (storedBudget.exchangeRate || meta.rate || 1))
        : parsedBudget;
  const parsedPerDay = parsedBudgetUsd / safeDays;
  if (parsedPerDay < meta.dailyUsd * 0.6 || parsedPerDay > meta.dailyUsd * 1.55) {
    return estimatedTotalUsd;
  }
  return Math.round(parsedBudgetUsd);
}

function formatLocalMoney(amount, currencyCode) {
  const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
  const locale = currencyCode === "INR" ? "en-IN" : "en";
  const compact = safeAmount >= 1000
    ? new Intl.NumberFormat(locale, {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: safeAmount >= 100000 ? 1 : 0,
      }).format(safeAmount)
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(safeAmount);
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  return `${symbol}${compact}`.replace(/\s+/g, " ").trim();
}

function buildBudgetBreakdown(localBudget, travelStyle, currencyCode) {
  const style = String(travelStyle || "").toLowerCase();
  const ratios =
    style === "luxury"
      ? { accommodation: 0.4, food: 0.22, transport: 0.12, activities: 0.18, misc: 0.08 }
      : style === "adventure"
        ? { accommodation: 0.28, food: 0.2, transport: 0.18, activities: 0.24, misc: 0.1 }
        : style === "relaxation"
          ? { accommodation: 0.36, food: 0.22, transport: 0.14, activities: 0.16, misc: 0.12 }
          : { accommodation: 0.32, food: 0.22, transport: 0.16, activities: 0.2, misc: 0.1 };

  const accommodation = Math.round(localBudget * ratios.accommodation);
  const food = Math.round(localBudget * ratios.food);
  const transport = Math.round(localBudget * ratios.transport);
  const activities = Math.round(localBudget * ratios.activities);
  const misc = Math.max(0, localBudget - accommodation - food - transport - activities);

  return {
    accommodation: formatLocalMoney(accommodation, currencyCode),
    food: formatLocalMoney(food, currencyCode),
    transport: formatLocalMoney(transport, currencyCode),
    activities: formatLocalMoney(activities, currencyCode),
    misc: formatLocalMoney(misc, currencyCode),
    total: formatLocalMoney(localBudget, currencyCode),
  };
}

function getPackageDays(pkg) {
  if (Number.isFinite(Number(pkg?.days)) && Number(pkg.days) > 0) {
    return Math.max(1, Math.round(Number(pkg.days)));
  }
  const start = new Date(pkg?.startDate || Date.now());
  const end = new Date(pkg?.endDate || Date.now());
  const diff = Math.round((end - start) / 86400000);
  return Math.max(1, diff || 1);
}

function inferBudgetTier(destination, days, budgetUsd, travelStyle) {
  const safeDays = Math.max(1, Number(days) || 1);
  const meta = getPackageCurrencyMeta(destination);
  const perDay = budgetUsd / safeDays;
  const expected = meta.dailyUsd || 88;
  if (String(travelStyle || "").toLowerCase() === "luxury" || perDay >= expected * 1.45) return "luxury";
  if (perDay <= expected * 0.78) return "budget";
  return "moderate";
}

function extractDisplayPlace(activity = {}, fallback = "") {
  const fromLocation = String(activity.location || "").split(",")[0].trim();
  const fromTitle = String(activity.title || "").split(" - ")[0].trim();
  return fromLocation || fromTitle || fallback;
}

function cleanActivityTitle(activity = {}, fallback = "") {
  return String(activity.title || "").replace(/\s+-\s+.+$/, "").trim() || fallback;
}

function buildPreviewDayBudgetWeights(dayPlans, travelStyle) {
  const style = String(travelStyle || "").toLowerCase();
  return (Array.isArray(dayPlans) ? dayPlans : []).map((dayPlan, index, arr) => {
    const theme = String(dayPlan?.theme || dayPlan?.title || "").toLowerCase();
    const isFirst = index === 0;
    const isLast = index === arr.length - 1;
    let weight = 1;

    if (/arrival|orientation|first impressions/.test(theme)) weight += 0.1;
    if (/signature|finale|grand finish|closing|farewell/.test(theme)) weight += 0.18;
    if (/food|dining|atmosphere|night|shopping/.test(theme)) weight += 0.08;
    if (/scenic|coastal|waterfront|adventure|active/.test(theme)) weight += 0.06;
    if (/reset|slower|wellness|calm|reflection/.test(theme)) weight -= 0.05;

    if (style === "luxury") weight += 0.12;
    if (style === "adventure" || style === "nature") weight += 0.06;
    if (style === "relaxation" || style === "wellness") weight -= 0.02;
    if (isFirst || isLast) weight += 0.04;

    return Math.max(0.72, Number(weight.toFixed(2)));
  });
}

function splitBudgetByWeights(total, weights) {
  const safeTotal = Math.max(0, Math.round(Number(total) || 0));
  const safeWeights = (Array.isArray(weights) ? weights : []).map((weight) => Math.max(0.01, Number(weight) || 0.01));
  if (!safeWeights.length) return [safeTotal];
  const totalWeight = safeWeights.reduce((sum, value) => sum + value, 0) || 1;
  let allocated = 0;
  return safeWeights.map((weight, index) => {
    if (index === safeWeights.length - 1) return Math.max(0, safeTotal - allocated);
    const value = Math.round((safeTotal * weight) / totalWeight);
    allocated += value;
    return value;
  });
}

function inferBestTime(destination = "") {
  const key = String(destination || "").toLowerCase();
  if (/(dubai|abu dhabi|uae|doha|qatar|saudi|riyadh|jeddah|oman|kuwait|bahrain|egypt|morocco|jordan)/.test(key)) {
    return "November - March";
  }
  if (/(chennai|pondicherry|kanyakumari|goa|kerala|bali|phuket|thailand|singapore|malaysia)/.test(key)) {
    return "October - March";
  }
  if (/(london|paris|rome|amsterdam|barcelona|switzerland|canada)/.test(key)) {
    return "April - June, September - October";
  }
  if (/(tokyo|kyoto|japan|seoul|korea)/.test(key)) {
    return "March - May or October - November";
  }
  if (/(sydney|melbourne|australia|new zealand)/.test(key)) {
    return "September - November or March - May";
  }
  return "Best in the region's shoulder season";
}

function buildPreviewTips(destination, travelStyle, preferences = []) {
  const style = String(travelStyle || "").toLowerCase();
  const prefs = (Array.isArray(preferences) ? preferences : []).filter(Boolean);
  const destinationLabel = String(destination || "").split(",")[0].trim() || "this destination";
  const styleTip =
    style === "luxury"
      ? `Reserve signature dining and premium timed experiences in ${destinationLabel} ahead of peak evening hours.`
      : style === "adventure" || style === "nature"
        ? "Keep the most active chapter earlier in the day and leave a lighter recovery block for late afternoon."
        : style === "cultural"
          ? "Visit heritage-heavy stops early, then use the afternoon for museums, food, and slower neighborhood context."
          : style === "relaxation" || style === "wellness"
            ? "Protect one slower window each day so the route stays restorative rather than crowded."
            : `Group nearby stops together to keep transfers low and the local rhythm stronger in ${destinationLabel}.`;
  const preferenceTip = prefs.length
    ? `Use the ${prefs.slice(0, 2).join(" + ")} preference mix as your tie-breaker when choosing between similar stops.`
    : `Lean into one district at a time so ${destinationLabel} feels curated instead of over-packed.`;
  return [
    styleTip,
    preferenceTip,
    `Keep one flexible slot open in ${destinationLabel} for weather, local recommendations, or spontaneous standout finds.`,
  ];
}

function buildPreviewOverview(pkg, days, dayPlans) {
  const destinationLabel = String(pkg.destination || "").trim();
  const style = String(pkg.travelStyle || "curated").toLowerCase();
  const visibleThemes = (Array.isArray(dayPlans) ? dayPlans : [])
    .slice(0, 3)
    .map((dayPlan) => String(dayPlan?.theme || dayPlan?.title || "").trim())
    .filter(Boolean);
  const themeLine = visibleThemes.length ? ` Expect chapters like ${visibleThemes.join(", ")}.` : "";
  return `${destinationLabel} is shaped here as a ${style} journey across ${days} ${days === 1 ? "day" : "days"}, balancing signature highlights with stronger local pacing.${themeLine}`;
}

function buildPreviewDays(dayPlans, dayBudgets, currencyCode) {
  return (Array.isArray(dayPlans) ? dayPlans : []).map((dayPlan, index) => {
    const activities = Array.isArray(dayPlan?.activities) ? dayPlan.activities : [];
    const morning = activities[0] || {};
    const afternoon = activities[2] || activities[3] || activities[1] || {};
    const evening = activities[4] || activities[5] || activities[6] || {};
    const dayBudget = Math.max(0, dayBudgets[index] || 0);
    const sessionBudgets = splitBudgetByWeights(dayBudget, [0.28, 0.4, 0.22]);
    const tipSource = evening.tips || afternoon.tips || morning.tips || "";

    return {
      day: dayPlan?.day || index + 1,
      title: dayPlan?.theme || dayPlan?.title || `Day ${index + 1}`,
      morning: {
        activity: cleanActivityTitle(morning, "Morning Discovery"),
        place: extractDisplayPlace(morning, "Local Landmark"),
        cost: formatLocalMoney(sessionBudgets[0] || 0, currencyCode),
        duration: "2-3 hrs",
      },
      afternoon: {
        activity: cleanActivityTitle(afternoon, "Afternoon Discovery"),
        place: extractDisplayPlace(afternoon, "City Quarter"),
        cost: formatLocalMoney(sessionBudgets[1] || 0, currencyCode),
        duration: "3-4 hrs",
      },
      evening: {
        activity: cleanActivityTitle(evening, "Evening Discovery"),
        place: extractDisplayPlace(evening, "Evening District"),
        cost: formatLocalMoney(sessionBudgets[2] || 0, currencyCode),
        duration: "2-3 hrs",
      },
      dayTotal: formatLocalMoney(dayBudget, currencyCode),
      tip: String(tipSource || "").trim() || "Keep one lighter transition between districts so the day still feels curated.",
    };
  });
}

router.get("/", async (req, res) => {
  try {
    const packages = await TourPackage.find({ status: "active" }).sort({ createdAt: -1 });
    res.json(packages);
  } catch (err) {
    console.error("GET /tour-packages error:", err);
    res.status(500).json({ message: "Failed to fetch tour packages" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pkg = await TourPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch package" });
  }
});

router.get("/:id/preview", async (req, res) => {
  try {
    const pkg = await TourPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    const days = getPackageDays(pkg);
    const destinationMeta = getPackageCurrencyMeta(pkg.destination);
    const budgetUsd = normalizePackageBudgetUsd(pkg, days);
    const budgetTier = inferBudgetTier(pkg.destination, days, budgetUsd, pkg.travelStyle);
    const generated = await createCityItinerary(
      pkg.destination,
      days,
      budgetTier,
      pkg.travelStyle,
      pkg.preferences || []
    );
    const localBudget = Math.round(budgetUsd * (destinationMeta.rate || 1));
    const budgetBreakdown = buildBudgetBreakdown(localBudget, pkg.travelStyle, destinationMeta.code);

    if (generated?.itinerary?.length) {
      const allDayPlans = generated.itinerary;
      const previewDayCount = Math.min(allDayPlans.length, 6);
      const allDayBudgets = splitBudgetByWeights(localBudget, buildPreviewDayBudgetWeights(allDayPlans, pkg.travelStyle));
      return res.json({
        overview: buildPreviewOverview(pkg, days, allDayPlans),
        bestTime: inferBestTime(pkg.destination),
        currency: destinationMeta.code,
        currencySymbol: destinationMeta.symbol || destinationMeta.code,
        exchangeRate: destinationMeta.rate || 1,
        days: buildPreviewDays(
          allDayPlans.slice(0, previewDayCount),
          allDayBudgets.slice(0, previewDayCount),
          destinationMeta.code
        ),
        budgetBreakdown,
        tips: buildPreviewTips(pkg.destination, pkg.travelStyle, pkg.preferences),
      });
    }

    const fallbackBudgets = splitBudgetByWeights(
      localBudget,
      Array.from({ length: days }, (_, index) => 1 + (index === 0 || index === days - 1 ? 0.08 : 0))
    );
    const destinationLabel = String(pkg.destination || "").split(",")[0].trim() || "Destination";
    const fallbackDays = Array.from({ length: Math.min(days, 5) }, (_, index) => {
      const dayBudget = fallbackBudgets[index] || Math.round(localBudget / Math.max(1, days));
      const sessionBudgets = splitBudgetByWeights(dayBudget, [0.28, 0.4, 0.22]);
      return {
        day: index + 1,
        title: `${String(pkg.travelStyle || "Curated")} in ${destinationLabel}`,
        morning: {
          activity: `Morning discovery through ${destinationLabel}`,
          place: destinationLabel,
          cost: formatLocalMoney(sessionBudgets[0] || 0, destinationMeta.code),
          duration: "2-3 hrs",
        },
        afternoon: {
          activity: "Midday local culture and food chapter",
          place: `${destinationLabel} local district`,
          cost: formatLocalMoney(sessionBudgets[1] || 0, destinationMeta.code),
          duration: "3-4 hrs",
        },
        evening: {
          activity: "Evening atmosphere and signature close",
          place: `${destinationLabel} evening zone`,
          cost: formatLocalMoney(sessionBudgets[2] || 0, destinationMeta.code),
          duration: "2-3 hrs",
        },
        dayTotal: formatLocalMoney(dayBudget, destinationMeta.code),
        tip: "Use this preview as the sample flow, then switch to Plan Now for the full personalized trip build.",
      };
    });

    return res.json({
      overview: buildPreviewOverview(pkg, days, fallbackDays),
      bestTime: inferBestTime(pkg.destination),
      currency: destinationMeta.code,
      currencySymbol: destinationMeta.symbol || destinationMeta.code,
      exchangeRate: destinationMeta.rate || 1,
      days: fallbackDays,
      budgetBreakdown,
      tips: buildPreviewTips(pkg.destination, pkg.travelStyle, pkg.preferences),
    });
  } catch (err) {
    console.error("GET /tour-packages/:id/preview error:", err);
    res.status(500).json({ message: "Failed to generate preview" });
  }
});

router.post("/", ensureAdmin, async (req, res) => {
  try {
    const { destination, days, budget, budgetBreakdown, travelStyle, preferences } = req.body;

    if (!destination || !days || !budget || !travelStyle) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { generatePackageDescription } = await import("../services/aiPlannerService.js");
    let description = "";
    try {
      description = await generatePackageDescription(destination, travelStyle, preferences || []);
    } catch (e) {
      console.warn("Could not generate description:", e.message);
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + parseInt(days, 10));

    const newPackage = new TourPackage({
      destination,
      days: parseInt(days, 10),
      startDate: start,
      endDate: end,
      budget,
      budgetBreakdown,
      description,
      travelStyle,
      preferences: preferences || [],
      createdBy: req.user._id,
      status: "active",
    });

    const savedPackage = await newPackage.save();
    res.status(201).json(savedPackage);
  } catch (err) {
    console.error("POST /tour-packages error:", err);
    res.status(500).json({ message: err.message || "Failed to create tour package" });
  }
});

router.put("/:id", ensureAdmin, async (req, res) => {
  try {
    const updatedPackage = await TourPackage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPackage) return res.status(404).json({ message: "Package not found" });
    res.json(updatedPackage);
  } catch (err) {
    res.status(500).json({ message: "Failed to update package" });
  }
});

router.delete("/:id", ensureAdmin, async (req, res) => {
  try {
    const deletedPackage = await TourPackage.findByIdAndDelete(req.params.id);
    if (!deletedPackage) return res.status(404).json({ message: "Package not found" });
    res.json({ message: "Package deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete package" });
  }
});

export default router;
