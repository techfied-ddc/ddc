import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@ddc/shared';
import { listStoreRiders, addRider, toggleRiderStatus } from './riders.controller.js';

export const ridersRouter = Router();

const storeOwnerRoles = [Role.STORE_OWNER] as const;
const storeRoles      = [Role.STORE_OWNER, Role.STORE_STAFF] as const;

// List riders for the calling store
ridersRouter.get('/',      authenticate, authorize(...storeRoles),  listStoreRiders);
// Add a rider (store owner only)
ridersRouter.post('/',     authenticate, authorize(...storeOwnerRoles), addRider);
// Activate / suspend a rider
ridersRouter.patch('/:id/status', authenticate, authorize(...storeOwnerRoles), toggleRiderStatus);
