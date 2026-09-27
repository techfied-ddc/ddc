import { z } from 'zod';
import { StoreStatus } from '../enums.js';
import { zObjectId, zAddress, zPincode, zPercent, zTimeHHMM, zPaginationQuery } from './common.js';

// ── Store onboarding / profile ────────────────────────────────────────────────

const zCreateStoreBase = z.object({
  name:        z.string().min(1).max(200),
  // Either supply an existing ownerUserId OR provide ownerName + ownerPhone to auto-create the owner
  ownerUserId: zObjectId.optional(),
  ownerName:   z.string().min(1).max(100).optional(),
  ownerPhone:  z.string().min(7).max(20).optional(),
  ownerEmail:  z.string().email().optional(),
  address:     zAddress,
  phone:       z.string().min(7).max(20),
  email:       z.string().email().optional(),
  logoUrl:     z.string().url().optional(),
  gstin:       z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GSTIN').optional(),
  taxPercent:  zPercent.optional(),
  commissionPercent: zPercent.optional(),
  sla: z.object({ defaultTatHours: z.number().int().positive().max(8760) }).optional(),
  serviceArea: z.object({ pincodes: z.array(zPincode).max(500) }).optional(),
});

export const zCreateStoreBody = zCreateStoreBase.refine(
  (d) => d.ownerUserId || d.ownerPhone,
  { message: 'Either ownerUserId or ownerPhone must be provided', path: ['ownerPhone'] },
);

export const zUpdateStoreBody = zCreateStoreBase
  .partial()
  .omit({ ownerUserId: true, ownerName: true, ownerPhone: true, ownerEmail: true });

export const zUpdateStoreStatusBody = z.object({
  status: z.nativeEnum(StoreStatus),
  reason: z.string().max(500).optional(),
});

// ── Service area / zones ──────────────────────────────────────────────────────

export const zUpdateServiceAreaBody = z.object({
  pincodes:   z.array(zPincode).max(500),
  polygon:    z.object({
    type:        z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }).optional(),
  radiusKm:   z.number().positive().max(100).optional(),
});

// ── Pickup slot windows ───────────────────────────────────────────────────────

export const zSlotWindowBody = z.object({
  label:      z.string().min(1).max(50),
  start:      zTimeHHMM,
  end:        zTimeHHMM,
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  capacity:   z.number().int().positive().max(1000),
  enabled:    z.boolean().default(true),
}).refine(
  (d) => d.start < d.end,
  { message: 'Start time must be before end time', path: ['end'] },
);

export const zUpdatePickupSlotsBody = z.object({
  enabled:         z.boolean().optional(),
  leadTimeMinutes: z.number().int().positive().max(1440).optional(),
  horizonDays:     z.number().int().positive().max(30).optional(),
  windows:         z.array(zSlotWindowBody).max(20).optional(),
});

// ── SLA settings ──────────────────────────────────────────────────────────────

export const zUpdateSlaBody = z.object({
  defaultTatHours: z.number().int().positive().max(720),
  categoryOverrides: z.array(z.object({
    categoryId: zObjectId,
    tatHours:   z.number().int().positive().max(720),
  })).optional(),
});

// ── Operating hours ───────────────────────────────────────────────────────────

export const zDayHours = z.object({
  open:  zTimeHHMM,
  close: zTimeHHMM,
  closed: z.boolean().default(false),
});

export const zUpdateOperatingHoursBody = z.object({
  monday:    zDayHours,
  tuesday:   zDayHours,
  wednesday: zDayHours,
  thursday:  zDayHours,
  friday:    zDayHours,
  saturday:  zDayHours,
  sunday:    zDayHours,
});

// ── Store list / admin filter ──────────────────────────────────────────────────

export const zStoreListQuery = zPaginationQuery.extend({
  status: z.nativeEnum(StoreStatus).optional(),
  search: z.string().max(100).optional(),
  pincode: zPincode.optional(),
});

export type CreateStoreBody          = z.infer<typeof zCreateStoreBody>;
export type UpdateStoreBody          = z.infer<typeof zUpdateStoreBody>;
export type UpdateStoreStatusBody    = z.infer<typeof zUpdateStoreStatusBody>;
export type UpdateServiceAreaBody    = z.infer<typeof zUpdateServiceAreaBody>;
export type SlotWindowBody           = z.infer<typeof zSlotWindowBody>;
export type UpdatePickupSlotsBody    = z.infer<typeof zUpdatePickupSlotsBody>;
export type UpdateSlaBody            = z.infer<typeof zUpdateSlaBody>;
export type UpdateOperatingHoursBody = z.infer<typeof zUpdateOperatingHoursBody>;
export type StoreListQuery           = z.infer<typeof zStoreListQuery>;
