import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/server/db';
import { Video } from '$lib/server/models/video';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  
  try {
    await connectDB();

    // Get public videos for gallery
    const publicVideos = await Video.find({ isPublic: true })
      .sort({ uploadedAt: -1 })
      .limit(24)
      .lean();

    return {
      user: session?.user || null,
      videos: JSON.parse(JSON.stringify(publicVideos))
    };
  } catch (error) {
    console.error('Database error in main page:', error);
    
    // Return empty data if database is unavailable
    return {
      user: session?.user || null,
      videos: []
    };
  }
};