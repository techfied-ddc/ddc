import type { Request, Response, NextFunction } from 'express';
import { User } from '../users/user.model.js';
import { AppError } from '../../lib/errors.js';
import { Role, UserStatus } from '@ddc/shared';

// ── Store: list riders for the store ─────────────────────────────────────────

export const listStoreRiders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.user!.storeId;
    if (!storeId) return next(new AppError(400, 'NO_STORE', 'No store context.'));
    const riders = await User.find({ role: Role.RIDER, storeId }).select('-passwordHash').lean();
    res.json({ ok: true, data: { riders } });
  } catch (err) { next(err); }
};

// ── Store: add a rider to the store ──────────────────────────────────────────

export const addRider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.user!.storeId;
    if (!storeId) return next(new AppError(400, 'NO_STORE', 'No store context.'));
    const { name, phone } = req.body as { name: string; phone: string };
    if (!name || !phone) return next(new AppError(400, 'MISSING_FIELDS', 'name and phone are required.'));

    const existing = await User.findOne({ phone });
    if (existing) return next(new AppError(409, 'PHONE_IN_USE', 'A user with this phone number already exists.'));

    const rider = await User.create({
      name,
      phone,
      role:    Role.RIDER,
      storeId,
      status:  UserStatus.ACTIVE,
    });

    res.status(201).json({ ok: true, data: { rider: { ...rider.toObject(), passwordHash: undefined } } });
  } catch (err) { next(err); }
};

// ── Store: toggle rider active / suspended ────────────────────────────────────

export const toggleRiderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.user!.storeId;
    const rider   = await User.findOne({ _id: req.params['id'], role: Role.RIDER });
    if (!rider || rider.storeId?.toString() !== storeId) {
      return next(new AppError(404, 'RIDER_NOT_FOUND', 'Rider not found in your store.'));
    }
    rider.status = rider.status === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    await rider.save();
    res.json({ ok: true, data: { rider } });
  } catch (err) { next(err); }
};
