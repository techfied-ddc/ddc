# 12 — Admin Panel (`admin.desiredrycleaning.in`)

Desktop-first SPA for the business owner / HQ operators. Dense tables, filters, bulk
actions, detail drawers. Not a PWA (internal tool).

## 12.1 Layout

Left sidebar nav + top bar (search, notifications, admin menu). Sections:

| Section | Route | Purpose |
|---|---|---|
| Dashboard | `/` | Network KPIs, routing-queue alert, recent activity |
| Orders | `/orders` | All orders, filters, detail, manual actions |
| Routing queue | `/orders/routing` | `ROUTING_FAILED` + rejected — assign a store |
| Stores | `/stores` | Onboard, approve, profiles, commission %, SLA/TAT, GST, service-area, analytics |
| Payouts | `/payouts` | Settlement statements per store; generate, approve, mark paid, adjust, reconcile |
| Users | `/users` | Customers + staff/riders; profile, orders, suspend, coupons |
| Catalog | `/catalog` | Service categories & services (image, name, description, price) |
| Coupons | `/coupons` | Create/manage global + user-assigned codes |
| Helpdesk | `/tickets` | Support queue |
| Analytics | `/analytics` | Business reports & exports |
| Settings | `/settings` | Global config, GST default, payout cadence & default commission, COD, feature flags, admin accounts, audit log |

## 12.2 Dashboard

- KPI tiles: today's orders, revenue (paid), active stores, orders in each macro-stage,
  avg rating, **routing queue size + oldest age** (red if > 15 min).
- Charts: orders/day (30d), revenue/day, orders by store, status funnel.
- Feed: new store registrations, escalated tickets, cancellations, failed routings.

## 12.3 Orders

- Table: `ref`, customer, store, status, payment, estimate/invoice total, placed-at,
  updated-at. Filters: store, status, payment status, date range, has-ticket, routing method.
- Row → detail drawer/page: full timeline, items (est vs verified), invoice, payment +
  events, riders, addresses on a mini-map, linked tickets.
- **Manual actions** (audited): reassign store, reassign rider, cancel (reason, auto-refund
  if paid), issue refund (full/partial), resend OTP, add internal note, contact customer.

## 12.4 Routing queue

- Cards/table of unrouted orders with pincode + map pin, age timer, failure reason.
- "Assign store" → searchable store list filtered by proximity / covering pincode →
  `ADMIN_ASSIGN`.
- Bulk-assign when several share a pincode.
- Shortcut: "Create/extend a zone for this pincode" → opens zone editor pre-filled.

## 12.5 Stores

- Tabs: **Pending** / **Approved** / **Suspended** / **Rejected**. Launch = 3 stores.
- **Onboard a store** wizard (`POST /stores`): business info + address (map pin) → service
  area (pincodes/polygon) → **commission %** → **GST** (rate + GSTIN) → **SLA/TAT**
  (default turnaround + optional per-category hours) → **pickup-slot defaults** (windows +
  capacity) → create **owner account** (phone/email, invite). Store can be created directly
  `APPROVED`.
- Pending detail (self-registered): business info, address on map, hours → **Approve**
  (then set commission/GST/SLA) / **Reject (reason)**.
- Approved detail: profile (editable), **service-area override**, manual location→store
  mapping, **commission %** (`PATCH /stores/:id/commission`), **SLA/TAT**
  (`PUT /stores/:id/sla`), **GST** (`PATCH /stores/:id/gst`), **payout/KYC status**, store
  analytics, riders list, order history, suspend toggle.
- Store leaderboard (volume, GMV, platform commission earned, rating, on-time %).

## 12.5b Payouts / settlement (ADR-0009)

- **Per-store balances**: pending accrual, last statement, KYC/linked-account status.
- **Generate run** (`POST /payouts/run`): pick period (defaults to `settings.payout.cadence`)
  and optionally a single store → creates `DRAFT` statements.
- **Statement detail**: online gross, online commission, COD gross, COD commission due,
  adjustments (`+/-` with reason), **net to store**, included orders (drill to each order's
  `settlement`).
- **Approve** (`SUPER_ADMIN`, maker–checker) → `PROCESSING`. `MANUAL_BANK` → **mark paid**
  with a reference. `GATEWAY_ROUTE` statements are reconciliation-only (funds already
  auto-settled).
- **`STORE_OWES`** (net negative, COD-heavy period): flag, generate a collection note, carry
  forward or record offline settlement.
- **Reconcile** (`GET /payouts/reconcile`): our figures vs the gateway settlement report;
  highlight deltas.
- Every state change is audit-logged.

## 12.6 Users

- Table: name, email, phone, role, status, #orders, joined. Filter by role/status, search.
- Customer detail: profile, addresses, order history, tickets, **assign coupon** (pick/
  create a `USER`-scoped code), suspend/reactivate.
- Staff/rider rows link to their store.

## 12.7 Catalog

- Categories: name, slug, image, sort, active; drag to reorder.
- Services: category, name, unit, **base price** (estimate only), image, addons,
  turnaround hours, active, sort. Inline edit + bulk activate/deactivate.
- Changes take effect on the website + customer app immediately (cache bust); past orders
  keep their snapshots.

## 12.8 Coupons

- List with usage stats (redemptions, discount ₹ given, remaining limit).
- Create: code, type (percent/flat), value, max discount, min order, scope
  (global / user), validity window, total & per-user limits.
- User-assigned: attach `userIds`; those users see it as "your offer".
- Deactivate anytime.

## 12.9 Helpdesk

- Queue: `ref`, subject, opener (customer/store), linked order, priority, status,
  assignee, age, last update. SLA colouring on first-response and resolution age.
- Detail: threaded messages (public + **internal** notes), reply box, assign, set priority/
  status, link/unlink an order, close. Canned responses (v1.1).

## 12.10 Analytics

- Range picker + store filter.
- **GMV** (Σ grandTotal) vs **platform revenue** (Σ commission), orders by status/day, AOV,
  Online vs COD split, routing accuracy (auto/manual/failed), avg turnaround & on-time %
  vs SLA by store, ratings distribution, coupon cost, cancellation reasons, new customers,
  repeat rate, payout totals per period.
- CSV export per entity (orders, payments, payouts, stores, coupons).

## 12.11 Settings

- Business profile (name, contacts, address, **GSTIN**, logo) → seeds `settings.business`.
- Financial: **default GST %**, currency (locked INR v1), **COD on/off**, auto-complete hours.
- **Payout**: cadence (weekly/daily/manual), **default commission %** for new stores,
  gateway-fee-borne-by, require-approval toggle, hold-funds-until-KYC toggle.
- Order: handover-OTP length & TTL, pickup slots on/off (global).
- Feature flags: `smsOrderAlertsEnabled` (auth OTP SMS always on), `reorderEnabled`.
- **Admin accounts**: create/disable admins, `SUPER_ADMIN` only; `ADMIN` vs `SUPER_ADMIN`.
- **Audit log**: filterable table of sensitive actions (actor, action, entity, before/after,
  time, IP).

## 12.12 Access & data

- `ADMIN` for all sections; `SUPER_ADMIN` additionally for admin-accounts + feature flags.
- Every mutation writes `auditLogs`.
- Query keys: `['admin','dashboard']`, `['orders',filter]`, `['routingQueue']`,
  `['stores',status]`, `['store',id]`, `['payouts',filter]`, `['payout',id]`,
  `['users',filter]`, `['catalog']`, `['coupons']`, `['tickets',filter]`,
  `['analytics',...]`, `['settings']`.
- Socket `admin` room: `routing:failed`, `order:created`, `ticket:updated` badge counts.
