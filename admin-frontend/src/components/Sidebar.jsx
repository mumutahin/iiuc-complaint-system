import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  Building2,
  Users,
  UserCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';
import StarMotif from './StarMotif.jsx';

const BASE_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/complaints', label: 'Complaints', icon: ListChecks },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];
const SUPERADMIN_LINKS = [
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/users', label: 'Users', icon: Users },
];

export default function Sidebar({ children }) {
  const { profile, isSuperadmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = isSuperadmin ? [...BASE_LINKS, ...SUPERADMIN_LINKS] : BASE_LINKS;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5">
        <StarMotif size={26} className="text-brand-500 dark:text-brand-400" />
        <div>
          <p className="font-display text-sm font-semibold leading-tight text-ink dark:text-white">IIUC Staff</p>
          <p className="text-[11px] text-ink/45 dark:text-white/35">Complaint Portal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-ink/65 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} /> {l.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="space-y-0.5 border-t border-black/5 px-2 py-3 dark:border-white/5">
        <Link
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink/65 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5"
        >
          <UserCircle size={16} /> {profile?.name?.split(' ')[0] || 'Profile'}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-black/5 bg-white dark:border-white/5 dark:bg-white/[0.02] md:flex">
        {navContent}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-black/5 bg-paper/90 px-4 backdrop-blur-md dark:border-white/5 dark:bg-[#0b1211]/90">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-ink/70 hover:bg-black/5 dark:text-white/70 md:hidden"
          >
            <Menu size={20} />
          </button>
          <span className="font-display text-sm font-semibold text-ink dark:text-white md:hidden">IIUC Staff</span>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <DarkModeToggle />
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/40" />
          <aside className="relative flex h-full w-64 flex-col bg-white dark:bg-brand-900">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-ink/60 dark:text-white/60"
            >
              <X size={18} />
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </div>
  );
}
