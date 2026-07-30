import { getStatusStyle } from '../../../shared/statusConfig.js';

export default function StatusBadge({ status, className = '' }) {
  const style = getStatusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.badge} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
