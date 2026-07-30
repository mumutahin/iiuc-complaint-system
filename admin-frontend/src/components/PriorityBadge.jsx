import { getPriorityStyle } from '../../../shared/statusConfig.js';

export default function PriorityBadge({ priority, className = '' }) {
  const style = getPriorityStyle(priority);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style.badge} ${className}`}>
      {style.label}
    </span>
  );
}
