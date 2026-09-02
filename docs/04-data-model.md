# 04 — Data Model (MongoDB Atlas)

Mongoose + TypeScript. All schemas: `timestamps: true`. Money fields are **integers in
paise**. Enums are imported from `packages/shared` — never redefined here or in code.

## 4.1 Collections overview

| Collection | Purpose |
|---|---|
| `users` | Every human: customers, store owners/staff, riders, admins (discriminated by `role`) |
| `stores` | A physical branch/factory: profile, location, service area, settings |
| `services` | Service catalog items shown on website + customer app |
| `serviceCategories` | Grouping for the catalog |
| `orders` | The core entity; embeds items, pickup, delivery, invoice ref, payment ref, timeline |
| `invoices` | Binding bill per order (kept separate for history/immutability) |
| `payments` | Payment attempts + gateway state; webhook log |
| `coupons` | Discount codes, global or user-assigned |
| `couponRedemptions` | One row per use (enforces limits) |
| `tickets` | Helpdesk / support threads |
| `notifications` | In-app notification feed per user |
| `pushSubscriptions` | Web Push endpoints per user/device |
| `zones` | Optional named service zones + pincode→store fallback map (admin-managed) |
| `authOtps` | Phone-login OTP codes (hashed, TTL) — see ADR-0010 |
| `payouts` | Per-store settlement statements (commission, COD receivables, net) — see ADR-0009 |
| `settings` | Single-doc global business configuration |
| `auditLogs` | Sensitive admin/store actions |
| `counters` | Atomic sequence generator for `DPD-XXXXXX` order refs |

## 4.2 Enums (from `packages/shared`)

```ts
Role = 'CUSTOMER' | 'STORE_OWNER' | 'STORE_STAFF' | 'RIDER' | 'ADMIN' | 'SUPER_ADMIN'

StoreStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'

ServiceUnit = 'PER_PIECE' | 'PER_KG' | 'PER_PAIR' | 'PER_SET'

OrderStatus =
  | 'DRAFT'            // cart, not persisted as an order until placed
  | 'PLACED'           // customer submitted
  | 'ROUTED'           // assigned to a store automatically
  | 'ROUTING_FAILED'   // no store matched → admin queue
  | 'ACCEPTED'         // store accepted
  | 'REJECTED'         // store rejected (terminal unless admin reroutes)
  | 'PICKUP_ASSIGNED'  // pickup rider set
  | 'PICKUP_IN_PROGRESS'
  | 'PICKED_UP'        // pickup OTP verified
  | 'AT_STORE'         // garments received + verified at store
  | 'INVOICED'         // invoice issued + payment link sent
  | 'IN_PROCESS'       // cleaning in progress
  | 'READY'            // ready for delivery
  | 'DELIVERY_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'        // delivery OTP verified AND payment complete
  | 'COMPLETED'        // customer rated / auto-closed
  | 'CANCELLED'        // by customer (pre-pickup), store, or admin

PaymentStatus = 'NONE' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID'

TicketStatus = 'OPEN' | 'PENDING_CUSTOMER' | 'PENDING_ADMIN' | 'RESOLVED' | 'CLOSED'
TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

CouponType = 'PERCENT' | 'FLAT'

RiderJobRole = 'PICKUP' | 'DELIVERY'
RiderJobStatus = 'ASSIGNED' | 'ACCEPTED' | 'REACHED' | 'DONE' | 'CANCELLED'

NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS'

PaymentMode = 'ONLINE' | 'COD'         // customer's choice at checkout

PayoutStatus = 'DRAFT' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'STORE_OWES'
PayoutMethod = 'GATEWAY_ROUTE' | 'GATEWAY_PAYOUT' | 'MANUAL_BANK'

LinkedAccountStatus = 'NONE' | 'PENDING_KYC' | 'ACTIVE' | 'REJECTED'
```

## 4.3 `users`

```ts
{
  _id, role: Role,
  name: string,
  email?: string,           // unique sparse, lowercased; optional for phone-OTP-only customers
  emailVerified: boolean,
  phone?: string,           // E.164; UNIQUE sparse. Required for CUSTOMER & RIDER (login id)
  phoneVerified: boolean,
  passwordHash?: string,    // null for Google-only / phone-OTP-only accounts
  googleId?: string,        // unique sparse
  authMethods: string[],    // any of: 'PHONE_OTP' | 'GOOGLE' | 'PASSWORD'
  avatarUrl?: string,
  status: 'ACTIVE' | 'SUSPENDED',

  // CUSTOMER
  addresses?: [{
    _id, label, line1, line2?, city, state, pincode,
    location: { type: 'Point', coordinates: [lng, lat] },
    isDefault: boolean,
    contactName?, contactPhone?
  }],

  // STORE_OWNER / STORE_STAFF
  storeId?: ObjectId,       // the store this user belongs to
  storePermissions?: string[],  // for STORE_STAFF granular perms

  // RIDER
  riderProfile?: {
    storeId: ObjectId,
    vehicleNumber: string,        // "bike number"
    liveSelfieUrl: string,        // Cloudinary
    active: boolean,
    onJob: boolean
  },

  lastLoginAt?, createdAt, updatedAt
}
```
Indexes: `{ email: 1 }` unique **sparse**, `{ phone: 1 }` unique **sparse**,
`{ googleId: 1 }` unique sparse, `{ role: 1, status: 1 }`, `{ storeId: 1 }`,
`{ 'riderProfile.storeId': 1 }`, `addresses.location` → `2dsphere`.

> Riders are `users` with `role=RIDER`, created by their store with a `phone`. They log in
> by **phone OTP** (ADR-0010); the store may also set an initial password as a fallback.
> RBAC + `riderProfile.storeId` scopes what they see.
> Customers may have **no email** (phone-OTP-only); `email` is only required for
> Google/password accounts. Identity linking across phone/Google/email → one `users` row.

## 4.4 `stores`

```ts
{
  _id,
  ownerUserId: ObjectId,
  name: string,             // public store name
  legalName?: string,
  gstNumber?: string,       // store's GSTIN (set/verified by admin at onboarding)
  status: StoreStatus,      // PENDING until admin approves
  createdByAdminId?: ObjectId,   // set when admin onboards the store directly
  contact: { phone, email?, whatsapp? },
  address: { line1, line2?, city, state, pincode },
  location: { type: 'Point', coordinates: [lng, lat] },   // the store/factory pin

  serviceArea: {
    pincodes: string[],                 // primary routing key
    polygon?: { type: 'Polygon', coordinates: [[[lng,lat], ...]] },  // optional finer area
    maxRadiusKm?: number                // optional simple fallback
  },

  operatingHours: [{ day: 0..6, open: 'HH:mm', close: 'HH:mm', closed: boolean }],
  capacityPerDay?: number,

  // Pickup slots — customer picks one at checkout; the store controls which show + capacity
  pickupSlots: {
    enabled: boolean,                   // default true
    leadTimeMinutes: number,            // earliest bookable slot from "now" (e.g. 120)
    horizonDays: number,                // how many days ahead are bookable (e.g. 4)
    windows: [{
      _id, label: string,              // "09:00–12:00"
      start: 'HH:mm', end: 'HH:mm',
      daysOfWeek: number[],            // 0..6 this window runs
      capacity: number,               // max pickups accepted in this window/day
      enabled: boolean                // store toggles visibility
    }]
  },

  // SLA / turnaround — set by ADMIN at onboarding, then admin-editable only
  sla: {
    defaultTurnaroundHours: number,     // e.g. 48
    perCategory?: [{ categoryId: ObjectId, hours: number }],
    setByAdminId?: ObjectId, setAt?: Date
  },

  // Payout / commission — commissionPercent set by ADMIN (ADR-0009)
  payout: {
    commissionPercent: number,         // platform's cut, 0–100, admin-set
    linkedAccountStatus: LinkedAccountStatus,   // gateway linked/vendor account
    providerLinkedAccountId?: string,
    beneficiary?: {                    // for MANUAL_BANK / GATEWAY_PAYOUT fallback
      accountName?, accountNumberMasked?, ifsc?, upiId?, bankName?
    },
    kycStatus?: 'NONE' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED',
    pendingBalance: number,            // paise, denormalised accrual since last statement
    holdFundsUntilKyc: boolean         // default true
  },

  settings: {
    autoAcceptOrders: boolean,          // default false
    taxPercentOverride?: number,        // admin-set; overrides settings.defaultTaxPercent
    notes?: string
  },

  ratingAvg: number,        // denormalised from orders
  ratingCount: number,
  approvedAt?, approvedByUserId?,
  createdAt, updatedAt
}
```
Indexes: `{ status: 1 }`, `{ 'serviceArea.pincodes': 1 }`, `location` → `2dsphere`,
`serviceArea.polygon` → `2dsphere`, `{ ownerUserId: 1 }`,
`{ 'payout.linkedAccountStatus': 1 }`.

## 4.5 `serviceCategories` / `services`

```ts
// serviceCategories
{ _id, name, slug, description?, imageUrl?, sortOrder, active }

// services
{
  _id,
  categoryId: ObjectId,
  name: string,                 // "Shirt — Wash & Iron"
  slug: string,                 // unique
  description?: string,
  unit: ServiceUnit,            // PER_PIECE / PER_KG / ...
  basePrice: number,            // paise, used for the ESTIMATE only
  imageUrl?: string,
  addons?: [{ name, price }],   // optional extras (e.g. "starch")
  turnaroundHours?: number,     // indicative only; the binding SLA is store.sla (admin-set)
  active: boolean,
  sortOrder: number
}
```
Indexes: `{ slug: 1 }` unique, `{ categoryId: 1, active: 1, sortOrder: 1 }`.
Admin uploads the service image + name + description + price here; the customer app /
website render straight from this collection.

## 4.6 `orders`

```ts
{
  _id,
  ref: string,                  // "DPD-000123" — human reference, unique
  customerId: ObjectId,
  storeId?: ObjectId,           // null until routed
  status: OrderStatus,

  items: [{
    serviceId: ObjectId,
    name: string,               // snapshot
    unit: ServiceUnit,          // snapshot
    estUnitPrice: number,       // snapshot of basePrice at cart time (paise)
    qty: number,
    addons?: [{ name, price }],
    customerNote?: string,
    // filled at store verification:
    verifiedQty?: number,
    finalUnitPrice?: number,
    storeNote?: string,
    photos?: string[]           // Cloudinary urls
  }],

  estimate: {
    itemsTotal: number,
    discount: number,
    tax: number,
    grandTotal: number,         // non-binding
    couponCode?: string
  },

  paymentMode: PaymentMode,     // 'ONLINE' | 'COD' — customer's choice; editable until INVOICED

  pickupAddress: {              // snapshot of a user address
    label?, line1, line2?, city, state, pincode,
    location: { type:'Point', coordinates:[lng,lat] },
    contactName, contactPhone
  },
  deliveryAddress?: { ...same shape... },   // defaults to pickupAddress

  pickup: {
    riderId?: ObjectId,
    slot: {                     // chosen by customer at checkout from the store's windows
      date: 'YYYY-MM-DD',
      windowId: ObjectId, label: string,
      start: 'HH:mm', end: 'HH:mm'
    },
    scheduledAt?: Date,         // resolved datetime of the slot start (for sorting/rider)
    otpHash?: string,           // hashed 4–6 digit code (app-shown, not SMS)
    otpExpiresAt?: Date,
    verifiedAt?: Date,
    jobStatus?: RiderJobStatus
  },
  delivery: {
    riderId?: ObjectId,
    promisedAt?: Date,          // = pickup.scheduledAt + store.sla turnaround (per category / default)
    slaSource?: 'CATEGORY' | 'STORE_DEFAULT',
    otpHash?: string,
    otpExpiresAt?: Date,
    verifiedAt?: Date,
    jobStatus?: RiderJobStatus
  },

  invoiceId?: ObjectId,
  paymentId?: ObjectId,
  paymentStatus: PaymentStatus, // denormalised for list views
  codCollectedAt?: Date,        // set when store/rider marks COD cash received

  // Commission & settlement — snapshotted at DELIVERED (ADR-0009)
  settlement?: {
    commissionPercent: number,          // store.payout.commissionPercent at delivery time
    grandTotal: number,                 // = invoice grandTotal
    platformCommission: number,         // round(grandTotal * pct / 100)
    storeEarning: number,               // grandTotal - platformCommission
    mode: PaymentMode,
    gatewaySplitRef?: string,           // when split at capture (ONLINE)
    codCommissionReceivable?: number,   // COD: what the store owes the platform
    payoutId?: ObjectId,
    settledAt?: Date
  },

  feedback?: { rating: 1..5, comment?: string, createdAt: Date },
  serviceFeedbackByStore?: { note: string, byUserId: ObjectId, createdAt: Date },

  routing: {
    autoAssigned: boolean,
    attemptedAt?: Date,
    method?: 'PINCODE' | 'POLYGON' | 'RADIUS' | 'MANUAL',
    failedReason?: string,
    assignedByUserId?: ObjectId // admin, if manual
  },

  cancellation?: { by: 'CUSTOMER'|'STORE'|'ADMIN', reason: string, at: Date },

  timeline: [{
    at: Date, status: OrderStatus, byUserId?: ObjectId,
    byRole?: Role, note?: string
  }],

  placedAt: Date,
  createdAt, updatedAt
}
```
Indexes: `{ ref: 1 }` unique, `{ customerId: 1, createdAt: -1 }`,
`{ storeId: 1, status: 1, createdAt: -1 }`, `{ status: 1 }`,
`{ 'pickup.riderId': 1, 'pickup.jobStatus': 1 }`,
`{ 'delivery.riderId': 1, 'delivery.jobStatus': 1 }`,
`{ paymentStatus: 1 }`, `{ 'routing.autoAssigned': 1, status: 1 }` (fallback queue),
`{ storeId: 1, 'pickup.slot.date': 1, 'pickup.slot.windowId': 1 }` (slot capacity counts),
`{ storeId: 1, 'settlement.payoutId': 1 }`, `{ storeId: 1, status: 1, 'settlement.settledAt': 1 }`
(unsettled-orders sweep), `pickupAddress.location` → `2dsphere`.

## 4.7 `invoices`

```ts
{
  _id, orderId: ObjectId, storeId: ObjectId, customerId: ObjectId,
  number: string,             // "INV-DPD-000123"
  status: InvoiceStatus,
  lines: [{ description, unit, qty, unitPrice, amount }],  // paise
  subTotal: number,
  discount: { couponCode?: string, amount: number },
  taxPercent: number,
  tax: number,
  grandTotal: number,
  notes?: string,
  issuedAt?: Date, paidAt?: Date, voidedAt?: Date,
  issuedByUserId: ObjectId,
  createdAt, updatedAt
}
```
Indexes: `{ orderId: 1 }` unique, `{ number: 1 }` unique, `{ storeId: 1, status: 1 }`.

## 4.8 `payments`

```ts
{
  _id, orderId: ObjectId, invoiceId: ObjectId,
  provider: 'CASHFREE' | 'PAYU' | 'PHONEPE' | 'MOCK',
  providerLinkId?: string,
  providerOrderId?: string,
  providerPaymentId?: string,
  linkUrl?: string,
  amount: number,             // paise
  amountPaid: number,
  currency: 'INR',
  status: PaymentStatus,
  method?: string,            // upi / card / netbanking (from gateway)
  refunds: [{ providerRefundId, amount, status, reason, at }],
  events: [{ at: Date, type: string, raw: object, signatureValid: boolean }],  // webhook log
  paidAt?: Date,
  createdAt, updatedAt
}
```
Indexes: `{ orderId: 1 }`, `{ providerLinkId: 1 }`, `{ providerOrderId: 1 }`,
`{ status: 1 }`. Webhook handler is **idempotent** on `providerPaymentId` + event type.

## 4.9 `coupons` / `couponRedemptions`

```ts
// coupons
{
  _id, code: string,          // unique, uppercased
  type: CouponType, value: number,       // percent (0–100) or flat paise
  maxDiscount?: number,       // cap for PERCENT
  minOrder?: number,
  scope: 'GLOBAL' | 'USER',
  assignedUserIds?: ObjectId[],   // when scope=USER
  usageLimit?: number,        // total
  perUserLimit?: number,
  validFrom?: Date, validTo?: Date,
  active: boolean,
  createdByUserId: ObjectId
}
// couponRedemptions
{ _id, couponId, userId, orderId, amount, at }
```
Indexes: `coupons {code:1}` unique, `{ scope:1, active:1 }`, `{ assignedUserIds: 1 }`;
`couponRedemptions { couponId:1, userId:1 }`, `{ orderId:1 }` unique.

## 4.10 `tickets`

```ts
{
  _id, ref: string,           // "TKT-000045"
  raisedByUserId: ObjectId, raisedByRole: Role,
  orderId?: ObjectId,
  subject: string,
  status: TicketStatus, priority: TicketPriority,
  assignedAdminId?: ObjectId,
  messages: [{ _id, byUserId, byRole, body, attachments?: string[], at: Date, internal?: boolean }],
  firstResponseAt?: Date, resolvedAt?: Date, closedAt?: Date,
  createdAt, updatedAt
}
```
Indexes: `{ ref:1 }` unique, `{ status:1, priority:1, updatedAt:-1 }`,
`{ raisedByUserId:1 }`, `{ assignedAdminId:1, status:1 }`, `{ orderId:1 }`.

## 4.11 `notifications` / `pushSubscriptions`

```ts
// notifications
{ _id, userId, type: string, title, body, data?: object,
  channels: NotificationChannel[], readAt?: Date, createdAt }
// pushSubscriptions
{ _id, userId, endpoint: string, keys: { p256dh, auth },
  userAgent?, lastSeenAt, createdAt }   // endpoint unique
```
Indexes: `notifications { userId:1, createdAt:-1 }`, `{ userId:1, readAt:1 }`;
`pushSubscriptions { endpoint:1 }` unique, `{ userId:1 }`.

## 4.12 `zones` (optional, admin-managed)

```ts
{
  _id, name: string,
  pincodes: string[],
  polygon?: { type:'Polygon', coordinates:[[[lng,lat],...]] },
  storeId: ObjectId,          // which store serves this zone (fallback/override map)
  priority: number,           // higher wins on overlap
  active: boolean
}
```
Used by routing when a store's own `serviceArea` doesn't resolve, and for admin overrides.
Indexes: `{ pincodes: 1, active: 1, priority: -1 }`, `polygon` → `2dsphere`, `{ storeId:1 }`.

## 4.12b `authOtps` (phone-login OTP — ADR-0010)

```ts
{
  _id, phone: string,          // E.164
  codeHash: string,            // argon2 hash of the 6-digit code
  purpose: 'LOGIN',
  attempts: number,            // failed verify attempts
  consumedAt?: Date,
  ip?: string, userAgent?: string,
  expiresAt: Date,             // now + 5 min
  createdAt
}
```
Indexes: `{ phone: 1, createdAt: -1 }`, `{ expiresAt: 1 }` **TTL**. Rate-limit at the route
(per phone + per IP); 30s resend cooldown; max 5 live requests/hour/phone.

## 4.12c `payouts` (store settlement statements — ADR-0009)

```ts
{
  _id, ref: string,            // "PO-000012"
  storeId: ObjectId,
  periodStart: Date, periodEnd: Date,
  onlineGross: number,         // Σ grandTotal of ONLINE paid orders in period (paise)
  onlineCommission: number,    // platform cut on those
  codGross: number,            // Σ grandTotal of COD orders delivered in period
  codCommissionDue: number,    // platform cut the store owes on COD
  adjustments: [{ reason: string, amount: number, byUserId: ObjectId, at: Date }],  // ± paise
  netToStore: number,          // onlineGross - onlineCommission - codCommissionDue + Σ adjustments
  method: PayoutMethod,        // GATEWAY_ROUTE (auto-split mirror) | GATEWAY_PAYOUT | MANUAL_BANK
  status: PayoutStatus,        // DRAFT → APPROVED → PROCESSING → PAID | FAILED | STORE_OWES
  orderRefs: ObjectId[],       // orders included
  providerPayoutRef?: string,
  generatedByJob: boolean,
  approvedByUserId?: ObjectId, approvedAt?: Date,   // maker–checker
  paidAt?: Date, failureReason?: string,
  createdAt, updatedAt
}
```
Indexes: `{ ref:1 }` unique, `{ storeId:1, periodEnd:-1 }`, `{ status:1 }`.
`STORE_OWES` = `netToStore < 0` (COD-heavy period) → admin collects offline / carries forward.

## 4.13 `settings` (single document)

```ts
{
  _id: 'global',
  business: {
    name: 'Desire Premium Dry Cleaning',
    supportEmail: 'techfied.desiredrycleaning@gmail.com',
    supportPhone: '+91 91186 78519',
    address: 'Greater Noida West, Uttar Pradesh 201009, India',
    gstin: null,                       // TODO: fill from client
    logoUrl: null
  },
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  defaultTaxPercent: 18,               // admin-managed global GST; per-store override on store.settings
  order: {
    otpLength: 4,                      // handover (pickup/delivery) OTP length
    otpTtlMinutes: 120,
    allowCashOnDelivery: true,         // COD offered to customers (client confirmed)
    autoCompleteAfterHours: 72,        // auto COMPLETED if no rating
    pickupSlotsEnabled: true           // customer picks a pickup slot at checkout
  },
  payout: {
    cadence: 'WEEKLY',                 // WEEKLY | DAILY | MANUAL — settlement period
    defaultCommissionPercent: 20,      // applied when admin onboards a store (then editable per store)
    gatewayFeeBorneBy: 'PLATFORM',     // PLATFORM | STORE
    requireApproval: true,             // maker–checker on payout runs
    holdFundsUntilKyc: true
  },
  features: { smsOrderAlertsEnabled: true, reorderEnabled: false },  // auth OTP SMS is always on
  updatedByUserId, updatedAt
}
```

## 4.14 `auditLogs` / `counters`

```ts
// auditLogs
{ _id, actorUserId, actorRole, action: string, entity: string, entityId,
  before?: object, after?: object, ip?, at: Date }
// counters  (atomic $inc via findOneAndUpdate)
{ _id: 'orderRef' | 'invoiceNumber' | 'ticketRef' | 'payoutRef', seq: number }
```

## 4.15 Relationships (summary)

```
users(CUSTOMER) 1─* orders *─1 stores 1─* users(RIDER|STORE_STAFF)
orders 1─1 invoices    orders 1─1 payments    orders *─1 payouts (via settlement.payoutId)
orders *─1 users(RIDER) via pickup.riderId / delivery.riderId
stores 1─* payouts        stores 1─1 gateway linked/vendor account (payout.providerLinkedAccountId)
coupons 1─* couponRedemptions *─1 orders
tickets *─1 users (raisedBy) , *─1 orders (optional)
zones *─1 stores           authOtps ─ (phone) ─ users
```

## 4.16 Data rules

- **Snapshots over joins** for anything shown historically: order items snapshot service
  name/unit/price; order addresses snapshot the user address. Catalog edits never rewrite
  past orders.
- **Denormalised counters** (`store.ratingAvg`, `order.paymentStatus`) are updated in the
  same service transaction that changes the source.
- **Soft state, hard log:** the current `status` lives on the order; every change is also
  appended to `timeline`.
- **Never hard-delete** orders, invoices, payments, tickets. Use status/`cancellation`.
  Users may be `SUSPENDED`; account deletion (if built) anonymises PII but keeps order rows.
- **Geo:** every address and store carries a GeoJSON `Point`; routing uses `2dsphere`.
