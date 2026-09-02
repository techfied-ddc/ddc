import React, { useState } from 'react';
import { useStorePayouts } from '../../lib/api.hooks.js';
import { formatRupees, formatDate } from '../../lib/format.js';

function payoutStatusColor(status: string): string {
  const map: Record<string, string> = {
    PAID: '#22C55E', APPROVED: '#3B82F6', PROCESSING: '#A78BFA',
    DRAFT: '#F59E0B', FAILED: '#EF4444',
  };
  return map[status] ?? '#6B7280';
}

const STATUS_TABS = ['ALL', 'DRAFT', 'APPROVED', 'PAID'] as const;
type StatusTab = typeof STATUS_TABS[number];

export default function StorePayoutsPage() {
  const [tab,  setTab]  = useState<StatusTab>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useStorePayouts({ status: tab === 'ALL' ? undefined : tab, page });
  const payouts = data?.payouts ?? [];

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-void)', paddingBottom: 40 }}>
      <div style={{ padding: '20px 16px 12px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          Payouts
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Settlement statements issued by admin
        </p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', flexWrap: 'wrap' }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: '1px solid',
              borderColor: tab === t ? 'var(--gold)' : 'var(--glass-border)',
              background:  tab === t ? 'var(--gold)' : 'transparent',
              color:       tab === t ? '#0B0B0C' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{ width: 28, height: 28, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : payouts.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No payout statements found.</p>
          </div>
        ) : (
          payouts.map((payout) => (
            <div key={payout._id} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                    {formatDate(payout.periodFrom)} – {formatDate(payout.periodTo)}
                  </p>
                  <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {payout.lines?.length ?? 0} orders
                  </p>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: payoutStatusColor(payout.status), border: `1px solid ${payoutStatusColor(payout.status)}40`, background: `${payoutStatusColor(payout.status)}18` }}>
                  {payout.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Stat label="Invoiced Total"  value={formatRupees(payout.totalInvoicedPaise)}   />
                <Stat label="Commission"      value={formatRupees(payout.totalCommissionPaise)} color="var(--gold)" />
                <Stat label="Your Share"      value={formatRupees(payout.netPayoutPaise)}        color="#22C55E" />
                <Stat label="COD Receivable"  value={formatRupees(payout.codReceivablePaise)}   color="#F59E0B" />
              </div>

              {payout.paidAt && (
                <p style={{ fontSize: 11, color: '#22C55E', marginTop: 10 }}>
                  Paid on {formatDate(payout.paidAt)} {payout.payoutRef ? `· Ref: ${payout.payoutRef}` : ''}
                </p>
              )}
            </div>
          ))
        )}

        {data && data.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--glass-border)', color: 'var(--text-muted)', background: 'transparent', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--glass-border)', color: 'var(--text-muted)', background: 'transparent', cursor: page >= data.pages ? 'not-allowed' : 'pointer', opacity: page >= data.pages ? 0.4 : 1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: color ?? 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
