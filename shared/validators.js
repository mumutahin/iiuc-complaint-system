/**
 * shared/validators.js
 * -----------------------------------------------------------------------
 * Plain-JS validation used on BOTH sides:
 *  - Frontend calls these before submitting, so the user sees inline
 *    errors instantly without a round trip.
 *  - Backend calls the SAME functions before writing to MongoDB, so the
 *    frontend can never "get out of sync" with what the server allows
 *    (Mongoose schema limits still exist too, as defense-in-depth, but
 *    the human-readable messages come from here).
 * -----------------------------------------------------------------------
 */
import { LIMITS, COMPLAINT_CATEGORIES, STATUS_TRANSITIONS } from './constants.js';

export function validateComplaintInput({ title, description, category, location }) {
  const errors = {};

  if (!title || title.trim().length < LIMITS.TITLE_MIN) {
    errors.title = `Title must be at least ${LIMITS.TITLE_MIN} characters.`;
  } else if (title.trim().length > LIMITS.TITLE_MAX) {
    errors.title = `Title cannot exceed ${LIMITS.TITLE_MAX} characters.`;
  }

  if (!description || description.trim().length < LIMITS.DESCRIPTION_MIN) {
    errors.description = `Description must be at least ${LIMITS.DESCRIPTION_MIN} characters.`;
  } else if (description.trim().length > LIMITS.DESCRIPTION_MAX) {
    errors.description = `Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters.`;
  }

  if (!category || !COMPLAINT_CATEGORIES.includes(category)) {
    errors.category = 'Please choose a valid category.';
  }

  if (!location || location.trim().length < LIMITS.LOCATION_MIN) {
    errors.location = `Location must be at least ${LIMITS.LOCATION_MIN} characters.`;
  } else if (location.trim().length > LIMITS.LOCATION_MAX) {
    errors.location = `Location cannot exceed ${LIMITS.LOCATION_MAX} characters.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'No file provided.' };
  if (!LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, or WEBP images are allowed.' };
  }
  if (file.size > LIMITS.MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'Image must be smaller than 5MB.' };
  }
  return { valid: true, error: null };
}

export function validateCommentText(text) {
  if (!text || !text.trim()) {
    return { valid: false, error: 'Comment cannot be empty.' };
  }
  if (text.trim().length > LIMITS.COMMENT_MAX) {
    return { valid: false, error: `Comment cannot exceed ${LIMITS.COMMENT_MAX} characters.` };
  }
  return { valid: true, error: null };
}

export function validateDepartmentInput({ name, code }) {
  const errors = {};
  if (!name || !name.trim()) errors.name = 'Department name is required.';
  if (!code || !code.trim()) {
    errors.code = 'Department code is required.';
  } else if (code.trim().length > LIMITS.DEPARTMENT_CODE_MAX) {
    errors.code = `Code cannot exceed ${LIMITS.DEPARTMENT_CODE_MAX} characters.`;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function isValidStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return false;
  const allowed = STATUS_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(nextStatus);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}
