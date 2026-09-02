import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { ServiceUnit } from '@ddc/shared';

export interface IService extends Document {
  _id:         Types.ObjectId;
  categoryId:  Types.ObjectId;
  name:        string;
  description?: string;
  unit:        ServiceUnit;
  basePrice:   number; // paise
  imageUrl?:   string;
  sortOrder:   number;
  enabled:     boolean;
  taxPercent?: number;
  createdAt:   Date;
  updatedAt:   Date;
}

const ServiceSchema = new Schema<IService>(
  {
    categoryId:  { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name:        { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    unit:        { type: String, enum: Object.values(ServiceUnit), required: true },
    basePrice:   { type: Number, required: true, min: 0 },
    imageUrl:    { type: String },
    sortOrder:   { type: Number, default: 0, min: 0 },
    enabled:     { type: Boolean, default: true },
    taxPercent:  { type: Number, min: 0, max: 100 },
  },
  { timestamps: true },
);

ServiceSchema.index({ categoryId: 1, sortOrder: 1 });
ServiceSchema.index({ enabled: 1 });
ServiceSchema.index({ name: 'text', description: 'text' });

export const Service = mongoose.model<IService>('Service', ServiceSchema);
