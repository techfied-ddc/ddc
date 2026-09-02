import { z } from 'zod';
import { zObjectId } from './common.js';

export const zCreateRiderBody = z.object({
  userId:       zObjectId,
  storeId:      zObjectId,
  vehicleType:  z.enum(['BIKE', 'SCOOTER', 'CYCLE', 'OTHER']),
  vehicleNumber: z.string().min(1).max(20).optional(),
  dlNumber:     z.string().max(20).optional(),
  selfieUrl:    z.string().url().optional(),
});

export const zUpdateRiderBody = zCreateRiderBody.partial().omit({ userId: true, storeId: true });

export const zRiderLocationBody = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const zRiderListQuery = z.object({
  storeId:  zObjectId.optional(),
  active:   z.coerce.boolean().optional(),
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateRiderBody   = z.infer<typeof zCreateRiderBody>;
export type UpdateRiderBody   = z.infer<typeof zUpdateRiderBody>;
export type RiderLocationBody = z.infer<typeof zRiderLocationBody>;
export type RiderListQuery    = z.infer<typeof zRiderListQuery>;
