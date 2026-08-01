import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import StarMotif from '../components/StarMotif.jsx';
const STUDENT_APP_URL = import.meta.env.VITE_STUDENT_APP_URL;

export default function LoginPage() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
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
      if (user) navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function openForgotPassword() {
    setResetEmail(email);
    setResetSent(false);
    setResetError('');
    setForgotMode(true);
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setResetError('');
    setResetBusy(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 dark:bg-[#0b1211]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <StarMotif size={44} className="text-brand-500 dark:text-brand-400" />
          <div>
            <h1 className="font-display text-xl font-bold text-ink dark:text-white">IIUC Staff Portal</h1>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/45">Complaint management — admin sign-in</p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          {forgotMode ? (
            <>
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink dark:text-white/50 dark:hover:text-white"
              >
                <ArrowLeft size={15} /> Back to sign in
              </button>
              <h2 className="mb-1 font-display text-lg font-semibold text-ink dark:text-white">Reset your password</h2>
              <p className="mb-5 text-sm text-ink/55 dark:text-white/45">
                Enter your staff account email and we'll send you a link to reset your password.
              </p>

              {resetSent ? (
                <p className="rounded-lg bg-brand-500/10 px-3 py-3 text-sm text-brand-700 dark:text-brand-300">
                  If a staff account exists for that email, a reset link is on its way — check your inbox (and
                  spam folder).
                </p>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-3.5">
                  {resetError && (
                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      {resetError}
                    </p>
                  )}
                  <div>
                    <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-ink dark:text-white">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/30" />
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="staff@iiuc.edu.bd"
                        className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={resetBusy}
                    className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {resetBusy ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              {error && (
                <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-ink dark:text-white">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/30" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@iiuc.edu.bd"
                      className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-sm font-medium text-ink dark:text-white">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/30" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-9 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 dark:border-white/10 dark:bg-transparent dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/30"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {busy ? 'Signing in…' : 'Sign in'}
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
              <p className="mt-2 text-center text-xs text-ink/40 dark:text-white/30">
                Google sign-in only works for accounts a superadmin has already created.
              </p>

              <p className="mt-5 text-center text-xs text-ink/45 dark:text-white/35">
                Staff accounts are created by a superadmin. If you don't have access yet, contact your department's
                superadmin.
              </p>
              {STUDENT_APP_URL && (
                <p className="mt-3 text-center text-sm">
                  <a href={STUDENT_APP_URL} className="font-medium text-ink/50 hover:text-brand-600 dark:text-white/40 dark:hover:text-brand-300">
                    Not staff? Go to the Student Portal →
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
