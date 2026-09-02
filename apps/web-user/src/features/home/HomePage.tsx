import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store.js';
import { useCartStore } from '../../stores/cart.store.js';
import { useMyOrders } from '../../lib/api.hooks.js';
import { formatRupees, statusLabel, statusColor, formatDate } from '../../lib/format.js';
import { api } from '../../lib/api.js';

export default function HomePage() {
  const navigate    = useNavigate();
  const user        = useAuthStore((s) => s.user);
  const cartCount   = useCartStore((s) => s.itemCount());
  const cartTotal   = useCartStore((s) => s.totalPaise());
  const storeIdCart = useCartStore((s) => s.storeId);

  const [pincode, setPincode]   = useState('');
  const [, setStoreId]          = useState<string | null>(null);
  const [routing, setRouting]   = useState(false);
  const [routeErr, setRouteErr] = useState<string | null>(null);

  const { data: ordersData } = useMyOrders({ page: 1 });
  const recentOrders = ordersData?.orders.slice(0, 3) ?? [];

  const handleRoute = async () => {
    if (pincode.length !== 6) { setRouteErr('Enter a valid 6-digit pincode.'); return; }
    setRouteErr(null);
    setRouting(true);
    try {
      const res = await api.post('/api/v1/geo/route', { pincode }) as { data: { routed: boolean; storeId: string } };
      if (!res.data.routed) { setRouteErr("No store serves your area yet. We're expanding soon!"); }
      else {
        setStoreId(res.data.storeId);
        navigate(`/catalog?storeId=${res.data.storeId}`);
      }
    } catch {
      setRouteErr('Could not detect store. Please try again.');
    } finally {
      setRouting(false);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-void)', padding: '20px 16px', paddingBottom: 80 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
          Hello{user?.id ? '!' : ', Guest!'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Premium dry cleaning, at your door.</p>
      </div>

      {/* Pincode / store locator */}
      <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Enter your pincode</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', borderRadius: 12, padding: '12px 14px', fontSize: 18,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', outline: 'none',
            }}
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            placeholder="110001"
            onKeyDown={(e) => e.key === 'Enter' && handleRoute()}
          />
          <button
            onClick={handleRoute}
            disabled={routing}
            style={{
              background: 'var(--gold)', color: '#0B0B0C', border: 'none',
              borderRadius: 12, padding: '0 20px', fontWeight: 700, fontSize: 15,
              cursor: routing ? 'not-allowed' : 'pointer', minHeight: 48,
            }}
          >
            {routing ? '…' : 'Go'}
          </button>
        </div>
        {routeErr && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{routeErr}</p>}
      </div>

      {/* Cart continue bar */}
      {cartCount > 0 && storeIdCart && (
        <button
          onClick={() => navigate('/checkout')}
          style={{
            width: '100%', background: 'rgba(212,175,55,0.12)', border: '1px solid var(--gold)',
            borderRadius: 16, padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20, cursor: 'pointer',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>Cart • {cartCount} items</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Continue to checkout</div>
          </div>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--gold)' }}>{formatRupees(cartTotal)} →</span>
        </button>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <QuickAction icon="🧺" title="New Order" sub="Browse services" onClick={() => navigate('/catalog')} />
        <QuickAction icon="📦" title="My Orders" sub="Track & manage" onClick={() => navigate('/orders')} />
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Orders</h2>
            <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOrders.map((o) => (
              <button
                key={o._id}
                onClick={() => navigate(`/orders/${o._id}`)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{o.orderRef}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(o.status) }}>{statusLabel(o.status)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{formatDate(o.createdAt)} · {formatRupees(o.estimatePaise - o.discountPaise)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, title, sub, onClick }: { icon: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16,
        padding: '16px 14px', textAlign: 'left', cursor: 'pointer', minHeight: 80,
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
    </button>
  );
}
