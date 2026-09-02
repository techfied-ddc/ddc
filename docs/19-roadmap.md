# 19 — Roadmap & Milestones

Phased so the client sees working software early and each phase is shippable. Estimates are
relative (S/M/L), not calendar promises.

## Phase 0 — Foundation  (size: M)

- Monorepo: pnpm + Turborepo; `apps/*` + `packages/{shared,ui,config}` scaffolded.
- `packages/shared`: enums, Zod schemas skeleton, **order state machine + reducer**, money
  utils, `formatMoney`.
- `packages/ui`: Tailwind preset + **black/gold + liquid-glass tokens**, motion primitives
  (`Reveal`, `Parallax`, reduced-motion guard), base components (`GlassCard`, `Button`,
  `AppBar`, `BottomTabBar`, `StatusPill`, `OtpInput`, `KpiTile`).
- `apps/api`: Express + Mongoose + config/logger/db/redis/socket bootstrap, error handler,
  `authenticate`/`authorize`/`validate` middleware, `/healthz`.
- Auth: **phone OTP (SMS adapter + `authOtps`)** + email/password + Google OAuth, JWT
  access + refresh-cookie rotation, RBAC, identity linking.
- CI (lint/typecheck/test/build), Vercel + Render projects, staging env, seed script (3
  demo stores with commission/SLA/slots).
- **Exit:** a user can sign in by phone OTP on all subdomains; empty shells deploy to staging.

## Phase 1 — MVP ordering loop  (size: L)  ← first client demo

- Catalog: admin CRUD for categories/services (image, name, description, price); website +
  customer app read it.
- Customer app: Services / Cart / My Orders / Profile tabs; addresses with map pin; estimate;
  **pickup-slot picker**; **payment mode (Online / COD)**; place order.
- Geo routing: pincode + zone + radius; store preview for slots; `ROUTING_FAILED` path;
  admin routing queue + manual assign.
- Store platform: **admin onboards store** (commission %, GST, SLA, area, slots) +
  self-register→approve path; New Order queue; accept/reject; **rider management** (phone-OTP
  login); assign pickup; **pickup OTP** verify; receive-at-store verification;
  **create + issue invoice** (split link for Online); mark ready; assign delivery;
  **COD collect**; **delivery OTP** verify; finish. Per-store **pickup-slot config**.
- Payments: **gateway adapter (Razorpay Route default)** — split payment link + **webhook**
  (idempotent) + reconcile job; `MockProvider` for dev/e2e. Payment gate on delivery (Online
  webhook or COD collected).
- **Store settlement**: `order.settlement` at DELIVERED; commission math; COD receivable;
  `payouts` period-close job + admin generate/approve/mark-paid; store earnings screen +
  payout-account/KYC submission.
- Notifications: in-app feed + **Web Push** for the key transitions; email for invoice +
  receipt.
- PWA: installable customer + store apps, offline shell, update toast.
- Admin: orders list + detail + manual actions (reassign, cancel, refund); store approvals;
  users list; dashboard v1 (KPIs + routing-queue alert).
- Ratings → COMPLETED; auto-complete job.
- Motion/glass applied to customer app + marketing shell.
- **Exit:** the full business flow from the client's notes works end-to-end on staging with
  a real Cashfree sandbox payment; both PWAs install on a phone.

## Phase 2 — Operations & polish  (size: M)

- Store **daily ops board** + **store analytics** (volume, revenue, TAT, rating, rider
  perf, funnel, CSV).
- Admin **business analytics** (revenue trend, store leaderboard, routing accuracy, coupon
  cost, cancellation reasons, exports) + **audit log** + multiple admin accounts.
- **Helpdesk / ticketing**: customer + store raise; admin queue, threads, internal notes,
  SLA colouring; website contact form → lead/ticket.
- **Coupons**: admin CRUD, global + user-assigned, validation + limits + redemptions.
- Marketing website: full pages, SEO/prerender, coverage checker, "Partner with us",
  legal pages, Lenis smooth-scroll + scroll animations.
- Pickup time slots (config-gated); store operating-hours enforcement option.
- Accessibility pass (axe in CI + manual SR pass); performance pass (Lighthouse ≥ 90).
- **Exit:** stores can run a full day off the platform; admin has the reporting the client
  asked for.

## Phase 3 — Hardening & launch  (size: M)

- Production Cashfree keys + live ₹1 test; email domain auth (SPF/DKIM/DMARC).
- Redis Socket.IO adapter in prod; job retries + dead-letter + re-drive tooling.
- Backups + **tested restore**; migrations in the deploy pipeline; runbooks.
- Rate-limit tuning; Sentry + uptime + synthetic order alerting.
- Security review (RBAC matrix, OTP handling, webhook signature, upload scoping, headers).
- Load-check the routing + webhook paths.
- Pre-launch checklist (doc 18 §18.8); onboard the first real store(s); pilot in Greater
  Noida West.
- **Exit:** production live for a limited pincode set with monitoring and rollback ready.

## Post-launch backlog (not scheduled)

- Advanced settlement: instant per-order payouts, gateway-fee pass-through to stores,
  automated `STORE_OWES` collection.
- SMS order-alert mirroring (`smsOrderAlertsEnabled`); WhatsApp OTP channel.
- Reorder from history; saved "usual" baskets; subscription plans.
- Delivery time-slot choice (v1 = store-scheduled from SLA).
- Large estimate↔invoice delta → customer re-confirm step.
- In-app customer↔rider chat; live rider location on the map.
- Multi-rider route optimisation; capacity-aware scheduling.
- Headless CMS for marketing content; blog for SEO.
- Native app wrappers if PWA limits bite (iOS push edge cases).
- Multi-language / multi-city expansion tooling; franchise accounting.
- Data export / account-deletion self-service (DPDP readiness).

## Cross-phase "definition of ready to demo"

Each phase ends with: deployed to staging, E2E journeys green, docs + ADRs updated, project
memory updated, a short changelog for the client, and a manual device check of both PWAs.
