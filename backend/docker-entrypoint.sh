#!/bin/sh
set -e

echo "=== AlfaCode HUB Backend (NestJS) ==="

# 1. Ejecutar migraciones versionadas
echo "-> Ejecutando migraciones de base de datos..."
node dist/database/run-migrations.js run

# 2. Sembrar roles institucionales
echo "-> Sembrando roles institucionales..."
node dist/database/run-seeds.js

# 3. Bootstrap de administrador inicial si se configuraron variables de entorno
if [ -n "$BOOTSTRAP_ADMIN_EMAIL" ] && [ -n "$BOOTSTRAP_ADMIN_PASSWORD" ]; then
  echo "-> Comprobando primer administrador ($BOOTSTRAP_ADMIN_EMAIL)..."
  node dist/database/run-bootstrap-admin.js || true
fi

# 4. Arrancar la aplicacion NestJS
PORT="${PORT:-4000}"
echo "-> Iniciando servidor HTTP en puerto $PORT..."
exec node dist/main.js
