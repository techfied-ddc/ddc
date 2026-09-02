// Named constants — never use magic strings or numbers in business logic

export const ORDER_REF_PREFIX    = 'DPD-' as const;
export const INVOICE_REF_PREFIX  = 'INV-' as const;
export const TICKET_REF_PREFIX   = 'TKT-' as const;
export const PAYOUT_REF_PREFIX   = 'PO-'  as const;

export const CURRENCY            = 'INR' as const;
export const TIMEZONE            = 'Asia/Kolkata' as const;
export const DEFAULT_TAX_PERCENT = 18;
export const DEFAULT_COMMISSION_PERCENT = 20;

// OTP
export const OTP_LENGTH          = 4;   // handover OTP digits (login OTP is always 6)
export const OTP_TTL_MINUTES     = 120; // handover OTP validity
export const LOGIN_OTP_LENGTH    = 6;
export const LOGIN_OTP_TTL_MINUTES = 5;
export const OTP_MAX_ATTEMPTS    = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const OTP_MAX_PER_HOUR_PER_PHONE = 5;

// Order
export const AUTO_COMPLETE_AFTER_HOURS = 72;
export const DEFAULT_SLA_HOURS        = 48;

// Payout
export const DEFAULT_PAYOUT_CADENCE = 'WEEKLY';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE     = 100;

// Cloudinary folders
export const CLOUDINARY_FOLDERS = {
  storeLogos:    'ddc/stores',
  garments:      'ddc/garments',
  riderSelfies:  'ddc/riders',
  invoices:      'ddc/invoices',
} as const;

// Rate limit windows (ms)
export const RATE_LIMIT = {
  OTP_REQUEST:    { windowMs: 60_000,     max: 3 },  // 3 per minute per IP
  OTP_VERIFY:     { windowMs: 600_000,    max: 5 },  // 5 per 10 min per order
  COUPON_APPLY:   { windowMs: 60_000,     max: 10 },
  TICKET_CREATE:  { windowMs: 3_600_000,  max: 10 },
} as const;
