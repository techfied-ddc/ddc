import { z } from 'zod';
import { TicketStatus, TicketPriority } from '../enums.js';
import { zObjectId, zPaginationQuery } from './common.js';

export const zCreateTicketBody = z.object({
  orderId:  zObjectId.optional(),
  subject:  z.string().min(5).max(200),
  message:  z.string().min(10).max(5000),
  priority: z.nativeEnum(TicketPriority).optional(),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export const zReplyTicketBody = z.object({
  message:     z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export const zUpdateTicketBody = z.object({
  status:   z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assignedTo: zObjectId.optional(),
});

export const zTicketListQuery = zPaginationQuery.extend({
  status:   z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  search:   z.string().max(100).optional(),
});

export type CreateTicketBody = z.infer<typeof zCreateTicketBody>;
export type ReplyTicketBody  = z.infer<typeof zReplyTicketBody>;
export type UpdateTicketBody = z.infer<typeof zUpdateTicketBody>;
export type TicketListQuery  = z.infer<typeof zTicketListQuery>;
