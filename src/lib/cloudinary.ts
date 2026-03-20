import {
  PUBLIC_CLOUDINARY_CLOUD_NAME,
  PUBLIC_CLOUDINARY_UPLOAD_PRESET,
} from "$env/static/public";

// ── Cloudinary config (safe to expose — public vars) ─────────────────────────
export const CLOUD_NAME = PUBLIC_CLOUDINARY_CLOUD_NAME;
export const UPLOAD_PRESET = PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

// ── Cloudinary URL builders ───────────────

/** Direct streamable video URL — used in <video src=...> */
export function getVideoUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${publicId}`;
}

/** Animated GIF — Cloudinary converts video→GIF on the fly via URL extension */
export function getCloudinaryGifUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_480,fps_10,e_loop,q_auto/${publicId}.gif`;
}

/** Animated WebP — smaller than GIF, better quality */
export function getCloudinaryWebpUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_480,fps_10,e_loop,q_auto,f_webp,fl_animated,fl_awebp/${publicId}.webp`;
}

/** Static poster/thumbnail — first frame as JPEG */
export function getCloudinaryThumbnailUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_640,h_360,c_fill,so_0,q_auto,f_jpg/${publicId}.jpg`;
}
