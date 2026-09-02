import { z } from 'zod';

// ── Primitive validators ────────────────────────────────────────────────────

/** MongoDB ObjectId as a 24-hex string. */
export const zObjectId = z
  .string()
  .regex(/^[0-9a-f]{24}$/, 'Invalid ObjectId');

/** Indian pincode — 6 digits. */
export const zPincode = z
  .string()
  .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits');

/** E.164 phone number (e.g. +919876543210). */
export const zPhoneE164 = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format (+XXXXXXXXXX)');

/** Indian mobile — 10 digits, starts with 6-9. */
export const zIndianMobile = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

/** Integer paise (₹1 = 100). Must be a non-negative integer. */
export const zMoneyPaise = z
  .number()
  .int('Money must be an integer (paise)')
  .nonnegative('Money must be ≥ 0');

/** Positive integer paise (for amounts that must be > 0). */
export const zMoneyPaisePositive = z
  .number()
  .int('Money must be an integer (paise)')
  .positive('Amount must be > 0');

/** Percent value 0–100 (allows decimals, e.g. 18.5 for GST). */
export const zPercent = z
  .number()
  .min(0, 'Percent must be ≥ 0')
  .max(100, 'Percent must be ≤ 100');

/** ISO 8601 date-time string, parsed and coerced to a Date. */
export const zISODate = z.coerce.date();

/** Rating 1–5 integer. */
export const zRating = z.number().int().min(1).max(5);

/** HH:mm time string. */
export const zTimeHHMM = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format');

// ── Pagination ──────────────────────────────────────────────────────────────

export const zPaginationQuery = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof zPaginationQuery>;

// ── Address ─────────────────────────────────────────────────────────────────

export const zAddress = z.object({
  line1:    z.string().min(1).max(200),
  line2:    z.string().max(200).optional(),
  city:     z.string().min(1).max(100),
  state:    z.string().min(1).max(100),
  pincode:  zPincode,
  country:  z.string().default('India'),
  lat:      z.number().optional(),
  lng:      z.number().optional(),
  label:    z.string().max(50).optional(), // e.g. "Home", "Work"
});

export type Address = z.infer<typeof zAddress>;

// ── GeoJSON Point ───────────────────────────────────────────────────────────

export const zGeoPoint = z.object({
  type:        z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90),   // latitude
  ]),
});

export type GeoPoint = z.infer<typeof zGeoPoint>;
