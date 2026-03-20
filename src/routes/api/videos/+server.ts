import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Video } from '$lib/server/models/video';

export const GET: RequestHandler = async ({ url }) => {
  try {
    await connectDB();

    const limit = parseInt(url.searchParams.get('limit') || '24');
    const skip = parseInt(url.searchParams.get('skip') || '0');

    const videos = await Video.find({ isPublic: true })
      .sort({ uploadedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return json({ videos });
  } catch (error) {
    console.error('Get videos error:', error);
    return json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
};