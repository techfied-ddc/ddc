import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderDetail, useRateOrder, useCancelOrder } from '../../lib/api.hooks.js';
import { formatRupees, formatDateTime, statusLabel, statusColor, formatDate } from '../../lib/format.js';

export default function OrderDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const orderId   = id ?? '';

  const { data: order, isLoading, isError } = useOrderDetail(orderId);
  const rateOrder   = useRateOrder(orderId);
  const cancelOrder = useCancelOrder(orderId);

  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [showRate,setShowRate] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (isLoading) return <Loader />;
  if (isError || !order) return <ErrorState onBack={() => navigate('/orders')} />;

  const canRate        = order.status === 'DELIVERED' && !order.rating;
  const canCancel      = ['PLACED', 'ROUTED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(order.status);
  const needsOtp       = ['PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(order.status);
  const needsPayment   = order.status === 'INVOICED' && order.paymentMode === 'ONLINE' && order.paymentStatus !== 'PAID';
  const finalPaise     = order.estimatePaise - order.discountPaise;

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-void)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: 0 }}>←</button>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>{order.orderRef}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: statusColor(order.status), marginTop: 2 }}>{statusLabel(order.status)}</div>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Timeline */}
        <Section title="Timeline">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {order.statusHistory.slice().reverse().map((h, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: idx === 0 ? 'var(--gold)' : 'var(--glass-border)', flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: idx === 0 ? 700 : 400, color: idx === 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {statusLabel(h.status)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(h.at)}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Items */}
        <Section title="Items">
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{item.serviceName} × {item.quantity}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatRupees(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 10, marginTop: 4 }}>
            {order.discountPaise > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gold)', marginBottom: 4 }}>
                <span>Coupon ({order.couponCode})</span>
                <span>−{formatRupees(order.discountPaise)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
              <span>Estimate</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--gold)' }}>{formatRupees(finalPaise)}</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Final bill issued after inspection.</p>
          </div>
        </Section>

        {/* Pickup details */}
        <Section title="Pickup Details">
          <Row label="Date"    value={formatDate(order.pickupSlot.date)} />
          <Row label="Slot"    value={`${order.pickupSlot.windowLabel || 'TBD'} ${order.pickupSlot.start && order.pickupSlot.end ? `· ${order.pickupSlot.start}–${order.pickupSlot.end}` : ''}`} />
          <Row label="Payment" value={order.paymentMode === 'COD' ? 'Cash on Delivery' : 'Online'} />
          <Row label="Status"  value={order.paymentStatus} />
        </Section>

        {/* Rating (if already rated) */}
        {order.rating && (
          <Section title="Your Rating">
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3,4,5].map((s) => (
                <span key={s} style={{ fontSize: 22, color: s <= order.rating!.score ? 'var(--gold)' : 'var(--glass-border)' }}>★</span>
              ))}
            </div>
            {order.rating.comment && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>{order.rating.comment}</p>}
          </Section>
        )}

        {/* OTP / Payment actions */}
        {(needsOtp || needsPayment) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {needsOtp && (
              <button onClick={() => navigate(`/orders/${orderId}/otp`)} style={goldBtn}>
                Show {['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(order.status) ? 'Delivery' : 'Pickup'} OTP
              </button>
            )}
            {needsPayment && (
              <button onClick={() => navigate(`/orders/${orderId}/invoice`)} style={goldBtn}>
                View Invoice & Pay
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        {(canRate || canCancel) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {canRate && !showRate && (
              <button onClick={() => setShowRate(true)} style={goldBtn}>Rate this order</button>
            )}

            {showRate && (
              <Section title="Rate your experience">
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', fontSize: 32, cursor: 'pointer', color: s <= rating ? 'var(--gold)' : 'var(--glass-border)' }}>★</button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more (optional)"
                  rows={3}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 10, padding: 12, fontSize: 14, width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <button
                  disabled={rating === 0 || rateOrder.isPending}
                  onClick={() => rateOrder.mutate({ rating, comment: comment || undefined }, { onSuccess: () => setShowRate(false) })}
                  style={{ ...goldBtn, opacity: rating === 0 ? 0.5 : 1 }}
                >
                  {rateOrder.isPending ? 'Submitting…' : 'Submit Rating'}
                </button>
              </Section>
            )}

            {canCancel && !showCancel && (
              <button onClick={() => setShowCancel(true)} style={ghostBtn}>Cancel Order</button>
            )}

            {showCancel && (
              <Section title="Cancel Order">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation"
                  rows={3}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #EF4444', color: 'var(--text-primary)', borderRadius: 10, padding: 12, fontSize: 14, width: '100%', resize: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowCancel(false)} style={{ ...ghostBtn, flex: 1 }}>Back</button>
                  <button
                    disabled={!cancelReason.trim() || cancelOrder.isPending}
                    onClick={() => cancelOrder.mutate({ reason: cancelReason }, { onSuccess: () => navigate('/orders') })}
                    style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {cancelOrder.isPending ? 'Cancelling…' : 'Confirm Cancel'}
                  </button>
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 16 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  );
}

const goldBtn: React.CSSProperties = {
  background: 'var(--gold)', color: '#0B0B0C', border: 'none',
  borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%',
};

const ghostBtn: React.CSSProperties = {
  background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)',
  borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 15, cursor: 'pointer', width: '100%',
};

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  </div>
);

const ErrorState = ({ onBack }: { onBack: () => void }) => (
  <div style={{ textAlign: 'center', paddingTop: 80 }}>
    <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Order not found.</p>
    <button onClick={onBack} style={ghostBtn}>Back to orders</button>
  </div>
);
