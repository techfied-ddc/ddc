import { z } from 'zod';
import { PaymentMode, OrderStatus } from '../enums.js';
import { zObjectId, zAddress, zRating, zPaginationQuery } from './common.js';

// ── Cart / placement ─────────────────────────────────────────────────────────

export const zCartItem = z.object({
  serviceId: zObjectId,
  quantity:  z.number().int().positive(),
  note:      z.string().max(500).optional(),
});

export const zPlaceOrderBody = z.object({
  items:       z.array(zCartItem).min(1, 'At least one item is required'),
  address:     zAddress,
  pickupSlot:  z.object({
    date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    windowId: zObjectId,
  }),
  paymentMode: z.nativeEnum(PaymentMode),
  couponCode:  z.string().max(50).optional(),
  note:        z.string().max(1000).optional(),
});

// ── Store transitions ─────────────────────────────────────────────────────────

export const zAcceptOrderBody  = z.object({});
export const zRejectOrderBody  = z.object({ reason: z.string().min(1).max(500) });

export const zAssignRiderBody = z.object({
  riderId: zObjectId,
});

export const zVerifyPickupOtpBody = z.object({
  otp: z.string().length(4).regex(/^\d+$/),
});

export const zVerifyDeliveryOtpBody = z.object({
  otp: z.string().length(4).regex(/^\d+$/),
});

export const zReceiveAtStoreBody = z.object({
  verifiedItems: z.array(z.object({
    serviceId: zObjectId,
    quantity:  z.number().int().positive(),
    note:      z.string().max(500).optional(),
  })).optional(),
  photos: z.array(z.string().url()).max(10).optional(),
});

// ── Cancel ────────────────────────────────────────────────────────────────────

export const zCancelOrderBody = z.object({
  reason: z.string().min(1).max(500),
});

// ── Rate ─────────────────────────────────────────────────────────────────────

export const zRateOrderBody = z.object({
  rating:  zRating,
  comment: z.string().max(1000).optional(),
});

// ── Admin assign ──────────────────────────────────────────────────────────────

export const zAdminAssignOrderBody = z.object({
  storeId: zObjectId,
  reason:  z.string().max(500).optional(),
});

// ── Store: confirm UPI payment ────────────────────────────────────────────────

export const zConfirmPaymentBody = z.object({
  transactionRef: z.string().min(1).max(100),
});

// ── List / filter ─────────────────────────────────────────────────────────────

export const zOrderListQuery = zPaginationQuery.extend({
  status:   z.nativeEnum(OrderStatus).optional(),
  storeId:  zObjectId.optional(),
  from:     z.coerce.date().optional(),
  to:       z.coerce.date().optional(),
  search:   z.string().max(100).optional(), // orderRef or customer name
});

export type ConfirmPaymentBody   = z.infer<typeof zConfirmPaymentBody>;
export type CartItem             = z.infer<typeof zCartItem>;
export type PlaceOrderBody       = z.infer<typeof zPlaceOrderBody>;
export type RejectOrderBody      = z.infer<typeof zRejectOrderBody>;
export type AssignRiderBody      = z.infer<typeof zAssignRiderBody>;
export type VerifyPickupOtpBody  = z.infer<typeof zVerifyPickupOtpBody>;
export type VerifyDeliveryOtpBody = z.infer<typeof zVerifyDeliveryOtpBody>;
export type ReceiveAtStoreBody   = z.infer<typeof zReceiveAtStoreBody>;
export type CancelOrderBody      = z.infer<typeof zCancelOrderBody>;
export type RateOrderBody        = z.infer<typeof zRateOrderBody>;
export type AdminAssignOrderBody = z.infer<typeof zAdminAssignOrderBody>;
export type OrderListQuery       = z.infer<typeof zOrderListQuery>;
