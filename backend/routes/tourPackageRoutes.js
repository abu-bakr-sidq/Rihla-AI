import express from "express";
import { TourPackage } from "../models/TourPackage.js";
import { requireAuth, ensureAdmin } from "../middleware/auth.js";

const router = express.Router();

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

    // Try Grok AI first
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
      const localBudget = Math.round(pkg.budget * rate);
      const perDay = Math.round(localBudget / days);
      const fmtN = n => n >= 100000 ? `${sym}${(n/100000).toFixed(1)}L` : n >= 1000 ? `${sym}${(n/1000).toFixed(1)}K` : `${sym}${n}`;

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
        budgetBreakdown: {
          accommodation: fmtN(Math.round(localBudget * 0.35)),
          food:          fmtN(Math.round(localBudget * 0.20)),
          transport:     fmtN(Math.round(localBudget * 0.15)),
          activities:    fmtN(Math.round(localBudget * 0.20)),
          total:         fmtN(localBudget)
        },
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
