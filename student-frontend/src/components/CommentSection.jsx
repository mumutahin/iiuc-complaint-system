import { useState } from 'react';
import { Send } from 'lucide-react';
import { formatRelativeTime } from '../../../shared/formatters.js';
import { validateCommentText } from '../../../shared/validators.js';
import { LIMITS } from '../../../shared/constants.js';

export default function CommentSection({ comments = [], onAddComment, submitting }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const { valid, error: validationError } = validateCommentText(text);
    if (!valid) {
      setError(validationError);
      return;
    }
    setError('');
    await onAddComment(text.trim());
    setText('');
  }

  return (
    <div>
      <div className="space-y-4">
        {comments.length === 0 && <p className="text-sm text-ink/50 dark:text-white/40">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c._id} className="flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-600 dark:bg-brand-400/15 dark:text-brand-300">
              {c.author?.name?.[0]?.toUpperCase() || '?'}
            </span>
            <div className="flex-1 rounded-lg bg-black/[0.03] px-3 py-2 dark:bg-white/5">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-medium text-ink dark:text-white">{c.author?.name || 'User'}</p>
                <p className="font-mono text-[11px] text-ink/40 dark:text-white/30">{formatRelativeTime(c.createdAt)}</p>
              </div>
              <p className="mt-0.5 text-sm text-ink/75 dark:text-white/70">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-start gap-2">
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={LIMITS.COMMENT_MAX}
            placeholder="Add a comment…"
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
      </form>
    </div>
  );
}
