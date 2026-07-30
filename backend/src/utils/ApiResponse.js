/**
 * Every successful response in this API has the exact same shape:
 *   { success: true, data, message?, pagination? }
 * Every error response (see errorMiddleware.js) has:
 *   { success: false, message, code, errors? }
 *
 * Both frontends' axios interceptor (services/api.js) relies on this
 * being 100% consistent across every single route.
 */
export function sendSuccess(res, { statusCode = 200, data = null, message, pagination } = {}) {
  const body = { success: true };
  if (data !== null && data !== undefined) body.data = data;
  if (message) body.message = message;
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
}

export function buildPagination({ total, page, limit }) {
  return {
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}
