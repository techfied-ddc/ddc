import React, { useState } from 'react';
import { GlassCard, Reveal } from '@ddc/ui';
import { useStoreRiders, useAddRider, useToggleRiderStatus } from '../../lib/api.hooks.js';

export default function RidersPage() {
  const { data, isLoading } = useStoreRiders();
  const riders = data?.riders ?? [];

  const addRider = useAddRider();
  const toggleStatus = useToggleRiderStatus();

  const [showForm,      setShowForm]      = useState(false);
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [email,         setEmail]         = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [password,      setPassword]      = useState('');

  function resetForm() {
    setName(''); setPhone(''); setEmail(''); setVehicleNumber(''); setPassword('');
  }

  function submit() {
    if (!name || !phone) return;
    addRider.mutate(
      {
        name,
        phone,
        email:         email         || undefined,
        vehicleNumber: vehicleNumber || undefined,
        password:      password      || undefined,
      },
      {
        onSuccess: () => { setShowForm(false); resetForm(); },
      },
    );
  }

  return (
    <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
      <Reveal>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Riders</h1>
          <button
            onClick={() => { setShowForm(v => !v); resetForm(); }}
            className="text-sm text-[var(--gold)] border border-[var(--gold)] rounded-full px-4 py-1.5 font-medium"
          >
            {showForm ? 'Cancel' : '+ Add Rider'}
          </button>
        </div>
      </Reveal>

      {showForm && (
        <Reveal>
          <GlassCard className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">New Rider</h3>

            <Field label="Full name *">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" className={inputCls} />
            </Field>

            <Field label="Phone number *">
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="+91 9800000000" className={inputCls} />
            </Field>

            <Field label="Email" hint="Required for password login">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="rider@email.com" className={inputCls} />
            </Field>

            <Field label="Vehicle number">
              <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="UP14 AB 1234" className={inputCls} />
            </Field>

            <Field label="Initial password" hint="Leave empty — rider sets it from profile">
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Min 8 characters" className={inputCls} />
            </Field>

            <button
              onClick={submit}
              disabled={addRider.isPending || !name || !phone}
              className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
            >
              {addRider.isPending ? 'Adding…' : 'Add Rider'}
            </button>
            {addRider.isError && (
              <p className="text-xs text-[var(--danger)] text-center">{(addRider.error as Error).message}</p>
            )}
          </GlassCard>
        </Reveal>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
        </div>
      ) : riders.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">No riders yet. Add your first rider.</p>
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {riders.map(rider => (
            <li key={rider._id}>
              <GlassCard className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{rider.name}</p>
                    <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">{rider.phone}</p>
                    {rider.email && (
                      <p className="text-xs text-[var(--text-subtle)] mt-0.5 truncate">{rider.email}</p>
                    )}
                    {rider.vehicleNumber && (
                      <p className="font-mono text-xs text-[var(--gold)]/70 mt-0.5">{rider.vehicleNumber}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        rider.status === 'ACTIVE'
                          ? 'bg-[var(--success)]/15 text-[var(--success)]'
                          : 'bg-[var(--danger)]/15 text-[var(--danger)]'
                      }`}
                    >
                      {rider.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                    </span>
                    <button
                      onClick={() => toggleStatus.mutate(rider._id)}
                      disabled={toggleStatus.isPending}
                      className="text-xs border border-[var(--border)] rounded-full px-3 py-1 text-[var(--text-muted)]"
                    >
                      {rider.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const inputCls = 'w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]/60';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[var(--text-muted)] block mb-1">
        {label}
        {hint && <span className="ml-1 text-[var(--text-subtle)]">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}
