import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, authorizeStoreActor } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { Role } from '@ddc/shared';
import {
  zCreateStoreBody, zUpdateStoreBody, zUpdateStoreStatusBody,
  zUpdateServiceAreaBody, zUpdatePickupSlotsBody,
  zUpdateSlaBody, zUpdateOperatingHoursBody, zStoreListQuery,
  zUpdateCommissionBody,
} from '@ddc/shared';
import {
  listStores, createStore, getStore, updateStore, setStoreStatus,
  updateServiceArea, updatePickupSlots, updateSla, updateOperatingHours,
  listSlots, getMyProfile, updateCommission,
} from './stores.controller.js';

export const storesRouter = Router();

// ── Admin ─────────────────────────────────────────────────────────────────────
storesRouter.get   ('/',              authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zStoreListQuery, 'query'), listStores);
storesRouter.post  ('/',              authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zCreateStoreBody), createStore);
storesRouter.get   ('/:id',           authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), getStore);
storesRouter.patch ('/:id',           authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zUpdateStoreBody), updateStore);
storesRouter.patch ('/:id/status',     authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zUpdateStoreStatusBody), setStoreStatus);
storesRouter.patch ('/:id/commission', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zUpdateCommissionBody), updateCommission);

// ── Store owner/staff (own store) ─────────────────────────────────────────────
storesRouter.get   ('/my/profile',   authenticate, authorize(Role.STORE_OWNER, Role.STORE_STAFF, Role.RIDER), getMyProfile);
storesRouter.patch ('/:id/profile',  authenticate, authorizeStoreActor((req) => req.params['id'] as string), validate(zUpdateStoreBody), updateStore);
storesRouter.put   ('/:id/service-area', authenticate, authorizeStoreActor((req) => req.params['id'] as string), validate(zUpdateServiceAreaBody), updateServiceArea);
storesRouter.put   ('/:id/slots',    authenticate, authorizeStoreActor((req) => req.params['id'] as string), validate(zUpdatePickupSlotsBody), updatePickupSlots);
storesRouter.put   ('/:id/sla',      authenticate, authorizeStoreActor((req) => req.params['id'] as string), validate(zUpdateSlaBody), updateSla);
storesRouter.put   ('/:id/hours',    authenticate, authorizeStoreActor((req) => req.params['id'] as string), validate(zUpdateOperatingHoursBody), updateOperatingHours);

// ── Public: list pickup slots for a store ─────────────────────────────────────
storesRouter.get   ('/:id/slots',    listSlots);
