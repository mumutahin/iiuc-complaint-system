import { Link } from 'react-router';
import StarMotif from '../components/StarMotif.jsx';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <StarMotif size={40} className="text-black/15 dark:text-white/15" />
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">Page not found</h1>
        <p className="mt-1 text-sm text-ink/55 dark:text-white/45">This page doesn't exist or has moved.</p>
      </div>
      <Link to="/dashboard" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
        Back to dashboard
      </Link>
    </div>
  );
}
