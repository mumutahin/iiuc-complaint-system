import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router';
import { useSocket } from '../context/SocketContext.jsx';
import { notificationService } from '../services/complaintService.js';
import { formatRelativeTime } from '../../../shared/formatters.js';

export default function NotificationBell() {
  const { unreadCount, clearUnread, setUnreadCount, lastNotification } = useSocket();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    notificationService
      .getUnreadCount()
      .then(({ data }) => setUnreadCount(data.data.count))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lastNotification) return;
    setNotifications((prev) => [lastNotification, ...prev].slice(0, 15));
  }, [lastNotification]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const { data } = await notificationService.getAll({ limit: 15 });
        setNotifications(data.data);
        await notificationService.markAllRead();
        clearUnread();
      } catch {
        /* non-fatal — bell just stays empty this time */
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-ink/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-brand-900">
          <div className="border-b border-black/5 px-4 py-3 dark:border-white/5">
            <p className="font-display text-sm font-semibold text-ink dark:text-white">Notifications</p>
          </div>
          <div className="thin-scroll max-h-80 overflow-y-auto">
            {loading && <p className="px-4 py-6 text-center text-sm text-ink/50 dark:text-white/40">Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink/50 dark:text-white/40">You're all caught up.</p>
            )}
            {!loading &&
              notifications.map((n) => (
                <Link
                  key={n._id}
                  to={`/complaints/${n.complaintId?._id || n.complaintId}`}
                  onClick={() => setOpen(false)}
                  className="block border-b border-black/5 px-4 py-3 text-sm last:border-0 hover:bg-black/[0.03] dark:border-white/5 dark:hover:bg-white/5"
                >
                  <p className="font-medium text-ink dark:text-white">{n.title}</p>
                  <p className="mt-0.5 text-ink/60 dark:text-white/50">{n.message}</p>
                  <p className="mt-1 font-mono text-[11px] text-ink/40 dark:text-white/30">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
