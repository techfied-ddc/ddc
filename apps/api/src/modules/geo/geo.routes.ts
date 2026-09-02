import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@ddc/shared';
import { previewRoute } from './geo.controller.js';

export const geoRouter = Router();

// Authenticated users: customers route their own orders; admins/store preview routing
geoRouter.post(
  '/route',
  authenticate,
  authorize(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN, Role.STORE_OWNER, Role.STORE_STAFF),
  previewRoute,
);
