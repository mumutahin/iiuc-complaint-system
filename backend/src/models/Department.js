import mongoose from 'mongoose';
import { LIMITS, COMPLAINT_CATEGORIES } from '../../../shared/constants.js';

const { Schema, model } = mongoose;

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: LIMITS.DEPARTMENT_CODE_MAX,
    },
    description: { type: String, trim: true, maxlength: LIMITS.DEPARTMENT_DESC_MAX, default: '' },
    // Which complaint categories this department handles. Used to
    // auto-route a brand-new complaint to the right department instead
    // of leaving every single complaint for a superadmin to triage by
    // hand. A category can be left unassigned to any department (the
    // complaint just starts with departmentId: null and shows up in the
    // superadmin's "unassigned" queue instead).
    categories: {
      type: [String],
      default: [],
      validate: [(arr) => arr.every((c) => COMPLAINT_CATEGORIES.includes(c)), 'Unknown category in list'],
    },
  },
  { timestamps: true }
);

export const Department = model('Department', departmentSchema);
