import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { LIMITS } from '../../../shared/constants.js';

/**
 * POST /api/auth/me
 * Called once right after Firebase sign-in/sign-up completes. By the
 * time this runs, authMiddleware has ALREADY verified the token and
 * either found or auto-created the matching MongoDB user — this handler
 * just re-fetches the full document (with department populated) and
 * returns it, so the frontend has everything it needs in one call.
 */
export const syncUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('departmentId', 'name code');
  sendSuccess(res, { data: user });
});

/** GET /api/auth/profile */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('departmentId', 'name code');
  sendSuccess(res, { data: user });
});

/** PATCH /api/auth/profile — student/admin updating their own display name/phone. */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const update = {};

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (trimmed.length < LIMITS.NAME_MIN || trimmed.length > LIMITS.NAME_MAX) {
      throw new ApiError(
        400,
        `Name must be between ${LIMITS.NAME_MIN} and ${LIMITS.NAME_MAX} characters.`,
        'VALIDATION_ERROR'
      );
    }
    update.name = trimmed;
  }
  if (phone !== undefined) {
    update.phone = String(phone).trim() || null;
  }

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).populate(
    'departmentId',
    'name code'
  );
  sendSuccess(res, { data: user, message: 'Profile updated.' });
});
