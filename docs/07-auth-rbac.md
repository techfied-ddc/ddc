# 07 — Authentication & Authorization

## 7.1 Identity model

One `users` collection, discriminated by `role`. A person has exactly one role at a time
(`CUSTOMER`, `STORE_OWNER`, `STORE_STAFF`, `RIDER`, `ADMIN`, `SUPER_ADMIN`). Store staff and
riders also carry `storeId`.

## 7.2 Auth methods

| Method | For | Notes |
|---|---|---|
| **Phone OTP (SMS)** | **Customers, riders (primary)** | `POST /auth/otp/request` → 6-digit code, hashed in `authOtps`, 5-min TTL, sent via the SMS adapter (MSG91). `POST /auth/otp/verify` → tokens. New phone → new CUSTOMER. Known rider phone → logs in as RIDER. **SMS is a core dependency** (ADR-0010). |
| Google OAuth 2.0 | Customers, store owners | `GET /auth/google?intent=store` marks a store-owner signup. |
| Email + password | Store owners, admins (customers optional) | argon2id hashes. Password reset via emailed token (1h). |
| Store-issued password (fallback) | Riders, store staff | Store owner may set an initial password / invite link for areas with poor SMS delivery. Rider still normally logs in by phone OTP at `store.desiredrycleaning.in`. |

**Identity linking:** `phone`, `googleId`, and `email` are all unique-sparse on `users`. If
a phone-OTP customer later signs in with Google on the same email (or vice-versa), offer to
link into one row (`POST /auth/link`). `users.authMethods[]` records which are enabled.
The **handover OTPs** (pickup/delivery) are a separate, app-shown mechanism — not SMS.

## 7.3 Tokens & sessions

- **Access token:** JWT, `JWT_ACCESS_TTL` (15m). Claims: `sub` (userId), `role`, `storeId?`,
  `jti`. Sent as `Authorization: Bearer`.
- **Refresh token:** opaque random (stored hashed in `refreshTokens` collection with
  `userId`, `expiresAt`, `userAgent`, `revokedAt`). Delivered as httpOnly, Secure,
  SameSite=Lax cookie `rt`, `Domain=.desiredrycleaning.in`, path `/api/v1/auth`.
- **Refresh rotation:** `POST /auth/refresh` issues a new access token + new refresh token
  and revokes the old (reuse detection → revoke all sessions for that user).
- **Logout:** revokes the current refresh token and clears the cookie.
- Cross-subdomain: because the cookie is on `.desiredrycleaning.in`, a session started on
  the website carries into `user.` / `store.` / `admin.` The access token itself is held in
  memory per app (not localStorage) and re-minted from the cookie on load.
- Local dev: `Domain=localhost`, `Secure=false`.

## 7.4 Google OAuth flow

1. App redirects to `GET /api/v1/auth/google` (optionally `?intent=store&redirect=<appUrl>`).
2. Server → Google consent (`openid email profile`).
3. `GET /auth/google/callback` verifies the code, upserts the user by `googleId` (or links
   to an existing email), issues tokens, sets `rt`, and 302-redirects to the target app
   (`user.` by default, `store.` when `intent=store`).
4. First-time store owner lands on the **store registration** form; the store stays
   `PENDING` until admin approval.

## 7.5 Role capabilities (summary)

| Capability | CUSTOMER | RIDER | STORE_STAFF | STORE_OWNER | ADMIN | SUPER_ADMIN |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Browse catalog, place & track own orders | ✓ | | | | ✓ (view) | ✓ |
| Pay invoice, rate order, open tickets | ✓ | | | | | |
| See own assigned jobs, verify OTPs | | ✓ | | | | |
| Work store order queue (accept, receive, invoice, statuses) | | | ✓ | ✓ | ✓ | ✓ |
| Assign pickup/delivery riders | | | ✓ | ✓ | ✓ | ✓ |
| Manage store profile & service area | | | | ✓ | ✓ (override) | ✓ |
| Manage store's riders / staff | | | | ✓ | ✓ | ✓ |
| View store analytics | | | ✓ | ✓ | ✓ | ✓ |
| Configure pickup slots (own store) | | | | ✓ | ✓ | ✓ |
| Submit store payout account / KYC · view own earnings & statements | | | ✓(view) | ✓ | ✓ | ✓ |
| Mark COD cash collected | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage service catalog | | | | | ✓ | ✓ |
| Onboard / approve / suspend stores | | | | | ✓ | ✓ |
| Set store commission % · SLA/TAT · GST | | | | | ✓ | ✓ |
| Manual order routing / reassign / cancel / refund | | | | | ✓ | ✓ |
| Generate payout runs · add adjustments | | | | | ✓ | ✓ |
| **Approve** payout runs (maker–checker) | | | | | | ✓ |
| Manage users, coupons, tickets, settings | | | | | ✓ | ✓ |
| Manage admin accounts, feature flags, audit | | | | | | ✓ |

## 7.6 Enforcement

- `authenticate` middleware: verifies the access token, loads a lightweight `req.user`
  (`id`, `role`, `storeId`). 401 `UNAUTHENTICATED` / `TOKEN_EXPIRED`.
- `authorize(...roles)` middleware: role gate. Default-deny — a router with no `authorize`
  on a non-public route fails code review.
- **Resource ownership checks in the service layer**, not just role:
  - customer can only read/act on orders where `customerId === req.user.id`;
  - store roles only on orders where `storeId === req.user.storeId` and the store is
    `APPROVED`;
  - rider only on orders where `pickup.riderId` or `delivery.riderId === req.user.id`;
  - `STORE_STAFF` extra granular perms via `user.storePermissions` (e.g. `INVOICE`,
    `ASSIGN_RIDER`) — owner can toggle.
- Admin routes additionally write an `auditLogs` entry for mutations.

## 7.7 Store onboarding state

Two paths (client runs a small network — 3 stores at launch, more later, all managed from
admin):

**A — Admin-onboarded (primary):**
```
Admin: POST /stores  → creates store (status=APPROVED or PENDING) + STORE_OWNER user
       (phone/email), sets commissionPercent, GST, SLA/TAT, service area, pickup-slot
       defaults. Owner gets an invite / phone-OTP login.
Owner completes: payout account + KYC (PUT /stores/mine/payout-account) → gateway linked
       account. Until ACTIVE, online funds are held (payout.holdFundsUntilKyc).
```
**B — Self-registration:**
```
signup (Google/email/phone, intent=store) → user.role = STORE_OWNER, no storeId
  → POST /stores/register → store.status = PENDING → owner sees read-only "awaiting approval"
Admin: POST /stores/:id/approve → APPROVED, user.storeId set; admin then sets commission %,
       SLA, GST (PATCH /stores/:id/commission · PUT /stores/:id/sla · PATCH /stores/:id/gst)
```
`APPROVED` + service area set + (for online funds) linked account ACTIVE → orders route here.
`/suspend` → APPROVED↔SUSPENDED (no new orders route; in-flight continue or are reassigned).

Commission %, SLA/TAT and GST are **admin-owned** — not editable by the store.

## 7.8 Rider onboarding

```
Store owner: POST /riders { name, phone, vehicleNumber, liveSelfie, password? }
  → creates user role=RIDER, storeId = owner's store, riderProfile set, phone unique
Rider logs in at store.desiredrycleaning.in by PHONE OTP (password is a fallback)
  → app detects role=RIDER → shows only "My Jobs"
Deactivate: PATCH /riders/:id { active:false } → cannot be assigned; existing jobs reassigned by store
```

## 7.9 Security specifics

- Passwords: argon2id, min length 8, breached-password check optional.
- Rate limits: login 10/min/IP, refresh 30/min/IP, **login-OTP request 5/hour/phone +
  1/30s cooldown, login-OTP verify 5/10min/phone**, handover-OTP verify 5/10min/order,
  forgot-password 5/hour/email, contact form 3/hour/IP.
- OTP abuse: monitor login-OTP request floods per IP/phone; alert on spikes (SMS cost).
- India SMS: DLT-registered sender ID + approved OTP template required (pre-launch).
- Lockout: 10 failed logins in 15 min → 15-min soft lock + captcha.
- JWT secrets ≥ 32 chars, rotated via env; `jti` allows targeted revocation.
- No role or `storeId` is ever taken from the request body — only from the verified token /
  DB.
- Account deletion (if built): anonymise PII on `users`, keep order history with a tombstone
  customer reference.
