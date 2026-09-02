import React, { useState } from 'react';
import { GlassCard, Reveal } from '@ddc/ui';
import {
  useAdminTickets, useAdminTicket, useAdminReplyTicket, useAdminUpdateTicket,
  type AdminTicketSummary,
} from '../../lib/api.hooks.js';
import { formatDateTime, statusColor } from '../../lib/format.js';

type StatusFilter = 'ALL' | 'OPEN' | 'PENDING_CUSTOMER' | 'PENDING_ADMIN' | 'RESOLVED' | 'CLOSED';
const STATUS_TABS: StatusFilter[] = ['ALL', 'OPEN', 'PENDING_ADMIN', 'PENDING_CUSTOMER', 'RESOLVED', 'CLOSED'];

const PRIORITY_BADGE: Record<string, string> = {
  LOW:    '#6B7280',
  NORMAL: '#60A5FA',
  HIGH:   '#F59E0B',
  URGENT: '#EF4444',
};

export default function TicketsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<AdminTicketSummary | null>(null);

  const { data, isLoading } = useAdminTickets({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
  });
  const tickets = data?.tickets ?? [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <Reveal>
        <h1 className="font-display text-2xl text-[var(--text-primary)]">Support Tickets</h1>
      </Reveal>

      {/* Status tabs */}
      <Reveal delay={0.04}>
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-[var(--gold)] text-[#0B0B0C] border-[var(--gold)]'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--glass-border)] hover:border-[var(--gold)]/50'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket list */}
        <Reveal delay={0.06} className="lg:col-span-2">
          <GlassCard className="overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-center text-[var(--text-muted)] text-sm py-12">No tickets found.</p>
            ) : (
              <div>
                {tickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    onClick={() => setSelected(ticket)}
                    className={`w-full text-left px-4 py-3 border-b border-[var(--glass-border)]/50 hover:bg-white/5 transition-colors ${selected?._id === ticket._id ? 'bg-[var(--gold)]/5 border-l-2 border-l-[var(--gold)]' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ticket.subject}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{ticket.ticketRef}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold border"
                          style={{ color: statusColor(ticket.status), borderColor: `${statusColor(ticket.status)}40`, background: `${statusColor(ticket.status)}12` }}
                        >
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{ color: PRIORITY_BADGE[ticket.priority], background: `${PRIORITY_BADGE[ticket.priority]}15` }}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-subtle)] mt-1">{formatDateTime(ticket.createdAt)}</p>
                  </button>
                ))}
                {data && data.pages > 1 && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-[var(--text-muted)]">Page {page}/{data.pages} · {data.total} tickets</span>
                    <div className="flex gap-2">
                      <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-muted)] disabled:opacity-40">←</button>
                      <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg text-xs border border-[var(--glass-border)] text-[var(--text-muted)] disabled:opacity-40">→</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </Reveal>

        {/* Ticket detail panel */}
        <Reveal delay={0.08}>
          {selected ? (
            <TicketDetailPanel id={selected._id} onClose={() => setSelected(null)} />
          ) : (
            <GlassCard className="p-6 text-center text-[var(--text-muted)] text-sm">
              Select a ticket to view details.
            </GlassCard>
          )}
        </Reveal>
      </div>
    </div>
  );
}

function TicketDetailPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const [reply, setReply] = useState('');
  const { data } = useAdminTicket(id);
  const replyMutation  = useAdminReplyTicket(id);
  const updateMutation = useAdminUpdateTicket(id);

  const ticket = data?.ticket;

  if (!ticket) {
    return (
      <GlassCard className="p-6 flex justify-center">
        <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </GlassCard>
    );
  }

  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  return (
    <GlassCard className="p-5 space-y-4 max-h-[80vh] flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-2 shrink-0">
        <div>
          <p className="font-display text-base text-[var(--text-primary)]">{ticket.subject}</p>
          <p className="text-xs text-[var(--text-muted)] font-mono">{ticket.ticketRef}</p>
        </div>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl px-1 shrink-0">×</button>
      </div>

      {/* Status + priority controls */}
      <div className="flex gap-2 shrink-0">
        <select
          value={ticket.status}
          onChange={(e) => updateMutation.mutate({ status: e.target.value })}
          className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-xs focus:outline-none"
        >
          {['OPEN', 'PENDING_CUSTOMER', 'PENDING_ADMIN', 'RESOLVED', 'CLOSED'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={ticket.priority}
          onChange={(e) => updateMutation.mutate({ priority: e.target.value })}
          className="px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-xs focus:outline-none"
        >
          {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {ticket.messages.map((msg, i) => {
          const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(msg.authorRole);
          return (
            <div key={i} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
              <p className="text-xs text-[var(--text-muted)] mb-1">
                {isAdmin ? 'Support' : 'Customer'} · {formatDateTime(msg.createdAt)}
              </p>
              <div className={`px-3 py-2 rounded-xl text-xs max-w-[90%] ${
                isAdmin ? 'bg-[var(--gold)]/12 text-[var(--text-primary)]' : 'bg-white/5 text-[var(--text-secondary)]'
              }`}>
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply */}
      {!isClosed && (
        <div className="space-y-2 shrink-0 border-t border-[var(--glass-border)] pt-3">
          <textarea
            rows={2}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Admin reply…"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--gold)]/60 resize-none"
          />
          <button
            onClick={() => {
              if (!reply.trim()) return;
              replyMutation.mutate(reply.trim(), { onSuccess: () => setReply('') });
            }}
            disabled={replyMutation.isPending || !reply.trim()}
            className="w-full py-2 rounded-xl bg-[var(--gold)] text-[#0B0B0C] text-xs font-semibold disabled:opacity-50"
          >
            {replyMutation.isPending ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      )}
    </GlassCard>
  );
}
