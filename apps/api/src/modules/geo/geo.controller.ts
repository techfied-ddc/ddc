import type { Request, Response, NextFunction } from 'express';
import { routeOrder } from './geo.service.js';
import { AppError } from '../../lib/errors.js';

// POST /api/v1/geo/route
// Body: { pincode, lat?, lng? }
// Used by admin/store to preview routing without placing an order.
export const previewRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pincode, lat, lng } = req.body as { pincode: string; lat?: number; lng?: number };
    if (!pincode) return next(new AppError(400, 'MISSING_PINCODE', 'pincode is required.'));

    const result = await routeOrder({ pincode, lat, lng });
    if (!result) {
      return res.json({ ok: true, data: { routed: false, message: 'No matching store found for the given location.' } });
    }

    res.json({ ok: true, data: { routed: true, storeId: result.storeId, method: result.method } });
  } catch (err) { next(err); }
};
