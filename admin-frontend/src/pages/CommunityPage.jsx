import { useEffect, useState } from 'react';
import { complaintService } from '../services/complaintService.js';
import ComplaintCard from '../components/ComplaintCard.jsx';
import SearchFilterBar from '../components/SearchFilterBar.jsx';
import Pagination from '../components/Pagination.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function CommunityPage() {
  const [filters, setFilters] = useState({ search: '', status: '', category: '', sort: 'upvotes', page: 1 });
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      complaintService
        .getCommunity(filters)
        .then(({ data }) => {
          if (!active) return;
          setComplaints(data.data);
          setPagination(data.pagination);
        })
        .finally(() => active && setLoading(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">Community Board</h1>
        <p className="mt-1 text-sm text-ink/55 dark:text-white/45">
          See what other students are reporting — upvote issues you've run into as well, so staff know how widespread they are.
        </p>
      </div>

      <div className="my-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchFilterBar filters={filters} onChange={setFilters} />
        </div>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <option value="upvotes">Most upvoted</option>
          <option value="recent">Most recent</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading the community board…" />
      ) : complaints.length === 0 ? (
        <EmptyState title="Nothing here yet" message="No complaints match these filters." />
      ) : (
        <>
          <div className="grid gap-3">
            {complaints.map((c) => (
              <ComplaintCard key={c._id} complaint={c} />
            ))}
          </div>
          <Pagination page={pagination?.page} pages={pagination?.pages} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </>
      )}
    </div>
  );
}
