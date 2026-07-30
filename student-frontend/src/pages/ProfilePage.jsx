import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import { LIMITS } from '../../../shared/constants.js';

export default function ProfilePage() {
  const { profile, currentUser, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

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
          <p className="mt-1 text-xs text-ink/40 dark:text-white/25">Managed by your sign-in provider.</p>
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
            placeholder="01XXXXXXXXX"
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-ink focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">Role</label>
          <p className="rounded-lg bg-black/[0.03] px-3 py-2.5 text-sm capitalize text-ink/70 dark:bg-white/5 dark:text-white/60">
            {profile?.role || 'student'}
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
    </div>
  );
}
