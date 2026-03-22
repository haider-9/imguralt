import mongoose from "mongoose";
import { MONGODB_URI } from "$env/static/private";

let connectionPromise: Promise<typeof mongoose> | null = null;
let isConnected = false;

export async function connectDB() {
  // Return early if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  // Return existing promise if connection is in progress
  if (connectionPromise) {
    try {
      await connectionPromise;
      return;
    } catch (error) {
      // Reset promise on failure so we can retry
      connectionPromise = null;
      throw error;
    }
  }

  if (!MONGODB_URI) {
    console.warn("⚠️  MONGODB_URI not found in environment variables");
    throw new Error("MongoDB URI is required");
  }

  console.log("🔄 Attempting to connect to MongoDB...");

  connectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 3_000, // Very short timeout for faster failure
    socketTimeoutMS: 45_000,
    maxPoolSize: 10,
    bufferCommands: false,
    retryWrites: true,
    w: 'majority'
  } as Parameters<typeof mongoose.connect>[1]);

  try {
    await connectionPromise;
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    connectionPromise = null;
    isConnected = false;
    
    // More specific error handling
    if (err instanceof Error) {
      if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
        console.error("❌ DNS/Network issue: Cannot resolve MongoDB Atlas hostname");
        console.error("   This could be due to:");
        console.error("   - Firewall blocking MongoDB Atlas");
        console.error("   - DNS server issues");
        console.error("   - Network connectivity problems");
      } else if (err.message.includes('IP whitelist') || err.message.includes('not authorized')) {
        console.error("❌ IP not whitelisted in MongoDB Atlas");
      } else {
        console.error("❌ MongoDB connection failed:", err.message);
      }
    }
    throw err;
  }
}

// Safe connection function that doesn't throw
export async function connectDBSafe(): Promise<boolean> {
  try {
    await connectDB();
    return true;
  } catch (error) {
    // Don't log here to avoid duplicate logs
    return false;
  }
}

// Handle connection events (but don't let them crash the process)
mongoose.connection.once('connected', () => {
  isConnected = true;
  console.log('� Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err: Error) => {
  isConnected = false;
  // Only log if it's not the same DNS error we already handled
  if (!err.message.includes('querySrv ECONNREFUSED')) {
    console.error('❌ Mongoose connection error:', err.message);
  }
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('📴 Mongoose disconnected from MongoDB');
});

// Export connection status
export const getConnectionStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState
});
