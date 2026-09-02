import { z } from 'zod';
import { ServiceUnit } from '../enums.js';
import { zObjectId, zMoneyPaisePositive, zPaginationQuery } from './common.js';

// ── Category ─────────────────────────────────────────────────────────────────

export const zCreateCategoryBody = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl:    z.string().url().optional(),
  sortOrder:   z.number().int().nonnegative().default(0),
  enabled:     z.boolean().default(true),
});

export const zUpdateCategoryBody = zCreateCategoryBody.partial();

// ── Service / catalog item ────────────────────────────────────────────────────

export const zCreateServiceBody = z.object({
  categoryId:  zObjectId,
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  unit:        z.nativeEnum(ServiceUnit),
  basePrice:   zMoneyPaisePositive,
  imageUrl:    z.string().url().optional(),
  sortOrder:   z.number().int().nonnegative().default(0),
  enabled:     z.boolean().default(true),
  taxPercent:  z.number().min(0).max(100).optional(),
});

export const zUpdateServiceBody = zCreateServiceBody.partial();

// ── Store-specific price override ─────────────────────────────────────────────

export const zStorePriceOverrideBody = z.object({
  overrides: z.array(z.object({
    serviceId: zObjectId,
    price:     zMoneyPaisePositive,
    enabled:   z.boolean().optional(),
  })).min(1),
});

// ── Catalog query ─────────────────────────────────────────────────────────────

export const zCatalogQuery = zPaginationQuery.extend({
  categoryId: zObjectId.optional(),
  search:     z.string().max(100).optional(),
  enabled:    z.coerce.boolean().optional(),
});

export type CreateCategoryBody      = z.infer<typeof zCreateCategoryBody>;
export type UpdateCategoryBody      = z.infer<typeof zUpdateCategoryBody>;
export type CreateServiceBody       = z.infer<typeof zCreateServiceBody>;
export type UpdateServiceBody       = z.infer<typeof zUpdateServiceBody>;
export type StorePriceOverrideBody  = z.infer<typeof zStorePriceOverrideBody>;
export type CatalogQuery            = z.infer<typeof zCatalogQuery>;
