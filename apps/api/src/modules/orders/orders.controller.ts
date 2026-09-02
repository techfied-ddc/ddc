import type { Request, Response, NextFunction } from 'express';
import { Order } from './order.model.js';
import { placeOrder, transitionOrder, verifyHandoverOtp } from './orders.service.js';
import { AppError } from '../../lib/errors.js';
import { DEFAULT_PAGE_SIZE, OrderStatus, PaymentStatus, Role } from '@ddc/shared';
import type { OrderListQuery } from '@ddc/shared';

// ── Customer: place order ─────────────────────────────────────────────────────

export const place = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await placeOrder(req.user!.sub, req.body);
    res.status(201).json({ ok: true, data: { order: sanitize(order.toObject() as unknown as Record<string, unknown>, req.user!.role as Role) } });
  } catch (err) { next(err); }
};

// ── Customer: list own orders ─────────────────────────────────────────────────

export const listMine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, from, to, page = 1, limit = DEFAULT_PAGE_SIZE } = req.query as unknown as OrderListQuery;
    const p = Math.max(1, Number(page));
    const l = Math.min(50, Math.max(1, Number(limit)));

    const filter: Record<string, unknown> = { userId: req.user!.sub };
    if (status)          filter['status'] = status;
    if (from || to)      filter['createdAt'] = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ ok: true, data: { orders, total, page: p, limit: l, pages: Math.ceil(total / l) } });
  } catch (err) { next(err); }
};

// ── Customer: get own order (with OTPs) ───────────────────────────────────────

export const getMine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findOne({ _id: req.params['id'], userId: req.user!.sub }).lean();
    if (!order) return next(AppError.notFound('Order', req.params['id']));
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Store: list store orders ──────────────────────────────────────────────────

export const listForStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, from, to, page = 1, limit = DEFAULT_PAGE_SIZE } = req.query as unknown as OrderListQuery;
    const storeId = req.params['storeId'] ?? req.user!.storeId;
    if (!storeId) return next(new AppError(400, 'MISSING_STORE', 'No store context.'));

    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));

    const filter: Record<string, unknown> = { storeId };
    if (status)     filter['status'] = status;
    if (from || to) filter['createdAt'] = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ ok: true, data: { orders, total, page: p, limit: l, pages: Math.ceil(total / l) } });
  } catch (err) { next(err); }
};

// ── Store: get one order ──────────────────────────────────────────────────────

export const getForStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.user!.storeId;
    const order   = await Order.findOne({ _id: req.params['id'], storeId }).lean();
    if (!order) return next(AppError.notFound('Order', req.params['id']));
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Admin: list all orders ────────────────────────────────────────────────────

export const listAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, storeId, from, to, search, page = 1, limit = DEFAULT_PAGE_SIZE } = req.query as unknown as OrderListQuery;
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));

    const filter: Record<string, unknown> = {};
    if (status)   filter['status']  = status;
    if (storeId)  filter['storeId'] = storeId;
    if (from || to) filter['createdAt'] = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
    if (search)   filter['orderRef'] = { $regex: search, $options: 'i' };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ ok: true, data: { orders, total, page: p, limit: l, pages: Math.ceil(total / l) } });
  } catch (err) { next(err); }
};

// ── Admin: get one order ──────────────────────────────────────────────────────

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params['id']).lean();
    if (!order) return next(AppError.notFound('Order', req.params['id']));
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Admin: manually assign store ─────────────────────────────────────────────

export const adminAssign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({
      orderId:   req.params['id'],
      event:     'ADMIN_ASSIGN',
      actorId:   req.user!.sub,
      actorRole: req.user!.role as Role,
      payload:   { storeId: req.body.storeId, reason: req.body.reason },
    });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Store: accept order ───────────────────────────────────────────────────────

export const accept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'ACCEPT', actorId: req.user!.sub, actorRole: req.user!.role as Role });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Store: reject order ───────────────────────────────────────────────────────

export const reject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'REJECT', actorId: req.user!.sub, actorRole: req.user!.role as Role, payload: req.body });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Store: assign pickup rider ────────────────────────────────────────────────

export const assignPickup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'ASSIGN_PICKUP', actorId: req.user!.sub, actorRole: req.user!.role as Role, payload: { riderId: req.body.riderId } });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Rider: pickup OTP verify ──────────────────────────────────────────────────

export const verifyPickup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params['id']);
    if (!order) return next(AppError.notFound('Order', req.params['id']));
    await verifyHandoverOtp('pickupOtpHash', order, req.body.otp);
    const updated = await transitionOrder({ orderId: req.params['id'], event: 'PICKUP_VERIFY_OTP', actorId: req.user!.sub, actorRole: req.user!.role as Role });
    res.json({ ok: true, data: { order: updated } });
  } catch (err) { next(err); }
};

// ── Rider: accept pickup job (start journey) ──────────────────────────────────

export const acceptPickup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'PICKUP_ACCEPT', actorId: req.user!.sub, actorRole: req.user!.role as Role });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Rider: accept delivery job (start journey) ────────────────────────────────

export const acceptDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'DELIVERY_ACCEPT', actorId: req.user!.sub, actorRole: req.user!.role as Role });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Rider: mark COD collected ─────────────────────────────────────────────────

export const collectCod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'MARK_COD_COLLECTED', actorId: req.user!.sub, actorRole: req.user!.role as Role });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Store: receive at store (post garment photos) ─────────────────────────────

export const receiveAtStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'RECEIVE_AT_STORE', actorId: req.user!.sub, actorRole: req.user!.role as Role, payload: req.body });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Store: mark processing ────────────────────────────────────────────────────

export const markProcessing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'START_PROCESS', actorId: req.user!.sub, actorRole: req.user!.role as Role });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Store: mark ready for delivery ───────────────────────────────────────────

export const markReady = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'MARK_READY', actorId: req.user!.sub, actorRole: req.user!.role as Role });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Store: assign delivery rider ──────────────────────────────────────────────

export const assignDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'ASSIGN_DELIVERY', actorId: req.user!.sub, actorRole: req.user!.role as Role, payload: { riderId: req.body.riderId } });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Rider: delivery OTP verify ────────────────────────────────────────────────

export const verifyDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params['id']);
    if (!order) return next(AppError.notFound('Order', req.params['id']));

    // Guard: payment must be settled before handing over garments
    if (order.paymentStatus !== PaymentStatus.PAID) {
      return next(new AppError(402, 'PAYMENT_REQUIRED', 'Payment must be completed before delivery.'));
    }

    await verifyHandoverOtp('deliveryOtpHash', order, req.body.otp);
    const updated = await transitionOrder({ orderId: req.params['id'], event: 'DELIVERY_VERIFY_OTP', actorId: req.user!.sub, actorRole: req.user!.role as Role });
    res.json({ ok: true, data: { order: updated } });
  } catch (err) { next(err); }
};

// ── Rider: get active jobs ────────────────────────────────────────────────────

export const getRiderJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderId  = req.user!.sub;
    const past     = req.query['past'] === 'true';

    const activePickupStatuses   = [OrderStatus.PICKUP_ASSIGNED, OrderStatus.PICKUP_IN_PROGRESS];
    const activeDeliveryStatuses = [OrderStatus.DELIVERY_ASSIGNED, OrderStatus.OUT_FOR_DELIVERY];
    const pastStatuses           = [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED];

    const filter = past
      ? {
          $or: [
            { pickupRiderId:   riderId, status: { $in: pastStatuses } },
            { deliveryRiderId: riderId, status: { $in: pastStatuses } },
          ],
        }
      : {
          $or: [
            { pickupRiderId:   riderId, status: { $in: activePickupStatuses } },
            { deliveryRiderId: riderId, status: { $in: activeDeliveryStatuses } },
          ],
        };

    const orders = await Order.find(filter)
      .select('-pickupOtpHash -deliveryOtpHash')
      .sort({ updatedAt: -1 })
      .limit(past ? 50 : 20)
      .lean();

    res.json({ ok: true, data: { orders } });
  } catch (err) { next(err); }
};

// ── Customer: rate order ──────────────────────────────────────────────────────

export const rateOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await transitionOrder({ orderId: req.params['id'], event: 'RATE', actorId: req.user!.sub, actorRole: req.user!.role as Role, payload: req.body });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Cancel (customer / store / admin) ─────────────────────────────────────────

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role   = req.user!.role as Role;
    const event  = role === Role.CUSTOMER       ? 'CANCEL_CUSTOMER'
                 : role === Role.ADMIN || role === Role.SUPER_ADMIN ? 'CANCEL_ADMIN'
                 : 'CANCEL_STORE';
    const order = await transitionOrder({ orderId: req.params['id'], event, actorId: req.user!.sub, actorRole: role, payload: req.body });
    res.json({ ok: true, data: { order } });
  } catch (err) { next(err); }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitize(order: Record<string, unknown>, _role: Role): Record<string, unknown> {
  // Never leak hashes over the wire — only expose raw OTPs in the GET-own-order flow
  // (hashes are stripped even there; the raw OTPs are never stored)
  const out = { ...order };
  delete out['pickupOtpHash'];
  delete out['deliveryOtpHash'];
  return out;
}
