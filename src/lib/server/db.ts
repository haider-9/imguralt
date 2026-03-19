import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://haider:108663@cluster0.sbzs5ys.mongodb.net/imguralt?retryWrites=true&w=majority&appName=Cluster0";

// Cache the connection promise so parallel requests don't each try to connect
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  // Already fully connected
  if (mongoose.connection.readyState === 1) return;

  // A connection attempt is already in flight — wait for it
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });

  try {
    await connectionPromise;
    console.log("✅ MongoDB connected");
  } catch (err) {
    // Reset so the next request can try again
    connectionPromise = null;
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}
