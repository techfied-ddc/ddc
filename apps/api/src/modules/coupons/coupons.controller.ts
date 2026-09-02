import type { Request, Response, NextFunction } from 'express';
import { Coupon } from './coupon.model.js';
import { AppError } from '../../lib/errors.js';

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const listCoupons = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: { coupons } });
  } catch (err) { next(err); }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() });
    res.status(201).json({ ok: true, data: { coupon } });
  } catch (err) { next(err); }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const update = req.body.code ? { ...req.body, code: req.body.code.toUpperCase() } : req.body;
    const coupon = await Coupon.findByIdAndUpdate(req.params['id'], update, { new: true, runValidators: true }).lean();
    if (!coupon) return next(AppError.notFound('Coupon', req.params['id']));
    res.json({ ok: true, data: { coupon } });
  } catch (err) { next(err); }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params['id']).lean();
    if (!coupon) return next(AppError.notFound('Coupon', req.params['id']));
    res.json({ ok: true, data: { message: 'Coupon deleted.' } });
  } catch (err) { next(err); }
};

// ── Public: validate a coupon code before checkout ────────────────────────────

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, orderTotal } = req.query as { code: string; orderTotal?: string };
    if (!code) return next(new AppError(400, 'MISSING_CODE', 'code is required.'));

    const coupon = await Coupon.findOne({
      code:       code.toUpperCase(),
      enabled:    true,
      validFrom:  { $lte: new Date() },
      validUntil: { $gte: new Date() },
    }).lean();

    if (!coupon) return res.json({ ok: true, data: { valid: false, reason: 'COUPON_INVALID' } });

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.json({ ok: true, data: { valid: false, reason: 'COUPON_EXHAUSTED' } });
    }

    if (coupon.minOrderPaise && orderTotal && Number(orderTotal) < coupon.minOrderPaise) {
      return res.json({ ok: true, data: { valid: false, reason: 'COUPON_MIN_ORDER', minOrderPaise: coupon.minOrderPaise } });
    }

    res.json({ ok: true, data: { valid: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value, maxDiscountPaise: coupon.maxDiscountPaise, description: coupon.description } } });
  } catch (err) { next(err); }
};
