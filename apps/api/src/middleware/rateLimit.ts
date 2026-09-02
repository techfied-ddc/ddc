import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '@ddc/shared';

const defaultHandler = (_req: unknown, res: { status: (n: number) => { json: (b: object) => void } }) =>
  res.status(429).json({
    ok:    false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
  });

export const otpRequestLimiter = rateLimit({
  ...RATE_LIMIT.OTP_REQUEST,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         defaultHandler,
});

export const otpVerifyLimiter = rateLimit({
  ...RATE_LIMIT.OTP_VERIFY,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         defaultHandler,
});

export const couponApplyLimiter = rateLimit({
  ...RATE_LIMIT.COUPON_APPLY,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         defaultHandler,
});

export const ticketCreateLimiter = rateLimit({
  ...RATE_LIMIT.TICKET_CREATE,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         defaultHandler,
});
