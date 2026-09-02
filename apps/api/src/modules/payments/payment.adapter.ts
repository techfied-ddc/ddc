// PaymentProvider interface — business logic never imports a vendor SDK directly.
// Adapters live alongside this file; the factory in payments.service.ts selects one.

export interface CreateGatewayOrderParams {
  amountPaise: number;
  orderId:     string;    // internal order _id (used as receipt)
  invoiceRef:  string;
  notes?:      Record<string, string>;
}

export interface GatewayOrderResult {
  gatewayOrderId: string;
  amountPaise:    number;
  currency:       string;
  keyId:          string;  // public key for Checkout JS
}

export type PaymentEventType = 'payment.captured' | 'payment.failed' | 'refund.processed';

export interface NormalizedPaymentEvent {
  type:           PaymentEventType;
  gatewayOrderId: string;   // links back to invoice.gatewayOrderId
  paymentId:      string;
  amountPaise:    number;
}

export interface CreateRefundParams {
  paymentId:   string;  // gateway payment ID
  amountPaise: number;
  reason?:     string;
}

export interface PaymentProvider {
  createGatewayOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult>;
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean;
  parseWebhookEvent(rawBody: Buffer | string): NormalizedPaymentEvent;
  createRefund(params: CreateRefundParams): Promise<void>;
}
