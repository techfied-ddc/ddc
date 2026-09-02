import type { Request, Response, NextFunction } from 'express';
import { createTicket, replyTicket, updateTicket, getTicket, listTickets } from './tickets.service.js';
import type { CreateTicketBody, ReplyTicketBody, UpdateTicketBody, TicketListQuery } from '@ddc/shared';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await createTicket(req.user!.sub, req.body as CreateTicketBody, req.user!.role);
    res.status(201).json({ ok: true, data: { ticket } });
  } catch (err) { next(err); }
};

export const reply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await replyTicket(req.params['id'] as string, req.user!.sub, req.user!.role, req.body as ReplyTicketBody);
    res.json({ ok: true, data: { ticket } });
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await updateTicket(req.params['id'] as string, req.body as UpdateTicketBody);
    res.json({ ok: true, data: { ticket } });
  } catch (err) { next(err); }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await getTicket(req.params['id'] as string, req.user!.sub, req.user!.role);
    res.json({ ok: true, data: { ticket } });
  } catch (err) { next(err); }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listTickets(req.query as unknown as TicketListQuery, req.user!.sub, req.user!.role);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
};
