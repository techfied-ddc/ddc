import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, authorizeStoreActor } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { Role } from '@ddc/shared';
import {
  zCreateCategoryBody, zUpdateCategoryBody,
  zCreateServiceBody, zUpdateServiceBody,
  zStorePriceOverrideBody, zCatalogQuery,
} from '@ddc/shared';
import {
  listCategories, createCategory, updateCategory, deleteCategory,
  listServices, createService, updateService, deleteService,
  getPublicCatalog,
  upsertPriceOverrides, getStoreOverrides,
} from './catalog.controller.js';

export const catalogRouter = Router();

// ── Public ────────────────────────────────────────────────────────────────────
// GET /catalog — customer-facing, no auth required
catalogRouter.get('/', getPublicCatalog);

// ── Categories (admin only) ───────────────────────────────────────────────────
catalogRouter.get('/categories', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), listCategories);
catalogRouter.post('/categories', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zCreateCategoryBody), createCategory);
catalogRouter.patch('/categories/:id', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zUpdateCategoryBody), updateCategory);
catalogRouter.delete('/categories/:id', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), deleteCategory);

// ── Services (admin only) ─────────────────────────────────────────────────────
catalogRouter.get('/services', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zCatalogQuery, 'query'), listServices);
catalogRouter.post('/services', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zCreateServiceBody), createService);
catalogRouter.patch('/services/:id', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zUpdateServiceBody), updateService);
catalogRouter.delete('/services/:id', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), deleteService);

// ── Store price overrides (store owner / staff) ────────────────────────────────
catalogRouter.get('/stores/:storeId/overrides', authenticate, authorizeStoreActor((req) => req.params['storeId']), getStoreOverrides);
catalogRouter.put('/stores/:storeId/overrides', authenticate, authorizeStoreActor((req) => req.params['storeId']), validate(zStorePriceOverrideBody), upsertPriceOverrides);
