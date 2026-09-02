import React, { useState } from 'react';
import { GlassCard, Reveal } from '@ddc/ui';
import {
  useAdminPayouts, useRunSettlement, useApprovePayout, useMarkPayoutPaid,
  useAdminStores, type PayoutDoc,
} from '../../lib/api.hooks.js';
import { formatRupees, formatDate, statusColor } from '../../lib/format.js';

const STATUS_TABS = ['ALL', 'DRAFT', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED'] as const;
type StatusTab = typeof STATUS_TABS[number];

export default function PayoutsPage() {
  const [tab,          setTab]          = useState<StatusTab>('ALL');
  const [page,         setPage]         = useState(1);
  const [showRun,      setShowRun]      = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutDoc | null>(null);

  const { data, isLoading } = useAdminPayouts({
    status: tab === 'ALL' ? undefined : tab,
    page,
  });
  const payouts = data?.payouts ?? [];

  const approvePayout  = useApprovePayout();
  const markPaid       = useMarkPayoutPaid();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Reveal>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Payouts</h1>
          <button
            onClick={() => setShowRun(true)}
            className="px-4 py-2 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm"
          >
            Run Settlement
          </button>
        </div>
      </Reveal>

      {/* Status tabs */}
      <Reveal delay={0.04}>
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
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

      {/* Payouts table */}
      <Reveal delay={0.08}>
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
            </div>
          ) : payouts.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-12">No payouts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--glass-border)]">
                    {['Store', 'Period', 'Invoiced', 'Commission', 'Net Payout', 'COD Recv.', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout._id} className="border-b border-[var(--glass-border)]/50 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-xs">{payout.storeId.slice(-8)}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{formatDate(payout.periodFrom)} – {formatDate(payout.periodTo)}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-[var(--text-secondary)]">{formatRupees(payout.totalInvoicedPaise)}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-[var(--gold)]">{formatRupees(payout.totalCommissionPaise)}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-[#22C55E]">{formatRupees(payout.netPayoutPaise)}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-[#F59E0B]">{formatRupees(payout.codReceivablePaise)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: statusColor(payout.status), border: `1px solid ${statusColor(payout.status)}40`, background: `${statusColor(payout.status)}18` }}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {payout.status === 'DRAFT' && (
                          <button
                            onClick={() => approvePayout.mutate(payout._id)}
                            disabled={approvePayout.isPending}
                            className="text-[var(--gold)] text-xs hover:underline disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {payout.status === 'APPROVED' && (
                          <button
                            onClick={() => setSelectedPayout(payout)}
                            className="text-[#22C55E] text-xs hover:underline"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && data.pages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-[var(--glass-border)]">
              <span className="text-xs text-[var(--text-muted)]">Page {page} of {data.pages} · {data.total} payouts</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-muted)] disabled:opacity-40">←</button>
                <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-muted)] disabled:opacity-40">→</button>
              </div>
            </div>
          )}
        </GlassCard>
      </Reveal>

      {/* Run settlement modal */}
      {showRun && <RunSettlementModal onClose={() => setShowRun(false)} />}

      {/* Mark paid modal */}
      {selectedPayout && (
        <MarkPaidModal
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
          onConfirm={(payoutRef, method) =>
            markPaid.mutate(
              { payoutId: selectedPayout._id, payoutRef, method },
              { onSuccess: () => setSelectedPayout(null) },
            )
          }
          isPending={markPaid.isPending}
        />
      )}
    </div>
  );
}

// ── Run settlement modal ──────────────────────────────────────────────────────

function RunSettlementModal({ onClose }: { onClose: () => void }) {
  const { data: storeData } = useAdminStores({ status: 'APPROVED' });
  const runSettlement = useRunSettlement();
  const stores = storeData?.stores ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [form, setForm] = useState({ storeId: '', periodFrom: weekAgo, periodTo: today });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <GlassCard className="p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl text-[var(--text-primary)]">Run Settlement</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] text-xl px-1">×</button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Collects all unsettled COMPLETED orders for the store in the given period, calculates commission and net payout, and creates a DRAFT payout statement.
        </p>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Store *</label>
          <select value={form.storeId} onChange={set('storeId')} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm">
            <option value="">— Select store —</option>
            {stores.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Period From</label>
            <input type="date" value={form.periodFrom} onChange={set('periodFrom')} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Period To</label>
            <input type="date" value={form.periodTo} onChange={set('periodTo')} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm" />
          </div>
        </div>

        {runSettlement.isError && (
          <p className="text-xs text-[#EF4444]">{(runSettlement.error as Error)?.message ?? 'Settlement failed.'}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">Cancel</button>
          <button
            disabled={!form.storeId || runSettlement.isPending}
            onClick={() => runSettlement.mutate(
              { storeId: form.storeId, periodFrom: form.periodFrom, periodTo: form.periodTo },
              { onSuccess: onClose },
            )}
            className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
          >
            {runSettlement.isPending ? 'Running…' : 'Run Settlement'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Mark paid modal ───────────────────────────────────────────────────────────

function MarkPaidModal({
  payout, onClose, onConfirm, isPending,
}: {
  payout: PayoutDoc;
  onClose: () => void;
  onConfirm: (payoutRef?: string, method?: string) => void;
  isPending: boolean;
}) {
  const [payoutRef, setPayoutRef] = useState('');
  const [method,    setMethod]    = useState('MANUAL_BANK');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <GlassCard className="p-6 w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl text-[var(--text-primary)]">Mark Payout Paid</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] text-xl px-1">×</button>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Net Payout</span><span className="font-mono text-[#22C55E]">{formatRupees(payout.netPayoutPaise)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Commission</span><span className="font-mono text-[var(--gold)]">{formatRupees(payout.totalCommissionPaise)}</span></div>
        </div>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm">
            <option value="MANUAL_BANK">Manual Bank Transfer</option>
            <option value="GATEWAY_ROUTE">Gateway Route</option>
            <option value="GATEWAY_PAYOUT">Gateway Payout</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Payout / Transfer Ref (optional)</label>
          <input
            value={payoutRef}
            onChange={(e) => setPayoutRef(e.target.value)}
            placeholder="UTR or gateway transfer ID"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">Cancel</button>
          <button
            disabled={isPending}
            onClick={() => onConfirm(payoutRef || undefined, method)}
            className="flex-1 py-2.5 rounded-xl bg-[#22C55E] text-white font-semibold text-sm disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Confirm Paid'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
