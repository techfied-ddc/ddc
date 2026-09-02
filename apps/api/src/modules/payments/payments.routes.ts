import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Role } from '@ddc/shared';
import { initiate, verify, webhook, refund } from './payments.controller.js';

// ── Webhook handler exported for pre-JSON mounting in app.ts ─────────────────
// Usage in app.ts (BEFORE express.json()):
//   app.post('/api/v1/payments/webhook/:provider', express.raw({ type: 'application/json' }), paymentWebhookHandler);
export { webhook as paymentWebhookHandler };

// ── Regular payment routes (JSON-parsed body) ─────────────────────────────────
export const paymentsRouter = Router();

// Customer initiates payment for their own order
paymentsRouter.post(
  '/initiate',
  authenticate, authorize(Role.CUSTOMER),
  initiate,
);

// Customer calls this after Razorpay Checkout JS succeeds (client-side verification)
paymentsRouter.post(
  '/verify',
  authenticate, authorize(Role.CUSTOMER),
  verify,
);

// Admin / store: issue a refund
paymentsRouter.post(
  '/refund',
  authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN, Role.STORE_OWNER),
  refund,
);
