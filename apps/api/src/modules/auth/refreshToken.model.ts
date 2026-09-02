import mongoose, { type Document, type Model } from 'mongoose';

export interface IRefreshToken extends Document {
  userId:     mongoose.Types.ObjectId;
  family:     string;   // nanoid — ties a rotation chain together
  tokenHash:  string;   // argon2 hash of the raw refresh token
  expiresAt:  Date;
  revoked:    boolean;
  createdAt:  Date;
}

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    family:    { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date,   required: true },
    revoked:   { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL — Mongo removes expired tokens automatically
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken: Model<IRefreshToken> =
  mongoose.models['RefreshToken'] ??
  mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
