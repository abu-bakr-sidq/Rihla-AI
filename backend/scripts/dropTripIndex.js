/**
 * Drop the stale 'id_1' index on the trips collection.
 * Run with: node scripts/dropTripIndex.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/AI-TP-Connection";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    const db = mongoose.connection.db;
    const collection = db.collection("trips");

    // List all indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map(i => i.name));

    // Drop the stale id_1 index if it exists
    const hasStaleIndex = indexes.some(i => i.name === "id_1");
    if (hasStaleIndex) {
      await collection.dropIndex("id_1");
      console.log("✅ Dropped stale 'id_1' index successfully.");
    } else {
      console.log("ℹ️  No 'id_1' index found — nothing to drop.");
    }

    await mongoose.disconnect();
    console.log("Done.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
