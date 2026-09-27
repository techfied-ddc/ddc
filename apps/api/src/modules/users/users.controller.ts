import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from './user.model.js';
import { AppError } from '../../lib/errors.js';
import { DEFAULT_PAGE_SIZE, AuthMethod } from '@ddc/shared';

// GET /api/v1/users/me
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.sub)
      .select('-passwordHash -pushSubscriptions')
      .lean();

    if (!user) return next(AppError.notFound('User'));

    res.json({ ok: true, data: { user } });
  } catch (err) { next(err); }
};

// PATCH /api/v1/users/me
export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user!.sub,
      { $set: { ...(name && { name }), ...(email && { email }), ...(phone && { phone }), ...(avatar && { avatar }) } },
      { new: true, runValidators: true },
    ).select('-passwordHash -pushSubscriptions').lean();

    if (!user) return next(AppError.notFound('User'));

    res.json({ ok: true, data: { user } });
  } catch (err) { next(err); }
};

// GET /api/v1/users — admin only
export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, role, search } = req.query as Record<string, string>;

    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));

    const filter: Record<string, unknown> = {};
    if (role) filter['role'] = role;
    if (search) {
      filter['$or'] = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter).select('-passwordHash -pushSubscriptions')
        .skip((p - 1) * l).limit(l).sort({ createdAt: -1 }).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ ok: true, data: { items, total, page: p, limit: l, pages: Math.ceil(total / l) } });
  } catch (err) { next(err); }
};

// GET /api/v1/users/:id — admin only
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params['id'])
      .select('-passwordHash -pushSubscriptions').lean();

    if (!user) return next(AppError.notFound('User', req.params['id'] as string));
    res.json({ ok: true, data: { user } });
  } catch (err) { next(err); }
};

// PATCH /api/v1/users/:id/status — admin only
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params['id'],
      { status },
      { new: true },
    ).select('-passwordHash').lean();

    if (!user) return next(AppError.notFound('User', req.params['id'] as string));
    res.json({ ok: true, data: { user } });
  } catch (err) { next(err); }
};

// PATCH /api/v1/users/:id — admin only
export const adminUpdateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params['id'],
      { $set: { ...(name && { name }), ...(email && { email: email.toLowerCase() }), ...(phone && { phone }) } },
      { new: true, runValidators: true },
    ).select('-passwordHash -pushSubscriptions').lean();
    if (!user) return next(AppError.notFound('User', req.params['id'] as string));
    res.json({ ok: true, data: { user } });
  } catch (err) { next(err); }
};

// PATCH /api/v1/users/:id/password — admin only
export const adminSetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body as { password: string };
    const user = await User.findById(req.params['id']);
    if (!user) return next(AppError.notFound('User', req.params['id'] as string));
    user.passwordHash = await bcrypt.hash(password, 12);
    if (!user.authMethods.includes(AuthMethod.PASSWORD)) {
      user.authMethods.push(AuthMethod.PASSWORD);
    }
    await user.save();
    res.json({ ok: true, data: { message: 'Password updated.' } });
  } catch (err) { next(err); }
};

// POST /api/v1/users/push-subscription
export const savePushSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, p256dh, auth } = req.body;

    await User.findByIdAndUpdate(req.user!.sub, {
      $addToSet: {
        pushSubscriptions: { endpoint, p256dh, auth, createdAt: new Date() },
      },
    });

    res.json({ ok: true, data: { message: 'Push subscription saved.' } });
  } catch (err) { next(err); }
};
