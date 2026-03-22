import { handle as authHandle } from "./lib/server/auth";
import { connectDBSafe } from "./lib/server/db";
import type { Handle } from "@sveltejs/kit";

// Try to initialize database connection on server start (non-blocking)
connectDBSafe().then(connected => {
  if (connected) {
    console.log("🚀 Server started with database connection");
  } else {
    console.log("🚀 Server started without database connection (will retry on requests)");
    console.log("💡 To fix MongoDB connection:");
    console.log("   1. Check your internet connection");
    console.log("   2. Verify IP whitelist in MongoDB Atlas");
    console.log("   3. Check if firewall blocks MongoDB Atlas");
    console.log("   4. Try connecting from a different network");
  }
}).catch(() => {
  // Silently handle any remaining errors
  console.log("🚀 Server started in offline mode");
});

// Prevent process crashes from unhandled MongoDB errors
process.on('unhandledRejection', (reason, promise) => {
  if (reason && typeof reason === 'object' && 'message' in reason) {
    const message = (reason as Error).message;
    if (message.includes('querySrv ECONNREFUSED') || message.includes('mongodb')) {
      console.warn('⚠️  MongoDB connection issue handled gracefully');
      return; // Don't crash the process
    }
  }
  // Re-throw other unhandled rejections
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export const handle: Handle = authHandle;