import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/auth.store.js';
import { useCartStore } from '../../stores/cart.store.js';
import { useMyOrders, useProfile } from '../../lib/api.hooks.js';
import { formatRupees, statusLabel, statusColor, formatDate } from '../../lib/format.js';
import { api } from '../../lib/api.js';

// ── SVG icon components ───────────────────────────────────────────────────────

function OrderIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="var(--gold)" strokeWidth="1.5" />
      <path d="M7 8h10M7 12h6M7 16h8" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.5 2h11A1.5 1.5 0 0 1 19 3.5v17l-7-3-7 3V3.5A1.5 1.5 0 0 1 6.5 2Z" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 8h6M9 11.5h4" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────

function QuickAction({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      animate={{ scale: pressed ? 0.97 : 1 }}
      transition={{ duration: 0.1 }}
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 18,
        padding: '18px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        minHeight: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'rgba(212,175,55,0.1)',
        border: '1px solid rgba(212,175,55,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
    </motion.button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate    = useNavigate();
  const user        = useAuthStore((s) => s.user);
  const cartCount   = useCartStore((s) => s.itemCount());
  const cartTotal   = useCartStore((s) => s.totalPaise());
  const storeIdCart = useCartStore((s) => s.storeId);

  const [pincode, setPincode]   = useState('');
  const [routing, setRouting]   = useState(false);
  const [routeErr, setRouteErr] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: ordersData } = useMyOrders({ page: 1 });
  const { data: profile }    = useProfile();

  const recentOrders  = ordersData?.orders.slice(0, 3) ?? [];
  const greeting      = getGreeting();
  const firstName     = profile?.name?.split(' ')[0] ?? null;

  const handleRoute = async (overridePincode?: string) => {
    const pin = overridePincode ?? pincode;
    if (pin.length !== 6) { setRouteErr('Enter a valid 6-digit pincode.'); return; }
    setRouteErr(null);
    setRouting(true);
    try {
      const res = await api.post('/api/v1/geo/route', { pincode: pin }) as { data: { routed: boolean; storeId: string } };
      if (!res.data.routed) { setRouteErr("No store serves your area yet. We're expanding soon!"); }
      else { navigate(`/catalog?storeId=${res.data.storeId}`); }
    } catch {
      setRouteErr('Could not detect store. Please try again.');
    } finally {
      setRouting(false);
    }
  };

  const handleAutoLocate = () => {
    if (!navigator.geolocation) { setRouteErr('Geolocation is not supported by your browser.'); return; }
    setLocating(true);
    setRouteErr(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // Reverse geocode using Google Maps Geocoding API
          const { lat, lng } = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const gmKey = import.meta.env['VITE_GMAPS_KEY'];
          if (!gmKey) {
            setRouteErr('Location detection requires Maps API key. Please enter pincode manually.');
            return;
          }
          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=postal_code&key=${gmKey}`;
          const gRes = await fetch(url);
          const gData = await gRes.json() as { results?: { address_components?: { types: string[]; long_name: string }[] }[] };
          const postalComp = gData.results?.[0]?.address_components?.find((c) => c.types.includes('postal_code'));
          if (!postalComp) { setRouteErr("Couldn't determine your pincode. Please enter it manually."); return; }
          const detected = postalComp.long_name;
          setPincode(detected);
          await handleRoute(detected);
        } catch {
          setRouteErr('Location lookup failed. Please enter pincode manually.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setRouteErr('Location permission denied. Please enter pincode manually.');
      },
      { timeout: 10000 },
    );
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-void)', padding: '20px 16px', paddingBottom: 88 }}>

      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 24 }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--gold)', marginBottom: 4, letterSpacing: '0.04em' }}>
          {greeting}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.2 }}>
          {firstName ? `Welcome back, ${firstName}` : 'Premium dry cleaning'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Fresh clothes, at your door.</p>
      </motion.div>

      {/* ── Cart continue bar ── */}
      {cartCount > 0 && storeIdCart && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/checkout')}
          style={{
            width: '100%',
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid var(--gold)',
            borderRadius: 16,
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--gold)' }}><CartIcon /></span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Continue to checkout</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>{formatRupees(cartTotal)}</span>
            <span style={{ color: 'var(--gold)' }}><ChevronRightIcon /></span>
          </div>
        </motion.button>
      )}

      {/* ── Pincode locator ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 20,
          padding: '18px 18px 16px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--gold)', opacity: 0.8 }}><LocationIcon /></span>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Enter your pincode
            </p>
          </div>
          <button
            onClick={handleAutoLocate}
            disabled={locating || routing}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              opacity: locating ? 0.5 : 1,
              padding: '4px 0',
              minHeight: 36,
            }}
          >
            <LocationIcon />
            {locating ? 'Locating…' : 'Use my location'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 18,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              outline: 'none',
              minWidth: 0,
            }}
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            placeholder="110001"
            onKeyDown={(e) => e.key === 'Enter' && void handleRoute()}
          />
          <button
            onClick={() => void handleRoute()}
            disabled={routing}
            style={{
              flexShrink: 0,
              background: 'var(--gold)',
              color: '#0B0B0C',
              border: 'none',
              borderRadius: 12,
              padding: '0 20px',
              fontWeight: 700,
              fontSize: 15,
              cursor: routing ? 'not-allowed' : 'pointer',
              minHeight: 48,
              opacity: routing ? 0.7 : 1,
            }}
          >
            {routing ? '…' : 'Go'}
          </button>
        </div>
        {routeErr && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{routeErr}</p>}
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
        style={{ marginBottom: 28 }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          Quick Access
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <QuickAction
            icon={<CatalogIcon />}
            title="New Order"
            sub="Browse & book services"
            onClick={() => navigate('/catalog')}
          />
          <QuickAction
            icon={<OrderIcon />}
            title="My Orders"
            sub="Track &amp; manage"
            onClick={() => navigate('/orders')}
          />
        </div>
      </motion.div>

      {/* ── Recent orders ── */}
      {recentOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Orders</h2>
            <button
              onClick={() => navigate('/orders')}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, minHeight: 36, padding: '0 4px' }}
            >
              View all <ChevronRightIcon />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOrders.map((o, i) => (
              <motion.button
                key={o._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 + i * 0.05 }}
                onClick={() => navigate(`/orders/${o._id}`)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{o.orderRef}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(o.status) }}>{statusLabel(o.status)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(o.createdAt)}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{formatRupees(o.estimatePaise - o.discountPaise)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Time-based greeting ───────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
