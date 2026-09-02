import crypto from 'crypto';
import { config } from '../../lib/config.js';
import { AppError } from '../../lib/errors.js';
import type {
  PaymentProvider,
  CreateGatewayOrderParams, GatewayOrderResult,
  NormalizedPaymentEvent, CreateRefundParams,
} from './payment.adapter.js';

const RAZORPAY_BASE = 'https://api.razorpay.com/v1';

export class RazorpayProvider implements PaymentProvider {
  private readonly keyId     = config.RAZORPAY_KEY_ID!;
  private readonly keySecret = config.RAZORPAY_KEY_SECRET!;
  private readonly secret    = config.RAZORPAY_WEBHOOK_SECRET!;

  private authHeader() {
    return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
  }

  async createGatewayOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    const res = await fetch(`${RAZORPAY_BASE}/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.authHeader() },
      body: JSON.stringify({
        amount:   params.amountPaise,
        currency: 'INR',
        receipt:  params.orderId.slice(-40), // Razorpay receipt max 40 chars
        notes:    { internalOrderId: params.orderId, invoiceRef: params.invoiceRef, ...params.notes },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new AppError(502, 'GATEWAY_ERROR', `Razorpay createOrder failed: ${JSON.stringify(err)}`);
    }

    // why: Razorpay SDK not installed; shape is stable
    const data = await res.json() as { id: string; amount: number; currency: string };
    return { gatewayOrderId: data.id, amountPaise: data.amount, currency: data.currency, keyId: this.keyId };
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    if (!this.secret) return false;
    const expected = crypto.createHmac('sha256', this.secret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }

  parseWebhookEvent(rawBody: Buffer | string): NormalizedPaymentEvent {
    // why: Razorpay payload shape is well-known and stable
    const payload = JSON.parse(rawBody.toString()) as Record<string, unknown>;
    const event   = payload['event'] as string;
    const pEntity = (payload['payload'] as Record<string, unknown>)?.['payment'] as Record<string, unknown> | undefined;
    const payment = pEntity?.['entity'] as Record<string, unknown> | undefined;

    if ((event === 'payment.captured' || event === 'payment.failed') && payment) {
      return {
        type:           event === 'payment.captured' ? 'payment.captured' : 'payment.failed',
        gatewayOrderId: payment['order_id'] as string,
        paymentId:      payment['id'] as string,
        amountPaise:    payment['amount'] as number,
      };
    }

    const rEntity = (payload['payload'] as Record<string, unknown>)?.['refund'] as Record<string, unknown> | undefined;
    const refund  = rEntity?.['entity'] as Record<string, unknown> | undefined;
    if (event === 'refund.processed' && refund) {
      return {
        type:           'refund.processed',
        gatewayOrderId: refund['payment_id'] as string,
        paymentId:      refund['id'] as string,
        amountPaise:    refund['amount'] as number,
      };
    }

    throw new AppError(400, 'UNKNOWN_WEBHOOK_EVENT', `Unhandled Razorpay event: ${event}`);
  }

  async createRefund(params: CreateRefundParams): Promise<void> {
    const res = await fetch(`${RAZORPAY_BASE}/payments/${params.paymentId}/refund`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.authHeader() },
      body: JSON.stringify({
        amount: params.amountPaise,
        notes:  { reason: params.reason ?? 'Refund' },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new AppError(502, 'GATEWAY_ERROR', `Razorpay refund failed: ${JSON.stringify(err)}`);
    }
  }
}
