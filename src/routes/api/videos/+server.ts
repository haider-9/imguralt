import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Video } from '$lib/server/models/video';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const skip = parseInt(url.searchParams.get('skip') || '0');

    try {
      await connectDB();

      const videos = await Video.find({ isPublic: true })
        .sort({ uploadedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return json({ videos });
    } catch (dbError) {
      console.error('Database error in videos API:', dbError);
      
      // Return empty array if database is unavailable
      return json({ 
        videos: [],
        warning: 'Database unavailable'
      });
    }
  } catch (error) {
    console.error('Get videos error:', error);
    return json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
};