import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, path: req.path }, 'Unexpected operational error');
    }
    res.status(err.statusCode).json({
      ok:    false,
      error: {
        code:    err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(422).json({
      ok:    false,
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
    return;
  }

  // Mongoose duplicate key
  if ((err as { code?: number }).code === 11000) {
    res.status(409).json({
      ok:    false,
      error: { code: 'CONFLICT', message: 'A record with these details already exists.' },
    });
    return;
  }

  // Unknown / programming error — don't leak internals
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({
    ok:    false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
};
