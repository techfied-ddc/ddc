import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { StoreStatus, LinkedAccountStatus } from '@ddc/shared';

interface SlotWindow {
  _id:        Types.ObjectId;
  label:      string;
  start:      string; // HH:MM
  end:        string; // HH:MM
  daysOfWeek: number[]; // 0=Sun..6=Sat
  capacity:   number;
  enabled:    boolean;
}

interface DayHours {
  open:   string;
  close:  string;
  closed: boolean;
}

interface SlaOverride {
  categoryId: Types.ObjectId;
  tatHours:   number;
}

export interface IStore extends Document {
  _id:                 Types.ObjectId;
  name:                string;
  ownerUserId:         Types.ObjectId;
  address: {
    line1:   string;
    line2?:  string;
    city:    string;
    state:   string;
    pincode: string;
    country: string;
    lat?:    number;
    lng?:    number;
  };
  phone:               string;
  email?:              string;
  logoUrl?:            string;
  gstin?:              string;
  status:              StoreStatus;
  taxPercent:          number;
  commissionPercent:   number;

  // Service area
  serviceArea: {
    pincodes:  string[];
    polygon?:  { type: 'Polygon'; coordinates: [number, number][][] };
    radiusKm?: number;
  };

  // Pickup slot configuration
  pickupSlots: {
    enabled:         boolean;
    leadTimeMinutes: number;
    horizonDays:     number;
    windows:         SlotWindow[];
  };

  // SLA / TAT
  sla: {
    defaultTatHours: number;
    categoryOverrides: SlaOverride[];
  };

  // Operating hours
  operatingHours?: {
    monday:    DayHours;
    tuesday:   DayHours;
    wednesday: DayHours;
    thursday:  DayHours;
    friday:    DayHours;
    saturday:  DayHours;
    sunday:    DayHours;
  };

  // Payment gateway linked account
  linkedAccountId?:     string;
  linkedAccountStatus:  LinkedAccountStatus;

  createdAt: Date;
  updatedAt: Date;
}

const DayHoursSchema = new Schema<DayHours>({ open: String, close: String, closed: { type: Boolean, default: false } }, { _id: false });
const SlotWindowSchema = new Schema<SlotWindow>({
  label:      { type: String, required: true },
  start:      { type: String, required: true },
  end:        { type: String, required: true },
  daysOfWeek: [{ type: Number }],
  capacity:   { type: Number, required: true },
  enabled:    { type: Boolean, default: true },
});

const StoreSchema = new Schema<IStore>(
  {
    name:                { type: String, required: true, trim: true, maxlength: 200 },
    ownerUserId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    address: {
      line1:   { type: String, required: true },
      line2:   String,
      city:    { type: String, required: true },
      state:   { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'IN' },
      lat:     Number,
      lng:     Number,
    },
    phone:               { type: String, required: true },
    email:               String,
    logoUrl:             String,
    gstin:               String,
    status:              { type: String, enum: Object.values(StoreStatus), default: StoreStatus.PENDING, index: true },
    taxPercent:          { type: Number, default: 18, min: 0, max: 100 },
    commissionPercent:   { type: Number, default: 20, min: 0, max: 100 },

    serviceArea: {
      pincodes: [{ type: String }],
      polygon:  { type: Schema.Types.Mixed },
      radiusKm: Number,
    },

    pickupSlots: {
      enabled:         { type: Boolean, default: true },
      leadTimeMinutes: { type: Number, default: 60 },
      horizonDays:     { type: Number, default: 7 },
      windows:         { type: [SlotWindowSchema], default: [] },
    },

    sla: {
      defaultTatHours:   { type: Number, default: 48 },
      categoryOverrides: [{
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
        tatHours:   Number,
      }],
    },

    operatingHours: {
      monday:    DayHoursSchema,
      tuesday:   DayHoursSchema,
      wednesday: DayHoursSchema,
      thursday:  DayHoursSchema,
      friday:    DayHoursSchema,
      saturday:  DayHoursSchema,
      sunday:    DayHoursSchema,
    },

    linkedAccountId:     String,
    linkedAccountStatus: { type: String, enum: Object.values(LinkedAccountStatus), default: LinkedAccountStatus.NONE },
  },
  { timestamps: true },
);

StoreSchema.index({ 'serviceArea.pincodes': 1 });
StoreSchema.index({ status: 1, 'serviceArea.pincodes': 1 });

export const Store = mongoose.model<IStore>('Store', StoreSchema);
