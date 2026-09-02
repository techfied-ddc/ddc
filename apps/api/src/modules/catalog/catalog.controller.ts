import type { Request, Response, NextFunction } from 'express';
import { Category } from './category.model.js';
import { Service } from './service.model.js';
import { StorePriceOverride } from './store-price-override.model.js';
import { AppError } from '../../lib/errors.js';
import { DEFAULT_PAGE_SIZE } from '@ddc/shared';

// ── Categories (admin) ────────────────────────────────────────────────────────

export const listCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ ok: true, data: { categories: cats } });
  } catch (err) { next(err); }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ ok: true, data: { category: cat } });
  } catch (err) { next(err); }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params['id'], req.body, { new: true, runValidators: true }).lean();
    if (!cat) return next(AppError.notFound('Category', req.params['id']));
    res.json({ ok: true, data: { category: cat } });
  } catch (err) { next(err); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params['id']).lean();
    if (!cat) return next(AppError.notFound('Category', req.params['id']));
    res.json({ ok: true, data: { message: 'Category deleted.' } });
  } catch (err) { next(err); }
};

// ── Services (admin) ──────────────────────────────────────────────────────────

export const listServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, search, enabled, page = 1, limit = DEFAULT_PAGE_SIZE } = req.query as Record<string, string>;
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));

    const filter: Record<string, unknown> = {};
    if (categoryId) filter['categoryId'] = categoryId;
    if (enabled !== undefined) filter['enabled'] = enabled === 'true';
    if (search) filter['$text'] = { $search: search };

    const [items, total] = await Promise.all([
      Service.find(filter).sort({ sortOrder: 1, name: 1 }).skip((p - 1) * l).limit(l).lean(),
      Service.countDocuments(filter),
    ]);

    res.json({ ok: true, data: { items, total, page: p, limit: l, pages: Math.ceil(total / l) } });
  } catch (err) { next(err); }
};

export const createService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const svc = await Service.create(req.body);
    res.status(201).json({ ok: true, data: { service: svc } });
  } catch (err) { next(err); }
};

export const updateService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const svc = await Service.findByIdAndUpdate(req.params['id'], req.body, { new: true, runValidators: true }).lean();
    if (!svc) return next(AppError.notFound('Service', req.params['id']));
    res.json({ ok: true, data: { service: svc } });
  } catch (err) { next(err); }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const svc = await Service.findByIdAndDelete(req.params['id']).lean();
    if (!svc) return next(AppError.notFound('Service', req.params['id']));
    res.json({ ok: true, data: { message: 'Service deleted.' } });
  } catch (err) { next(err); }
};

// ── Public catalog (customer-facing) ─────────────────────────────────────────

export const getPublicCatalog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.query['storeId'] as string | undefined;

    // Fetch all enabled categories
    const [categories, services] = await Promise.all([
      Category.find({ enabled: true }).sort({ sortOrder: 1 }).lean(),
      Service.find({ enabled: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    ]);

    // If a storeId is provided, fetch price overrides and apply them
    const priceOverrides: Map<string, number> = new Map();
    if (storeId) {
      const overrides = await StorePriceOverride.find({ storeId, enabled: true }).lean();
      overrides.forEach((o) => { priceOverrides.set(o.serviceId.toString(), o.price); });
    }

    // Build catalog: categories with nested services + effective prices
    const catalog = categories.map((cat) => ({
      ...cat,
      services: services
        .filter((s) => s.categoryId.toString() === cat._id.toString())
        .map((s) => ({
          ...s,
          effectivePrice: priceOverrides.get(s._id.toString()) ?? s.basePrice,
        })),
    }));

    res.json({ ok: true, data: { catalog } });
  } catch (err) { next(err); }
};

// ── Store price overrides (store owner / staff) ───────────────────────────────

export const upsertPriceOverrides = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params['storeId'];
    const { overrides } = req.body as { overrides: { serviceId: string; price: number; enabled?: boolean }[] };

    const ops = overrides.map(({ serviceId, price, enabled = true }) => ({
      updateOne: {
        filter:  { storeId, serviceId },
        update:  { $set: { price, enabled } },
        upsert:  true,
      },
    }));

    await StorePriceOverride.bulkWrite(ops);
    res.json({ ok: true, data: { message: 'Price overrides updated.' } });
  } catch (err) { next(err); }
};

export const getStoreOverrides = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overrides = await StorePriceOverride.find({ storeId: req.params['storeId'] }).lean();
    res.json({ ok: true, data: { overrides } });
  } catch (err) { next(err); }
};
