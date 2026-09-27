import React, { useState, useRef } from 'react';
import { GlassCard, Reveal } from '@ddc/ui';
import { useAdminStores, useCreateStore, useSetStoreStatus, useUpdateStoreCommission, useUpdateStoreLogo, useUpdateStore, useAdminUser, useAdminSetUserPassword, useAdminUpdateUser, type StoreDoc } from '../../lib/api.hooks.js';
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
          onCreate={(body) => createStore.mutate(body, {
            onSuccess: () => setShowCreate(false),
          })}
          isPending={createStore.isPending}
          apiError={createStore.error instanceof Error ? createStore.error.message : null}
        />
      )}
    </div>
  );
}

// ── Store detail panel ─────────────────────────────────────────────────────────

type DetailTab = 'info' | 'owner' | 'settings';

function StoreDetailPanel({ store, onClose }: { store: StoreDoc; onClose: () => void }) {
  const [tab,             setTab]             = React.useState<DetailTab>('info');
  const [editCommission,  setEditCommission]  = React.useState(false);
  const [commissionInput, setCommissionInput] = React.useState(String(store.commissionPercent));
  const [logoError,       setLogoError]       = React.useState('');
  const [editStore,       setEditStore]       = React.useState(false);
  const [storeForm,       setStoreForm]       = React.useState({
    name: store.name, phone: store.phone, email: store.email ?? '',
    addressLine1: store.address.line1, city: store.address.city,
    state: store.address.state, pincode: store.address.pincode,
    gstin: store.gstin ?? '', taxPercent: String(store.taxPercent),
    defaultTatHours: String(store.sla.defaultTatHours),
    pincodes: store.serviceArea.pincodes.join(', '),
  });
  const [ownerPw,    setOwnerPw]    = React.useState('');
  const [ownerPwMsg, setOwnerPwMsg] = React.useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const setStatus        = useSetStoreStatus(store._id);
  const updateCommission = useUpdateStoreCommission(store._id);
  const uploadLogo       = useUpdateStoreLogo(store._id);
  const updateStore      = useUpdateStore(store._id);
  const { data: ownerData } = useAdminUser(store.ownerUserId);
  const setOwnerPassword = useAdminSetUserPassword(store.ownerUserId);
  const updateOwner      = useAdminUpdateUser(store.ownerUserId);
  const [ownerForm,     setOwnerForm]     = React.useState({ name: '', email: '', phone: '' });
  const [editOwner,     setEditOwner]     = React.useState(false);
  const [ownerFormMsg,  setOwnerFormMsg]  = React.useState('');

  React.useEffect(() => {
    if (ownerData?.user) {
      setOwnerForm({ name: ownerData.user.name, email: ownerData.user.email ?? '', phone: ownerData.user.phone ?? '' });
    }
  }, [ownerData]);

  const nextStatus = store.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');
    uploadLogo.mutate(file, { onError: (err) => setLogoError(err instanceof Error ? err.message : 'Upload failed') });
    e.target.value = '';
  };

  const handleSaveCommission = () => {
    const val = parseFloat(commissionInput);
    if (isNaN(val) || val < 0 || val > 100) return;
    updateCommission.mutate(val, { onSuccess: () => setEditCommission(false) });
  };

  const handleSaveStore = () => {
    updateStore.mutate({
      name:  storeForm.name  || undefined,
      phone: storeForm.phone || undefined,
      email: storeForm.email || undefined,
      address: {
        line1:   storeForm.addressLine1,
        city:    storeForm.city,
        state:   storeForm.state,
        pincode: storeForm.pincode,
        country: 'IN',
      },
      gstin:      storeForm.gstin || undefined,
      taxPercent: Number(storeForm.taxPercent) || store.taxPercent,
      sla: { defaultTatHours: Number(storeForm.defaultTatHours) || store.sla.defaultTatHours },
      serviceArea: {
        pincodes: storeForm.pincodes.split(',').map((p) => p.trim()).filter(Boolean),
      },
    }, { onSuccess: () => setEditStore(false) });
  };

  const handleSaveOwner = () => {
    setOwnerFormMsg('');
    updateOwner.mutate(
      { name: ownerForm.name || undefined, email: ownerForm.email || undefined, phone: ownerForm.phone || undefined },
      { onSuccess: () => { setEditOwner(false); setOwnerFormMsg('Owner info updated.'); } }
    );
  };

  const handleSetOwnerPw = () => {
    setOwnerPwMsg('');
    if (ownerPw.length < 8) { setOwnerPwMsg('Password must be at least 8 characters.'); return; }
    setOwnerPassword.mutate(ownerPw, {
      onSuccess: () => { setOwnerPw(''); setOwnerPwMsg('Password set successfully!'); },
      onError:   (e) => setOwnerPwMsg(e instanceof Error ? e.message : 'Failed.'),
    });
  };

  const TABS: { key: DetailTab; label: string }[] = [
    { key: 'info',     label: 'Store Info' },
    { key: 'owner',    label: 'Owner' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <Reveal>
      <GlassCard className="p-5 space-y-4 border border-[var(--gold)]/30">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-display text-xl text-[var(--text-primary)]">{store.name}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{store._id}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl px-1">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--glass-border)] pb-3">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-[var(--gold)]/15 text-[var(--gold)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >{t.label}</button>
          ))}
        </div>

        {/* ── STORE INFO TAB ── */}
        {tab === 'info' && (
          <div className="space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] flex items-center justify-center overflow-hidden shrink-0">
                {store.logoUrl ? <img src={store.logoUrl} alt="logo" className="w-full h-full object-contain p-1" /> : <span className="text-[var(--text-subtle)] text-xs text-center px-1">No logo</span>}
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoFile} />
                <button onClick={() => logoInputRef.current?.click()} disabled={uploadLogo.isPending}
                  className="px-3 py-1.5 rounded-lg border border-[var(--glass-border)] text-xs text-[var(--text-muted)] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-colors disabled:opacity-50"
                >{uploadLogo.isPending ? 'Uploading…' : store.logoUrl ? 'Replace logo' : 'Upload logo'}</button>
                {logoError && <p className="text-xs text-[var(--danger)]">{logoError}</p>}
                <p className="text-xs text-[var(--text-subtle)]">PNG, JPG, WebP, SVG · max 2 MB</p>
              </div>
            </div>

            {/* Editable store form */}
            {editStore ? (
              <div className="space-y-3">
                {(
                  [
                    ['Store Name', 'name'], ['Phone', 'phone'], ['Email', 'email'],
                    ['Address Line 1', 'addressLine1'], ['City', 'city'], ['State', 'state'], ['Pincode', 'pincode'],
                    ['GSTIN', 'gstin'],
                  ] as [string, string][]
                ).map(([label, key]) => (
                  <Input key={key} label={label} value={storeForm[key as keyof typeof storeForm]}
                    onChange={(e) => setStoreForm((f) => ({ ...f, [key]: e.target.value }))} />
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Tax %" type="number" value={storeForm.taxPercent} onChange={(e) => setStoreForm((f) => ({ ...f, taxPercent: e.target.value }))} />
                  <Input label="TAT (hours)" type="number" value={storeForm.defaultTatHours} onChange={(e) => setStoreForm((f) => ({ ...f, defaultTatHours: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Service Pincodes (comma-separated)</label>
                  <textarea
                    value={storeForm.pincodes}
                    onChange={(e) => setStoreForm((f) => ({ ...f, pincodes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:border-[var(--gold)]/50 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditStore(false)} className="flex-1 py-2 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">Cancel</button>
                  <button onClick={handleSaveStore} disabled={updateStore.isPending} className="flex-1 py-2 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50">
                    {updateStore.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Phone"       value={store.phone} />
                  <Info label="Email"       value={store.email ?? '—'} />
                  <Info label="Address"     value={`${store.address.line1}, ${store.address.city} ${store.address.pincode}`} />
                  <Info label="GSTIN"       value={store.gstin ?? '—'} />
                  <Info label="Tax"         value={`${store.taxPercent}%`} />
                  <Info label="Default TAT" value={`${store.sla.defaultTatHours}h`} />
                  <Info label="Pincodes"    value={store.serviceArea.pincodes.slice(0, 5).join(', ') + (store.serviceArea.pincodes.length > 5 ? '…' : '')} />
                </div>
                <button onClick={() => setEditStore(true)} className="w-full py-2 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-colors">
                  Edit Store Details
                </button>
              </>
            )}
          </div>
        )}

        {/* ── OWNER TAB ── */}
        {tab === 'owner' && (
          <div className="space-y-4">
            <div className="text-xs text-[var(--text-muted)] font-mono bg-white/5 rounded-lg px-3 py-2">
              User ID: {store.ownerUserId}
            </div>
            {editOwner ? (
              <div className="space-y-3">
                <Input label="Name"  value={ownerForm.name}  onChange={(e) => setOwnerForm((f) => ({ ...f, name: e.target.value }))} />
                <Input label="Email" type="email" value={ownerForm.email} onChange={(e) => setOwnerForm((f) => ({ ...f, email: e.target.value }))} />
                <Input label="Phone" value={ownerForm.phone} onChange={(e) => setOwnerForm((f) => ({ ...f, phone: e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={() => setEditOwner(false)} className="flex-1 py-2 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">Cancel</button>
                  <button onClick={handleSaveOwner} disabled={updateOwner.isPending} className="flex-1 py-2 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50">
                    {updateOwner.isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Name"  value={ownerData?.user.name ?? '—'} />
                  <Info label="Email" value={ownerData?.user.email ?? '—'} />
                  <Info label="Phone" value={ownerData?.user.phone ?? '—'} />
                  <Info label="Status" value={ownerData?.user.status ?? '—'} />
                </div>
                <button onClick={() => setEditOwner(true)} className="w-full py-2 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-colors">
                  Edit Owner Info
                </button>
              </>
            )}

            {ownerFormMsg && (
              <p className={`text-xs text-center ${ownerFormMsg.includes('success') || ownerFormMsg.includes('updated') ? 'text-[var(--gold)]' : 'text-[var(--danger)]'}`}>{ownerFormMsg}</p>
            )}

            {/* Set owner password */}
            <div className="border border-[var(--glass-border)] rounded-xl p-4 space-y-2">
              <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Set Owner Password</span>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={ownerPw}
                  onChange={(e) => { setOwnerPw(e.target.value); setOwnerPwMsg(''); }}
                  placeholder="New password (min 8 chars)"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:border-[var(--gold)]/50 focus:outline-none"
                />
                <button
                  onClick={handleSetOwnerPw}
                  disabled={setOwnerPassword.isPending || ownerPw.length < 8}
                  className="px-4 py-2 rounded-lg bg-[var(--gold)] text-[#0B0B0C] text-sm font-semibold disabled:opacity-50"
                >
                  {setOwnerPassword.isPending ? '…' : 'Set'}
                </button>
              </div>
              {ownerPwMsg && (
                <p className={`text-xs ${ownerPwMsg.includes('success') ? 'text-[var(--gold)]' : 'text-[var(--danger)]'}`}>{ownerPwMsg}</p>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="space-y-4">
            {/* Commission editor */}
            <div className="border border-[var(--glass-border)] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Platform Commission</span>
                {!editCommission && (
                  <button onClick={() => setEditCommission(true)} className="text-xs text-[var(--gold)] hover:underline">Edit</button>
                )}
              </div>
              {editCommission ? (
                <div className="flex gap-2 items-center">
                  <input type="number" min={0} max={100} step={0.5} value={commissionInput}
                    onChange={(e) => setCommissionInput(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--gold)]/60"
                  />
                  <span className="text-[var(--text-muted)] text-sm">%</span>
                  <button onClick={handleSaveCommission} disabled={updateCommission.isPending}
                    className="ml-2 px-3 py-1.5 rounded-lg bg-[var(--gold)] text-[#0B0B0C] text-sm font-semibold disabled:opacity-50"
                  >{updateCommission.isPending ? '…' : 'Save'}</button>
                  <button onClick={() => { setEditCommission(false); setCommissionInput(String(store.commissionPercent)); }}
                    className="px-2 py-1.5 rounded-lg text-[var(--text-muted)] text-sm"
                  >Cancel</button>
                </div>
              ) : (
                <p className="text-2xl font-display text-[var(--gold)]">{store.commissionPercent}<span className="text-base text-[var(--text-muted)]">%</span></p>
              )}
            </div>

            {/* Store status */}
            {store.status !== 'REJECTED' && (
              <button
                onClick={() => setStatus.mutate(nextStatus, { onSuccess: onClose })}
                disabled={setStatus.isPending}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 ${nextStatus === 'SUSPENDED' ? 'bg-[#EF444420] text-[#EF4444] border border-[#EF444430]' : 'bg-[var(--gold)] text-[#0B0B0C]'}`}
              >
                {setStatus.isPending ? 'Saving…' : nextStatus === 'SUSPENDED' ? 'Suspend Store' : 'Approve Store'}
              </button>
            )}
          </div>
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
  onClose, onCreate, isPending, apiError,
}: { onClose: () => void; onCreate: (body: unknown) => void; isPending: boolean; apiError: string | null }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', ownerName: '', ownerPhone: '', ownerEmail: '',
    addressLine1: '', city: '', state: '', pincode: '',
    commissionPercent: '15', taxPercent: '18', gstin: '',
    defaultTatHours: '48', pincodes: '',
  });
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.ownerPhone) { setError('Owner phone is required.'); return; }
    const pincodeList = form.pincodes.split(',').map((p) => p.trim()).filter(Boolean);
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
      ownerName:  form.ownerName || undefined,
      ownerPhone: form.ownerPhone,
      ownerEmail: form.ownerEmail || undefined,
      ...(pincodeList.length > 0 && { serviceArea: { pincodes: pincodeList } }),
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
          <p className="text-xs text-[var(--text-subtle)] -mt-1 mb-2">An owner login account will be created automatically. They can log in with Email OTP or set a password from their profile.</p>
          <Input label="Owner Name"    value={form.ownerName}  onChange={set('ownerName')} />
          <Input label="Owner Phone *" value={form.ownerPhone} onChange={set('ownerPhone')} required placeholder="+919876543210" />
          <Input label="Owner Email"   value={form.ownerEmail} onChange={set('ownerEmail')} type="email" />

          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-3 mb-2">Settings</p>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Commission %" value={form.commissionPercent} onChange={set('commissionPercent')} type="number" />
            <Input label="Tax %"        value={form.taxPercent}        onChange={set('taxPercent')} type="number" />
            <Input label="TAT (hours)"  value={form.defaultTatHours}   onChange={set('defaultTatHours')} type="number" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Service Pincodes (comma-separated)</label>
            <textarea
              value={form.pincodes}
              onChange={set('pincodes')}
              rows={2}
              placeholder="201301, 201305, 201308…"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:border-[var(--gold)]/50 focus:outline-none resize-none"
            />
            <p className="text-xs text-[var(--text-subtle)] mt-1">Orders are routed to this store when the customer&apos;s pincode matches. You can update this later.</p>
          </div>

          {(error || apiError) && <p className="text-xs text-[var(--danger)] text-center">{error || apiError}</p>}

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
