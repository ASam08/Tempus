# ---- Base ----
FROM node:22.14.0-alpine AS base
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- Runner ----
FROM node:22.14.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy migrations and migration script
COPY --from=builder --chown=nextjs:nodejs /db/migrations ./db/migrations
COPY --from=builder --chown=nextjs:nodejs /db/migrate.ts ./db/migrate.ts

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node --import tsx/esm db/migrate.ts && node server.js"]