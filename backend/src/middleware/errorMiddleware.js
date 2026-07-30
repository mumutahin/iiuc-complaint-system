import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

/**
 * 404 handler for any request that didn't match a real route.
 *
 * NOTE ON EXPRESS 5: earlier tutorials write `app.all('*', handler)` or
 * `app.use('*', handler)` for this. As of Express 5's router rewrite
 * (path-to-regexp v8), a bare '*' throws "Missing parameter name" at
 * startup — it now has to be a NAMED wildcard like '/*splat'. We avoid
 * the whole footgun by giving app.use() NO PATH ARGUMENT AT ALL: a
 * path-less middleware matches every request regardless of Express
 * version, so this line is safe on Express 4 and Express 5 alike.
 * Must be mounted AFTER every real route.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
}

/**
 * Centralized error handler. Must be registered LAST, and must keep all
 * four arguments (err, req, res, next) — Express identifies an
 * error-handling middleware purely by that four-argument arity.
 */
// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
  // Our own, deliberate errors (ApiError) already know their status/code.
  if (err instanceof ApiError || err?.isApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Mongoose validation errors (schema minlength/maxlength/enum/required).
  if (err?.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // Mongoose duplicate key (unique index violation) — e.g. email, department code.
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `That ${field} is already in use.`,
      code: 'DUPLICATE_KEY',
      errors: [{ field, message: `This ${field} already exists.` }],
    });
  }

  // Mongoose CastError — usually an invalid ObjectId in a URL param.
  if (err?.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format.',
      code: 'INVALID_ID',
    });
  }

  // Multer (file upload) errors.
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'Image must be smaller than 5MB.',
      LIMIT_FILE_COUNT: 'You can attach at most 3 images.',
      LIMIT_UNEXPECTED_FILE: err.message || 'Only JPEG, PNG, or WEBP images are allowed.',
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || 'Image upload failed.',
      code: 'UPLOAD_ERROR',
    });
  }

  // Anything unexpected: log full detail on the server, but NEVER leak
  // a stack trace or internal message to the client.
  console.error('[unhandled error]', err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong on our end. Please try again.',
    code: 'INTERNAL_ERROR',
  });
}
