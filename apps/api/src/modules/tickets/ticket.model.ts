import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { TicketStatus, TicketPriority } from '@ddc/shared';

interface TicketMessage {
  authorId:    Types.ObjectId;
  authorRole:  string;
  message:     string;
  attachments: string[];
  createdAt:   Date;
}

export interface ITicket extends Document {
  _id:          Types.ObjectId;
  ticketRef:    string;
  customerId:   Types.ObjectId;
  orderId?:     Types.ObjectId;
  storeId?:     Types.ObjectId;
  subject:      string;
  status:       TicketStatus;
  priority:     TicketPriority;
  assignedTo?:  Types.ObjectId;
  messages:     TicketMessage[];
  resolvedAt?:  Date;
  closedAt?:    Date;
  createdAt:    Date;
  updatedAt:    Date;
}

const MessageSchema = new Schema<TicketMessage>(
  {
    authorId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorRole:  { type: String, required: true },
    message:     { type: String, required: true },
    attachments: { type: [String], default: [] },
    createdAt:   { type: Date, default: Date.now },
  },
  { _id: false },
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketRef:  { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    orderId:    { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    storeId:    { type: Schema.Types.ObjectId, ref: 'Store', index: true },
    subject:    { type: String, required: true },
    status:     { type: String, enum: Object.values(TicketStatus),   default: TicketStatus.OPEN },
    priority:   { type: String, enum: Object.values(TicketPriority), default: TicketPriority.NORMAL },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    messages:   { type: [MessageSchema], default: [] },
    resolvedAt: Date,
    closedAt:   Date,
  },
  { timestamps: true },
);

TicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
TicketSchema.index({ customerId: 1, status: 1, createdAt: -1 });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
