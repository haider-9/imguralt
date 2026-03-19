import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Video } from '$lib/server/models/video';

export const GET: RequestHandler = async ({ params }) => {
	try {
		await connectDB();

		const { id } = params;

		const video = await Video.findOneAndUpdate(
			{ shortId: id },
			{ $inc: { views: 1 } },
			{ new: true, lean: true }
		);

		if (!video) {
			return json({ error: 'Video not found' }, { status: 404 });
		}

		return json({ video });
	} catch (err) {
		console.error('Failed to fetch video:', err);
		return json({ error: 'Failed to fetch video' }, { status: 500 });
	}
};
