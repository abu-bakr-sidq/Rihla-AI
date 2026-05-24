import express from "express";
import { TourPackage } from "../models/TourPackage.js";
import { requireAuth, ensureAdmin } from "../middleware/auth.js";

const router = express.Router();

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  INR: "₹",
  KRW: "₩",
  THB: "฿",
  AED: "AED ",
  IDR: "Rp",
  TRY: "₺",
  MAD: "MAD ",
  JOD: "JOD ",
  EGP: "EGP ",
  PEN: "PEN ",
  BRL: "R$",
  ZAR: "R",
  XPF: "XPF ",
  CHF: "CHF ",
  SGD: "S$",
  MYR: "RM ",
  VND: "₫",
  SAR: "SAR ",
  QAR: "QAR ",
  OMR: "OMR ",
  KWD: "KWD ",
  BHD: "BHD ",
  CNY: "¥",
  HKD: "HK$",
  AUD: "A$",
  NZD: "NZ$",
  CAD: "C$",
};

const DESTINATION_PRESETS = [
  { keys: ["kerala", "kochi", "munnar", "alleppey", "kovalam", "thiruvananthapuram", "india", "chennai", "pondicherry", "kanyakumari", "mumbai", "delhi", "jaipur", "goa", "hyderabad", "bangalore", "bengaluru", "kolkata", "ooty", "kodaikanal", "rameswaram", "mahabalipuram"], code: "INR", rate: 83, dailyUsd: 34 },
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

// GET all active tour packages (Public or logged-in users)
router.get("/", async (req, res) => {
  try {
    const packages = await TourPackage.find({ status: "active" }).sort({ createdAt: -1 });
    res.json(packages);
  } catch (err) {
    console.error("GET /tour-packages error:", err);
    res.status(500).json({ message: "Failed to fetch tour packages" });
  }
});

// GET specific tour package
router.get("/:id", async (req, res) => {
  try {
    const pkg = await TourPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch package" });
  }
});

// GET rich AI preview plan for a package card
router.get("/:id/preview", async (req, res) => {
  try {
    const pkg = await TourPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    const days = Math.max(1, Math.round((new Date(pkg.endDate) - new Date(pkg.startDate)) / 86400000));
    const prefs = (pkg.preferences || []).join(", ") || "local attractions";
    const places = (pkg.description || "").split(",").map(p => p.trim()).filter(Boolean);
    const budgetUsd = normalizePackageBudgetUsd(pkg, days);

    // Try Grok AI first
    try {
      const { getGrokClient } = await import("../services/aiPlannerService.js");
      const ai = getGrokClient();

      const prompt = `You are a professional travel planner. Create a detailed ${days}-day itinerary for ${pkg.destination} in ${pkg.travelStyle} travel style.
Total budget: $${budgetUsd} USD. Key places: ${places.join(", ") || prefs}.

Return ONLY a JSON object with this exact schema (no extra text):
{
  "overview": "2-sentence trip overview",
  "bestTime": "best season to visit",
  "currency": "local currency code (e.g. INR, EUR, JPY)",
  "currencySymbol": "currency symbol (e.g. ₹, €, ¥)",
  "exchangeRate": number (units of local currency per 1 USD),
  "days": [
    {
      "day": 1,
      "title": "Day theme title",
      "morning": { "activity": "what to do", "place": "specific location name", "cost": "cost in local currency", "duration": "e.g. 2 hrs" },
      "afternoon": { "activity": "what to do", "place": "specific location name", "cost": "cost in local currency", "duration": "e.g. 3 hrs" },
      "evening": { "activity": "what to do", "place": "specific location name", "cost": "cost in local currency", "duration": "e.g. 2 hrs" },
      "dayTotal": "total cost for the day in local currency",
      "tip": "one insider tip for this day"
    }
  ],
  "budgetBreakdown": {
    "accommodation": "amount in local currency",
    "food": "amount in local currency",
    "transport": "amount in local currency",
    "activities": "amount in local currency",
    "misc": "amount in local currency",
    "total": "total in local currency"
  },
  "tips": ["tip 1", "tip 2", "tip 3"]
}`;

      const resp = await ai.chat.completions.create({
        model: "grok-3-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });
      return res.json(JSON.parse(resp.choices[0].message.content));

    } catch (aiErr) {
      // Rich template fallback matching same schema
      const RATES = { INR: 83, EUR: 0.93, GBP: 0.79, JPY: 149, KRW: 1320, THB: 35, AED: 3.67, IDR: 15800, TRY: 32, MAD: 10, JOD: 0.71, EGP: 49, PEN: 3.7, BRL: 4.98, ZAR: 18.8, XPF: 110, CHF: 0.88 };
      const SYMS = { INR: "₹", EUR: "€", GBP: "£", JPY: "¥", KRW: "₩", THB: "฿", AED: "AED ", IDR: "Rp", TRY: "₺", MAD: "MAD ", JOD: "JOD ", EGP: "EGP ", PEN: "PEN ", BRL: "R$", ZAR: "R", XPF: "XPF ", CHF: "CHF " };
      const CURR_MAP = { india: "INR", pondicherry: "INR", chennai: "INR", kanyakumari: "INR", japan: "JPY", kyoto: "JPY", korea: "KRW", seoul: "KRW", bali: "IDR", indonesia: "IDR", thailand: "THB", phuket: "THB", london: "GBP", uk: "GBP", france: "EUR", paris: "EUR", italy: "EUR", rome: "EUR", venice: "EUR", amalfi: "EUR", spain: "EUR", barcelona: "EUR", greece: "EUR", santorini: "EUR", netherlands: "EUR", amsterdam: "EUR", swiss: "CHF", switzerland: "CHF", turkey: "TRY", istanbul: "TRY", dubai: "AED", uae: "AED", morocco: "MAD", marrakech: "MAD", egypt: "EGP", cairo: "EGP", jordan: "JOD", petra: "JOD", peru: "PEN", machu: "PEN", brazil: "BRL", rio: "BRL", "cape town": "ZAR", "south africa": "ZAR", "bora bora": "XPF", polynesia: "XPF" };
      const d = pkg.destination.toLowerCase();
      const currKey = Object.keys(CURR_MAP).find(k => d.includes(k));
      const currency = currKey ? CURR_MAP[currKey] : "USD";
      const sym = SYMS[currency] || "$";
      const rate = RATES[currency] || 1;
      const localBudget = Math.round(budgetUsd * rate);
      const perDay = Math.round(localBudget / days);
      const fmtN = (n) => formatLocalMoney(n, currency);
      const breakdown = buildBudgetBreakdown(localBudget, pkg.travelStyle, currency);

      const sessions = ["morning", "afternoon", "evening"];
      const acts = ["Sightseeing & Exploration", "Cultural Experience & Local Cuisine", "Sunset & Evening Leisure"];

      const preview = {
        overview: `${pkg.destination} offers a wonderful ${pkg.travelStyle} experience over ${days} days. Explore iconic landmarks, savor local cuisine, and immerse in the vibrant culture.`,
        bestTime: "October – March",
        currency,
        currencySymbol: sym,
        exchangeRate: rate,
        days: Array.from({ length: Math.min(days, 5) }, (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1}: ${places[i] || `Explore ${pkg.destination.split(",")[0]}`}`,
          morning:   { activity: acts[0], place: places[i * 3]     || pkg.destination.split(",")[0], cost: fmtN(Math.round(perDay * 0.25)), duration: "2–3 hrs" },
          afternoon: { activity: acts[1], place: places[i * 3 + 1] || "Local Market", cost: fmtN(Math.round(perDay * 0.40)), duration: "3–4 hrs" },
          evening:   { activity: acts[2], place: places[i * 3 + 2] || "City Centre", cost: fmtN(Math.round(perDay * 0.20)), duration: "2 hrs" },
          dayTotal: fmtN(perDay),
          tip: `Book your ${places[i] || "entry tickets"} in advance for best rates.`
        })),
        budgetBreakdown: breakdown,
        tips: [
          `Carry ${sym} cash for local markets and small eateries.`,
          `Best local transport: auto-rickshaws or ride-hailing apps.`,
          `Visit major attractions early morning to avoid crowds.`
        ]
      };
      return res.json(preview);
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to generate preview" });
  }
});


// POST to create a new tour package (Admin only)
router.post("/", ensureAdmin, async (req, res) => {
  try {
    const { destination, days, budget, budgetBreakdown, travelStyle, preferences } = req.body;

    // Basic validation
    if (!destination || !days || !budget || !travelStyle) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Attempt AI Generation
    const { generatePackageDescription } = await import("../services/aiPlannerService.js");
    let description = "";
    try {
      description = await generatePackageDescription(destination, travelStyle, preferences || []);
    } catch (e) {
      console.warn("Could not generate description:", e.message);
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + parseInt(days));

    const newPackage = new TourPackage({
      destination,
      days: parseInt(days),
      startDate: start,
      endDate: end,
      budget,
      budgetBreakdown,
      description,
      travelStyle,
      preferences: preferences || [],
      createdBy: req.user._id,
      status: "active"
    });

    const savedPackage = await newPackage.save();
    res.status(201).json(savedPackage);
  } catch (err) {
    console.error("POST /tour-packages error:", err);
    res.status(500).json({ message: err.message || "Failed to create tour package" });
  }
});

// PUT to update a tour package (Admin only)
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

// DELETE a tour package (Admin only)
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
