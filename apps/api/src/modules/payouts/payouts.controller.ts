import type { Request, Response, NextFunction } from 'express';
import {
  runSettlement, approvePayout, markPayoutPaid, addAdjustment, listPayouts,
} from './payouts.service.js';
import { Payout } from './payout.model.js';
import { AppError } from '../../lib/errors.js';

// ── Admin: run settlement for a store ────────────────────────────────────────

export const runSettlementHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, periodFrom, periodTo } = req.body as {
      storeId: string; periodFrom: string; periodTo: string;
    };
    const payout = await runSettlement(
      storeId,
      new Date(periodFrom),
      new Date(periodTo),
      req.user!.sub,
    );
    res.status(201).json({ ok: true, data: { payout } });
  } catch (err) { next(err); }
};

// ── Admin: approve payout ─────────────────────────────────────────────────────

export const approvePayoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payout = await approvePayout(req.params['id'] as string, req.user!.sub);
    res.json({ ok: true, data: { payout } });
  } catch (err) { next(err); }
};

// ── Admin: mark payout paid ───────────────────────────────────────────────────

export const markPaidHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payoutRef, method } = req.body as { payoutRef?: string; method?: string };
    const payout = await markPayoutPaid(req.params['id'] as string, req.user!.sub, payoutRef, method);
    res.json({ ok: true, data: { payout } });
  } catch (err) { next(err); }
};

// ── Admin: add adjustment ─────────────────────────────────────────────────────

export const adjustHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payoutId, amount, description } = req.body as {
      payoutId: string; amount: number; description: string;
    };
    const payout = await addAdjustment(payoutId, req.user!.sub, amount, description);
    res.json({ ok: true, data: { payout } });
  } catch (err) { next(err); }
};

// ── List payouts ──────────────────────────────────────────────────────────────

export const listPayoutsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q    = req.query as Record<string, string>;
    const data = await listPayouts({
      storeId: q['storeId'],
      status:  q['status'],
      from:    q['from']  ? new Date(q['from'])  : undefined,
      to:      q['to']    ? new Date(q['to'])    : undefined,
      page:    q['page']  ? Number(q['page'])  : 1,
      limit:   q['limit'] ? Number(q['limit']) : 20,
    });
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

// ── Get single payout ─────────────────────────────────────────────────────────

export const getPayoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payout = await Payout.findById(req.params['id']).populate('approvedBy', 'name').lean();
    if (!payout) return next(new AppError(404, 'NOT_FOUND', 'Payout not found.'));

    // Store owners can view their own payouts
    const user = req.user!;
    if (['STORE_OWNER', 'STORE_STAFF'].includes(user.role)) {
      if (payout.storeId.toString() !== user.storeId) {
        return next(new AppError(403, 'FORBIDDEN', 'Not your store.'));
      }
    }

    res.json({ ok: true, data: { payout } });
  } catch (err) { next(err); }
};

// ── Store: list own payouts ───────────────────────────────────────────────────

export const storePayoutsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.user!.storeId;
    if (!storeId) return next(new AppError(400, 'NO_STORE', 'No store context.'));
    const q    = req.query as Record<string, string>;
    const data = await listPayouts({
      storeId,
      status: q['status'],
      from:   q['from']  ? new Date(q['from'])  : undefined,
      to:     q['to']    ? new Date(q['to'])    : undefined,
      page:   q['page']  ? Number(q['page'])  : 1,
    });
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};
