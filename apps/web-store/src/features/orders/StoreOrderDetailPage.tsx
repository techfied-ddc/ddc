import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard, Reveal } from '@ddc/ui';
import {
  useStoreOrderDetail, useOrderInvoice,
  useAcceptOrder, useRejectOrder, useAssignPickup, useReceiveAtStore,
  useMarkProcessing, useMarkReady, useAssignDelivery, useIssueInvoice,
  useStoreRiders,
} from '../../lib/api.hooks.js';
import { statusLabel, statusColor, formatDateTime, formatRupees, mapsNavUrl } from '../../lib/format.js';
import { uploadToCloudinary } from '../../lib/cloudinary.js';

// ── Issue Invoice Form ────────────────────────────────────────────────────────

interface InvoiceLine {
  serviceId: string;
  serviceName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

function IssueInvoicePanel({ orderId, initialLines, onDone }: {
  orderId: string;
  initialLines: InvoiceLine[];
  onDone: () => void;
}) {
  const [lines, setLines]       = useState<InvoiceLine[]>(initialLines);
  const [tax, setTax]           = useState(18);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes]       = useState('');
  const mutation = useIssueInvoice(orderId);

  function updateLine(idx: number, field: keyof InvoiceLine, value: string) {
    setLines(prev => {
      const next = [...prev];
      const l    = { ...next[idx] };
      if (field === 'quantity' || field === 'unitPrice') {
        (l[field] as number) = Math.max(0, Number(value));
        l.lineTotal = Math.round((l.quantity ?? 0) * (l.unitPrice ?? 0));
      }
      next[idx] = l as InvoiceLine;
      return next;
    });
  }

  const subtotal      = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discountPaise = Math.round(discount * 100);
  const afterDiscount = subtotal - discountPaise;
  const taxPaise      = Math.round(afterDiscount * tax / 100);
  const totalPaise    = afterDiscount + taxPaise;

  function submit() {
    mutation.mutate(
      { lines, taxPercent: tax, discountPaise, notes },
      { onSuccess: () => { alert('Invoice issued!'); onDone(); } },
    );
  }

  return (
    <GlassCard className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-[var(--gold)] uppercase tracking-wide">Issue Invoice</h3>

      <div className="space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end text-xs">
            <div className="col-span-5">
              <p className="text-[var(--text-muted)] mb-1">{line.serviceName}</p>
              <p className="text-[var(--text-subtle)]">{line.unit}</p>
            </div>
            <div className="col-span-3">
              <label className="text-[var(--text-subtle)] block mb-0.5">Qty</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={line.quantity}
                onChange={e => updateLine(i, 'quantity', e.target.value)}
                className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] text-xs"
              />
            </div>
            <div className="col-span-4">
              <label className="text-[var(--text-subtle)] block mb-0.5">Price (₹)</label>
              <input
                type="number"
                min="0"
                value={line.unitPrice / 100}
                onChange={e => updateLine(i, 'unitPrice', String(Math.round(Number(e.target.value) * 100)))}
                className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] text-xs"
              />
            </div>
            <div className="col-span-12 text-right text-[var(--text-muted)]">
              = {formatRupees(line.lineTotal)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--text-muted)] block mb-1">GST %</label>
          <input
            type="number"
            min="0"
            max="28"
            value={tax}
            onChange={e => setTax(Number(e.target.value))}
            className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] block mb-1">Discount (₹)</label>
          <input
            type="number"
            min="0"
            value={discount}
            onChange={e => setDiscount(Number(e.target.value))}
            className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--text-muted)] block mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Any notes for the customer…"
          className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm resize-none"
        />
      </div>

      {/* Totals */}
      <div className="space-y-1 text-sm border-t border-[var(--border)] pt-3">
        <div className="flex justify-between text-[var(--text-muted)]">
          <span>Subtotal</span><span>{formatRupees(subtotal)}</span>
        </div>
        {discountPaise > 0 && (
          <div className="flex justify-between text-[var(--success)]">
            <span>Discount</span><span>−{formatRupees(discountPaise)}</span>
          </div>
        )}
        <div className="flex justify-between text-[var(--text-muted)]">
          <span>GST ({tax}%)</span><span>+{formatRupees(taxPaise)}</span>
        </div>
        <div className="flex justify-between font-semibold text-[var(--text-primary)] border-t border-[var(--border)] pt-1 mt-1">
          <span>Total</span><span className="text-[var(--gold)]">{formatRupees(totalPaise)}</span>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={mutation.isPending || totalPaise <= 0}
        className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
      >
        {mutation.isPending ? 'Issuing…' : 'Issue Invoice'}
      </button>
      {mutation.isError && (
        <p className="text-xs text-[var(--danger)] text-center">
          {(mutation.error as Error).message}
        </p>
      )}
    </GlassCard>
  );
}

// ── Assign Rider Panel ────────────────────────────────────────────────────────

function AssignRiderPanel({ label, onAssign }: { label: string; onAssign: (riderId: string) => void }) {
  const { data } = useStoreRiders();
  const riders   = data?.riders ?? [];
  const active   = riders.filter(r => r.status === 'ACTIVE');
  const [selected, setSelected] = useState('');

  return (
    <div className="space-y-3">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm"
      >
        <option value="">Select rider…</option>
        {active.map(r => (
          <option key={r._id} value={r._id}>{r.name} · {r.phone}</option>
        ))}
      </select>
      <button
        onClick={() => selected && onAssign(selected)}
        disabled={!selected}
        className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StoreOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useStoreOrderDetail(id!);
  const { data: invoiceData } = useOrderInvoice(id!);
  const order   = data?.order;
  const invoice = invoiceData?.invoice;

  const [rejectReason, setRejectReason] = useState('');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [photos, setPhotos]         = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept       = useAcceptOrder(id!);
  const reject       = useRejectOrder(id!);
  const assignPickup = useAssignPickup(id!);
  const receive      = useReceiveAtStore(id!);
  const processing   = useMarkProcessing(id!);
  const ready        = useMarkReady(id!);
  const assignDlv    = useAssignDelivery(id!);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const status = order.status;

  const initialLines = order.items.map(item => ({
    serviceId:   item.serviceId,
    serviceName: item.serviceName,
    unit:        item.unit,
    quantity:    item.quantity,
    unitPrice:   item.unitPrice,
    lineTotal:   Math.round(item.quantity * item.unitPrice),
  }));

  return (
    <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto pb-24">
      {/* Back */}
      <button onClick={() => navigate('/orders')} className="text-sm text-[var(--gold)] flex items-center gap-1">
        ← Orders
      </button>

      {/* Header */}
      <Reveal>
        <GlassCard className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-sm text-[var(--gold)]">{order.orderRef}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <span
              className="text-xs font-medium px-2 py-1 rounded-full border"
              style={{ color: statusColor(status), borderColor: statusColor(status) + '44' }}
            >
              {statusLabel(status)}
            </span>
          </div>
          <p className="text-sm text-[var(--text-primary)] mt-2">
            {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
            {order.address.city}, {order.address.pincode}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Pickup: {order.pickupSlot.date}
            {order.pickupSlot.windowLabel && ` · ${order.pickupSlot.windowLabel}`}
          </p>
          <a
            href={mapsNavUrl(order.address)}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-2 text-xs text-[var(--gold)] underline underline-offset-2"
          >
            Open in Maps →
          </a>
        </GlassCard>
      </Reveal>

      {/* Order items */}
      <Reveal delay={0.05}>
        <GlassCard className="p-4">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Items</h3>
          <ul className="space-y-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)]">{item.serviceName} × {item.quantity}</span>
                <span className="text-[var(--text-muted)]">{formatRupees(item.quantity * item.unitPrice)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--border)] mt-3 pt-3 flex justify-between text-sm font-medium">
            <span className="text-[var(--text-muted)]">Estimate</span>
            <span className="text-[var(--gold)]">{formatRupees(order.estimatePaise - order.discountPaise)}</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-subtle)] mt-1">
            <span>Payment</span>
            <span>{order.paymentMode} · {order.paymentStatus}</span>
          </div>
        </GlassCard>
      </Reveal>

      {/* Invoice (if issued) */}
      {invoice && (
        <Reveal delay={0.08}>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Invoice</h3>
              <span className="font-mono text-xs text-[var(--gold)]">{invoice.invoiceRef}</span>
            </div>
            <ul className="space-y-1 text-sm">
              {invoice.lines.map((line, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-[var(--text-primary)]">{line.serviceName} × {line.quantity}</span>
                  <span className="text-[var(--text-muted)]">{formatRupees(line.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--border)] mt-3 pt-3 space-y-1 text-sm">
              {invoice.discountPaise > 0 && (
                <div className="flex justify-between text-[var(--success)]">
                  <span>Discount</span><span>−{formatRupees(invoice.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>GST ({invoice.taxPercent}%)</span><span>+{formatRupees(invoice.taxPaise)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-[var(--text-primary)]">Total</span>
                <span className="text-[var(--gold)]">{formatRupees(invoice.totalPaise)}</span>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      )}

      {/* Actions */}
      <Reveal delay={0.1}>
        <GlassCard className="p-4 space-y-3">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Actions</h3>

          {/* ROUTED — accept or reject */}
          {status === 'ROUTED' && (
            <>
              <button
                onClick={() => accept.mutate()}
                disabled={accept.isPending}
                className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
              >
                {accept.isPending ? 'Accepting…' : 'Accept Order'}
              </button>
              <div className="space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection…"
                  rows={2}
                  className="w-full bg-[var(--bg-raised)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] resize-none"
                />
                <button
                  onClick={() => reject.mutate({ reason: rejectReason })}
                  disabled={reject.isPending || !rejectReason}
                  className="w-full py-2.5 rounded-xl border border-[var(--danger)] text-[var(--danger)] font-semibold text-sm disabled:opacity-50"
                >
                  Reject Order
                </button>
              </div>
            </>
          )}

          {/* ACCEPTED — assign pickup rider */}
          {status === 'ACCEPTED' && (
            <AssignRiderPanel
              label="Assign Pickup Rider"
              onAssign={(riderId) => assignPickup.mutate({ riderId })}
            />
          )}

          {/* PICKED_UP — receive at store with optional garment photos */}
          {status === 'PICKED_UP' && (
            <div className="space-y-3">
              {/* Photo upload */}
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Garment photos (optional)</p>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((url, i) => (
                    <div key={i} className="relative w-14 h-14">
                      <img src={url} alt={`Garment ${i+1}`} className="w-14 h-14 rounded-lg object-cover border border-[var(--border)]" />
                      <button
                        onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--danger)] text-white text-[9px] flex items-center justify-center"
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading || photos.length >= 5}
                    className="w-14 h-14 rounded-lg border-2 border-dashed border-[var(--border)] text-[var(--text-muted)] text-xl flex items-center justify-center disabled:opacity-40"
                    title="Add photo"
                  >
                    {photoUploading ? '…' : '+'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPhotoUploading(true);
                      try {
                        const url = await uploadToCloudinary(file, 'garment');
                        setPhotos(p => [...p, url]);
                      } catch {
                        // TODO: show toast
                      } finally {
                        setPhotoUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => receive.mutate(photos.length > 0 ? { photos } : {})}
                disabled={receive.isPending || photoUploading}
                className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
              >
                {receive.isPending ? 'Marking…' : 'Mark Received at Store'}
              </button>
            </div>
          )}

          {/* AT_STORE or INVOICED — issue invoice or start processing */}
          {['AT_STORE', 'INVOICED'].includes(status) && (
            <>
              <button
                onClick={() => setShowInvoiceForm(v => !v)}
                className="w-full py-2.5 rounded-xl border border-[var(--gold)] text-[var(--gold)] font-semibold text-sm"
              >
                {showInvoiceForm ? 'Cancel' : invoice ? 'Re-Issue Invoice' : 'Issue Invoice'}
              </button>
              {showInvoiceForm && (
                <IssueInvoicePanel
                  orderId={id!}
                  initialLines={initialLines}
                  onDone={() => setShowInvoiceForm(false)}
                />
              )}
              {status === 'INVOICED' && (
                <button
                  onClick={() => processing.mutate()}
                  disabled={processing.isPending}
                  className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
                >
                  {processing.isPending ? 'Starting…' : 'Start Processing'}
                </button>
              )}
            </>
          )}

          {/* IN_PROCESS — mark ready */}
          {status === 'IN_PROCESS' && (
            <button
              onClick={() => ready.mutate()}
              disabled={ready.isPending}
              className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
            >
              {ready.isPending ? 'Marking…' : 'Mark Ready for Delivery'}
            </button>
          )}

          {/* READY — assign delivery rider */}
          {status === 'READY' && (
            <AssignRiderPanel
              label="Assign Delivery Rider"
              onAssign={(riderId) => assignDlv.mutate({ riderId })}
            />
          )}

          {['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'].includes(status) && (
            <p className="text-sm text-[var(--text-subtle)] text-center py-2">
              {['DELIVERED', 'COMPLETED'].includes(status) ? '✓ Order complete.' : 'Awaiting rider or customer action.'}
            </p>
          )}
        </GlassCard>
      </Reveal>

      {/* Status history */}
      <Reveal delay={0.12}>
        <GlassCard className="p-4">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Timeline</h3>
          <ol className="space-y-3">
            {[...order.statusHistory].reverse().map((evt, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className="mt-0.5 w-2 h-2 rounded-full shrink-0 border-2"
                  style={{ borderColor: i === 0 ? 'var(--gold)' : 'var(--border)', backgroundColor: i === 0 ? 'var(--gold)' : 'transparent' }}
                />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{statusLabel(evt.status)}</p>
                  <p className="text-xs text-[var(--text-subtle)]">{formatDateTime(evt.at)}</p>
                  {evt.note && <p className="text-xs text-[var(--text-muted)] mt-0.5">{evt.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </GlassCard>
      </Reveal>
    </div>
  );
}
