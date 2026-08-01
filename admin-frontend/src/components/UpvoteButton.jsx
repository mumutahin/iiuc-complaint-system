import { ArrowBigUp } from 'lucide-react';

export default function UpvoteButton({ count, hasUpvoted, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={hasUpvoted}
      className={`flex flex-col items-center gap-0.5 rounded-lg border px-3 py-1.5 transition ${
        hasUpvoted
          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
          : 'border-black/10 text-ink/60 hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:text-white/50'
      }`}
    >
      <ArrowBigUp size={18} fill={hasUpvoted ? 'currentColor' : 'none'} />
      <span className="text-xs font-semibold">{count}</span>
    </button>
  );
}
