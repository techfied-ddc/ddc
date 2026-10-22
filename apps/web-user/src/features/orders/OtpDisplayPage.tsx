import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard, Reveal } from '@ddc/ui';
import { useOrderDetail } from '../../lib/api.hooks.js';
import { useOtpStore } from '../../stores/otp.store.js';

export default function OtpDisplayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useOrderDetail(id!);
  const order = data;

  const isDelivery = order && ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(order.status);
  const otpType    = isDelivery ? 'delivery' : 'pickup';
  const otp        = useOtpStore((s) => id ? s.otps[`${id}:${otpType}`] : undefined);

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

          <div className="bg-[var(--bg-raised)] rounded-2xl p-6 border border-[var(--gold)]/30">
            <p className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-widest">
              Your {isDelivery ? 'Delivery' : 'Pickup'} OTP
            </p>
            {otp ? (
              <p className="font-mono text-5xl tracking-[0.3em] text-[var(--gold)] font-bold">
                {otp}
              </p>
            ) : (
              <p className="text-sm text-[var(--text-subtle)]">
                Your OTP has been sent to your registered phone number via SMS.
                Keep this page open — it will appear here automatically once the rider is assigned.
              </p>
            )}
            <p className="font-mono text-xs text-[var(--text-muted)] mt-3">
              {order.orderRef}
            </p>
          </div>

          <button
            onClick={() => navigate(`/orders/${id}`)}
            className="w-full py-3 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm"
          >
            ← Back to Order
          </button>
        </GlassCard>
      </Reveal>
    </div>
  );
}
