# 10 — Customer App (`user.desiredrycleaning.in`)

Installable PWA, **mobile-first**, "mostly used via phone". Feels like a native app: fixed
bottom tab bar, large touch targets, minimal chrome. Desktop = centered mobile-width column.

## 10.1 Navigation — 4 bottom tabs

| Tab | Route | Purpose |
|---|---|---|
| **Services** | `/` | Browse catalog, search, categories, add to cart |
| **Cart** | `/cart` | Review items, address, coupon, estimate, place order |
| **My Orders** | `/orders` | Active + past orders, live status |
| **Profile** | `/profile` | Account, addresses, tickets, settings, install prompt, logout |

Auth screens (`/login`, `/signup`, `/auth/callback`) render without the tab bar.
Order detail `/orders/:id` is a pushed screen with a back button.

## 10.2 Screens

### Auth
- **Phone number → OTP** is the primary path: enter phone → 6-digit SMS code → verified.
  30s resend cooldown, clear error states (`LOGIN_OTP_INVALID` / `LOGIN_OTP_COOLDOWN`).
- Google button + email/password also offered. If a phone matches an account that also has
  Google/email, offer to link.
- "Continue" deep-links back to the intended screen. Works from the website or the direct
  link; session comes from the shared `.desiredrycleaning.in` cookie when available.

### Services (catalog)
- Category chips / grid; service cards: image, name, unit (per piece/kg/pair), price,
  "Add". Quantity stepper inline; per-item note on expand; optional addons.
- Search with debounce. Empty/loading/error states.
- Sticky "View cart (n) · ₹est" bar when cart non-empty.

### Cart / checkout
- Line items with qty edit / remove / note.
- **Address selector**: saved addresses + "Add new" (map pin flow, doc 09). Pickup address
  drives routing; delivery address defaults to pickup, editable.
- On address select → `POST /cart/estimate` returns the **serving-store preview**. If not
  covered → "We don't serve this area yet" + notify-me capture (blocks checkout).
- **Pickup slot picker**: date (within the store's booking horizon) + an available time
  window (`GET /stores/:id/pickup-slots?date=`); full windows shown disabled.
- **Payment mode**: segmented control **Pay Online / Cash on Delivery**.
- Coupon field → `/coupons/validate` → shows discount.
- **Estimate breakdown**: items, discount, tax, total — with the *"final price confirmed
  after garment check"* disclaimer.
- "Place order" → `POST /orders` (items, address, slot, paymentMode, coupon):
  - success + routed → success screen with assigned store + pickup slot + "Track order".
  - `SLOT_UNAVAILABLE` → re-pick a slot. `ROUTING_FAILED` → not-covered message.

### My Orders
- Tabs: **Active** / **Completed**. Card: `ref`, status badge, store, item count, total /
  estimate, thumbnail of next action ("Show pickup OTP", "Pay invoice", "Rate").
- Pull-to-refresh; live updates via socket.

### Order detail `/orders/:id`
- **Status timeline** (customer-relevant steps) with timestamps.
- **Pickup card** (when assigned): rider name, photo, vehicle number, call button, ETA/slot,
  **big Pickup OTP** — hidden after `PICKED_UP`.
- **Invoice card** (when `INVOICED`): line items, tax, discount, total. If **Online**:
  "Pay now" (opens split payment link), live payment status, download PDF. If **COD**:
  "Pay ₹X cash to the rider on delivery" + PDF.
- **Delivery card** (when assigned): rider details + **Delivery OTP**. If unpaid:
  "Complete payment to receive your order" — Online shows the link again; COD shows the
  amount the rider will collect.
- **Rate** (when `DELIVERED`): 1–5 stars + comment → closes order.
- "Need help with this order?" → create ticket pre-linked to `orderId`.
- Cancel button visible only while allowed (before `PICKED_UP`).

### Profile
- Name, phone (edit), avatar.
- **Addresses** manager.
- **Support**: ticket list + detail thread (`/profile/tickets`, `/profile/tickets/:id`).
- **Notifications**: toggle push (subscribe/unsubscribe), view feed.
- **Install app** prompt (if not installed).
- App version, T&C, privacy, logout.

## 10.3 PWA behaviour

- Installable (manifest + SW). Icons/splash branded "Desire Premium Dry Cleaning".
- **Offline**: app shell + last-viewed orders cached (stale-while-revalidate). Mutations
  disabled offline with a clear banner; queued retry is **not** in v1.
- **Push**: prompted contextually (after first order placed, not on load). Notification
  click deep-links to the order.
- Standalone display; safe-area insets respected; no browser URL bar.

## 10.4 State & data

- Server state: TanStack Query keys — `['catalog']`, `['order', id]`, `['orders', filter]`,
  `['me']`, `['addresses']`, `['tickets']`.
- Client state (Zustand): `cart` (persisted to localStorage), `auth` (access token in
  memory), `ui`.
- Socket events invalidate `['order', id]` / `['orders']` / `['notifications']`.

## 10.5 Design notes

- Follows the **black & gold liquid-glass** system in `docs/20-design-system.md` (dark-only).
  Glass app bar + bottom tab bar + sheets + order cards; **solid `--bg-raised` rows in long
  lists** (order history) for performance.
- Type: Fraunces for screen titles, Inter for UI/body (16px base min), JetBrains Mono for
  `ref` and the OTP display.
- Motion (Framer Motion, `packages/ui/motion`): route slide transitions, bottom sheets
  spring up, `<Reveal>` on first paint, OTP digit stagger, KPI number-roll. Native scroll
  (no Lenis in the app). All motion respects `prefers-reduced-motion`.
- Status badges use the fixed colour map from `packages/ui` (shared with store + admin).
- Money always via `formatMoney` (₹, thousands sep). Dates via shared formatter (Asia/Kolkata).
- All async surfaces: skeleton (gold shimmer), empty, and error+retry states.
- Accessibility: visible gold focus ring (never removed), labelled inputs, 44px min targets,
  text contrast AA on every glass surface.
