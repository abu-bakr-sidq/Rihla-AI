import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  description: { type: String },
  rating: { type: String },
  image: { type: String }
});

export const Destination = mongoose.models.Destination || mongoose.model("Destination", destinationSchema);
