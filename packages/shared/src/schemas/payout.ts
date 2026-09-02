import { z } from 'zod';
import { PayoutStatus } from '../enums.js';
import { zObjectId, zPercent, zPaginationQuery } from './common.js';

export const zPayoutListQuery = zPaginationQuery.extend({
  storeId: zObjectId.optional(),
  status:  z.nativeEnum(PayoutStatus).optional(),
  from:    z.coerce.date().optional(),
  to:      z.coerce.date().optional(),
});

export const zAdjustPayoutBody = z.object({
  payoutId:    zObjectId,
  amount:      z.number().int(), // positive = credit to store; negative = debit
  description: z.string().min(1).max(500),
});

export const zUpdateCommissionBody = z.object({
  storeId:           zObjectId,
  commissionPercent: zPercent,
  effectiveFrom:     z.coerce.date().optional(),
});

export type PayoutListQuery       = z.infer<typeof zPayoutListQuery>;
export type AdjustPayoutBody      = z.infer<typeof zAdjustPayoutBody>;
export type UpdateCommissionBody  = z.infer<typeof zUpdateCommissionBody>;
