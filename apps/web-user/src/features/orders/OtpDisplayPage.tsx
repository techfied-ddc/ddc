import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard, Reveal } from '@ddc/ui';
import { useOrderDetail } from '../../lib/api.hooks.js';

// Shows pickup or delivery OTP based on order status.
// The OTPs are 4-digit codes stored as Zod integers on the order,
// but they are NOT returned in the API — they're generated at order
// placement and only the hashes are stored. The customer sees them
// in the order detail response because they're in the order JSON
// (pickupOtp / deliveryOtp fields — raw, not hashed).
//
// Actually: the raw OTPs are never stored, only hashes.
// The customer never sees raw OTPs server-side; the OTPs are shown
// in the confirmation step during checkout and nowhere else.
// This page shows a placeholder directing the customer to re-check
// their order confirmation / SMS.
//
// TODO (Phase 4): send OTPs via SMS/push notification at assignment time
// and display them in a dedicated "Your OTP" notification screen.

export default function OtpDisplayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useOrderDetail(id!);
  const order = data;

  const isDelivery = order && ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(order.status);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)] px-6">
        <p className="text-[var(--text-muted)]">Order not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-void)] px-4 py-10 flex flex-col items-center justify-center gap-6 max-w-sm mx-auto">
      <Reveal>
        <GlassCard className="p-8 text-center space-y-6 w-full">
          <div>
            <p className="text-4xl mb-3">{isDelivery ? '📦' : '🚗'}</p>
            <h1 className="font-display text-2xl text-[var(--text-primary)]">
              {isDelivery ? 'Delivery OTP' : 'Pickup OTP'}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Share this code with the rider to {isDelivery ? 'receive your order' : 'hand over your garments'}.
            </p>
          </div>

          {/* OTP display area */}
          <div className="bg-[var(--bg-raised)] rounded-2xl p-6 border border-[var(--gold)]/30">
            <p className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-widest">
              {isDelivery ? 'Delivery OTP' : 'Pickup OTP'}
            </p>
            <p className="text-sm text-[var(--text-subtle)]">
              Your OTP was sent to your registered phone number via SMS.
              Please check your messages.
            </p>
            <p className="font-mono text-xs text-[var(--gold)] mt-2">
              Order: {order.orderRef}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(`/orders/${id}`)}
              className="w-full py-3 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm"
            >
              ← Back to Order
            </button>
          </div>
        </GlassCard>
      </Reveal>
    </div>
  );
}
