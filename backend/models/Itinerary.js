import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  day: { type: Number, required: true },
  activity: { type: String, required: true },
  location: { type: String },
  cost: { type: Number, default: 0 },
  notes: { type: String }
}, { timestamps: true });

export const Itinerary = mongoose.models.Itinerary || mongoose.model("Itinerary", itinerarySchema);
