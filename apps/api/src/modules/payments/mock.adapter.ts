import { logger } from '../../lib/logger.js';
import type {
  PaymentProvider,
  CreateGatewayOrderParams, GatewayOrderResult,
  NormalizedPaymentEvent, CreateRefundParams,
} from './payment.adapter.js';

// Mock provider for development and test environments.
export class MockPaymentProvider implements PaymentProvider {
  async createGatewayOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    const gatewayOrderId = `mock_order_${Date.now()}`;
    logger.info({ gatewayOrderId, amountPaise: params.amountPaise }, 'MockPaymentProvider: createGatewayOrder');
    return {
      gatewayOrderId,
      amountPaise: params.amountPaise,
      currency:    'INR',
      keyId:       'rzp_test_mock0000000000',
    };
  }

  verifyWebhookSignature(_rawBody: Buffer | string, _signature: string): boolean {
    logger.info('MockPaymentProvider: verifyWebhookSignature → true (mock)');
    return true;
  }

  parseWebhookEvent(rawBody: Buffer | string): NormalizedPaymentEvent {
    // Support calling the mock webhook endpoint in dev with an explicit body
    try {
      const payload = JSON.parse(rawBody.toString()) as Record<string, unknown>;
      return {
        type:           (payload['type'] as NormalizedPaymentEvent['type']) ?? 'payment.captured',
        gatewayOrderId: (payload['gatewayOrderId'] as string) ?? `mock_order_${Date.now()}`,
        paymentId:      `mock_pay_${Date.now()}`,
        amountPaise:    (payload['amountPaise'] as number) ?? 0,
      };
    } catch {
      return {
        type:           'payment.captured',
        gatewayOrderId: `mock_order_${Date.now()}`,
        paymentId:      `mock_pay_${Date.now()}`,
        amountPaise:    0,
      };
    }
  }

  async createRefund(params: CreateRefundParams): Promise<void> {
    logger.info({ params }, 'MockPaymentProvider: createRefund (noop)');
  }
}
