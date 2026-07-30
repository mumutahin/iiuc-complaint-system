/**
 * shared/constants.js
 * -----------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for every enum used across the whole system.
 *
 * All three projects (backend, student-frontend, admin-frontend) import
 * this exact file by relative path. Nobody re-types these lists.
 * If you ever add a new complaint category or status, change it HERE
 * ONLY and every part of the system (validation, dropdowns, DB schema,
 * filters) picks it up automatically.
 *
 * Plain JavaScript, zero dependencies, works unmodified in:
 *  - Node.js (backend, "type": "module" so `import` works)
 *  - Vite (both frontends, native ESM)
 * -----------------------------------------------------------------------
 */

export const USER_ROLES = ['student', 'admin', 'superadmin'];

export const COMPLAINT_CATEGORIES = [
  'Classroom Issues',
  'Lab Equipment Problems',
  'Internet/WiFi Issues',
  'Hostel Problems',
  'Transport Issues',
  'Library Issues',
  'Cleanliness Issues',
  'Security Issues',
];

export const COMPLAINT_STATUSES = [
  'Pending',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected',
];

export const PRIORITIES = ['Low', 'Medium', 'High'];

export const COMMENT_TYPES = ['public', 'internal'];

export const NOTIFICATION_TYPES = ['status_change', 'comment', 'assigned', 'resolved', 'new_complaint'];

/**
 * Which statuses a complaint is allowed to move to NEXT, from its
 * CURRENT status. Enforced on the backend (source of truth) AND used
 * on the frontend to only render valid options in the status dropdown,
 * so a student/admin never even sees an illegal transition as a choice.
 */
export const STATUS_TRANSITIONS = {
  Pending: ['Under Review', 'Rejected'],
  'Under Review': ['In Progress', 'Rejected', 'Pending'],
  'In Progress': ['Resolved', 'Under Review'],
  Resolved: ['In Progress'],
  Rejected: ['Pending'],
};

// Field limits — used by both the frontend form (character counters,
// `maxLength` attributes) and the backend Mongoose schema validators.
// Keeping them here means the counter the student sees always matches
// the limit the server enforces.
export const LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 100,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 2000,
  LOCATION_MIN: 3,
  LOCATION_MAX: 100,
  COMMENT_MAX: 500,
  MAX_IMAGES: 3,
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  NAME_MIN: 2,
  NAME_MAX: 50,
  DEPARTMENT_CODE_MAX: 10,
  DEPARTMENT_DESC_MAX: 500,
  PAGE_SIZE_DEFAULT: 10,
  PAGE_SIZE_MAX: 50,
};

export const FIREBASE_ERROR_MESSAGES = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/email-already-in-use': 'An account already exists with this email.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed before finishing.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a while and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  default: 'Authentication failed. Please try again.',
};

export function mapFirebaseError(code) {
  return FIREBASE_ERROR_MESSAGES[code] || FIREBASE_ERROR_MESSAGES.default;
}
