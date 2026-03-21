import mongoose from "mongoose";
import { MONGODB_URI } from "$env/static/private";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  if (!MONGODB_URI) {
    console.warn("⚠️  MONGODB_URI not found in environment variables");
    throw new Error("MongoDB URI is required");
  }

  connectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 45_000,
    maxPoolSize: 10,
    bufferCommands: false,
  } as Parameters<typeof mongoose.connect>[1]);

  try {
    await connectionPromise;
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    connectionPromise = null;
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

// Handle connection events for better debugging
const connection = mongoose.connection;

connection.once('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

connection.on('error', (err: Error) => {
  console.error('❌ Mongoose connection error:', err);
});

connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB');
});
