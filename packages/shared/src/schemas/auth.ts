import { z } from 'zod';
import { Role } from '../enums.js';
import { zIndianMobile } from './common.js';

// ── Phone OTP login ─────────────────────────────────────────────────────────

export const zSendOtpBody = z.object({
  phone: zIndianMobile,
});

export const zVerifyOtpBody = z.object({
  phone: zIndianMobile,
  otp:   z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

// ── Google OAuth ─────────────────────────────────────────────────────────────

export const zGoogleCallbackQuery = z.object({
  code:  z.string().min(1),
  state: z.string().optional(),
});

// ── Email + password ─────────────────────────────────────────────────────────

export const zEmailLoginBody = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

export const zEmailRegisterBody = z.object({
  name:     z.string().min(1).max(100),
  email:    z.string().email(),
  password: z.string().min(8).max(128),
  role:     z.enum([Role.STORE_OWNER, Role.STORE_STAFF, Role.RIDER]).optional(),
});

// ── Token refresh ────────────────────────────────────────────────────────────

export const zRefreshTokenBody = z.object({
  // Refresh token is read from httpOnly cookie in normal flow.
  // This body schema is for API clients that can't use cookies.
  refreshToken: z.string().optional(),
});

// ── Profile update ────────────────────────────────────────────────────────────

export const zUpdateProfileBody = z.object({
  name:   z.string().min(1).max(100).optional(),
  email:  z.string().email().optional(),
  phone:  zIndianMobile.optional(),
  avatar: z.string().url().optional(),
});

// ── Password change ───────────────────────────────────────────────────────────

export const zChangePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).max(128),
});

// ── Admin: create user ────────────────────────────────────────────────────────

export const zAdminCreateUserBody = z.object({
  name:     z.string().min(1).max(100),
  email:    z.string().email().optional(),
  phone:    zIndianMobile.optional(),
  role:     z.nativeEnum(Role),
  storeId:  z.string().optional(), // required for STORE_OWNER, STORE_STAFF, RIDER
  password: z.string().min(8).max(128).optional(),
}).refine(
  (d) => {
    const storeRoles = [Role.STORE_OWNER, Role.STORE_STAFF, Role.RIDER];
    return storeRoles.includes(d.role) ? !!d.storeId : true;
  },
  { message: 'storeId is required for store roles', path: ['storeId'] },
);

export type SendOtpBody        = z.infer<typeof zSendOtpBody>;
export type VerifyOtpBody      = z.infer<typeof zVerifyOtpBody>;
export type EmailLoginBody     = z.infer<typeof zEmailLoginBody>;
export type EmailRegisterBody  = z.infer<typeof zEmailRegisterBody>;
export type UpdateProfileBody  = z.infer<typeof zUpdateProfileBody>;
export type ChangePasswordBody = z.infer<typeof zChangePasswordBody>;
export type AdminCreateUserBody = z.infer<typeof zAdminCreateUserBody>;
