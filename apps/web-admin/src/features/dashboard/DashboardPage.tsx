import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard, KpiTile, Reveal } from '@ddc/ui';
import { api } from '../../lib/api.js';
import { formatRupees, formatDate } from '../../lib/format.js';

interface AnalyticsSummary {
  totalOrders:            number;
  ordersThisMonth:        number;
  activeStores:           number;
  openTickets:            number;
  totalRevenuePaise:      number;
  revenueThisMonthPaise:  number;
  pendingOrders:          number;
  routingFailedOrders:    number;
  statusBreakdown:        Record<string, number>;
  revenueByDay:           Array<{ _id: string; totalPaise: number; count: number }>;
}

function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics-summary'],
    queryFn:  () => api.get('/api/v1/analytics/summary')
      .then((d) => (d as { data: AnalyticsSummary }).data),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

// Simple bar chart using SVG
function RevenueBarChart({ data }: { data: AnalyticsSummary['revenueByDay'] }) {
  if (data.length === 0) {
    return <p className="text-xs text-[var(--text-muted)] text-center py-6">No revenue data for last 7 days.</p>;
  }

  const max     = Math.max(...data.map((d) => d.totalPaise));
  const barW    = 36;
  const gap     = 12;
  const chartH  = 80;
  const totalW  = data.length * (barW + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${chartH + 32}`} className="w-full" style={{ minWidth: totalW }}>
        {data.map((d, i) => {
          const h   = max > 0 ? (d.totalPaise / max) * chartH : 0;
          const x   = i * (barW + gap);
          const y   = chartH - h;
          return (
            <g key={d._id}>
              <rect x={x} y={y} width={barW} height={h} rx="4" fill="#D4AF37" opacity={0.85} />
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                {d._id.slice(5)} {/* MM-DD */}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="8" fill="#D4AF37">
                {d.totalPaise > 0 ? `₹${(d.totalPaise / 100).toFixed(0)}` : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Order status breakdown donut (simple list)
function StatusBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-2">
      {entries.map(([status, count]) => (
        <div key={status} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-[var(--text-secondary)]">{status.replace(/_/g, ' ')}</span>
              <span className="text-[var(--text-muted)] font-mono">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--gold)]"
                style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%', opacity: 0.7 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useAnalyticsSummary();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Reveal>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Overview</h1>
          <p className="text-xs text-[var(--text-muted)]">{formatDate(new Date().toISOString())}</p>
        </div>
      </Reveal>

      {/* KPIs */}
      <Reveal delay={0.04}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiTile
            label="Total orders"
            value={isLoading ? '…' : String(data?.totalOrders ?? '—')}
            sub={data ? `+${data.ordersThisMonth} this month` : undefined}
          />
          <KpiTile
            label="Active stores"
            value={isLoading ? '…' : String(data?.activeStores ?? '—')}
          />
          <KpiTile
            label="Revenue (total)"
            value={isLoading ? '…' : data ? formatRupees(data.totalRevenuePaise) : '—'}
            sub={data ? `${formatRupees(data.revenueThisMonthPaise)} this month` : undefined}
          />
          <KpiTile
            label="Open tickets"
            value={isLoading ? '…' : String(data?.openTickets ?? '—')}
            sub={data && data.openTickets > 0 ? '⚠ needs attention' : undefined}
          />
        </div>
      </Reveal>

      {/* Alerts */}
      {data && (data.pendingOrders > 0 || data.routingFailedOrders > 0) && (
        <Reveal delay={0.06}>
          <div className="flex gap-3 flex-wrap">
            {data.pendingOrders > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/8 text-sm text-[#F59E0B]">
                <span>⚡</span>
                <span>{data.pendingOrders} order{data.pendingOrders !== 1 ? 's' : ''} awaiting routing</span>
              </div>
            )}
            {data.routingFailedOrders > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/8 text-sm text-[#EF4444]">
                <span>⚠️</span>
                <span>{data.routingFailedOrders} routing failure{data.routingFailedOrders !== 1 ? 's' : ''} need manual assignment</span>
              </div>
            )}
          </div>
        </Reveal>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue bar chart */}
        <Reveal delay={0.08}>
          <GlassCard className="p-5 space-y-4">
            <h2 className="font-semibold text-sm text-[var(--text-primary)]">Revenue — Last 7 Days</h2>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <RevenueBarChart data={data?.revenueByDay ?? []} />
            )}
          </GlassCard>
        </Reveal>

        {/* Order status breakdown */}
        <Reveal delay={0.10}>
          <GlassCard className="p-5 space-y-4">
            <h2 className="font-semibold text-sm text-[var(--text-primary)]">Order Status Breakdown</h2>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <StatusBreakdown breakdown={data?.statusBreakdown ?? {}} />
            )}
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}
