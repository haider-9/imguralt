import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDBSafe } from '$lib/server/db';
import { Video } from '$lib/server/models/video';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const skip = parseInt(url.searchParams.get('skip') || '0');

    // Try to connect to database
    const dbConnected = await connectDBSafe();
    
    if (!dbConnected) {
      return json({ 
        videos: [],
        error: 'Database unavailable'
      }, { status: 503 });
    }

    try {
      const videos = await Video.find({ isPublic: true })
        .sort({ uploadedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return json({ videos });
    } catch (dbError) {
      console.error('Database query error in videos API:', dbError instanceof Error ? dbError.message : dbError);
      
      return json({ 
        videos: [],
        error: 'Database query failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Videos API error:', error instanceof Error ? error.message : error);
    return json({ 
      videos: [],
      error: 'Internal server error' 
    }, { status: 500 });
  }
};