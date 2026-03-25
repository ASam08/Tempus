# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production

COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY ./db/init.sql /docker-entrypoint-initdb.d/init.sql


EXPOSE 3000
CMD ["pnpm", "start"]
