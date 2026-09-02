import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { Role } from '@ddc/shared';
import { zUpdateProfileBody } from '@ddc/shared';
import { z } from 'zod';
import * as ctrl from './users.controller.js';

export const usersRouter = Router();

// All routes require authentication
usersRouter.use(authenticate);

// ── Own profile ────────────────────────────────────────────────────────────────
usersRouter.get('/me', ctrl.getMe);
usersRouter.patch('/me', validate(zUpdateProfileBody), ctrl.updateMe);

// ── Push subscriptions ─────────────────────────────────────────────────────────
usersRouter.post('/push-subscription',
  validate(z.object({ endpoint: z.string().url(), p256dh: z.string(), auth: z.string() })),
  ctrl.savePushSubscription,
);

// ── Admin ──────────────────────────────────────────────────────────────────────
usersRouter.get('/',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  ctrl.listUsers,
);

usersRouter.get('/:id',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  ctrl.getUserById,
);

usersRouter.patch('/:id/status',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  validate(z.object({ status: z.string() })),
  ctrl.updateUserStatus,
);
