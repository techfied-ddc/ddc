import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassCard, Reveal } from '@ddc/ui';
import { api } from '../../lib/api.js';
import { Role } from '@ddc/shared';

interface AdminUser {
  _id:       string;
  name?:     string;
  email?:    string;
  phone?:    string;
  role:      string;
  status:    string;
  storeId?:  string;
  createdAt: string;
}

interface ListResponse {
  items: AdminUser[];
  total: number;
  pages: number;
  page:  number;
}

const ROLES = ['', Role.CUSTOMER, Role.STORE_OWNER, Role.RIDER, Role.ADMIN, Role.SUPER_ADMIN];
const ROLE_LABELS: Record<string, string> = {
  [Role.CUSTOMER]:    'Customer',
  [Role.STORE_OWNER]: 'Store Owner',
  [Role.RIDER]:       'Rider',
  [Role.ADMIN]:       'Admin',
  [Role.SUPER_ADMIN]: 'Super Admin',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'text-emerald-400 bg-emerald-400/10',
  SUSPENDED: 'text-red-400 bg-red-400/10',
  PENDING:   'text-amber-400 bg-amber-400/10',
};

function useAdminUsers(params: { page: number; role: string; search: string }) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn:  () => {
      const q = new URLSearchParams({ page: String(params.page), limit: '25' });
      if (params.role)   q.set('role', params.role);
      if (params.search) q.set('search', params.search);
      return api.get(`/api/v1/users?${q.toString()}`).then((r) => (r as { data: ListResponse }).data);
    },
    placeholderData: (prev) => prev,
  });
}

function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/v1/users/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[var(--gold)]/10 text-[var(--gold)]">
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'text-[var(--text-muted)] bg-white/5';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
}

interface UserDetailPanelProps {
  user:     AdminUser;
  onClose:  () => void;
  onUpdate: (id: string, status: string) => void;
  updating: boolean;
}

function UserDetailPanel({ user, onClose, onUpdate, updating }: UserDetailPanelProps) {
  return (
    <div className="border border-[var(--glass-border)] rounded-2xl bg-[var(--glass-bg)] p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-[var(--text-primary)] text-base">{user.name ?? '—'}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{user.email ?? user.phone ?? 'No contact'}</p>
        </div>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none">×</button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">Role</p>
          <RoleBadge role={user.role} />
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">Status</p>
          <StatusBadge status={user.status} />
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">Phone</p>
          <p className="text-[var(--text-secondary)]">{user.phone ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">Joined</p>
          <p className="text-[var(--text-secondary)]">{new Date(user.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
        {user.storeId && (
          <div className="col-span-2">
            <p className="text-xs text-[var(--text-muted)] mb-1">Store ID</p>
            <p className="text-[var(--text-secondary)] font-mono text-xs">{user.storeId}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        {user.status !== 'ACTIVE' && (
          <button
            onClick={() => onUpdate(user._id, 'ACTIVE')}
            disabled={updating}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
          >
            Activate
          </button>
        )}
        {user.status !== 'SUSPENDED' && (
          <button
            onClick={() => onUpdate(user._id, 'SUSPENDED')}
            disabled={updating}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            Suspend
          </button>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [page, setPage]       = useState(1);
  const [role, setRole]       = useState('');
  const [search, setSearch]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = useAdminUsers({ page, role, search: debouncedSearch });
  const updateStatus = useUpdateUserStatus();

  const handleSearch = (v: string) => {
    setSearch(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 400);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await updateStatus.mutateAsync({ id, status });
    // Refresh selected user state
    setSelected((prev) => (prev?._id === id ? { ...prev, status } : prev));
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      <Reveal>
        <h1 className="font-display text-2xl text-[var(--text-primary)]">Users</h1>
      </Reveal>

      {/* Filters */}
      <Reveal delay={0.04}>
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="flex-1 bg-white/5 border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--gold)]/50"
            />
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              className="bg-white/5 border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] outline-none"
            >
              <option value="">All roles</option>
              {ROLES.filter(Boolean).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        </GlassCard>
      </Reveal>

      <div className={`grid gap-5 transition-all ${selected ? 'lg:grid-cols-[1fr_340px]' : ''}`}>
        {/* User list */}
        <Reveal delay={0.06}>
          <GlassCard className="overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
              </div>
            ) : !data?.items.length ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-12">No users found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--glass-border)]">
                        <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Name</th>
                        <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider hidden sm:table-cell">Contact</th>
                        <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Role</th>
                        <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider hidden md:table-cell">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {data.items.map((u) => (
                        <tr
                          key={u._id}
                          onClick={() => setSelected(selected?._id === u._id ? null : u)}
                          className={`cursor-pointer transition-colors hover:bg-white/3 ${selected?._id === u._id ? 'bg-[var(--gold)]/5' : ''}`}
                        >
                          <td className="px-5 py-3">
                            <p className="text-[var(--text-primary)] font-medium">{u.name ?? '—'}</p>
                            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5 hidden sm:block">{u._id.slice(-8)}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-[var(--text-muted)]">
                            {u.email ?? u.phone ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <StatusBadge status={u.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {data.pages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--glass-border)]">
                    <span className="text-xs text-[var(--text-muted)]">
                      Page {data.page} of {data.pages} · {data.total} users
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-[var(--text-secondary)] disabled:opacity-40 hover:bg-white/8 transition-colors"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                        disabled={page >= data.pages}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-[var(--text-secondary)] disabled:opacity-40 hover:bg-white/8 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </Reveal>

        {/* Detail panel */}
        {selected && (
          <Reveal delay={0.02}>
            <UserDetailPanel
              user={selected}
              onClose={() => setSelected(null)}
              onUpdate={handleStatusUpdate}
              updating={updateStatus.isPending}
            />
          </Reveal>
        )}
      </div>
    </div>
  );
}
