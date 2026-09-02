import type { Request, Response, NextFunction } from 'express';
import { issueInvoice, getInvoice, getInvoiceForOrder, voidInvoice } from './invoicing.service.js';
import { streamInvoicePdf } from './invoice.pdf.js';
import { AppError } from '../../lib/errors.js';
import type { Role } from '@ddc/shared';

// ── Store: issue invoice for an order ────────────────────────────────────────

export const issue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.user!.storeId;
    if (!storeId) return next(new AppError(400, 'NO_STORE', 'No store context.'));
    const invoice = await issueInvoice(storeId, req.params['orderId'], req.user!.sub, req.user!.role as Role, req.body);
    res.status(201).json({ ok: true, data: { invoice } });
  } catch (err) { next(err); }
};

// ── Customer / store: get invoice by invoice ID ───────────────────────────────

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await getInvoice(req.params['id']);
    res.json({ ok: true, data: { invoice } });
  } catch (err) { next(err); }
};

// ── Customer / store / rider: get invoice for an order ───────────────────────

export const getForOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await getInvoiceForOrder(req.params['orderId']);
    res.json({ ok: true, data: { invoice } });
  } catch (err) { next(err); }
};

// ── Admin: void an invoice ────────────────────────────────────────────────────

export const voidOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await voidInvoice(req.params['id']);
    res.json({ ok: true, data: { invoice } });
  } catch (err) { next(err); }
};

// ── Customer / store: download PDF ───────────────────────────────────────────

export const downloadPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await getInvoice(req.params['id']);
    await streamInvoicePdf(invoice, res);
  } catch (err) { next(err); }
};
