import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../lib/errors.js';

type Source = 'body' | 'query' | 'params';

/**
 * Validates req[source] against the given Zod schema.
 * Replaces req[source] with the parsed (coerced, defaulted) value on success.
 * Returns 422 with structured field errors on failure.
 */
export const validate =
  (schema: ZodSchema, source: Source = 'body'): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      return next(
        AppError.validation(
          'Request validation failed. Check the details for field-level errors.',
          details,
        ),
      );
    }

    // Replace with parsed value (coercions + defaults applied)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[source] = result.data;
    next();
  };
