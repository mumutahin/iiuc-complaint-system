import { useEffect, useState } from 'react';
import { analyticsService, departmentService } from '../services/adminService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusPieChart, CategoryBarChart, TrendAreaChart } from '../components/Charts.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { getPriorityStyle } from '../../../shared/statusConfig.js';

export default function AnalyticsPage() {
  const { isSuperadmin } = useAuth();
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperadmin) {
      departmentService.getAll().then(({ data }) => setDepartments(data.data)).catch(() => {});
    }
  }, [isSuperadmin]);

  useEffect(() => {
    setLoading(true);
    analyticsService
      .getOverview(isSuperadmin ? { departmentId } : {})
      .then(({ data }) => setOverview(data.data))
      .finally(() => setLoading(false));
  }, [departmentId, isSuperadmin]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">Analytics</h1>
        {isSuperadmin && departments.length > 0 && (
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <LoadingSpinner label="Crunching the numbers…" />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="mb-3 font-display text-base font-semibold text-ink dark:text-white">By status</h2>
              <StatusPieChart data={overview?.byStatus || []} />
            </div>
            <div className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="mb-3 font-display text-base font-semibold text-ink dark:text-white">By category</h2>
              <CategoryBarChart data={overview?.byCategory || []} />
            </div>
          </div>

          <div className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="mb-3 font-display text-base font-semibold text-ink dark:text-white">Complaints filed — last 14 days</h2>
            <TrendAreaChart data={overview?.trend || []} />
          </div>

          <div className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="mb-3 font-display text-base font-semibold text-ink dark:text-white">By priority</h2>
            <div className="grid grid-cols-3 gap-3">
              {(overview?.byPriority || []).map((p) => {
                const style = getPriorityStyle(p.priority);
                return (
                  <div key={p.priority} className={`rounded-xl p-4 text-center ${style.badge}`}>
                    <p className="font-display text-2xl font-bold">{p.count}</p>
                    <p className="text-xs font-medium">{p.priority}</p>
                  </div>
                );
              })}
            </div>
            {overview?.avgResolutionHours != null && (
              <p className="mt-4 text-sm text-ink/55 dark:text-white/45">
                Average time to resolution: <span className="font-semibold text-ink dark:text-white">{overview.avgResolutionHours} hours</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
