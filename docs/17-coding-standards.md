# 17 — Coding Standards

Shared configs live in `packages/config` (`eslint-config`, `tsconfig/base.json`,
`prettier`), and the design preset in `packages/ui` (Tailwind preset + tokens).

## 17.1 Language & types

- **TypeScript, `strict: true`** everywhere. `noUncheckedIndexedAccess`, `noImplicitOverride`
  on. No `any` — use `unknown` + narrowing; if truly unavoidable, `// why: <reason>`.
- Types/enums/schemas that cross the client/server boundary live **only** in
  `packages/shared`. Import them; never re-declare.
- Runtime validation with **Zod**; derive TS types from schemas (`z.infer`) rather than
  hand-writing duplicates.
- Prefer `type` for shapes, `enum`-like unions as `const` objects + union types
  (`export const OrderStatus = {...} as const; export type OrderStatus = ...`).

## 17.2 Naming

| Thing | Convention | Example |
|---|---|---|
| Files (ts, non-component) | kebab-case | `order.service.ts` |
| React components / files | PascalCase | `OrderTimeline.tsx` |
| Hooks | `useX` | `usePlaceOrder.ts` |
| Mongoose model | PascalCase singular | `Order`, `PushSubscription` |
| Collection | plural lowercase | `orders` |
| API route path | `/api/v1/kebab-case` | `/api/v1/orders/:id/assign-pickup` |
| Enum value | SCREAMING_SNAKE_CASE | `PICKUP_ASSIGNED` |
| Env var | SCREAMING_SNAKE_CASE | `CASHFREE_SECRET_KEY` |
| Zod schema | `zPascalCase` | `zPlaceOrder` |
| Query key | array, resource-first | `['order', id]` |
| Boolean | `is/has/can/should` prefix | `isPaid`, `canCancel` |

## 17.3 Backend structure rules

- **Module-per-feature** (`modules/<feature>/`): `routes` → `controller` → `service` →
  `model`. Controllers are thin (validate, call service, shape response). Services hold all
  business logic and own transactions.
- Cross-module access is **service → service**. Never import another module's model
  directly.
- All order status changes go through `orders.service.transition(orderId, event, actor, payload)`
  → delegates to `orderReducer` in `packages/shared`. No `order.status = ...` anywhere else.
- Every route: `authenticate` (unless explicitly public) + `authorize(...roles)` +
  `validate(zSchema)`holds. A non-public route with no `authorize` fails review.
- Side effects (socket emit, job enqueue, notification) happen in the service **after** a
  successful DB write, ideally after the transaction commits.
- Errors: throw typed `AppError(code, message, httpStatus, details?)`; `errorHandler`
  serialises. Never `res.send` an error shape by hand.
- No blocking work in request handlers — offload to BullMQ jobs (notifications, PDF,
  geocode retries, reconcile).

## 17.4 Frontend structure rules

- **Feature folders** under `src/features/<feature>/` (components, hooks, `api.ts`, types
  from shared). Route components in `src/routes` or co-located.
- **Server state → TanStack Query only.** No server data in Zustand/Context. Mutations use
  `useMutation` + targeted `queryClient.invalidateQueries`.
- **Client state → Zustand** slices (`auth`, `cart`, `ui`). Keep slices small; no
  business logic.
- One `apiClient` wrapper (fetch): base URL from `VITE_API_BASE_URL`, attaches the access
  token, does silent refresh on `401` once, throws typed errors. No `fetch` calls scattered
  in components.
- Socket handling centralised in `lib/socket.ts`: on event → `invalidateQueries`. Components
  don't touch the socket directly.
- Styling: **Tailwind + the `packages/ui` preset/tokens**. Use design tokens/utilities, not
  raw hex. Shared components from `packages/ui`; app-specific ones stay local until reused.
- Every async view implements **loading (skeleton) / empty / error+retry**. No bare spinners
  on primary content.
- Money rendered only via `formatMoney`. Dates via a shared `formatDate`/`formatRelative`
  (business timezone).
- Accessibility: semantic elements, labelled controls, keyboard paths, visible focus (never
  remove the ring), respect `prefers-reduced-motion` (enforced in `packages/ui/motion`).

## 17.5 Formatting & lint

- **Prettier** (no debate): 2-space indent, single quotes, semicolons, trailing commas
  `all`, print width 100.
- **ESLint**: `@typescript-eslint` recommended-type-checked, `import/order` (grouped,
  alphabetised), `react-hooks`, `jsx-a11y`, `no-floating-promises`, `no-console` (allow
  `warn`/`error` in API, disallow in web except a dev logger).
- CI fails on lint errors and on `tsc --noEmit` errors. Warnings tracked, not blocking.

## 17.6 Comments & docs

- Comment the **why**, not the what. Match the density of surrounding code.
- Public service methods and shared utilities get a one-line TSDoc.
- If a change alters behaviour described in `docs/`, update that doc in the same commit.
  New architectural decision → new ADR (`docs/adr/`, copy `0000-template.md`).

## 17.7 Git workflow

- Branches: `feat/<short>`, `fix/<short>`, `chore/<short>`, `docs/<short>` off `main`.
- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`,
  `perf:`, `build:`, `ci:`. Scope optional (`feat(orders): ...`).
- PRs: small, single-purpose; description links FR/NFR IDs; screenshots/gifs for UI;
  checklist (tests added, docs updated, memory updated if a decision changed).
- `main` protected: green CI + 1 approval. Squash-merge; PR title = the squash commit.
- No force-push to shared branches. No committing `.env`, secrets, or `node_modules`.

## 17.8 Dependencies

- Add deps deliberately; prefer the platform/stdlib and small focused libs. Discuss adding
  anything large in the PR.
- Lockfile (`pnpm-lock.yaml`) committed. Renovate/Dependabot for updates; review before merge.
- Pin exact versions for anything security- or money-adjacent (payment SDK, auth libs).

## 17.9 Definition of Done

A task is done when: code + tests pass locally and in CI; lint/typecheck clean; the
relevant `docs/` updated; an ADR added if a decision was made; project memory updated if
context changed; the PR describes what and why and references requirement IDs.
