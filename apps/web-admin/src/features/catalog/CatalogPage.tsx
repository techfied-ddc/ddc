import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category { _id: string; name: string; description?: string; sortOrder: number; enabled: boolean; }
interface Service  { _id: string; categoryId: string; name: string; description?: string; unit: string; basePrice: number; sortOrder: number; enabled: boolean; }

const UNITS = ['PER_PIECE', 'PER_KG', 'PER_PAIR', 'PER_SET'];
const UNIT_LABELS: Record<string, string> = { PER_PIECE: 'Per Piece', PER_KG: 'Per Kg', PER_PAIR: 'Per Pair', PER_SET: 'Per Set' };

// ── Hooks ─────────────────────────────────────────────────────────────────────

const useCategories = () => useQuery<Category[]>({
  queryKey: ['admin-categories'],
  queryFn:  async () => (await api.get('/api/v1/catalog/categories') as { data: { categories: Category[] } }).data.categories,
});

const useServices = (categoryId?: string) => useQuery<Service[]>({
  queryKey: ['admin-services', categoryId],
  queryFn:  async () => {
    const qs = categoryId ? `?categoryId=${categoryId}` : '';
    return ((await api.get(`/api/v1/catalog/services${qs}`)) as { data: { items: Service[] } }).data.items;
  },
});

export default function CatalogPage() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading: catLoading } = useCategories();

  const [activeCat, setActiveCat]   = useState<string | null>(null);
  const [catForm, setCatForm]       = useState<Partial<Category> | null>(null);
  const [svcForm, setSvcForm]       = useState<Partial<Service> | null>(null);

  const { data: services = [] } = useServices(activeCat ?? undefined);

  const catMutation = useMutation({
    mutationFn: (data: Partial<Category> & { _id?: string }) =>
      data._id
        ? api.patch(`/api/v1/catalog/categories/${data._id}`, data)
        : api.post('/api/v1/catalog/categories', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setCatForm(null); },
  });

  const deleteCat = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/catalog/categories/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setActiveCat(null); },
  });

  const svcMutation = useMutation({
    mutationFn: (data: Partial<Service> & { _id?: string }) =>
      data._id
        ? api.patch(`/api/v1/catalog/services/${data._id}`, data)
        : api.post('/api/v1/catalog/services', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-services', activeCat] }); setSvcForm(null); },
  });

  const deleteSvc = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/catalog/services/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-services', activeCat] }),
  });

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>Catalog</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Category list ── */}
        <div style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={sectionTitle}>Categories</h2>
            <button style={addBtn} onClick={() => setCatForm({ name: '', sortOrder: 0, enabled: true })}>+ Add</button>
          </div>
          {catLoading ? <Spinner /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {categories.map((cat) => (
                <div key={cat._id} style={{ ...row, background: activeCat === cat._id ? 'rgba(212,175,55,0.12)' : 'transparent', borderColor: activeCat === cat._id ? 'var(--gold)' : 'transparent' }}>
                  <button style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', color: activeCat === cat._id ? 'var(--gold)' : 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: activeCat === cat._id ? 700 : 400, padding: 0 }}
                    onClick={() => setActiveCat(cat._id)}>
                    {cat.name}
                    {!cat.enabled && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>(off)</span>}
                  </button>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <IconBtn title="Edit" onClick={() => setCatForm(cat)}>✏️</IconBtn>
                    <IconBtn title="Delete" onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteCat.mutate(cat._id); }}>🗑️</IconBtn>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p style={empty}>No categories yet.</p>}
            </div>
          )}
        </div>

        {/* ── Services list ── */}
        <div style={panel}>
          {!activeCat ? (
            <p style={empty}>Select a category to manage its services.</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={sectionTitle}>Services · {categories.find((c) => c._id === activeCat)?.name}</h2>
                <button style={addBtn} onClick={() => setSvcForm({ categoryId: activeCat, name: '', unit: 'PER_PIECE', basePrice: 0, sortOrder: 0, enabled: true })}>+ Add</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {services.map((svc) => (
                  <div key={svc._id} style={{ ...row, justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {svc.name}
                        {!svc.enabled && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>(off)</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {UNIT_LABELS[svc.unit] ?? svc.unit} · ₹{(svc.basePrice / 100).toFixed(0)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <IconBtn title="Edit" onClick={() => setSvcForm(svc)}>✏️</IconBtn>
                      <IconBtn title="Delete" onClick={() => { if (confirm(`Delete "${svc.name}"?`)) deleteSvc.mutate(svc._id); }}>🗑️</IconBtn>
                    </div>
                  </div>
                ))}
                {services.length === 0 && <p style={empty}>No services yet.</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Category form modal ── */}
      {catForm !== null && (
        <Modal title={catForm._id ? 'Edit Category' : 'New Category'} onClose={() => setCatForm(null)}>
          <FormField label="Name">
            <Input value={catForm.name ?? ''} onChange={(v) => setCatForm((f) => ({ ...f!, name: v }))} />
          </FormField>
          <FormField label="Description">
            <Input value={catForm.description ?? ''} onChange={(v) => setCatForm((f) => ({ ...f!, description: v }))} />
          </FormField>
          <FormField label="Sort Order">
            <Input type="number" value={String(catForm.sortOrder ?? 0)} onChange={(v) => setCatForm((f) => ({ ...f!, sortOrder: Number(v) }))} />
          </FormField>
          <Toggle label="Enabled" checked={catForm.enabled ?? true} onChange={(v) => setCatForm((f) => ({ ...f!, enabled: v }))} />
          <SubmitRow loading={catMutation.isPending} onCancel={() => setCatForm(null)} onSave={() => catMutation.mutate(catForm as Partial<Category>)} />
        </Modal>
      )}

      {/* ── Service form modal ── */}
      {svcForm !== null && (
        <Modal title={svcForm._id ? 'Edit Service' : 'New Service'} onClose={() => setSvcForm(null)}>
          <FormField label="Name">
            <Input value={svcForm.name ?? ''} onChange={(v) => setSvcForm((f) => ({ ...f!, name: v }))} />
          </FormField>
          <FormField label="Description">
            <Input value={svcForm.description ?? ''} onChange={(v) => setSvcForm((f) => ({ ...f!, description: v }))} />
          </FormField>
          <FormField label="Unit">
            <select style={inputStyle} value={svcForm.unit ?? 'PER_PIECE'} onChange={(e) => setSvcForm((f) => ({ ...f!, unit: e.target.value }))}>
              {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
            </select>
          </FormField>
          <FormField label="Base Price (₹)">
            <Input type="number" value={String((svcForm.basePrice ?? 0) / 100)} onChange={(v) => setSvcForm((f) => ({ ...f!, basePrice: Math.round(Number(v) * 100) }))} />
          </FormField>
          <FormField label="Sort Order">
            <Input type="number" value={String(svcForm.sortOrder ?? 0)} onChange={(v) => setSvcForm((f) => ({ ...f!, sortOrder: Number(v) }))} />
          </FormField>
          <Toggle label="Enabled" checked={svcForm.enabled ?? true} onChange={(v) => setSvcForm((f) => ({ ...f!, enabled: v }))} />
          <SubmitRow loading={svcMutation.isPending} onCancel={() => setSvcForm(null)} onSave={() => svcMutation.mutate(svcForm as Partial<Service>)} />
        </Modal>
      )}
    </div>
  );
}

// ── Micro-components ──────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: '#1A1A1A', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text' }: { value: string; onChange: (v: string) => void; type?: string }) {
  return <input type={type} style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} />;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
    </label>
  );
}

function SubmitRow({ loading, onCancel, onSave }: { loading: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
      <button onClick={onCancel} style={{ flex: 1, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', borderRadius: 10, padding: '10px 0', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
      <button onClick={onSave} disabled={loading} style={{ flex: 1, background: 'var(--gold)', color: '#0B0B0C', border: 'none', borderRadius: 10, padding: '10px 0', cursor: 'pointer', fontWeight: 700 }}>
        {loading ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: 13, lineHeight: 1 }}>{children}</button>
  );
}

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
    <div style={{ width: 22, height: 22, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  </div>
);

// ── Style constants ───────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
  borderRadius: 18, padding: 20,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
  color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em',
};

const addBtn: React.CSSProperties = {
  background: 'var(--gold)', color: '#0B0B0C', border: 'none',
  borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
};

const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
  borderRadius: 10, border: '1px solid transparent',
};

const empty: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 20,
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
  color: 'var(--text-primary)', borderRadius: 10, padding: '10px 12px',
  fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box',
};
