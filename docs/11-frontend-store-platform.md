# 11 — Store Platform (`store.desiredrycleaning.in`)

Installable PWA for store owners/staff **and riders** (role-switched UI). Mobile-friendly
with a bottom tab bar; also usable on a desktop/tablet at the counter.

## 11.1 Two experiences, one app

On login the app branches by `role`:

- `STORE_OWNER` / `STORE_STAFF` → **Store console** (tabs below).
- `RIDER` → **Rider view** only (section 11.6).

## 11.2 Store console — 4 bottom tabs

| Tab | Route | Purpose |
|---|---|---|
| **New Order** | `/` | Incoming routed orders awaiting accept/reject |
| **In-process** | `/in-process` | Everything accepted → not yet delivered (the working board) |
| **Analytics** | `/analytics` | Store KPIs and reports |
| **Profile/Settings** | `/settings` | Business profile, service area, riders, staff, hours |

Order detail `/orders/:id` is a pushed screen.

## 11.3 Onboarding & approval

- Register (from website `intent=store` or direct link) → **store registration form**:
  business name, legal name, GSTIN, address (map pin), contact, operating hours.
- Screen state while `PENDING`: read-only "Awaiting approval" with a checklist of what
  admin will verify. No order access.
- On `APPROVED`: full console unlocked; must complete **service area** before orders route.
- `SUSPENDED`: banner + read-only; existing orders still visible.

## 11.4 Store console screens

### New Order
- List of `ROUTED` orders: `ref`, distance/pincode, item summary, estimate, placed-at,
  "closed at placement" flag if applicable.
- **Accept** / **Reject (reason)**. Real-time arrival (socket `order:created`) with a sound/
  badge. Auto-accept toggle in settings (`store.settings.autoAcceptOrders`).

### In-process (working board)
Grouped columns / filter chips by stage: **Accepted → Pickup → At store → Invoiced →
In process → Ready → Out for delivery**. Each card shows `ref`, customer area, next action.

Per-order actions (also on the detail screen):
1. **Assign pickup rider** — pick from active riders. The customer already chose the pickup
   date/window; store sees it. Generates pickup OTP (shown only to customer).
2. **Receive at store** — item-by-item verification: confirm/adjust `verifiedQty`, set
   `finalUnitPrice`, add items, notes, **photos** (garment condition / cloth verification).
3. **Create / issue invoice** — lines prefilled from verified items; edit qty/price, add
   lines, set discount; tax auto from the admin-set GST. "Issue" → Online: split payment
   link created + sent; COD: amount-due recorded. Customer notified + emailed.
4. **Start processing / Mark ready** — promised delivery time is derived from the store SLA
   (`pickup time + turnaround`); adjustable within reason.
5. **Assign delivery rider** — generates delivery OTP.
6. **Collect COD** (COD orders) — store or rider marks cash received; required before the
   delivery OTP will complete the order.
7. **Record service feedback** — internal note; **Finish order** (allowed once delivered +
   paid).
- Payment status + mode (Online/COD) chip on every card; live `payment:updated`.

### Analytics (store)
- Range picker (today / 7d / 30d / custom).
- KPIs: orders (by status), revenue (paid), avg turnaround (pickup→delivered), avg rating,
  on-time %, rejects, COD vs online.
- Charts: orders/day, revenue/day, status funnel, rider performance (jobs, avg time,
  ratings), top services.
- Export CSV.

### Profile / Settings
- Business profile edit; logo upload.
- **Service area**: pincode multi-select + optional polygon draw + store location pin +
  `maxRadiusKm`. Save → `PUT /stores/mine/service-area`.
- **Pickup slots**: define windows (label, start/end, days), per-window capacity, enable/
  disable each, lead time, booking horizon. Save → `PUT /stores/mine/pickup-slots`. A
  calendar preview shows today's booked-vs-capacity per window.
- **Riders**: list with photo, name, vehicle number, status; add/edit/deactivate
  (section 11.6). Reassign jobs on deactivate.
- **Staff** (owner only): invite `STORE_STAFF`, toggle granular permissions
  (`INVOICE`, `ASSIGN_RIDER`, `RECEIVE`, `ANALYTICS`).
- Operating hours, auto-accept toggle, capacity/day, COD opt-out toggle.
- **Admin-set, read-only here**: commission %, SLA/TAT (default + per-category), GST rate +
  GSTIN. Shown for transparency; changes require admin.
- Notification preferences.

### Earnings & settlement
- Pending balance + current-period accrual (`GET /stores/mine/earnings`).
- Per-order breakdown: grandTotal, mode (Online/COD), platform commission, store earning,
  COD-commission owed.
- **Payout account & KYC**: submit/update bank or UPI + KYC docs
  (`PUT /stores/mine/payout-account`); status badge (`PENDING_KYC` / `ACTIVE`); banner while
  funds are held pending KYC.
- **Statements** (`GET /stores/mine/payouts`): period, online gross, commission, COD
  commission due, adjustments, **net**, status (`PAID` / `PROCESSING` / `STORE_OWES`),
  downloadable.

## 11.5 Daily ops board

Accessible from New/In-process (a "Today" view): today's pickups (with rider + time),
items at store, ready-for-delivery, out-for-delivery, **unpaid invoices**, and a count of
SLA-breaching orders (past promised delivery time). This is the store's morning dashboard.

## 11.6 Rider view

Bottom tabs: **Jobs** / **Profile**.

### Jobs
- Segments: **Assigned** · **In progress** · **Completed** (date filter).
- Job card: order `ref`, PICKUP or DELIVERY badge, customer name, area, time/slot.
- Job detail:
  - customer name, **full address**, **call** button, order item summary;
  - **Navigate** button → opens Google Maps directions to the address;
  - status buttons: `Accept` → `Reached` → then:
    - **Pickup**: enter the customer's **Pickup OTP** → confirms collection; optional
      garment photos; then "Handed to store".
    - **Delivery**: for COD, **Collect ₹X cash** → mark collected; then enter the customer's
      **Delivery OTP** → confirms handover. OTP entry is blocked with a clear message while
      payment is still pending (Online: shows the link/QR; COD: shows the collect action).
  - "Reached / picked up / handed to store / out for delivery / delivered" progression
    mirrors `RiderJobStatus`.
- Day summary: pending vs completed counts.

### Rider constraints
- Sees only their own jobs; no store financials, no other riders, no analytics.
- Rider **logs in by phone OTP** at `store.desiredrycleaning.in` (store may set a fallback
  password).
- Rider onboarding is done by the store owner: name, phone, **vehicle/bike number**,
  **live selfie photo** (camera capture → Cloudinary).

## 11.7 PWA & realtime

- Installable; branded icons. Offline shell + cached job/order lists (read-only offline).
- Socket rooms `store:<id>` and `rider:<id>`; new order and payment events update the board
  without refresh; audible alert for new orders (store console).
- Camera permission for selfie/garment photos; graceful fallback to file picker.

## 11.8 State & data

- Query keys: `['store','mine']`, `['orders','store',filter]`, `['order',id]`,
  `['riders']`, `['rider','jobs',filter]`, `['analytics','store',range]`.
- Zustand: `auth`, `ui` (board filters, sound on/off).
- Shared status colour map + `formatMoney` from `packages/ui` / `packages/shared`.
