import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GlassCard, Reveal } from '@ddc/ui';
import {
  useRiderJobs,
  useAcceptPickup, useVerifyPickupOtp,
  useAcceptDelivery, useCollectCod, useVerifyDeliveryOtp,
  type OrderDoc,
} from '../../lib/api.hooks.js';
import { statusLabel, statusColor, formatDateTime, mapsNavUrl } from '../../lib/format.js';

// ── Pickup job card ───────────────────────────────────────────────────────────

function PickupJobCard({ order }: { order: OrderDoc }) {
  const [otp, setOtp] = useState('');
  const accept = useAcceptPickup(order._id);
  const verify = useVerifyPickupOtp(order._id);

  const isInProgress = order.status === 'PICKUP_IN_PROGRESS';

  return (
    <GlassCard className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--gold)] font-mono">{order.orderRef}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Pickup job</p>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full border"
          style={{ color: statusColor(order.status), borderColor: statusColor(order.status) + '44' }}
        >
          {statusLabel(order.status)}
        </span>
      </div>

      <div className="text-sm text-[var(--text-primary)]">
        <p className="font-medium">{order.address.line1}</p>
        {order.address.line2 && <p>{order.address.line2}</p>}
        <p className="text-[var(--text-muted)]">{order.address.city}, {order.address.pincode}</p>
      </div>

      <a
        href={mapsNavUrl(order.address)}
        target="_blank"
        rel="noreferrer"
        className="block w-full text-center py-2 rounded-xl border border-[var(--gold)] text-[var(--gold)] text-sm font-medium"
      >
        🗺 Navigate to Customer
      </a>

      {!isInProgress && (
        <button
          onClick={() => accept.mutate()}
          disabled={accept.isPending}
          className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
        >
          {accept.isPending ? 'Starting…' : 'Start Pickup Journey'}
        </button>
      )}

      {/* OTP Verification */}
      <div className="border-t border-[var(--border)] pt-3 space-y-2">
        <p className="text-xs text-[var(--text-muted)] font-semibold">Enter customer&apos;s Pickup OTP</p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="0000"
          className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-center font-mono text-xl tracking-widest text-[var(--text-primary)]"
        />
        <button
          onClick={() => verify.mutate({ otp })}
          disabled={otp.length < 4 || verify.isPending}
          className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
        >
          {verify.isPending ? 'Verifying…' : 'Verify & Confirm Pickup'}
        </button>
        {verify.isError && (
          <p className="text-xs text-[var(--danger)] text-center">{(verify.error as Error).message}</p>
        )}
      </div>
    </GlassCard>
  );
}

// ── Delivery job card ─────────────────────────────────────────────────────────

function DeliveryJobCard({ order }: { order: OrderDoc }) {
  const [otp, setOtp] = useState('');
  const accept     = useAcceptDelivery(order._id);
  const collectCod = useCollectCod(order._id);
  const verify     = useVerifyDeliveryOtp(order._id);

  const isOnRoute  = order.status === 'OUT_FOR_DELIVERY';
  const isCod      = order.paymentMode === 'COD';
  const isPaid     = order.paymentStatus === 'PAID';

  return (
    <GlassCard className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--gold)] font-mono">{order.orderRef}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Delivery job</p>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full border"
          style={{ color: statusColor(order.status), borderColor: statusColor(order.status) + '44' }}
        >
          {statusLabel(order.status)}
        </span>
      </div>

      <div className="text-sm text-[var(--text-primary)]">
        <p className="font-medium">{order.address.line1}</p>
        {order.address.line2 && <p>{order.address.line2}</p>}
        <p className="text-[var(--text-muted)]">{order.address.city}, {order.address.pincode}</p>
      </div>

      <a
        href={mapsNavUrl(order.address)}
        target="_blank"
        rel="noreferrer"
        className="block w-full text-center py-2 rounded-xl border border-[var(--gold)] text-[var(--gold)] text-sm font-medium"
      >
        🗺 Navigate to Customer
      </a>

      {!isOnRoute && (
        <button
          onClick={() => accept.mutate()}
          disabled={accept.isPending}
          className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
        >
          {accept.isPending ? 'Starting…' : 'Start Delivery Journey'}
        </button>
      )}

      {/* COD collection */}
      {isCod && !isPaid && (
        <button
          onClick={() => collectCod.mutate()}
          disabled={collectCod.isPending}
          className="w-full py-2.5 rounded-xl border border-[var(--gold)] text-[var(--gold)] font-semibold text-sm disabled:opacity-50"
        >
          {collectCod.isPending ? 'Marking…' : `Collect Cash · ₹${order.estimatePaise / 100}`}
        </button>
      )}

      {isCod && !isPaid && (
        <p className="text-xs text-[var(--warning)] text-center">Collect cash before verifying OTP</p>
      )}

      {/* OTP Verification */}
      <div className="border-t border-[var(--border)] pt-3 space-y-2">
        <p className="text-xs text-[var(--text-muted)] font-semibold">Enter customer&apos;s Delivery OTP</p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="0000"
          className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-center font-mono text-xl tracking-widest text-[var(--text-primary)]"
        />
        <button
          onClick={() => verify.mutate({ otp })}
          disabled={otp.length < 4 || verify.isPending || (isCod && !isPaid)}
          className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
        >
          {verify.isPending ? 'Verifying…' : 'Verify & Confirm Delivery'}
        </button>
        {verify.isError && (
          <p className="text-xs text-[var(--danger)] text-center">{(verify.error as Error).message}</p>
        )}
      </div>
    </GlassCard>
  );
}

// ── Main rider view ───────────────────────────────────────────────────────────

export default function RiderHome() {
  const location = useLocation();
  const isPast   = location.pathname.includes('history');

  const { data, isLoading } = useRiderJobs(isPast);
  const orders = data?.orders ?? [];

  const pickupJobs   = orders.filter(o => ['PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS'].includes(o.status));
  const deliveryJobs = orders.filter(o => ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(o.status));

  if (isPast) {
    return (
      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        <Reveal>
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Job History</h1>
        </Reveal>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">No completed jobs yet.</p>
          </GlassCard>
        ) : (
          <ul className="space-y-3">
            {orders.map(o => (
              <li key={o._id}>
                <GlassCard className="p-3">
                  <div className="flex justify-between items-center">
                    <p className="font-mono text-xs text-[var(--gold)]">{o.orderRef}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{ color: statusColor(o.status), borderColor: statusColor(o.status) + '44' }}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{o.address.city} · {formatDateTime(o.updatedAt)}</p>
                </GlassCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
      <Reveal>
        <div>
          <p className="text-xs font-mono tracking-widest text-[var(--gold)] uppercase mb-1">Rider View</p>
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Active Jobs</h1>
        </div>
      </Reveal>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
        </div>
      ) : pickupJobs.length === 0 && deliveryJobs.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm text-[var(--text-muted)]">No active jobs. You&apos;re all caught up!</p>
        </GlassCard>
      ) : (
        <>
          {pickupJobs.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Pickups</p>
              {pickupJobs.map(o => <PickupJobCard key={o._id} order={o} />)}
            </div>
          )}
          {deliveryJobs.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Deliveries</p>
              {deliveryJobs.map(o => <DeliveryJobCard key={o._id} order={o} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
