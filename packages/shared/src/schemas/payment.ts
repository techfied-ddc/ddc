import { z } from 'zod';
import { PaymentMode, PaymentStatus } from '../enums.js';
import { zObjectId, zMoneyPaisePositive } from './common.js';

// ── Payment initiation ────────────────────────────────────────────────────────

export const zInitiatePaymentBody = z.object({
  orderId:     zObjectId,
  paymentMode: z.literal(PaymentMode.ONLINE),
});

// ── Webhook payloads ──────────────────────────────────────────────────────────
// Raw body validated per-provider in the webhook handler; these schemas
// cover the normalised internal event shapes after parsing.

export const zPaymentWebhookEvent = z.object({
  provider:    z.enum(['razorpay', 'cashfree']),
  event:       z.string(),
  paymentId:   z.string(),
  orderId:     z.string(),
  amount:      zMoneyPaisePositive,
  status:      z.nativeEnum(PaymentStatus),
  rawPayload:  z.unknown(),
});

// ── Refund ────────────────────────────────────────────────────────────────────

export const zCreateRefundBody = z.object({
  orderId: zObjectId,
  amount:  zMoneyPaisePositive.optional(), // omit = full refund
  reason:  z.string().min(1).max(500),
});

// ── Payout / settlement ───────────────────────────────────────────────────────

export const zRunSettlementBody = z.object({
  storeId: zObjectId.optional(), // omit = run for all stores
  periodEnd: z.coerce.date(),    // settle up to this date
});

export const zMarkPayoutPaidBody = z.object({
  payoutId:    zObjectId,
  method:      z.enum(['NEFT', 'IMPS', 'UPI', 'GATEWAY_PAYOUT', 'MANUAL']),
  reference:   z.string().max(200).optional(),
  paidAt:      z.coerce.date().optional(),
});

export type InitiatePaymentBody  = z.infer<typeof zInitiatePaymentBody>;
export type PaymentWebhookEvent  = z.infer<typeof zPaymentWebhookEvent>;
export type CreateRefundBody     = z.infer<typeof zCreateRefundBody>;
export type RunSettlementBody    = z.infer<typeof zRunSettlementBody>;
export type MarkPayoutPaidBody   = z.infer<typeof zMarkPayoutPaidBody>;
