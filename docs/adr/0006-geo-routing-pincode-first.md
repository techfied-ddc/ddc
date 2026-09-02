# ADR-0006 — Pincode-first order routing, polygon/radius optional, admin fallback

- **Status:** accepted
- **Date:** 2026-08-31
- **Deciders:** client + dev

## Context

Every order must be sent to the store that serves the customer's location; if that fails,
the admin is alerted and assigns manually. Launch market is **Greater Noida West (UP)**,
where addresses and delivery areas are naturally expressed as **6-digit pincodes**. Store
count at launch is small.

## Decision

Routing resolves in this order (`geo.routeOrder`, doc 09 §9.3):

1. **Pincode** — store `serviceArea.pincodes` contains the address pincode; else an
   admin-managed `zones` doc for that pincode (highest `priority`).
2. **Polygon** — `$geoIntersects` of the address point with a store/zone polygon (optional,
   for finer boundaries).
3. **Radius** — nearest store whose `maxRadiusKm` covers the point (`$nearSphere`).
4. **Tie-break** — lowest open-order load → highest rating → nearest.
5. No match → `ROUTING_FAILED` → **admin routing queue** (socket + push/email alert);
   admin assigns via `ADMIN_ASSIGN`.

A rejected order returns to the admin queue rather than auto re-routing.

## Alternatives considered

- **Polygon-only geofencing from day one** — most precise, but stores would have to draw
  accurate polygons and we'd carry that complexity for a handful of pincodes at launch.
  Kept as an optional layer.
- **Pure nearest-store by distance** — ignores real service boundaries (a store 2km away
  across a barrier may not serve you). Used only as the radius fallback.
- **Third-party geo/territory service** — overkill and adds cost.

## Consequences

- Fast, understandable, easy for store owners (pick pincodes from a list).
- Overlaps/gaps handled by admin `zones` overrides + tie-break rules.
- We store a GeoJSON `Point` + `2dsphere` indexes on addresses/stores now, so polygon/radius
  work without a migration.
- Analytics tracks `routing.method` (PINCODE/POLYGON/RADIUS/MANUAL) and failure rate to
  tune coverage.
