import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/server/db';
import { Video } from '$lib/server/models/video';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  
  if (!session?.user) {
    throw redirect(302, '/auth/signin');
  }

  try {
    await connectDB();

    // Get user's videos
    const userVideos = await Video.find({ userId: session.user.id })
      .sort({ uploadedAt: -1 })
      .limit(50)
      .lean();

    // Get user stats
    const totalVideos = await Video.countDocuments({ userId: session.user.id });
    const totalViews = await Video.aggregate([
      { $match: { userId: session.user.id } },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    return {
      user: session.user,
      videos: JSON.parse(JSON.stringify(userVideos)),
      stats: {
        totalVideos,
        totalViews: totalViews[0]?.total || 0,
      }
    };
  } catch (error) {
    console.error('Database error in dashboard:', error);
    
    // Return empty data if database is unavailable
    return {
      user: session.user,
      videos: [],
      stats: {
        totalVideos: 0,
        totalViews: 0,
      }
    };
  }
};