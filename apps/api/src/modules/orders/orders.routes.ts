import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { Role } from '@ddc/shared';
import {
  zPlaceOrderBody, zRejectOrderBody, zAssignRiderBody,
  zVerifyPickupOtpBody, zVerifyDeliveryOtpBody,
  zReceiveAtStoreBody, zCancelOrderBody, zRateOrderBody,
  zAdminAssignOrderBody, zOrderListQuery,
} from '@ddc/shared';
import {
  place, listMine, getMine,
  listForStore, getForStore,
  listAll, getOne,
  adminAssign,
  accept, reject,
  assignPickup, verifyPickup, acceptPickup,
  receiveAtStore, markProcessing, markReady,
  assignDelivery, verifyDelivery, acceptDelivery, collectCod,
  getRiderJobs,
  rateOrder, cancelOrder,
} from './orders.controller.js';

export const ordersRouter = Router();

// ── Customer ──────────────────────────────────────────────────────────────────
ordersRouter.post  ('/',             authenticate, authorize(Role.CUSTOMER), validate(zPlaceOrderBody), place);
ordersRouter.get   ('/mine',         authenticate, authorize(Role.CUSTOMER), validate(zOrderListQuery, 'query'), listMine);
ordersRouter.get   ('/mine/:id',     authenticate, authorize(Role.CUSTOMER), getMine);
ordersRouter.post  ('/mine/:id/rate',authenticate, authorize(Role.CUSTOMER), validate(zRateOrderBody), rateOrder);
ordersRouter.post  ('/mine/:id/cancel', authenticate, authorize(Role.CUSTOMER), validate(zCancelOrderBody), cancelOrder);

// ── Store / staff (shared by STORE_OWNER + STORE_STAFF) ───────────────────────
const storeRoles = [Role.STORE_OWNER, Role.STORE_STAFF] as const;
ordersRouter.get  ('/store',             authenticate, authorize(...storeRoles), validate(zOrderListQuery, 'query'), listForStore);
ordersRouter.get  ('/store/:id',         authenticate, authorize(...storeRoles), getForStore);
ordersRouter.post ('/store/:id/accept',  authenticate, authorize(...storeRoles), accept);
ordersRouter.post ('/store/:id/reject',  authenticate, authorize(...storeRoles), validate(zRejectOrderBody), reject);
ordersRouter.post ('/store/:id/assign-pickup',   authenticate, authorize(...storeRoles), validate(zAssignRiderBody), assignPickup);
ordersRouter.post ('/store/:id/receive',         authenticate, authorize(...storeRoles), validate(zReceiveAtStoreBody), receiveAtStore);
ordersRouter.post ('/store/:id/processing',      authenticate, authorize(...storeRoles), markProcessing);
ordersRouter.post ('/store/:id/ready',           authenticate, authorize(...storeRoles), markReady);
ordersRouter.post ('/store/:id/assign-delivery', authenticate, authorize(...storeRoles), validate(zAssignRiderBody), assignDelivery);
ordersRouter.post ('/store/:id/cancel',          authenticate, authorize(...storeRoles), validate(zCancelOrderBody), cancelOrder);

// ── Rider ─────────────────────────────────────────────────────────────────────
ordersRouter.get  ('/rider/jobs',                authenticate, authorize(Role.RIDER), getRiderJobs);
ordersRouter.post ('/rider/:id/accept-pickup',   authenticate, authorize(Role.RIDER), acceptPickup);
ordersRouter.post ('/rider/:id/verify-pickup',   authenticate, authorize(Role.RIDER), validate(zVerifyPickupOtpBody), verifyPickup);
ordersRouter.post ('/rider/:id/accept-delivery', authenticate, authorize(Role.RIDER), acceptDelivery);
ordersRouter.post ('/rider/:id/collect-cod',     authenticate, authorize(Role.RIDER), collectCod);
ordersRouter.post ('/rider/:id/verify-delivery', authenticate, authorize(Role.RIDER), validate(zVerifyDeliveryOtpBody), verifyDelivery);

// ── Admin ─────────────────────────────────────────────────────────────────────
ordersRouter.get  ('/admin',         authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zOrderListQuery, 'query'), listAll);
ordersRouter.get  ('/admin/:id',     authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), getOne);
ordersRouter.post ('/admin/:id/assign', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zAdminAssignOrderBody), adminAssign);
ordersRouter.post ('/admin/:id/cancel', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zCancelOrderBody), cancelOrder);
