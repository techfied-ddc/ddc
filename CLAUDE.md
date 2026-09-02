# CLAUDE.md — DDC (Dry-Cleaning Platform)

> This file is loaded into every Claude Code session for this repo. It is the **single
> source of constant instructions**. Detailed specs live in `docs/`. Read this fully
> before writing code, then open the relevant `docs/` file for the area you are working on.

---

## 1. What this project is

**DDC** (repo codename) is the platform for **Desire Premium Dry Cleaning**, a dry-cleaning
business that operates **multiple physical stores (dry-cleaning factories) in different
locations**. Customers place cleaning orders; each order is routed to the store that serves
the customer's location; that store runs the pickup → clean → deliver cycle using its own
riders.

### Business identity (source of truth)

| Field | Value |
|---|---|
| Brand name | **Desire Premium Dry Cleaning** (short: "Desire Dry Cleaning") |
| Primary domain | `desiredrycleaning.in` |
| Support email | `techfied.desiredrycleaning@gmail.com` (interim; move to `support@desiredrycleaning.in` when mailbox exists) |
| Phone | `+91 91186 78519` |
| HQ address | Greater Noida West, Uttar Pradesh 201009, India |
| Country / currency / timezone | India / **INR** / **Asia/Kolkata** |
| Customer-facing order ref prefix | `DPD-` (e.g. `DPD-000123`) |

One backend + one MongoDB Atlas database serve **four separate frontends**:

| App | Subdomain | Users | Type |
|---|---|---|---|
| Marketing website | `desiredrycleaning.in` | Public / prospects | SPA (SEO-focused) |
| Customer app | `user.desiredrycleaning.in` | Customers | **Installable PWA**, mobile-first |
| Store platform | `store.desiredrycleaning.in` | Store owners/staff **and riders** (role-based) | **Installable PWA** |
| Admin panel | `admin.desiredrycleaning.in` | Business admins | SPA |
| API | `api.desiredrycleaning.in` | (backend) | Express service |

The **rider / pickup-delivery experience is a role inside the store platform**, not a
separate app. A rider logs into `store.desiredrycleaning.in` and sees only their job list.

Full vision and the client's original notes summary: `docs/01-overview.md`.

---

## 2. Locked technical decisions

Do **not** change these without a new ADR in `docs/adr/` and the user's approval.

- **Stack:** MERN — MongoDB (Atlas), Express, React, Node.js. **TypeScript everywhere.**
- **Monorepo:** pnpm workspaces + Turborepo. Layout in section 4.
- **Frontends:** React 18 + **Vite** + React Router + TanStack Query + Zustand (local UI state)
  + Tailwind CSS + shadcn/ui (Radix). No Next.js.
- **Design system:** dark-only **black & gold**, **glassmorphism / liquid-glass** surfaces,
  motion via **Framer Motion** (+ **Lenis** smooth-scroll on the marketing site only).
  Fonts: **Fraunces** (display), **Inter** (UI/body), **JetBrains Mono** (refs/OTP),
  self-hosted via `@fontsource`. All tokens / components / motion primitives live in
  `packages/ui`. Full spec: `docs/20-design-system.md` — follow it; don't improvise
  colours, spacing, or motion.
- **PWA:** `vite-plugin-pwa` (Workbox) for `web-user` and `web-store`. Web Push via VAPID.
  Manifest `theme_color` / `background_color` = `#0B0B0C`.
- **Backend:** Node + Express + TypeScript + Mongoose. **Zod** for all input validation.
  **Socket.IO** for realtime order updates. **pino** for logging.
- **Jobs/queues:** BullMQ + Redis (Upstash). MVP may use an in-process fallback queue,
  but the interface must be queue-ready. See `docs/14-pwa-notifications.md`.
- **Auth:** JWT access token (short-lived) + refresh token in **httpOnly Secure cookie**.
  Methods: **phone OTP (SMS)** — primary for customers & riders — plus Google OAuth 2.0 and
  email/password. RBAC middleware. See `docs/07-auth-rbac.md`. **SMS is a core dependency**
  (login OTP), not optional.
- **Payments:** India. Behind a `PaymentProvider` interface — never call a gateway SDK
  directly from business logic. **Documented default: Razorpay + Razorpay Route**
  (marketplace split settlement); Cashfree (Easy Split + Payouts) is the equal alternative;
  final gateway still to be confirmed by the client. See `docs/08-payments-invoicing.md`,
  ADR-0003.
- **Store payouts / commission:** built in v1. **Admin sets a commission % per store.**
  Online payments auto-split at capture via the gateway (store share → store's linked
  account, commission → platform). **COD is allowed**; for COD the store keeps the cash and
  the commission becomes a receivable netted from the store's next payout. Settlement
  statements in a `payouts` collection. See ADR-0009, `docs/08`.
- **Pricing model:** **estimate at cart → final invoice after physical inspection** by the
  store. Cart shows an *estimated* total; the store issues the binding invoice after garment
  verification. Customer chooses **payment mode (Online / COD)** at checkout. See ADR-0007.
- **Pickup slots:** customer chooses a pickup date + time slot at checkout. Each store
  configures which slot windows are shown and their capacity. Delivery time is derived from
  the store's SLA. See `docs/06`, `docs/11`.
- **Per-store SLA / TAT:** set by **admin during store onboarding** (default + optional
  per-category turnaround hours), fixed afterwards (admin-editable only). Drives the promised
  delivery time and on-time analytics.
- **GST:** admin-managed — a global default rate plus an optional per-store override; GSTIN
  on invoices.
- **Stores:** onboarded/managed by admin (admin creates the store + owner account, or
  approves a self-registration). Launch = 3 stores; more added later from admin.
- **Maps:** Google Maps JS API + Geocoding. Rider navigation = deep link to Google Maps.
  Pincode-first routing. See `docs/09-geo-routing.md`.
- **Media:** Cloudinary (logo `assets/logo.png` when supplied, rider selfie, garment/service
  photos, cloth-verification photos).
- **Hosting:** Vercel (4 frontends, one project each) + Render (API web service) + MongoDB
  Atlas + Upstash Redis + Cloudinary + an SMS provider (MSG91). VPS alternative documented.
  See `docs/18-deployment.md`.
- **Handover OTPs** (pickup & delivery) are **app-generated 4–6 digit codes**, stored
  hashed, shown only in the customer app, verified by the rider — distinct from the SMS
  login OTP.
- **Brand gold:** `--gold = #D4AF37` (final), bright `#F0D67E`, deep `#9A7B1F`; text on gold
  fills is `#0B0B0C`. See `docs/20-design-system.md`.
- **Responsive, mobile-first:** every surface works on phones first, then scales up. See
  section 3A and `docs/20` / `docs/22`.

---

## 3. Operating agreement (how Claude works on this project)

**This project is for a paying customer. Treat every session as professional client work.**
Full detail: `docs/22-ways-of-working.md`. The rules:

1. **Full-stack ownership.** Act as the full-stack developer for this project — data model,
   API, all four frontends, PWA, infra config, tests, docs. Own the whole slice of a
   feature (schema → shared types → API → UI → tests → docs), not just one layer.
2. **The project is one whole.** Before changing anything, consider the impact across all
   apps, `packages/shared`, the order state machine, payments/settlement, and the docs.
   Never optimise one surface in a way that breaks another.
3. **No half-work, no skipped work.** Finish what you start. If a task has ten parts, do ten
   — or clearly list the ones you couldn't and why. Don't leave `TODO`s, stubs, dead code,
   commented-out blocks, or "we'll wire this later" unless the user agreed to it. If a
   change ripples into 8 files, change 8 files.
4. **Do everything that can be done in code.** Complete the maximum each session. The only
   things you should hand back are actions that genuinely require a human (see rule 6).
5. **No assumptions, no guessing.** If a requirement, edge case, value, or priority is
   unclear — **ask** before building. A wrong assumption that reaches the customer is worse
   than a question. When you must proceed to stay unblocked, state the assumption loudly and
   confirm it right after. Aim for zero rework from avoidable mistakes.
6. **Manual work = explicit, step-by-step handoff, every time.** For anything you cannot do
   (create a cloud account, enter a dashboard setting, paste a secret, register a DLT
   template, buy a domain, run an interactive terminal command, approve a payout, etc.):
   - stop and tell the user it's their turn;
   - give **numbered steps**, exact screen/menu names, exact values to enter, and where the
     result goes (which env var / file);
   - say how to verify it worked;
   - wait for confirmation, then continue. Re-give the steps in full each time — don't
     assume they remember a previous walkthrough.
   Keep a running list of outstanding manual items in `docs/22` §"Manual work log".
7. **Docs + memory move with the code.**
   - Any change that alters documented behaviour updates the matching `docs/` file in the
     *same* change. New architectural decision → new ADR (`docs/adr/`, copy `0000-template.md`).
   - **After every working session**, update the project memory at
     `C:\Users\DELL\.claude\projects\D--DDC\memory\` + its `MEMORY.md` index (non-obvious
     context, decisions, current state, open threads — not a file-by-file changelog), and
     leave a short "what changed / what's next" note in the session summary.
8. **Built for change.** Code for the customer's future amendments: clear module
   boundaries, named constants (no magic values), config over hard-coding, small focused
   functions, adapters at every external seam (payments, SMS, email, maps, storage), and
   the shared contract in `packages/shared`. Leave the codebase easier to change than you
   found it.
9. **Professional standards, always.** Match the conventions in section 5 and
   `docs/17-coding-standards.md`. Tests with business logic. Meaningful commits. Nothing
   ships lint-dirty, type-dirty, or untested. Accessibility and performance budgets
   (`docs/15`) are requirements, not nice-to-haves.
10. **Ask before irreversible or outward-facing actions** — deploys, DB migrations on real
    data, sending real notifications, any money movement, publishing anything.

### 3A. Responsive & mobile-first (non-negotiable)

- **Design and build every screen for a 360–390px phone first**, then progressively
  enhance to tablet and desktop. The customer app and store/rider app are used primarily on
  phones.
- Test each UI change at **mobile (375×812), tablet (768), desktop (1280)** before calling
  it done. No horizontal page scroll at any width; wide tables/diagrams scroll inside their
  own container.
- Touch targets ≥ 44px, safe-area insets respected, bottom-nav thumb-reachable, inputs use
  correct mobile keyboards, no hover-only interactions.
- PWA install + offline shell verified on a real Android and iOS Safari.
- Full checklist in `docs/22` §"Responsive checklist" and `docs/20` §20.7.

### 3B. Definition of done for any task

Code complete across all affected layers · shared types updated · tests added & green ·
`pnpm lint` + `pnpm typecheck` clean · responsive at 3 breakpoints · relevant `docs/`
updated · ADR added if a decision was made · **memory + `MEMORY.md` updated** · manual
follow-ups (if any) written up step-by-step · session summary states what changed and
what's next.

---

## 3C. Core technical rules

1. **Shared types are the contract.** API request/response shapes, enums, and the order
   state machine live in `packages/shared`. Frontend and backend both import from there.
   Never redefine an enum locally.
2. **Validate at the edge.** Every Express route validates input with a Zod schema from
   `packages/shared`. Never trust `req.body`.
3. **No secrets in code or git.** Everything via env vars. `.env.example` documents every
   key. See `docs/16-testing-and-ci.md` and `docs/18-deployment.md`.
4. **RBAC on every route.** Default-deny. A route with no role guard is a bug.
5. **One order state machine.** All order transitions go through the reducer in
   `packages/shared` + a service method on the API. No ad-hoc `order.status = ...`.
6. **Money is integer paise** end to end; format only at the view layer.
7. **Adapters at every external seam** — payments, SMS, email, push, maps, storage. Business
   logic never imports a vendor SDK directly.

---

## 4. Repository layout

```
ddc/
├── apps/
│   ├── api/              # Express + Mongoose + Socket.IO (the only backend)
│   ├── web-website/      # marketing site        → desiredrycleaning.in
│   ├── web-user/         # customer PWA          → user.desiredrycleaning.in
│   ├── web-store/        # store + rider PWA     → store.desiredrycleaning.in
│   └── web-admin/        # admin panel           → admin.desiredrycleaning.in
├── packages/
│   ├── shared/           # TS types, Zod schemas, enums, order state machine, constants
│   ├── ui/               # shared React components / design tokens (optional, grow as needed)
│   └── config/           # eslint, tsconfig base, tailwind preset
├── assets/               # source brand assets (logo.png from client, palette, fonts)
├── e2e/                  # Playwright cross-app journeys
├── docs/                 # all specs (see docs/README.md for the index)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Full tree — every folder and what goes in it: `docs/21-project-structure.md`.** It is the
agreed layout; the folders are created in Phase 0 (build start), not now.

API internal structure (per-feature modules, not layer-first):

```
apps/api/src/
├── modules/
│   ├── auth/            # controller, service, routes, google-oauth, otp (phone-login), authOtp.model
│   ├── users/
│   ├── stores/          # profile, service-area, pickup-slots, sla, commission, gst
│   ├── riders/
│   ├── catalog/         # categories + services
│   ├── orders/          # includes state-machine transition service
│   ├── invoicing/
│   ├── payments/        # provider adapter (razorpay/cashfree/mock) + split + webhooks
│   ├── payouts/         # settlement statements: run / approve / mark-paid / reconcile
│   ├── coupons/
│   ├── tickets/         # helpdesk
│   ├── notifications/   # in-app + web push + email + sms adapters + templates
│   ├── geo/             # zones + routeOrder
│   ├── analytics/
│   └── media/           # signed Cloudinary upload
├── middleware/          # authenticate, authorize, validate(zodSchema), rawBody, errorHandler, rateLimit
├── lib/                 # db, redis, socket, logger, cloudinary, maps, config, errors
├── jobs/                # BullMQ workers: routing, notification, payment-reconcile, refund,
│   │                    #   settlement-close, auto-complete, analytics-rollup
├── db/                  # migrations/ (migrate-mongo) + seed/
└── index.ts
```

---

## 5. Conventions

- **Language:** TypeScript, `strict: true`. No `any` without a `// why:` comment.
- **Naming:** files `kebab-case.ts`; React components `PascalCase.tsx`; Mongoose models
  `PascalCase` singular (`Order`); collections plural lowercase (`orders`); enum values
  `SCREAMING_SNAKE_CASE`; API paths `/api/v1/kebab-case`.
- **API responses:** always `{ ok: true, data }` or `{ ok: false, error: { code, message, details? } }`.
  HTTP status set correctly too. Error `code` is a stable string enum.
- **Dates:** store UTC ISO strings / `Date`. Display in the business timezone (config).
- **Money:** integer **paise** (₹1 = 100) in the DB and API. Format at the view layer only.
- **IDs:** Mongo `_id` (ObjectId) internally; expose as string `id`. Public order reference
  is a separate human code (`DPD-XXXXXX`).
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- **Branches:** `main` (protected) ← `feat/*`, `fix/*`. PR required; CI green required.
- **Tests:** Vitest (unit) + Supertest (API integration) + Playwright (critical e2e flows).
  New business logic ships with tests. See `docs/16-testing-and-ci.md`.
- **Lint/format:** ESLint + Prettier from `packages/config`. CI fails on lint errors.

---

## 6. Common commands (define in package.json as work starts)

```bash
pnpm install                 # bootstrap workspace
pnpm dev                     # turbo: run all apps in watch mode
pnpm --filter api dev        # backend only
pnpm --filter web-user dev   # one frontend
pnpm test                    # all tests
pnpm lint                    # all lint
pnpm --filter api seed       # seed dev DB (admin user, sample services, demo store)
pnpm build                   # production build all
```

---

## 7. Domain glossary

- **Store** — a physical dry-cleaning branch/factory. Has a service area, staff, riders.
- **Rider** — pickup/delivery person employed by a store. Role inside the store platform.
- **Service** — a catalog item (e.g. "Shirt – wash & iron"), priced per piece / per kg / per pair.
- **Order** — a customer's request covering one or more service line items, tied to one store.
- **Estimate** — non-binding cart total from catalog prices.
- **Invoice** — binding bill the store issues after inspecting the garments.
- **Pickup OTP / Delivery OTP** — codes the customer shows the rider to confirm handover.
- **Routing** — deciding which store an order goes to, from the customer's location.
- **Zone** — a store's service area, expressed as pincodes and/or a map polygon.
- **Ticket** — a helpdesk/support request handled by admin.

---

## 8. Session ritual

Full version: `docs/22-ways-of-working.md`.

**Start of session**
1. Read this file. Read `docs/README.md` for the doc index.
2. Check `MEMORY.md` (auto-loaded) + the `memory/` files for current state, decisions, open
   threads, and the manual-work log.
3. Open the `docs/` file(s) for your area. Restate the task and its full scope back to the
   user; ask about anything unclear **before** writing code (rule 5).
4. If the task touches a contract (schema, API, enum, state machine, payment/settlement),
   update `packages/shared` + the doc first, then implement across every affected app.

**End of session (all of it — this is the Definition of Done, section 3B)**
5. Code complete across all layers; `pnpm lint` + `pnpm typecheck` + `pnpm test` green;
   responsive checked at mobile/tablet/desktop.
6. Update the affected `docs/`; add an ADR if a decision was made.
7. **Update `memory/` + `MEMORY.md`** — current state, decisions, what's next.
8. Update the **manual-work log** in `docs/22` if you handed anything to the user; give the
   step-by-step now.
9. Session summary: what changed, what's verified, what's left, what needs the user.
