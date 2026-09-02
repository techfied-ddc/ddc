import { z } from 'zod';
import { zObjectId, zMoneyPaise, zMoneyPaisePositive, zPercent } from './common.js';

export const zInvoiceLineItem = z.object({
  serviceId:   zObjectId,
  serviceName: z.string().min(1).max(200),
  unit:        z.string().min(1).max(50), // 'per_piece', 'per_kg', 'per_pair'
  quantity:    z.number().positive(),
  unitPrice:   zMoneyPaisePositive,
  lineTotal:   zMoneyPaisePositive,
  note:        z.string().max(500).optional(),
});

export const zIssueInvoiceBody = z.object({
  lines:         z.array(zInvoiceLineItem).min(1, 'Invoice must have at least one line'),
  taxPercent:    zPercent.optional(),        // defaults to store/global setting
  discountPaise: zMoneyPaise.optional(),     // flat discount in paise
  notes:         z.string().max(2000).optional(),
});

export type InvoiceLineItem  = z.infer<typeof zInvoiceLineItem>;
export type IssueInvoiceBody = z.infer<typeof zIssueInvoiceBody>;
