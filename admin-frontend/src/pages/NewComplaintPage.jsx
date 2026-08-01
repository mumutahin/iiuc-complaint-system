import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { complaintService } from '../services/complaintService.js';
import { useToast } from '../context/ToastContext.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { COMPLAINT_CATEGORIES, LIMITS } from '../../../shared/constants.js';
import { validateComplaintInput } from '../../../shared/validators.js';

const EMPTY_FORM = { title: '', description: '', category: '', location: '', isAnonymous: false };

export default function NewComplaintPage() {
  const { id } = useParams(); // present only when editing
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    complaintService
      .getById(id)
      .then(({ data }) => {
        const c = data.data;
        if (c.status !== 'Pending') {
          setLoadError('This complaint is already being processed and can no longer be edited.');
          return;
        }
        setForm({
          title: c.title,
          description: c.description,
          category: c.category,
          location: c.location,
          isAnonymous: c.isAnonymous,
        });
        setImages((c.images || []).map((url) => ({ url })));
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { valid, errors: validationErrors } = validateComplaintInput(form);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('location', form.location.trim());
      fd.append('isAnonymous', String(form.isAnonymous));
      // Only newly-selected files (objects with `.file`) get uploaded;
      // pre-existing remote images (`.url` only) are left alone unless
      // the student added/removed something, matching the backend's
      // "only replace images if new files are sent" behavior.
      images.filter((f) => f.file).forEach((f) => fd.append('images', f.file));

      const response = isEditing ? await complaintService.update(id, fd) : await complaintService.create(fd);
      showToast(isEditing ? 'Complaint updated.' : 'Complaint submitted.', 'success');
      navigate(`/complaints/${response.data.data._id}`);
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(Object.fromEntries(err.fieldErrors.map((fe) => [fe.field, fe.message])));
      }
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner fullPage label="Loading complaint…" />;

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-white">
        {isEditing ? 'Edit complaint' : 'Submit a complaint'}
      </h1>
      <p className="mt-1 text-sm text-ink/55 dark:text-white/45">
        Be as specific as possible about the location — it's the fastest way to get it fixed.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-black/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
        <Field label="Title" error={errors.title}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            maxLength={LIMITS.TITLE_MAX}
            placeholder='e.g. "Projector not working in Room 503"'
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
          />
          <Counter value={form.title.length} max={LIMITS.TITLE_MAX} />
        </Field>

        <Field label="Description" error={errors.description}>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            maxLength={LIMITS.DESCRIPTION_MAX}
            rows={4}
            placeholder="What's wrong, and since when?"
            className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
          />
          <Counter value={form.description.length} max={LIMITS.DESCRIPTION_MAX} />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Category" error={errors.category}>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-ink dark:border-white/10 dark:bg-transparent dark:text-white"
            >
              <option value="">Choose a category…</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location" error={errors.location}>
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
              maxLength={LIMITS.LOCATION_MAX}
              placeholder="e.g. Academic Building, Room 503"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
            />
          </Field>
        </div>

        <Field label="Photo evidence (optional)">
          <ImageUploader files={images} onChange={(next, err) => { setImages(next); setImageError(err || ''); }} error={imageError} />
        </Field>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-black/[0.03] px-3 py-2.5 dark:bg-white/5">
          <input
            type="checkbox"
            checked={form.isAnonymous}
            onChange={(e) => updateField('isAnonymous', e.target.checked)}
            className="h-4 w-4 rounded border-black/20 text-brand-500 focus:ring-brand-400"
          />
          <span className="text-sm text-ink dark:text-white">
            Submit anonymously
            <span className="block text-xs text-ink/50 dark:text-white/40">
              Other students won't see your name on the community board. University staff handling your complaint always can, for accountability.
            </span>
          </span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Submit complaint'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink/60 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

function Counter({ value, max }) {
  return <p className="mt-1 text-right font-mono text-[11px] text-ink/35 dark:text-white/25">{value}/{max}</p>;
}
