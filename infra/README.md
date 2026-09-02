# DDC Infrastructure

## Production topology

| Service | Provider | Plan | URL |
|---|---|---|---|
| API | Render (Web Service) | Starter+ | `api.desiredrycleaning.in` |
| web-website | Vercel | Hobby/Pro | `desiredrycleaning.in` |
| web-user | Vercel | Hobby/Pro | `user.desiredrycleaning.in` |
| web-store | Vercel | Hobby/Pro | `store.desiredrycleaning.in` |
| web-admin | Vercel | Hobby/Pro | `admin.desiredrycleaning.in` |
| Database | MongoDB Atlas | M10 | Atlas cluster |
| Cache / queues | Upstash Redis | Pay-as-you-go | Upstash dashboard |
| Media | Cloudinary | Free tier → Growth | Cloudinary console |
| SMS | MSG91 | Pay-per-SMS | MSG91 dashboard |
| Email | SendGrid | Free tier | SendGrid dashboard |

## Local development

Prerequisites: Node 20, pnpm 9, Docker (for Mongo + Redis).

```bash
# Start local services
docker compose up -d

# Copy and fill env
cp .env.example apps/api/.env

# Install and run all apps
pnpm install
pnpm dev
```

Ports:
- API:        http://localhost:4000
- web-website:http://localhost:3000
- web-user:   http://localhost:3001
- web-store:  http://localhost:3002
- web-admin:  http://localhost:3003

## Render deploy (API)

1. Create a new Web Service on Render, connect the GitHub repo.
2. Build command: `pnpm install --frozen-lockfile && pnpm --filter api build`
3. Start command: `node apps/api/dist/index.js`
4. Set all env vars from `.env.example`.
5. Add a deploy hook URL to `RENDER_DEPLOY_HOOK_STAGING` in GitHub secrets.

## Vercel deploy (frontends)

Each frontend is a separate Vercel project pointing to the monorepo root.

| Project | Root directory | Build command | Output directory |
|---|---|---|---|
| web-website | apps/web-website | `pnpm --filter web-website build` | `dist` |
| web-user | apps/web-user | `pnpm --filter web-user build` | `dist` |
| web-store | apps/web-store | `pnpm --filter web-store build` | `dist` |
| web-admin | apps/web-admin | `pnpm --filter web-admin build` | `dist` |

Set `VITE_API_URL=https://api.desiredrycleaning.in` in each Vercel project's env vars.

## DNS

All 5 subdomains should have CNAME records pointing to Vercel/Render as instructed by each platform after project creation.
