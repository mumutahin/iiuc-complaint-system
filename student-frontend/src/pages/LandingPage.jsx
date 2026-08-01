import { useNavigate } from 'react-router';
import { GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';
import StarMotif from '../components/StarMotif.jsx';

const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL;

export default function LandingPage() {
  const navigate = useNavigate();

  function goToStaffPortal() {
    if (ADMIN_APP_URL) {
      window.location.href = ADMIN_APP_URL;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 dark:bg-[#0d1614]">
      <div className="w-full max-w-md text-center">
        <StarMotif size={52} className="mx-auto text-brand-500 dark:text-brand-400" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink dark:text-white">IIUC Complaint Portal</h1>
        <p className="mt-2 text-sm text-ink/55 dark:text-white/45">
          International Islamic University Chittagong — campus facility complaints, tracked end to end.
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex w-full items-center gap-4 rounded-2xl border border-black/8 bg-white p-5 text-left shadow-sm transition hover:border-brand-400/60 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300">
              <GraduationCap size={22} />
            </span>
            <span className="flex-1">
              <span className="block font-display text-base font-semibold text-ink dark:text-white">I'm a Student</span>
              <span className="block text-sm text-ink/50 dark:text-white/40">Submit and track your complaints</span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-ink/30 dark:text-white/25" />
          </button>

          <button
            type="button"
            onClick={goToStaffPortal}
            disabled={!ADMIN_APP_URL}
            className="flex w-full items-center gap-4 rounded-2xl border border-black/8 bg-white p-5 text-left shadow-sm transition hover:border-accent-400/60 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-600 dark:text-accent-300">
              <ShieldCheck size={22} />
            </span>
            <span className="flex-1">
              <span className="block font-display text-base font-semibold text-ink dark:text-white">I'm Staff</span>
              <span className="block text-sm text-ink/50 dark:text-white/40">Manage and resolve complaints</span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-ink/30 dark:text-white/25" />
          </button>
        </div>
      </div>
    </div>
  );
}
