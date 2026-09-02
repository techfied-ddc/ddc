import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@ddc/shared';
import { getSummary } from './analytics.controller.js';

export const analyticsRouter = Router();

analyticsRouter.get('/summary',
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  getSummary,
);
