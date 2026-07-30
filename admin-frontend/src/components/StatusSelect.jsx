import { STATUS_TRANSITIONS } from '../../../shared/constants.js';

export default function StatusSelect({ currentStatus, value, onChange, disabled }) {
  const allowed = STATUS_TRANSITIONS[currentStatus] || [];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
    >
      <option value={currentStatus}>{currentStatus} (current)</option>
      {allowed.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
