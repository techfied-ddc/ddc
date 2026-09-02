import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { Role } from '@ddc/shared';
import { zIssueInvoiceBody } from '@ddc/shared';
import { issue, getById, getForOrder, voidOne, downloadPdf } from './invoicing.controller.js';

export const invoicingRouter = Router();

const storeRoles = [Role.STORE_OWNER, Role.STORE_STAFF] as const;

// Store staff issues the invoice for an order
invoicingRouter.post(
  '/order/:orderId',
  authenticate, authorize(...storeRoles),
  validate(zIssueInvoiceBody),
  issue,
);

// Get active invoice for an order (customer, store, rider all need this)
invoicingRouter.get(
  '/order/:orderId',
  authenticate,
  authorize(Role.CUSTOMER, Role.STORE_OWNER, Role.STORE_STAFF, Role.RIDER, Role.ADMIN, Role.SUPER_ADMIN),
  getForOrder,
);

// Download invoice PDF (static route before /:id)
invoicingRouter.get(
  '/:id/pdf',
  authenticate,
  authorize(Role.CUSTOMER, Role.STORE_OWNER, Role.STORE_STAFF, Role.ADMIN, Role.SUPER_ADMIN),
  downloadPdf,
);

// Get invoice by its own ID
invoicingRouter.get(
  '/:id',
  authenticate,
  authorize(Role.CUSTOMER, Role.STORE_OWNER, Role.STORE_STAFF, Role.RIDER, Role.ADMIN, Role.SUPER_ADMIN),
  getById,
);

// Admin: void an invoice
invoicingRouter.patch(
  '/:id/void',
  authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  voidOne,
);
