import { z } from 'zod';
import { CouponType } from '../enums.js';
import { zObjectId, zMoneyPaise, zMoneyPaisePositive } from './common.js';

// Base object (no refines) so we can derive a .partial() from it
const zCouponBase = z.object({
  code:             z.string().min(3).max(50).toUpperCase().regex(/^[A-Z0-9_-]+$/),
  type:             z.nativeEnum(CouponType),
  value:            z.number().positive(), // paise for FLAT; percent for PERCENT
  minOrderPaise:    zMoneyPaise.optional(),
  maxDiscountPaise: zMoneyPaisePositive.optional(), // cap for PERCENT type
  usageLimit:       z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  validFrom:        z.coerce.date(),
  validUntil:       z.coerce.date(),
  storeIds:         z.array(zObjectId).optional(),
  enabled:          z.boolean().default(true),
  description:      z.string().max(500).optional(),
});

export const zCreateCouponBody = zCouponBase
  .refine(
    (d) => d.validFrom < d.validUntil,
    { message: 'validUntil must be after validFrom', path: ['validUntil'] },
  )
  .refine(
    (d) => d.type === CouponType.PERCENT ? d.value <= 100 : true,
    { message: 'Percent discount value cannot exceed 100', path: ['value'] },
  );

// .partial() must be called on the base ZodObject, not on a ZodEffects
export const zUpdateCouponBody = zCouponBase.partial();

export const zApplyCouponBody = z.object({
  code:       z.string().min(3).max(50),
  orderTotal: zMoneyPaisePositive,
  storeId:    zObjectId,
});

export type CreateCouponBody = z.infer<typeof zCreateCouponBody>;
export type UpdateCouponBody = z.infer<typeof zUpdateCouponBody>;
export type ApplyCouponBody  = z.infer<typeof zApplyCouponBody>;
