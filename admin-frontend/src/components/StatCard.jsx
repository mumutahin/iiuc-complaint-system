export default function StatCard({ icon: Icon, label, value, tone = 'text-brand-600 dark:text-brand-300 bg-brand-500/10' }) {
  return (
    <div className="rounded-xl border border-black/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={16} />
      </span>
      <p className="mt-3 font-display text-2xl font-bold text-ink dark:text-white">{value}</p>
      <p className="text-xs text-ink/50 dark:text-white/40">{label}</p>
    </div>
  );
}
