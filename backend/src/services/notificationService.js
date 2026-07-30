import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { getIO } from '../sockets/socketManager.js';

/**
 * Saves a notification to MongoDB (so the bell icon has history even if
 * the user was offline) AND emits it in real time over Socket.io to
 * whichever room `user:${userId}` maps to. If the emit fails (e.g. no
 * socket server yet, or the user is offline), we log and move on — the
 * notification is still safely in the database either way.
 */
export async function createAndEmit({ userId, type, title, message, complaintId }) {
  const notification = await Notification.create({ userId, type, title, message, complaintId });

  try {
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        complaintId: notification.complaintId,
        isRead: false,
        createdAt: notification.createdAt,
      });
    }
  } catch (err) {
    console.error('[notificationService] socket emit failed:', err.message);
  }

  return notification;
}

/** Notify every admin/superadmin in a specific department (a new complaint routed there). */
export async function notifyDepartment({ departmentId, type, title, message, complaintId }) {
  const staff = await User.find({ departmentId, role: { $in: ['admin', 'superadmin'] } }).select('_id');
  await Promise.all(
    staff.map((u) => createAndEmit({ userId: u._id, type, title, message, complaintId }))
  );
}

/** Notify every superadmin (used when a complaint has no department yet). */
export async function notifySuperadmins({ type, title, message, complaintId }) {
  const superadmins = await User.find({ role: 'superadmin' }).select('_id');
  await Promise.all(
    superadmins.map((u) => createAndEmit({ userId: u._id, type, title, message, complaintId }))
  );
}
