import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Video } from '$lib/server/models/video';
import { getCloudinaryGifUrl } from '$lib/cloudinary';

export const GET: RequestHandler = async ({ params }) => {
	await connectDB();

	const video = await Video.findOne({ shortId: params.shortId }).lean();

	if (!video) {
		throw redirect(302, '/');
	}

	throw redirect(302, getCloudinaryGifUrl(video.publicId));
};
