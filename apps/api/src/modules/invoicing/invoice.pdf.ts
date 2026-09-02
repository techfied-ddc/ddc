// Invoice PDF generator using pdfkit.
// Called server-side; streams directly to the Express response.
import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { IInvoice } from './invoice.model.js';
import { Store } from '../stores/store.model.js';
import { User } from '../users/user.model.js';
const BRAND_NAME   = 'Desire Premium Dry Cleaning';

/** Format integer paise as ₹X.XX */
function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}
const SUPPORT_EMAIL = 'support@desiredrycleaning.in';
const GOLD          = '#D4AF37';
const BLACK         = '#0B0B0C';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  });
}

export async function streamInvoicePdf(invoice: IInvoice, res: Response): Promise<void> {
  const [store, customer] = await Promise.all([
    Store.findById(invoice.storeId).lean(),
    User.findById(invoice.customerId).select('name phone email').lean(),
  ]);

  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${invoice.invoiceRef}.pdf"`,
  );
  doc.pipe(res);

  // ── Header ──────────────────────────────────────────────────────────────────
  doc
    .fillColor(BLACK)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(BRAND_NAME, 50, 50);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#555555')
    .text(store?.address
      ? `${store.address.line1}, ${store.address.city} ${store.address.pincode}`
      : '', 50, 75)
    .text(SUPPORT_EMAIL, 50, 87);

  // Invoice label + ref (top-right)
  doc
    .fillColor(GOLD)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('INVOICE', 350, 50, { align: 'right' });

  doc
    .fillColor(BLACK)
    .fontSize(10)
    .font('Helvetica')
    .text(`Invoice #: ${invoice.invoiceRef}`, 350, 78, { align: 'right' })
    .text(`Date: ${formatDate(invoice.issuedAt ?? invoice.createdAt)}`, 350, 90, { align: 'right' });

  // ── Divider ──────────────────────────────────────────────────────────────────
  doc.moveTo(50, 115).lineTo(545, 115).strokeColor(GOLD).stroke();

  // ── Bill-to block ─────────────────────────────────────────────────────────
  doc
    .fillColor('#666666')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('BILLED TO', 50, 130);

  doc
    .fillColor(BLACK)
    .fontSize(10)
    .font('Helvetica')
    .text(customer?.name ?? 'Customer', 50, 143)
    .text(customer?.phone ?? '', 50, 155);
  if (customer?.email) doc.text(customer.email, 50, 167);

  // ── Line items table ──────────────────────────────────────────────────────
  const tableTop = 210;
  const cols = { item: 50, unit: 280, qty: 330, price: 380, total: 460 };

  // Table header background
  doc.rect(50, tableTop - 5, 495, 18).fillColor('#F5F5F5').fill();

  doc
    .fillColor('#333333')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('SERVICE',   cols.item,  tableTop)
    .text('UNIT',      cols.unit,  tableTop)
    .text('QTY',       cols.qty,   tableTop)
    .text('RATE (₹)',  cols.price, tableTop)
    .text('TOTAL (₹)', cols.total, tableTop);

  let y = tableTop + 22;
  let rowAlt = false;

  for (const line of invoice.lines) {
    if (rowAlt) {
      doc.rect(50, y - 3, 495, 16).fillColor('#FAFAFA').fill();
    }
    rowAlt = !rowAlt;

    doc
      .fillColor(BLACK)
      .fontSize(9)
      .font('Helvetica')
      .text(line.serviceName, cols.item, y, { width: 220, ellipsis: true })
      .text(line.unit,                   cols.unit,  y)
      .text(String(line.quantity),       cols.qty,   y)
      .text(formatRupees(line.unitPrice),cols.price, y)
      .text(formatRupees(line.lineTotal),cols.total, y);

    if (line.note) {
      y += 12;
      doc.fillColor('#888888').fontSize(7.5).text(`  ↳ ${line.note}`, cols.item + 6, y, { width: 210 });
    }
    y += 16;
  }

  // ── Divider below lines ───────────────────────────────────────────────────
  doc.moveTo(50, y + 4).lineTo(545, y + 4).strokeColor('#DDDDDD').stroke();
  y += 14;

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalX = 380;
  const valueX = 460;

  const addRow = (label: string, value: string, bold = false, color = BLACK) => {
    doc
      .fillColor('#555555')
      .fontSize(9)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(label, totalX, y);
    doc
      .fillColor(color)
      .fontSize(9)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(value, valueX, y);
    y += 14;
  };

  addRow('Subtotal',  formatRupees(invoice.subtotalPaise));
  if (invoice.discountPaise > 0) {
    addRow('Discount', `- ${formatRupees(invoice.discountPaise)}`, false, '#C0392B');
  }
  if (invoice.taxPaise > 0) {
    addRow(`GST (${invoice.taxPercent}%)`, formatRupees(invoice.taxPaise));
  }

  y += 4;
  doc.moveTo(totalX, y).lineTo(545, y).strokeColor(GOLD).lineWidth(1).stroke();
  y += 6;
  addRow('TOTAL', formatRupees(invoice.totalPaise), true, GOLD);

  // ── Payment status badge ───────────────────────────────────────────────────
  const isPaid    = invoice.status === 'PAID';
  const badgeText = isPaid ? 'PAID' : invoice.status;
  const badgeColor = isPaid ? '#27AE60' : GOLD;

  doc
    .roundedRect(50, y + 10, isPaid ? 50 : 80, 20, 4)
    .fillColor(badgeColor)
    .fill();
  doc
    .fillColor('#FFFFFF')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(badgeText, 50, y + 15, { width: isPaid ? 50 : 80, align: 'center' });

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    y += 45;
    doc
      .fillColor('#666666')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('NOTES', 50, y);
    doc
      .fillColor('#333333')
      .font('Helvetica')
      .text(invoice.notes, 50, y + 11, { width: 400 });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageHeight = doc.page.height;
  doc
    .moveTo(50, pageHeight - 60)
    .lineTo(545, pageHeight - 60)
    .strokeColor('#EEEEEE')
    .lineWidth(0.5)
    .stroke();

  doc
    .fillColor('#AAAAAA')
    .fontSize(8)
    .font('Helvetica')
    .text(
      `${BRAND_NAME} · ${SUPPORT_EMAIL} · +91 91186 78519`,
      50, pageHeight - 48, { align: 'center', width: 495 },
    )
    .text(
      'Thank you for choosing Desire Premium Dry Cleaning!',
      50, pageHeight - 36, { align: 'center', width: 495 },
    );

  doc.end();
}
