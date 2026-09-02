import argon2 from 'argon2';
import { Order } from './order.model.js';
import { Service } from '../catalog/service.model.js';
import { Coupon } from '../coupons/coupon.model.js';
import { AppError } from '../../lib/errors.js';
import { enqueue, QueueName } from '../../jobs/queue.js';
import { emitToOrder, emitToStore, emitToUser } from '../../lib/socket.js';
import {
  assertTransition,
  OrderStatus, PaymentMode, PaymentStatus,
  ORDER_REF_PREFIX, OTP_LENGTH, CouponType, RoutingMethod,
  type PlaceOrderBody, type OrderEvent,
} from '@ddc/shared';
import type { Role } from '@ddc/shared';
import mongoose from 'mongoose';
import {
  notifyOrderPlaced, notifyOrderAccepted, notifyPickupAssigned,
  notifyDeliveryAssigned, notifyInvoiceIssued, notifyOrderDelivered,
  notifyRiderNewJob,
} from '../notifications/notifications.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function genOrderRef(): string {
  const n = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `${ORDER_REF_PREFIX}${n}`;
}

async function hashOtp(otp: string): Promise<string> {
  return argon2.hash(otp);
}

async function verifyOtpHash(hash: string, otp: string): Promise<boolean> {
  return argon2.verify(hash, otp);
}

function genOtp(): string {
  return Array.from({ length: OTP_LENGTH }, () => Math.floor(Math.random() * 10)).join('');
}

// ── Estimate calculator ───────────────────────────────────────────────────────

export async function calculateEstimate(
  items: PlaceOrderBody['items'],
  _storeId?: string,
): Promise<{ estimatePaise: number; lineItems: unknown[] }> {
  const serviceIds = items.map((i) => i.serviceId);
  const services = await Service.find({ _id: { $in: serviceIds } }).lean();
  const svcMap = new Map(services.map((s) => [s._id.toString(), s]));

  let estimatePaise = 0;
  const lineItems: unknown[] = [];

  for (const item of items) {
    const svc = svcMap.get(item.serviceId);
    if (!svc) throw AppError.notFound('Service', item.serviceId);
    if (!svc.enabled) throw new AppError(400, 'SERVICE_UNAVAILABLE', `"${svc.name}" is not available.`);

    const unitPrice = svc.basePrice;
    const subtotal  = unitPrice * item.quantity;
    estimatePaise  += subtotal;

    lineItems.push({
      serviceId:    svc._id,
      serviceName:  svc.name,
      categoryName: '',          // filled by caller with category lookup
      unit:         svc.unit,
      quantity:     item.quantity,
      unitPrice,
      note:         item.note,
    });
  }

  return { estimatePaise, lineItems };
}

// ── Place order ───────────────────────────────────────────────────────────────

export async function placeOrder(
  userId: string,
  body: PlaceOrderBody,
): Promise<InstanceType<typeof Order>> {

  const { items, address, pickupSlot, paymentMode, couponCode, note } = body;

  // 1. Compute estimate
  const { estimatePaise, lineItems } = await calculateEstimate(items);

  // 2. Validate coupon if provided
  let discountPaise = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code:       couponCode.toUpperCase(),
      enabled:    true,
      validFrom:  { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!coupon) throw new AppError(400, 'COUPON_INVALID', 'Invalid or expired coupon code.');
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new AppError(400, 'COUPON_EXHAUSTED', 'This coupon has reached its usage limit.');
    }
    if (coupon.minOrderPaise && estimatePaise < coupon.minOrderPaise) {
      throw new AppError(400, 'COUPON_MIN_ORDER', `Minimum order value for this coupon is ₹${coupon.minOrderPaise / 100}.`);
    }

    discountPaise = coupon.type === CouponType.PERCENT
      ? Math.min(
          Math.floor((estimatePaise * coupon.value) / 100),
          coupon.maxDiscountPaise ?? Infinity,
        )
      : coupon.value;

    discountPaise = Math.min(discountPaise, estimatePaise);
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usageCount: 1 } });
  }

  // 3. Lookup slot window from store (deferred until routed — optimistic placement)
  //    We store the windowId + date; capacity reservation happens in routing job.

  // 4. Create OTPs (generated now, stored hashed, shown to customer only)
  const rawPickupOtp   = genOtp();
  const rawDeliveryOtp = genOtp();
  const [pickupOtpHash, deliveryOtpHash] = await Promise.all([
    hashOtp(rawPickupOtp),
    hashOtp(rawDeliveryOtp),
  ]);

  // 5. Unique orderRef (retry if collision)
  let orderRef = genOrderRef();
  for (let i = 0; i < 5; i++) {
    const exists = await Order.exists({ orderRef });
    if (!exists) break;
    orderRef = genOrderRef();
  }

  // 6. Create order
  const order = await Order.create({
    orderRef,
    userId,
    items:           lineItems,
    address,
    pickupSlot: {
      date:        pickupSlot.date,
      windowId:    pickupSlot.windowId,
      windowLabel: '',  // populated after routing
      start:       '',
      end:         '',
    },
    note,
    status:        OrderStatus.PLACED,
    statusHistory: [{ status: OrderStatus.PLACED, at: new Date(), by: userId }],
    paymentMode,
    paymentStatus: PaymentStatus.NONE,
    estimatePaise,
    discountPaise,
    couponCode:    couponCode?.toUpperCase(),
    pickupOtpHash,
    deliveryOtpHash,
    garmentPhotos: [],
  });

  // 7. Enqueue routing job
  await enqueue(QueueName.ROUTING, 'route-order', { orderId: order._id.toString() });

  // 8. Notify customer (fire-and-forget)
  notifyOrderPlaced(userId, order.orderRef).catch(() => undefined);

  return order;
}

// ── State transition service ──────────────────────────────────────────────────

interface TransitionInput {
  orderId:  string;
  event:    string;
  actorId:  string;
  actorRole: Role;
  payload?: Record<string, unknown>;
}

export async function transitionOrder({
  orderId, event, actorId, actorRole, payload = {},
}: TransitionInput): Promise<InstanceType<typeof Order>> {
  // Raw OTPs captured at assignment time for notifications; never persisted raw.
  let _rawPickupOtp: string | undefined;
  let _rawDeliveryOtp: string | undefined;
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound('Order', orderId);

  let newStatus: OrderStatus;
  try {
    newStatus = assertTransition({ currentStatus: order.status as OrderStatus, event: event as OrderEvent, actorRole });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('FORBIDDEN')) throw new AppError(403, 'TRANSITION_FORBIDDEN', msg);
    if (msg.includes('TERMINAL'))  throw new AppError(409, 'ORDER_TERMINAL', msg);
    throw new AppError(422, 'INVALID_TRANSITION', msg);
  }

  // Apply status + history
  order.status = newStatus;
  const byId = mongoose.Types.ObjectId.isValid(actorId) ? new mongoose.Types.ObjectId(actorId) : undefined;
  order.statusHistory.push({ status: newStatus, at: new Date(), by: byId, byRole: actorRole, note: payload['note'] as string | undefined });

  // ── Event-specific side effects ────────────────────────────────────────────
  switch (event) {
    case 'ROUTE_OK': {
      order.storeId        = new mongoose.Types.ObjectId(payload['storeId'] as string);
      order.routingMethod  = payload['routingMethod'] as RoutingMethod;
      if (payload['windowLabel']) order.pickupSlot.windowLabel = payload['windowLabel'] as string;
      if (payload['start'])      order.pickupSlot.start       = payload['start'] as string;
      if (payload['end'])        order.pickupSlot.end         = payload['end'] as string;
      break;
    }
    case 'ADMIN_ASSIGN': {
      order.storeId       = new mongoose.Types.ObjectId(payload['storeId'] as string);
      order.routingMethod = RoutingMethod.MANUAL;
      break;
    }
    case 'REJECT': {
      order.cancelReason = payload['reason'] as string;
      break;
    }
    case 'ASSIGN_PICKUP': {
      order.pickupRiderId = new mongoose.Types.ObjectId(payload['riderId'] as string);
      // Generate fresh pickup OTP so we can SMS it to the customer
      _rawPickupOtp       = genOtp();
      order.pickupOtpHash = await hashOtp(_rawPickupOtp);
      break;
    }
    case 'ASSIGN_DELIVERY': {
      order.deliveryRiderId = new mongoose.Types.ObjectId(payload['riderId'] as string);
      // Generate fresh delivery OTP so we can SMS it to the customer
      _rawDeliveryOtp       = genOtp();
      order.deliveryOtpHash = await hashOtp(_rawDeliveryOtp);
      break;
    }
    case 'RECEIVE_AT_STORE': {
      if (payload['photos']) order.garmentPhotos = payload['photos'] as string[];
      break;
    }
    case 'ISSUE_INVOICE': {
      if (payload['invoiceId']) order.invoiceId = new mongoose.Types.ObjectId(payload['invoiceId'] as string);
      order.paymentStatus = PaymentStatus.PENDING;
      break;
    }
    case 'RATE': {
      order.rating = {
        score:    payload['rating'] as number,
        comment:  payload['comment'] as string | undefined,
        at:       new Date(),
      };
      break;
    }
    case 'CANCEL_CUSTOMER':
    case 'CANCEL_STORE':
    case 'CANCEL_ADMIN': {
      order.cancelReason = payload['reason'] as string;
      break;
    }
    case 'MARK_COD_COLLECTED': {
      order.paymentStatus = PaymentStatus.PAID;
      break;
    }
    case 'DELIVERY_VERIFY_OTP': {
      // Payment for online orders is marked PAID by webhook, not here
      if (order.paymentMode === PaymentMode.COD) {
        order.paymentStatus = PaymentStatus.PAID;
      }
      break;
    }
  }

  await order.save();

  // ── Realtime broadcast ─────────────────────────────────────────────────────
  const payload_json = order.toObject();
  emitToOrder(order._id.toString(), 'order:updated', payload_json);
  emitToUser(order.userId.toString(), 'order:updated', payload_json);
  if (order.storeId) emitToStore(order.storeId.toString(), 'order:updated', payload_json);

  // ── Downstream jobs ────────────────────────────────────────────────────────
  if (newStatus === OrderStatus.DELIVERED || newStatus === OrderStatus.COMPLETED) {
    await enqueue(QueueName.ANALYTICS_ROLLUP, 'order-completed', { orderId: order._id.toString() });
  }
  if (newStatus === OrderStatus.CANCELLED) {
    await enqueue(QueueName.REFUND, 'process-refund', { orderId: order._id.toString() });
  }

  // ── Notifications (fire-and-forget) ───────────────────────────────────────
  const uid   = order.userId.toString();
  const oref  = order.orderRef;
  switch (newStatus) {
    case OrderStatus.ACCEPTED:
      notifyOrderAccepted(uid, oref).catch(() => undefined);
      break;
    case OrderStatus.PICKUP_ASSIGNED:
      if (_rawPickupOtp) {
        notifyPickupAssigned(uid, oref, _rawPickupOtp).catch(() => undefined);
      }
      if (order.pickupRiderId) {
        notifyRiderNewJob(order.pickupRiderId.toString(), oref, 'pickup').catch(() => undefined);
      }
      break;
    case OrderStatus.INVOICED:
      // Invoice total passed via payload from invoicing.service
      if (payload['totalPaise']) {
        notifyInvoiceIssued(uid, oref, payload['totalPaise'] as number).catch(() => undefined);
      }
      break;
    case OrderStatus.DELIVERY_ASSIGNED:
      if (_rawDeliveryOtp) {
        notifyDeliveryAssigned(uid, oref, _rawDeliveryOtp).catch(() => undefined);
      }
      if (order.deliveryRiderId) {
        notifyRiderNewJob(order.deliveryRiderId.toString(), oref, 'delivery').catch(() => undefined);
      }
      break;
    case OrderStatus.DELIVERED:
      notifyOrderDelivered(uid, oref).catch(() => undefined);
      break;
  }

  return order;
}

// ── OTP verification helpers (used by pickup / delivery routes) ───────────────

export async function verifyHandoverOtp(
  orderField: 'pickupOtpHash' | 'deliveryOtpHash',
  order: InstanceType<typeof Order>,
  otp: string,
): Promise<void> {
  const hash = order.get(orderField) as string | undefined;
  if (!hash) throw new AppError(400, 'INVALID_OTP', 'OTP not set for this order.');
  const ok = await verifyOtpHash(hash, otp);
  if (!ok) throw new AppError(400, 'INVALID_OTP', 'Invalid OTP.');
}
