import mongoose from 'mongoose';
import { Ticket } from './ticket.model.js';
import { AppError } from '../../lib/errors.js';
import { TicketStatus, DEFAULT_PAGE_SIZE } from '@ddc/shared';
import type { CreateTicketBody, ReplyTicketBody, UpdateTicketBody, TicketListQuery } from '@ddc/shared';

const TICKET_PREFIX = 'TKT-';

async function genTicketRef(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const n   = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    const ref = `${TICKET_PREFIX}${n}`;
    if (!(await Ticket.exists({ ticketRef: ref }))) return ref;
  }
  throw new Error('Failed to generate unique ticket ref.');
}

export async function createTicket(
  customerId: string,
  body:       CreateTicketBody,
  authorRole: string,
) {
  const ticketRef = await genTicketRef();
  const ticket = await Ticket.create({
    ticketRef,
    customerId: new mongoose.Types.ObjectId(customerId),
    orderId:    body.orderId  ? new mongoose.Types.ObjectId(body.orderId)  : undefined,
    subject:    body.subject,
    priority:   body.priority ?? 'NORMAL',
    status:     TicketStatus.OPEN,
    messages: [{
      authorId:    new mongoose.Types.ObjectId(customerId),
      authorRole,
      message:     body.message,
      attachments: body.attachments ?? [],
      createdAt:   new Date(),
    }],
  });
  return ticket;
}

export async function replyTicket(
  ticketId:  string,
  authorId:  string,
  authorRole: string,
  body:       ReplyTicketBody,
) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw AppError.notFound('Ticket', ticketId);
  if (ticket.status === TicketStatus.CLOSED) {
    throw new AppError(409, 'TICKET_CLOSED', 'Cannot reply to a closed ticket.');
  }

  ticket.messages.push({
    authorId:    new mongoose.Types.ObjectId(authorId),
    authorRole,
    message:     body.message,
    attachments: body.attachments ?? [],
    createdAt:   new Date(),
  });

  // Update status based on who replied
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(authorRole);
  if (isAdmin && ticket.status === TicketStatus.OPEN) {
    ticket.status = TicketStatus.PENDING_CUSTOMER;
  } else if (!isAdmin && ticket.status === TicketStatus.PENDING_CUSTOMER) {
    ticket.status = TicketStatus.PENDING_ADMIN;
  }

  await ticket.save();
  return ticket;
}

export async function updateTicket(
  ticketId:  string,
  body:       UpdateTicketBody,
) {
  const update: Record<string, unknown> = {};
  if (body.status)     update['status']     = body.status;
  if (body.priority)   update['priority']   = body.priority;
  if (body.assignedTo) update['assignedTo'] = new mongoose.Types.ObjectId(body.assignedTo);

  if (body.status === TicketStatus.RESOLVED) update['resolvedAt'] = new Date();
  if (body.status === TicketStatus.CLOSED)   update['closedAt']   = new Date();

  const ticket = await Ticket.findByIdAndUpdate(ticketId, { $set: update }, { new: true });
  if (!ticket) throw AppError.notFound('Ticket', ticketId);
  return ticket;
}

export async function getTicket(ticketId: string, requesterId?: string, requesterRole?: string) {
  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) throw AppError.notFound('Ticket', ticketId);

  const isAdmin = requesterRole && ['ADMIN', 'SUPER_ADMIN'].includes(requesterRole);
  const isOwner = requesterId && ticket.customerId.toString() === requesterId;
  if (!isAdmin && !isOwner) throw new AppError(403, 'FORBIDDEN', 'Access denied.');

  return ticket;
}

export async function listTickets(
  query:        TicketListQuery,
  requesterId?: string,
  requesterRole?: string,
) {
  const isAdmin = requesterRole && ['ADMIN', 'SUPER_ADMIN'].includes(requesterRole);
  const { status, priority, search, page = 1, limit = DEFAULT_PAGE_SIZE } = query;
  const p = Math.max(1, Number(page));
  const l = Math.min(50, Math.max(1, Number(limit)));

  const filter: Record<string, unknown> = {};
  if (!isAdmin && requesterId) filter['customerId'] = new mongoose.Types.ObjectId(requesterId);
  if (status)   filter['status']   = status;
  if (priority) filter['priority'] = priority;
  if (search)   filter['subject']  = { $regex: search, $options: 'i' };

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .select('-messages')  // omit messages in list for performance
      .sort({ priority: -1, createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  return { tickets, total, page: p, limit: l, pages: Math.ceil(total / l) };
}
