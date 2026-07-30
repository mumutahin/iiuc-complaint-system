import { Check } from 'lucide-react';
import { formatDate } from '../../../shared/formatters.js';

export default function StatusTimeline({ activityLogs = [] }) {
  if (activityLogs.length === 0) return null;

  return (
    <ol className="space-y-0">
      {activityLogs.map((log, i) => {
        const isLast = i === activityLogs.length - 1;
        return (
          <li key={`${log.timestamp}-${i}`} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && <span className="absolute left-[11px] top-6 h-full w-px bg-black/10 dark:bg-white/10" />}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
              <Check size={13} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink dark:text-white">{log.action}</p>
              {log.performedBy && (
                <p className="text-xs text-ink/50 dark:text-white/40">by {log.performedBy}</p>
              )}
              <p className="mt-0.5 font-mono text-xs text-ink/40 dark:text-white/30">{formatDate(log.timestamp)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
