import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { connectDB } from "$lib/server/db";
import { Video } from "$lib/server/models/video";
import {
  getVideoUrl,
  getGifUrl,
  getThumbnailUrl,
  getCloudinaryWebpUrl,
} from "$lib/cloudinary";
import { nanoid } from "nanoid";

export const POST: RequestHandler = async ({ request }) => {
  try {
    await connectDB();

    const body = await request.json();
    const {
      public_id,
      secure_url,
      bytes,
      duration,
      format,
      width,
      height,
      original_filename,
    } = body;

    if (!public_id || !secure_url) {
      return json(
        { error: "Missing required fields: public_id, secure_url" },
        { status: 400 },
      );
    }

    // If already uploaded return existing record
    const existing = await Video.findOne({ publicId: public_id });
    if (existing) {
      return json({ video: existing.toObject() }, { status: 200 });
    }

    const shortId = nanoid(8);

    const video = await Video.create({
      shortId,
      title: original_filename || "Untitled",
      publicId: public_id,
      // Direct Cloudinary URL — used only in the <video> player (needs range requests)
      originalUrl: getVideoUrl(public_id),
      // Branded custom URLs — these are what users see and share
      gifUrl: getGifUrl(shortId),
      webpUrl: getCloudinaryWebpUrl(public_id),
      thumbnailUrl: getThumbnailUrl(shortId),
      size: bytes || 0,
      duration: duration || 0,
      format: format || "mp4",
      width: width || 0,
      height: height || 0,
    });

    return json({ video: video.toObject() }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return json({ error: "Failed to save video" }, { status: 500 });
  }
};
