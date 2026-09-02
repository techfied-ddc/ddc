# 02 — Requirements

Priority: **M** = Must (v1), **S** = Should (v1 if time), **C** = Could (later), **W** = Won't (this release).
IDs are stable — reference them from code, PRs, and tests.

## 2.1 Functional requirements

### Website (`desiredrycleaning.in`)

| ID | Requirement | Pri |
|---|---|---|
| FR-WEB-01 | Public pages: Home, Services (pulled from live catalog), About Us, Contact Us | M |
| FR-WEB-02 | Contact form creates a lead / ticket for admin | M |
| FR-WEB-03 | Sign in / Sign up with Google OAuth and email+password | M |
| FR-WEB-04 | After auth, route the user to the customer app or store platform by role/intent | M |
| FR-WEB-05 | "Become a partner store" CTA linking to `store.desiredrycleaning.in` registration | M |
| FR-WEB-06 | SEO: server-rendered meta/OG tags, sitemap, robots, structured data | S |
| FR-WEB-07 | Service-area / city coverage section | C |

### Customer app (`user.desiredrycleaning.in`, PWA)

| ID | Requirement | Pri |
|---|---|---|
| FR-USR-01 | Installable PWA; 4 bottom tabs: Services, Cart, My Orders, Profile | M |
| FR-USR-02 | Sign in/up via **phone OTP (SMS)** — primary — plus Google + email; session persists; works from the direct link | M |
| FR-USR-02a | Choose **payment mode (Online / COD)** at checkout; editable until the invoice is issued | M |
| FR-USR-02b | Choose a **pickup date + time slot** at checkout from the serving store's available windows | M |
| FR-USR-03 | Capture / manage delivery addresses with geolocation + manual pin adjust | M |
| FR-USR-04 | Browse service catalog by category; view price, unit, description, photo | M |
| FR-USR-05 | Add services to cart with quantity and per-item notes | M |
| FR-USR-06 | Cart shows an **estimated** total (clearly labelled non-binding) | M |
| FR-USR-07 | Apply a coupon code; see discounted estimate | M |
| FR-USR-08 | Place order → order is routed to a store by address; show assigned store | M |
| FR-USR-09 | If no store serves the address, tell the user and offer to notify them | M |
| FR-USR-10 | My Orders: list + detail with a live status timeline | M |
| FR-USR-11 | On pickup assignment, show rider name, photo, vehicle no., contact, ETA/slot | M |
| FR-USR-12 | Show **pickup OTP**; hide once pickup is verified | M |
| FR-USR-13 | After garments verified, view the **binding invoice** (line items, tax, discount, total) | M |
| FR-USR-14 | Pay the invoice via the payment link; see payment status update live | M |
| FR-USR-15 | On delivery, show **delivery OTP**; delivery blocked until payment is complete | M |
| FR-USR-16 | Rate the order (1–5 + comment) after delivery; rating closes the order | M |
| FR-USR-17 | Raise & track support tickets; see admin replies | M |
| FR-USR-18 | Push notifications for each key status change | M |
| FR-USR-19 | Reorder from a past order | C |
| FR-USR-20 | Choose a pickup time slot (if enabled in settings) | S |

### Store platform (`store.desiredrycleaning.in`, PWA) — store owner/staff

| ID | Requirement | Pri |
|---|---|---|
| FR-STR-01 | Installable PWA; 4 bottom tabs: New Order, In-process, Analytics, Profile/Settings | M |
| FR-STR-02 | Register (from website or direct link) and log in | M |
| FR-STR-03 | Account inactive until an admin approves it; show pending state | M |
| FR-STR-04 | Maintain business profile: legal name, address, contacts, GST, logo, hours | M |
| FR-STR-05 | Define the store's **service area** as pincodes and/or a map polygon; set store location | M |
| FR-STR-06 | Manage riders: add with name, contact, **vehicle/bike number**, **live selfie photo**, status | M |
| FR-STR-07 | New Order queue: see auto-routed orders; accept or reject (with reason) | M |
| FR-STR-08 | Assign a pickup rider from the store's rider list | M |
| FR-STR-09 | Record garment verification at intake: item-by-item confirm/adjust + photos | M |
| FR-STR-10 | Create/update the **invoice** (adjust quantities, add items, tax, discount) and send the payment link | M |
| FR-STR-11 | Move order through processing stages; set/adjust the promised delivery time | M |
| FR-STR-12 | Assign a delivery rider | M |
| FR-STR-13 | Record service feedback / internal notes; close the order | M |
| FR-STR-14 | Daily ops board: today's pickups, in-process, ready, deliveries, unpaid | M |
| FR-STR-15 | Store analytics: order volume, revenue, avg TAT, rating, rider performance | M |
| FR-STR-16 | Staff sub-accounts under the store (owner vs staff permissions) | S |
| FR-STR-17 | Real-time updates without refresh (new order, payment received) | M |
| FR-STR-18 | Configure **pickup slot windows**: which show, capacity per window, days, lead time, booking horizon | M |
| FR-STR-19 | Submit/maintain **payout account + KYC**; funds held until KYC verified | M |
| FR-STR-20 | **Earnings & settlement**: pending balance, current accrual, per-order commission breakdown, past statements | M |
| FR-STR-21 | Mark **COD cash collected** for an order (store or rider) | M |
| FR-STR-22 | View (read-only) the admin-set commission %, SLA/TAT, and GST for the store | M |

### Rider (role inside the store platform)

| ID | Requirement | Pri |
|---|---|---|
| FR-RID-01 | Rider logs in and sees only their assigned jobs | M |
| FR-RID-02 | Job list grouped: Assigned / In-progress / Completed (with date filter) | M |
| FR-RID-03 | Job detail: customer name, address, phone, order items summary, pickup/delivery type | M |
| FR-RID-04 | **One-tap "Navigate"** → opens Google Maps directions to the address | M |
| FR-RID-05 | Pickup: enter the customer's **pickup OTP** to confirm collection; optional garment photos | M |
| FR-RID-06 | Delivery: enter the customer's **delivery OTP** to confirm handover; for COD, mark cash collected first (delivery blocked until paid) | M |
| FR-RID-00 | Rider logs in via **phone OTP** at the store platform | M |
| FR-RID-07 | Mark "reached", "picked up", "handed to store", "out for delivery", "delivered" | M |
| FR-RID-08 | See count of pending vs completed jobs for the day | M |
| FR-RID-09 | Cannot see other riders' jobs or store financials | M |

### Admin panel (`admin.desiredrycleaning.in`)

| ID | Requirement | Pri |
|---|---|---|
| FR-ADM-01 | Manage service catalog: categories, services, price, unit, image, active flag | M |
| FR-ADM-02 | Manage users: search, view profile + order history, suspend | M |
| FR-ADM-03 | Assign special/personal **coupon codes** to a user or globally | M |
| FR-ADM-04 | Manage stores: review registrations, **approve / reject / suspend**, edit profile | M |
| FR-ADM-05 | Manage/override a store's **service area**; set a manual location→store mapping | M |
| FR-ADM-06 | View all orders across the network; filter by store, status, date, payment | M |
| FR-ADM-07 | **Routing fallback queue**: unrouted orders highlighted; admin assigns a store manually | M |
| FR-ADM-08 | Helpdesk: view/assign/reply/close tickets; SLA indicators | M |
| FR-ADM-09 | Business analytics: revenue, orders, stores leaderboard, TAT, ratings, coupons used | M |
| FR-ADM-10 | Global settings: business info, tax %, currency, timezone, feature flags, support contacts | M |
| FR-ADM-11 | Manual intervention on any order (reassign store/rider, cancel, refund) | M |
| FR-ADM-12 | Audit log of sensitive admin actions | M |
| FR-ADM-13 | Multiple admin accounts with role levels (`ADMIN` vs `SUPER_ADMIN`) | M |
| FR-ADM-14 | Broadcast announcement / push to customers or stores | C |
| FR-ADM-15 | **Onboard a store directly**: create store + owner, set commission %, GST, SLA/TAT (default + per-category), service area, pickup-slot defaults | M |
| FR-ADM-16 | Set/edit a store's **commission %**, **SLA/TAT**, **GST rate + GSTIN** at any time | M |
| FR-ADM-17 | **Payouts**: generate periodic settlement statements per store; view line-by-line (online gross, commission, COD commission due, adjustments, net) | M |
| FR-ADM-18 | **Approve** payout runs (maker–checker; `SUPER_ADMIN`); mark manual payouts paid; add adjustments | M |
| FR-ADM-19 | Reconcile our settlement figures against the gateway's settlement report | S |
| FR-ADM-20 | Set global GST default, payout cadence, default commission %, COD on/off | M |

### Cross-cutting

| ID | Requirement | Pri |
|---|---|---|
| FR-X-01 | Single order state machine enforced server-side (see doc 06) | M |
| FR-X-02 | Location-based routing with admin fallback (see doc 09) | M |
| FR-X-03 | Payment provider adapter with **marketplace split settlement** + webhook-driven status; **store payouts / commission** engine (see doc 08, ADR-0003/0009) | M |
| FR-X-04 | Notifications: in-app + web push always; email for invoices/receipts/statements; **SMS core for login OTP** + optional order alerts | M |
| FR-X-09 | Phone-OTP auth (`authOtps`), SMS provider adapter, DLT-compliant templates (see ADR-0010) | M |
| FR-X-10 | Per-store pickup-slot capacity model; slot validated at placement | M |
| FR-X-05 | Money stored in paise; one currency from settings | M |
| FR-X-06 | Media uploads (photos, selfies) via Cloudinary with size/type limits | M |
| FR-X-07 | Human-readable order reference `DPD-XXXXXX` in addition to the internal id | M |
| FR-X-08 | Seed script: 1 admin, sample catalog, 1 approved demo store + rider, demo customer | M |

## 2.2 Non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| NFR-01 | Performance | Customer app first load ≤ 2.5s on 4G mid-range phone; API p95 ≤ 300ms for reads |
| NFR-02 | PWA | Lighthouse PWA install criteria met; offline shell for user & store apps |
| NFR-03 | Availability | Target 99.5% monthly for API; graceful degradation if Redis/maps unavailable |
| NFR-04 | Security | OWASP Top 10 addressed; RBAC default-deny; secrets only in env; OTPs hashed at rest |
| NFR-05 | Privacy | Collect minimum PII; addresses/phones access-scoped by role; delete-account flow (S) |
| NFR-06 | Data integrity | All writes validated by Zod; order transitions atomic; idempotent webhooks |
| NFR-07 | Observability | Structured logs (pino), request ids, Sentry error tracking, uptime check |
| NFR-08 | Scalability | Stateless API (scale horizontally); sockets via Redis adapter; jobs via queue |
| NFR-09 | Backups | Atlas continuous backup / daily snapshot; documented restore procedure |
| NFR-10 | Accessibility | WCAG 2.1 AA for customer & store apps: keyboard nav, contrast, labels |
| NFR-11 | Browser support | Latest 2 versions of Chrome, Safari, Edge, Firefox; iOS Safari 16+; Android Chrome |
| NFR-12 | Maintainability | Shared types package; module-per-feature API; ≥ 60% coverage on business logic |
| NFR-13 | Compliance | Payment handling delegated to gateway (no card data touches our servers) |
| NFR-14 | i18n-ready | Strings centralised even though only one language ships in v1 |
| NFR-15 | Rate limiting | Auth, OTP verify, coupon apply, ticket create are rate-limited per IP + per user |
| NFR-16 | Design system | All UI conforms to `docs/20` — dark-only black & gold, liquid-glass surfaces, shared tokens/components/motion from `packages/ui`; no ad-hoc colours, spacing, or animation |
| NFR-17 | Motion safety/perf | Motion animates only transform/opacity/filter; `prefers-reduced-motion` fully honoured; ≤ 4 concurrent `backdrop-filter` layers; no scroll-linked animation on long lists |
| NFR-18 | Responsive / mobile-first | Every surface designed at ~375px first, enhanced to tablet/desktop; verified at 375 / 768 / 1280; no horizontal page scroll; 44px touch targets; safe-area insets; correct mobile keyboards; PWAs verified on real Android + iOS. Checklist: `docs/22` §22.6 |
| NFR-19 | Built for change | Module boundaries, named constants (no magic values), config over hard-coding, adapters at every external seam, single source of truth in `packages/shared` — so the customer can amend/extend safely. See `docs/22` §22.2 |
| NFR-20 | Ways of working | Development follows `docs/22`: full-stack ownership, no half-work, ask-don't-assume, docs+memory updated every session, step-by-step manual-work handoff |
