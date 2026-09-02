import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { Role } from '@ddc/shared';
import { zCreateTicketBody, zReplyTicketBody, zUpdateTicketBody, zTicketListQuery } from '@ddc/shared';
import { create, reply, update, getOne, list } from './tickets.controller.js';

export const ticketsRouter = Router();

ticketsRouter.use(authenticate);

// List (customer sees own, admin sees all)
ticketsRouter.get ('/',           validate(zTicketListQuery, 'query'), list);

// Customer: create ticket
ticketsRouter.post('/',           validate(zCreateTicketBody), create);

// All authenticated: get one (service enforces ownership)
ticketsRouter.get ('/:id',        getOne);

// All authenticated: reply (customer or admin)
ticketsRouter.post('/:id/reply',  validate(zReplyTicketBody), reply);

// Admin: update status / priority / assignment
ticketsRouter.patch('/:id',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  validate(zUpdateTicketBody),
  update,
);
