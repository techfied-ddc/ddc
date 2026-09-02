import crypto from 'crypto';
import { config } from '../../lib/config.js';
import { Invoice } from '../invoicing/invoice.model.js';
import { Order } from '../orders/order.model.js';
import { markInvoicePaid } from '../invoicing/invoicing.service.js';
import { AppError } from '../../lib/errors.js';
import { emitToOrder, emitToUser, emitToStore } from '../../lib/socket.js';
import { InvoiceStatus, PaymentMode, PaymentStatus } from '@ddc/shared';
import type { PaymentProvider } from './payment.adapter.js';
import { RazorpayProvider } from './razorpay.adapter.js';
import { MockPaymentProvider } from './mock.adapter.js';
import { UpiLinkProvider } from './upi-link.adapter.js';
import { logger } from '../../lib/logger.js';

// ── Provider factory ──────────────────────────────────────────────────────────

let _provider: PaymentProvider | null = null;

export function getPaymentProvider(override?: string): PaymentProvider {
  const name = override ?? config.PAYMENT_PROVIDER;
  if (name === 'razorpay') return new RazorpayProvider();
  if (name === 'upi_link') return new UpiLinkProvider();
  _provider ??= new MockPaymentProvider();
  return _provider;
}

// ── Initiate online payment ───────────────────────────────────────────────────

export async function initiatePayment(orderId: string, userId: string) {
  const order = await Order.findById(orderId);
  if (!order)                              throw AppError.notFound('Order', orderId);
  if (order.userId.toString() !== userId)  throw new AppError(403, 'FORBIDDEN', 'Not your order.');
  if (order.paymentMode !== PaymentMode.ONLINE) {
    throw new AppError(400, 'NOT_ONLINE', 'Order payment mode is not ONLINE.');
  }
  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new AppError(409, 'ALREADY_PAID', 'This order has already been paid.');
  }

  const invoice = await Invoice.findOne({ orderId, status: InvoiceStatus.ISSUED });
  if (!invoice) {
    throw new AppError(404, 'INVOICE_MISSING', 'No issued invoice found. Please contact the store.');
  }

  const provider     = getPaymentProvider();
  const gatewayOrder = await provider.createGatewayOrder({
    amountPaise: invoice.totalPaise,
    orderId:     order._id.toString(),
    invoiceRef:  invoice.invoiceRef,
    notes:       { orderRef: order.orderRef },
  });

  invoice.gatewayOrderId = gatewayOrder.gatewayOrderId;
  await invoice.save();

  order.gatewayOrderId  = gatewayOrder.gatewayOrderId;
  order.paymentStatus   = PaymentStatus.PENDING;
  await order.save();

  return {
    gatewayOrderId: gatewayOrder.gatewayOrderId,
    amountPaise:    invoice.totalPaise,
    currency:       'INR',
    keyId:          gatewayOrder.keyId,
    invoiceRef:     invoice.invoiceRef,
    orderRef:       order.orderRef,
  };
}

// ── Verify payment (client-side callback after Razorpay Checkout) ─────────────

export async function verifyPaymentSignature(params: {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  const keySecret = config.RAZORPAY_KEY_SECRET ?? 'mock-secret';
  const expected  = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  let signatureOk: boolean;
  try {
    signatureOk = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(razorpaySignature, 'hex'),
    );
  } catch {
    signatureOk = config.PAYMENT_PROVIDER === 'mock'; // allow mock in dev
  }

  if (!signatureOk) {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Payment signature verification failed.');
  }

  await markInvoicePaid(razorpayOrderId, razorpayPaymentId);

  const invoice = await Invoice.findOne({ gatewayOrderId: razorpayOrderId });
  if (invoice) {
    const order = await Order.findById(invoice.orderId).lean();
    if (order) {
      emitToOrder(order._id.toString(), 'payment:success', { orderRef: order.orderRef, invoiceRef: invoice.invoiceRef });
      emitToUser(order.userId.toString(), 'payment:success', { orderRef: order.orderRef });
      if (order.storeId) emitToStore(order.storeId.toString(), 'payment:success', { orderRef: order.orderRef });
    }
  }
}

// ── Handle gateway webhook ────────────────────────────────────────────────────

export async function handleWebhook(
  providerName: string,
  rawBody:      Buffer,
  signature:    string,
): Promise<void> {
  const provider = getPaymentProvider(providerName);

  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Webhook signature verification failed.');
  }

  let event;
  try {
    event = provider.parseWebhookEvent(rawBody);
  } catch (err) {
    logger.warn({ err }, 'Webhook: unhandled event — ignoring');
    return;
  }

  if (event.type === 'payment.captured') {
    await markInvoicePaid(event.gatewayOrderId, event.paymentId);

    const invoice = await Invoice.findOne({ gatewayOrderId: event.gatewayOrderId });
    if (invoice) {
      const order = await Order.findById(invoice.orderId).lean();
      if (order) {
        emitToOrder(order._id.toString(), 'payment:success', { invoiceRef: invoice.invoiceRef });
        emitToUser(order.userId.toString(), 'payment:success', { orderRef: order.orderRef });
        if (order.storeId) emitToStore(order.storeId.toString(), 'payment:success', { orderRef: order.orderRef });
      }
    }
  }

  // payment.failed and refund.processed are handled by other flows (alerts, jobs)
  logger.info({ event: event.type, paymentId: event.paymentId }, 'Webhook processed');
}

// ── Create refund ─────────────────────────────────────────────────────────────

export async function createRefund(orderId: string, amountPaise?: number, reason?: string): Promise<void> {
  const invoice = await Invoice.findOne({ orderId, status: InvoiceStatus.PAID });
  if (!invoice) {
    throw new AppError(404, 'INVOICE_NOT_PAID', 'No paid invoice found for this order.');
  }
  if (!invoice.gatewayPaymentId) {
    throw new AppError(400, 'NO_PAYMENT_ID', 'No gateway payment ID recorded — cannot refund.');
  }

  const refundAmount = amountPaise ?? invoice.totalPaise;
  const provider = getPaymentProvider();
  await provider.createRefund({
    paymentId:   invoice.gatewayPaymentId,
    amountPaise: refundAmount,
    reason,
  });

  invoice.status = refundAmount >= invoice.totalPaise ? InvoiceStatus.VOID : invoice.status;
  await invoice.save();

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: refundAmount >= invoice.totalPaise
      ? PaymentStatus.REFUNDED
      : PaymentStatus.PARTIALLY_REFUNDED,
  });
}
