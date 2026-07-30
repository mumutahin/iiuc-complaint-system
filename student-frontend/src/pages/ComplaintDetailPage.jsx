import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import { complaintService } from '../services/complaintService.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';
import CommentSection from '../components/CommentSection.jsx';
import UpvoteButton from '../components/UpvoteButton.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Modal from '../components/Modal.jsx';
import { formatDate } from '../../../shared/formatters.js';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lastNotification } = useSocket();
  const { showToast } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  async function load() {
    try {
      const { data } = await complaintService.getById(id);
      setComplaint(data.data);
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

  // A real-time notification about THIS complaint (new comment, status
  // change) arrived while we're looking at it — quietly refetch instead
  // of making the student refresh the page.
  useEffect(() => {
    if (!lastNotification) return;
    const notifId = lastNotification.complaintId?._id || lastNotification.complaintId;
    if (String(notifId) === String(id)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastNotification]);

  async function handleUpvote() {
    setUpvoting(true);
    try {
      const { data } = await complaintService.toggleUpvote(id);
      setComplaint((c) => ({ ...c, upvoteCount: data.data.upvoteCount, hasUpvoted: data.data.hasUpvoted }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpvoting(false);
    }
  }

  async function handleAddComment(text) {
    setCommenting(true);
    try {
      const { data } = await complaintService.addComment(id, text);
      setComplaint(data.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCommenting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await complaintService.remove(id);
      showToast('Complaint deleted.', 'success');
      navigate('/complaints');
    } catch (err) {
      showToast(err.message, 'error');
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSpinner fullPage label="Loading complaint…" />;

  if (error || !complaint) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error || 'Complaint not found.'}</p>
        <Link to="/complaints" className="mt-3 inline-block text-sm font-medium text-brand-600 dark:text-brand-300">
          Back to my complaints
        </Link>
      </div>
    );
  }

  const canEdit = complaint.isOwner && complaint.status === 'Pending';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
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
                </div>
              </div>
              <UpvoteButton count={complaint.upvoteCount} hasUpvoted={complaint.hasUpvoted} onToggle={handleUpvote} disabled={upvoting} />
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink/75 dark:text-white/70">
              {complaint.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink/55 dark:text-white/40">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {complaint.location}
              </span>
              <span className="font-mono text-xs">Submitted {formatDate(complaint.createdAt)}</span>
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

            {canEdit && (
              <div className="mt-5 flex gap-2 border-t border-black/5 pt-4 dark:border-white/5">
                <Link
                  to={`/complaints/${id}/edit`}
                  className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                >
                  <Pencil size={14} /> Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-black/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="mb-4 font-display text-base font-semibold text-ink dark:text-white">Comments</h2>
            <CommentSection comments={complaint.comments} onAddComment={handleAddComment} submitting={commenting} />
          </div>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03] lg:col-span-1">
          <h2 className="mb-4 font-display text-base font-semibold text-ink dark:text-white">Status timeline</h2>
          <StatusTimeline activityLogs={complaint.activityLogs} />
          {complaint.department && (
            <div className="mt-4 border-t border-black/5 pt-4 text-sm dark:border-white/5">
              <p className="text-ink/50 dark:text-white/40">Being handled by</p>
              <p className="font-medium text-ink dark:text-white">{complaint.department.name}</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this complaint?" size="sm">
        <p className="text-sm text-ink/60 dark:text-white/50">
          This can't be undone. Any attached photos will also be removed.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteOpen(false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink/60 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete complaint'}
          </button>
        </div>
      </Modal>

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
