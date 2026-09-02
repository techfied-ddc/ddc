# 15 — Non-Functional: Security, Performance, Ops

## 15.1 Security

### Application
- **RBAC default-deny** (doc 07); ownership checks in the service layer; `role`/`storeId`
  never read from request bodies.
- **Input validation** on every route with Zod schemas from `packages/shared`; reject
  unknown keys (`.strict()`), coerce nothing implicitly for money/ids.
- **Output**: consistent `{ok,error}` shape; never leak stack traces / Mongo errors in
  production (`errorHandler` maps to codes).
- **Headers**: `helmet` (CSP, HSTS, no-sniff, frameguard), sensible CORS allow-list from
  `CORS_ORIGINS` (credentials true, exact origins only).
- **Rate limiting** (Redis-backed): auth, refresh, OTP verify, coupon validate, contact
  form, ticket create, media sign. `429 RATE_LIMITED` + `Retry-After`.
- **OTPs** (both SMS login OTP and handover OTPs) hashed at rest (argon2), short TTL,
  attempt-capped, single-use; handover OTPs regenerated on rider re-assignment. Login-OTP
  request flooding monitored (SMS cost + abuse); 30s resend cooldown, per-phone/IP caps.
- **Payouts / money-out**: maker–checker approval on every payout run; payout account +
  KYC before funds release; `auditLogs` on all commission/SLA/GST/payout changes; commission
  math must reconcile to the paise; refunds reverse splits and post statement adjustments.
- **PII in SMS/webhooks**: no full addresses or amounts beyond what's necessary in SMS;
  gateway webhook bodies (may contain contact/UPI) stored in `payment.events` with access
  scoped to admin.
- **Secrets** only via env; `.env` git-ignored; rotate JWT/webhook secrets on exposure.
- **Payments**: no card data touches our servers (gateway-hosted links); webhook signature
  verified on the raw body; handler idempotent.
- **File uploads**: signed Cloudinary uploads scoped by role/folder; enforce
  content-type + max size (e.g. 8 MB images); strip EXIF GPS on customer/garment photos.
- **Injection/XSS**: Mongoose + parameterised queries; sanitise any user HTML (tickets) —
  render as plain text/markdown, never `dangerouslySetInnerHTML` on user content.
- **CSRF**: refresh cookie is `SameSite=Lax` and only accepted on `/auth/refresh`; all
  other auth is Bearer header (not cookie), so CSRF surface is minimal. Add a double-submit
  token if any cookie-authed mutation is introduced.
- **Dependency hygiene**: `pnpm audit` in CI, Dependabot/Renovate, lockfile committed.
- **Abuse**: captcha on the public contact form; per-user order-rate sanity cap.

### Data & privacy
- Collect minimum PII: name, email, phone, addresses. No card data, no government IDs.
- Access-scope PII by role; riders see a customer's address/phone only for an **active
  assigned job**, and only until it's completed + a short grace window.
- Garment/selfie photos in a private Cloudinary folder; signed delivery URLs.
- Retention: orders/invoices kept (accounting); support attachments pruned after 12 months;
  push subscriptions pruned when stale.
- Account deletion (if built): anonymise `users` PII, keep order rows with a tombstone id.
- Privacy policy + T&C published on the website; cookie/analytics consent gate.
- India context: keep data in a region-appropriate Atlas cluster; be ready for DPDP Act
  basics (purpose limitation, deletion request handling).

## 15.2 Performance

| Target | Value |
|---|---|
| Customer app first contentful paint (4G, mid phone) | ≤ 2.0s |
| Customer app TTI | ≤ 3.5s |
| API p95 latency (reads) | ≤ 300ms |
| API p95 latency (writes) | ≤ 600ms |
| Lighthouse (customer app) Perf / PWA / A11y / SEO | ≥ 90 / installable / ≥ 90 / ≥ 90 |

Techniques:
- Code-split per route; lazy-load maps and charts; keep the initial JS bundle lean.
- TanStack Query caching + socket-driven invalidation instead of polling.
- Mongo: every list query has a supporting index (doc 04); use projections; paginate
  (limit ≤ 100); `.lean()` for read-only.
- Aggregations for analytics run on a schedule into a small `analyticsDaily` rollup (v1.1)
  if live aggregation gets slow.
- Cloudinary `f_auto,q_auto` + explicit sizes; cache images at the edge.
- Compression (gzip/br) on API responses; HTTP caching headers on catalog/meta.

## 15.3 Observability

- **Logging**: `pino` structured JSON, one line per request (method, path, status, ms,
  requestId, userId, role). No PII/OTP/secret in logs. `LOG_LEVEL` via env.
- **Errors**: Sentry (API + each frontend) with release tags and source maps; `requestId`
  attached.
- **Uptime**: external check on `/healthz` and a synthetic "place test order" (staging).
- **Metrics** (later): request rate/latency/error %, queue depth, routing-failure rate,
  webhook processing lag, payment success rate — surfaced on the admin dashboard where
  useful.
- **Alerts**: routing queue age > 15 min, webhook failures, payment reconcile mismatches,
  error-rate spike, API down.

## 15.4 Reliability & operations

- **Stateless API** → horizontal scale; sessions in Mongo, rate limits + queues + socket
  adapter in Redis.
- **Graceful degradation**: Maps geocode down → pincode-only routing; Redis down → in-
  process fallback queue + fixed-window rate limit, log a warning; push provider down →
  in-app + email still work; **SMS provider down → phone-OTP login fails, so surface a clear
  error + offer Google/email; alert on-call** (auth is on the critical path).
- **Jobs**: BullMQ with retries + backoff + a dead-letter queue; idempotent workers
  (routing, notifications, payment reconcile, refunds, auto-complete, analytics rollup).
- **Backups**: MongoDB Atlas continuous backups / daily snapshots, ≥ 7-day PITR; documented
  and periodically **tested** restore into a scratch cluster.
- **Migrations**: `migrate-mongo` (or equivalent) with forward + rollback scripts, run in
  CI/CD before the API boots; never destructive without a backup + sign-off.
- **Runbooks** (in `docs/` as they arise): payment reconcile, stuck order, restore from
  backup, rotate secrets, re-drive dead-letter jobs.

## 15.5 Accessibility

- WCAG 2.1 AA for customer + store apps: keyboard operable, visible focus, form labels +
  error text, colour contrast ≥ 4.5:1, 44px targets, `prefers-reduced-motion` respected,
  status conveyed by text/icon not colour alone.
- Automated axe checks in CI on key screens; manual screen-reader pass on order flow.

## 15.6 Browser & device support

- Latest 2 versions of Chrome, Edge, Firefox, Safari (desktop + Android Chrome).
- iOS Safari 16+ (PWA add-to-home-screen path documented).
- Graceful "please update your browser" for anything below.
