import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PlusCircle } from 'lucide-react';
import { complaintService } from '../services/complaintService.js';
import ComplaintCard from '../components/ComplaintCard.jsx';
import SearchFilterBar from '../components/SearchFilterBar.jsx';
import Pagination from '../components/Pagination.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function MyComplaintsPage() {
  const [filters, setFilters] = useState({ search: '', status: '', category: '', page: 1 });
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      complaintService
        .getMine(filters)
        .then(({ data }) => {
          if (!active) return;
          setComplaints(data.data);
          setPagination(data.pagination);
        })
        .finally(() => active && setLoading(false));
    }, 300); // small debounce so search-as-you-type doesn't fire a request per keystroke

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">My Complaints</h1>
        <Link
          to="/complaints/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <PlusCircle size={16} /> New complaint
        </Link>
      </div>

      <div className="mb-5">
        <SearchFilterBar filters={filters} onChange={setFilters} />
      </div>

      {loading ? (
        <LoadingSpinner label="Loading complaints…" />
      ) : complaints.length === 0 ? (
        <EmptyState
          title="No complaints match"
          message={filters.search || filters.status || filters.category ? 'Try adjusting your filters.' : 'You haven\u2019t submitted any complaints yet.'}
          action={
            <Link to="/complaints/new" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
              Submit a complaint
            </Link>
          }
        />
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
