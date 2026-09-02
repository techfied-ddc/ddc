import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { Role } from '@ddc/shared';
import { zCreateCouponBody, zUpdateCouponBody } from '@ddc/shared';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } from './coupons.controller.js';

export const couponsRouter = Router();

// Public: validate a coupon code (used at checkout)
couponsRouter.get('/validate', validateCoupon);

// Admin CRUD
couponsRouter.get   ('/',    authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), listCoupons);
couponsRouter.post  ('/',    authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zCreateCouponBody), createCoupon);
couponsRouter.patch ('/:id', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), validate(zUpdateCouponBody), updateCoupon);
couponsRouter.delete('/:id', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), deleteCoupon);
