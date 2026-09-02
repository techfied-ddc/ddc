import mongoose, { type Document, type Model } from 'mongoose';
import { Role, UserStatus, AuthMethod } from '@ddc/shared';

export interface IUser extends Document {
  name:            string;
  email?:          string;
  phone?:          string;
  passwordHash?:   string;
  googleId?:       string;
  avatar?:         string;
  role:            Role;
  status:          UserStatus;
  storeId?:        mongoose.Types.ObjectId;
  authMethods:     AuthMethod[];
  // Push notification subscriptions
  pushSubscriptions: Array<{
    endpoint:   string;
    p256dh:     string;
    auth:       string;
    createdAt:  Date;
  }>;
  // Notification preferences
  notifyByPush:    boolean;
  notifyBySms:     boolean;
  notifyByEmail:   boolean;
  createdAt:       Date;
  updatedAt:       Date;
}

const pushSubSchema = new mongoose.Schema(
  {
    endpoint:  { type: String, required: true },
    p256dh:    { type: String, required: true },
    auth:      { type: String, required: true },
    createdAt: { type: Date,   default: () => new Date() },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema<IUser>(
  {
    name:          { type: String, required: true, trim: true, maxlength: 100 },
    email:         { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone:         { type: String, unique: true, sparse: true, trim: true },
    passwordHash:  { type: String },
    googleId:      { type: String, unique: true, sparse: true },
    avatar:        { type: String },
    role:          { type: String, enum: Object.values(Role), required: true },
    status:        { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    storeId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Store', index: true },
    authMethods:   [{ type: String, enum: Object.values(AuthMethod) }],
    pushSubscriptions: [pushSubSchema],
    notifyByPush:  { type: Boolean, default: true },
    notifyBySms:   { type: Boolean, default: true },
    notifyByEmail: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound index for store-role lookups
userSchema.index({ storeId: 1, role: 1 });
userSchema.index({ status: 1 });

export const User: Model<IUser> = mongoose.models['User'] ?? mongoose.model<IUser>('User', userSchema);
