import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FileText, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { analyticsService, complaintService } from '../services/adminService.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/StatCard.jsx';
import { StatusPieChart, TrendAreaChart } from '../components/Charts.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatRelativeTime } from '../../../shared/formatters.js';

export default function DashboardPage() {
  const { profile, isSuperadmin } = useAuth();
  const [overview, setOverview] = useState(null);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [overviewRes, listRes] = await Promise.all([
          analyticsService.getOverview(),
          complaintService.getAll({ status: 'Pending', limit: 5, sort: 'oldest' }),
        ]);
        if (!active) return;
        setOverview(overviewRes.data.data);
        setNeedsAttention(listRes.data.data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner fullPage label="Loading dashboard…" />;

  const byStatus = Object.fromEntries((overview?.byStatus || []).map((s) => [s.status, s.count]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">
          {isSuperadmin ? 'University-wide overview' : `${profile?.name?.split(' ')[0] || 'Department'}'s queue`}
        </h1>
        <p className="mt-1 text-sm text-ink/55 dark:text-white/45">
          {isSuperadmin ? 'All departments, all complaints.' : 'Complaints routed to your department.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={FileText} label="Total complaints" value={overview?.total ?? 0} />
        <StatCard icon={Clock} label="Pending" value={byStatus.Pending ?? 0} tone="text-amber-700 dark:text-amber-400 bg-amber-500/10" />
        <StatCard icon={CheckCircle2} label="Resolved" value={byStatus.Resolved ?? 0} tone="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" />
        <StatCard
          icon={TrendingUp}
          label="Avg. resolution (hrs)"
          value={overview?.avgResolutionHours ?? '—'}
          tone="text-brand-600 dark:text-brand-300 bg-brand-500/10"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="mb-3 font-display text-base font-semibold text-ink dark:text-white">By status</h2>
          <StatusPieChart data={overview?.byStatus || []} />
        </div>
        <div className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="mb-3 font-display text-base font-semibold text-ink dark:text-white">Last 14 days</h2>
          <TrendAreaChart data={overview?.trend || []} />
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-white">Needs attention</h2>
          <Link to="/complaints?status=Pending" className="text-sm font-medium text-brand-600 dark:text-brand-300">
            View all pending
          </Link>
        </div>
        {needsAttention.length === 0 ? (
          <EmptyState title="Nothing pending" message="Every complaint has moved past the initial queue." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-black/8 dark:border-white/10">
            {needsAttention.map((c) => (
              <Link
                key={c._id}
                to={`/complaints/${c._id}`}
                className="flex items-center justify-between gap-3 border-b border-black/5 bg-white px-4 py-3 last:border-0 hover:bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink dark:text-white">{c.title}</p>
                  <p className="text-xs text-ink/50 dark:text-white/40">
                    {c.category} · {c.location} · {formatRelativeTime(c.createdAt)}
                  </p>
                </div>
                <StatusBadge status={c.status} className="shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
