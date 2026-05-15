# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json drizzle.config.ts ./
COPY src ./src

RUN npm run build

# Prune dev deps
RUN npm prune --production


# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -S pulse && adduser -S pulse -G pulse

WORKDIR /app

# Copy built artifacts and production deps only
COPY --from=builder --chown=pulse:pulse /app/dist        ./dist
COPY --from=builder --chown=pulse:pulse /app/node_modules ./node_modules
COPY --from=builder --chown=pulse:pulse /app/package.json ./package.json

# Copy migration files
COPY --chown=pulse:pulse src/db/migrations ./dist/db/migrations

USER pulse

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/health/live || exit 1

EXPOSE 3000

CMD ["node", "dist/index.js"]
