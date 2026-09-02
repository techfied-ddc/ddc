# ADR-0009 — Commission model & store settlement (payouts)

- **Status:** accepted
- **Date:** 2026-08-31
- **Deciders:** client + dev

## Context

The platform (Desire Premium Dry Cleaning HQ) onboards independent stores and takes a cut of
each order. Client requirements:
- **Admin sets a commission percentage per store** (at onboarding, editable later).
- Stores must be **paid out** their earnings.
- Orders can be paid **Online** (gateway) or **COD** (cash to the rider).

## Decision

**Commission**
- `store.payout.commissionPercent` — set by admin per store. Snapshotted onto the order at
  `DELIVERED` as `order.settlement.commissionPercent` so later % changes don't rewrite
  history.
- Base for commission = invoice `grandTotal` (post-discount, incl. tax). Simple and
  predictable. `platformCommission = round(grandTotal * commissionPercent / 100)`;
  `storeEarning = grandTotal - platformCommission`.
- **Gateway fees are borne by the platform** by default (configurable later via
  `settings.payout.gatewayFeeBorneBy`).

**Online orders → split at capture**
- Preferred: the gateway's marketplace split (Razorpay Route / Cashfree Easy Split). Each
  approved store has a **linked account**. At payment capture the amount is split: store
  share → store linked account, commission → platform account. The gateway settles the
  store's linked account to its bank on its own schedule.
- We still record `order.settlement` and include the order in a **payout statement** for
  reporting/reconciliation — the statement mirrors what the gateway did.

**COD orders → receivable netted from payouts**
- The rider collects the full invoice amount in cash; that money sits with the store.
- The store now **owes the platform** `platformCommission` for that order
  (`order.settlement.codCommissionReceivable`).
- These receivables are **netted against the store's online settlement** in the next payout
  run: `netToStore = onlineGross − onlineCommission − Σ codCommissionReceivable + adjustments`.
- If a store is COD-heavy and `netToStore` goes negative, the run produces a
  **`STORE_OWES`** statement → admin raises an invoice to the store / collects offline.

**Payout statements (`payouts` collection)**
- One doc per store per settlement period (default **weekly**, configurable
  `settings.payout.cadence`). Fields: period, `onlineGross`, `onlineCommission`,
  `codGross`, `codCommissionDue`, `adjustments[]`, `netToStore`, `method`
  (`GATEWAY_ROUTE` | `GATEWAY_PAYOUT` | `MANUAL_BANK`), `status`
  (`DRAFT → APPROVED → PROCESSING → PAID | FAILED | STORE_OWES`), `orderRefs[]`,
  `approvedByUserId`, `providerPayoutRef`, `paidAt`.
- **Maker–checker:** a payout run is generated as `DRAFT`; a `SUPER_ADMIN` (or a second
  admin) must `APPROVE` before money moves. Every state change is `auditLogs`-ed.

**Store visibility**
- Store platform shows: current pending balance, this period's accrual, past statements,
  per-order breakdown, and their payout account / KYC status.

## Alternatives considered

- **Manual payouts only (spreadsheet + bank transfer)** — fine for 3 stores, but the client
  wants it built; doesn't scale; error-prone reconciliation. Kept only as the `MANUAL_BANK`
  method + adjustments mechanism.
- **Commission on pre-tax subtotal** — arguably fairer, but "% of what the customer paid" is
  simpler to explain and audit. Configurable later if needed.
- **Charge gateway fees to the store** — common, but adds per-transaction fee tracking;
  deferred behind a setting.
- **Instant per-order payout** instead of periodic statements — more transfers/fees, harder
  to net COD receivables. Periodic + gateway auto-settlement chosen.

## Consequences

- Store onboarding gains a **payout/KYC step** (linked account creation); a store can take
  orders before it's done but online funds are **held** until it is.
- Need a settlement job (period close → generate `DRAFT` statements), an approval flow, and
  a reconcile job (our numbers vs gateway settlement report).
- Refunds after `DELIVERED` must also reverse/adjust `order.settlement` and the next
  statement.
- Analytics: platform revenue = Σ `platformCommission`; distinct from GMV (Σ `grandTotal`).
