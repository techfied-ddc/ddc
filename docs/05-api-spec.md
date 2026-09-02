# 05 — API Specification

Base URL: `https://api.desiredrycleaning.in` (local: `http://localhost:4000`).
All endpoints under `/api/v1`. JSON only. This doc is the catalogue; request/response
schemas are defined once in `packages/shared` (Zod) and imported by both sides.

## 5.1 Conventions

- **Versioning:** path prefix `/api/v1`.
- **Auth:** `Authorization: Bearer <accessToken>`. Refresh token is an httpOnly cookie
  (`rt`) scoped to `.desiredrycleaning.in`. See `docs/07-auth-rbac.md`.
- **Success:** `{ "ok": true, "data": <payload>, "meta"?: { page, limit, total } }`
- **Error:** `{ "ok": false, "error": { "code": "STRING_ENUM", "message": "...", "details"?: any } }`
  with a correct HTTP status.
- **Pagination:** `?page=1&limit=20` (limit ≤ 100). Lists return `meta`.
- **Filtering/sort:** documented per endpoint; `?sort=-createdAt`.
- **Idempotency:** mutating POSTs that create money-relevant records accept
  `Idempotency-Key` header.
- **IDs** in URLs and payloads are strings.
- **Money** fields are integer paise.
- **Rate limits:** `429` with `error.code = RATE_LIMITED` and `Retry-After`.
- **Request id:** every response carries `X-Request-Id`; include it in bug reports.

### Standard error codes
`VALIDATION_ERROR`, `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`,
`CONFLICT`, `RATE_LIMITED`, `PAYMENT_ERROR`, `ROUTING_FAILED`, `INVALID_STATE_TRANSITION`,
`OTP_INVALID`, `OTP_EXPIRED`, `LOGIN_OTP_INVALID`, `LOGIN_OTP_COOLDOWN`, `COUPON_INVALID`,
`STORE_NOT_APPROVED`, `SLOT_UNAVAILABLE`, `PAYOUT_NOT_APPROVED`, `KYC_REQUIRED`, `INTERNAL`.

## 5.2 Auth & session — `/auth`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/otp/request` | – (rate-limited) | `{ phone }` → send 6-digit SMS login OTP (ADR-0010); 30s resend cooldown |
| POST | `/auth/otp/verify` | – (rate-limited) | `{ phone, code }` → tokens + `rt` cookie; creates a CUSTOMER if new; a store-created rider logs in as RIDER |
| POST | `/auth/register` | – | Email+password sign up (role defaults to CUSTOMER; `?intent=store` starts store owner reg) |
| POST | `/auth/login` | – | Email+password login → access token + sets `rt` cookie |
| POST | `/auth/link` | bearer | Link another identity (phone↔Google↔email) to the current user |
| GET | `/auth/google` | – | Redirect to Google consent |
| GET | `/auth/google/callback` | – | OAuth callback → issues tokens, redirects to app |
| POST | `/auth/refresh` | cookie | New access token from `rt` cookie (rotates refresh) |
| POST | `/auth/logout` | bearer | Revoke refresh token, clear cookie |
| POST | `/auth/forgot-password` | – | Email a reset link |
| POST | `/auth/reset-password` | – | Set new password from token |
| POST | `/auth/verify-email` | – | Confirm email token |
| GET | `/auth/me` | bearer | Current user + role + store context |

## 5.3 Users & profile — `/users`, `/me`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/me` | any | Own profile |
| PATCH | `/me` | any | Update name, phone, avatar |
| GET | `/me/addresses` | CUSTOMER | List saved addresses |
| POST | `/me/addresses` | CUSTOMER | Add address (geocoded) |
| PATCH | `/me/addresses/:id` | CUSTOMER | Edit / set default |
| DELETE | `/me/addresses/:id` | CUSTOMER | Remove |
| GET | `/users` | ADMIN | Search/paginate users (`?q=&role=&status=`) |
| GET | `/users/:id` | ADMIN | User detail + order summary |
| PATCH | `/users/:id` | ADMIN | Suspend/reactivate, edit |
| GET | `/users/:id/orders` | ADMIN | That user's orders |

## 5.4 Service catalog — `/catalog`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/catalog/categories` | public | Active categories |
| GET | `/catalog/services` | public | Active services (`?category=&q=`) |
| GET | `/catalog/services/:slug` | public | One service |
| POST | `/catalog/categories` | ADMIN | Create |
| PATCH | `/catalog/categories/:id` | ADMIN | Update / reorder / toggle |
| POST | `/catalog/services` | ADMIN | Create |
| PATCH | `/catalog/services/:id` | ADMIN | Update price/unit/image/active |
| DELETE | `/catalog/services/:id` | ADMIN | Soft-deactivate |

## 5.5 Cart & estimate — `/cart`

Cart may be client-side (Zustand) and only validated server-side at estimate/checkout.

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/cart/estimate` | CUSTOMER | Body: items[], addressId, couponCode? → priced estimate + **serving-store preview** (id, name, whether it covers the address) |
| GET | `/stores/:id/pickup-slots?date=YYYY-MM-DD` | CUSTOMER | Bookable pickup windows for that store/date with remaining capacity (respects `leadTimeMinutes`, `horizonDays`, per-window `enabled`) |

## 5.6 Orders — `/orders`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/orders` | CUSTOMER | Place order (items, addressId, deliveryAddressId?, couponCode?, **paymentMode**, **pickupSlot {date,windowId}**) → validates slot capacity → routes to a store |
| GET | `/orders` | CUSTOMER | My orders (`?status=&page=`) |
| GET | `/orders` | STORE_* | Store's orders (`?status=&tab=new|inprocess|ready`) |
| GET | `/orders` | ADMIN | All orders (`?store=&status=&payment=&from=&to=`) |
| GET | `/orders/:id` | owner/store/admin | Order detail incl. timeline, invoice, payment |
| POST | `/orders/:id/cancel` | CUSTOMER (pre-pickup), STORE_*, ADMIN | Cancel with reason |
| POST | `/orders/:id/accept` | STORE_* | Accept a routed order |
| POST | `/orders/:id/reject` | STORE_* | Reject with reason (→ admin requeue) |
| POST | `/orders/:id/assign-pickup` | STORE_* | `{ riderId, scheduledAt?, slot? }` → generates pickup OTP |
| POST | `/orders/:id/assign-delivery` | STORE_* | `{ riderId, promisedAt? }` → generates delivery OTP |
| POST | `/orders/:id/pickup/verify-otp` | RIDER | `{ otp }` → PICKED_UP |
| POST | `/orders/:id/delivery/verify-otp` | RIDER | `{ otp }` → DELIVERED (requires payment complete unless COD allowed) |
| POST | `/orders/:id/receive` | STORE_* | Record garment verification: `items[{ itemId, verifiedQty, finalUnitPrice?, storeNote?, photos[] }]` → AT_STORE |
| POST | `/orders/:id/status` | STORE_* | Advance processing: `{ to: 'IN_PROCESS'|'READY', note? }` |
| PATCH | `/orders/:id/delivery-time` | STORE_* | Set/adjust promised delivery time |
| POST | `/orders/:id/store-feedback` | STORE_* | Internal service feedback/notes |
| POST | `/orders/:id/rating` | CUSTOMER | `{ rating, comment? }` → COMPLETED |
| POST | `/orders/:id/reassign-store` | ADMIN | Manual routing from the fallback queue `{ storeId, reason }` |
| GET | `/orders/routing-queue` | ADMIN | Orders in `ROUTING_FAILED` |
| POST | `/orders/:id/resend-otp` | CUSTOMER/STORE_* | Regenerate a pickup/delivery OTP (`{ kind }`) |

All transitions validated by the shared order state machine; invalid → `409
INVALID_STATE_TRANSITION`.

## 5.7 Invoicing — `/orders/:id/invoice`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/orders/:id/invoice` | STORE_* | Create/replace draft invoice: `{ lines[], taxPercent?, discount? }` |
| POST | `/orders/:id/invoice/issue` | STORE_* | Finalise invoice → INVOICED; if `paymentMode=ONLINE` create the split payment link, if `COD` just record amount due |
| GET | `/orders/:id/invoice` | owner/store/admin | Get invoice (+ PDF url) |
| POST | `/orders/:id/invoice/void` | STORE_*/ADMIN | Void (only if unpaid) |

## 5.8 Payments — `/payments`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/payments/:orderId` | owner/store/admin | Payment status + link |
| POST | `/payments/:orderId/refund` | ADMIN | `{ amount?, reason, reverseSplit? }` (full/partial) |
| POST | `/webhooks/payments/:provider` | – (signed) | Gateway webhook (`razorpay`/`cashfree`); raw-body signature verify; idempotent |
| POST | `/payments/:orderId/mark-cod-collected` | STORE_*/RIDER | COD orders — records cash received |

## 5.8b Payouts & settlement — `/payouts` (ADR-0009)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/stores/mine/earnings` | STORE_* | Pending balance, current accrual, per-order breakdown |
| GET | `/stores/mine/payouts` | STORE_* | My settlement statements |
| PUT | `/stores/mine/payout-account` | STORE_OWNER | Submit/update payout bank/UPI + KYC docs → creates gateway linked account |
| GET | `/payouts` | ADMIN | All statements (`?store=&status=&period=`) |
| POST | `/payouts/run` | ADMIN | Generate `DRAFT` statements for a period (`{ periodStart, periodEnd, storeId? }`) |
| GET | `/payouts/:id` | ADMIN/owner | Statement detail + included orders |
| POST | `/payouts/:id/approve` | SUPER_ADMIN | Maker–checker approve → PROCESSING |
| POST | `/payouts/:id/mark-paid` | ADMIN | For `MANUAL_BANK` — record reference + `PAID` |
| POST | `/payouts/:id/adjust` | ADMIN | Add a ± adjustment line with reason |
| GET | `/payouts/reconcile?period=` | ADMIN | Our figures vs gateway settlement report |

## 5.9 Stores — `/stores`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/stores/register` | STORE_OWNER (fresh) | Submit store for approval (business info, address, area) |
| GET | `/stores/mine` | STORE_* | My store profile + approval status |
| PATCH | `/stores/mine` | STORE_OWNER | Update business profile, hours, settings (NOT commission/SLA — admin-only) |
| PUT | `/stores/mine/service-area` | STORE_OWNER | Set pincodes / polygon / radius + store location |
| PUT | `/stores/mine/pickup-slots` | STORE_OWNER | Configure pickup windows: enable/disable, capacity, days, lead time, horizon |
| GET | `/stores/mine/analytics` | STORE_* | KPIs (`?from=&to=`) |
| GET | `/stores/mine/ops` | STORE_* | Daily ops board data |
| POST | `/stores` | ADMIN | **Admin onboards a store**: creates store + owner user, sets commission %, GST, SLA, area, slot defaults |
| GET | `/stores` | ADMIN | All stores (`?status=`) |
| GET | `/stores/:id` | ADMIN | Store detail + analytics + payout/KYC status |
| POST | `/stores/:id/approve` | ADMIN | Approve (activates owner account) |
| POST | `/stores/:id/reject` | ADMIN | Reject with reason |
| POST | `/stores/:id/suspend` | ADMIN | Suspend / unsuspend |
| PUT | `/stores/:id/service-area` | ADMIN | Override area / manual zone mapping |
| PATCH | `/stores/:id/commission` | ADMIN | Set `payout.commissionPercent` |
| PUT | `/stores/:id/sla` | ADMIN | Set `defaultTurnaroundHours` + per-category hours (onboarding-set, admin-editable) |
| PATCH | `/stores/:id/gst` | ADMIN | Set store GSTIN + `taxPercentOverride` |

## 5.10 Riders — `/riders` (managed by their store)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/riders` | STORE_* | Store's riders |
| POST | `/riders` | STORE_OWNER | Add rider `{ name, phone, vehicleNumber, liveSelfie(upload), password? }` — rider logs in via phone OTP (password optional fallback) |
| PATCH | `/riders/:id` | STORE_OWNER | Edit / activate / deactivate |
| GET | `/riders/me/jobs` | RIDER | My jobs (`?status=assigned|inprogress|completed&date=`) |
| GET | `/riders/me/jobs/:orderId` | RIDER | Job detail (address, phone, items, navigate url) |
| POST | `/riders/me/jobs/:orderId/status` | RIDER | `{ jobRole:'PICKUP'|'DELIVERY', to:'ACCEPTED'|'REACHED'|'DONE' }` |

## 5.11 Coupons — `/coupons`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/coupons/validate` | CUSTOMER | `{ code, estimateTotal }` → discount preview |
| GET | `/coupons` | ADMIN | List |
| POST | `/coupons` | ADMIN | Create (global or user-assigned) |
| PATCH | `/coupons/:id` | ADMIN | Update / deactivate |
| POST | `/coupons/:id/assign` | ADMIN | `{ userIds[] }` |

## 5.12 Tickets / helpdesk — `/tickets`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/tickets` | CUSTOMER/STORE_* | Open a ticket `{ subject, body, orderId?, attachments[] }` |
| GET | `/tickets` | CUSTOMER/STORE_* | My tickets |
| GET | `/tickets` | ADMIN | All (`?status=&priority=&assignee=`) |
| GET | `/tickets/:id` | participant/admin | Thread |
| POST | `/tickets/:id/messages` | participant/admin | Reply (`internal` flag for admins) |
| PATCH | `/tickets/:id` | ADMIN | Assign, set priority/status |
| POST | `/tickets/:id/close` | ADMIN/opener | Close |

## 5.13 Notifications — `/notifications`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/notifications` | any | Feed (`?unread=1`) |
| POST | `/notifications/read` | any | Mark ids / all read |
| POST | `/notifications/push/subscribe` | any | Save Web Push subscription |
| POST | `/notifications/push/unsubscribe` | any | Remove subscription |

## 5.14 Analytics — `/analytics`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/analytics/store` | STORE_* | Orders, revenue, TAT, rating, rider performance, funnel |
| GET | `/analytics/admin/overview` | ADMIN | Network KPIs, revenue trend, store leaderboard |
| GET | `/analytics/admin/orders` | ADMIN | Order volume by status/store/day |
| GET | `/analytics/admin/coupons` | ADMIN | Coupon usage + discount cost |
| GET | `/analytics/admin/export` | ADMIN | CSV export (`?entity=orders&from=&to=`) |

## 5.15 Media — `/media`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/media/sign` | any (scoped) | Returns a signed Cloudinary upload payload (`folder`, `type` constrained by role) |

Direct browser → Cloudinary upload with the signed payload; the resulting URL is sent back
in the relevant domain request (rider selfie, garment photos, ticket attachments).

## 5.16 Website — `/site`

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/site/services` | public | Catalog for the marketing site (cached) |
| POST | `/site/contact` | public (rate-limited + captcha) | Contact form → creates an admin ticket/lead |
| GET | `/site/coverage` | public | Serviceable pincodes/areas (for "do you deliver to me?") |

## 5.17 Health & meta

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness (no DB) |
| GET | `/readyz` | Readiness (DB + Redis ping) |
| GET | `/api/v1/meta/settings` | Public subset of `settings` (currency, tz, support contacts, feature flags) |

## 5.18 Socket.IO events

Namespace `/` , authenticated with the access token in the connection auth payload.

**Rooms:** `user:<id>`, `store:<id>`, `rider:<id>`, `admin`.

| Event (server→client) | Room | Payload |
|---|---|---|
| `order:created` | store, admin | `{ orderId, ref, status }` |
| `order:status` | user, store, rider, admin | `{ orderId, status, at }` |
| `order:updated` | involved rooms | `{ orderId }` (client refetches) |
| `payment:updated` | user, store, admin | `{ orderId, paymentStatus }` |
| `rider:assigned` | user, rider | `{ orderId, kind:'PICKUP'|'DELIVERY' }` |
| `routing:failed` | admin | `{ orderId, ref, reason }` |
| `ticket:updated` | participant, admin | `{ ticketId, status }` |
| `notification:new` | user | `{ id, title }` |

Clients treat socket events as cache-invalidation hints; the API remains the source of truth.
