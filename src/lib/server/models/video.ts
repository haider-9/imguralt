import mongoose, { type Document, Schema } from "mongoose";

export interface IVideo extends Document {
  title: string;
  publicId: string;
  originalUrl: string;
  gifUrl: string;
  webpUrl: string;
  thumbnailUrl: string;
  size: number;
  duration: number;
  format: string;
  width: number;
  height: number;
  uploadedAt: Date;
  views: number;
  userId?: string;
  isPublic: boolean;
}

const VideoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      default: "Untitled",
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    originalUrl: {
      type: String,
      required: true,
    },
    gifUrl: {
      type: String,
      required: true,
    },
    webpUrl: {
      type: String,
      default: "",
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    format: {
      type: String,
      default: "mp4",
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    userId: {
      type: String,
      ref: "User",
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "uploadedAt", updatedAt: false },
  },
);

export const Video =
  mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema);
