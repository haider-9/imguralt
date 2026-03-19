import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Video } from '$lib/server/models/video';

export const GET: RequestHandler = async ({ url }) => {
	try {
		await connectDB();

		const page = parseInt(url.searchParams.get('page') ?? '1');
		const limit = parseInt(url.searchParams.get('limit') ?? '20');
		const skip = (page - 1) * limit;

		const [videos, total] = await Promise.all([
			Video.find({}).sort({ uploadedAt: -1 }).skip(skip).limit(limit).lean(),
			Video.countDocuments({})
		]);

		return json({
			videos,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit)
			}
		});
	} catch (err) {
		console.error('Failed to fetch videos:', err);
		return json({ error: 'Failed to fetch videos' }, { status: 500 });
	}
};
