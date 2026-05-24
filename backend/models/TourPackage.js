import mongoose from "mongoose";

const tourPackageSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  days: { type: Number, default: 7 },
  startDate: { type: Date }, // Kept for backwards-compatibility
  endDate: { type: Date },
  budget: { type: mongoose.Schema.Types.Mixed, required: true }, // Simple string or breakdown object
  budgetBreakdown: { type: mongoose.Schema.Types.Mixed }, // Detailed calculations
  description: { type: String }, // AI generated text
  travelStyle: { type: String, required: true },
  preferences: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
}, { timestamps: true });

export const TourPackage = mongoose.models.TourPackage || mongoose.model("TourPackage", tourPackageSchema);
