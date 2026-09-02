import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { InvoiceStatus } from '@ddc/shared';

interface IInvoiceLineItem {
  serviceId:   Types.ObjectId;
  serviceName: string;
  unit:        string;
  quantity:    number;
  unitPrice:   number; // paise
  lineTotal:   number; // paise
  note?:       string;
}

export interface IInvoice extends Document {
  _id:             Types.ObjectId;
  invoiceRef:      string;          // INV-000001
  orderId:         Types.ObjectId;
  storeId:         Types.ObjectId;
  customerId:      Types.ObjectId;
  status:          InvoiceStatus;
  lines:           IInvoiceLineItem[];
  subtotalPaise:   number;
  discountPaise:   number;
  taxPercent:      number;
  taxPaise:        number;
  totalPaise:      number;
  notes?:          string;
  issuedById?:     Types.ObjectId;
  issuedAt?:       Date;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paidAt?:         Date;
  createdAt:       Date;
  updatedAt:       Date;
}

const LineItemSchema = new Schema<IInvoiceLineItem>(
  {
    serviceId:   { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true },
    unit:        { type: String, required: true },
    quantity:    { type: Number, required: true, min: 0.001 },
    unitPrice:   { type: Number, required: true, min: 0 },
    lineTotal:   { type: Number, required: true, min: 0 },
    note:        String,
  },
  { _id: false },
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceRef:   { type: String, required: true, unique: true, index: true },
    orderId:      { type: Schema.Types.ObjectId, ref: 'Order',  required: true, unique: true, index: true },
    storeId:      { type: Schema.Types.ObjectId, ref: 'Store',  required: true, index: true },
    customerId:   { type: Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
    status:       { type: String, enum: Object.values(InvoiceStatus), default: InvoiceStatus.ISSUED },

    lines:         { type: [LineItemSchema], required: true },
    subtotalPaise: { type: Number, required: true, min: 0 },
    discountPaise: { type: Number, default: 0,    min: 0 },
    taxPercent:    { type: Number, default: 0 },
    taxPaise:      { type: Number, default: 0,    min: 0 },
    totalPaise:    { type: Number, required: true, min: 1 },

    notes:       String,
    issuedById:  { type: Schema.Types.ObjectId, ref: 'User' },
    issuedAt:    Date,

    gatewayOrderId:   String,
    gatewayPaymentId: String,
    paidAt:           Date,
  },
  { timestamps: true },
);

InvoiceSchema.index({ storeId: 1, status: 1, createdAt: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
