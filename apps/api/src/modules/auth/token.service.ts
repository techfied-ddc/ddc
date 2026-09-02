import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import type { Response } from 'express';
import { config } from '../../lib/config.js';
import { RefreshToken } from './refreshToken.model.js';
import { AppError } from '../../lib/errors.js';
import type { AccessTokenPayload } from '@ddc/shared';
import type { Role } from '@ddc/shared';

const REFRESH_COOKIE = 'ddc_refresh';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

// ── Sign ──────────────────────────────────────────────────────────────────────

export const signAccessToken = (payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string =>
  jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

/** Creates a raw refresh token + persists a hash in the DB. Returns the raw token. */
export const createRefreshToken = async (userId: string): Promise<{ raw: string; family: string }> => {
  const raw    = nanoid(64);
  const family = nanoid(16);
  const hash   = await argon2.hash(raw);

  await RefreshToken.create({
    userId,
    family,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  return { raw, family };
};

/** Full token pair for a user. */
export const issueTokenPair = async (
  userId:  string,
  role:    Role,
  storeId: string | null,
): Promise<TokenPair> => {
  const { raw, family } = await createRefreshToken(userId);

  const accessToken = signAccessToken({ sub: userId, role, storeId });
  return { accessToken, refreshToken: `${family}.${raw}` };
};

// ── Refresh token rotation ────────────────────────────────────────────────────

export const rotateRefreshToken = async (
  rawToken: string,
): Promise<{ userId: string; role: Role; storeId: string | null; tokens: TokenPair }> => {
  const [family, raw] = rawToken.split('.') as [string, string];
  if (!family || !raw) throw AppError.unauthorized('Invalid refresh token format.');

  // Find all tokens in this family
  const familyTokens = await RefreshToken.find({ family }).sort({ createdAt: -1 });

  if (!familyTokens.length) throw AppError.unauthorized('Refresh token not found.');

  // Detect reuse — if the family exists but the newest is already revoked, nuke the family
  const latestToken = familyTokens[0]!;
  if (latestToken.revoked) {
    await RefreshToken.updateMany({ family }, { revoked: true });
    throw AppError.unauthorized('Refresh token reuse detected. Please log in again.');
  }

  // Verify hash
  const valid = await argon2.verify(latestToken.tokenHash, raw);
  if (!valid) throw AppError.unauthorized('Invalid refresh token.');

  // Revoke used token
  latestToken.revoked = true;
  await latestToken.save();

  // Look up user details (minimal — just role + storeId)
  const { User } = await import('../users/user.model.js');
  const user = await User.findById(latestToken.userId).lean();
  if (!user) throw AppError.unauthorized('User not found.');

  const tokens = await issueTokenPair(
    latestToken.userId.toString(),
    user.role,
    user.storeId?.toString() ?? null,
  );

  return {
    userId:  latestToken.userId.toString(),
    role:    user.role,
    storeId: user.storeId?.toString() ?? null,
    tokens,
  };
};

// ── Cookie helpers ────────────────────────────────────────────────────────────

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure:   config.COOKIE_SECURE,
    sameSite: 'strict',
    domain:   config.COOKIE_DOMAIN,
    maxAge:   REFRESH_TTL_MS,
    path:     '/api/v1/auth',
  });
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure:   config.COOKIE_SECURE,
    sameSite: 'strict',
    domain:   config.COOKIE_DOMAIN,
    path:     '/api/v1/auth',
  });
};

export const getRefreshTokenFromRequest = (req: { cookies: Record<string, string>; body: { refreshToken?: string } }): string | null =>
  req.cookies[REFRESH_COOKIE] ?? req.body.refreshToken ?? null;

// ── Revoke all tokens for a user ──────────────────────────────────────────────
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await RefreshToken.updateMany({ userId, revoked: false }, { revoked: true });
};
