import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@ddc/shared';
import { AppError } from '../lib/errors.js';

/**
 * RBAC guard factory. Default-deny: a route with no authorize() call is a bug.
 * Usage: router.get('/admin-only', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), handler)
 */
export const authorize =
  (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());

    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(AppError.forbidden());
    }

    next();
  };

/**
 * Guard that ensures the authenticated user is accessing their own resource,
 * OR is an admin/super-admin.
 */
export const authorizeOwnerOrAdmin = (getOwnerId: (req: Request) => string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());

    const { sub, role } = req.user;
    const ownerId = getOwnerId(req);

    if (sub === ownerId || role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return next();
    }

    next(AppError.forbidden());
  };

/**
 * Guard that ensures the actor belongs to a specific store.
 * Compares req.user.storeId to req.params.storeId or a custom extractor.
 */
export const authorizeStoreActor =
  (getStoreId?: (req: Request) => string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());

    const { storeId, role } = req.user;
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return next();

    const targetStore = getStoreId ? getStoreId(req) : req.params['storeId'];
    if (storeId && storeId === targetStore) return next();

    next(AppError.forbidden());
  };
