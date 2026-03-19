const CLOUD_NAME = 'dntncz9no';

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;
export const UPLOAD_PRESET = 'unsigned_preset';

/**
 * Get the original video URL from a Cloudinary public ID
 */
export function getVideoUrl(publicId: string): string {
	return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${publicId}`;
}

/**
 * Get an animated GIF URL from a Cloudinary video public ID.
 * Cloudinary converts video -> GIF on the fly just by changing the extension.
 * We scale to 480px wide, 10fps, loop forever.
 */
export function getGifUrl(publicId: string): string {
	return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_480,fps_10,e_loop/${publicId}.gif`;
}

/**
 * Get an animated WebP URL (smaller than GIF, better quality)
 */
export function getWebpUrl(publicId: string): string {
	return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_480,fps_10,e_loop,f_webp,fl_animated,fl_awebp/${publicId}.webp`;
}

/**
 * Get a static thumbnail/poster image from the video (first frame)
 */
export function getThumbnailUrl(publicId: string): string {
	return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_640,h_360,c_fill,so_0/${publicId}.jpg`;
}

/**
 * Build a shareable page URL for a video given its shortId
 */
export function getShareUrl(shortId: string, origin: string): string {
	return `${origin}/v/${shortId}`;
}
