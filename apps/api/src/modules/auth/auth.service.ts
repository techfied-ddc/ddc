import bcrypt from 'bcryptjs';
import { google } from 'googleapis';
import { User } from '../users/user.model.js';
import { config } from '../../lib/config.js';
import { AppError } from '../../lib/errors.js';
import { issueTokenPair, rotateRefreshToken, revokeAllUserTokens } from './token.service.js';
import { sendLoginOtp, verifyLoginOtp } from './otp.service.js';
import { Role, AuthMethod, UserStatus } from '@ddc/shared';
import type { TokenPair } from './token.service.js';

const googleClient = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID);

// ── Email OTP ─────────────────────────────────────────────────────────────────

export const initiateEmailLogin = async (email: string): Promise<void> => {
  await sendLoginOtp(email);
};

export const completeEmailLogin = async (
  email: string,
  otp: string,
): Promise<{ tokens: TokenPair; userId: string; isNew: boolean }> => {
  await verifyLoginOtp(email, otp);

  let isNew = false;
  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // First-time customer registration via OTP
    user = await User.create({
      email:       email.toLowerCase(),
      name:        'Customer',
      role:        Role.CUSTOMER,
      status:      UserStatus.ACTIVE,
      authMethods: [AuthMethod.EMAIL_OTP],
    });
    isNew = true;
  } else if (user.status !== UserStatus.ACTIVE) {
    throw AppError.forbidden('Your account has been deactivated. Please contact support.');
  }

  if (!user.authMethods.includes(AuthMethod.EMAIL_OTP)) {
    user.authMethods.push(AuthMethod.EMAIL_OTP);
    await user.save();
  }

  const tokens = await issueTokenPair(
    user._id.toString(),
    user.role,
    user.storeId?.toString() ?? null,
  );

  return { tokens, userId: user._id.toString(), isNew };
};

// ── Google OAuth ──────────────────────────────────────────────────────────────

export const handleGoogleCallback = async (
  idToken: string,
  role: Role = Role.CUSTOMER,
): Promise<{ tokens: TokenPair; userId: string; isNew: boolean }> => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw AppError.unauthorized('Invalid Google token.');
  }

  let isNew = false;
  let user = await User.findOne({
    $or: [{ googleId: payload.sub }, { email: payload.email }],
  });

  if (!user) {
    user = await User.create({
      name:        payload.name ?? payload.email,
      email:       payload.email,
      googleId:    payload.sub,
      avatar:      payload.picture,
      role,
      status:      UserStatus.ACTIVE,
      authMethods: [AuthMethod.GOOGLE],
    });
    isNew = true;
  } else {
    if (user.status !== UserStatus.ACTIVE) {
      throw AppError.forbidden('Account deactivated. Please contact support.');
    }
    // Link Google ID if not already
    if (!user.googleId) {
      user.googleId = payload.sub;
      if (!user.authMethods.includes(AuthMethod.GOOGLE)) user.authMethods.push(AuthMethod.GOOGLE);
      await user.save();
    }
  }

  const tokens = await issueTokenPair(
    user._id.toString(),
    user.role,
    user.storeId?.toString() ?? null,
  );

  return { tokens, userId: user._id.toString(), isNew };
};

// ── Email + password ──────────────────────────────────────────────────────────

export const loginWithEmail = async (
  email: string,
  password: string,
): Promise<{ tokens: TokenPair; userId: string }> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.passwordHash) {
    // Constant-time comparison to avoid timing attacks
    await bcrypt.compare(password, '$2a$12$invalidHashForTimingProtection000000000000000000000000');
    throw AppError.unauthorized('Invalid email or password.');
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw AppError.forbidden('Account deactivated. Please contact support.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw AppError.unauthorized('Invalid email or password.');

  const tokens = await issueTokenPair(
    user._id.toString(),
    user.role,
    user.storeId?.toString() ?? null,
  );

  return { tokens, userId: user._id.toString() };
};

export const registerWithEmail = async (params: {
  name:     string;
  email:    string;
  password: string;
  role?:    Role;
}): Promise<{ tokens: TokenPair; userId: string }> => {
  const existing = await User.findOne({ email: params.email.toLowerCase() });
  if (existing) throw AppError.conflict('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(params.password, 12);

  const user = await User.create({
    name:        params.name,
    email:       params.email.toLowerCase(),
    passwordHash,
    role:        params.role ?? Role.CUSTOMER,
    status:      UserStatus.ACTIVE,
    authMethods: [AuthMethod.PASSWORD],
  });

  const tokens = await issueTokenPair(
    user._id.toString(),
    user.role,
    user.storeId?.toString() ?? null,
  );

  return { tokens, userId: user._id.toString() };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User', userId);

  if (user.passwordHash) {
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Current password is incorrect.');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  if (!user.authMethods.includes(AuthMethod.PASSWORD)) {
    user.authMethods.push(AuthMethod.PASSWORD);
  }
  await user.save();
};

// ── Refresh token ─────────────────────────────────────────────────────────────

export const refreshAccessToken = (rawToken: string) => rotateRefreshToken(rawToken);

// ── Logout ────────────────────────────────────────────────────────────────────

export const logoutUser = async (userId: string): Promise<void> => {
  await revokeAllUserTokens(userId);
};
