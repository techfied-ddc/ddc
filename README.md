# DDC — Desire Premium Dry Cleaning Platform

A MERN platform for **Desire Premium Dry Cleaning**, a multi-store dry-cleaning business:
a marketing website, a customer PWA, a store operations PWA (with a built-in rider role),
and an admin panel — all served by one Node/Express API and one MongoDB Atlas database.

> **Status:** Documentation / planning phase. No application code yet.
> Start with [`CLAUDE.md`](./CLAUDE.md), then the [`docs/`](./docs) set.

- **Brand:** Desire Premium Dry Cleaning · **Domain:** `desiredrycleaning.in`
- **Contact:** techfied.desiredrycleaning@gmail.com · +91 91186 78519
- **HQ:** Greater Noida West, Uttar Pradesh 201009, India · INR · Asia/Kolkata

## The four surfaces

| App | Domain | Who | Notes |
|---|---|---|---|
| Website | `desiredrycleaning.in` | Public | Brand, services, contact, sign-in entry point |
| Customer app | `user.desiredrycleaning.in` | Customers | Installable PWA — Services · Cart · My Orders · Profile |
| Store platform | `store.desiredrycleaning.in` | Store staff + riders | Installable PWA — New · In-process · Analytics · Profile. Riders are a role here. |
| Admin panel | `admin.desiredrycleaning.in` | Business admins | Services, users, stores, orders, coupons, helpdesk, analytics |
| API | `api.desiredrycleaning.in` | backend | Express + Socket.IO |

## Order lifecycle (short version)

Customer builds cart → places order → auto-routed to the store covering their location
(admin fallback if routing fails) → store accepts → assigns pickup rider → customer sees
rider + **pickup OTP** → rider collects → garments verified at store → store issues
**invoice + payment link** → cleaning → store assigns delivery rider → delivered against
**delivery OTP** + **completed payment** → customer rates → analytics.

Full state machine: [`docs/06-order-lifecycle.md`](./docs/06-order-lifecycle.md).

## Tech stack

- **Frontend:** React 18 + Vite + TypeScript + React Router + TanStack Query + Zustand + Tailwind + shadcn/ui
- **PWA:** vite-plugin-pwa (Workbox), Web Push (VAPID)
- **Backend:** Node + Express + TypeScript + Mongoose + Zod + Socket.IO + pino
- **Data:** MongoDB Atlas, Redis (Upstash) for jobs/queues
- **Payments:** Cashfree (behind a provider adapter)
- **Maps:** Google Maps JS + Geocoding + Directions
- **Media:** Cloudinary
- **Monorepo:** pnpm workspaces + Turborepo
- **Hosting:** Vercel (frontends) + Render (API) + Atlas + Upstash + Cloudinary

## Repository layout

```
apps/       api · web-website · web-user · web-store · web-admin
packages/   shared (types/schemas/state machine) · ui · config
docs/       specs + ADRs
```

## Getting started (once code exists)

```bash
pnpm install
cp .env.example apps/api/.env   # fill values
pnpm --filter api seed
pnpm dev
```

## Documentation index

See [`docs/README.md`](./docs/README.md).
