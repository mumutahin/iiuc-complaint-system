/**
 * Throw this from anywhere in a controller/service and errorMiddleware
 * will turn it into the correct, consistent JSON error response.
 *
 *   throw new ApiError(404, 'Complaint not found', 'NOT_FOUND');
 *   throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', [
 *     { field: 'title', message: 'Title is required' },
 *   ]);
 */
export class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isApiError = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
