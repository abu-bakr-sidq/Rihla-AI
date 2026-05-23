import express from "express";
import mongoose from "mongoose";
import { TourPackage } from "../models/TourPackage.js";
import { ensureAdmin } from "../middleware/auth.js";

const router = express.Router();

const RATES = {
  INR: 83,
  EUR: 0.93,
  GBP: 0.79,
  JPY: 149,
  KRW: 1320,
  THB: 35,
  AED: 3.67,
  IDR: 15800,
  TRY: 32,
  MAD: 10,
  JOD: 0.71,
  EGP: 49,
  PEN: 3.7,
  BRL: 4.98,
  ZAR: 18.8,
  XPF: 110,
  CHF: 0.88,
};

const SYMS = {
  INR: "\u20B9",
  EUR: "\u20AC",
  GBP: "\u00A3",
  JPY: "\u00A5",
  KRW: "\u20A9",
  THB: "\u0E3F",
  AED: "AED ",
  IDR: "Rp",
  TRY: "\u20BA",
  MAD: "MAD ",
  JOD: "JOD ",
  EGP: "EGP ",
  PEN: "PEN ",
  BRL: "R$",
  ZAR: "R",
  XPF: "XPF ",
  CHF: "CHF ",
};

const CURR_MAP = {
  india: "INR",
  pondicherry: "INR",
  chennai: "INR",
  kanyakumari: "INR",
  japan: "JPY",
  kyoto: "JPY",
  korea: "KRW",
  seoul: "KRW",
  bali: "IDR",
  indonesia: "IDR",
  thailand: "THB",
  phuket: "THB",
  london: "GBP",
  uk: "GBP",
  france: "EUR",
  paris: "EUR",
  italy: "EUR",
  rome: "EUR",
  venice: "EUR",
  amalfi: "EUR",
  spain: "EUR",
  barcelona: "EUR",
  greece: "EUR",
  santorini: "EUR",
  netherlands: "EUR",
  amsterdam: "EUR",
  swiss: "CHF",
  switzerland: "CHF",
  turkey: "TRY",
  istanbul: "TRY",
  dubai: "AED",
  uae: "AED",
  morocco: "MAD",
  marrakech: "MAD",
  egypt: "EGP",
  cairo: "EGP",
  jordan: "JOD",
  petra: "JOD",
  peru: "PEN",
  machu: "PEN",
  brazil: "BRL",
  rio: "BRL",
  "cape town": "ZAR",
  "south africa": "ZAR",
  "bora bora": "XPF",
  polynesia: "XPF",
};

function resolveCurrency(destination = "") {
  const lower = String(destination).toLowerCase();
  const currKey = Object.keys(CURR_MAP).find((key) => lower.includes(key));
  const currency = currKey ? CURR_MAP[currKey] : "USD";
  return {
    currency,
    symbol: SYMS[currency] || "$",
    rate: RATES[currency] || 1,
  };
}

function buildFallbackPreview(pkg) {
  const days = Math.max(
    1,
    pkg.days || Math.round((new Date(pkg.endDate) - new Date(pkg.startDate)) / 86400000),
  );
  const places = String(pkg.description || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const { currency, symbol, rate } = resolveCurrency(pkg.destination);
  const localBudget = Math.round(Number(pkg.budget || 0) * rate);
  const perDay = Math.max(1, Math.round(localBudget / days));
  const fmtN = (n) =>
    n >= 100000
      ? `${symbol}${(n / 100000).toFixed(1)}L`
      : n >= 1000
        ? `${symbol}${(n / 1000).toFixed(1)}K`
        : `${symbol}${n}`;

  const acts = [
    "Sightseeing and exploration",
    "Cultural experience and local cuisine",
    "Sunset and evening leisure",
  ];

  return {
    overview: `${pkg.destination} offers a refined ${pkg.travelStyle} journey over ${days} days, blending signature sights, local flavor, and well-paced exploration.`,
    bestTime: "October - March",
    currency,
    currencySymbol: symbol,
    exchangeRate: rate,
    days: Array.from({ length: Math.min(days, 5) }, (_, i) => ({
      day: i + 1,
      title: `Day ${i + 1}: ${places[i] || `Explore ${pkg.destination.split(",")[0]}`}`,
      morning: {
        activity: acts[0],
        place: places[i * 3] || pkg.destination.split(",")[0],
        cost: fmtN(Math.round(perDay * 0.25)),
        duration: "2-3 hrs",
      },
      afternoon: {
        activity: acts[1],
        place: places[i * 3 + 1] || "Local Market",
        cost: fmtN(Math.round(perDay * 0.4)),
        duration: "3-4 hrs",
      },
      evening: {
        activity: acts[2],
        place: places[i * 3 + 2] || "City Centre",
        cost: fmtN(Math.round(perDay * 0.2)),
        duration: "2 hrs",
      },
      dayTotal: fmtN(perDay),
      tip: `Book your ${places[i] || "entry tickets"} in advance for the best rates.`,
    })),
    budgetBreakdown: {
      accommodation: fmtN(Math.round(localBudget * 0.35)),
      food: fmtN(Math.round(localBudget * 0.2)),
      transport: fmtN(Math.round(localBudget * 0.15)),
      activities: fmtN(Math.round(localBudget * 0.2)),
      total: fmtN(localBudget),
    },
    tips: [
      `Carry some ${symbol} cash for local markets and smaller cafes.`,
      "Use local ride-hailing or taxis for smoother transfers between stops.",
      "Visit major attractions early in the day to avoid heavier crowds.",
    ],
  };
}

router.get("/", async (_req, res) => {
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
  } catch {
    res.status(500).json({ message: "Failed to fetch package" });
  }
});

router.get("/:id/preview", async (req, res) => {
  try {
    const pkg = await TourPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    const days = Math.max(1, Math.round((new Date(pkg.endDate) - new Date(pkg.startDate)) / 86400000));
    const prefs = (pkg.preferences || []).join(", ") || "local attractions";
    const places = String(pkg.description || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    try {
      const { getGrokClient } = await import("../services/aiPlannerService.js");
      const ai = getGrokClient();
      const prompt = `You are a professional travel planner. Create a detailed ${days}-day itinerary for ${pkg.destination} in ${pkg.travelStyle} travel style.
Total budget: $${pkg.budget} USD. Key places: ${places.join(", ") || prefs}.

Return ONLY a JSON object with this exact schema (no extra text):
{
  "overview": "2-sentence trip overview",
  "bestTime": "best season to visit",
  "currency": "local currency code (e.g. INR, EUR, JPY)",
  "currencySymbol": "currency symbol (e.g. ₹, €, ¥)",
  "exchangeRate": number,
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
    "total": "total in local currency"
  },
  "tips": ["tip 1", "tip 2", "tip 3"]
}`;

      const resp = await ai.chat.completions.create({
        model: "grok-3-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      return res.json(JSON.parse(resp.choices[0].message.content));
    } catch (aiErr) {
      return res.json(buildFallbackPreview(pkg));
    }
  } catch {
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
    const updatedPackage = await TourPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPackage) return res.status(404).json({ message: "Package not found" });
    res.json(updatedPackage);
  } catch {
    res.status(500).json({ message: "Failed to update package" });
  }
});

router.delete("/:id", ensureAdmin, async (req, res) => {
  try {
    const packageId = String(req.params.id || "").trim();

    if (!packageId) {
      return res.status(400).json({ message: "Package id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({ message: "Invalid package id" });
    }

    const deletedPackage = await TourPackage.findOneAndDelete({ _id: packageId });
    if (!deletedPackage) return res.status(404).json({ message: "Package not found" });
    res.json({ message: "Package deleted successfully" });
  } catch (err) {
    console.error(`DELETE /tour-packages/${req.params.id} error:`, err);
    res.status(500).json({ message: err.message || "Failed to delete package" });
  }
});

export default router;
