# 16 — Testing & CI

## 16.1 Test pyramid

| Layer | Tool | Scope | Where |
|---|---|---|---|
| **Unit** | Vitest | Pure logic: order state machine, pricing/tax/coupon math, routing algorithm, money utils, Zod schemas, small React hooks | `packages/shared`, `apps/*/**/*.test.ts` |
| **Integration (API)** | Vitest + Supertest + `mongodb-memory-server` | Route → middleware → service → DB, with mocked payment/push/email/SMS/maps adapters | `apps/api/**/*.test.ts` |
| **Component** | Vitest + Testing Library | Key components/screens in isolation (cart, invoice card, OTP input, order timeline) | `apps/web-*/**/*.test.tsx` |
| **E2E** | Playwright | Critical cross-app journeys against a locally running stack with seeded data + mock provider | `e2e/` |
| **Accessibility** | `@axe-core/playwright` | Key screens (catalog, cart, order detail, store board, login) | in E2E |

Coverage gate: **≥ 60% overall, ≥ 85%** on `packages/shared` (state machine, pricing,
routing) and on `apps/api/src/modules/*/**.service.ts`.

## 16.2 Must-have test cases (v1)

**State machine (`packages/shared`)**
- every valid transition moves to the right state; every invalid `event/from` throws;
- OTP gate: `DELIVERY_VERIFY_OTP` blocked while `paymentStatus=PENDING` and
  `allowCashOnDelivery=false`; allowed when `PAID`; allowed with COD collected;
- cancel windows: customer can't cancel after `PICKED_UP`; admin can cancel anytime
  non-terminal.

**Pricing / coupons / commission**
- estimate math (items + addons + tax − discount) in paise, rounding;
- invoice recompute after verified quantities differ from estimate;
- percent coupon respects `maxDiscount`; `minOrder`; per-user + total limits; expiry;
  redemption row lifecycle on place / issue / cancel;
- **commission**: `platformCommission + storeEarning === grandTotal` to the paise for any
  percent/amount; snapshot taken at DELIVERED, immune to later % changes;
- **COD reconciliation**: `codCommissionReceivable` accrues; payout `netToStore` =
  onlineGross − onlineCommission − Σ codCommissionReceivable + adjustments; `STORE_OWES`
  when negative;
- **refund after DELIVERED** adjusts `order.settlement` + posts a negative statement line.

**Auth (phone OTP — ADR-0010)**
- request → hashed code in `authOtps`, TTL, resend cooldown (30s), per-phone/IP caps;
- verify: correct code within TTL → tokens; wrong/expired → `LOGIN_OTP_INVALID`/`..._EXPIRED`;
  attempt cap; consumed code can't be reused;
- new phone → CUSTOMER created; known rider phone → logs in as RIDER;
- identity linking phone↔Google↔email into one `users` row.

**Pickup slots**
- `GET /stores/:id/pickup-slots` respects `leadTimeMinutes`, `horizonDays`, per-window
  `enabled`, `daysOfWeek`, and remaining capacity;
- concurrent placements into the last slot unit → exactly one succeeds, the other gets
  `SLOT_UNAVAILABLE`.

**Routing**
- pincode match; zone fallback by priority; polygon `$geoIntersects`; radius nearest;
  tie-break order (load → rating → distance); `ROUTE_FAIL` when nothing matches;
  suspended store never selected; reject returns to admin queue (not auto re-route).

**API integration**
- auth: register/login/refresh rotation + reuse detection; RBAC deny matrix per route;
  ownership checks (customer/store/rider scoping);
- order happy path end-to-end via API calls;
- payment webhook: valid signature → PAID + idempotent replay is a no-op; invalid
  signature → 401 and no state change; reconcile job flips a stale PENDING;
- media sign endpoint enforces role/folder/size.

**E2E journeys**
1. Customer (Online): phone-OTP sign in → browse → cart → pick pickup slot → pay-online →
   place → (store accepts) → pickup OTP → (rider verifies) → invoice → pay (mock split) →
   delivery OTP → (rider verifies) → rate.
2. Customer (COD): same, choosing COD → at delivery rider marks cash collected → delivery
   OTP → order completes; verify `codCommissionReceivable` recorded.
3. Store: (admin onboards store + commission/SLA/slots) → set service area → receive routed
   order → assign pickup → receive at store → issue invoice → mark ready → assign delivery →
   finish. Then: view earnings, submit payout account.
4. Admin: onboard a store; handle a `ROUTING_FAILED` order via manual assign; issue a
   refund; **generate a payout run → approve (SUPER_ADMIN) → mark paid**; check reconcile.
5. PWA: app installs; offline shows cached orders read-only; push click deep-links (mocked).

## 16.3 Test data / seeds

`pnpm --filter api seed` creates:
- 1 `SUPER_ADMIN` (`admin@desiredrycleaning.in` / dev password from env),
- service categories + ~12 services with realistic INR prices,
- 3 `APPROVED` demo stores in Greater Noida West (distinct pincode sets incl. `201009`,
  `201306`, `201310`), each with a commission % (e.g. 15/20/25), an SLA (e.g. 48h), pickup
  windows, and 2 riders (placeholder selfie URLs); one store left `PENDING` for approval UX,
- 1 demo customer (phone-OTP; dev OTP is fixed e.g. `000000` when `PAYMENT_PROVIDER=mock`)
  with a saved address in-zone,
- optional `--with-orders` flag to generate orders across every status for UI work.

Seeds are idempotent (upsert by natural key). A separate `seed:e2e` produces the fixed
dataset Playwright expects.

## 16.4 Local dev

```bash
pnpm install
docker compose up -d        # optional: local mongo + redis (or use Atlas dev + Upstash)
cp .env.example apps/api/.env   # fill secrets
pnpm --filter api seed
pnpm dev                     # turbo runs api + 4 frontends
```
Mock adapters (`PAYMENT_PROVIDER=mock`, `EMAIL_PROVIDER`/`SMS_PROVIDER` mock, maps stub)
are the default in dev so nothing external is required to click through the whole flow.

## 16.5 CI (GitHub Actions)

`.github/workflows/ci.yml` on PR + push to `main`:

1. **setup** — checkout, pnpm, Node 24, restore Turbo cache.
2. **lint** — `pnpm lint` (ESLint) + `pnpm format:check` (Prettier) + `pnpm typecheck`.
3. **unit + integration** — `pnpm test -- --coverage` (Mongo via `mongodb-memory-server`);
   upload coverage; fail under threshold.
4. **build** — `pnpm build` for all apps (catches type/build breaks).
5. **e2e** — `pnpm --filter api seed:e2e` → start stack → `pnpm e2e` (Playwright, chromium +
   mobile-chrome project) → upload traces/screenshots on failure.
6. **audit** — `pnpm audit --prod` (non-blocking warn) + Renovate/Dependabot handles PRs.

`main` is protected: PR + green CI + 1 review required. Conventional-commit title checked.

## 16.6 Environments & deploy gating

| Branch / event | Result |
|---|---|
| PR | CI + Vercel preview deploys per frontend + Render preview API (branch DB) |
| merge to `main` | CI + auto-deploy **staging** (all apps) + run E2E against staging |
| tag `v*` / manual promote | deploy **production** (see doc 18); migrations run pre-boot |

## 16.7 Manual QA checklist (per release)

Install both PWAs on a real Android + iOS device; run the 4 E2E journeys by hand; verify
push notification delivery, Google OAuth on all subdomains, invoice PDF + email, refund,
and the admin routing-queue alert. Record results in the release notes.
