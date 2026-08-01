import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';
import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getFirebaseAdmin } from '../config/firebaseAdmin.js';
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

/**
 * DELETE /api/auth/me — self-service account deletion.
 *
 * Deliberately does NOT touch complaints: deleting your account removes
 * your login and your personal notifications, but every complaint you
 * ever filed (or handled, if you're staff) stays exactly where it is —
 * complaints are the university's record, not the account's. Any
 * complaints still assigned to a deleted staff member are released back
 * to "unassigned" so someone else can pick them up, rather than staying
 * silently stuck with a ghost assignee.
 */
export const deleteMyAccount = asyncHandler(async (req, res) => {
  const { _id: userId, firebaseUid, role } = req.user;

  if (role === 'superadmin') {
    const otherSuperadmins = await User.countDocuments({ role: 'superadmin', _id: { $ne: userId } });
    if (otherSuperadmins === 0) {
      throw new ApiError(
        409,
        'You are the only superadmin — promote someone else to superadmin before deleting your own account, or the system would have no one left to manage it.',
        'LAST_SUPERADMIN'
      );
    }
  }

  await Complaint.updateMany({ assignedTo: userId }, { assignedTo: null });
  await Notification.deleteMany({ userId });
  await User.findByIdAndDelete(userId);

  try {
    await getFirebaseAdmin().auth().deleteUser(firebaseUid);
  } catch (err) {
    // Not fatal: the MongoDB side (what actually gates access to the
    // app) is already gone. A stray Firebase Auth record without a
    // matching MongoDB user just gets a fresh 'student' profile
    // auto-created if it's ever used to log in again, same as any
    // brand-new sign-in — it's not a security hole, just untidy.
    console.error('[deleteMyAccount] failed to delete Firebase user:', err.message);
  }

  sendSuccess(res, { message: 'Account deleted.' });
});
