import mongoose from 'mongoose';
import { Invoice } from './invoice.model.js';
import { Order } from '../orders/order.model.js';
import { transitionOrder } from '../orders/orders.service.js';
import { AppError } from '../../lib/errors.js';
import { InvoiceStatus, PaymentStatus, type Role } from '@ddc/shared';
import type { IssueInvoiceBody } from '@ddc/shared';

const INVOICE_PREFIX = 'INV-';

async function genInvoiceRef(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const n   = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    const ref = `${INVOICE_PREFIX}${n}`;
    if (!(await Invoice.exists({ invoiceRef: ref }))) return ref;
  }
  throw new Error('Failed to generate unique invoice ref after 10 attempts.');
}

export async function issueInvoice(
  storeId:    string,
  orderId:    string,
  issuedById: string,
  actorRole:  Role,
  body:       IssueInvoiceBody,
): Promise<InstanceType<typeof Invoice>> {
  const order = await Order.findOne({ _id: orderId, storeId });
  if (!order) throw AppError.notFound('Order', orderId);

  if (!['AT_STORE', 'INVOICED'].includes(order.status)) {
    throw new AppError(400, 'WRONG_STATUS', `Cannot issue invoice when order is ${order.status}.`);
  }

  // ── Compute financials ────────────────────────────────────────────────────
  const subtotalPaise = body.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const discountPaise = Math.min(body.discountPaise ?? 0, subtotalPaise);
  const afterDiscount = subtotalPaise - discountPaise;
  const taxPercent    = body.taxPercent ?? 0;
  const taxPaise      = Math.round((afterDiscount * taxPercent) / 100);
  const totalPaise    = afterDiscount + taxPaise;

  if (totalPaise <= 0) {
    throw new AppError(400, 'ZERO_INVOICE', 'Invoice total must be greater than zero.');
  }

  // ── Void any existing draft / issued invoice for this order ──────────────
  const existing = await Invoice.findOne({ orderId });
  if (existing) {
    existing.status = InvoiceStatus.VOID;
    await existing.save();
  }

  // ── Create invoice ────────────────────────────────────────────────────────
  const invoiceRef = await genInvoiceRef();
  const invoice = await Invoice.create({
    invoiceRef,
    orderId:       order._id,
    storeId:       order.storeId,
    customerId:    order.userId,
    status:        InvoiceStatus.ISSUED,
    lines:         body.lines,
    subtotalPaise,
    discountPaise,
    taxPercent,
    taxPaise,
    totalPaise,
    notes:         body.notes,
    issuedById:    mongoose.Types.ObjectId.isValid(issuedById) ? new mongoose.Types.ObjectId(issuedById) : undefined,
    issuedAt:      new Date(),
  });

  // ── Transition order → INVOICED and set paymentStatus PENDING ────────────
  await transitionOrder({
    orderId,
    event:     'ISSUE_INVOICE',
    actorId:   issuedById,
    actorRole,
    payload:   { invoiceId: invoice._id.toString(), totalPaise },
  });

  return invoice;
}

export async function getInvoice(invoiceId: string): Promise<InstanceType<typeof Invoice>> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw AppError.notFound('Invoice', invoiceId);
  return invoice;
}

export async function getInvoiceForOrder(orderId: string): Promise<InstanceType<typeof Invoice>> {
  const invoice = await Invoice.findOne({ orderId, status: { $ne: InvoiceStatus.VOID } });
  if (!invoice) throw AppError.notFound('Invoice', orderId);
  return invoice;
}

export async function markInvoicePaid(
  gatewayOrderId: string,
  paymentId:      string,
): Promise<void> {
  const invoice = await Invoice.findOne({ gatewayOrderId });
  if (!invoice) return; // idempotent — webhook may fire multiple times

  if (invoice.status === InvoiceStatus.PAID) return;

  invoice.status           = InvoiceStatus.PAID;
  invoice.gatewayPaymentId = paymentId;
  invoice.paidAt           = new Date();
  await invoice.save();

  // Sync paymentStatus on the order
  await Order.findByIdAndUpdate(invoice.orderId, {
    paymentStatus:    PaymentStatus.PAID,
    gatewayOrderId,
    paymentIntentId:  paymentId,
  });
}

export async function voidInvoice(invoiceId: string): Promise<InstanceType<typeof Invoice>> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw AppError.notFound('Invoice', invoiceId);
  if (invoice.status === InvoiceStatus.PAID) {
    throw new AppError(409, 'INVOICE_PAID', 'Cannot void a paid invoice. Issue a refund instead.');
  }
  invoice.status = InvoiceStatus.VOID;
  await invoice.save();
  return invoice;
}
