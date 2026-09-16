# syntax=docker/dockerfile:1

# Les étapes build et deps tournent sur la plateforme du builder ($BUILDPLATFORM) :
# leur résultat est du JavaScript pur (aucune dépendance native côté serveur), donc
# réutilisable tel quel dans l'image finale amd64 comme arm64, sans émulation QEMU.

# ---- Build : compile le front (web/dist) et le serveur (server/dist) ----
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci

COPY . .
RUN npm run build

# ---- Dépendances de production du serveur uniquement ----
FROM --platform=$BUILDPLATFORM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci --omit=dev --workspace server --include-workspace-root=false \
  && npm cache clean --force \
  && mkdir -p /data

# ---- Image finale (aucun RUN : pas d'émulation nécessaire en multi-arch) ----
FROM node:24-alpine
ENV NODE_ENV=production \
  PORT=3000 \
  POLL_INTERVAL_MINUTES=5 \
  DATA_FILE=/data/subscriptions.json \
  WEB_DIST_DIR=/app/web/dist

WORKDIR /app/server

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/server/package.json ./package.json
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/web/dist /app/web/dist

# /data appartient à l'utilisateur non-root `node` (uid 1000) : un volume nommé en hérite.
COPY --from=deps --chown=node:node /data /data
VOLUME /data
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/main.js"]
