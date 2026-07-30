import { ApiError } from '../utils/ApiError.js';

/**
 * restrictTo('admin', 'superadmin') → 403s anyone whose req.user.role
 * (set by authMiddleware, which MUST run first) isn't in the list.
 *
 * This is the backend half of role protection. The frontend RoleGuard
 * component hides admin nav/routes from students for a good UX, but
 * THIS middleware is what actually stops a student from calling an
 * admin API endpoint directly (e.g. with curl/Postman) — never trust
 * the frontend alone for authorization.
 */
export function restrictTo(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.', 'NO_TOKEN'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to access this resource.', 'FORBIDDEN')
      );
    }
    next();
  };
}
