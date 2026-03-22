import type { PageServerLoad } from './$types';
import { connectDBSafe } from '$lib/server/db';
import { Video } from '$lib/server/models/video';
import { fallbackDB } from '$lib/server/fallback-db';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  
  // Try to connect to database
  const dbConnected = await connectDBSafe();
  
  if (!dbConnected) {
    console.warn('⚠️  Using fallback data (MongoDB unavailable)');
    
    // Use fallback in-memory data
    const fallbackVideos = fallbackDB.videos.find({ isPublic: true })
      .sort({ uploadedAt: -1 })
      .limit(24)
      .skip(0)
      .lean();
    
    return {
      user: session?.user || null,
      videos: fallbackVideos,
      dbStatus: 'fallback'
    };
  }

  try {
    // Get public videos for gallery
    const publicVideos = await Video.find({ isPublic: true })
      .sort({ uploadedAt: -1 })
      .limit(24)
      .lean();

    return {
      user: session?.user || null,
      videos: JSON.parse(JSON.stringify(publicVideos)),
      dbStatus: 'connected'
    };
  } catch (error) {
    console.error('Database query error:', error instanceof Error ? error.message : error);
    
    // Fallback to in-memory data on query error
    const fallbackVideos = fallbackDB.videos.find({ isPublic: true })
      .sort({ uploadedAt: -1 })
      .limit(24)
      .skip(0)
      .lean();
    
    return {
      user: session?.user || null,
      videos: fallbackVideos,
      dbStatus: 'fallback'
    };
  }
};