# ADR-0010 — Phone-OTP authentication (SMS) as a primary method

- **Status:** accepted
- **Date:** 2026-08-31
- **Deciders:** client + dev

## Context

The client wants **riders to log in with phone OTP**. In the Indian consumer market,
phone-OTP is also the expected default for customers. Riders are pre-created by their store
with a phone number; customers mostly arrive on mobile.

## Decision

- Add **phone-OTP** as a first-class auth method alongside Google OAuth and email/password:
  - `POST /auth/otp/request { phone }` → generate a 6-digit code, store **hashed** in
    `authOtps` with a short TTL (5 min), send via the **SMS provider adapter** (MSG91
    default). Rate-limited per phone + per IP; max 5 unconsumed requests / hour.
  - `POST /auth/otp/verify { phone, code }` → on match: issue access + refresh tokens
    (same session model as ADR-0002).
    - Existing user with that `phone` → logged in as their role (a store-created **rider**
      logs in as `RIDER`).
    - No user → create a `CUSTOMER` with `phone`, `phoneVerified = true`.
- `phone` becomes a **unique, sparse** identifier on `users` (E.164). Required for
  `CUSTOMER` and `RIDER`; optional for Google-only store owners/admins.
- **SMS is now a core dependency** (not the optional feature flag it was in the first
  draft). `settings.features.smsOrderAlertsEnabled` stays only as a kill-switch for
  *non-auth* SMS (order alerts); auth OTP always sends.
- The **handover OTPs** (pickup/delivery, ADR-lifecycle doc 06) remain **app-generated and
  shown in the customer app** — they are a different mechanism from the SMS login OTP and
  are not sent over SMS.
- Account linking: if a phone-OTP customer later signs in with Google using the same email,
  offer to link (one `users` row). Same the other way.

## Alternatives considered

- **Store-issued rider passwords only** — no SMS dependency, but worse UX for riders, and
  the client explicitly asked for phone OTP. Kept as a fallback (`store can set an initial
  password`) for areas with poor SMS delivery.
- **A third-party OTP/auth service (Firebase Auth phone, MSG91 OTP widget, Otpless)** —
  faster to ship, but adds a vendor in the critical auth path and complicates our unified
  `users`/RBAC model and the store-created-rider flow. Revisit if SMS deliverability or
  fraud becomes a problem.
- **WhatsApp OTP** — good deliverability, but needs WhatsApp Business API setup; can be
  added as another channel in the SMS adapter later.

## Consequences

- Hard dependency on an SMS provider with an env key; must be provisioned for every
  environment (mock in dev). DLT template registration required in India (sender ID +
  approved template) — add to the pre-launch checklist.
- New `authOtps` collection (TTL-indexed), OTP request/verify rate limiting, and abuse
  monitoring (OTP-request floods).
- Cost per SMS — keep OTP length/'resend' sane; consider a 30-second resend cooldown.
- `users.phone` uniqueness + linking logic across Google/email/phone identities.
