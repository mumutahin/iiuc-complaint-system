import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../../../shared/constants.js';

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Notification bell: "unread notifications for this user, newest first".
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = model('Notification', notificationSchema);
