import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Menu, X, LogOut, User as UserIcon, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';
import StarMotif from './StarMotif.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/complaints', label: 'My Complaints' },
  { to: '/community', label: 'Community' },
];

export default function Navbar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-paper/90 backdrop-blur-md dark:border-white/5 dark:bg-[#0d1614]/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <StarMotif size={26} className="text-brand-500 dark:text-brand-400" />
            <span className="font-display text-base font-semibold leading-tight text-ink dark:text-white">
              IIUC Complaints
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300'
                      : 'text-ink/60 hover:bg-black/5 hover:text-ink dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            to="/complaints/new"
            className="mr-1 hidden items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 sm:flex"
          >
            <PlusCircle size={16} /> New complaint
          </Link>
          <NotificationBell />
          <DarkModeToggle />
          <Link
            to="/profile"
            className="hidden items-center gap-2 rounded-full border border-black/10 py-1 pl-1 pr-3 text-sm font-medium text-ink hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5 sm:flex"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300">
              <UserIcon size={13} />
            </span>
            {profile?.name?.split(' ')[0] || 'Profile'}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="hidden rounded-full p-2 text-ink/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5 sm:block"
          >
            <LogOut size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="rounded-lg p-2 text-ink/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5 md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-black/5 px-4 py-3 dark:border-white/5 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/complaints/new"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-300"
            >
              New complaint
            </NavLink>
            <NavLink
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
            >
              Profile
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              Log out
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
