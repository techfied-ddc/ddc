import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard, Reveal } from '@ddc/ui';
import {
  useAdminOrderDetail, useAdminOrderInvoice, useAdminAssignOrder,
  useAdminRefund, useAdminStores,
} from '../../lib/api.hooks.js';
import { formatRupees, formatDateTime, statusColor } from '../../lib/format.js';

function statusLabel(s: string) {
  return s.replace(/_/g, ' ');
}

export default function AdminOrderDetailPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const { data, isLoading } = useAdminOrderDetail(id!);
  const { data: invData }   = useAdminOrderInvoice(id!);
  const { data: storesData } = useAdminStores();
  const assignOrder = useAdminAssignOrder();
  const refund      = useAdminRefund();

  const [assignStoreId, setAssignStoreId] = React.useState('');
  const [refundReason,  setRefundReason]  = React.useState('');
  const [refundDone,    setRefundDone]    = React.useState(false);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const order   = data.order;
  const invoice = invData?.invoice ?? null;
  const stores  = storesData?.stores ?? [];

  const canAssign = order.status === 'ROUTING_FAILED';
  const canRefund = order.paymentMode === 'ONLINE' && order.paymentStatus === 'PAID' && !refundDone;
  const refundAmt = order.invoiceTotalPaise ?? (order.estimatePaise - order.discountPaise);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto">
      <Reveal>
        <button onClick={() => navigate('/orders')} className="text-sm text-[var(--gold)] flex items-center gap-1 mb-1">
          ← Orders
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-xl font-bold text-[var(--gold)]">{order.orderRef}</h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">Created {formatDateTime(order.createdAt)}</p>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full border"
            style={{ color: statusColor(order.status), borderColor: statusColor(order.status) + '44', background: statusColor(order.status) + '18' }}
          >
            {statusLabel(order.status)}
          </span>
        </div>
      </Reveal>

      {/* Summary row */}
      <Reveal delay={0.04}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Payment Mode',   value: order.paymentMode },
            { label: 'Payment Status', value: order.paymentStatus },
            { label: 'Estimate',       value: formatRupees(order.estimatePaise - order.discountPaise) },
            { label: 'Invoice Total',  value: invoice ? formatRupees(invoice.totalPaise) : '—' },
          ].map(({ label, value }) => (
            <GlassCard key={label} className="p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
            </GlassCard>
          ))}
        </div>
      </Reveal>

      {/* Items */}
      {'items' in order && Array.isArray((order as { items?: unknown[] }).items) && (order as { items: { serviceName: string; quantity: number; unitPrice: number }[] }).items.length > 0 && (
        <Reveal delay={0.06}>
          <GlassCard className="p-4">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Order Items</h3>
            <ul className="space-y-2">
              {(order as { items: { serviceName: string; quantity: number; unitPrice: number }[] }).items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-[var(--text-primary)]">{item.serviceName} × {item.quantity}</span>
                  <span className="text-[var(--text-muted)] font-mono">{formatRupees(item.quantity * item.unitPrice)}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </Reveal>
      )}

      {/* Invoice */}
      {invoice && (
        <Reveal delay={0.07}>
          <GlassCard className="p-4">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Invoice</h3>
            <ul className="space-y-1.5 text-sm mb-3">
              {invoice.lines.map((ln, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">{ln.serviceName} × {ln.quantity}</span>
                  <span className="font-mono text-[var(--text-muted)]">{formatRupees(ln.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--border)] pt-3 space-y-1 text-sm">
              {invoice.discountPaise > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span><span>−{formatRupees(invoice.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>GST ({invoice.taxPercent}%)</span><span>+{formatRupees(invoice.taxPaise)}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span className="text-[var(--text-primary)]">Total</span>
                <span className="text-[var(--gold)]">{formatRupees(invoice.totalPaise)}</span>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      )}

      {/* Address */}
      <Reveal delay={0.08}>
        <GlassCard className="p-4 text-sm">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2">Delivery Address</p>
          <p className="text-[var(--text-primary)]">{order.address.line1}</p>
          <p className="text-[var(--text-muted)]">{order.address.city}, {order.address.pincode}</p>
          <p className="text-[var(--text-muted)]">{order.address.state}</p>
        </GlassCard>
      </Reveal>

      {/* Status timeline */}
      {'statusHistory' in order && Array.isArray((order as { statusHistory?: unknown[] }).statusHistory) && (
        <Reveal delay={0.09}>
          <GlassCard className="p-4">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Timeline</h3>
            <div className="space-y-3">
              {((order as { statusHistory: { status: string; at: string; note?: string }[] }).statusHistory).slice().reverse().map((h, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${idx === 0 ? 'bg-[var(--gold)]' : 'bg-[var(--glass-border)]'}`} />
                  <div>
                    <p className={`text-sm ${idx === 0 ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {statusLabel(h.status)}
                    </p>
                    <p className="text-xs text-[var(--text-subtle)]">{formatDateTime(h.at)}</p>
                    {h.note && <p className="text-xs text-[var(--text-muted)] italic mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>
      )}

      {/* Actions */}
      {(canAssign || canRefund) && (
        <Reveal delay={0.1}>
          <GlassCard className="p-4 space-y-4">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Actions</h3>

            {canAssign && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--warning)]">This order failed routing — assign a store manually.</p>
                <select
                  value={assignStoreId}
                  onChange={e => setAssignStoreId(e.target.value)}
                  className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
                >
                  <option value="">Select a store…</option>
                  {stores.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <button
                  disabled={!assignStoreId || assignOrder.isPending}
                  onClick={() => assignOrder.mutate({ orderId: id!, storeId: assignStoreId }, { onSuccess: () => navigate('/orders') })}
                  className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
                >
                  {assignOrder.isPending ? 'Assigning…' : 'Assign to Store'}
                </button>
              </div>
            )}

            {canRefund && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-muted)]">
                  Initiate refund of <span className="text-[var(--gold)] font-semibold">{formatRupees(refundAmt)}</span> to the customer.
                </p>
                <input
                  type="text"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                />
                <button
                  disabled={refund.isPending}
                  onClick={() => refund.mutate(
                    { orderId: id!, reason: refundReason || undefined },
                    { onSuccess: () => setRefundDone(true) },
                  )}
                  className="w-full py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-sm disabled:opacity-50"
                >
                  {refund.isPending ? 'Processing…' : 'Initiate Refund'}
                </button>
                {refund.isError && (
                  <p className="text-xs text-[var(--danger)] text-center">{(refund.error as Error)?.message}</p>
                )}
              </div>
            )}

            {refundDone && (
              <p className="text-xs text-emerald-400 font-semibold text-center">✓ Refund initiated successfully.</p>
            )}
          </GlassCard>
        </Reveal>
      )}
    </div>
  );
}
