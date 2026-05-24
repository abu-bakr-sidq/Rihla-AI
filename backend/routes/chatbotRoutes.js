import express from "express";
import { getChatbotResponse } from "../services/chatbotService.js";

const router = express.Router();

function isPlanRequest(message) {
  const m = message.toLowerCase();
  return /\b(\d+)\s*day|\bplan\b|\btrip\b|\bitinerary\b|\bvisit\b|\bschedule\b/.test(m);
}

router.post("/", async (req, res) => {
  try {
    const { message, history = [], mode = "general" } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const cleanHistory = (Array.isArray(history) ? history : [])
      .map((entry) => ({
        role: entry.role === "bot" ? "assistant" : entry.role,
        content: String(entry.content || ""),
      }))
      .filter((entry) => entry.role === "user" || entry.role === "assistant");

    const { text, itinerary } = await getChatbotResponse(message.trim(), cleanHistory, mode);

    let reply = text;
    if (isPlanRequest(message) && !itinerary && !text.includes("Day 1")) {
      reply = text && text.trim()
        ? text
        : "I couldn't complete the itinerary on this try. Please try again in a moment.";
    }

    return res.json({
      reply,
      itinerary: itinerary || null,
    });
  } catch (err) {
    console.error("[POST /api/chat]", err.message);
    return res.json({
      reply: "Server error. Please try again in a moment.",
      itinerary: null,
    });
  }
});

export default router;
