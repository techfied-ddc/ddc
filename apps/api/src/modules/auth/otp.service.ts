import argon2 from 'argon2';
import { AuthOtp, otpExpiryDate } from './authOtp.model.js';
import { getEmailOtpAdapter } from '../notifications/channels/email/resend.adapter.js';
import { AppError, ErrorCode } from '../../lib/errors.js';
import { getRedis } from '../../lib/redis.js';
import {
  LOGIN_OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_PER_HOUR_PER_PHONE,
} from '@ddc/shared';

const hourlyKey = (email: string) => `otp:hourly:${email}`;
const cooldownKey = (email: string) => `otp:cd:${email}`;

/** Generate a numeric OTP of the given length. */
const generateOtp = (length = LOGIN_OTP_LENGTH): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

// ── Send OTP ──────────────────────────────────────────────────────────────────

export const sendLoginOtp = async (email: string): Promise<void> => {
  const redis = getRedis();

  // Hourly rate limit
  const hourlyCount = await redis.incr(hourlyKey(email));
  if (hourlyCount === 1) await redis.expire(hourlyKey(email), 3600);
  if (hourlyCount > OTP_MAX_PER_HOUR_PER_PHONE) {
    throw new AppError(429, ErrorCode.OTP_RATE_LIMITED,
      `Too many OTP requests. Please try again in ${Math.ceil((3600 - (await redis.ttl(hourlyKey(email)))) / 60)} minutes.`);
  }

  // Resend cooldown
  const cooldownTtl = await redis.ttl(cooldownKey(email));
  if (cooldownTtl > 0) {
    throw new AppError(429, ErrorCode.OTP_RATE_LIMITED,
      `Please wait ${cooldownTtl} seconds before requesting another OTP.`);
  }

  const otp  = generateOtp();
  const hash = await argon2.hash(otp);

  // Upsert: replace any existing OTP for this email
  await AuthOtp.findOneAndUpdate(
    { email },
    { email, otpHash: hash, attempts: 0, expiresAt: otpExpiryDate() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Set resend cooldown
  await redis.set(cooldownKey(email), '1', 'EX', OTP_RESEND_COOLDOWN_SECONDS);

  await getEmailOtpAdapter().sendOtp(email, otp);
};

// ── Verify OTP ────────────────────────────────────────────────────────────────

/** Returns true if valid. Deletes the OTP doc on success. Throws AppError on failure. */
export const verifyLoginOtp = async (email: string, otp: string): Promise<true> => {
  const record = await AuthOtp.findOne({ email });

  if (!record) {
    throw new AppError(400, ErrorCode.INVALID_OTP, 'No OTP found for this email. Please request a new one.');
  }

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    throw new AppError(400, ErrorCode.OTP_EXPIRED, 'OTP has expired. Please request a new one.');
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await record.deleteOne();
    throw new AppError(429, ErrorCode.OTP_MAX_ATTEMPTS, 'Too many incorrect attempts. Please request a new OTP.');
  }

  const valid = await argon2.verify(record.otpHash, otp);

  if (!valid) {
    record.attempts += 1;
    await record.save();
    const remaining = OTP_MAX_ATTEMPTS - record.attempts;
    throw new AppError(400, ErrorCode.INVALID_OTP,
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Incorrect OTP. Please request a new one.',
    );
  }

  await record.deleteOne();
  return true;
};
