# syntax=docker/dockerfile:1

# ── Stage 1: build TypeScript and compile native modules ──────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Build toolchain required by better-sqlite3's native bindings on Alpine (musl).
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build \
    && npm prune --omit=dev

# ── Stage 2: minimal runtime image ────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# wget is used only by the HEALTHCHECK below.
RUN apk add --no-cache wget

# `node` user (uid 1000) ships with the base image — we just chown the copies.
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Mount the directory containing `millennium-falcon.json` + the SQLite DB at /data.
ENTRYPOINT ["node", "dist/server.js"]
CMD ["/data/millennium-falcon.json"]
