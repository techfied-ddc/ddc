# ADR-0008 — Hosting: Vercel (frontends) + Render (API) + MongoDB Atlas + Upstash + Cloudinary

- **Status:** accepted (client asked the team to recommend a default)
- **Date:** 2026-08-31
- **Deciders:** dev (client deferred)

## Context

Four static Vite frontends on subdomains, one always-on stateless Node/Express API with
Socket.IO and background jobs, MongoDB Atlas (already chosen), Redis for
jobs/rate-limit/socket-adapter, and image storage. Single-region launch (India). The client
wants low operational burden and a clear default.

## Decision

| Concern | Choice |
|---|---|
| Frontends | **Vercel**, one project per app, subdomain per app, CDN + preview deploys |
| API | **Render** Web Service (Node), autoscale, health check `/healthz`, `api.` subdomain |
| Database | **MongoDB Atlas** (`ap-south-1` / Mumbai), M10+ prod |
| Redis | **Upstash** Redis |
| Media | **Cloudinary** (signed uploads, transforms) |
| Errors | **Sentry** (API + each frontend) |

DB migrations run as a Render pre-deploy step. Socket.IO uses the Redis adapter in prod.

## Alternatives considered

- **Everything on Vercel** (API as serverless functions) — Socket.IO / long-lived
  connections and always-on BullMQ workers don't fit serverless well; would need a separate
  worker + a managed realtime service. Rejected for the API; Vercel stays for frontends.
- **Single VPS (Hetzner/DigitalOcean) + Docker Compose + Caddy** — cheapest, full control,
  but we own OS patching, TLS monitoring, scaling, backups. **Documented as the alternative**
  in doc 18 §18.7; sensible if cost is the priority for a single-region pilot.
- **AWS (ECS/Beanstalk + CloudFront + S3)** — most flexible/scalable, most setup and
  DevOps. Overkill for launch; revisit at multi-region scale.
- **Railway instead of Render** — comparable; Render chosen for its straightforward
  always-on web service + pre-deploy hooks. Swappable.

## Consequences

- Managed TLS, previews, and CDN with little ops work; each Vercel project needs a Root
  Directory + filtered build config.
- Redis becomes a hard prod dependency (socket adapter + jobs) — acceptable, already needed.
- Vendor spread (Vercel/Render/Atlas/Upstash/Cloudinary/Sentry) — mitigated by keeping the
  API portable (plain Node, no platform lock-in) so a move to a VPS/AWS is a redeploy, not a
  rewrite.
- Costs scale with usage; revisit hosting at material traffic or multi-region needs.
