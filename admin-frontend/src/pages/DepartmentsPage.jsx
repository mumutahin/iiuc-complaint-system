import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { departmentService } from '../services/adminService.js';
import { useToast } from '../context/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { COMPLAINT_CATEGORIES, LIMITS } from '../../../shared/constants.js';
import { validateDepartmentInput } from '../../../shared/validators.js';

const EMPTY_FORM = { name: '', code: '', description: '', categories: [] };

export default function DepartmentsPage() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    departmentService
      .getAll()
      .then(({ data }) => setDepartments(data.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(dept) {
    setEditingId(dept._id);
    setForm({ name: dept.name, code: dept.code, description: dept.description || '', categories: dept.categories || [] });
    setErrors({});
    setModalOpen(true);
  }

  function toggleCategory(cat) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter((c) => c !== cat) : [...f.categories, cat],
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    const { valid, errors: validationErrors } = validateDepartmentInput(form);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await departmentService.update(editingId, form);
        showToast('Department updated.', 'success');
      } else {
        await departmentService.create(form);
        showToast('Department created.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      if (err.fieldErrors) setErrors(Object.fromEntries(err.fieldErrors.map((fe) => [fe.field, fe.message])));
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await departmentService.remove(deleteTarget._id);
      showToast('Department deleted.', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">Departments</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} /> New department
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading departments…" />
      ) : departments.length === 0 ? (
        <EmptyState title="No departments yet" message="Create one so new complaints can be automatically routed by category." />
      ) : (
        <div className="grid gap-3">
          {departments.map((d) => (
            <div key={d._id} className="rounded-xl border border-black/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold text-ink dark:text-white">
                    {d.name} <span className="font-mono text-xs font-normal text-ink/40 dark:text-white/30">{d.code}</span>
                  </p>
                  {d.description && <p className="mt-0.5 text-sm text-ink/55 dark:text-white/45">{d.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(d.categories || []).length === 0 ? (
                      <span className="text-xs text-ink/35 dark:text-white/25">No categories mapped — won't auto-receive complaints</span>
                    ) : (
                      d.categories.map((c) => (
                        <span key={c} className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-ink/60 dark:bg-white/10 dark:text-white/50">
                          {c}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => openEdit(d)} aria-label="Edit department" className="rounded-lg p-2 text-ink/50 hover:bg-black/5 dark:text-white/40 dark:hover:bg-white/5">
                    <Pencil size={15} />
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(d)} aria-label="Delete department" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit department' : 'New department'}>
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink dark:text-white">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink dark:text-white">Code</label>
            <input
              type="text"
              value={form.code}
              maxLength={LIMITS.DEPARTMENT_CODE_MAX}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. IT, HOSTEL, LIB"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 font-mono text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            {errors.code && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.code}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink dark:text-white">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              maxLength={LIMITS.DEPARTMENT_DESC_MAX}
              className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">Handles these categories</label>
            <div className="flex flex-wrap gap-1.5">
              {COMPLAINT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    form.categories.includes(c)
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                      : 'border-black/10 text-ink/50 hover:bg-black/5 dark:border-white/10 dark:text-white/40'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink/40 dark:text-white/30">
              New complaints in these categories are automatically routed here.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create department'}
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete department?" size="sm">
        <p className="text-sm text-ink/60 dark:text-white/50">
          Deleting <strong>{deleteTarget?.name}</strong> can't be undone. This is blocked if any staff or complaints
          are still linked to it.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-ink/60 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/5">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
