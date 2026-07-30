import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { MapPin, UserCheck } from 'lucide-react';
import { complaintService } from '../services/adminService.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { PRIORITIES, LIMITS } from '../../../shared/constants.js';
import { formatDate } from '../../../shared/formatters.js';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { lastNotification } = useSocket();
  const { showToast } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusChoice, setStatusChoice] = useState('');
  const [remark, setRemark] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState('internal');
  const [postingNote, setPostingNote] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  async function load() {
    try {
      const { data } = await complaintService.getById(id);
      setComplaint(data.data);
      setStatusChoice(data.data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!lastNotification) return;
    const notifId = lastNotification.complaintId?._id || lastNotification.complaintId;
    if (String(notifId) === String(id)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastNotification]);

  async function handleStatusUpdate() {
    if (statusChoice === complaint.status) return;
    setUpdatingStatus(true);
    try {
      const { data } = await complaintService.updateStatus(id, statusChoice, remark);
      setComplaint(data.data);
      setRemark('');
      showToast(`Status updated to ${statusChoice}.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      setStatusChoice(complaint.status);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handlePriorityChange(priority) {
    setUpdatingPriority(true);
    try {
      const { data } = await complaintService.updatePriority(id, priority);
      setComplaint(data.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingPriority(false);
    }
  }

  async function handleClaim() {
    setClaiming(true);
    try {
      const { data } = await complaintService.assign(id, {});
      setComplaint(data.data);
      showToast('Complaint assigned to you.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaiming(false);
    }
  }

  async function handlePostNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setPostingNote(true);
    try {
      const { data } = await complaintService.addComment(id, note.trim(), noteType);
      setComplaint(data.data);
      setNote('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPostingNote(false);
    }
  }

  if (loading) return <LoadingSpinner fullPage label="Loading complaint…" />;

  if (error || !complaint) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error || 'Complaint not found.'}</p>
        <Link to="/complaints" className="mt-3 inline-block text-sm font-medium text-brand-600 dark:text-brand-300">
          Back to complaints
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-black/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-bold text-ink dark:text-white">{complaint.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.priority} />
                  <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-ink/60 dark:bg-white/10 dark:text-white/50">
                    {complaint.category}
                  </span>
                  {complaint.isAnonymous && (
                    <span className="rounded-full bg-accent-500/15 px-2.5 py-1 text-xs font-medium text-accent-600 dark:text-accent-300">
                      Anonymous (hidden from other students)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink/75 dark:text-white/70">
              {complaint.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink/55 dark:text-white/40">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {complaint.location}
              </span>
              <span className="font-mono text-xs">Submitted {formatDate(complaint.createdAt)}</span>
              <span>
                By {complaint.student?.name || 'Unknown'}
                {complaint.student?.email ? ` (${complaint.student.email})` : ''}
              </span>
            </div>

            {complaint.images?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {complaint.images.map((url) => (
                  <button key={url} type="button" onClick={() => setLightboxUrl(url)} className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                    <img src={url} alt="Complaint evidence" className="h-24 w-24 object-cover transition hover:scale-105" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-black/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="mb-4 font-display text-base font-semibold text-ink dark:text-white">Notes &amp; comments</h2>
            <div className="space-y-3">
              {complaint.comments.length === 0 && <p className="text-sm text-ink/50 dark:text-white/40">No comments yet.</p>}
              {complaint.comments.map((c) => (
                <div key={c._id} className={`rounded-lg px-3 py-2 ${c.type === 'internal' ? 'bg-accent-500/10' : 'bg-black/[0.03] dark:bg-white/5'}`}>
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-medium text-ink dark:text-white">{c.author?.name || 'User'}</p>
                    {c.type === 'internal' && (
                      <span className="rounded-full bg-accent-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-700 dark:text-accent-300">
                        Internal
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink/75 dark:text-white/70">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handlePostNote} className="mt-4 space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={LIMITS.COMMENT_MAX}
                placeholder="Add a note…"
                className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1 rounded-lg bg-black/[0.03] p-1 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setNoteType('internal')}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${noteType === 'internal' ? 'bg-white text-ink shadow-sm dark:bg-brand-700 dark:text-white' : 'text-ink/50 dark:text-white/40'}`}
                  >
                    Internal (staff only)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteType('public')}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${noteType === 'public' ? 'bg-white text-ink shadow-sm dark:bg-brand-700 dark:text-white' : 'text-ink/50 dark:text-white/40'}`}
                  >
                    Public (visible to student)
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={postingNote || !note.trim()}
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {postingNote ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-black/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="mb-3 font-display text-base font-semibold text-ink dark:text-white">Manage</h2>

            <label className="mb-1.5 block text-xs font-medium text-ink/60 dark:text-white/45">Status</label>
            <div className="flex gap-2">
              <StatusSelect currentStatus={complaint.status} value={statusChoice} onChange={setStatusChoice} disabled={updatingStatus} />
            </div>
            {statusChoice !== complaint.status && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={2}
                  placeholder="Optional remark (kept as an internal note)…"
                  className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/35 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus}
                  className="w-full rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating…' : `Confirm: move to ${statusChoice}`}
                </button>
              </div>
            )}

            <label className="mb-1.5 mt-4 block text-xs font-medium text-ink/60 dark:text-white/45">Priority</label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={updatingPriority}
                  onClick={() => handlePriorityChange(p)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                    complaint.priority === p
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                      : 'border-black/10 text-ink/50 hover:bg-black/5 dark:border-white/10 dark:text-white/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/5">
              <label className="mb-1.5 block text-xs font-medium text-ink/60 dark:text-white/45">Assigned to</label>
              {complaint.assignedTo ? (
                <p className="text-sm text-ink dark:text-white">{complaint.assignedTo.name}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={claiming}
                  className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                >
                  <UserCheck size={14} /> {claiming ? 'Claiming…' : 'Claim this complaint'}
                </button>
              )}
              {complaint.department && (
                <p className="mt-2 text-xs text-ink/50 dark:text-white/35">Department: {complaint.department.name}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="mb-4 font-display text-base font-semibold text-ink dark:text-white">Activity log</h2>
            <StatusTimeline activityLogs={complaint.activityLogs} />
          </div>
        </div>
      </div>

      {lightboxUrl && (
        <button
          type="button"
          onClick={() => setLightboxUrl(null)}
          aria-label="Close image"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        >
          <img src={lightboxUrl} alt="Complaint evidence, enlarged" className="max-h-full max-w-full rounded-lg object-contain" />
        </button>
      )}
    </div>
  );
}
