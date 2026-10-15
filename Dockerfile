# ==============================================================================
# AlfaCode HUB - Backend Production Dockerfile (NestJS + SQLite)
# Optimized for Koyeb / Container Cloud deployment
# ==============================================================================

# ------------------------------------------------------------------------------
# Fase 1: Builder (compilación de TypeScript y módulos nativos)
# ------------------------------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Instalar herramientas para compilar módulos nativos (better-sqlite3, argon2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar manifiesto de dependencias del backend
COPY backend/package*.json ./

# Instalar dependencias limpias
RUN npm ci

# Copiar código fuente y configuración de compilación
COPY backend/tsconfig*.json ./
COPY backend/src ./src

# Compilar NestJS a JavaScript en dist/
RUN npm run build

# Descartar dependencias de desarrollo conservando binarios nativos compilados
RUN npm prune --production

# ------------------------------------------------------------------------------
# Fase 2: Runner de producción (imagen ligera)
# ------------------------------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV SQLITE_PATH=/app/data/alfacode-hub.sqlite

# Copiar artefactos de compilación y dependencias de producción
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copiar script de arranque
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Crear directorio de persistencia para SQLite
RUN mkdir -p /app/data

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
