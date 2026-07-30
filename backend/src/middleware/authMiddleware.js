import { getFirebaseAdmin } from '../config/firebaseAdmin.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Runs on every protected route. Order of operations matters:
 *   1. Pull the Bearer token out of the Authorization header.
 *   2. Verify it with Firebase Admin (this is what makes the token
 *      trustworthy — anyone can SEND a JWT-looking string, only Firebase
 *      can tell us if it's real and unexpired).
 *   3. Look the user up in MongoDB by firebaseUid.
 *   4. First time we ever see this firebaseUid → auto-create a 'student'
 *      user. This is what makes registration "just work": the frontend
 *      never has to call a separate "create my account" endpoint, it
 *      simply calls POST /api/auth/me right after Firebase sign-up/sign-in
 *      and this middleware (plus authController.syncUser) does the rest.
 *   5. Disabled accounts are blocked with 403, everyone else gets
 *      req.user attached and moves on.
 */
export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      throw new ApiError(401, 'Authentication required.', 'NO_TOKEN');
    }

    let decoded;
    try {
      decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
    } catch (err) {
      if (err?.code === 'auth/id-token-expired') {
        throw new ApiError(401, 'Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
      }
      if (err?.code === 'auth/argument-error') {
        throw new ApiError(401, 'Invalid authentication token.', 'INVALID_TOKEN');
      }
      throw new ApiError(401, 'Could not verify your session. Please log in again.', 'AUTH_FAILED');
    }

    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      const fallbackName = decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'Student');
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email || `${decoded.uid}@no-email.local`,
        name: fallbackName,
        role: 'student',
      });
    }

    if (!user.isActive) {
      throw new ApiError(403, 'This account has been disabled. Contact an administrator.', 'ACCOUNT_DISABLED');
    }

    req.user = {
      _id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    };

    next();
  } catch (err) {
    next(err);
  }
}
