# DDC Documentation

Read [`../CLAUDE.md`](../CLAUDE.md) first — it holds the locked decisions and workflow rules.

## Index

| # | Doc | Covers |
|---|---|---|
| 01 | [overview](01-overview.md) | Vision, goals, scope, personas, glossary, client-notes summary |
| 02 | [requirements](02-requirements.md) | Functional + non-functional requirements, MoSCoW priority |
| 03 | [architecture](03-architecture.md) | Stack, monorepo, runtime topology, realtime, diagrams |
| 04 | [data-model](04-data-model.md) | Every MongoDB collection, schema, enum, index |
| 05 | [api-spec](05-api-spec.md) | Conventions, auth, error shape, endpoint catalog, socket events |
| 06 | [order-lifecycle](06-order-lifecycle.md) | Order state machine, OTP rules, payment gate, per-transition effects |
| 07 | [auth-rbac](07-auth-rbac.md) | Google OAuth, JWT/cookies, roles, permission matrix, onboarding flows |
| 08 | [payments-invoicing](08-payments-invoicing.md) | Pricing model, invoice, Cashfree adapter, webhooks, refunds, payouts |
| 09 | [geo-routing](09-geo-routing.md) | Location capture, zones, routing algorithm, admin fallback |
| 10 | [frontend-user-app](10-frontend-user-app.md) | Customer PWA — screens, nav, states |
| 11 | [frontend-store-platform](11-frontend-store-platform.md) | Store + rider role — screens, daily ops, analytics |
| 12 | [frontend-admin-panel](12-frontend-admin-panel.md) | Admin — moderation, helpdesk, analytics |
| 13 | [frontend-marketing-website](13-frontend-marketing-website.md) | Website — pages, SEO, content model |
| 14 | [pwa-notifications](14-pwa-notifications.md) | Manifest, service worker, offline, web push, email, SMS |
| 15 | [non-functional](15-non-functional.md) | Security, performance, observability, backup, privacy |
| 16 | [testing-and-ci](16-testing-and-ci.md) | Test strategy, tooling, seed data, GitHub Actions, environments |
| 17 | [coding-standards](17-coding-standards.md) | TS config, lint, naming, git workflow, PR rules |
| 18 | [deployment](18-deployment.md) | Vercel + Render + Atlas + Upstash + Cloudinary; DNS; VPS alternative |
| 19 | [roadmap](19-roadmap.md) | Delivery phases, MVP cut, milestone checklists |
| 20 | [design-system](20-design-system.md) | Black & gold palette, liquid-glass surfaces, motion, fonts, components |
| 21 | [project-structure](21-project-structure.md) | Full monorepo tree — every folder/file and what goes in it |
| 22 | [ways-of-working](22-ways-of-working.md) | How Claude works this project: full-stack ownership, no-half-work, ask-don't-assume, manual-work handoff, responsive checklist, living logs |

## ADRs — [`adr/`](adr/)

| ADR | Decision |
|---|---|
| [0001](adr/0001-monorepo-mern.md) | pnpm + Turborepo monorepo, MERN, TS everywhere |
| [0002](adr/0002-auth-jwt-cookies.md) | JWT access + refresh cookie, shared across subdomains |
| [0003](adr/0003-payments-cashfree-adapter.md) | Cashfree behind a `PaymentProvider` interface |
| [0004](adr/0004-rider-as-store-role.md) | Rider is a role in the store platform, not a separate app |
| [0005](adr/0005-realtime-socketio.md) | Socket.IO for live order tracking |
| [0006](adr/0006-geo-routing-pincode-first.md) | Pincode-first routing, polygon optional |
| [0007](adr/0007-pricing-estimate-then-invoice.md) | Estimate at cart, binding invoice after inspection |
| [0008](adr/0008-hosting-vercel-render-atlas.md) | Hosting split: Vercel / Render / Atlas |
| [0009](adr/0009-commission-and-store-settlement.md) | Admin-set commission % per store; split settlement + COD receivable netting |
| [0010](adr/0010-phone-otp-auth.md) | Phone-OTP (SMS) as a primary auth method; SMS is a core dependency |

## How to keep these current

Any code change that alters documented behaviour updates the matching doc in the same
commit. New architectural choices get a new ADR (copy `adr/0000-template.md`). Update
project memory (`~/.claude/projects/D--DDC/memory/`) after **every session**. The working
agreement — full-stack ownership, no half-work, ask-don't-assume, step-by-step manual-work
handoff, mobile-first responsive, built-for-change — is **[doc 22](22-ways-of-working.md)**;
follow it on every task.
