import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Reveal } from '@ddc/ui';
import { useStoreOrders } from '../../lib/api.hooks.js';
import { statusLabel, statusColor, formatDate, formatRupees } from '../../lib/format.js';

const STATUS_TABS = [
  { key: '',              label: 'All' },
  { key: 'ROUTED',        label: 'New' },
  { key: 'ACCEPTED',      label: 'Accepted' },
  { key: 'AT_STORE',      label: 'At Store' },
  { key: 'INVOICED',      label: 'Invoiced' },
  { key: 'IN_PROCESS',    label: 'Processing' },
  { key: 'READY',         label: 'Ready' },
  { key: 'DELIVERED',     label: 'Delivered' },
  { key: 'CANCELLED',     label: 'Cancelled' },
];

export default function StoreOrdersPage() {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useStoreOrders({ status: activeStatus || undefined, page });
  const orders = data?.orders ?? [];
  const pages  = data?.pages  ?? 1;

  return (
    <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
      <Reveal>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Orders</h1>
          <button
            onClick={() => refetch()}
            className="text-xs text-[var(--gold)] border border-[var(--gold)] rounded-full px-3 py-1"
          >
            Refresh
          </button>
        </div>
      </Reveal>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveStatus(tab.key); setPage(1); }}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              activeStatus === tab.key
                ? 'bg-[var(--gold)] border-[var(--gold)] text-[#0B0B0C]'
                : 'border-[var(--border)] text-[var(--text-muted)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">No orders found.</p>
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {orders.map(order => (
            <li key={order._id}>
              <button onClick={() => navigate(`/orders/${order._id}`)} className="w-full text-left">
                <GlassCard className="p-4 hover:border-[var(--gold)]/60 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-mono text-xs text-[var(--gold)]">{order.orderRef}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium mt-0.5">
                        {order.address.line1}, {order.address.city}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border"
                      style={{ color: statusColor(order.status), borderColor: statusColor(order.status) + '44' }}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--text-subtle)]">
                    <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''} · {order.paymentMode}</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    Est. {formatRupees(order.estimatePaise - order.discountPaise)}
                  </div>
                </GlassCard>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-1.5 rounded-full border border-[var(--border)] text-sm disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="text-sm text-[var(--text-muted)]">{page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-1.5 rounded-full border border-[var(--border)] text-sm disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
