# 22 — Ways of Working (Claude + this project)

This project is **client work for a paying customer** (Desire Premium Dry Cleaning). It must
be built to professional agency standard, well-organised, and easy for the customer to
amend and extend later. `CLAUDE.md` §3 is the short version; this is the full contract plus
the living logs. Read it at the start of every session.

---

## 22.1 Role

Claude is the **full-stack developer** for DDC. Scope of ownership: MongoDB schema,
Express API, Socket.IO, background jobs, all four React frontends (`web-website`,
`web-user`, `web-store`, `web-admin`), the shared `packages/*`, PWA, tests, CI config,
deployment config, and the documentation set. When a feature is picked up, Claude owns it
end to end: **data model → `packages/shared` types/schemas/state-machine → API module →
every affected frontend → tests → docs → memory**.

## 22.2 Principles

1. **Whole-project thinking.** Every change is evaluated against all apps, the shared
   contract, the order state machine, payments/settlement, routing, and the docs before it
   is made. A change that helps one surface must not silently break another.
2. **No half-work.** Finish the whole task. No stray `TODO`s, stubs, placeholder returns,
   commented-out code, or "wire up later" — unless the user explicitly agreed to defer a
   named piece. If a rename touches 20 files, touch 20 files. If a new field needs a
   migration + seed + UI + test, do all four.
3. **Maximise completion.** Each session, do everything that can be done in code. Only
   genuinely human actions get handed back (§22.4).
4. **No assumptions.** If scope, a value, an edge case, a priority, or a UX detail is
   ambiguous, **ask first** (§22.3). If you must keep moving to avoid a hard block, state
   the assumption in bold in your reply and confirm it in the same turn. Target: zero
   avoidable rework, zero surprises for the customer.
5. **Build for change.** Clear module boundaries; named constants (no magic numbers/
   strings); configuration over hard-coding; an adapter at every external seam (payments,
   SMS, email, push, maps, media, analytics); one source of truth per concept in
   `packages/shared`. Leave each file easier to change than you found it.
6. **Professionalism.** Conventions in `docs/17`. Tests ship with business logic.
   Conventional Commits, small PRs. Nothing merges lint-dirty, type-dirty, or untested.
   Accessibility (`docs/15` §15.5) and the performance budget (`docs/15` §15.2) are
   acceptance criteria.
7. **Docs + memory are part of the deliverable**, updated in the same change as the code
   (§22.5).
8. **Responsive, mobile-first** — §22.6, non-negotiable.
9. **Safety** — ask before deploys, migrations on real data, real notifications, money
   movement, or publishing anything.

## 22.3 When to ask vs proceed

**Ask before building when:**
- a requirement in `docs/` is silent or contradictory on the case in hand;
- there's a real product choice (copy, flow, which field wins, what a default should be)
  the customer would have an opinion on;
- a value is unknown (a rate, a threshold, a third-party account detail, a business rule);
- the change would alter a locked decision (`CLAUDE.md` §2) — raise it as a proposed ADR;
- the "right" approach has a meaningful cost/benefit trade-off the user should weigh.

**Proceed (and note it) when:**
- it's a pure implementation detail with an obvious idiomatic answer;
- a well-established convention already covers it (`docs/17`, `docs/20`);
- it's reversible and low-impact — do it, mention it in the summary.

Batch questions where possible; don't drip one at a time. Prefer concrete options with a
recommendation over open-ended questions.

## 22.4 Manual-work handoff protocol

For any step Claude cannot perform (account creation, dashboard settings, entering secrets,
DNS, DLT/SMS template registration, KYC, buying a domain, interactive CLI, approving a
payout, app-store anything, providing brand assets, etc.):

1. **Stop** and say clearly: *"This part needs you."*
2. Give **numbered steps**: exact site, exact menu/screen names, exact values to enter or
   generate, and **where the output goes** (which env var, which file, which config field).
3. Give a **verification step** ("you should see X" / "run Y and expect Z").
4. **Wait** for the user to confirm done (and paste back any non-secret identifiers needed).
5. Continue. **Repeat the full steps every time** the task recurs — never assume recall.
6. Add/close the item in the **Manual work log** (§22.8).

Never ask the user to paste a secret into the chat — have them put it directly into the
Vercel/Render/provider dashboard or their local `.env`, and tell Claude only that it's set.

## 22.5 Docs & memory upkeep

- **Docs:** any behaviour change → update the matching `docs/NN-*.md` in the same change.
  New architectural decision → new `docs/adr/NNNN-*.md` (copy `0000-template.md`), and add
  it to `docs/README.md`. Keep `docs/README.md` and this file's logs current.
- **Memory (`C:\Users\DELL\.claude\projects\D--DDC\memory\`):** after every session, update
  the relevant `project-ddc-*.md` file(s) and the `MEMORY.md` index line. Capture: current
  build state, decisions made, why, and open threads. Not a file-by-file changelog. Delete
  memories that become wrong.
- **Session summary** (every session): what changed · what's verified (tests/breakpoints) ·
  what's left · what needs the user.

## 22.6 Responsive checklist (run before "done" on any UI change)

- [ ] Built mobile-first: base styles target ~375px; `sm/md/lg` only *add*.
- [ ] Checked at **375×812 (mobile)**, **768×1024 (tablet)**, **1280+ (desktop)**.
- [ ] No horizontal page scroll at any width. Wide tables/charts/code scroll inside their
      own `overflow-x:auto` container.
- [ ] Touch targets ≥ 44×44px; spacing usable with a thumb; primary actions reachable in
      the bottom half on mobile.
- [ ] Bottom tab bars / sheets respect safe-area insets (`env(safe-area-inset-*)`).
- [ ] Inputs set the right mobile keyboard (`type`, `inputmode`, `autocomplete`).
- [ ] No hover-only affordance; everything works on tap. Focus states visible.
- [ ] Images: `max-width:100%`, explicit dimensions, Cloudinary `f_auto,q_auto` + sized.
- [ ] Text ≥ 16px base (avoids iOS zoom-on-focus); line length comfortable on desktop.
- [ ] `prefers-reduced-motion` honoured; glass/`backdrop-filter` layers ≤ 4 on screen.
- [ ] Customer & store PWAs: install + offline shell verified on **real Android Chrome** and
      **iOS Safari** (not just devtools emulation) before a release.
- [ ] Lighthouse (mobile) Perf/PWA/A11y/SEO ≥ 90 on key screens.

## 22.7 Per-task Definition of Done (mirror of `CLAUDE.md` §3B)

Code complete across every affected layer · `packages/shared` updated · unit/integration/
e2e tests added and green · `pnpm lint` + `pnpm typecheck` clean · responsive checklist
passed · affected `docs/` updated · ADR added if a decision was made · **`memory/` +
`MEMORY.md` updated** · manual follow-ups written up step-by-step in §22.8 · session summary
delivered.

---

## 22.8 Manual work log (living)

Claude keeps this current. Status: ☐ todo · ⏳ waiting on user · ✅ done.

| # | Item | Who | Status | Notes / where the result goes |
|---|---|---|---|---|
| M1 | Register domain `desiredrycleaning.in` + DNS access | User | ☐ | Needed for subdomains + TLS (`docs/18` §18.1) |
| M2 | Create MongoDB Atlas org + `ap-south-1` cluster + DB user + IP allowlist | User | ✅ 2026-09-11 | `MONGODB_URI` set in local `.env` |
| M3 | Create Upstash Redis DB | User | ✅ 2026-09-11 | `REDIS_URL` set in local `.env` |
| M4 | Create Cloudinary account | User | ✅ 2026-09-11 | `CLOUDINARY_*` set in local `.env` |
| M5 | Google Cloud project → OAuth client + set redirect URIs | User | ✅ 2026-09-11 | `GOOGLE_CLIENT_ID/SECRET` set; redirect URI = `https://api.desiredrycleaning.in/api/v1/auth/google/callback` for prod |
| M6 | ~~MSG91~~ **Resend** email OTP (no DLT registration needed) | User | ✅ 2026-09-11 | `RESEND_API_KEY` set in `.env`; domain DNS records still pending (do alongside M1 DNS) |
| M7 | Payment: **UPI Link** mode (no gateway account needed for MVP) | — | ✅ 2026-09-17 | `PAYMENT_PROVIDER=upi_link`, `UPI_VPA=8700371612@pthdfc` set; Razorpay/Cashfree can be added post-launch |
| M8 | Per store: gateway linked/vendor account + KYC | Deferred | ⏳ post-launch | Only needed when switching to Razorpay Route; not required with UPI Link |
| M9 | Verify `desiredrycleaning.in` in Resend (SPF/DKIM/DMARC records at registrar) | User | ☐ | Do alongside M1 DNS; until done, Resend sends from their domain |
| M10 | Vercel account + 4 projects (root dirs, subdomains) | User | ☐ | See steps below |
| M11 | **Railway** account + API service | User | ☐ | See steps below (replaces Render) |
| M12 | Sentry projects (API + 4 frontends) | User | ☐ | → `SENTRY_DSN`, `VITE_SENTRY_DSN` — optional for launch |
| M13 | Provide brand assets: `assets/logo.png` (+ SVG/monogram), any Pantone gold, dark garment photos | User | ☐ | `docs/20` §20.9 |
| M14 | Provide business values: **GSTIN**, GST rate, default commission %, payout cadence, per-store SLA + pincodes + pickup-slot windows | User | ☐ | Seeds `settings` + each store (`docs/01` §1.8) |
| M15 | ~~Finalise payment gateway choice~~ **Resolved: UPI Link for MVP** | — | ✅ 2026-09-17 | `ADR-0003` confirmed; Razorpay/Cashfree can be wired post-launch |
| M16 | OpenCage geocoding API key (optional) | User | ☐ | `OPENCAGE_API_KEY`; routing falls back to pincode-only matching without it |

(Claude: add rows as new manual needs appear; move to ✅ with the date when the user
confirms. Keep this table and `docs/01` §1.8 in sync.)

---

### M10 — Vercel setup (step-by-step)

Do this once per frontend app (4 total). All `vercel.json` configs are already in the repo.

1. Go to **vercel.com** → **Add New Project** → **Import Git Repository** → select the DDC
   repo.
2. **Framework Preset:** Other (not Next.js).
3. **Root Directory:** `apps/web-website` (repeat with `web-user`, `web-store`, `web-admin`
   for the other three projects).
4. Vercel detects `vercel.json` automatically — leave Build / Output / Install fields blank.
5. Under **Environment Variables**, add the `VITE_*` vars for that app (see
   `apps/web-*/  .env.example`). At minimum:
   - `web-website`: `VITE_API_URL=https://api.desiredrycleaning.in`
   - `web-user`: `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_VAPID_PUBLIC_KEY`,
     `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_MAPS_KEY`
   - `web-store`: `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_VAPID_PUBLIC_KEY`,
     `VITE_GOOGLE_MAPS_KEY`
   - `web-admin`: `VITE_API_URL`
6. **Deploy** — Vercel runs the build and gives you a `*.vercel.app` preview URL.
7. In the project **Settings → Domains**, add the custom subdomain:
   - `web-website` → `desiredrycleaning.in` + `www.desiredrycleaning.in`
   - `web-user` → `user.desiredrycleaning.in`
   - `web-store` → `store.desiredrycleaning.in`
   - `web-admin` → `admin.desiredrycleaning.in`
8. At your DNS registrar add the CNAME / A records Vercel shows. TLS auto-provisioned.
9. Verify: visit each subdomain and confirm the app loads and `VITE_API_URL` resolves.

---

### M11 — Railway API service setup (step-by-step)

`apps/api/railway.toml` is already in the repo. Railway reads it automatically.

1. Go to **railway.app** → **New Project** → **Deploy from GitHub repo** → select the DDC
   repo. If prompted, authorise the Railway GitHub app.
2. Railway detects `railway.toml` automatically. It will start a build.
   **Cancel the first build immediately** — env vars aren't set yet.
3. Click **Variables** → **Raw Editor** and paste the entire block below, filling in
   your values. Variables marked `✅ known` already have their values confirmed.
   ```
   NODE_ENV=production
   API_BASE_URL=https://api.desiredrycleaning.in
   MONGODB_URI=<your Atlas connection string from M2>
   REDIS_URL=<your Upstash connection string from M3>
   JWT_ACCESS_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   JWT_REFRESH_SECRET=<run same command — different value>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=30d
   COOKIE_DOMAIN=desiredrycleaning.in
   COOKIE_SECURE=true
   CORS_ORIGINS=https://desiredrycleaning.in,https://user.desiredrycleaning.in,https://store.desiredrycleaning.in,https://admin.desiredrycleaning.in
   GOOGLE_CLIENT_ID=672790556603-3874o2vsv1kbopmraersbjvjvu10aj7k.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<from local apps/api/.env — NEVER put in git>
   GOOGLE_REDIRECT_URI=https://api.desiredrycleaning.in/api/v1/auth/google/callback
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=<from local apps/api/.env — NEVER put in git>
   EMAIL_FROM=noreply@desiredrycleaning.in
   PAYMENT_PROVIDER=upi_link
   UPI_VPA=<your UPI VPA — from local .env>
   UPI_DISPLAY_NAME=Desire Premium Dry Cleaning
   CLOUDINARY_CLOUD_NAME=<from local apps/api/.env>
   CLOUDINARY_API_KEY=<from local apps/api/.env>
   CLOUDINARY_API_SECRET=<from local apps/api/.env — NEVER put in git>
   VAPID_PUBLIC_KEY=<run: npx web-push generate-vapid-keys — public key from local .env>
   VAPID_PRIVATE_KEY=<NEVER put in git — private key from local .env>
   VAPID_SUBJECT=mailto:techfied.desiredrycleaning@gmail.com
   ```
4. Click **Deploy** → watch the build logs. A successful start shows
   `DDC API started` with the port number.
5. In the service's **Settings** → **Networking**, click **Generate Domain** (get a
   `*.up.railway.app` URL first). Test the health endpoint:
   `https://<your-service>.up.railway.app/healthz` → should return `{"ok":true,"service":"ddc-api"}`.
6. Still in **Settings → Networking**, click **Add Custom Domain** →
   enter `api.desiredrycleaning.in`. Railway shows you a CNAME record.
7. At your DNS registrar add that CNAME. Wait for propagation (usually < 5 min on Cloudflare).
8. TLS auto-provisioned. Hit `https://api.desiredrycleaning.in/healthz` — should return `{"ok":true}`.
9. Seed the Atlas cluster: in your local terminal run
   `pnpm --filter @ddc/api seed` (with `MONGODB_URI` pointing at production Atlas).
10. Test an email OTP login end-to-end using the production URL.

## 22.9 Session log (living, newest first)

Claude appends one row per working session.

| Date | Session focus | Outcome | Next |
|---|---|---|---|
| 2026-09-17 | Pre-launch audit + bug fixes | Fixed: `railway.toml` healthcheck path (`/health`→`/healthz`), `RESEND_API_KEY` env var name (was `EMAIL_API_KEY`), `vercel.json` outputDirectory (`apps/*/dist`→`dist`), UPI VPA set. M11 docs rewritten for Railway. Manual work log updated to reflect actual completed items. 6 BullMQ workers committed. | Phase 8: Vercel + Railway deploy (M10/M11), DNS, seed prod Atlas |
| 2026-09-11 | Env vars audit + VAPID keys generation | Redis URL fixed; VAPID keys generated; Resend wired | Railway + Vercel deploy (M10/M11) |
| 2026-09-01 | Phase 7: deployment configs + env docs + Terms/Privacy pages | `vercel.json` (4 frontends) + `render.yaml` + `.env.example` (5 apps) + Terms/Privacy pages + sitemap.xml/robots.txt + ESLint clean across all packages | Phase 8: E2E tests, performance audit, PWA offline shell verification, accessibility pass |
| 2026-08-31 | Documentation set + 2 rounds of client answers folded in | Full `docs/` (01–22) + 11 ADRs + memory seeded; no code yet | Await user go-ahead → Phase 0 scaffold (`docs/19`, `docs/21`) |
