import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassCard, Reveal } from '@ddc/ui';
import { api } from '../../lib/api.js';
import { Role } from '@ddc/shared';
import { useBulkImportUsers, useSendMessageToUsers } from '../../lib/api.hooks.js';

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

// ── CSV Parser ────────────────────────────────────────────────────────────────

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    return row;
  });
}

// ── Import Modal ──────────────────────────────────────────────────────────────

function ImportModal({ onClose }: { onClose: () => void }) {
  const [rows,    setRows]    = useState<Array<{ name?: string; email?: string; phone?: string; role?: string }>>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [error,   setError]   = useState('');
  const [result,  setResult]  = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importMut = useBulkImportUsers();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setError('Please upload a .csv file. (Export your Excel as CSV first.)'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      if (!parsed.length) { setError('No rows found in CSV. Check your file format.'); return; }
      const mapped = parsed.map(r => ({
        name:  r['name']  || r['full name'] || undefined,
        email: r['email'] || undefined,
        phone: r['phone'] || r['mobile'] || r['mobile number'] || undefined,
        role:  r['role']  || undefined,
      })).filter(r => r.email || r.phone);
      setRows(mapped);
      setPreview([
        ['Name', 'Email', 'Phone', 'Role'],
        ...mapped.slice(0, 5).map(r => [r.name ?? '—', r.email ?? '—', r.phone ?? '—', r.role ?? 'CUSTOMER']),
      ]);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!rows.length) return;
    importMut.mutate(rows, {
      onSuccess: (data) => {
        const res = (data as { data: { created: number; skipped: number; errors: string[] } }).data;
        setResult(res);
      },
      onError: (err) => {
        setError((err as Error).message ?? 'Import failed.');
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[var(--bg-base)] border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-[var(--text-primary)]">Import Users from CSV</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] text-xl">×</button>
        </div>

        {!result ? (
          <>
            <div className="bg-[var(--gold)]/5 border border-[var(--gold)]/20 rounded-xl p-4 text-xs text-[var(--text-muted)] space-y-1">
              <p className="font-semibold text-[var(--gold)]">CSV Format</p>
              <p>Required columns (header row): <span className="font-mono">name, email, phone, role</span></p>
              <p>At least one of <span className="font-mono">email</span> or <span className="font-mono">phone</span> is required per row.</p>
              <p>Role defaults to <span className="font-mono">CUSTOMER</span> if not set.</p>
              <p>To export from Excel: File → Save As → CSV (Comma delimited)</p>
            </div>

            <div
              className="border-2 border-dashed border-[var(--glass-border)] rounded-xl p-6 text-center cursor-pointer hover:border-[var(--gold)]/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
              <p className="text-[var(--text-muted)] text-sm">Click to upload CSV file</p>
              {rows.length > 0 && (
                <p className="text-[var(--gold)] text-sm font-semibold mt-2">✓ {rows.length} users ready to import</p>
              )}
            </div>

            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

            {preview.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>{preview[0]!.map(h => <th key={h} className="text-left px-2 py-1 text-[var(--text-muted)] border-b border-[var(--glass-border)]">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => <td key={j} className="px-2 py-1 text-[var(--text-secondary)] border-b border-[var(--glass-border)]/30">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 5 && <p className="text-[10px] text-[var(--text-subtle)] mt-1">…and {rows.length - 5} more rows</p>}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">
                Cancel
              </button>
              <button
                disabled={!rows.length || importMut.isPending}
                onClick={handleImport}
                className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
              >
                {importMut.isPending ? 'Importing…' : `Import ${rows.length} Users`}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-1">
              <p className="text-emerald-400 font-semibold">Import Complete</p>
              <p className="text-sm text-[var(--text-secondary)]">Created: <strong className="text-emerald-400">{result.created}</strong></p>
              <p className="text-sm text-[var(--text-secondary)]">Skipped (already exist): <strong className="text-[var(--text-muted)]">{result.skipped}</strong></p>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-1">
                <p className="text-xs text-red-400 font-semibold">Errors ({result.errors.length})</p>
                {result.errors.map((e, i) => <p key={i} className="text-xs text-[var(--text-muted)]">{e}</p>)}
              </div>
            )}
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Message Modal ─────────────────────────────────────────────────────────────

interface MessageResult {
  sent?: number;
  failed?: number;
  total?: number;
  links?: { name: string; url: string }[];
}

function MessageModal({
  selectedIds,
  allUsers,
  onClose,
}: {
  selectedIds: string[];
  allUsers: AdminUser[];
  onClose: () => void;
}) {
  const [channel,  setChannel]  = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [result,   setResult]   = useState<MessageResult | null>(null);
  const [error,    setError]    = useState('');
  const sendMut = useSendMessageToUsers();

  const selectedUsers = allUsers.filter(u => selectedIds.includes(u._id));
  const emailCount = selectedUsers.filter(u => u.email).length;
  const phoneCount = selectedUsers.filter(u => u.phone).length;

  function handleSend() {
    if (!message.trim()) { setError('Message is required.'); return; }
    if (channel === 'EMAIL' && emailCount === 0) { setError('None of the selected users have an email address.'); return; }
    if (channel === 'WHATSAPP' && phoneCount === 0) { setError('None of the selected users have a phone number.'); return; }
    setError('');
    sendMut.mutate(
      { userIds: selectedIds, channel, subject: channel === 'EMAIL' ? subject : undefined, message },
      {
        onSuccess: (data) => {
          setResult((data as { data: MessageResult }).data);
        },
        onError: (err) => setError((err as Error).message ?? 'Send failed.'),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[var(--bg-base)] border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-[var(--text-primary)]">Send Message</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] text-xl">×</button>
        </div>

        {!result ? (
          <>
            <p className="text-sm text-[var(--text-muted)]">
              Sending to <strong className="text-[var(--text-primary)]">{selectedIds.length}</strong> selected user{selectedIds.length !== 1 ? 's' : ''}.
            </p>

            <div className="flex gap-3">
              {(['EMAIL', 'WHATSAPP'] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    channel === ch
                      ? 'bg-[var(--gold)] text-[#0B0B0C] border-[var(--gold)]'
                      : 'bg-transparent text-[var(--text-muted)] border-[var(--glass-border)]'
                  }`}
                >
                  {ch === 'EMAIL' ? '✉ Email' : '💬 WhatsApp'}
                </button>
              ))}
            </div>

            {channel === 'EMAIL' && (
              <p className="text-xs text-[var(--text-muted)]">
                {emailCount} of {selectedIds.length} selected users have email addresses.
              </p>
            )}
            {channel === 'WHATSAPP' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-[var(--text-muted)]">
                <p className="font-semibold text-amber-400 mb-1">WhatsApp Links</p>
                <p>Since WhatsApp Business API requires pre-approved templates, this will generate wa.me links for each user.</p>
                <p className="mt-1">{phoneCount} of {selectedIds.length} selected users have phone numbers.</p>
              </div>
            )}

            {channel === 'EMAIL' && (
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject…"
                className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] outline-none focus:border-[var(--gold)] transition-colors"
              />
            )}

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={channel === 'EMAIL' ? 'Email body…' : 'WhatsApp message…'}
              rows={5}
              className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] outline-none focus:border-[var(--gold)] transition-colors resize-none"
            />

            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">
                Cancel
              </button>
              <button
                disabled={!message.trim() || sendMut.isPending}
                onClick={handleSend}
                className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
              >
                {sendMut.isPending ? 'Sending…' : channel === 'EMAIL' ? 'Send Email' : 'Generate Links'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {result.links ? (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  Generated <strong className="text-[var(--gold)]">{result.total}</strong> WhatsApp link{result.total !== 1 ? 's' : ''}.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.links.slice(0, 30).map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)] hover:border-[var(--gold)]/50 transition-colors"
                    >
                      <span className="text-sm text-[var(--text-primary)]">{link.name}</span>
                      <span className="text-xs text-[var(--gold)]">Open →</span>
                    </a>
                  ))}
                  {(result.total ?? 0) > 30 && (
                    <p className="text-xs text-[var(--text-subtle)] text-center">Showing 30 of {result.total}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-1">
                <p className="text-emerald-400 font-semibold">Emails Sent</p>
                <p className="text-sm text-[var(--text-secondary)]">Sent: <strong className="text-emerald-400">{result.sent}</strong></p>
                {(result.failed ?? 0) > 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">Failed: <strong className="text-red-400">{result.failed}</strong></p>
                )}
              </div>
            )}
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── User Detail Panel ─────────────────────────────────────────────────────────

interface UserDetailPanelProps {
  user:      AdminUser;
  onClose:   () => void;
  onUpdate:  (id: string, status: string) => void;
  updating:  boolean;
  onMessage: (user: AdminUser) => void;
}

function UserDetailPanel({ user, onClose, onUpdate, updating, onMessage }: UserDetailPanelProps) {
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

      <div className="flex gap-2">
        {user.email && (
          <button
            onClick={() => onMessage(user)}
            className="flex-1 py-2 rounded-xl border border-[var(--gold)]/40 text-[var(--gold)] text-xs font-semibold hover:bg-[var(--gold)]/10 transition-colors"
          >
            ✉ Email
          </button>
        )}
        {user.phone && (
          <a
            href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello from Desire Premium Dry Cleaning!')}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-xs font-semibold text-center hover:border-[var(--gold)]/40 hover:text-[var(--gold)] transition-colors"
          >
            💬 WhatsApp
          </a>
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

// ── Main UsersPage ────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [page,   setPage]   = useState(1);
  const [role,   setRole]   = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected,    setSelected]    = useState<AdminUser | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showImport,  setShowImport]  = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [msgTarget,   setMsgTarget]   = useState<AdminUser | null>(null);

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
    setSelected((prev) => (prev?._id === id ? { ...prev, status } : prev));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data?.items.length) return;
    const allIds = data.items.map(u => u._id);
    const allSelected = allIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) allIds.forEach(id => next.delete(id));
      else             allIds.forEach(id => next.add(id));
      return next;
    });
  };

  const openMessageForUser = (user: AdminUser) => {
    setMsgTarget(user);
    setShowMessage(true);
  };

  const openBulkMessage = () => {
    setMsgTarget(null);
    setShowMessage(true);
  };

  const messageTargetIds = msgTarget ? [msgTarget._id] : Array.from(selectedIds);
  const messageAllUsers  = msgTarget ? [msgTarget] : (data?.items.filter(u => selectedIds.has(u._id)) ?? []);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      <Reveal>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Users</h1>
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm"
          >
            ↑ Import CSV
          </button>
        </div>
      </Reveal>

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

      {selectedIds.size > 0 && (
        <Reveal>
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-xl">
            <span className="text-sm font-semibold text-[var(--gold)]">{selectedIds.size} user{selectedIds.size !== 1 ? 's' : ''} selected</span>
            <div className="flex gap-2">
              <button
                onClick={openBulkMessage}
                className="px-3 py-1.5 rounded-lg bg-[var(--gold)] text-[#0B0B0C] text-xs font-semibold"
              >
                Send Message
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] text-xs"
              >
                Clear
              </button>
            </div>
          </div>
        </Reveal>
      )}

      <div className={`grid gap-5 transition-all ${selected ? 'lg:grid-cols-[1fr_340px]' : ''}`}>
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
                        <th className="px-4 py-3 w-8">
                          <input
                            type="checkbox"
                            checked={data.items.length > 0 && data.items.every(u => selectedIds.has(u._id))}
                            onChange={toggleSelectAll}
                            className="accent-[var(--gold)]"
                          />
                        </th>
                        <th className="text-left px-3 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Name</th>
                        <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider hidden sm:table-cell">Contact</th>
                        <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Role</th>
                        <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider hidden md:table-cell">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {data.items.map((u) => (
                        <tr
                          key={u._id}
                          className={`transition-colors hover:bg-white/3 ${selected?._id === u._id ? 'bg-[var(--gold)]/5' : ''} ${selectedIds.has(u._id) ? 'bg-[var(--gold)]/5' : ''}`}
                        >
                          <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(u._id); }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(u._id)}
                              onChange={() => toggleSelect(u._id)}
                              className="accent-[var(--gold)]"
                            />
                          </td>
                          <td className="px-3 py-3 cursor-pointer" onClick={() => setSelected(selected?._id === u._id ? null : u)}>
                            <p className="text-[var(--text-primary)] font-medium">{u.name ?? '—'}</p>
                            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5 hidden sm:block">{u._id.slice(-8)}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-[var(--text-muted)] cursor-pointer" onClick={() => setSelected(selected?._id === u._id ? null : u)}>
                            {u.email ?? u.phone ?? '—'}
                          </td>
                          <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(selected?._id === u._id ? null : u)}>
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell cursor-pointer" onClick={() => setSelected(selected?._id === u._id ? null : u)}>
                            <StatusBadge status={u.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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

        {selected && (
          <Reveal delay={0.02}>
            <UserDetailPanel
              user={selected}
              onClose={() => setSelected(null)}
              onUpdate={handleStatusUpdate}
              updating={updateStatus.isPending}
              onMessage={openMessageForUser}
            />
          </Reveal>
        )}
      </div>

      {showImport  && <ImportModal  onClose={() => setShowImport(false)} />}
      {showMessage && (
        <MessageModal
          selectedIds={messageTargetIds}
          allUsers={messageAllUsers}
          onClose={() => { setShowMessage(false); setMsgTarget(null); }}
        />
      )}
    </div>
  );
}
