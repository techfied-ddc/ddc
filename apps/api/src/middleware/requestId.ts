import type { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = (req.headers['x-request-id'] as string | undefined) ?? nanoid(10);
  // Attach to req so pino-http can read it
  (req as unknown as { id: string }).id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
