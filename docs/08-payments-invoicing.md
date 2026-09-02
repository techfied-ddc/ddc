# 08 — Payments, Invoicing, Commission & Settlement

Related: ADR-0003 (gateway + adapter), ADR-0007 (pricing), ADR-0009 (commission &
settlement). Money is integer **paise** everywhere.

## 8.1 Pricing model (ADR-0007)

Two-stage:

1. **Estimate (non-binding)** — at cart/placement. `service.basePrice × qty` (+ addons)
   − coupon + tax. Shown labelled *"Estimated — final price confirmed after our store checks
   your garments."* Stored in `order.estimate`.
2. **Invoice (binding)** — after `RECEIVE_AT_STORE` the store adjusts quantities/prices/adds
   items, then `ISSUE_INVOICE`. That total is what the customer pays.

Large estimate↔invoice deltas (> configurable %) → in-app customer re-confirm (v1.1).

## 8.2 Payment mode

Customer chooses at checkout, editable until `ISSUE_INVOICE`:

- **ONLINE** — pays a payment link after the invoice is issued; funds are **split at capture**
  (§8.5).
- **COD** — pays cash to the rider at delivery; store holds the cash, owes the platform its
  commission (§8.6).

`settings.order.allowCashOnDelivery = true` (client-confirmed) is the global switch; a store
may opt out in its settings later.

## 8.3 Invoice

- One `invoices` doc per order (`invoiceId` on the order). Immutable once `ISSUED` except
  `VOID`.
- `lines[] {description, unit, qty, unitPrice, amount}`, `subTotal`,
  `discount {couponCode?, amount}`, `taxPercent`, `tax`, `grandTotal`, `number` =
  `INV-DPD-000123`.
- **Tax / GST is admin-managed**: `settings.defaultTaxPercent` (default 18), overridden by
  `store.settings.taxPercentOverride` when set by admin. Store GSTIN + business GSTIN shown
  on the invoice.
- PDF rendered server-side on issue, stored on Cloudinary (`invoice.pdfUrl`), emailed to the
  customer, downloadable in-app.

## 8.4 Payment provider adapter (ADR-0003)

Business logic depends only on this interface (default impl **Razorpay Route**; alt
**Cashfree Easy Split**; `MockProvider` for dev/e2e; selected by `PAYMENT_PROVIDER`):

```ts
interface PaymentProvider {
  // --- store onboarding: marketplace sub-account ---
  linkedAccount: {
    create(input: { store: {...}, bank?: {...}, upi?: string })
      : Promise<{ providerLinkedAccountId: string; status: LinkedAccountStatus }>;
    get(id: string): Promise<{ status: LinkedAccountStatus; kyc: string }>;
  };

  // --- per-order collection with split ---
  createSplitPaymentLink(input: {
    orderRef: string; amount: number; currency: 'INR';
    customer: { name: string; email?: string; phone: string };
    description: string; expiresInMinutes?: number;
    notifyUrl: string; returnUrl: string;
    split: { linkedAccountId: string; storeAmount: number; platformAmount: number };
  }): Promise<{ providerLinkId: string; linkUrl: string }>;

  getPayment(providerRef: string): Promise<{
    status: PaymentStatus; amountPaid: number; method?: string;
    providerPaymentId?: string; splitRef?: string;
  }>;

  verifyWebhook(headers: Record<string,string>, rawBody: Buffer):
    { valid: boolean; event: string; data: any };

  refund(input: { providerPaymentId: string; amount: number; reason: string;
    reverseSplit?: boolean }): Promise<{ providerRefundId: string; status: string }>;

  // --- settlement fallback (non-split / COD adjustments / manual) ---
  payout(input: { linkedAccountId?: string; beneficiary?: {...};
    amount: number; ref: string; purpose: string })
    : Promise<{ providerPayoutId: string; status: string }>;
}
```

No gateway-specific fields leak past this seam.

## 8.5 ONLINE: split at capture

- On `ISSUE_INVOICE` (mode ONLINE): compute
  `platformAmount = round(grandTotal × store.payout.commissionPercent / 100)`,
  `storeAmount = grandTotal − platformAmount`; call `createSplitPaymentLink` with the
  store's `providerLinkedAccountId`.
- Webhook `POST /api/v1/webhooks/payments/<provider>`:
  - verify signature on the **raw body**;
  - on paid: `payment.status=PAID`, `paidAt`, `amountPaid`, `method`, `splitRef`;
    `order.paymentStatus=PAID`; invoice `PAID`; emit `payment:updated`; enqueue receipt.
  - **idempotent** on `providerPaymentId` (+ event type); replays are no-ops; append to
    `payment.events`.
  - respond `200` fast; heavy work in a job.
- If the store's linked account isn't `ACTIVE` yet (`payout.holdFundsUntilKyc`), collect
  **without** a split (all to platform) and record the store's share as a
  `payouts` adjustment to release after KYC.
- Reconcile job: poll `getPayment()` for `PENDING` payments older than 10 min.

## 8.6 COD: cash + commission receivable

- No payment link. Invoice still issued (amount due on delivery).
- `MARK_COD_COLLECTED` (rider/store) → `payment.method='cod'`, `paymentStatus=PAID`,
  `order.codCollectedAt`.
- At `DELIVERED`, `order.settlement.codCommissionReceivable = platformCommission`;
  `store.payout.pendingBalance -= platformCommission`.
- Netted from the store's next `payouts` statement (§8.7).

## 8.7 Settlement statements (`payouts`, ADR-0009)

- One statement per store per `settings.payout.cadence` period (default **WEEKLY**).
- **Period-close job** builds a `DRAFT`:
  `onlineGross`, `onlineCommission` (mirrors gateway split),
  `codGross`, `codCommissionDue` (Σ `codCommissionReceivable`),
  `adjustments[]` (KYC-held releases, refund reversals, manual corrections),
  `netToStore = onlineGross − onlineCommission − codCommissionDue + Σ adjustments`,
  `orderRefs[]`.
- **Maker–checker:** `settings.payout.requireApproval` → a second admin / `SUPER_ADMIN`
  must `APPROVE` before `PROCESSING`. All transitions `auditLogs`-ed.
- **Pay:** `GATEWAY_ROUTE` (online already auto-settled by the gateway; statement is
  reconciliation only) or `GATEWAY_PAYOUT` / `MANUAL_BANK` for the net owed. `status`:
  `DRAFT → APPROVED → PROCESSING → PAID | FAILED`. `netToStore < 0` → `STORE_OWES` (admin
  collects offline / carries forward).
- **Reconcile job:** compare our figures to the gateway's settlement report; flag deltas to
  admin.
- Commission base = invoice `grandTotal`. Gateway fees borne by
  `settings.payout.gatewayFeeBorneBy` (default `PLATFORM`).

## 8.8 Refunds

- `POST /payments/:orderId/refund` (admin): partial/full; `reverseSplit` pulls back the
  store's portion too. Tracked in `payment.refunds[]`; webhook confirms.
- Refund after `DELIVERED` → adjust `order.settlement` and post a negative `adjustment` on
  the store's next statement.

## 8.9 Money handling rules

- Integer paise in DB + API; format only at the view layer (`formatMoney`).
- `amount = round(unitPrice × qty)`; `tax = round(taxable × taxPercent / 100)`;
  `grandTotal = subTotal − discount + tax`. Client never computes authoritative totals.
- `platformCommission` + `storeEarning` always reconcile to `grandTotal` to the paise.
- Currency fixed `INR` (v1).

## 8.10 Coupons interaction

- Applied to the estimate at placement, re-validated against the invoice at issue.
- `couponRedemptions` created at `PLACE`, finalised at `ISSUE_INVOICE`, deleted on
  cancel-before-pickup.
- Discount reduces `subTotal` before tax. Commission is on the discounted `grandTotal`
  (platform and store share the discount pro-rata by construction).

## 8.11 Failure & edge handling

| Case | Behaviour |
|---|---|
| Split link creation fails | Invoice `ISSUED` without link; store retries `invoice/issue`; customer sees "payment link pending" |
| Webhook missed | Reconcile job polls `getPayment()` |
| Customer pays twice (online) | Second auto-refunded (with split reversal); `payment.events` records both |
| Linked account not KYC-verified | Collect without split; queue store share as a statement adjustment |
| COD cash not collected but OTP attempted | `DELIVERY_VERIFY_OTP` blocked; app shows "collect ₹X" |
| Store opts out of COD | COD hidden at checkout for orders routed to that store |
| Amount changed after issue | `void` + re-issue; old link cancelled |
| Refund on cancellation after payment | Auto full refund job (+ split reversal); statement adjustment |
