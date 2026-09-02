import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import {
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshTokenFromRequest,
} from './token.service.js';

// POST /api/v1/auth/otp/send
export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email: string };
    await authService.initiateEmailLogin(email);
    res.json({ ok: true, data: { message: 'OTP sent.' } });
  } catch (err) { next(err); }
};

// POST /api/v1/auth/otp/verify
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body as { email: string; otp: string };
    const { tokens, userId, isNew } = await authService.completeEmailLogin(email, otp);

    setRefreshCookie(res, tokens.refreshToken);

    res.json({
      ok: true,
      data: {
        accessToken: tokens.accessToken,
        userId,
        isNew,
      },
    });
  } catch (err) { next(err); }
};

// POST /api/v1/auth/google
export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken, role } = req.body;
    const { tokens, userId, isNew } = await authService.handleGoogleCallback(idToken, role);

    setRefreshCookie(res, tokens.refreshToken);

    res.json({ ok: true, data: { accessToken: tokens.accessToken, userId, isNew } });
  } catch (err) { next(err); }
};

// POST /api/v1/auth/email/login
export const emailLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { tokens, userId } = await authService.loginWithEmail(email, password);

    setRefreshCookie(res, tokens.refreshToken);

    res.json({ ok: true, data: { accessToken: tokens.accessToken, userId } });
  } catch (err) { next(err); }
};

// POST /api/v1/auth/email/register
export const emailRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tokens, userId } = await authService.registerWithEmail(req.body);

    setRefreshCookie(res, tokens.refreshToken);

    res.status(201).json({ ok: true, data: { accessToken: tokens.accessToken, userId } });
  } catch (err) { next(err); }
};

// POST /api/v1/auth/refresh
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = getRefreshTokenFromRequest(req);
    if (!raw) {
      return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token.' } });
    }

    const result = await authService.refreshAccessToken(raw);
    setRefreshCookie(res, result.tokens.refreshToken);

    res.json({ ok: true, data: { accessToken: result.tokens.accessToken } });
  } catch (err) { next(err); }
};

// POST /api/v1/auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await authService.logoutUser(req.user.sub);
    }
    clearRefreshCookie(res);
    res.json({ ok: true, data: { message: 'Logged out.' } });
  } catch (err) { next(err); }
};

// POST /api/v1/auth/password/change
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.sub, currentPassword, newPassword);
    res.json({ ok: true, data: { message: 'Password updated.' } });
  } catch (err) { next(err); }
};
