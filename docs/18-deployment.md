# 18 — Deployment & Infrastructure

## 18.1 Recommended topology (default)

| Component | Service | Domain |
|---|---|---|
| `web-website` | Vercel project | `desiredrycleaning.in`, `www.` → apex |
| `web-user` | Vercel project | `user.desiredrycleaning.in` |
| `web-store` | Vercel project | `store.desiredrycleaning.in` |
| `web-admin` | Vercel project | `admin.desiredrycleaning.in` |
| `api` | Railway Web Service (Node) | `api.desiredrycleaning.in` |
| Database | MongoDB Atlas (M10+ prod, M0/M2 dev) | — (Mumbai `ap-south-1` region) |
| Redis | Upstash Redis (global/`ap-south-1`) | — |
| Media | Cloudinary | `res.cloudinary.com/<cloud>` |
| Email OTP (login — core) | Resend (resend.com) | — |
| Payments | UPI Link (launch) / Razorpay Route (later) | webhook → `api.` |
| Error tracking | Sentry | — |

Rationale in ADR-0008. All four frontends are static Vite builds behind a CDN; the API is a
single always-on stateless Node service that scales horizontally.

### DNS (registrar for `desiredrycleaning.in`)
- `A`/`ALIAS` apex → Vercel; `CNAME www` → Vercel.
- `CNAME user`, `store`, `admin` → Vercel (each project adds its domain).
- `CNAME api` → Railway service URL (shown in Railway → Settings → Networking).
- `MX` / `TXT` for email later (`support@desiredrycleaning.in`, SPF/DKIM/DMARC).
- TLS auto-managed by Vercel and Railway.

### Cookie / CORS across subdomains
- `COOKIE_DOMAIN=.desiredrycleaning.in`, `COOKIE_SECURE=true`, `SameSite=Lax`.
- `CORS_ORIGINS` = the four `https://` frontend origins, `credentials: true`.
- Google OAuth authorised redirect URI: `https://api.desiredrycleaning.in/api/v1/auth/google/callback`;
  authorised JS origins: the four frontends + api.

## 18.2 Environments

| Env | Frontends | API | DB | Purpose |
|---|---|---|---|---|
| **Preview** | Vercel per-PR URLs | Railway PR preview | Atlas dev cluster, DB `ddc_pr_<n>` | Review a PR |
| **Staging** | Vercel (staging alias / `*.stg.desiredrycleaning.in`) | Railway staging service | Atlas dev cluster, DB `ddc_staging` | Pre-prod, E2E target |
| **Production** | Vercel production domains | Railway production service | Atlas prod cluster, DB `ddc` | Live |

Config strictly via env vars per service (see `.env.example`). No environment branching in
code beyond `NODE_ENV`.

## 18.3 Build & release

- **Vercel config:** each frontend has `apps/web-*/vercel.json` with build command, output
  dir, SPA rewrite, security headers, and immutable cache on `/assets/*`. PWA apps also set
  `Cache-Control: no-cache` + `Service-Worker-Allowed` on `sw.js`. Connect each Vercel
  project to the monorepo root; Vercel reads the `vercel.json` from the app directory.
- **Railway config:** `apps/api/railway.toml` at the API root declares the `ddc-api` service
  using Nixpacks (zero-config Node.js). Connect the GitHub repo in the Railway dashboard,
  select the monorepo root, and Railway uses the toml automatically. Health check path
  `/health`. All secrets are set via Railway → Variables tab (never commit them).

  > **Updated:** The project has switched to Railway (railway.app) for backend hosting.
  > Railway offers $5 free credit/month, no cold-start on free tier, and zero-config Node.js deploys.
  > The `apps/api/railway.toml` file contains the deployment configuration.
  > Render remains documented below as an alternative.

- **Render config (alternative):** `render.yaml` at repo root declares the `ddc-api` web service (Node,
  Singapore region). Set `autoDeploy: false` — deploy manually after confirming staging is
  green. Health check path `/health`. All secrets are `sync: false` (set manually in the
  Render dashboard).
- **Env var templates:** each app has `.env.example`. See also root `.env.example` for the
  full annotated reference. Production values go in Vercel / Render project settings.
- **Pipeline** (doc 16 §16.6): PR → previews; merge to `main` → deploy staging + E2E;
  tag `v*` or manual "Promote to Production".
- **DB migrations**: `migrate-mongo` scripts run as a Railway **pre-deploy command** (or a
  one-off job) before the new API boots. Forward + rollback for every migration. Never
  destructive without a fresh snapshot + sign-off.
- **Rollback**: Vercel — promote previous deployment. Railway — redeploy previous image.
  DB — apply the `down` migration or restore from PITR (last resort).
- Sentry release created per deploy with source maps uploaded; frontends send
  `VITE_SENTRY_DSN`, API sends `SENTRY_DSN`.
- **Pipeline** (doc 16 §16.6): PR → previews; merge to `main` → deploy staging + E2E;
  tag `v*` or manual "Promote to Production".
- **DB migrations**: `migrate-mongo` scripts run as a Railway **pre-deploy command** (or a
  one-off job) before the new API boots. Forward + rollback for every migration. Never
  destructive without a fresh snapshot + sign-off.
- **Rollback**: Vercel — promote previous deployment. Railway — redeploy previous image.
  DB — apply the `down` migration or restore from PITR (last resort).
- Sentry release created per deploy with source maps uploaded; frontends send
  `VITE_SENTRY_DSN`, API sends `SENTRY_DSN`.

## 18.4 Secrets management

- Stored in Vercel/Render project env settings + Atlas/Upstash/Cloudinary dashboards.
- Never in the repo. `.env.example` lists every key with a description.
- Rotate on staff change or suspected leak: JWT secrets, payment gateway keys
  (`RAZORPAY_*` / `CASHFREE_*`), payout/Route credentials, `RESEND_API_KEY`,
  `GOOGLE_CLIENT_SECRET`, `CLOUDINARY_API_SECRET`, `*_WEBHOOK_SECRET`, VAPID keys.
- Least-privilege: Atlas DB user scoped to the one DB; `OPENCAGE_API_KEY` restricted via
  API key settings at opencagedata.com; Cloudinary unsigned uploads disabled.

## 18.5 Scaling notes

- API is stateless → add instances. **Socket.IO must use the Redis adapter** in prod so
  rooms work across instances.
- BullMQ workers run in the same service (concurrency-limited) for v1; split into a
  dedicated Railway worker service when volume grows.
- Mongo: right-size the Atlas tier; enable autoscaling; watch slow-query log; every list
  query has an index (doc 04).
- CDN handles frontend traffic; API caches catalog/meta responses briefly.

## 18.6 Backups & DR

- Atlas: continuous backups + PITR ≥ 7 days on prod; daily snapshot retained 30 days.
- **Test restores** quarterly into a scratch cluster; document the runbook.
- Cloudinary assets: enable backup/versioning or a periodic export of the private folder.
- Config/IaC: keep Vercel/Railway settings documented in this repo (`infra/README.md` as it
  grows); export env var *names* (not values) to a checked-in template.
- RPO ≤ 1h (PITR), RTO ≤ 4h (documented restore).

## 18.7 Alternative: single VPS (documented, not default)

For lowest cost / full control (e.g. Hetzner CPX, DigitalOcean, AWS Lightsail):

- One Ubuntu box, **Docker Compose**: `api` (Node), `mongo` (or keep Atlas), `redis`,
  `caddy`/`nginx` reverse proxy with automatic TLS.
- Build the 4 frontends in CI, serve their `dist/` as static sites via the same proxy on
  the respective subdomains.
- `pm2` or Docker restart policies for the API; nightly `mongodump` to object storage;
  Watchtower or a deploy script for updates.
- Trade-off: you own OS patching, TLS renewal monitoring, scaling, and backups. Fine for a
  single-region launch; revisit when multi-region or higher availability is needed.

## 18.8 Pre-launch checklist

- [ ] All four domains + `api.` resolve with valid TLS.
- [ ] Google OAuth consent screen verified (project owned by `techfied.desiredrycleaning@gmail.com`);
      redirect URIs + JS origins set for prod.
- [ ] **UPI VPA**: set `UPI_VPA` (e.g. `business@paytm`) and `UPI_DISPLAY_NAME` in env vars.
      Razorpay / Cashfree can be wired later for automated payment confirmation.
- [ ] **Resend**: sign up at resend.com, create API key → `RESEND_API_KEY`; domain-verify
      `desiredrycleaning.in` for production email OTP delivery; test a live OTP end-to-end.
      (MSG91 / DLT registration is no longer required for launch.)
- [ ] `settings` doc seeded: business info + **GSTIN**, GST %, **default commission %**,
      **payout cadence**, COD on.
- [ ] Per-store: commission %, SLA/TAT, GST, service-area pincodes, pickup-slot windows set.
- [ ] First payout run generated + approved on staging (dry run); reconcile checked.
- [ ] OpenCage API key (optional for geocoding): sign up at opencagedata.com, free tier 2,500 req/day → `OPENCAGE_API_KEY`.
- [ ] Atlas prod cluster in `ap-south-1`, backups on, IP access list set, scoped DB user.
- [ ] Redis (prod) provisioned; Socket.IO Redis adapter enabled.
- [ ] VAPID keys set; push tested on installed PWAs (Android + desktop).
- [ ] Email provider domain-authenticated (SPF/DKIM/DMARC) for `desiredrycleaning.in`.
- [ ] Sentry projects live with source maps; uptime checks on `/healthz` + a synthetic flow.
- [ ] Seed a first real store + approve it; verify routing for launch pincodes.
- [ ] Legal pages (T&C, privacy) published; analytics consent gate working.
- [ ] Backup restore rehearsed; runbooks in `docs/`.
