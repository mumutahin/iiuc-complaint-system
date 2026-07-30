import { cloudinary, initCloudinary } from '../config/cloudinary.js';

/**
 * Uploads an in-memory Buffer (from multer's memoryStorage) to Cloudinary.
 * cloudinary.uploader.upload() only accepts a file path or a data URI, so
 * for a raw Buffer we use upload_stream and pipe the buffer into it,
 * wrapped in a Promise so callers can simply `await` it.
 */
export function uploadImage(buffer, folder = 'iiuc-complaints') {
  initCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Cap dimensions + auto format/quality so a phone photo doesn't
        // bloat storage or slow down every list page that renders it.
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Deletes an image from Cloudinary by its publicId. Failures are logged,
 * not thrown — a stray orphaned image in Cloudinary is a minor cleanup
 * issue, but letting that failure block deleting the complaint itself
 * (or crash the request) would be a much worse user-facing bug.
 */
export async function deleteImage(publicId) {
  if (!publicId) return;
  initCloudinary();
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[cloudinary] failed to delete image ${publicId}:`, err.message);
  }
}

export async function deleteImages(publicIds = []) {
  await Promise.all(publicIds.map((id) => deleteImage(id)));
}
