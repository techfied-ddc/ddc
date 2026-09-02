import { z } from 'zod';
import { zObjectId } from './common.js';

export const zSlotAvailabilityQuery = z.object({
  storeId: zObjectId,
  // date range is optional; defaults to store horizonDays config
  from:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const zSlotCheckBody = z.object({
  storeId:  zObjectId,
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  windowId: zObjectId,
});

export type SlotAvailabilityQuery = z.infer<typeof zSlotAvailabilityQuery>;
export type SlotCheckBody         = z.infer<typeof zSlotCheckBody>;
