import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { PayoutStatus } from '@ddc/shared';
import type { PayoutMethod } from '@ddc/shared';

interface PayoutLine {
  orderId:        Types.ObjectId;
  orderRef:       string;
  invoiceRef:     string;
  invoiceTotalPaise:  number;
  commissionPaise:    number;
  storeSharePaise:    number;
  paymentMode:    string;    // ONLINE | COD
  completedAt:    Date;
}

interface PayoutAdjustment {
  amount:      number;   // signed paise (+credit, -debit)
  description: string;
  by:          Types.ObjectId;
  at:          Date;
}

export interface IPayout extends Document {
  _id:                 Types.ObjectId;
  storeId:             Types.ObjectId;
  periodFrom:          Date;
  periodTo:            Date;
  status:              PayoutStatus;

  lines:               PayoutLine[];
  adjustments:         PayoutAdjustment[];

  totalInvoicedPaise:  number;   // sum of invoice totals
  totalCommissionPaise: number;  // platform keeps this
  onlineSharePaise:    number;   // already received via gateway split
  codReceivablePaise:  number;   // cash at store, owed as commission
  netPayoutPaise:      number;   // storeShare – codReceivable owed back

  method?:             PayoutMethod;
  payoutRef?:          string;   // gateway transfer/payout ID
  gatewayResponse?:    Record<string, unknown>;

  approvedBy?:         Types.ObjectId;
  approvedAt?:         Date;
  paidAt?:             Date;
  notes?:              string;

  createdAt:           Date;
  updatedAt:           Date;
}

const PayoutLineSchema = new Schema<PayoutLine>(
  {
    orderId:            { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    orderRef:           { type: String, required: true },
    invoiceRef:         { type: String, required: true },
    invoiceTotalPaise:  { type: Number, required: true },
    commissionPaise:    { type: Number, required: true },
    storeSharePaise:    { type: Number, required: true },
    paymentMode:        { type: String, required: true },
    completedAt:        { type: Date, required: true },
  },
  { _id: false },
);

const AdjustmentSchema = new Schema<PayoutAdjustment>(
  {
    amount:      { type: Number, required: true },
    description: { type: String, required: true },
    by:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
    at:          { type: Date, default: Date.now },
  },
  { _id: false },
);

const PayoutSchema = new Schema<IPayout>(
  {
    storeId:              { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    periodFrom:           { type: Date, required: true },
    periodTo:             { type: Date, required: true },
    status:               { type: String, enum: Object.values(PayoutStatus), default: PayoutStatus.DRAFT, index: true },

    lines:                { type: [PayoutLineSchema], default: [] },
    adjustments:          { type: [AdjustmentSchema], default: [] },

    totalInvoicedPaise:   { type: Number, default: 0 },
    totalCommissionPaise: { type: Number, default: 0 },
    onlineSharePaise:     { type: Number, default: 0 },
    codReceivablePaise:   { type: Number, default: 0 },
    netPayoutPaise:       { type: Number, default: 0 },

    method:           String,
    payoutRef:        String,
    gatewayResponse:  Schema.Types.Mixed,

    approvedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt:  Date,
    paidAt:      Date,
    notes:       String,
  },
  { timestamps: true },
);

PayoutSchema.index({ storeId: 1, status: 1, createdAt: -1 });
PayoutSchema.index({ periodFrom: 1, periodTo: 1, storeId: 1 }, { unique: true });

export const Payout = mongoose.model<IPayout>('Payout', PayoutSchema);
