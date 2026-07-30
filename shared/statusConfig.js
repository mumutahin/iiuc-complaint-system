/**
 * shared/statusConfig.js
 * -----------------------------------------------------------------------
 * Maps each ComplaintStatus / Priority to a Tailwind color scheme + label.
 * Both frontends import this so "Resolved" is green everywhere, never
 * green in one app and blue in the other.
 * -----------------------------------------------------------------------
 */

export const STATUS_STYLES = {
  Pending: {
    label: 'Pending',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
    dot: 'bg-amber-500',
    chart: '#f59e0b',
  },
  'Under Review': {
    label: 'Under Review',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400',
    dot: 'bg-sky-500',
    chart: '#0ea5e9',
  },
  'In Progress': {
    label: 'In Progress',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-400',
    dot: 'bg-violet-500',
    chart: '#8b5cf6',
  },
  Resolved: {
    label: 'Resolved',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    chart: '#10b981',
  },
  Rejected: {
    label: 'Rejected',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400',
    dot: 'bg-rose-500',
    chart: '#f43f5e',
  },
};

export const PRIORITY_STYLES = {
  Low: {
    label: 'Low',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300',
    chart: '#9ca3af',
  },
  Medium: {
    label: 'Medium',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400',
    chart: '#f97316',
  },
  High: {
    label: 'High',
    badge: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400',
    chart: '#ef4444',
  },
};

export function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.Pending;
}

export function getPriorityStyle(priority) {
  return PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium;
}
