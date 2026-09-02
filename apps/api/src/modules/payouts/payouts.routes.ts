import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@ddc/shared';
import {
  runSettlementHandler,
  approvePayoutHandler,
  markPaidHandler,
  adjustHandler,
  listPayoutsHandler,
  getPayoutHandler,
  storePayoutsHandler,
} from './payouts.controller.js';

export const payoutsRouter = Router();

const ADMIN_ROLES = [Role.ADMIN, Role.SUPER_ADMIN] as const;
const STORE_ROLES = [Role.STORE_OWNER, Role.STORE_STAFF] as const;

// Static routes MUST come before parameterised /:id routes
payoutsRouter.post('/run',         authenticate, authorize(...ADMIN_ROLES), runSettlementHandler);
payoutsRouter.post('/adjust',      authenticate, authorize(...ADMIN_ROLES), adjustHandler);
payoutsRouter.get ('/store/mine',  authenticate, authorize(...STORE_ROLES), storePayoutsHandler);
payoutsRouter.get ('/',            authenticate, authorize(...ADMIN_ROLES), listPayoutsHandler);

// Parameterised routes
payoutsRouter.get ('/:id',           authenticate, getPayoutHandler); // store owners can view their own
payoutsRouter.post('/:id/approve',   authenticate, authorize(...ADMIN_ROLES), approvePayoutHandler);
payoutsRouter.post('/:id/mark-paid', authenticate, authorize(...ADMIN_ROLES), markPaidHandler);
