import React, { useState } from 'react';
import { GlassCard, Reveal } from '@ddc/ui';
import {
  useAdminOrders, useAdminAssignOrder, useAdminStores, useAdminRefund,
  type AdminOrderDoc,
} from '../../lib/api.hooks.js';
import { formatRupees, formatDate, statusColor } from '../../lib/format.js';

const STATUS_TABS = ['ALL', 'ROUTING_FAILED', 'PLACED', 'ACCEPTED', 'IN_PROCESS', 'DELIVERED', 'CANCELLED'] as const;
type StatusTab = typeof STATUS_TABS[number];
type PanelMode = 'assign' | 'refund';

export default function OrdersPage() {
  const [tab,      setTab]      = useState<StatusTab>('ALL');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<AdminOrderDoc | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>('assign');

  const { data, isLoading } = useAdminOrders({
    status: tab === 'ALL' ? undefined : tab,
    page,
  });
  const orders = data?.orders ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Reveal>
        <h1 className="font-display text-2xl text-[var(--text-primary)]">Orders</h1>
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
              {t === 'ROUTING_FAILED' ? '⚠ Route Failed' : t}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-12">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--glass-border)]">
                    {['Ref', 'Status', 'Payment', 'Amount', 'Store', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b border-[var(--glass-border)]/50 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-[var(--gold)] text-xs">{order.orderRef}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: statusColor(order.status), border: `1px solid ${statusColor(order.status)}40`, background: `${statusColor(order.status)}18` }}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{order.paymentMode}</td>
                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)] tabular-nums">{formatRupees(order.estimatePaise - order.discountPaise)}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{order.storeId ? order.storeId.slice(-6) : <span className="text-[#EF4444] text-xs">Unassigned</span>}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {order.status === 'ROUTING_FAILED' && (
                            <button
                              onClick={() => { setSelected(order); setPanelMode('assign'); }}
                              className="text-[var(--gold)] text-xs hover:underline"
                            >
                              Assign
                            </button>
                          )}
                          {order.paymentMode === 'ONLINE' && order.paymentStatus === 'PAID' && (
                            <button
                              onClick={() => { setSelected(order); setPanelMode('refund'); }}
                              className="text-red-400 text-xs hover:underline"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && data.pages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-[var(--glass-border)]">
              <span className="text-xs text-[var(--text-muted)]">Page {page} of {data.pages} · {data.total} orders</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-muted)] disabled:opacity-40">←</button>
                <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-muted)] disabled:opacity-40">→</button>
              </div>
            </div>
          )}
        </GlassCard>
      </Reveal>

      {selected && panelMode === 'assign' && (
        <ManualAssignPanel
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {selected && panelMode === 'refund' && (
        <RefundPanel
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Refund panel for ONLINE-PAID orders ──────────────────────────────────────

function RefundPanel({ order, onClose }: { order: AdminOrderDoc; onClose: () => void }) {
  const refundMutation = useAdminRefund();
  const [reason, setReason] = useState('');
  const [error,  setError]  = useState<string | null>(null);
  const [done,   setDone]   = useState(false);

  const fullAmount = order.estimatePaise - order.discountPaise;

  const handleRefund = async () => {
    setError(null);
    try {
      await refundMutation.mutateAsync({ orderId: order._id, reason: reason || undefined });
      setDone(true);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Refund failed. Please try again.');
    }
  };

  if (done) {
    return (
      <Reveal>
        <GlassCard className="p-5 space-y-3 border border-emerald-500/30">
          <p className="text-emerald-400 font-semibold">✓ Refund initiated</p>
          <p className="text-xs text-[var(--text-muted)]">The gateway refund for {order.orderRef} has been queued. The customer will be credited within 5–7 business days.</p>
          <button onClick={onClose} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">Close</button>
        </GlassCard>
      </Reveal>
    );
  }

  return (
    <Reveal>
      <GlassCard className="p-5 space-y-4 border border-red-500/20">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Issue Refund</p>
            <h2 className="font-display text-lg text-[var(--text-primary)]">{order.orderRef}</h2>
            <p className="text-xs text-[var(--text-muted)]">Full refund of {formatRupees(fullAmount)}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] text-xl px-1">×</button>
        </div>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Reason (optional)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Garment damaged during cleaning"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:border-red-400/50 focus:outline-none"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <p className="text-xs text-[var(--text-muted)]">
          This will trigger a full refund of {formatRupees(fullAmount)} via the payment gateway. This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">Cancel</button>
          <button
            disabled={refundMutation.isPending}
            onClick={handleRefund}
            className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/30 disabled:opacity-50 transition-colors"
          >
            {refundMutation.isPending ? 'Processing…' : 'Confirm Refund'}
          </button>
        </div>
      </GlassCard>
    </Reveal>
  );
}

// ── Manual assign panel for ROUTING_FAILED orders ─────────────────────────────

function ManualAssignPanel({ order, onClose }: { order: AdminOrderDoc; onClose: () => void }) {
  const { data: storeData } = useAdminStores({ status: 'APPROVED' });
  const assignOrder = useAdminAssignOrder();
  const [storeId, setStoreId] = useState('');

  const stores = storeData?.stores ?? [];

  return (
    <Reveal>
      <GlassCard className="p-5 space-y-4 border border-[#EF444440]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-[#EF4444] uppercase tracking-wider mb-1">⚠ Routing Failed — Manual Assignment</p>
            <h2 className="font-display text-lg text-[var(--text-primary)]">{order.orderRef}</h2>
            <p className="text-xs text-[var(--text-muted)]">{order.address.line1}, {order.address.city} {order.address.pincode}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] text-xl px-1">×</button>
        </div>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Assign to Store</label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:border-[var(--gold)]/50 focus:outline-none"
          >
            <option value="">— Select a store —</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.address.city})</option>
            ))}
          </select>
        </div>

        {assignOrder.isError && (
          <p className="text-xs text-[#EF4444]">
            {(assignOrder.error as Error)?.message ?? 'Assignment failed.'}
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">Cancel</button>
          <button
            disabled={!storeId || assignOrder.isPending}
            onClick={() => assignOrder.mutate({ orderId: order._id, storeId }, { onSuccess: onClose })}
            className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
          >
            {assignOrder.isPending ? 'Assigning…' : 'Assign Order'}
          </button>
        </div>
      </GlassCard>
    </Reveal>
  );
}
