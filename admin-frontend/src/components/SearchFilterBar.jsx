import { Search } from 'lucide-react';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from '../../../shared/constants.js';

export default function SearchFilterBar({ filters, onChange, showStatus = true }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value, page: 1 });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/30" />
        <input
          type="search"
          value={filters.search || ''}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search complaints…"
          className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      </div>
      <select
        value={filters.category || ''}
        onChange={(e) => update('category', e.target.value)}
        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
      >
        <option value="">All categories</option>
        {COMPLAINT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {showStatus && (
        <select
          value={filters.status || ''}
          onChange={(e) => update('status', e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <option value="">All statuses</option>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
