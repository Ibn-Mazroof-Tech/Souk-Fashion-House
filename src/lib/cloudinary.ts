// ─────────────────────────────────────────────────────────────────────────────
// lib/cloudinary.ts — Cloudinary Configuration
// ─────────────────────────────────────────────────────────────────────────────

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Upload a file buffer to Cloudinary, return the secure URL
export async function uploadImage(
  buffer: Buffer,
  folder: string = "souk-fashion-house"
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          transformation: [
            { width: 800, height: 1000, crop: "limit", quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      )
      .end(buffer);
  });
}
