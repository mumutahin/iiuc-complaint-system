import StarMotif from './StarMotif.jsx';

export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/10 px-6 py-14 text-center dark:border-white/10">
      <StarMotif size={32} className="text-black/15 dark:text-white/15" />
      <div>
        <p className="font-display text-base font-semibold text-ink dark:text-white">{title}</p>
        {message && <p className="mt-1 max-w-sm text-sm text-ink/60 dark:text-white/50">{message}</p>}
      </div>
      {action}
    </div>
  );
}
