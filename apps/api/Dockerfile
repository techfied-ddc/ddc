FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ── Install + build ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Workspace manifests first — cached layer when only source changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/config/  ./packages/config/
COPY packages/shared/  ./packages/shared/
COPY apps/api/package.json ./apps/api/package.json

# Install all workspace deps (frozen for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy API source
COPY apps/api/src        ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

# 1. Compile @ddc/shared to CommonJS so it can be required at runtime
RUN pnpm --filter @ddc/shared build

# 2. Compile the API
RUN pnpm --filter @ddc/api build

# 3. Standalone deployment dir — pnpm flattens deps, removes dev deps
RUN pnpm --filter @ddc/api deploy --prod /deploy

# ── Runtime ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Flat production node_modules from pnpm deploy
COPY --from=builder /deploy .

# Compiled API output (pnpm deploy copies source, not the build output)
COPY --from=builder /app/apps/api/dist ./dist

# Make sure the deployed @ddc/shared has its compiled dist/ available
# (pnpm deploy copies the workspace package directory; this overwrites the
# dist/ inside node_modules/@ddc/shared to be safe)
COPY --from=builder /app/packages/shared/dist ./node_modules/@ddc/shared/dist

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget -qO- http://localhost:4000/healthz || exit 1

CMD ["node", "dist/index.js"]
