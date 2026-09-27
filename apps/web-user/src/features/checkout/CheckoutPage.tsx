import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../stores/cart.store.js';
import { usePlaceOrder, useValidateCoupon } from '../../lib/api.hooks.js';
import { formatRupees } from '../../lib/format.js';
import { api } from '../../lib/api.js';

interface SlotWindow { windowId: string; label: string; start: string; end: string }

interface Address {
  line1:   string;
  line2:   string;
  city:    string;
  state:   string;
  pincode: string;
  country: string;
}

const INDIA_STATES = ['Delhi','Uttar Pradesh','Maharashtra','Karnataka','Tamil Nadu','West Bengal','Rajasthan','Gujarat','Haryana','Punjab'];

const spinStyle = `@keyframes spin { to { transform: rotate(360deg); } }`;

export default function CheckoutPage() {
  const navigate   = useNavigate();
  const cart       = useCartStore();
  const placeOrder = usePlaceOrder();
  const validateCoupon = useValidateCoupon();

  const [address, setAddress]     = useState<Address>({ line1: '', line2: '', city: '', state: 'Uttar Pradesh', pincode: cart.items[0] ? '' : '', country: 'IN' });
  const [pickupDate, setPickupDate] = useState('');
  const [slots, setSlots]         = useState<SlotWindow[]>([]);
  const [windowId, setWindowId]   = useState('');
  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [couponCode, setCouponCode]   = useState(cart.couponCode ?? '');
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount?: number; reason?: string } | null>(null);
  const [step, setStep]           = useState<'address' | 'slot' | 'payment' | 'confirm'>('address');
  const [error, setError]         = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const totalPaise    = cart.totalPaise();
  const discountPaise = couponResult?.valid ? (couponResult.discount ?? 0) : 0;
  const finalPaise    = Math.max(0, totalPaise - discountPaise);

  if (cart.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-muted)' }}>
        <p>Your cart is empty.</p>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>Browse services</button>
      </div>
    );
  }

  const fetchSlots = async (storeId: string, date: string) => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`/api/v1/stores/${storeId}/slots?date=${date}`) as { data: { slots: SlotWindow[] } };
      // Normalize: ensure every slot has a non-empty, unique windowId string
      const normalized = (res.data.slots ?? []).map((s, idx) => ({
        ...s,
        windowId: s.windowId && s.windowId !== 'undefined' ? s.windowId : `window-${idx}`,
      }));
      setSlots(normalized);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (date: string) => {
    setPickupDate(date);
    setWindowId('');
    setSlots([]);
    if (cart.storeId && date) void fetchSlots(cart.storeId, date);
  };

  const handleCouponApply = async () => {
    if (!couponCode.trim()) return;
    const res = await validateCoupon.mutateAsync({ code: couponCode, orderTotal: totalPaise }) as { data: { valid: boolean; reason?: string; coupon?: { value: number; type: string; maxDiscountPaise?: number } } };
    const d   = res.data;
    if (!d.valid) {
      setCouponResult({ valid: false, reason: d.reason });
      return;
    }
    const coupon = d.coupon!;
    const discount = coupon.type === 'PERCENT'
      ? Math.min(Math.floor((totalPaise * coupon.value) / 100), coupon.maxDiscountPaise ?? Infinity)
      : coupon.value;
    setCouponResult({ valid: true, discount });
    cart.applyCoupon(couponCode);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!windowId) { setError('Please select a pickup slot.'); return; }

    try {
      const res = await placeOrder.mutateAsync({
        items: cart.items.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity })),
        address,
        pickupSlot: { date: pickupDate, windowId },
        paymentMode,
        couponCode: couponCode || undefined,
      }) as { data: { order: { _id: string } } };

      const orderId = res.data.order._id;
      cart.clearCart();
      navigate(`/orders/${orderId}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place order. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-void)', paddingBottom: 32 }}>
      <style>{spinStyle}</style>
      <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: 0 }}>←</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Checkout</h1>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['address', 'slot', 'payment', 'confirm'] as const).map((s, i) => (
          <div key={s} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <div style={{ width: 20, height: 1, background: 'var(--glass-border)' }} />}
            <div style={{ fontWeight: step === s ? 700 : 400, color: step === s ? 'var(--gold)' : 'var(--text-muted)', fontSize: 13, textTransform: 'capitalize' }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Step 1: Address ── */}
        {step === 'address' && (
          <Card title="Pickup Address">
            <Field label="Address Line 1">
              <input style={inputStyle} value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} placeholder="House / Flat number, Street" />
            </Field>
            <Field label="Line 2 (optional)">
              <input style={inputStyle} value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} placeholder="Landmark, Area" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="City">
                <input style={inputStyle} value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="City" />
              </Field>
              <Field label="Pincode">
                <input style={inputStyle} value={address.pincode} onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))} placeholder="6-digit" inputMode="numeric" maxLength={6} />
              </Field>
            </div>
            <Field label="State">
              <select style={inputStyle} value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}>
                {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <button style={primaryBtn} onClick={() => {
              if (!address.line1 || !address.city || address.pincode.length !== 6) { setError('Please fill all address fields.'); return; }
              setError(null); setStep('slot');
            }}>Continue</button>
          </Card>
        )}

        {/* ── Step 2: Pickup slot ── */}
        {step === 'slot' && (
          <Card title="Choose Pickup Slot">
            {!cart.storeId && (
              <p style={{ color: '#F59E0B', fontSize: 13, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px' }}>
                Store not found. Please go back to Home and enter your pincode again.
              </p>
            )}
            <Field label="Pickup Date">
              <input type="date" style={inputStyle} value={pickupDate} min={minDate} onChange={(e) => handleDateChange(e.target.value)} />
            </Field>
            {pickupDate && (
              <Field label="Time Slot">
                {loadingSlots
                  ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                      Loading available slots…
                    </div>
                  )
                  : slots.length === 0
                  ? (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ color: '#F87171', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>No pickup slots available</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Try a different date, or contact support.</p>
                    </div>
                  )
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {slots.map((w) => (
                        <label key={w.windowId} style={{
                          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                          padding: '12px 14px', borderRadius: 12,
                          border: `1px solid ${windowId === w.windowId ? 'var(--gold)' : 'var(--glass-border)'}`,
                          background: windowId === w.windowId ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                          transition: 'all 0.15s',
                        }}>
                          <input type="radio" name="slot" value={w.windowId} checked={windowId === w.windowId} onChange={() => setWindowId(w.windowId)} style={{ accentColor: 'var(--gold)' }} />
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: windowId === w.windowId ? 'var(--gold)' : 'var(--text-primary)' }}>{w.label}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>{w.start}–{w.end}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )
                }
              </Field>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={secondaryBtn} onClick={() => { setError(null); setStep('address'); }}>Back</button>
              <button
                style={{ ...primaryBtn, opacity: (!pickupDate || !windowId) ? 0.5 : 1, cursor: (!pickupDate || !windowId) ? 'not-allowed' : 'pointer' }}
                disabled={!pickupDate || !windowId}
                onClick={() => {
                  if (!pickupDate || !windowId) { setError('Please select a date and time slot.'); return; }
                  setError(null); setStep('payment');
                }}
              >Continue</button>
            </div>
          </Card>
        )}

        {/* ── Step 3: Payment ── */}
        {step === 'payment' && (
          <Card title="Payment">
            <Field label="Payment Method">
              <div style={{ display: 'flex', gap: 10 }}>
                {(['ONLINE', 'COD'] as const).map((m) => (
                  <label key={m} style={{ flex: 1, cursor: 'pointer' }}>
                    <input type="radio" name="paymode" value={m} checked={paymentMode === m} onChange={() => setPaymentMode(m)} style={{ display: 'none' }} />
                    <div style={{
                      padding: '12px 0', textAlign: 'center', borderRadius: 12, fontSize: 14, fontWeight: 600,
                      border: '1px solid ' + (paymentMode === m ? 'var(--gold)' : 'var(--glass-border)'),
                      background: paymentMode === m ? 'rgba(212,175,55,0.12)' : 'transparent',
                      color: paymentMode === m ? 'var(--gold)' : 'var(--text-muted)',
                    }}>
                      {m === 'ONLINE' ? 'Pay Online' : 'Cash on Delivery'}
                    </div>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Coupon Code">
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inputStyle, flex: 1 }} value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }} placeholder="Enter code" />
                <button onClick={handleCouponApply} style={{ ...primaryBtn, padding: '0 16px', flex: 'none' }}>Apply</button>
              </div>
              {couponResult && (
                <p style={{ fontSize: 12, marginTop: 4, color: couponResult.valid ? 'var(--gold)' : '#EF4444' }}>
                  {couponResult.valid ? `Coupon applied! You save ${formatRupees(couponResult.discount ?? 0)}` : 'Invalid or expired coupon.'}
                </p>
              )}
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={secondaryBtn} onClick={() => { setError(null); setStep('slot'); }}>Back</button>
              <button style={primaryBtn} onClick={() => { setError(null); setStep('confirm'); }}>Continue</button>
            </div>
          </Card>
        )}

        {/* ── Step 4: Confirm ── */}
        {step === 'confirm' && (
          <>
            <Card title="Order Summary">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cart.items.map((i) => (
                  <div key={i.serviceId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{i.serviceName} × {i.quantity}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatRupees(i.unitPrice * i.quantity)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 8, marginTop: 4 }}>
                  {discountPaise > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gold)' }}>
                      <span>Coupon ({couponCode})</span>
                      <span>−{formatRupees(discountPaise)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                    <span>Estimate Total</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--gold)' }}>{formatRupees(finalPaise)}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Final invoice issued after garment inspection.</p>
                </div>
              </div>
            </Card>

            <Card title="Details">
              <Detail label="Address" value={`${address.line1}, ${address.city} – ${address.pincode}`} />
              <Detail label="Pickup" value={`${pickupDate} · ${slots.find((s) => s.windowId === windowId)?.label ?? ''}`} />
              <Detail label="Payment" value={paymentMode === 'ONLINE' ? 'Online Payment' : 'Cash on Delivery'} />
            </Card>

            {error && <p style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button style={secondaryBtn} onClick={() => { setError(null); setStep('payment'); }}>Back</button>
              <button style={{ ...primaryBtn, flex: 1 }} disabled={placeOrder.isPending} onClick={handleSubmit}>
                {placeOrder.isPending ? 'Placing…' : 'Place Order'}
              </button>
            </div>
          </>
        )}

        {error && step !== 'confirm' && <p style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
}

// ── Small UI helpers ──────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
  color: 'var(--text-primary)', borderRadius: 10, padding: '12px 14px',
  fontSize: 15, width: '100%', outline: 'none', boxSizing: 'border-box',
};

const primaryBtn: React.CSSProperties = {
  flex: 1, background: 'var(--gold)', color: '#0B0B0C', border: 'none',
  borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: 15,
  cursor: 'pointer', minHeight: 48,
};

const secondaryBtn: React.CSSProperties = {
  flex: 1, background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--glass-border)', borderRadius: 12, padding: '14px 0',
  fontWeight: 600, fontSize: 15, cursor: 'pointer', minHeight: 48,
};

const backBtnStyle: React.CSSProperties = {
  marginTop: 16, background: 'var(--gold)', color: '#0B0B0C',
  border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer',
};
