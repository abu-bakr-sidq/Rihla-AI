/**
 * Trip.js — Updated MongoDB schema for the AI Travel Architect workflow.
 * Includes destination coordinates, climate data, route path, and caching metadata.
 */
import mongoose from "mongoose";

const coordinateSchema = new mongoose.Schema({
  lat: { type: Number },
  lng: { type: Number },
}, { _id: false });

const activitySchema = new mongoose.Schema({
  time: { type: String },
  title: { type: String },
  description: { type: String },
  location: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  cost: { type: String },
  imageUrl: { type: String },
  imageAlternatives: [String],
  tips: { type: String },
  nearbyHighlights: [String],
  travelSuggestion: { type: String },
  localFood: { type: String },
  transportationTip: { type: String },
  safetyTip: { type: String },
  culturalInsight: { type: String },
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: { type: Number },
  title: { type: String },
  theme: { type: String },
  activities: [activitySchema],
}, { _id: false });

const tripSchema = new mongoose.Schema({
  tripId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Destination with full context
  destination: { type: String, required: true },
  destinationMeta: {
    name: { type: String },
    coordinates: coordinateSchema,
    image: { type: String },    // Hero image URL
    countryCode: { type: String },
    timezone: { type: String },
  },

  // Travel parameters
  startDate: { type: Date, default: () => new Date() },
  endDate: { type: Date, default: () => new Date(Date.now() + 7 * 86400000) },
  days: { type: Number, default: 7 },
  budget: { type: String, default: "moderate" },
  currency: { type: String, default: "USD" },
  travelStyle: { type: String, default: "balanced" },
  interests: [{ type: String }],
  travelers: { type: Number, default: 1 },
  status: { type: String, default: "planned" },

  // Live weather at time of generation
  climate: {
    temp: { type: String },
    feelsLike: { type: String },
    condition: { type: String },
    icon: { type: String },
    humidity: { type: String },
    windSpeed: { type: String },
    code: { type: Number },
  },

  // Real places from OSM enrichment
  realPlaces: {
    attractions: [{ type: mongoose.Schema.Types.Mixed }],
    restaurants: [{ type: mongoose.Schema.Types.Mixed }],
    hotels: [{ type: mongoose.Schema.Types.Mixed }],
  },

  // AI-generated route path (array of lat/lng for globe/map drawing)
  routeCoordinates: [coordinateSchema],

  // Full day-by-day itinerary
  itinerary: { type: mongoose.Schema.Types.Mixed, default: [] },
  costBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Travel DNA preferences (copied from user profile at time of creation)
  preferences: {
    travelStyle: { type: String, default: "balanced" },
    interests: [{ type: String }],
    travelers: { type: Number, default: 1 },
    currency: { type: String, default: "USD" },
    specialRequests: { type: String },
  },

  // Cache metadata
  servedFromCache: { type: Boolean, default: false },

}, { timestamps: true });

export const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema);
