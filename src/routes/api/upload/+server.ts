import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { connectDB } from "$lib/server/db";
import { Video } from "$lib/server/models/video";
import {
  getVideoUrl,
  getCloudinaryGifUrl,
  getCloudinaryWebpUrl,
  getCloudinaryThumbnailUrl,
} from "$lib/cloudinary";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    
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

    try {
      await connectDB();

      // If already uploaded return existing record
      const existing = await Video.findOne({ publicId: public_id });
      if (existing) {
        return json({ video: existing.toObject() }, { status: 200 });
      }

      const video = await Video.create({
        title: original_filename || "Untitled",
        publicId: public_id,
        originalUrl: getVideoUrl(public_id),
        gifUrl: getCloudinaryGifUrl(public_id),
        webpUrl: getCloudinaryWebpUrl(public_id),
        thumbnailUrl: getCloudinaryThumbnailUrl(public_id),
        size: bytes || 0,
        duration: duration || 0,
        format: format || "mp4",
        width: width || 0,
        height: height || 0,
        userId: session?.user?.id,
        isPublic: true,
      });

      return json({ video: video.toObject() }, { status: 201 });
    } catch (dbError) {
      console.error("Database error during upload:", dbError);
      
      // Return the video data even if we can't save to database
      // This allows the upload to work without database
      const videoData = {
        title: original_filename || "Untitled",
        publicId: public_id,
        originalUrl: getVideoUrl(public_id),
        gifUrl: getCloudinaryGifUrl(public_id),
        webpUrl: getCloudinaryWebpUrl(public_id),
        thumbnailUrl: getCloudinaryThumbnailUrl(public_id),
        size: bytes || 0,
        duration: duration || 0,
        format: format || "mp4",
        width: width || 0,
        height: height || 0,
        userId: session?.user?.id,
        isPublic: true,
        _id: public_id, // Use publicId as temporary ID
      };

      return json({ 
        video: videoData,
        warning: "Video uploaded but not saved to database"
      }, { status: 201 });
    }
  } catch (err) {
    console.error("Upload error:", err);
    return json({ error: "Failed to save video" }, { status: 500 });
  }
};
