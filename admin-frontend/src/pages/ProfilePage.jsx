import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import Modal from '../components/Modal.jsx';
import { LIMITS } from '../../../shared/constants.js';

export default function ProfilePage() {
  const { profile, currentUser, refreshProfile, deleteAccount, isSuperadmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (name.trim().length < LIMITS.NAME_MIN) {
      showToast(`Name must be at least ${LIMITS.NAME_MIN} characters.`, 'error');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/profile', { name: name.trim(), phone: phone.trim() || null });
      await refreshProfile();
      showToast('Profile updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/login');
    } catch (err) {
      showToast(err.message, 'error');
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-white">Your profile</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-black/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">Email</label>
          <input
            type="email"
            value={currentUser?.email || ''}
            disabled
            className="w-full rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2.5 text-sm text-ink/50 dark:border-white/10 dark:bg-white/5 dark:text-white/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={LIMITS.NAME_MAX}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-ink focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">Phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-ink focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">Role</label>
          <p className="rounded-lg bg-black/[0.03] px-3 py-2.5 text-sm capitalize text-ink/70 dark:bg-white/5 dark:text-white/60">
            {profile?.role}{profile?.departmentId ? ` — ${profile.departmentId.name}` : ''}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/50 dark:bg-rose-950/10">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div>
            <h2 className="font-display text-base font-semibold text-rose-700 dark:text-rose-300">Danger zone</h2>
            <p className="mt-1 text-sm text-rose-700/80 dark:text-rose-300/70">
              Deleting your account removes your staff login permanently. Complaints and comments you've handled
              stay on record — they won't be deleted, and any complaints assigned to you get released back to
              "unassigned" for someone else to pick up.
              {isSuperadmin && ' As a superadmin, you cannot delete your own account if you are the only one left.'}
            </p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="mt-3 rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your account?" size="sm">
        <p className="text-sm text-ink/60 dark:text-white/50">
          This is permanent — you'll be signed out and won't be able to log back in with this account.
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
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Yes, delete my account'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
