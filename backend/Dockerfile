# ==============================================================================
# AlfaCode HUB - Backend Production Dockerfile (Subdirectorio backend/)
# ==============================================================================

FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build
RUN npm prune --production

FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV SQLITE_PATH=/app/data/alfacode-hub.sqlite

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

RUN mkdir -p /app/data

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
