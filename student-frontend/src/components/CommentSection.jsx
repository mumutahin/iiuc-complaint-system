import { useState } from 'react';
import { Send, Reply, Pencil, Trash2, X, Check } from 'lucide-react';
import { formatRelativeTime } from '../../../shared/formatters.js';
import { validateCommentText } from '../../../shared/validators.js';
import { LIMITS } from '../../../shared/constants.js';

/**
 * Flat comments (each with a `parentId`) get grouped here into top-level
 * comments + their direct replies. We only ever support ONE level of
 * nesting (a reply can't itself be replied to — enforced by the
 * backend), which keeps both the data model and this UI simple.
 */
function groupComments(comments) {
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesByParent = new Map();
  comments
    .filter((c) => c.parentId)
    .forEach((c) => {
      const key = String(c.parentId);
      if (!repliesByParent.has(key)) repliesByParent.set(key, []);
      repliesByParent.get(key).push(c);
    });
  return topLevel.map((c) => ({ ...c, replies: repliesByParent.get(String(c._id)) || [] }));
}

export default function CommentSection({ comments = [], onAddComment, onEditComment, onDeleteComment, submitting }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { id, authorName } | null

  async function handleSubmit(e) {
    e.preventDefault();
    const { valid, error: validationError } = validateCommentText(text);
    if (!valid) {
      setError(validationError);
      return;
    }
    setError('');
    await onAddComment(text.trim(), replyingTo?.id);
    setText('');
    setReplyingTo(null);
  }

  const grouped = groupComments(comments);

  return (
    <div>
      <div className="space-y-4">
        {grouped.length === 0 && <p className="text-sm text-ink/50 dark:text-white/40">No comments yet.</p>}
        {grouped.map((c) => (
          <div key={c._id}>
            <CommentRow
              comment={c}
              onReply={() => setReplyingTo({ id: c._id, authorName: c.author?.name })}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
            />
            {c.replies.length > 0 && (
              <div className="ml-10 mt-2 space-y-2 border-l-2 border-black/5 pl-3 dark:border-white/10">
                {c.replies.map((r) => (
                  <CommentRow key={r._id} comment={r} onEdit={onEditComment} onDelete={onDeleteComment} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        {replyingTo && (
          <div className="mb-1.5 flex items-center justify-between rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs text-brand-700 dark:text-brand-300">
            <span>Replying to {replyingTo.authorName || 'this comment'}</span>
            <button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
              <X size={13} />
            </button>
          </div>
        )}
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={LIMITS.COMMENT_MAX}
              placeholder={replyingTo ? 'Write a reply…' : 'Add a comment…'}
              className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            {error && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40"
            aria-label="Post comment"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function CommentRow({ comment: c, onReply, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(c.text);
  const [editError, setEditError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const isStaffAuthor = c.author?.role === 'admin' || c.author?.role === 'superadmin';

  async function saveEdit() {
    const { valid, error } = validateCommentText(editText);
    if (!valid) {
      setEditError(error);
      return;
    }
    setBusy(true);
    try {
      await onEdit(c._id, editText.trim());
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await onDelete(c._id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-600 dark:bg-brand-400/15 dark:text-brand-300">
        {c.author?.name?.[0]?.toUpperCase() || '?'}
      </span>
      <div className="flex-1 rounded-lg bg-black/[0.03] px-3 py-2 dark:bg-white/5">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-sm font-medium text-ink dark:text-white">{c.author?.name || 'User'}</p>
          {isStaffAuthor && (
            <span className="rounded-full bg-accent-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-600 dark:text-accent-300">
              Staff
            </span>
          )}
          <p className="font-mono text-[11px] text-ink/40 dark:text-white/30">
            {formatRelativeTime(c.createdAt)}
            {c.editedAt && ' (edited)'}
          </p>
        </div>

        {editing ? (
          <div className="mt-1.5">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              maxLength={LIMITS.COMMENT_MAX}
              autoFocus
              className="w-full resize-none rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm text-ink focus:border-brand-400 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            {editError && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{editError}</p>}
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy}
                className="flex items-center gap-1 rounded-md bg-brand-500 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                <Check size={12} /> Save
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditText(c.text); setEditError(''); }}
                className="rounded-md px-2 py-1 text-xs font-medium text-ink/60 hover:bg-black/5 dark:text-white/50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink/75 dark:text-white/70">{c.text}</p>
        )}

        {!editing && !confirmingDelete && (
          <div className="mt-1.5 flex gap-3">
            {onReply && (
              <button type="button" onClick={onReply} className="flex items-center gap-1 text-xs font-medium text-ink/45 hover:text-brand-600 dark:text-white/35 dark:hover:text-brand-300">
                <Reply size={12} /> Reply
              </button>
            )}
            {c.canEdit && (
              <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-ink/45 hover:text-brand-600 dark:text-white/35 dark:hover:text-brand-300">
                <Pencil size={12} /> Edit
              </button>
            )}
            {c.canDelete && (
              <button type="button" onClick={() => setConfirmingDelete(true)} className="flex items-center gap-1 text-xs font-medium text-ink/45 hover:text-rose-600 dark:text-white/35 dark:hover:text-rose-400">
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        )}

        {confirmingDelete && (
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="text-ink/60 dark:text-white/45">Delete this comment?</span>
            <button type="button" onClick={confirmDelete} disabled={busy} className="font-semibold text-rose-600 hover:underline dark:text-rose-400">
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)} className="text-ink/50 hover:underline dark:text-white/35">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
