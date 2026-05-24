import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  googleId: { type: String, sparse: true, unique: true },
  resetOTP: { type: String, default: null, select: false },
  resetOTPExpires: { type: Date, default: null, select: false },
  resetPasswordToken: { type: String, default: null, index: true, select: false },
  resetPasswordExpires: { type: Date, default: null, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  profilePicture: { type: String, default: "" },
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
