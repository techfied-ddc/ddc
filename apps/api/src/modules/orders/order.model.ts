import mongoose, { Schema, type Document, type Types } from 'mongoose';
import {
  OrderStatus, PaymentMode, PaymentStatus, ServiceUnit, RoutingMethod,
} from '@ddc/shared';

interface OrderLineItem {
  serviceId:    Types.ObjectId;
  serviceName:  string; // snapshot at placement
  categoryName: string;
  unit:         ServiceUnit;
  quantity:     number;
  unitPrice:    number; // paise (estimate or invoice price)
  note?:        string;
}

interface PickupSlotRef {
  date:        string;       // YYYY-MM-DD
  windowId:    string;       // slot window identifier (ObjectId hex or fallback string)
  windowLabel: string;       // populated after routing
  start:       string;       // HH:MM, populated after routing
  end:         string;
}

interface StatusEvent {
  status:    OrderStatus;
  at:        Date;
  by?:       Types.ObjectId; // userId who triggered
  byRole?:   string;
  note?:     string;
}

export interface IOrder extends Document {
  _id:               Types.ObjectId;
  orderRef:          string;     // DPD-XXXXXX
  userId:            Types.ObjectId;
  storeId?:          Types.ObjectId;

  items:             OrderLineItem[];
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
  pickupSlot:        PickupSlotRef;
  note?:             string;

  status:            OrderStatus;
  statusHistory:     StatusEvent[];

  paymentMode:       PaymentMode;
  paymentStatus:     PaymentStatus;
  estimatePaise:     number;       // non-binding cart total
  discountPaise:     number;       // coupon discount
  invoiceId?:        Types.ObjectId;
  paymentIntentId?:  string;       // gateway reference
  gatewayOrderId?:   string;

  couponCode?:       string;

  pickupOtpHash?:    string;       // argon2 hash of the 4-digit code
  deliveryOtpHash?:  string;

  pickupRiderId?:    Types.ObjectId;
  deliveryRiderId?:  Types.ObjectId;

  garmentPhotos:     string[];     // Cloudinary URLs after store receive
  cancelReason?:     string;

  rating?: {
    score:    number;  // 1-5
    comment?: string;
    at:       Date;
  };

  routingMethod?: RoutingMethod;
  slaDeliveryBy?: Date;           // estimated delivery deadline

  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<OrderLineItem>(
  {
    serviceId:    { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName:  { type: String, required: true },
    categoryName: { type: String, required: true },
    unit:         { type: String, enum: Object.values(ServiceUnit), required: true },
    quantity:     { type: Number, required: true, min: 1 },
    unitPrice:    { type: Number, required: true, min: 0 },
    note:         String,
  },
  { _id: false },
);

const StatusEventSchema = new Schema<StatusEvent>(
  {
    status:  { type: String, enum: Object.values(OrderStatus), required: true },
    at:      { type: Date, default: Date.now },
    by:      { type: Schema.Types.ObjectId, ref: 'User' },
    byRole:  String,
    note:    String,
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderRef:    { type: String, required: true, unique: true, index: true },
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storeId:     { type: Schema.Types.ObjectId, ref: 'Store', index: true },

    items:       { type: [LineItemSchema], required: true },
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
    pickupSlot: {
      date:        { type: String, required: true },
      windowId:    { type: String, required: true },
      windowLabel: { type: String, default: '' },
      start:       { type: String, default: '' },
      end:         { type: String, default: '' },
    },
    note:        String,

    status:        { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PLACED, index: true },
    statusHistory: { type: [StatusEventSchema], default: [] },

    paymentMode:   { type: String, enum: Object.values(PaymentMode), required: true },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.NONE },
    estimatePaise: { type: Number, required: true, min: 0 },
    discountPaise: { type: Number, default: 0, min: 0 },
    invoiceId:     { type: Schema.Types.ObjectId, ref: 'Invoice' },
    paymentIntentId: String,
    gatewayOrderId:  String,

    couponCode:    String,

    pickupOtpHash:   String,
    deliveryOtpHash: String,

    pickupRiderId:   { type: Schema.Types.ObjectId, ref: 'User' },
    deliveryRiderId: { type: Schema.Types.ObjectId, ref: 'User' },

    garmentPhotos: { type: [String], default: [] },
    cancelReason:  String,

    rating: {
      score:   { type: Number, min: 1, max: 5 },
      comment: String,
      at:      Date,
    },

    routingMethod: { type: String, enum: Object.values(RoutingMethod) },
    slaDeliveryBy: Date,
  },
  { timestamps: true },
);

// Compound indexes for common queries
OrderSchema.index({ userId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ storeId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ 'pickupSlot.date': 1, storeId: 1, 'pickupSlot.windowId': 1 });
OrderSchema.index({ status: 1, createdAt: -1 }); // admin list

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
