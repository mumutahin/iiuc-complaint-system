import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import StarMotif from '../components/StarMotif.jsx';
import { LIMITS } from '../../../shared/constants.js';

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (name.trim().length < LIMITS.NAME_MIN) {
      setError(`Name must be at least ${LIMITS.NAME_MIN} characters.`);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await register({ name: name.trim(), email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setBusy(true);
    try {
      const user = await loginWithGoogle();
      if (user) navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10 dark:bg-[#0d1614]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <StarMotif size={44} className="text-brand-500 dark:text-brand-400" />
          <div>
            <h1 className="font-display text-xl font-bold text-ink dark:text-white">Create your account</h1>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/45">IIUC Campus Complaint Portal</p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          {error && (
            <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/30" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                maxLength={LIMITS.NAME_MAX}
                className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@iiuc.edu.bd"
                className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/30" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
                className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/30" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            <span className="text-xs text-ink/40 dark:text-white/30">or</span>
            <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="w-full rounded-lg border border-black/10 py-2.5 text-sm font-medium text-ink hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
          >
            Continue with Google
          </button>

          <p className="mt-5 text-center text-sm text-ink/55 dark:text-white/45">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 dark:text-brand-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
