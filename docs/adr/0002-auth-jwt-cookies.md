# ADR-0002 — JWT access token + refresh cookie, shared across subdomains

- **Status:** accepted
- **Date:** 2026-08-31
- **Deciders:** dev

## Context

Four frontends on subdomains of `desiredrycleaning.in` need a single sign-on experience
(sign in on the website → land authenticated in the customer/store app). Roles: customer,
store owner/staff, rider, admin. Google OAuth + email/password. Stateless-scalable API.

## Decision

- **Short-lived JWT access token** (15m) sent as `Authorization: Bearer`, held in memory
  per app (not localStorage).
- **Opaque refresh token** stored hashed in a `refreshTokens` collection, delivered as an
  **httpOnly, Secure, SameSite=Lax cookie** scoped to `Domain=.desiredrycleaning.in`, path
  `/api/v1/auth`. Rotation on every refresh with reuse detection (revoke all sessions on
  reuse).
- Access token re-minted from the cookie on app load → SSO across subdomains.
- RBAC middleware `authorize(...roles)` + ownership checks in services; `role`/`storeId`
  only from the verified token/DB, never request bodies.

## Alternatives considered

- **Session cookie only (server sessions)** — simplest, but a cookie-only model needs CSRF
  protection on every mutation and couples the API to cookie handling for non-browser
  clients later. We keep sessions for refresh only.
- **Access token in localStorage** — XSS-exfiltration risk; rejected.
- **Third-party auth (Auth0/Clerk/Firebase)** — faster start, but adds cost, vendor lock-in,
  and awkwardness for store-issued rider accounts and a custom approval flow. Revisit if
  auth maintenance becomes a burden.

## Consequences

- CSRF surface is minimal: refresh cookie is only honoured on `/auth/refresh`; everything
  else is Bearer-header. If any cookie-authed mutation is ever added, add a double-submit
  token.
- Need a `refreshTokens` collection + rotation/revocation logic + reuse detection.
- Cookie domain/secure differs local vs prod (`localhost` vs `.desiredrycleaning.in`).
- Logout must revoke server-side; `jti` on the access token allows targeted kill.
