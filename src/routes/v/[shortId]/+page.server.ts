import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/server/db';
import { Video } from '$lib/server/models/video';

export const load: PageServerLoad = async ({ params }) => {
	await connectDB();

	const video = await Video.findOneAndUpdate(
		{ shortId: params.shortId },
		{ $inc: { views: 1 } },
		{ new: true, lean: true }
	);

	if (!video) {
		throw error(404, 'Video not found');
	}

	return {
		video: JSON.parse(JSON.stringify(video))
	};
};
