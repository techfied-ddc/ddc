import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyOrders } from '../../lib/api.hooks.js';
import { formatRupees, formatDate, statusLabel, statusColor } from '../../lib/format.js';

const STATUS_FILTERS = [
  { value: '',           label: 'All' },
  { value: 'PLACED',    label: 'Placed' },
  { value: 'PROCESSING',label: 'Active' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [page, setPage]     = useState(1);

  const { data, isLoading, isError } = useMyOrders({ status: filter || undefined, page });

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-void)' }}>
      <div style={{ padding: '20px 16px 12px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>My Orders</h1>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 999, fontSize: 13,
                fontWeight: filter === f.value ? 700 : 400,
                border: '1px solid ' + (filter === f.value ? 'var(--gold)' : 'var(--glass-border)'),
                background: filter === f.value ? 'rgba(212,175,55,0.12)' : 'transparent',
                color: filter === f.value ? 'var(--gold)' : 'var(--text-muted)',
                cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 36,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading && <Loader />}
        {isError   && <ErrorState />}
        {!isLoading && !isError && data?.orders.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No orders yet.</p>
            <button onClick={() => navigate('/')} style={{ background: 'var(--gold)', color: '#0B0B0C', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>
              Start an order
            </button>
          </div>
        )}
        {data?.orders.map((order) => (
          <button
            key={order._id}
            onClick={() => navigate(`/orders/${order._id}`)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: 16, padding: 16, cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                {order.orderRef}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(order.status) }}>
                {statusLabel(order.status)}
              </span>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              {order.items.slice(0, 2).map((i) => `${i.serviceName} ×${i.quantity}`).join(', ')}
              {order.items.length > 2 && ` +${order.items.length - 2} more`}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(order.createdAt)}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>
                {formatRupees(order.estimatePaise - order.discountPaise)}
              </span>
            </div>
          </button>
        ))}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '8px 0' }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={pageBtn}>← Prev</button>
            <span style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '36px' }}>{page} / {data.pages}</span>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={pageBtn}>Next →</button>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

const pageBtn: React.CSSProperties = {
  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)',
  borderRadius: 10, padding: '0 16px', height: 36, cursor: 'pointer', fontSize: 13,
};

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  </div>
);

const ErrorState = () => (
  <p style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-muted)' }}>Could not load orders. Please try again.</p>
);
