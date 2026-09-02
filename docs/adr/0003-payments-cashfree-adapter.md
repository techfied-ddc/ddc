# ADR-0003 — Payments behind a `PaymentProvider` interface; Razorpay Route as the default (marketplace split settlement)

- **Status:** accepted (provider choice: **provisional** — client to confirm before go-live)
- **Date:** 2026-08-31 (revised 2026-08-31 after client answers)
- **Deciders:** client + dev

## Context

India-based business. The store "pushes an invoice + payment link"; payment must be settled
before an order is marked delivered. **New requirements from the client:**
- **Store payouts must be built in v1.** The **admin sets a commission percentage per
  store**; the platform keeps the commission, the store gets the rest.
- **COD is allowed** (customer chooses Online or COD at checkout).
- Client has not fixed a gateway ("cashfree / phonepe / can be razorpay — suggest one").

Building our own money-movement/settlement engine is high-risk (KYC, bank rails,
reconciliation, compliance). Modern Indian gateways offer **native marketplace split
settlement**, which removes most of that.

## Decision

- All business logic depends on a `PaymentProvider` **interface**
  (`createPaymentLink` / `createSplitPaymentLink`, `getPayment`, `verifyWebhook`, `refund`,
  `linkedAccount.*`, `payout`) — see `docs/08` §8.3. No gateway SDK types leak into
  services.
- **Documented default: Razorpay + Razorpay Route.** Each approved store gets a **linked
  account**; every *online* payment is **split at capture** — store share to the store's
  linked account, commission to the platform account — and Razorpay settles each linked
  account to its own bank on schedule. Rationale: best-in-class India DX/docs, mature Route
  product, RazorpayX for edge-case payouts.
- **Equal alternative: Cashfree (Easy Split + Payouts).** Same capabilities; a second
  adapter. **PhonePe PG** split/settlement is less mature — not recommended.
- `MockProvider` for local/dev/e2e. Selected at runtime by `PAYMENT_PROVIDER` env.
- Webhooks verified on the **raw body**; handlers **idempotent** on the provider payment id;
  a reconcile job polls stale `PENDING` payments.
- Commission %, COD reconciliation, and payout statements are **our** domain logic
  (ADR-0009), independent of which gateway is chosen.

## Alternatives considered

- **Plain payment links + a home-grown payout batch engine** — full control, but we own
  bank payouts, beneficiary KYC, retries, and reconciliation. Kept only as the *fallback*
  path (manual bank transfer / gateway payout API) for COD-heavy stores and adjustments.
- **Stripe Connect** — excellent split model, weaker fit for India UPI-first + local
  settlement. Not chosen.
- **Direct integration, no adapter** — locks us to one gateway and pollutes order/invoice
  logic. Rejected.

## Consequences

- One integration seam to test; swapping gateways = a new adapter + env change.
- Store onboarding must create a **linked account** and collect payout/KYC details before
  the store can receive online orders' funds (until then, hold + manual settle).
- COD payments have no gateway transaction → no split; handled by ADR-0009 (commission
  becomes a receivable netted from payouts).
- Refunds on split payments must reverse the transfer too — handled in the adapter.
- Action: client to confirm the final gateway (Razorpay vs Cashfree).
