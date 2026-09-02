# 01 — Project Overview

## 1.0 Business profile

| Field | Value |
|---|---|
| Legal / brand name | **Desire Premium Dry Cleaning** |
| Short name | Desire Dry Cleaning |
| Primary domain | `desiredrycleaning.in` |
| Website | `https://desiredrycleaning.in` |
| Customer app | `https://user.desiredrycleaning.in` |
| Store + rider app | `https://store.desiredrycleaning.in` |
| Admin panel | `https://admin.desiredrycleaning.in` |
| API | `https://api.desiredrycleaning.in` |
| Contact email | `techfied.desiredrycleaning@gmail.com` (interim ops mailbox; switch to `support@desiredrycleaning.in` once provisioned) |
| Contact phone | `+91 91186 78519` |
| HQ / registered address | Greater Noida West, Uttar Pradesh 201009, India |
| Country / currency / timezone | India / INR / Asia/Kolkata |
| Order reference prefix | `DPD-` (customer-facing), e.g. `DPD-000123` |
| Launch region | Greater Noida West (UP) — pincode-based store routing suits this market |

These values seed the `settings` collection and the deploy config. Update here first if
they change.

## 1.1 Vision

Give a multi-location dry-cleaning business one digital platform that:

- **promotes the brand** through a public marketing website,
- lets **customers** order dry-cleaning from their phone and track it live,
- lets each **store** run its daily pickup → clean → deliver operations,
- lets **riders** (store employees) execute pickups and deliveries efficiently,
- lets the **business owner (admin)** manage the whole network — services, stores, users,
  orders, pricing rules, support, and analytics.

Every order placed by a customer is automatically sent to the store that serves that
customer's location. If automatic routing can't find a store, the admin is alerted and
assigns it manually.

## 1.2 Goals

| Goal | Measure of success |
|---|---|
| Frictionless mobile ordering | Customer can place an order in < 90 seconds; app is installable |
| Reliable location-based routing | > 95% of orders auto-assigned to the correct store |
| Operational clarity for stores | Store sees every order's stage on one screen; daily ops board |
| Trustworthy handovers | Pickup & delivery confirmed by OTP; payment enforced before completion |
| Actionable analytics | Store & admin dashboards for volume, revenue, TAT, ratings |
| Single codebase, four apps | One API + one DB; shared types; independent deploys per frontend |

## 1.3 In scope (v1)

- Marketing website (Home, Services, About, Contact, auth entry).
- Customer PWA: browse services, cart, place order, track order, pickup/delivery OTP,
  view & pay invoice, rate order, support tickets, profile & saved addresses.
- Store PWA: registration + admin approval, business profile, service-area setup, rider
  management, order queue, accept/reject, assign pickup rider, garment verification,
  issue invoice + payment link, assign delivery rider, close order, daily ops board,
  store analytics.
- Rider (role in store PWA): job list, navigation deep-link, OTP capture, status updates,
  live selfie / garment photos.
- Admin panel: service catalog, users, stores (approve/suspend), all orders, routing
  fallback queue, coupons, helpdesk/ticketing, business analytics, global settings.
- Payments via a gateway adapter (Razorpay Route default): split payment links + webhooks +
  refunds. **COD** supported.
- **Store settlement**: admin-set commission % per store, periodic payout statements,
  COD-commission netting, maker–checker approval.
- Auth: **phone OTP (SMS)** + Google + email/password; identity linking.
- Per-store **pickup slots** (customer-chosen) and admin-set **SLA/TAT**.
- Notifications: in-app + web push; email (invoices/receipts/statements); SMS for login OTP
  (+ optional order alerts).

## 1.4 Out of scope (v1) — candidates for later

- Native iOS/Android apps (PWA covers mobile for v1).
- Subscription / plan-based cleaning packages.
- Multi-language / multi-currency.
- Franchite accounting, payroll, inventory of consumables.
- In-app chat between customer and rider (support tickets cover v1).
- Route optimization across multiple riders/vehicles.

## 1.5 Personas

- **Customer** — orders from a phone, wants pickup at home, clear price, live status.
- **Store owner** — approves onboarding, configures the store, oversees staff & analytics.
- **Store staff** — works the order queue, verifies garments, issues invoices.
- **Rider** — store employee doing pickups/deliveries; needs addresses, navigation, OTP.
- **Admin** — the business owner/HQ operator; manages the network and catalog, handles
  escalations and routing failures.

## 1.6 Client notes — extracted summary

Source: client's handwritten notes (`ddc1.pdf`, 9 pages). Key points captured verbatim in intent:

- **Website** at `desiredrycleaning.in`: Home, Services, About Us, Contact Us, Sign In / Sign Up
  (Google Auth). Website is the entry point to the User app and the Store platform.
- **User app** at `user.desiredrycleaning.in`: separate hosting on a subdomain, **installable as a
  PWA** ("download / add to home screen"), "mostly used via phone", must feel like a mobile
  app with **4 bottom tabs: Services, Cart, My Orders, Profile**.
  - Sign up / sign in via website or the direct link.
  - Browse services → add to cart → place the service request.
  - See orders in the "My Orders" tab.
  - Store accepts the request and assigns/selects a **pickup driver** from a list; the user
    then sees pickup details (time, driver details) plus an **OTP to provide at pickup**.
  - After pickup it is marked done; the store adds a delivery time; the user sees **live
    updates** on the order.
  - The store then adds a **delivery partner** and an **amount with invoice & payment link**.
  - On delivery an **OTP is required and payment must be complete to finish the order**.
  - A **ticketing / help-desk system** managed from the main admin.
- **Store platform** at `store.desiredrycleaning.in`: separate subdomain hosting, its own installable
  PWA for all devices.
  - Register via website or the direct link, then log in.
  - **Account is active only after admin approval.**
  - Save business info to run a store (a "dry-cleaning factory").
  - Add & list **delivery partners** with details: **live image, bike number, name, contact
    number**.
  - **Location/service area must be set by the store** — orders fall to the store
    automatically by the customer's location; the admin can also set a manual location
    order for a store.
  - Store flow: accept order → assign pickup partner → push/update invoice and payment link
    → assign delivery partner → record service feedback → finish order.
  - Store needs **daily ops management** and **analytics** features.
  - Store PWA: mobile-friendly, **4 bottom tabs: New Order, In-process Order, Analytics,
    Profile/Settings**.
- **Delivery / Pickup boy (rider)**: added by the store; receives requests from the store;
  sees pickup/delivery location with **one-click Google Maps navigation**; sees and tracks
  jobs (completed / assigned / pending); plus whatever else keeps service smooth and fast.
- **Admin panel** at `admin.desiredrycleaning.in`:
  - Add and manage the **services listed** on the website.
  - **Manage users** — see their orders, assign special **coupon codes**, manage help
    requests.
  - **Approve and manage stores** — see their analytics and reporting.
  - **Manage all orders and everything.**
  - Orders auto-route to a store by location; **if routing fails the order is highlighted
    in admin and the admin sends it manually.**
  - **Business analytics.**
- **Architecture** (client's diagram): four surfaces — `admin.desiredrycleaning.in`, `desiredrycleaning.in`
  (website), `user.desiredrycleaning.in`, `store.desiredrycleaning.in`; the rider/"delivery-pickup boy" sits
  inside the store box. **Common database (MongoDB Atlas). Common backend.**
- **Business flow** (client's diagram): customer adds service → cart → place order → order
  to store as per location → store adds partner to pickup → partner finds order → goes to
  location → picks order with OTP → submits at store → store creates/updates & sends invoice
  & pay-link as per order sheet & received-cloth verification → store assigns delivery
  partner → delivery partner picks up from store & delivers to customer → feedback to finish
  → customer rating → analytics & reports.

## 1.7 Decisions taken with the client (2026-08-31)

| Question | Decision (client, 2026-08-31) |
|---|---|
| Region / payment gateway | India. Gateway behind a `PaymentProvider` adapter. **Documented default: Razorpay + Razorpay Route** (marketplace split); Cashfree Easy Split the equal alt; PhonePe not recommended. Client will finalise the gateway later. (ADR-0003) |
| Store payouts / commission | **Built in v1.** Admin sets a **commission % per store**. Online payments auto-split at capture; **COD allowed** — store keeps the cash, commission becomes a receivable netted from the next payout. Settlement statements + maker–checker. (ADR-0009) |
| Pricing model | **Estimate at cart** (catalog prices) → **binding invoice after the store inspects the garments**. Customer picks **Online / COD** at checkout. (ADR-0007) |
| Rider platform | **A role inside the store platform** (`store.desiredrycleaning.in`), not a separate app. Riders **log in by phone OTP**. (ADR-0004, ADR-0010) |
| Auth | **Phone OTP (SMS)** is the primary method for customers & riders (Google + email also). **SMS is a core dependency.** (ADR-0010) |
| Stores at launch | **3 stores**, onboarded & managed from admin; more added later. **Pincode-based routing** to start. (ADR-0006) |
| GST | **Admin-managed** — global default rate (18%) + optional per-store override; GSTIN on invoices. |
| SLA / TAT | Set by **admin at store onboarding** — default turnaround + optional per-category hours; fixed afterwards (admin-editable). Drives the promised delivery time. |
| Pickup slots | **Customer chooses a pickup slot** at checkout; each **store controls which windows show + capacity**. |
| Design | **Black & gold**, glassmorphism / liquid-glass, animated motion scroll/slide. Gold locked at `#D4AF37`. Fonts: Fraunces / Inter / JetBrains Mono. (`docs/20`) |
| Hosting | **Vercel** (frontends) + **Render** (API) + **MongoDB Atlas** + **Upstash Redis** + **Cloudinary** + **MSG91** (SMS); single-VPS alt documented. (ADR-0008) |
| Google OAuth owner | `techfied.desiredrycleaning@gmail.com` owns the Google Cloud / OAuth project. ✔ |

## 1.8 Open questions (remaining — to confirm before go-live)

1. **Final payment gateway** — Razorpay (recommended) vs Cashfree. Both fit the adapter.
2. **Brand assets** — `assets/logo.png` (SVG preferred), any Pantone gold, dark garment
   photography. (Name / domain / contact / gold hex / fonts: ✔ decided.)
3. **GSTIN** of Desire Premium Dry Cleaning (for invoices) + the launch GST rate if not 18%.
4. **Default commission %** to seed for new stores (placeholder `20%` in `settings.payout`).
5. **Payout cadence** — weekly (default) vs daily vs manual; and the settlement day.
6. **SMS/DLT** — MSG91 account + DLT sender ID + approved OTP template (India requirement).
7. **Store payout rails** — rely on gateway Route auto-settlement only, or also enable
   gateway Payouts / manual bank transfer for COD-net and adjustments?
8. Per-store **SLA/TAT** default hours and any per-category values for the first 3 stores.
9. **Pickup-slot windows** — the standard daily windows + capacities to pre-configure.
10. Launch **pincode list** per store (service areas for the 3 stores).
11. Marketing-site **analytics** tool (Plausible/Umami vs GA4) + consent approach.
