import mongoose, { Schema } from "mongoose";
import { connectMongo } from "./mongo.js";
const counterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true, default: 0 }
  },
  { versionKey: false }
);
const userSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "user" },
    resetPasswordToken: { type: String, default: null, index: true },
    resetPasswordExpires: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);
const tripSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    destination: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    days: { type: Number, required: true },
    travelers: { type: Number, required: true, default: 1 },
    budget: { type: String, required: true },
    travelStyle: { type: String, required: true },
    interests: { type: Schema.Types.Mixed, required: true },
    itinerary: { type: Schema.Types.Mixed, default: null },
    costBreakdown: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);
const placeSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    rating: { type: String, default: null },
    description: { type: String, default: null },
    lat: { type: String, default: null },
    lng: { type: String, default: null }
  },
  { versionKey: false }
);
const activityLogSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, index: true },
    username: { type: String, default: null },
    text: { type: String, required: true },
    icon: { type: String, default: "👤" },
    color: { type: String, default: "text-blue-400" },
    timestamp: { type: Date, default: Date.now }
  },
  { versionKey: false }
);
const CounterModel = mongoose.models.Counter || mongoose.model("Counter", counterSchema);
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
const TripModel = mongoose.models.Trip || mongoose.model("Trip", tripSchema);
const PlaceModel = mongoose.models.Place || mongoose.model("Place", placeSchema);
const ActivityLogModel = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
async function nextId(key) {
  const counter = await CounterModel.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).lean();
  if (!counter) {
    throw new Error(`Failed to allocate id for ${key}`);
  }
  return counter.value;
}
const toUser = (doc) => ({
  id: doc.id,
  username: doc.username,
  email: doc.email,
  password: doc.password,
  role: doc.role,
  createdAt: doc.createdAt ?? null
});
const toTrip = (doc) => ({
  id: doc.id,
  userId: doc.userId,
  destination: doc.destination,
  startDate: doc.startDate,
  endDate: doc.endDate,
  days: doc.days,
  travelers: doc.travelers,
  budget: doc.budget,
  travelStyle: doc.travelStyle,
  interests: doc.interests,
  itinerary: doc.itinerary ?? null,
  costBreakdown: doc.costBreakdown ?? null,
  createdAt: doc.createdAt ?? null
});
const toPlace = (doc) => ({
  id: doc.id,
  name: doc.name,
  location: doc.location,
  category: doc.category,
  rating: doc.rating ?? null,
  description: doc.description ?? null,
  lat: doc.lat ?? null,
  lng: doc.lng ?? null
});
const toActivityLog = (doc) => ({
  id: doc.id,
  userId: doc.userId ?? null,
  username: doc.username ?? null,
  text: doc.text,
  icon: doc.icon,
  color: doc.color,
  timestamp: doc.timestamp
});
class DatabaseStorage {
  async getUser(id) {
    await connectMongo();
    const user = await UserModel.findOne({ id }).lean();
    return user ? toUser(user) : void 0;
  }
  async getUserByUsername(username) {
    await connectMongo();
    const user = await UserModel.findOne({ username }).lean();
    return user ? toUser(user) : void 0;
  }
  async getUserByEmail(email) {
    await connectMongo();
    const user = await UserModel.findOne({ email }).lean();
    return user ? toUser(user) : void 0;
  }
  async createUser(insertUser) {
    await connectMongo();
    const id = await nextId("users");
    const user = await UserModel.create({
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      role: insertUser.role ?? "user"
    });
    return toUser(user.toObject());
  }
  async getAllUsers() {
    await connectMongo();
    const users = await UserModel.find().sort({ createdAt: -1 }).lean();
    return users.map(toUser);
  }
  async setPasswordResetToken(email, token, expiresAt) {
    await connectMongo();
    const user = await UserModel.findOneAndUpdate(
      { email },
      { $set: { resetPasswordToken: token, resetPasswordExpires: expiresAt } },
      { returnDocument: "after" }
    ).lean();
    return user ? toUser(user) : void 0;
  }
  async getUserByResetToken(token) {
    await connectMongo();
    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    }).lean();
    return user ? toUser(user) : void 0;
  }
  async updateUserPassword(id, password) {
    await connectMongo();
    const user = await UserModel.findOneAndUpdate(
      { id },
      {
        $set: {
          password,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      },
      { returnDocument: "after" }
    ).lean();
    return user ? toUser(user) : void 0;
  }
  async getTrip(id) {
    await connectMongo();
    const trip = await TripModel.findOne({ id }).lean();
    return trip ? toTrip(trip) : void 0;
  }
  async getUserTrips(userId) {
    await connectMongo();
    const trips = await TripModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return trips.map(toTrip);
  }
  async getAllTrips() {
    await connectMongo();
    const trips = await TripModel.find().sort({ createdAt: -1 }).lean();
    return trips.map(toTrip);
  }
  async createTrip(trip) {
    await connectMongo();
    const id = await nextId("trips");
    const created = await TripModel.create({
      ...trip,
      id
    });
    return toTrip(created.toObject());
  }
  async updateTrip(id, updates) {
    await connectMongo();
    const updated = await TripModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    ).lean();
    if (!updated) {
      throw new Error("Trip not found");
    }
    return toTrip(updated);
  }
  async deleteTrip(id) {
    await connectMongo();
    await TripModel.deleteOne({ id });
  }
  async getPlaces() {
    await connectMongo();
    const places = await PlaceModel.find().lean();
    return places.map(toPlace);
  }
  async createPlace(place) {
    await connectMongo();
    const id = await nextId("places");
    const created = await PlaceModel.create({
      id,
      ...place
    });
    return toPlace(created.toObject());
  }
  async getActivityLogs(limit = 50) {
    await connectMongo();
    const logs = await ActivityLogModel.find().sort({ timestamp: -1 }).limit(limit).lean();
    return logs.map(toActivityLog);
  }
  async createActivityLog(log) {
    await connectMongo();
    const id = await nextId("activity_logs");
    const created = await ActivityLogModel.create({
      id,
      ...log
    });
    return toActivityLog(created.toObject());
  }
}
const storage = new DatabaseStorage();
export {
  DatabaseStorage,
  storage
};
