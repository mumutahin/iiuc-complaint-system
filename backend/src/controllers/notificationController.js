import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { LIMITS } from '../../../shared/constants.js';

/** GET /api/notifications */
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { userId: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(LIMITS.PAGE_SIZE_MAX, Math.max(1, parseInt(limit, 10) || 20));

  const [docs, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Notification.countDocuments(query),
  ]);

  sendSuccess(res, { data: docs, pagination: buildPagination({ total, page: pageNum, limit: limitNum }) });
});

/** GET /api/notifications/unread-count */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  sendSuccess(res, { data: { count } });
});

/** PATCH /api/notifications/:id/read */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found.', 'NOT_FOUND');
  sendSuccess(res, { data: notification });
});

/** PATCH /api/notifications/read-all */
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  sendSuccess(res, { message: 'All notifications marked as read.' });
});
