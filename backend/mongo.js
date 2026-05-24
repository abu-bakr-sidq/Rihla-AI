import "./env.js";
import mongoose from "mongoose";
let connectPromise = null;
async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (connectPromise) {
    return connectPromise;
  }
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!mongoUri) {
    throw new Error("MONGODB_URI must be set to run backend with MongoDB.");
  }
  connectPromise = mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB || void 0
  });
  try {
    await connectPromise;
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    console.log(`\x1b[32m✔\x1b[0m MongoDB connected: ${host}/${dbName}`);
    return mongoose;
  } finally {
    connectPromise = null;
  }
}
export {
  connectMongo
};
