import type { Request, Response, NextFunction } from 'express';
import { Store } from './store.model.js';
import { User } from '../users/user.model.js';
import { AppError } from '../../lib/errors.js';
import { DEFAULT_PAGE_SIZE, StoreStatus, Role, AuthMethod } from '@ddc/shared';
import type { StoreListQuery } from '@ddc/shared';

// ── Admin: list stores ────────────────────────────────────────────────────────

export const listStores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, pincode, page = 1, limit = DEFAULT_PAGE_SIZE } = req.query as unknown as StoreListQuery;
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));

    const filter: Record<string, unknown> = {};
    if (status)  filter['status'] = status;
    if (pincode) filter['serviceArea.pincodes'] = pincode;
    if (search)  filter['name'] = { $regex: search, $options: 'i' };

    const [stores, total] = await Promise.all([
      Store.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
      Store.countDocuments(filter),
    ]);

    res.json({ ok: true, data: { stores, total, page: p, limit: l, pages: Math.ceil(total / l) } });
  } catch (err) { next(err); }
};

// ── Admin: create store ───────────────────────────────────────────────────────

export const createStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ownerUserId, ownerName, ownerPhone, ownerEmail, sla, ...storeFields } = req.body as {
      ownerUserId?: string;
      ownerName?: string;
      ownerPhone?: string;
      ownerEmail?: string;
      sla?: { defaultTatHours?: number };
      [key: string]: unknown;
    };

    let resolvedOwnerId: string;

    if (ownerUserId) {
      const existing = await User.findById(ownerUserId).lean();
      if (!existing) return next(AppError.notFound('Owner user', ownerUserId));
      resolvedOwnerId = ownerUserId;
    } else {
      // Auto-create a STORE_OWNER user so admin can onboard in one step
      const newUser = await User.create({
        name:        ownerName ?? 'Store Owner',
        phone:       ownerPhone,
        email:       ownerEmail,
        role:        Role.STORE_OWNER,
        authMethods: [AuthMethod.EMAIL_OTP],
      });
      resolvedOwnerId = String(newUser._id);
    }

    const store = await Store.create({
      ...storeFields,
      ownerUserId: resolvedOwnerId,
      status:      StoreStatus.APPROVED,
      ...(sla && { sla }),
    });

    // Link store back to the owner user
    await User.findByIdAndUpdate(resolvedOwnerId, { storeId: store._id });

    res.status(201).json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Admin/Store: get store by id ──────────────────────────────────────────────

export const getStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findById(req.params['id']).lean();
    if (!store) return next(AppError.notFound('Store', req.params['id'] as string));
    res.json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Admin/Store: update profile ───────────────────────────────────────────────

export const updateStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params['id'], req.body, { new: true, runValidators: true }).lean();
    if (!store) return next(AppError.notFound('Store', req.params['id'] as string));
    res.json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Admin: set store status (approve / suspend / close) ───────────────────────

export const setStoreStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, reason } = req.body as { status: StoreStatus; reason?: string };
    const store = await Store.findByIdAndUpdate(
      req.params['id'],
      { $set: { status }, ...(reason && { $push: { statusHistory: { status, reason, at: new Date(), by: req.user!.sub } } }) },
      { new: true, runValidators: true },
    ).lean();
    if (!store) return next(AppError.notFound('Store', req.params['id'] as string));
    res.json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Store owner: update service area ─────────────────────────────────────────

export const updateServiceArea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params['id'],
      { $set: { serviceArea: req.body } },
      { new: true, runValidators: true },
    ).lean();
    if (!store) return next(AppError.notFound('Store', req.params['id'] as string));
    res.json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Store owner: update pickup slot windows ───────────────────────────────────

export const updatePickupSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled, leadTimeMinutes, horizonDays, windows } = req.body;
    const $set: Record<string, unknown> = {};
    if (enabled           !== undefined) $set['pickupSlots.enabled']           = enabled;
    if (leadTimeMinutes   !== undefined) $set['pickupSlots.leadTimeMinutes']   = leadTimeMinutes;
    if (horizonDays       !== undefined) $set['pickupSlots.horizonDays']       = horizonDays;
    if (windows           !== undefined) $set['pickupSlots.windows']           = windows;

    const store = await Store.findByIdAndUpdate(req.params['id'], { $set }, { new: true, runValidators: true }).lean();
    if (!store) return next(AppError.notFound('Store', req.params['id'] as string));
    res.json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Store owner: update SLA ───────────────────────────────────────────────────

export const updateSla = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params['id'],
      { $set: { sla: req.body } },
      { new: true, runValidators: true },
    ).lean();
    if (!store) return next(AppError.notFound('Store', req.params['id'] as string));
    res.json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Store owner: update operating hours ──────────────────────────────────────

export const updateOperatingHours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params['id'],
      { $set: { operatingHours: req.body } },
      { new: true, runValidators: true },
    ).lean();
    if (!store) return next(AppError.notFound('Store', req.params['id'] as string));
    res.json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Store actor: get own store profile ────────────────────────────────────────

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.user!.storeId;
    if (!storeId) return next(new AppError(403, 'NO_STORE', 'No store associated with this account.'));
    const store = await Store.findById(storeId).lean();
    if (!store) return next(AppError.notFound('Store', storeId));
    res.json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Admin: set commission percentage for a store ─────────────────────────────

export const updateCommission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commissionPercent } = req.body as { commissionPercent: number };
    const store = await Store.findByIdAndUpdate(
      req.params['id'],
      { $set: { commissionPercent } },
      { new: true, runValidators: true },
    ).lean();
    if (!store) return next(AppError.notFound('Store', req.params['id'] as string));
    res.json({ ok: true, data: { store } });
  } catch (err) { next(err); }
};

// ── Public: list available slots for a store + date ───────────────────────────

export const listSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query as { date?: string };
    const store = await Store.findById(req.params['id']).lean();
    if (!store) return next(AppError.notFound('Store', req.params['id'] as string));

    const slots = store.pickupSlots?.windows
      ?.filter((w) => w.enabled)
      ?.map((w) => ({
        windowId: w._id,
        label:    w.label,
        start:    w.start,
        end:      w.end,
      })) ?? [];

    res.json({ ok: true, data: { slots, date: date ?? null } });
  } catch (err) { next(err); }
};
