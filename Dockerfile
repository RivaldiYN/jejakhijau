FROM node:22-bookworm-slim AS base

# Install OpenSSL for Prisma compatibility
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy the monorepo structure (package manifests only, for layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies for API and its workspace dependencies
RUN pnpm install --filter @jejakhijau/api... --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Generate Prisma Client (baked into image — no network needed at runtime)
RUN cd apps/api && pnpm db:generate

# Build TypeScript → dist/
RUN pnpm --filter @jejakhijau/api build

# ── Runtime ─────────────────────────────────────────────────────────────────
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

# Jalankan `prisma migrate deploy` lalu start server.
# prisma CLI tersedia di node_modules karena install --filter tidak exclude devDeps.
WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
