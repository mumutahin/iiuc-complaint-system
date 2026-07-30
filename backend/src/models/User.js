import mongoose from 'mongoose';
import { USER_ROLES, LIMITS } from '../../../shared/constants.js';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.NAME_MIN,
      maxlength: LIMITS.NAME_MAX,
    },
    role: { type: String, enum: USER_ROLES, default: 'student' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    avatar: { type: String, default: null },
    phone: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Used by "all authorities" dropdown (admin + superadmin lookups) and role filters.
userSchema.index({ role: 1 });

export const User = model('User', userSchema);
