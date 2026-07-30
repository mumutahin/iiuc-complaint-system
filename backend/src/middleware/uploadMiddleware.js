import multer from 'multer';
import { LIMITS } from '../../../shared/constants.js';

/**
 * memoryStorage keeps the file as a Buffer in req.file.buffer instead of
 * writing to disk. That's exactly what cloudinaryService.uploadImage()
 * expects, and it means we never leave temp files lying around on a
 * host with an ephemeral filesystem (like Render's free tier).
 */
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Passing an Error here makes multer stop the upload and surface it
    // through the error-handling middleware, with a clear message
    // instead of a generic "unexpected field" error.
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, PNG, or WEBP images are allowed.'));
  }
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: LIMITS.MAX_IMAGE_SIZE_BYTES,
    files: LIMITS.MAX_IMAGES,
  },
});
