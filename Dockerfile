FROM node:22-alpine AS base

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy the monorepo structure
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (only for API and shared to save time)
RUN pnpm install --filter @jejakhijau/api... --frozen-lockfile

# Copy the rest of the source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Generate Prisma Client
RUN cd apps/api && pnpm db:generate

# Build the API
RUN pnpm --filter @jejakhijau/api build

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

# Start the API server
CMD ["pnpm", "--filter", "@jejakhijau/api", "run", "start:prod"]
