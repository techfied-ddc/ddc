import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalog, type CatalogService, type CatalogCategory } from '../../lib/api.hooks.js';
import { useCartStore } from '../../stores/cart.store.js';
import { formatRupees } from '../../lib/format.js';

// This page shows the full catalog for a given store.
// Route: /catalog?storeId=<id>  (storeId is resolved by HomePage after pincode routing)

const UNIT_LABEL: Record<string, string> = {
  PER_PIECE: 'per piece',
  PER_KG:    'per kg',
  PER_PAIR:  'per pair',
  PER_SET:   'per set',
};

function ServiceCard({ svc, category, storeId }: { svc: CatalogService; category: CatalogCategory; storeId: string }) {
  const [, setQty]    = useState(0);
  const addItem       = useCartStore((s) => s.addItem);
  const cartItems     = useCartStore((s) => s.items);
  const inCart        = cartItems.find((i) => i.serviceId === svc._id);

  const handleAdd = () => {
    addItem({
      serviceId:    svc._id,
      serviceName:  svc.name,
      categoryName: category.name,
      unit:         svc.unit,
      quantity:     1,
      unitPrice:    svc.effectivePrice,
    }, storeId);
    setQty(1);
  };

  const handleIncrement = () => {
    const newQty = (inCart?.quantity ?? 0) + 1;
    useCartStore.getState().updateQty(svc._id, newQty);
    setQty(newQty);
  };

  const handleDecrement = () => {
    const newQty = (inCart?.quantity ?? 1) - 1;
    useCartStore.getState().updateQty(svc._id, newQty);
    setQty(Math.max(0, newQty));
  };

  const cartQty = inCart?.quantity ?? 0;

  return (
    <div style={{
      background:   'var(--glass-bg)',
      border:       '1px solid var(--glass-border)',
      borderRadius: 16,
      padding:      '16px',
      display:      'flex',
      alignItems:   'center',
      gap:          12,
    }}>
      {svc.imageUrl && (
        <img src={svc.imageUrl} alt={svc.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {svc.name}
        </div>
        {svc.description && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.description}</div>
        )}
        <div style={{ fontSize: 13, color: 'var(--gold)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
          {formatRupees(svc.effectivePrice)} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{UNIT_LABEL[svc.unit] ?? svc.unit}</span>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        {cartQty === 0 ? (
          <button onClick={handleAdd} style={{
            background: 'var(--gold)', color: '#0B0B0C', border: 'none',
            borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', minHeight: 44,
          }}>
            Add
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleDecrement} style={qtyBtnStyle}>−</button>
            <span style={{ minWidth: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{cartQty}</span>
            <button onClick={handleIncrement} style={qtyBtnStyle}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

const qtyBtnStyle: React.CSSProperties = {
  background: 'var(--glass-bg)', border: '1px solid var(--gold)', color: 'var(--gold)',
  borderRadius: 8, width: 36, height: 36, fontSize: 18, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function CatalogPage() {
  const navigate  = useNavigate();
  const storeId   = new URLSearchParams(location.search).get('storeId') ?? '';
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: catalog, isLoading, isError } = useCatalog(storeId || undefined);
  const cartCount = useCartStore((s) => s.itemCount());
  const cartTotal = useCartStore((s) => s.totalPaise());

  if (isLoading) return <Loader />;
  if (isError || !catalog) return <ErrorState />;

  const displayed  = catalog.filter((c) => c.services.length > 0);
  const activecat  = displayed.find((c) => c._id === activeCategory) ?? displayed[0];

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-void)' }}>
      {/* Category tab strip */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: 8, padding: '12px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-void)', borderBottom: '1px solid var(--glass-border)',
        scrollbarWidth: 'none',
      }}>
        {displayed.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setActiveCategory(cat._id)}
            style={{
              flexShrink:   0,
              padding:      '8px 16px',
              borderRadius: 999,
              border:       '1px solid ' + (activecat?._id === cat._id ? 'var(--gold)' : 'var(--glass-border)'),
              background:   activecat?._id === cat._id ? 'rgba(212,175,55,0.15)' : 'transparent',
              color:        activecat?._id === cat._id ? 'var(--gold)' : 'var(--text-muted)',
              fontWeight:   activecat?._id === cat._id ? 700 : 400,
              fontSize:     14, cursor: 'pointer', whiteSpace: 'nowrap',
              minHeight:    44,
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Services list */}
      <div style={{ padding: '12px 16px', paddingBottom: cartCount > 0 ? 100 : 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activecat?.services.map((svc) => (
          <ServiceCard key={svc._id} svc={svc} category={activecat} storeId={storeId} />
        ))}
        {activecat?.services.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>No services in this category.</p>
        )}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 72, left: 0, right: 0, zIndex: 50,
          padding: '0 16px',
        }}>
          <button
            onClick={() => navigate('/checkout')}
            style={{
              width: '100%', background: 'var(--gold)', color: '#0B0B0C',
              border: 'none', borderRadius: 16, padding: '14px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontWeight: 700, fontSize: 16, cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(212,175,55,0.35)',
            }}
          >
            <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            <span>Checkout · {formatRupees(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
    <div style={{ width: 32, height: 32, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  </div>
);

const ErrorState = () => (
  <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-muted)' }}>
    <p>Could not load services. Please try again.</p>
  </div>
);
