import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard, Reveal } from '@ddc/ui';
import { useTicketDetail, useReplyTicket } from '../../lib/api.hooks.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { formatDateTime } from '../../lib/format.js';

const STATUS_COLOR: Record<string, string> = {
  OPEN:             '#D4AF37',
  PENDING_CUSTOMER: '#F59E0B',
  PENDING_ADMIN:    '#60A5FA',
  RESOLVED:         '#34D399',
  CLOSED:           '#6B7280',
};

interface TicketMessage {
  authorId:   string;
  authorRole: string;
  message:    string;
  attachments: string[];
  createdAt:  string;
}

interface TicketDetail {
  _id:       string;
  ticketRef: string;
  subject:   string;
  status:    string;
  priority:  string;
  orderId?:  string;
  messages:  TicketMessage[];
  createdAt: string;
}

export default function TicketDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const [reply, setReply] = useState('');

  const { data, isLoading, refetch } = useTicketDetail(id!);
  const replyMutation = useReplyTicket(id!);

  const ticket = (data as { data: { ticket: TicketDetail } } | undefined)?.data?.ticket;

  const isClosed = ticket?.status === 'CLOSED' || ticket?.status === 'RESOLVED';

  const handleReply = () => {
    if (!reply.trim() || reply.trim().length < 1) return;
    replyMutation.mutate({ message: reply.trim() }, {
      onSuccess: () => { setReply(''); void refetch(); },
    });
  };

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-void)]">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <Reveal>
        <button onClick={() => navigate('/support')} className="text-sm text-[var(--gold)]">
          ← Support
        </button>
      </Reveal>

      <Reveal delay={0.04}>
        <GlassCard className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-lg text-[var(--text-primary)]">{ticket.subject}</p>
              <p className="text-xs text-[var(--text-muted)] font-mono">{ticket.ticketRef}</p>
            </div>
            <span
              className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border"
              style={{ color: STATUS_COLOR[ticket.status] ?? '#888', borderColor: `${STATUS_COLOR[ticket.status] ?? '#888'}40`, background: `${STATUS_COLOR[ticket.status] ?? '#888'}12` }}
            >
              {ticket.status.replace(/_/g, ' ')}
            </span>
          </div>
        </GlassCard>
      </Reveal>

      {/* Messages */}
      <div className="space-y-3">
        {ticket.messages.map((msg, i) => {
          const isMe = msg.authorId === user?.id;
          return (
            <Reveal key={i} delay={i * 0.03}>
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <p className="text-xs text-[var(--text-muted)]">
                    {isMe ? 'You' : 'Support'} · {formatDateTime(msg.createdAt)}
                  </p>
                  <div className={`px-4 py-3 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-[var(--gold)]/15 text-[var(--text-primary)] rounded-tr-md'
                      : 'bg-white/5 text-[var(--text-secondary)] rounded-tl-md'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Reply box */}
      {!isClosed && (
        <Reveal delay={0.08}>
          <GlassCard className="p-4 space-y-3">
            <textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply…"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--gold)]/60 resize-none"
            />
            <button
              onClick={handleReply}
              disabled={replyMutation.isPending || !reply.trim()}
              className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-sm disabled:opacity-50"
            >
              {replyMutation.isPending ? 'Sending…' : 'Send Reply'}
            </button>
          </GlassCard>
        </Reveal>
      )}

      {isClosed && (
        <p className="text-center text-xs text-[var(--text-muted)] py-4">
          This ticket is {ticket.status.toLowerCase()}. Create a new ticket if you need further help.
        </p>
      )}
    </div>
  );
}
