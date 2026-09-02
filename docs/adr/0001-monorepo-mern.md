# ADR-0001 — pnpm + Turborepo monorepo on the MERN stack

- **Status:** accepted
- **Date:** 2026-08-31
- **Deciders:** client + dev

## Context

The client wants one platform with four frontends (website, customer app, store platform,
admin) sharing **one backend and one MongoDB Atlas database**, built on the MERN stack with
React + Node + MongoDB. The four apps must share types, the order state machine, design
tokens, and validation, deploy independently, and stay consistent over time.

## Decision

- **One repository**, pnpm workspaces + Turborepo.
- `apps/`: `api`, `web-website`, `web-user`, `web-store`, `web-admin`.
- `packages/`: `shared` (types, Zod schemas, enums, order state machine, money utils),
  `ui` (design system + motion), `config` (eslint/tsconfig/prettier).
- **TypeScript everywhere**, `strict`.
- Frontends: **React 18 + Vite** (SPA), not Next.js — the client specified React SPA + a
  separate Express API, and the apps are behind auth / installable PWAs where SSR adds
  little. The marketing site prerenders static routes for SEO.
- Backend: **Express + Mongoose**, module-per-feature.

## Alternatives considered

- **Polyrepo (5 repos)** — version skew on shared types, painful cross-cutting changes,
  more CI/release overhead. Rejected.
- **Next.js for all frontends** — heavier, couples routing/data to a framework we don't
  need for authed SPAs/PWAs; client asked for a plain React + Express split. Kept as an
  option only for the marketing site, still declined for consistency.
- **Nx instead of Turborepo** — more powerful, more to learn; Turborepo covers our task
  graph + caching needs with less config.
- **npm/yarn workspaces without Turbo** — fine, but we lose cached task pipelines across 5
  apps.

## Consequences

- One `pnpm install`, one CI, atomic cross-app changes, shared contract enforced by
  `packages/shared`.
- Everyone must respect the boundary: frontends never import from `apps/api`; both sides
  import from `packages/shared`.
- Turborepo cache config to maintain; Vercel projects each set a Root Directory + filtered
  build.
- Slightly larger clone / initial build than a single app.
