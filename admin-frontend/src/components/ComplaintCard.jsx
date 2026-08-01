import { Link } from 'react-router';
import { MapPin, MessageSquare, ArrowBigUp, ImageIcon } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { formatRelativeTime, truncateText } from '../../../shared/formatters.js';

export default function ComplaintCard({ complaint, showPriority = false }) {
  return (
    <Link
      to={`/complaints/${complaint._id}`}
      className="group block rounded-xl border border-black/8 bg-white p-4 transition hover:border-brand-400/50 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold text-ink group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
          {complaint.title}
        </h3>
        <StatusBadge status={complaint.status} className="shrink-0" />
      </div>

      <p className="mt-1.5 text-sm text-ink/60 dark:text-white/50">{truncateText(complaint.description, 120)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/50 dark:text-white/40">
        <span className="rounded-full bg-black/5 px-2 py-0.5 font-medium dark:bg-white/10">{complaint.category}</span>
        <span className="flex items-center gap-1">
          <MapPin size={12} /> {complaint.location}
        </span>
        {complaint.images?.length > 0 && (
          <span className="flex items-center gap-1">
            <ImageIcon size={12} /> {complaint.images.length}
          </span>
        )}
        <span className="flex items-center gap-1">
          <ArrowBigUp size={13} /> {complaint.upvoteCount || 0}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={12} /> {complaint.comments?.length || 0}
        </span>
        <span className="ml-auto font-mono">{formatRelativeTime(complaint.createdAt)}</span>
      </div>

      {showPriority && (
        <div className="mt-2">
          <PriorityBadge priority={complaint.priority} />
        </div>
      )}
    </Link>
  );
}
