import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IStorePriceOverride extends Document {
  _id:       Types.ObjectId;
  storeId:   Types.ObjectId;
  serviceId: Types.ObjectId;
  price:     number; // paise
  enabled:   boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StorePriceOverrideSchema = new Schema<IStorePriceOverride>(
  {
    storeId:   { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    price:     { type: Number, required: true, min: 0 },
    enabled:   { type: Boolean, default: true },
  },
  { timestamps: true },
);

StorePriceOverrideSchema.index({ storeId: 1, serviceId: 1 }, { unique: true });
StorePriceOverrideSchema.index({ storeId: 1 });

export const StorePriceOverride = mongoose.model<IStorePriceOverride>('StorePriceOverride', StorePriceOverrideSchema);
