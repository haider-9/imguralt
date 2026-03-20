import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Video } from '$lib/server/models/video';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    const session = await locals.auth();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { title } = await request.json();

    const video = await Video.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { title },
      { new: true }
    );

    if (!video) {
      return json({ error: 'Video not found' }, { status: 404 });
    }

    return json({ video: video.toObject() });
  } catch (error) {
    console.error('Update video error:', error);
    return json({ error: 'Failed to update video' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const session = await locals.auth();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const video = await Video.findOneAndDelete({
      _id: params.id,
      userId: session.user.id
    });

    if (!video) {
      return json({ error: 'Video not found' }, { status: 404 });
    }

    return json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    return json({ error: 'Failed to delete video' }, { status: 500 });
  }
};