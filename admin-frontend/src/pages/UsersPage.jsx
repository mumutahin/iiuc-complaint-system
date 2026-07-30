import { useEffect, useState } from 'react';
import { userService, departmentService } from '../services/adminService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Pagination from '../components/Pagination.jsx';
import { USER_ROLES } from '../../../shared/constants.js';

export default function UsersPage() {
  const { profile: currentProfile } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRoleChange, setPendingRoleChange] = useState(null); // { user, role, departmentId }

  function load() {
    setLoading(true);
    userService
      .getAll({ search, role: roleFilter, page })
      .then(({ data }) => {
        setUsers(data.data);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    departmentService.getAll().then(({ data }) => setDepartments(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, page]);

  function requestRoleChange(user, role) {
    if (role === 'admin' && !user.departmentId) {
      setPendingRoleChange({ user, role, departmentId: departments[0]?._id || '' });
    } else {
      applyRoleChange(user._id, role, null);
    }
  }

  async function applyRoleChange(userId, role, departmentId) {
    try {
      await userService.updateRole(userId, { role, departmentId: departmentId || undefined });
      showToast('Role updated.', 'success');
      setPendingRoleChange(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function toggleActive(user) {
    try {
      await userService.setActive(user._id, !user.isActive);
      showToast(user.isActive ? 'Account disabled.' : 'Account enabled.', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink dark:text-white">User Management</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          className="min-w-[220px] flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <option value="">All roles</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading users…" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-black/8 dark:border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50 dark:bg-white/5 dark:text-white/40">
                <tr>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u._id === currentProfile?._id;
                  return (
                    <tr key={u._id} className="border-t border-black/5 dark:border-white/5">
                      <td className="px-3 py-2.5 font-medium text-ink dark:text-white">{u.name}</td>
                      <td className="px-3 py-2.5 text-ink/60 dark:text-white/50">{u.email}</td>
                      <td className="px-3 py-2.5">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => requestRoleChange(u, e.target.value)}
                          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-ink disabled:opacity-40 dark:border-white/10 dark:bg-brand-900 dark:text-white"
                        >
                          {USER_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-ink/60 dark:text-white/50">{u.departmentId?.name || '—'}</td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => toggleActive(u)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination?.page} pages={pagination?.pages} onChange={setPage} />
        </>
      )}

      {pendingRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-brand-900">
            <h2 className="mb-3 font-display text-lg font-semibold text-ink dark:text-white">Assign a department</h2>
            <p className="mb-3 text-sm text-ink/55 dark:text-white/45">
              {pendingRoleChange.user.name} needs a department to become an admin.
            </p>
            <select
              value={pendingRoleChange.departmentId}
              onChange={(e) => setPendingRoleChange((p) => ({ ...p, departmentId: e.target.value }))}
              className="mb-4 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPendingRoleChange(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-ink/60 hover:bg-black/5 dark:text-white/50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyRoleChange(pendingRoleChange.user._id, 'admin', pendingRoleChange.departmentId)}
                disabled={!pendingRoleChange.departmentId}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
