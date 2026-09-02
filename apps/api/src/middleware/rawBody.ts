import type { Request, Response, NextFunction } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

/**
 * Captures the raw request body as a Buffer on req.rawBody.
 * Used for payment webhook signature verification.
 * Must be registered BEFORE express.json() for webhook routes.
 */
export const rawBody = (req: Request, _res: Response, next: NextFunction): void => {
  const chunks: Buffer[] = [];

  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
  req.on('error', next);
};
