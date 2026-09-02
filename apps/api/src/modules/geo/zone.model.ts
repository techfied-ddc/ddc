import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { RoutingMethod } from '@ddc/shared';

export interface IZone extends Document {
  _id:          Types.ObjectId;
  storeId:      Types.ObjectId;
  name:         string;
  method:       RoutingMethod;
  pincodes:     string[];
  polygon?:     { type: 'Polygon'; coordinates: [number, number][][] };
  radiusKm?:    number;
  centerLat?:   number;
  centerLng?:   number;
  priority:     number; // lower = checked first
  enabled:      boolean;
  createdAt:    Date;
  updatedAt:    Date;
}

const ZoneSchema = new Schema<IZone>(
  {
    storeId:    { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name:       { type: String, required: true, trim: true },
    method:     { type: String, enum: Object.values(RoutingMethod), required: true },
    pincodes:   [{ type: String }],
    polygon:    { type: Schema.Types.Mixed },
    radiusKm:   Number,
    centerLat:  Number,
    centerLng:  Number,
    priority:   { type: Number, default: 0 },
    enabled:    { type: Boolean, default: true },
  },
  { timestamps: true },
);

ZoneSchema.index({ 'pincodes': 1, enabled: 1 });
ZoneSchema.index({ storeId: 1, priority: 1 });

export const Zone = mongoose.model<IZone>('Zone', ZoneSchema);
