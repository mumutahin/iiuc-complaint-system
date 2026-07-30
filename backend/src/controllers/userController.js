import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { USER_ROLES, LIMITS } from '../../../shared/constants.js';

/** GET /api/users — superadmin only */
export const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = LIMITS.PAGE_SIZE_DEFAULT } = req.query;
  const query = {};
  if (role && USER_ROLES.includes(role)) query.role = role;
  if (search) {
    query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(LIMITS.PAGE_SIZE_MAX, Math.max(1, parseInt(limit, 10) || LIMITS.PAGE_SIZE_DEFAULT));

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-__v')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  sendSuccess(res, { data: users, pagination: buildPagination({ total, page: pageNum, limit: limitNum }) });
});

/** PATCH /api/users/:id/role — superadmin only. Body: { role, departmentId? } */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role, departmentId } = req.body;

  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot change your own role.', 'SELF_ROLE_CHANGE');
  }
  if (!USER_ROLES.includes(role)) {
    throw new ApiError(400, 'Invalid role.', 'VALIDATION_ERROR');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.', 'NOT_FOUND');

  if (role === 'admin') {
    if (!departmentId) {
      throw new ApiError(400, 'A department must be assigned when setting a user as admin.', 'VALIDATION_ERROR');
    }
    const dept = await Department.findById(departmentId);
    if (!dept) throw new ApiError(400, 'That department does not exist.', 'VALIDATION_ERROR');
    user.departmentId = departmentId;
  } else if (role === 'student') {
    user.departmentId = null;
  }
  // superadmin keeps whatever departmentId it already had (irrelevant for that role).

  user.role = role;
  await user.save();

  const populated = await User.findById(user._id).populate('departmentId', 'name code');
  sendSuccess(res, { data: populated, message: `Role updated to ${role}.` });
});

/** PATCH /api/users/:id/active — superadmin only. Body: { isActive } */
export const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot deactivate your own account.', 'SELF_DEACTIVATE');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive: Boolean(isActive) }, { new: true }).populate(
    'departmentId',
    'name code'
  );
  if (!user) throw new ApiError(404, 'User not found.', 'NOT_FOUND');

  sendSuccess(res, { data: user, message: isActive ? 'Account enabled.' : 'Account disabled.' });
});
