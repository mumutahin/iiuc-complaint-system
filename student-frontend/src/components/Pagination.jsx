import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-30 dark:border-white/10 dark:text-white"
      >
        <ChevronLeft size={16} /> Prev
      </button>
      <span className="font-mono text-sm text-ink/60 dark:text-white/50">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-30 dark:border-white/10 dark:text-white"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}
