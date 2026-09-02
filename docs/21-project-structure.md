# 21 — Project Structure (Monorepo Layout)

This is the **agreed target layout**. It is finalised *here, on paper*; the folders/files
themselves are created in **Phase 0** (doc 19) when the build starts in VS Code — scaffolding
is code work, not a doc. Treat this tree as the contract: put new code where it says.

## 21.1 Root

```
ddc/                                  # = D:\DDC  (repo root)
├── CLAUDE.md                         # constant instructions (read first every session)
├── README.md
├── .gitignore
├── .env.example                      # every env var, documented
├── .nvmrc                            # Node 24
├── package.json                      # workspace root: scripts, devDeps, packageManager=pnpm
├── pnpm-workspace.yaml               # packages: apps/*, packages/*
├── turbo.json                        # task pipeline: dev, build, lint, typecheck, test
├── tsconfig.json                     # references only; real base in packages/config
├── .editorconfig
├── .prettierrc.cjs                   # re-exports packages/config/prettier
├── .eslintrc.cjs                     # re-exports packages/config/eslint
├── docker-compose.yml               # local mongo + redis (optional; Atlas/Upstash also fine)
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint + typecheck + test + build + e2e
│       └── deploy-staging.yml
├── .vscode/
│   ├── extensions.json               # recommended: eslint, prettier, tailwind, playwright
│   └── settings.json                 # format on save, eslint fix, tailwind IntelliSense
├── assets/                           # source brand assets (NOT app public/)
│   ├── logo.png                      # client supplies; also logo.svg when available
│   ├── logo-mark.svg
│   └── brand/                        # palette swatch, font licences, photography
├── apps/
├── packages/
├── docs/
├── infra/                            # deploy notes, env var name templates, runbooks
│   └── README.md
└── e2e/                              # Playwright cross-app journeys (doc 16)
    ├── playwright.config.ts
    ├── fixtures/
    └── specs/
```

## 21.2 `packages/` — shared code (the contract)

```
packages/
├── shared/                           # imported by BOTH api and every frontend
│   ├── package.json                  # name: @ddc/shared
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── enums.ts                  # Role, OrderStatus, PaymentStatus, PaymentMode,
│       │                             #   PayoutStatus, ServiceUnit, TicketStatus, ...
│       ├── constants.ts              # ORDER_REF_PREFIX='DPD', currency, etc.
│       ├── schemas/                  # Zod schemas — one file per domain
│       │   ├── auth.ts               # zOtpRequest, zOtpVerify, zRegister, zLogin
│       │   ├── order.ts              # zPlaceOrder (items, slot, paymentMode, coupon)
│       │   ├── invoice.ts  payment.ts  store.ts  rider.ts  coupon.ts
│       │   ├── ticket.ts  payout.ts  catalog.ts  slot.ts
│       │   └── common.ts             # zObjectId, zPincode, zPhoneE164, zMoneyPaise
│       ├── order-state-machine/
│       │   ├── machine.ts            # ORDER_STATE_MACHINE (transition table)
│       │   ├── reducer.ts            # orderReducer(state, event) -> nextState + effects
│       │   └── machine.test.ts
│       ├── money.ts                  # toPaise, fromPaise, formatMoney, splitCommission
│       ├── slots.ts                  # slot capacity / availability helpers (pure)
│       ├── datetime.ts               # formatDate/Relative in Asia/Kolkata
│       └── types.ts                  # DTOs derived via z.infer; API response envelope
├── ui/                               # shared React design system (doc 20)
│   ├── package.json                  # name: @ddc/ui
│   ├── tailwind-preset.cjs           # black/gold tokens, radii, spacing, fonts
│   ├── src/
│   │   ├── index.ts
│   │   ├── styles/globals.css        # CSS vars (:root), glass utilities, fallbacks
│   │   ├── tokens.ts                 # token values also as TS (for JS access)
│   │   ├── fonts.ts                  # @fontsource-variable imports (Fraunces/Inter/JetBrains)
│   │   ├── components/               # GlassCard, Button, AppBar, BottomTabBar, OtpInput,
│   │   │                             #   StatusPill, KpiTile, Timeline, Sheet, Toast, ...
│   │   ├── motion/                   # Reveal, Parallax, Marquee, Magnetic, useLiquidGlass,
│   │   │                             #   motionConfig, reduced-motion guard
│   │   └── hooks/                    # useMediaQuery, useInstallPrompt, ...
│   └── ...
└── config/
    ├── package.json                  # name: @ddc/config
    ├── eslint/index.cjs
    ├── prettier/index.cjs
    └── tsconfig/
        ├── base.json                 # strict, noUncheckedIndexedAccess, ...
        ├── react.json
        └── node.json
```

## 21.3 `apps/api` — the only backend

```
apps/api/
├── package.json                      # name: @ddc/api
├── tsconfig.json                     # extends @ddc/config/tsconfig/node
├── src/
│   ├── index.ts                      # build express app + http server + socket.io, listen
│   ├── app.ts                        # middleware wiring, route mounting, error handler
│   ├── config.ts                     # zod-validated process.env -> typed config object
│   ├── lib/
│   │   ├── db.ts                     # mongoose connect
│   │   ├── redis.ts                  # ioredis / upstash
│   │   ├── socket.ts                 # io instance + auth + room helpers + Redis adapter
│   │   ├── logger.ts                 # pino
│   │   ├── cloudinary.ts             # signed upload params
│   │   ├── maps.ts                   # geocoding wrapper
│   │   └── errors.ts                 # AppError(code, message, status, details?)
│   ├── middleware/
│   │   ├── authenticate.ts  authorize.ts  validate.ts  rateLimit.ts
│   │   ├── requestId.ts  errorHandler.ts  rawBody.ts   # rawBody for webhooks
│   ├── modules/                      # one folder per feature: routes/controller/service/model/test
│   │   ├── auth/                     # + otp.service.ts, google.ts, tokens.ts, authOtp.model.ts
│   │   ├── users/
│   │   ├── stores/                   # + serviceArea, pickupSlots, sla, commission sub-handlers
│   │   ├── riders/
│   │   ├── catalog/                  # categories + services
│   │   ├── orders/                   # + order.transition.ts (wraps shared reducer)
│   │   ├── invoicing/
│   │   ├── payments/                 # provider/ (adapter + razorpay + cashfree + mock), webhooks
│   │   ├── payouts/                  # settlement statements, run/approve/reconcile
│   │   ├── coupons/
│   │   ├── tickets/
│   │   ├── notifications/            # channels/{inApp,push,email,sms}.ts, templates/
│   │   ├── geo/                      # routeOrder, zones
│   │   ├── analytics/
│   │   └── media/                    # signed upload endpoint
│   ├── jobs/
│   │   ├── queue.ts                  # BullMQ setup (+ in-process fallback)
│   │   └── workers/                  # routing, notification, payment-reconcile, refund,
│   │       │                         #   settlement-close, auto-complete, analytics-rollup
│   ├── db/
│   │   ├── migrations/               # migrate-mongo scripts (up + down)
│   │   └── seed/                     # seed.ts (dev) + seed.e2e.ts
│   └── types/                        # express Request augmentation (req.user)
└── test/                             # supertest helpers, in-memory mongo setup
```

## 21.4 `apps/web-*` — the four frontends (same skeleton)

`web-website`, `web-user`, `web-store`, `web-admin`. PWA bits only in `web-user` and
`web-store`. `web-website` also has prerender config.

```
apps/web-user/                        # (identical shape for the others)
├── package.json                      # name: @ddc/web-user
├── index.html
├── vite.config.ts                    # + VitePWA plugin (user/store only)
├── tsconfig.json                     # extends @ddc/config/tsconfig/react
├── tailwind.config.cjs               # presets: [require('@ddc/ui/tailwind-preset')]
├── public/
│   ├── manifest.webmanifest          # theme_color/background_color #0B0B0C (user/store)
│   ├── icons/                        # 192/256/384/512 maskable, gold-on-black
│   └── robots.txt                    # (website: + sitemap)
└── src/
    ├── main.tsx                      # mount, providers (QueryClient, Router, Toaster)
    ├── app.tsx
    ├── routes.tsx                    # route tree; lazy() per route
    ├── lib/
    │   ├── apiClient.ts              # fetch wrapper: base URL, bearer, silent refresh
    │   ├── queryClient.ts
    │   ├── socket.ts                 # connect + event -> queryClient.invalidateQueries
    │   └── env.ts                    # typed import.meta.env
    ├── stores/                       # zustand slices: auth.ts, cart.ts (persisted), ui.ts
    ├── features/                     # feature folders: components + hooks + api.ts
    │   ├── auth/                     # PhoneOtp, GoogleButton, LinkIdentity
    │   ├── catalog/  cart/  orders/  addresses/  tickets/  profile/
    │   └── (store app) queue/ inprocess/ riders/ slots/ earnings/ analytics/ rider-jobs/
    │   └── (admin app) dashboard/ orders/ routing-queue/ stores/ payouts/ users/
    │       catalog/ coupons/ tickets/ analytics/ settings/
    ├── components/                   # app-local composites (not yet promoted to @ddc/ui)
    ├── pwa/                          # registerSW.ts, push.ts, useOfflineBanner.ts (user/store)
    └── styles/                       # tailwind entry importing @ddc/ui globals
```

## 21.5 Naming recap (full rules in doc 17)

- Packages: `@ddc/shared`, `@ddc/ui`, `@ddc/config`, `@ddc/api`, `@ddc/web-*`.
- Non-component files `kebab-case.ts`; components `PascalCase.tsx`; hooks `useThing.ts`.
- API modules: `<feature>.routes.ts` / `.controller.ts` / `.service.ts` / `.model.ts` /
  `.test.ts`.
- Mongoose model = `PascalCase` singular; collection = plural lowercase.

## 21.6 What is NOT decided here

- Exact component inventory in `@ddc/ui` (grows as screens are built).
- Whether `@ddc/ui` ships compiled or as source (`exports` pointing at `src`) — decide in
  Phase 0; source-with-tsup is the likely default.
- Per-app route file granularity.
These are implementation details for Phase 0; they don't change the tree above.
