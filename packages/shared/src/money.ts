// All money is stored and transmitted in integer paise (₹1 = 100 paise).
// Format only at the view layer.

/** Round to nearest integer paise (no fractions ever stored). */
export const toPaise = (rupees: number): number => Math.round(rupees * 100);

/** Convert paise to rupees for display. */
export const fromPaise = (paise: number): number => paise / 100;

/** Format paise as a ₹ string. e.g. 150000 → "₹1,500.00" */
export const formatMoney = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);

/** Format paise as a compact string. e.g. 150000 → "₹1,500" */
export const formatMoneyCompact = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);

export interface CommissionSplit {
  platformCommission: number; // paise
  storeEarning: number;       // paise
}

/**
 * Split a grandTotal by commissionPercent.
 * platformCommission + storeEarning === grandTotal always (no rounding drift).
 */
export const splitCommission = (grandTotal: number, commissionPercent: number): CommissionSplit => {
  const platformCommission = Math.round((grandTotal * commissionPercent) / 100);
  const storeEarning = grandTotal - platformCommission;
  return { platformCommission, storeEarning };
};

/** Apply a percent discount, capped at maxDiscount if provided. */
export const applyPercentDiscount = (
  amount: number,
  percent: number,
  maxDiscount?: number,
): number => {
  const discount = Math.round((amount * percent) / 100);
  return maxDiscount !== undefined ? Math.min(discount, maxDiscount) : discount;
};

/** Compute net payout: onlineGross - onlineCommission - codCommissionDue + adjustments */
export const computeNetToStore = (params: {
  onlineGross: number;
  onlineCommission: number;
  codCommissionDue: number;
  adjustments: number; // sum of positive/negative adjustment amounts
}): number =>
  params.onlineGross - params.onlineCommission - params.codCommissionDue + params.adjustments;
