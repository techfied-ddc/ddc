FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ── Install phase ──────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Workspace root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# All workspace package.json files — pnpm needs every member's manifest
# to resolve the lockfile correctly (even apps we won't build)
COPY packages/config/        ./packages/config/
COPY packages/shared/        ./packages/shared/
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/api/package.json          ./apps/api/package.json
COPY apps/web-website/package.json  ./apps/web-website/package.json
COPY apps/web-user/package.json     ./apps/web-user/package.json
COPY apps/web-store/package.json    ./apps/web-store/package.json
COPY apps/web-admin/package.json    ./apps/web-admin/package.json
COPY e2e/package.json               ./e2e/package.json

# Install all workspace deps (frozen = deterministic, matches lockfile exactly)
RUN pnpm install --frozen-lockfile

# ── Build phase ────────────────────────────────────────────────────────────────
# Copy API source (only — frontend source excluded via .dockerignore)
COPY apps/api/src         ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

# 1. Compile @ddc/shared to CommonJS — required at runtime by the API
RUN pnpm --filter @ddc/shared build

# 2. Compile the API
RUN pnpm --filter @ddc/api build

# 3. Create a self-contained deployment dir with production deps only
#    pnpm deploy flattens the node_modules — no symlinks, no workspace overhead
RUN pnpm --filter @ddc/api deploy --prod /deploy

# ── Runtime ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Flat production node_modules from pnpm deploy (no dev deps, no source)
COPY --from=builder /deploy .

# Freshly compiled dist/ (pnpm deploy copies the package, not its build output)
COPY --from=builder /app/apps/api/dist ./dist

# Ensure @ddc/shared has its compiled dist/ inside node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@ddc/shared/dist

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget -qO- http://localhost:4000/healthz || exit 1

CMD ["node", "dist/index.js"]
