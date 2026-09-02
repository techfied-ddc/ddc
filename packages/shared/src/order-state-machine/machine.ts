import { OrderStatus, Role } from '../enums.js';

// Every valid transition in the system.
// Guards are enforced in orders.service.transition() with full DB context.
// Effects are documented here for reference; executed in the service.

export type OrderEvent =
  | 'PLACE'
  | 'ROUTE_OK'
  | 'ROUTE_FAIL'
  | 'ADMIN_ASSIGN'
  | 'ACCEPT'
  | 'REJECT'
  | 'ASSIGN_PICKUP'
  | 'PICKUP_ACCEPT'
  | 'PICKUP_VERIFY_OTP'
  | 'RECEIVE_AT_STORE'
  | 'ISSUE_INVOICE'
  | 'START_PROCESS'
  | 'MARK_READY'
  | 'ASSIGN_DELIVERY'
  | 'DELIVERY_ACCEPT'
  | 'MARK_COD_COLLECTED'
  | 'DELIVERY_VERIFY_OTP'
  | 'RATE'
  | 'AUTO_COMPLETE'
  | 'CANCEL_CUSTOMER'
  | 'CANCEL_STORE'
  | 'CANCEL_ADMIN';

export interface Transition {
  from: OrderStatus[];
  to: OrderStatus;
  allowedRoles: Role[];
  /** Human-readable guard notes (enforced in service, not here). */
  guard?: string;
  /** Side effects to execute in the service after the transition. */
  effects?: string[];
}

export const ORDER_STATE_MACHINE: Record<OrderEvent, Transition> = {
  PLACE: {
    from: [OrderStatus.DRAFT],
    to:   OrderStatus.PLACED,
    allowedRoles: [Role.CUSTOMER],
    guard: 'valid cart, address, coupon OK, paymentMode set, slot valid & has capacity',
    effects: ['createOrderRow', 'snapshotItems', 'snapshotAddress', 'redeemLockCoupon', 'enqueueRoute'],
  },
  ROUTE_OK: {
    from: [OrderStatus.PLACED],
    to:   OrderStatus.ROUTED,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN], // system job
    guard: 'store resolved, APPROVED, open',
    effects: ['setStoreId', 'setRoutingMethod', 'socketToStore', 'socketToAdmin', 'pushToStore'],
  },
  ROUTE_FAIL: {
    from: [OrderStatus.PLACED],
    to:   OrderStatus.ROUTING_FAILED,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN], // system job
    effects: ['socketRoutingFailed', 'notifyAdmin', 'notifyCustomer'],
  },
  ADMIN_ASSIGN: {
    from: [OrderStatus.ROUTING_FAILED, OrderStatus.REJECTED],
    to:   OrderStatus.ROUTED,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
    guard: 'admin picks an APPROVED store',
    effects: ['setStoreId', 'setRoutingMethodManual', 'setAssignedByAdmin', 'notifyStore'],
  },
  ACCEPT: {
    from: [OrderStatus.ROUTED],
    to:   OrderStatus.ACCEPTED,
    allowedRoles: [Role.STORE_OWNER, Role.STORE_STAFF],
    guard: 'actor belongs to the assigned store',
    effects: ['notifyCustomer', 'socketOrderStatus'],
  },
  REJECT: {
    from: [OrderStatus.ROUTED],
    to:   OrderStatus.REJECTED,
    allowedRoles: [Role.STORE_OWNER, Role.STORE_STAFF],
    guard: 'reason provided',
    effects: ['notifyAdmin', 'socketToAdmin'],
  },
  ASSIGN_PICKUP: {
    from: [OrderStatus.ACCEPTED, OrderStatus.PICKUP_ASSIGNED],
    to:   OrderStatus.PICKUP_ASSIGNED,
    allowedRoles: [Role.STORE_OWNER, Role.STORE_STAFF],
    guard: 'rider belongs to store and is active',
    effects: ['generatePickupOtp', 'revealOtpToCustomer', 'notifyCustomer', 'notifyRider'],
  },
  PICKUP_ACCEPT: {
    from: [OrderStatus.PICKUP_ASSIGNED],
    to:   OrderStatus.PICKUP_IN_PROGRESS,
    allowedRoles: [Role.RIDER],
    guard: 'actor is the assigned pickup rider',
    effects: ['setJobStatusAccepted'],
  },
  PICKUP_VERIFY_OTP: {
    from: [OrderStatus.PICKUP_ASSIGNED, OrderStatus.PICKUP_IN_PROGRESS],
    to:   OrderStatus.PICKED_UP,
    allowedRoles: [Role.RIDER],
    guard: 'OTP matches hash and is not expired; rate-limited 5 attempts / 10 min',
    effects: ['setPickupVerifiedAt', 'hideOtpFromCustomer', 'notifyCustomer', 'notifyStore'],
  },
  RECEIVE_AT_STORE: {
    from: [OrderStatus.PICKED_UP],
    to:   OrderStatus.AT_STORE,
    allowedRoles: [Role.STORE_OWNER, Role.STORE_STAFF],
    effects: ['writeVerifiedItems', 'notifyCustomer'],
  },
  ISSUE_INVOICE: {
    from: [OrderStatus.AT_STORE, OrderStatus.INVOICED],
    to:   OrderStatus.INVOICED,
    allowedRoles: [Role.STORE_OWNER, Role.STORE_STAFF],
    guard: 'invoice has ≥1 line, total > 0',
    effects: [
      'createOrReplaceInvoice',
      'ifOnline:createSplitPaymentLink',
      'ifCOD:setPaymentStatusPending',
      'notifyCustomerWithInvoice',
      'emailInvoice',
    ],
  },
  START_PROCESS: {
    from: [OrderStatus.INVOICED, OrderStatus.AT_STORE],
    to:   OrderStatus.IN_PROCESS,
    allowedRoles: [Role.STORE_OWNER, Role.STORE_STAFF],
    effects: ['computePromisedAt', 'notifyCustomer'],
  },
  MARK_READY: {
    from: [OrderStatus.IN_PROCESS],
    to:   OrderStatus.READY,
    allowedRoles: [Role.STORE_OWNER, Role.STORE_STAFF],
    effects: ['confirmPromisedAt', 'notifyCustomer'],
  },
  ASSIGN_DELIVERY: {
    from: [OrderStatus.READY, OrderStatus.DELIVERY_ASSIGNED],
    to:   OrderStatus.DELIVERY_ASSIGNED,
    allowedRoles: [Role.STORE_OWNER, Role.STORE_STAFF],
    guard: 'rider belongs to store and is active',
    effects: ['generateDeliveryOtp', 'revealOtpToCustomer', 'notifyCustomer', 'notifyRider'],
  },
  DELIVERY_ACCEPT: {
    from: [OrderStatus.DELIVERY_ASSIGNED],
    to:   OrderStatus.OUT_FOR_DELIVERY,
    allowedRoles: [Role.RIDER],
    guard: 'actor is the assigned delivery rider',
    effects: ['setJobStatusAccepted'],
  },
  MARK_COD_COLLECTED: {
    // No status change — side-effect only transition
    from: [OrderStatus.DELIVERY_ASSIGNED, OrderStatus.OUT_FOR_DELIVERY],
    to:   OrderStatus.DELIVERY_ASSIGNED, // stays; will be overwritten by caller
    allowedRoles: [Role.RIDER, Role.STORE_OWNER, Role.STORE_STAFF],
    guard: 'paymentMode is COD',
    effects: ['setPaymentStatusPaid', 'setCodCollectedAt', 'socketPaymentUpdated'],
  },
  DELIVERY_VERIFY_OTP: {
    from: [OrderStatus.DELIVERY_ASSIGNED, OrderStatus.OUT_FOR_DELIVERY],
    to:   OrderStatus.DELIVERED,
    allowedRoles: [Role.RIDER],
    guard: 'OTP valid AND paymentStatus === PAID',
    effects: [
      'setDeliveryVerifiedAt',
      'setInvoicePaid',
      'writeSettlementSnapshot',
      'notifyCustomer',
      'notifyStore',
      'enqueueAnalytics',
      'enqueueSettlementAccrual',
    ],
  },
  RATE: {
    from: [OrderStatus.DELIVERED],
    to:   OrderStatus.COMPLETED,
    allowedRoles: [Role.CUSTOMER],
    guard: 'rating 1–5',
    effects: ['updateStoreRatingAvg', 'thankYouNotification'],
  },
  AUTO_COMPLETE: {
    from: [OrderStatus.DELIVERED],
    to:   OrderStatus.COMPLETED,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN], // system job
    guard: 'now - deliveredAt > autoCompleteAfterHours',
    effects: [],
  },
  CANCEL_CUSTOMER: {
    from: [
      OrderStatus.PLACED,
      OrderStatus.ROUTED,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKUP_ASSIGNED,
    ],
    to:   OrderStatus.CANCELLED,
    allowedRoles: [Role.CUSTOMER],
    guard: 'before PICKED_UP only',
    effects: ['releaseCouponLock', 'voidDraftInvoice', 'notifyStore'],
  },
  CANCEL_STORE: {
    from: [
      OrderStatus.ROUTED,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKUP_ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.AT_STORE,
    ],
    to:   OrderStatus.CANCELLED,
    allowedRoles: [Role.STORE_OWNER, Role.STORE_STAFF],
    guard: 'reason required; if post-pickup → requires admin co-sign',
    effects: ['notifyCustomer', 'notifyAdmin', 'refundIfPaid'],
  },
  CANCEL_ADMIN: {
    from: [
      OrderStatus.PLACED, OrderStatus.ROUTED, OrderStatus.ROUTING_FAILED,
      OrderStatus.ACCEPTED, OrderStatus.REJECTED,
      OrderStatus.PICKUP_ASSIGNED, OrderStatus.PICKUP_IN_PROGRESS,
      OrderStatus.PICKED_UP, OrderStatus.AT_STORE,
      OrderStatus.INVOICED, OrderStatus.IN_PROCESS,
      OrderStatus.READY, OrderStatus.DELIVERY_ASSIGNED,
      OrderStatus.OUT_FOR_DELIVERY,
    ],
    to:   OrderStatus.CANCELLED,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
    guard: 'reason required',
    effects: ['fullRefundIfPaid', 'notifyAllParties', 'auditLog'],
  },
};

export const TERMINAL_STATUSES = new Set<OrderStatus>([
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
]);
