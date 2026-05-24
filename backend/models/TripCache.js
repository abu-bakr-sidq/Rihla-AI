/**
 * TripCache.js — MongoDB model for intelligent itinerary caching.
 * Identical trip requests (same destination+days+budget+style) are served
 * from cache without hitting the LLM, reducing API costs and latency.
 */
import mongoose from "mongoose";

const tripCacheSchema = new mongoose.Schema({
  // Unique key: hash of destination+days+budget+travelStyle
  cacheKey: { type: String, required: true, unique: true, index: true },

  // Cached data — full trip response
  data: { type: mongoose.Schema.Types.Mixed, required: true },

  // Metadata
  destination: { type: String },
  days:        { type: Number },
  budget:      { type: String },
  travelStyle: { type: String },
  hitCount:    { type: Number, default: 0 },

  // Auto-expiry: 7 days TTL
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    index: { expires: 0 } // MongoDB TTL index
  },

  createdAt: { type: Date, default: Date.now },
});

// Build a deterministic cache key
export function buildCacheKey(destination, days, budget, travelStyle) {
  const engineVersion = "v2";
  const d = String(destination || "").toLowerCase().trim().replace(/\s+/g, "_");
  const b = String(budget || "moderate").toLowerCase().replace(/[^a-z]/g, "");
  const s = String(travelStyle || "balanced").toLowerCase().replace(/[^a-z]/g, "");
  return `${engineVersion}::${d}::${Number(days) || 7}::${b}::${s}`;
}

export const TripCache = mongoose.models.TripCache || mongoose.model("TripCache", tripCacheSchema);
