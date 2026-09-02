import mongoose, { type Document, type Model } from 'mongoose';
import { LOGIN_OTP_TTL_MINUTES } from '@ddc/shared';

export interface IAuthOtp extends Document {
  email:      string;
  otpHash:    string;
  attempts:   number;
  expiresAt:  Date;
  createdAt:  Date;
}

const authOtpSchema = new mongoose.Schema<IAuthOtp>(
  {
    email:     { type: String, required: true, index: true },
    otpHash:   { type: String, required: true },
    attempts:  { type: Number, default: 0 },
    expiresAt: { type: Date,   required: true },
  },
  {
    timestamps:  { createdAt: true, updatedAt: false },
    expireAfterSeconds: 0, // Mongo uses the expiresAt field via TTL index
  },
);

// TTL index — Mongo auto-deletes expired documents
authOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Unique email: one active OTP per email at a time
authOtpSchema.index({ email: 1 }, { unique: true });

export const AuthOtp: Model<IAuthOtp> =
  mongoose.models['AuthOtp'] ?? mongoose.model<IAuthOtp>('AuthOtp', authOtpSchema);

/** Return the OTP expiry Date (from now + LOGIN_OTP_TTL_MINUTES). */
export const otpExpiryDate = (): Date =>
  new Date(Date.now() + LOGIN_OTP_TTL_MINUTES * 60 * 1000);
