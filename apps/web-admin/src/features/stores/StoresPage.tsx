import React, { useState, useRef } from 'react';
import { GlassCard, Reveal } from '@ddc/ui';
import { useAdminStores, useCreateStore, useSetStoreStatus, useUpdateStoreCommission, useUpdateStoreLogo, type StoreDoc } from '../../lib/api.hooks.js';
import { formatDate, statusColor } from '../../lib/format.js';

type Tab = 'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED';

const TABS: Tab[] = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'];

export default function StoresPage() {
  const [tab,        setTab]        = useState<Tab>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState<StoreDoc | null>(null);

  const { data, isLoading } = useAdminStores({ status: tab === 'ALL' ? undefined : tab, page });
  const createStore   = useCreateStore();

  const stores = data?.stores ?? [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <Reveal>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Stores</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm"
          >
            + New Store
          </button>
        </div>
      </Reveal>

      {/* Tabs */}
      <Reveal delay={0.04}>
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                tab === t
                  ? 'bg-[var(--gold)] text-[#0B0B0C] border-[var(--gold)]'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--glass-border)] hover:border-[var(--gold)]/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Table */}
      <Reveal delay={0.08}>
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
            </div>
          ) : stores.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-12">No stores found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--glass-border)]">
                    {['Name', 'Location', 'Commission', 'Status', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store._id} className="border-b border-[var(--glass-border)]/50 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{store.name}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{store.address.city}, {store.address.state}</td>
                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">{store.commissionPercent}%</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: statusColor(store.status), border: `1px solid ${statusColor(store.status)}40`, background: `${statusColor(store.status)}18` }}>
                          {store.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(store.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(store)}
                          className="text-[var(--gold)] text-xs hover:underline mr-3"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-[var(--glass-border)]">
              <span className="text-xs text-[var(--text-muted)]">Page {page} of {data.pages} · {data.total} stores</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-muted)] disabled:opacity-40">←</button>
                <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-muted)] disabled:opacity-40">→</button>
              </div>
            </div>
          )}
        </GlassCard>
      </Reveal>

      {/* Store detail / manage panel */}
      {selected && (
        <StoreDetailPanel
          store={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Create store modal */}
      {showCreate && (
        <CreateStoreModal
          onClose={() => setShowCreate(false)}
          onCreate={(body) => createStore.mutate(body, { onSuccess: () => setShowCreate(false) })}
          isPending={createStore.isPending}
        />
      )}
    </div>
  );
}

// ── Store detail panel ─────────────────────────────────────────────────────────

function StoreDetailPanel({ store, onClose }: { store: StoreDoc; onClose: () => void }) {
  const [editCommission, setEditCommission] = React.useState(false);
  const [commissionInput, setCommissionInput] = React.useState(String(store.commissionPercent));
  const [logoError, setLogoError] = React.useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const setStatus        = useSetStoreStatus(store._id);
  const updateCommission = useUpdateStoreCommission(store._id);
  const uploadLogo       = useUpdateStoreLogo(store._id);
  const nextStatus = store.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');
    uploadLogo.mutate(file, {
      onError: (err) => setLogoError(err instanceof Error ? err.message : 'Upload failed'),
    });
    e.target.value = '';
  };

  const handleSaveCommission = () => {
    const val = parseFloat(commissionInput);
    if (isNaN(val) || val < 0 || val > 100) return;
    updateCommission.mutate(val, { onSuccess: () => setEditCommission(false) });
  };

  return (
    <Reveal>
      <GlassCard className="p-5 space-y-4 border border-[var(--gold)]/30">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-display text-xl text-[var(--text-primary)]">{store.name}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{store._id}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl px-1">×</button>
        </div>

        {/* Store logo */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] flex items-center justify-center overflow-hidden shrink-0">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={`${store.name} logo`} className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-[var(--text-subtle)] text-xs text-center px-1">No logo</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoFile}
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadLogo.isPending}
              className="px-3 py-1.5 rounded-lg border border-[var(--glass-border)] text-xs text-[var(--text-muted)] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-colors disabled:opacity-50"
            >
              {uploadLogo.isPending ? 'Uploading…' : store.logoUrl ? 'Replace logo' : 'Upload logo'}
            </button>
            {logoError && <p className="text-xs text-[var(--danger)]">{logoError}</p>}
            <p className="text-xs text-[var(--text-subtle)]">PNG, JPG, WebP, SVG · max 2 MB</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Phone"       value={store.phone} />
          <Info label="Email"       value={store.email ?? '—'} />
          <Info label="Address"     value={`${store.address.line1}, ${store.address.city} ${store.address.pincode}`} />
          <Info label="GSTIN"       value={store.gstin ?? '—'} />
          <Info label="Tax"         value={`${store.taxPercent}%`} />
          <Info label="Default TAT" value={`${store.sla.defaultTatHours}h`} />
          <Info label="Pincodes"    value={store.serviceArea.pincodes.slice(0, 5).join(', ') + (store.serviceArea.pincodes.length > 5 ? '…' : '')} />
        </div>

        {/* Commission editor */}
        <div className="border border-[var(--glass-border)] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Platform Commission</span>
            {!editCommission && (
              <button
                onClick={() => setEditCommission(true)}
                className="text-xs text-[var(--gold)] hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {editCommission ? (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--gold)]/60"
              />
              <span className="text-[var(--text-muted)] text-sm">%</span>
              <button
                onClick={handleSaveCommission}
                disabled={updateCommission.isPending}
                className="ml-2 px-3 py-1.5 rounded-lg bg-[var(--gold)] text-[#0B0B0C] text-sm font-semibold disabled:opacity-50"
              >
                {updateCommission.isPending ? '…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditCommission(false); setCommissionInput(String(store.commissionPercent)); }}
                className="px-2 py-1.5 rounded-lg text-[var(--text-muted)] text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-2xl font-display text-[var(--gold)]">{store.commissionPercent}<span className="text-base text-[var(--text-muted)]">%</span></p>
          )}
        </div>

        {store.status !== 'REJECTED' && (
          <button
            onClick={() => setStatus.mutate(nextStatus, { onSuccess: onClose })}
            disabled={setStatus.isPending}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 ${nextStatus === 'SUSPENDED' ? 'bg-[#EF444420] text-[#EF4444] border border-[#EF444430]' : 'bg-[var(--gold)] text-[#0B0B0C]'}`}
          >
            {setStatus.isPending ? 'Saving…' : nextStatus === 'SUSPENDED' ? 'Suspend Store' : 'Approve Store'}
          </button>
        )}
      </GlassCard>
    </Reveal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--text-muted)] text-xs mb-0.5">{label}</p>
      <p className="text-[var(--text-secondary)]">{value}</p>
    </div>
  );
}

// ── Create store modal ────────────────────────────────────────────────────────

function CreateStoreModal({
  onClose, onCreate, isPending,
}: { onClose: () => void; onCreate: (body: unknown) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', ownerName: '', ownerPhone: '',
    addressLine1: '', city: '', state: '', pincode: '',
    commissionPercent: '15', taxPercent: '18', gstin: '',
    defaultTatHours: '48',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name:  form.name,
      phone: form.phone,
      email: form.email || undefined,
      address: {
        line1:   form.addressLine1,
        city:    form.city,
        state:   form.state,
        pincode: form.pincode,
        country: 'IN',
      },
      commissionPercent: Number(form.commissionPercent),
      taxPercent:        Number(form.taxPercent),
      gstin:             form.gstin || undefined,
      sla: { defaultTatHours: Number(form.defaultTatHours) },
      ownerName:  form.ownerName,
      ownerPhone: form.ownerPhone,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <GlassCard className="p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl text-[var(--text-primary)]">New Store</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] text-xl px-1">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Store Info</p>
          <Input label="Store Name *"  value={form.name}         onChange={set('name')} required />
          <Input label="Phone *"       value={form.phone}        onChange={set('phone')} required />
          <Input label="Email"         value={form.email}        onChange={set('email')} type="email" />
          <Input label="GSTIN"         value={form.gstin}        onChange={set('gstin')} />

          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-3 mb-2">Address</p>
          <Input label="Address Line 1 *" value={form.addressLine1} onChange={set('addressLine1')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City *"    value={form.city}    onChange={set('city')} required />
            <Input label="State *"   value={form.state}   onChange={set('state')} required />
            <Input label="Pincode *" value={form.pincode} onChange={set('pincode')} required />
          </div>

          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-3 mb-2">Owner Account</p>
          <Input label="Owner Name *"  value={form.ownerName}  onChange={set('ownerName')} required />
          <Input label="Owner Phone *" value={form.ownerPhone} onChange={set('ownerPhone')} required />

          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-3 mb-2">Settings</p>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Commission %" value={form.commissionPercent} onChange={set('commissionPercent')} type="number" />
            <Input label="Tax %"        value={form.taxPercent}        onChange={set('taxPercent')} type="number" />
            <Input label="TAT (hours)"  value={form.defaultTatHours}   onChange={set('defaultTatHours')} type="number" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50">
              {isPending ? 'Creating…' : 'Create Store'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:border-[var(--gold)]/50 focus:outline-none"
      />
    </div>
  );
}
