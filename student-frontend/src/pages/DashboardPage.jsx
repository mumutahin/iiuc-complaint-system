import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PlusCircle, FileText, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { complaintService } from '../services/complaintService.js';
import ComplaintCard from '../components/ComplaintCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STAT_CARDS = [
  { key: 'total', label: 'Total complaints', icon: FileText, tone: 'text-brand-600 dark:text-brand-300 bg-brand-500/10' },
  { key: 'Pending', label: 'Pending', icon: Clock, tone: 'text-amber-700 dark:text-amber-400 bg-amber-500/10' },
  { key: 'In Progress', label: 'In progress', icon: Loader2, tone: 'text-violet-700 dark:text-violet-400 bg-violet-500/10' },
  { key: 'Resolved', label: 'Resolved', icon: CheckCircle2, tone: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [statsRes, listRes] = await Promise.all([
          complaintService.getStats(),
          complaintService.getMine({ limit: 5 }),
        ]);
        if (!active) return;
        setStats(statsRes.data.data);
        setRecent(listRes.data.data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner fullPage label="Loading your dashboard…" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-white">
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-ink/55 dark:text-white/45">Here's what's happening with your complaints.</p>
        </div>
        <Link
          to="/complaints/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <PlusCircle size={16} /> New complaint
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = card.key === 'total' ? stats?.total ?? 0 : stats?.byStatus?.[card.key] ?? 0;
          return (
            <div key={card.key} className="rounded-xl border border-black/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.tone}`}>
                <Icon size={16} />
              </span>
              <p className="mt-3 font-display text-2xl font-bold text-ink dark:text-white">{value}</p>
              <p className="text-xs text-ink/50 dark:text-white/40">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-white">Recent complaints</h2>
          <Link to="/complaints" className="text-sm font-medium text-brand-600 dark:text-brand-300">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="No complaints yet"
            message="Filed something broken on campus? Let us know and track it here."
            action={
              <Link to="/complaints/new" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                Submit your first complaint
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3">
            {recent.map((c) => (
              <ComplaintCard key={c._id} complaint={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
