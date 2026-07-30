import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import StarMotif from './StarMotif.jsx';

export default function ProtectedRoute({ children, requireSuperadmin = false }) {
  const { isAuthenticated, isStaff, isSuperadmin, loading, logout, profile } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isStaff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center dark:bg-[#0b1211]">
        <StarMotif size={40} className="text-black/15 dark:text-white/15" />
        <div>
          <h1 className="font-display text-xl font-bold text-ink dark:text-white">Staff access only</h1>
          <p className="mt-2 max-w-sm text-sm text-ink/55 dark:text-white/45">
            Your account ({profile?.email}) doesn't have admin permissions on the complaint system. If you believe
            this is a mistake, ask a superadmin to update your role from the User Management panel.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Log out
        </button>
      </div>
    );
  }

  if (requireSuperadmin && !isSuperadmin) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <StarMotif size={32} className="text-black/15 dark:text-white/15" />
        <p className="font-display text-lg font-semibold text-ink dark:text-white">Superadmin only</p>
        <p className="max-w-sm text-sm text-ink/55 dark:text-white/45">This page is restricted to superadmins.</p>
      </div>
    );
  }

  return children;
}
