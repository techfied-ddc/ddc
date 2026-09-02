import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { otpRequestLimiter, otpVerifyLimiter } from '../../middleware/rateLimit.js';
import {
  zSendOtpBody, zVerifyOtpBody,
  zEmailLoginBody, zEmailRegisterBody,
  zChangePasswordBody,
} from '@ddc/shared';
import * as ctrl from './auth.controller.js';
import { z } from 'zod';

export const authRouter = Router();

// ── Phone OTP (primary — customers & riders) ──────────────────────────────────
authRouter.post('/otp/send',
  otpRequestLimiter,
  validate(zSendOtpBody),
  ctrl.sendOtp,
);

authRouter.post('/otp/verify',
  otpVerifyLimiter,
  validate(zVerifyOtpBody),
  ctrl.verifyOtp,
);

// ── Google OAuth (ID token from client SDK) ───────────────────────────────────
authRouter.post('/google',
  validate(z.object({ idToken: z.string().min(1), role: z.string().optional() })),
  ctrl.googleLogin,
);

// ── Email + password (admin & staff — not exposed to customers) ───────────────
authRouter.post('/email/login',
  validate(zEmailLoginBody),
  ctrl.emailLogin,
);

authRouter.post('/email/register',
  validate(zEmailRegisterBody),
  ctrl.emailRegister,
);

// ── Token management ──────────────────────────────────────────────────────────
authRouter.post('/refresh', ctrl.refreshToken);

authRouter.post('/logout', authenticate, ctrl.logout);

authRouter.post('/password/change',
  authenticate,
  validate(zChangePasswordBody),
  ctrl.changePassword,
);
