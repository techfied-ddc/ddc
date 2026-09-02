import type { Request, Response, NextFunction } from 'express';
import { initiatePayment, verifyPaymentSignature, handleWebhook, createRefund } from './payments.service.js';
import { AppError } from '../../lib/errors.js';

// ── Customer: initiate online payment ────────────────────────────────────────

export const initiate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await initiatePayment(req.body.orderId, req.user!.sub);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
};

// ── Customer: verify payment after Razorpay Checkout callback ────────────────

export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return next(new AppError(400, 'MISSING_PARAMS', 'Missing Razorpay payment details.'));
    }
    await verifyPaymentSignature({
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });
    res.json({ ok: true, data: { message: 'Payment verified.' } });
  } catch (err) { next(err); }
};

// ── Gateway webhook (raw body — mounted BEFORE express.json in app.ts) ───────

export const webhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider  = req.params['provider'] as string;
    const signature = (
      req.headers['x-razorpay-signature'] ??
      req.headers['x-webhook-signature'] ??
      ''
    ) as string;

    await handleWebhook(provider, req.body as Buffer, signature);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ── Admin / store: create refund ──────────────────────────────────────────────

export const refund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, amount, reason } = req.body;
    if (!orderId) return next(new AppError(400, 'MISSING_ORDER', 'orderId is required.'));
    await createRefund(orderId, amount, reason);
    res.json({ ok: true, data: { message: 'Refund initiated.' } });
  } catch (err) { next(err); }
};
