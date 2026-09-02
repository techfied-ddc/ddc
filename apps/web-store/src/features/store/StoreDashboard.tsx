import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, KpiTile, Reveal } from '@ddc/ui';
import { useStoreOrders } from '../../lib/api.hooks.js';
import { statusLabel, statusColor } from '../../lib/format.js';

export default function StoreDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useStoreOrders();
  const orders = data?.orders ?? [];

  const kpis = {
    total:   orders.length,
    routed:  orders.filter(o => o.status === 'ROUTED').length,
    atStore: orders.filter(o => ['AT_STORE','INVOICED','IN_PROCESS'].includes(o.status)).length,
    ready:   orders.filter(o => o.status === 'READY').length,
  };

  const urgent = orders
    .filter(o => ['ROUTED','AT_STORE'].includes(o.status))
    .slice(0, 5);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <Reveal>
        <div>
          <p className="text-xs font-mono tracking-widest text-[var(--gold)] uppercase mb-1">Store Platform</p>
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Dashboard</h1>
        </div>
      </Reveal>

      <Reveal delay={0.07}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="Active Orders" value={isLoading ? '…' : String(kpis.total)} />
          <KpiTile label="Need Action"   value={isLoading ? '…' : String(kpis.routed + kpis.atStore)} />
          <KpiTile label="In Process"    value={isLoading ? '…' : String(kpis.atStore)} />
          <KpiTile label="Ready"         value={isLoading ? '…' : String(kpis.ready)} />
        </div>
      </Reveal>

      <Reveal delay={0.13}>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Needs attention</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-[var(--gold)] font-medium"
            >
              View all →
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
            </div>
          ) : urgent.length === 0 ? (
            <p className="text-sm text-[var(--text-subtle)] py-3">No orders need attention right now.</p>
          ) : (
            <ul className="space-y-2">
              {urgent.map(order => (
                <li key={order._id}>
                  <button
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="w-full text-left"
                  >
                    <GlassCard className="p-3 hover:border-[var(--gold)] transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-[var(--gold)]">{order.orderRef}</span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full border"
                          style={{ color: statusColor(order.status), borderColor: statusColor(order.status) + '44' }}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {order.address.city} · {order.pickupSlot.date}
                      </p>
                    </GlassCard>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </Reveal>
    </div>
  );
}
