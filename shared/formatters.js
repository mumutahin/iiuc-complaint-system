/**
 * shared/formatters.js
 * -----------------------------------------------------------------------
 * Small, dependency-free date/text formatters. Written by hand instead of
 * pulling in date-fns so the two frontends have one less dependency to
 * install and one less thing that can fail to resolve.
 * -----------------------------------------------------------------------
 */

export function formatDate(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateShort(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** "2 hours ago", "3 days ago", "just now" — no dependency needed. */
export function formatRelativeTime(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 0) return formatDateShort(input); // future date, just show it
  if (seconds < 45) return 'just now';

  const units = [
    { limit: 60, divisor: 1, name: 'second' },
    { limit: 3600, divisor: 60, name: 'minute' },
    { limit: 86400, divisor: 3600, name: 'hour' },
    { limit: 2620800, divisor: 86400, name: 'day' }, // ~30 days
    { limit: 31449600, divisor: 2620800, name: 'month' }, // ~12 months
    { limit: Infinity, divisor: 31449600, name: 'year' },
  ];

  for (const unit of units) {
    if (seconds < unit.limit) {
      const value = Math.floor(seconds / unit.divisor);
      return `${value} ${unit.name}${value !== 1 ? 's' : ''} ago`;
    }
  }
  return formatDateShort(input);
}

export function truncateText(text, maxLength = 60) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/** Hours between two dates, rounded to 1 decimal — used for "avg resolution time". */
export function hoursBetween(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
}
