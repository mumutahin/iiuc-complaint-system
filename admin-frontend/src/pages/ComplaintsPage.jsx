import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Download, MapPin } from 'lucide-react';
import { complaintService, reportService } from '../services/adminService.js';
import { useToast } from '../context/ToastContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, STATUS_TRANSITIONS } from '../../../shared/constants.js';
import { formatRelativeTime } from '../../../shared/formatters.js';

// Bulk actions only offer a status that's a valid next step for EVERY
// currently-selected complaint — never an option that would be silently
// rejected by the backend for some of the rows.
function commonNextStatuses(selectedComplaints) {
  if (selectedComplaints.length === 0) return [];
  const sets = selectedComplaints.map((c) => new Set(STATUS_TRANSITIONS[c.status] || []));
  return COMPLAINT_STATUSES.filter((s) => sets.every((set) => set.has(s)));
}

export default function ComplaintsPage() {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({ search: '', status: '', category: '', priority: '', sort: 'newest', page: 1 });
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [exporting, setExporting] = useState(false);

  function load() {
    setLoading(true);
    complaintService
      .getAll(filters)
      .then(({ data }) => {
        setComplaints(data.data);
        setPagination(data.pagination);
        setSelected(new Set());
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === complaints.length ? new Set() : new Set(complaints.map((c) => c._id))));
  }

  const selectedComplaints = complaints.filter((c) => selected.has(c._id));
  const bulkOptions = commonNextStatuses(selectedComplaints);

  async function applyBulkStatus() {
    if (!bulkStatus) return;
    setApplyingBulk(true);
    try {
      await Promise.all([...selected].map((id) => complaintService.updateStatus(id, bulkStatus)));
      showToast(`Updated ${selected.size} complaint(s) to ${bulkStatus}.`, 'success');
      setBulkStatus('');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setApplyingBulk(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { status, category, dateFrom, dateTo } = filters;
      const response = await reportService.downloadPdf({ status, category, dateFrom, dateTo });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `iiuc-complaint-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">Complaints</h1>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3.5 py-2 text-sm font-medium text-ink hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
        >
          <Download size={15} /> {exporting ? 'Preparing…' : 'Export PDF'}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          placeholder="Search title/description…"
          className="min-w-[200px] flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <option value="">All statuses</option>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <option value="">All categories</option>
          {COMPLAINT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="priority">By priority</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-brand-500/10 px-4 py-2.5 dark:bg-brand-400/10">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm text-ink dark:border-white/10 dark:bg-brand-900 dark:text-white"
          >
            <option value="">Set status to…</option>
            {bulkOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulkStatus}
            disabled={!bulkStatus || applyingBulk}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {applyingBulk ? 'Applying…' : 'Apply'}
          </button>
          {bulkOptions.length === 0 && (
            <span className="text-xs text-ink/50 dark:text-white/40">
              Selected complaints don't share a common next status — update them individually instead.
            </span>
          )}
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading complaints…" />
      ) : complaints.length === 0 ? (
        <EmptyState title="No complaints match" message="Try adjusting your filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-black/8 dark:border-white/10">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50 dark:bg-white/5 dark:text-white/40">
                <tr>
                  <th className="w-10 px-3 py-2.5">
                    <input type="checkbox" checked={selected.size === complaints.length} onChange={toggleSelectAll} className="h-4 w-4 rounded" />
                  </th>
                  <th className="px-3 py-2.5">Title</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} className="border-t border-black/5 hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/5">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(c._id)}
                        onChange={() => toggleSelect(c._id)}
                        className="h-4 w-4 rounded"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link to={`/complaints/${c._id}`} className="font-medium text-ink hover:text-brand-600 dark:text-white dark:hover:text-brand-300">
                        {c.title}
                      </Link>
                      <p className="flex items-center gap-1 text-xs text-ink/45 dark:text-white/30">
                        <MapPin size={11} /> {c.location}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-ink/70 dark:text-white/60">{c.category}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-ink/50 dark:text-white/40">
                      {formatRelativeTime(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination?.page} pages={pagination?.pages} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </>
      )}
    </div>
  );
}
