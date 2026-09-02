# ADR-0004 — Rider is a role inside the store platform, not a separate app

- **Status:** accepted
- **Date:** 2026-08-31
- **Deciders:** client + dev

## Context

The client's notes describe a "Delivery / Pickup boy" who is **added by the store**,
receives jobs **from the store**, needs addresses + one-tap Google Maps navigation, and a
job list (assigned / pending / completed). The client's architecture diagram places the
rider **inside the store box**. The brief separately lists "rider platform" as a surface.
Decision needed: separate app/subdomain vs a role in the store platform.

## Decision

Riders are **`users` with `role = RIDER`**, created by their store, scoped by
`riderProfile.storeId`. They authenticate at `store.desiredrycleaning.in`; the store PWA
**branches by role** on login and shows riders a dedicated "My Jobs" view only. No separate
deployment, domain, or auth surface.

## Alternatives considered

- **Separate `rider.desiredrycleaning.in` PWA** — cleaner conceptual separation and a
  smaller rider bundle, but: a fifth deploy + domain + PWA, duplicated auth/session/socket
  plumbing, and riders never act outside their store's context anyway. The store already
  needs to create/manage them. Rejected for v1; revisit only if rider UX diverges a lot or
  we need an app-store native build.
- **Riders as their own top-level collection** (not `users`) — complicates auth (a second
  identity system) for little gain. Rejected; `users` + `riderProfile` is enough.

## Consequences

- One codebase, one auth flow, one socket server; role-gated routing inside `web-store`.
- RBAC + ownership checks must be strict: a rider sees only jobs where
  `pickup.riderId`/`delivery.riderId` is them, no store financials, no other riders.
- The store PWA bundle carries rider screens too; keep them code-split so a rider's install
  stays light.
- If a standalone rider app is wanted later, the rider screens + API already exist and can
  be lifted into `apps/web-rider` with minimal change.
