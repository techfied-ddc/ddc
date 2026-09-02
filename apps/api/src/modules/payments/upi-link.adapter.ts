import type {
  PaymentProvider,
  CreateGatewayOrderParams,
  GatewayOrderResult,
  NormalizedPaymentEvent,
  CreateRefundParams,
} from './payment.adapter.js';
import { config } from '../../lib/config.js';
import { logger } from '../../lib/logger.js';

function buildUpiLink(amountPaise: number, txnNote: string): string {
  const amountRupees = (amountPaise / 100).toFixed(2);
  const vpa = config.UPI_VPA ?? 'pay@upi';
  const name = encodeURIComponent(config.UPI_DISPLAY_NAME);
  const note = encodeURIComponent(txnNote.slice(0, 50));
  return `upi://pay?pa=${vpa}&pn=${name}&am=${amountRupees}&tn=${note}&cu=INR`;
}

export class UpiLinkProvider implements PaymentProvider {
  createGatewayOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    const gatewayOrderId = `upi_${Date.now()}_${params.orderId}`;
    const upiLink = buildUpiLink(params.amountPaise, params.invoiceRef);
    return Promise.resolve({
      gatewayOrderId,
      amountPaise: params.amountPaise,
      currency: 'INR',
      keyId: upiLink, // frontend uses keyId to detect UPI link (starts with "upi://")
    });
  }

  verifyWebhookSignature(_rawBody: Buffer | string, _signature: string): boolean {
    return true; // UPI link uses manual store confirmation, no webhook
  }

  parseWebhookEvent(rawBody: Buffer | string): NormalizedPaymentEvent {
    // Not called in the manual-confirmation flow; return a stub
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString();
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(body) as Record<string, unknown>; } catch { /* ignore */ }
    return {
      type: 'payment.captured',
      gatewayOrderId: (parsed.gatewayOrderId as string) ?? '',
      paymentId: (parsed.paymentId as string) ?? '',
      amountPaise: 0,
    };
  }

  createRefund(params: CreateRefundParams): Promise<void> {
    logger.warn({ params }, 'UPI refund must be processed manually via bank transfer');
    return Promise.resolve();
  }
}
