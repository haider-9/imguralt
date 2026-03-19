import mongoose from "mongoose";
import { MONGODB_URI } from "$env/static/private";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  } as Parameters<typeof mongoose.connect>[1]);

  try {
    await connectionPromise;
    console.log("✅ MongoDB connected");
  } catch (err) {
    connectionPromise = null;
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}
