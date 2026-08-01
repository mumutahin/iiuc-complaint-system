import mongoose from 'mongoose';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  PRIORITIES,
  COMMENT_TYPES,
  LIMITS,
} from '../../../shared/constants.js';

const { Schema, model } = mongoose;

const commentSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: LIMITS.COMMENT_MAX },
    type: { type: String, enum: COMMENT_TYPES, default: 'public' },
    // References another comment's _id within the SAME complaint's array,
    // for one level of "reply" nesting. Null = top-level comment. We only
    // ever allow replying to a top-level comment (enforced in the
    // controller), not to a reply, to keep threading simple and shallow.
    parentId: { type: Schema.Types.ObjectId, default: null },
    editedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: true }
);

const activityLogSchema = new Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.TITLE_MIN,
      maxlength: LIMITS.TITLE_MAX,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.DESCRIPTION_MIN,
      maxlength: LIMITS.DESCRIPTION_MAX,
    },
    category: { type: String, enum: COMPLAINT_CATEGORIES, required: true },
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.LOCATION_MIN,
      maxlength: LIMITS.LOCATION_MAX,
    },
    status: { type: String, enum: COMPLAINT_STATUSES, default: 'Pending' },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    images: {
      type: [String],
      default: [],
      validate: [(arr) => arr.length <= LIMITS.MAX_IMAGES, `Maximum ${LIMITS.MAX_IMAGES} images allowed`],
    },
    // Cloudinary publicIds kept alongside URLs so we can delete the actual
    // asset when the complaint is deleted (not just forget the URL).
    imagePublicIds: { type: [String], default: [] },
    upvotes: { type: [String], default: [] }, // firebaseUids of students who upvoted
    comments: { type: [commentSchema], default: [] },
    activityLogs: { type: [activityLogSchema], default: [] },
    isAnonymous: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Full-text search across title + description (used by the search bar).
complaintSchema.index({ title: 'text', description: 'text' });
// Admin "all complaints" list, sorted newest first, filtered by status.
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1 });
// "My Complaints" (student) — always filtered by studentId, sorted by date.
complaintSchema.index({ studentId: 1, createdAt: -1 });
// Authority dashboard — complaints in their department, by status.
complaintSchema.index({ departmentId: 1, status: 1 });
complaintSchema.index({ assignedTo: 1 });

export const Complaint = model('Complaint', complaintSchema);
