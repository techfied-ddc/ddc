// Single source of truth for every enum in the system.
// Import from here; never redefine locally.

export enum Role {
  CUSTOMER    = 'CUSTOMER',
  STORE_OWNER = 'STORE_OWNER',
  STORE_STAFF = 'STORE_STAFF',
  RIDER       = 'RIDER',
  ADMIN       = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum StoreStatus {
  PENDING  = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum ServiceUnit {
  PER_PIECE = 'PER_PIECE',
  PER_KG    = 'PER_KG',
  PER_PAIR  = 'PER_PAIR',
  PER_SET   = 'PER_SET',
}

export enum OrderStatus {
  DRAFT               = 'DRAFT',
  PLACED              = 'PLACED',
  ROUTED              = 'ROUTED',
  ROUTING_FAILED      = 'ROUTING_FAILED',
  ACCEPTED            = 'ACCEPTED',
  REJECTED            = 'REJECTED',
  PICKUP_ASSIGNED     = 'PICKUP_ASSIGNED',
  PICKUP_IN_PROGRESS  = 'PICKUP_IN_PROGRESS',
  PICKED_UP           = 'PICKED_UP',
  AT_STORE            = 'AT_STORE',
  INVOICED            = 'INVOICED',
  IN_PROCESS          = 'IN_PROCESS',
  READY               = 'READY',
  DELIVERY_ASSIGNED   = 'DELIVERY_ASSIGNED',
  OUT_FOR_DELIVERY    = 'OUT_FOR_DELIVERY',
  DELIVERED           = 'DELIVERED',
  COMPLETED           = 'COMPLETED',
  CANCELLED           = 'CANCELLED',
}

export enum PaymentStatus {
  NONE                = 'NONE',
  PENDING             = 'PENDING',
  PAID                = 'PAID',
  FAILED              = 'FAILED',
  REFUND_PENDING      = 'REFUND_PENDING',
  REFUNDED            = 'REFUNDED',
  PARTIALLY_REFUNDED  = 'PARTIALLY_REFUNDED',
}

export enum PaymentMode {
  ONLINE = 'ONLINE',
  COD    = 'COD',
}

export enum InvoiceStatus {
  DRAFT  = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID   = 'PAID',
  VOID   = 'VOID',
}

export enum TicketStatus {
  OPEN             = 'OPEN',
  PENDING_CUSTOMER = 'PENDING_CUSTOMER',
  PENDING_ADMIN    = 'PENDING_ADMIN',
  RESOLVED         = 'RESOLVED',
  CLOSED           = 'CLOSED',
}

export enum TicketPriority {
  LOW    = 'LOW',
  NORMAL = 'NORMAL',
  HIGH   = 'HIGH',
  URGENT = 'URGENT',
}

export enum CouponType {
  PERCENT = 'PERCENT',
  FLAT    = 'FLAT',
}

export enum RiderJobRole {
  PICKUP   = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export enum RiderJobStatus {
  ASSIGNED  = 'ASSIGNED',
  ACCEPTED  = 'ACCEPTED',
  REACHED   = 'REACHED',
  DONE      = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH   = 'PUSH',
  EMAIL  = 'EMAIL',
  SMS    = 'SMS',
}

export enum PayoutStatus {
  DRAFT      = 'DRAFT',
  APPROVED   = 'APPROVED',
  PROCESSING = 'PROCESSING',
  PAID       = 'PAID',
  FAILED     = 'FAILED',
  STORE_OWES = 'STORE_OWES',
}

export enum PayoutMethod {
  GATEWAY_ROUTE  = 'GATEWAY_ROUTE',
  GATEWAY_PAYOUT = 'GATEWAY_PAYOUT',
  MANUAL_BANK    = 'MANUAL_BANK',
}

export enum LinkedAccountStatus {
  NONE        = 'NONE',
  PENDING_KYC = 'PENDING_KYC',
  ACTIVE      = 'ACTIVE',
  REJECTED    = 'REJECTED',
}

export enum RoutingMethod {
  PINCODE = 'PINCODE',
  POLYGON = 'POLYGON',
  RADIUS  = 'RADIUS',
  MANUAL  = 'MANUAL',
}

export enum AuthMethod {
  PHONE_OTP = 'PHONE_OTP',
  GOOGLE    = 'GOOGLE',
  PASSWORD  = 'PASSWORD',
}

export enum UserStatus {
  ACTIVE    = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum PayoutCadence {
  WEEKLY = 'WEEKLY',
  DAILY  = 'DAILY',
  MANUAL = 'MANUAL',
}

export enum SlaSource {
  CATEGORY      = 'CATEGORY',
  STORE_DEFAULT = 'STORE_DEFAULT',
}

// Status → UI semantic colour bucket (used by StatusPill)
export const ORDER_STATUS_COLOUR = {
  [OrderStatus.PLACED]:             'info',
  [OrderStatus.ROUTED]:             'info',
  [OrderStatus.ROUTING_FAILED]:     'danger',
  [OrderStatus.ACCEPTED]:           'info',
  [OrderStatus.REJECTED]:           'danger',
  [OrderStatus.PICKUP_ASSIGNED]:    'warning',
  [OrderStatus.PICKUP_IN_PROGRESS]: 'warning',
  [OrderStatus.PICKED_UP]:          'gold',
  [OrderStatus.AT_STORE]:           'gold',
  [OrderStatus.INVOICED]:           'warning',
  [OrderStatus.IN_PROCESS]:         'warning',
  [OrderStatus.READY]:              'gold',
  [OrderStatus.DELIVERY_ASSIGNED]:  'warning',
  [OrderStatus.OUT_FOR_DELIVERY]:   'warning',
  [OrderStatus.DELIVERED]:          'success',
  [OrderStatus.COMPLETED]:          'success',
  [OrderStatus.CANCELLED]:          'danger',
  [OrderStatus.DRAFT]:              'muted',
} as const;

export type StatusColour = 'info' | 'warning' | 'gold' | 'success' | 'danger' | 'muted';
