# ADR-0007 — Estimate at cart, binding invoice after garment inspection

- **Status:** accepted
- **Date:** 2026-08-31
- **Deciders:** client + dev

## Context

Dry-cleaning prices depend on the actual garments (type, count, fabric, stains) which the
store only knows after physically receiving them. The client's flow: the store "creates &
updates & sends invoice as per order sheet & received-cloth verification". But customers
still expect to see prices while ordering.

## Decision

Two-stage pricing:

1. **Estimate (non-binding)** at cart/placement — `service.basePrice × qty` (+ addons)
   − coupon + tax, stored in `order.estimate`, shown with a clear *"final price confirmed
   after our store checks your garments"* disclaimer.
2. **Invoice (binding)** — after `RECEIVE_AT_STORE`, the store adjusts quantities/prices,
   adds items, and issues the invoice (`ISSUE_INVOICE`). That total is what the customer
   pays via the payment link.

The estimate↔invoice delta is expected. Coupons are validated again at issue time.

## Alternatives considered

- **Fixed catalog price = final** — simple and predictable for customers, but wrong for the
  domain (can't price unseen garments accurately; disputes on undercount/overcount).
- **No prices until after pickup** — matches reality but hurts conversion; customers want a
  ballpark before committing.

## Consequences

- Invoice model is separate and immutable-once-issued; the estimate is informational.
- UI must clearly distinguish "estimated" vs "amount due"; store must be able to edit lines
  before issuing.
- Follow-up (post-v1): if `invoiceTotal` exceeds `estimateTotal` by more than a configurable
  %, require an in-app customer re-confirmation before the payment link goes live.
- Analytics should track estimate accuracy to tune `basePrice` values.
