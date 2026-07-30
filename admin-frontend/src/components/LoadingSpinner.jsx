import StarMotif from './StarMotif.jsx';

export default function LoadingSpinner({ label = 'Loading…', fullPage = false }) {
  const content = (
    <div className="flex flex-col items-center gap-3 text-brand-500 dark:text-brand-400">
      <StarMotif size={36} spin />
      <p className="text-sm font-medium text-ink/60 dark:text-white/60">{label}</p>
    </div>
  );
  if (fullPage) return <div className="flex min-h-[60vh] w-full items-center justify-center">{content}</div>;
  return <div className="flex w-full items-center justify-center py-10">{content}</div>;
}
