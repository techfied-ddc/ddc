import React, { useState } from 'react';
import { GlassCard, Reveal } from '@ddc/ui';
import { useStoreRiders, useAddRider, useToggleRiderStatus } from '../../lib/api.hooks.js';

export default function RidersPage() {
  const { data, isLoading } = useStoreRiders();
  const riders = data?.riders ?? [];

  const addRider = useAddRider();
  const toggleStatus = useToggleRiderStatus();

  const [showForm, setShowForm] = useState(false);
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');

  function submit() {
    if (!name || !phone) return;
    addRider.mutate(
      { name, phone },
      {
        onSuccess: () => {
          setShowForm(false);
          setName('');
          setPhone('');
        },
      },
    );
  }

  return (
    <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
      <Reveal>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Riders</h1>
          <button
            onClick={() => setShowForm(v => !v)}
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
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1">Full name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1">Phone number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                type="tel"
                placeholder="+91 9800000000"
                inputMode="tel"
                className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)]"
              />
            </div>
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
              <GlassCard className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{rider.name}</p>
                  <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">{rider.phone}</p>
                </div>
                <div className="flex items-center gap-3">
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
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
