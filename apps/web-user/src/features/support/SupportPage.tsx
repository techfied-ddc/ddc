import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Reveal } from '@ddc/ui';
import { useMyTickets, useCreateTicket } from '../../lib/api.hooks.js';

const STATUS_COLOR: Record<string, string> = {
  OPEN:             '#D4AF37',
  PENDING_CUSTOMER: '#F59E0B',
  PENDING_ADMIN:    '#60A5FA',
  RESOLVED:         '#34D399',
  CLOSED:           '#6B7280',
};

interface TicketSummary {
  _id:       string;
  ticketRef: string;
  subject:   string;
  status:    string;
  priority:  string;
  createdAt: string;
}

export default function SupportPage() {
  const navigate       = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const { data, isLoading, refetch } = useMyTickets();
  const createTicket   = useCreateTicket();

  const tickets = (data as { data: { tickets: TicketSummary[] } } | undefined)?.data?.tickets ?? [];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <Reveal>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Support</h1>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm"
          >
            + New Ticket
          </button>
        </div>
      </Reveal>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <Reveal delay={0.05}>
          <GlassCard className="p-8 text-center space-y-3">
            <div className="flex justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[var(--text-muted)] text-sm">No support tickets yet.</p>
            <p className="text-xs text-[var(--text-subtle)]">Have a question or issue? Create a ticket and we&apos;ll help you.</p>
          </GlassCard>
        </Reveal>
      ) : (
        <div className="space-y-3">
          {tickets.map((t, i) => (
            <Reveal key={t._id} delay={i * 0.04}>
              <button
                onClick={() => navigate(`/support/${t._id}`)}
                className="w-full text-left"
              >
                <GlassCard className="p-4 hover:border-[var(--gold)]/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{t.subject}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{t.ticketRef}</p>
                    </div>
                    <span
                      className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border"
                      style={{ color: STATUS_COLOR[t.status] ?? '#888', borderColor: `${STATUS_COLOR[t.status] ?? '#888'}40`, background: `${STATUS_COLOR[t.status] ?? '#888'}12` }}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </GlassCard>
              </button>
            </Reveal>
          ))}
        </div>
      )}

      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreate={(body) => createTicket.mutate(body, {
            onSuccess: () => { setShowNew(false); void refetch(); },
          })}
          isPending={createTicket.isPending}
        />
      )}
    </div>
  );
}

function NewTicketModal({
  onClose, onCreate, isPending,
}: {
  onClose:   () => void;
  onCreate:  (body: { subject: string; message: string }) => void;
  isPending: boolean;
}) {
  const [subject, setSubject]   = useState('');
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');

  const submit = () => {
    if (subject.trim().length < 5) { setError('Subject must be at least 5 characters.'); return; }
    if (message.trim().length < 10) { setError('Message must be at least 10 characters.'); return; }
    onCreate({ subject: subject.trim(), message: message.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <Reveal className="w-full max-w-lg">
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-[var(--text-primary)]">New Support Ticket</h2>
            <button onClick={onClose} className="text-[var(--text-muted)] text-xl px-1">×</button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--gold)]/60"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1">Message</label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the problem in detail…"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--gold)]/60 resize-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)] text-sm">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
            >
              {isPending ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </GlassCard>
      </Reveal>
    </div>
  );
}
