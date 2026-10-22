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

// POST /api/v1/users/import — admin bulk import
export const bulkImportUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = req.body.users as Array<{ name?: string; email?: string; phone?: string; role?: string }>;
    if (!Array.isArray(rows) || rows.length === 0) {
      return next(new AppError(400, 'INVALID_INPUT', 'users array is required.'));
    }
    if (rows.length > 500) {
      return next(new AppError(400, 'TOO_MANY', 'Maximum 500 users per import.'));
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (!row.email && !row.phone) { errors.push(`Row missing email and phone: ${JSON.stringify(row)}`); skipped++; continue; }
      const existing = await User.findOne(row.email ? { email: row.email } : { phone: row.phone }).lean();
      if (existing) { skipped++; continue; }
      try {
        await User.create({
          name:          row.name  || undefined,
          email:         row.email || undefined,
          phone:         row.phone || undefined,
          role:          row.role  || 'CUSTOMER',
          status:        'ACTIVE',
          authMethods:   [],
          notifyBySms:   true,
          notifyByPush:  false,
          notifyByEmail: !!row.email,
        });
        created++;
      } catch {
        errors.push(`Failed to create user: ${row.email ?? row.phone}`);
        skipped++;
      }
    }

    res.json({ ok: true, data: { created, skipped, errors: errors.slice(0, 20) } });
  } catch (err) { next(err); }
};

// POST /api/v1/users/message — admin send message to users
export const sendMessageToUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userIds, channel, subject, message } = req.body as {
      userIds: string[];
      channel: 'EMAIL' | 'WHATSAPP';
      subject?: string;
      message: string;
    };

    if (!userIds?.length || !message || !channel) {
      return next(new AppError(400, 'INVALID_INPUT', 'userIds, channel, and message are required.'));
    }
    if (userIds.length > 500) {
      return next(new AppError(400, 'TOO_MANY', 'Maximum 500 recipients per message.'));
    }

    const users = await User.find({ _id: { $in: userIds } })
      .select('email phone name notifyByEmail')
      .lean();

    if (channel === 'EMAIL') {
      const { config } = await import('../../lib/config.js');
      const apiKey = config.RESEND_API_KEY;
      if (!apiKey) {
        return next(new AppError(503, 'EMAIL_NOT_CONFIGURED', 'RESEND_API_KEY not set.'));
      }

      let sent = 0;
      let failed = 0;
      const recipients = users.filter(u => u.email);

      const BATCH = 50;
      for (let i = 0; i < recipients.length; i += BATCH) {
        const batch = recipients.slice(i, i + BATCH);
        await Promise.all(batch.map(async (u) => {
          try {
            const r = await fetch('https://api.resend.com/emails', {
              method:  'POST',
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from:    `Desire Dry Cleaning <${config.EMAIL_FROM ?? 'hello@desiredrycleaning.in'}>`,
                to:      [u.email!],
                subject: subject || 'Message from Desire Dry Cleaning',
                html:    buildMessageHtml(u.name ?? u.email!, message),
                text:    message,
              }),
            });
            if (r.ok) sent++; else failed++;
          } catch { failed++; }
        }));
      }

      res.json({ ok: true, data: { channel: 'EMAIL', sent, failed, total: recipients.length } });

    } else {
      const links = users
        .filter(u => u.phone)
        .map(u => ({
          name:  u.name ?? u.phone,
          phone: u.phone,
          url:   `https://wa.me/${(u.phone ?? '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`,
        }));

      res.json({ ok: true, data: { channel: 'WHATSAPP', links, total: links.length } });
    }
  } catch (err) { next(err); }
};

function buildMessageHtml(recipientName: string, message: string): string {
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html>
<body style="background:#0B0B0C;color:#E8E0CC;font-family:Inter,sans-serif;padding:40px 20px;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#141416;border:1px solid rgba(212,175,55,0.18);border-radius:10px;padding:40px">
    <h1 style="font-family:Georgia,serif;color:#D4AF37;margin:0 0 8px">Desire Dry Cleaning</h1>
    <p style="color:#7A7060;margin:0 0 32px;font-size:14px">Premium Dry Cleaning Service</p>
    <p style="margin:0 0 8px">Dear ${recipientName},</p>
    <div style="margin:0 0 24px;line-height:1.7">${escaped}</div>
    <p style="color:#7A7060;font-size:13px;margin:0">Desire Premium Dry Cleaning &middot; Greater Noida West, UP</p>
  </div>
</body>
</html>`;
}

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
