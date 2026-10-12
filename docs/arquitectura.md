# Arquitectura tecnica vigente

## Decision actual

AlfaCode queda como un repositorio con dos aplicaciones separadas:

- `frontend/`: frontend existente en Next.js/React. Actualmente conserva el portafolio publico.
- `backend/`: API NestJS para AlfaCode HUB.

El HUB se desarrollara sobre el stack instalado y documentado: Next.js/React en frontend, NestJS/Node en backend, TypeORM como ORM y SQLite para desarrollo. PostgreSQL queda previsto para produccion en Railway, pero esta pausado temporalmente hasta nueva autorizacion.

## Frontend

El frontend vigente conserva:

- Next.js 16.4.0 con App Router.
- React 19.3.0.
- TypeScript.
- Tailwind CSS 4.
- Turbopack con `@tailwindcss/turbopack`.
- Rutas publicas del portafolio en `frontend/src/app`.
- Componentes visuales, navegacion publica y animaciones existentes.

El portafolio publico no debe mezclarse automaticamente con las pantallas internas de AlfaCode HUB. Las interfaces internas se agregaran cuando su fase este autorizada.

## Backend

El backend vigente usa:

- Node.js.
- NestJS.
- TypeScript.
- API REST.

La API del HUB se versionara bajo `/api/v1`. Si existe un endpoint previo de salud, debe revisarse y adaptarse durante la iteracion autorizada antes de tratarlo como contrato estable.

## Persistencia prevista

- ORM: TypeORM.
- Desarrollo local: SQLite.
- Produccion futura: PostgreSQL en Railway, pausado temporalmente.
- Migraciones versionadas desde el inicio.
- `synchronize: false` en todos los entornos.

No se deben asumir dependencias de datos instaladas hasta verificarlas en `package.json` durante I-01.

## Seguridad prevista

- Autenticacion y sesiones seguras en backend.
- RBAC/autorizacion efectiva en backend.
- El frontend puede ocultar acciones, pero no debe ser la unica barrera de seguridad.
- No se almacenan secretos, `.env` ni bases SQLite en Git.
