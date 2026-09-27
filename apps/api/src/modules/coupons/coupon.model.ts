import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { CouponType } from '@ddc/shared';

export interface ICoupon extends Document {
  _id:              Types.ObjectId;
  code:             string;
  type:             CouponType;
  value:            number;           // percent (0-100) or paise
  minOrderPaise?:   number;
  maxDiscountPaise?: number;
  usageLimit?:      number;           // total uses allowed, undefined = unlimited
  usageLimitPerUser?: number;
  usageCount:       number;           // current total usage
  validFrom:        Date;
  validUntil:       Date;
  storeIds:         Types.ObjectId[]; // empty = all stores
  enabled:          boolean;
  description?:     string;
  createdAt:        Date;
  updatedAt:        Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code:             { type: String, required: true, uppercase: true, trim: true },
    type:             { type: String, enum: Object.values(CouponType), required: true },
    value:            { type: Number, required: true, min: 0 },
    minOrderPaise:    Number,
    maxDiscountPaise: Number,
    usageLimit:       Number,
    usageLimitPerUser: Number,
    usageCount:       { type: Number, default: 0, min: 0 },
    validFrom:        { type: Date, required: true },
    validUntil:       { type: Date, required: true },
    storeIds:         [{ type: Schema.Types.ObjectId, ref: 'Store' }],
    enabled:          { type: Boolean, default: true },
    description:      String,
  },
  { timestamps: true },
);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ enabled: 1, validFrom: 1, validUntil: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
