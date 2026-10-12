# AlfaCode

Portafolio publico de AlfaCode construido con Next.js, React, TypeScript y Tailwind CSS.

## Estructura

```text
frontend/   # Portafolio publico Next.js
backend/    # API NestJS para AlfaCode HUB
docs/       # Documentacion tecnica
context/    # Estado operativo e instrucciones para agentes
AGENTS.md   # Instrucciones para agentes
```

## Estado Actual

- El frontend conserva solo el portafolio publico, su navegacion y sus animaciones.
- Las rutas internas, login, auth, RBAC, repositorios, scripts de base de datos y migraciones se implementaran nuevamente por fases autorizadas.
- El contenido del portafolio vive en archivos TypeScript estaticos.
- El backend actual debe inspeccionarse antes de asumir contratos estables; el HUB usara API REST versionada bajo `/api/v1`.

## Stack

- Frontend: Next.js 16.4.0, React 19.3.0, TypeScript, Tailwind CSS 4, Turbopack.
- Backend base: Node.js, NestJS, TypeScript, API REST.
- Persistencia: TypeORM con SQLite en desarrollo. PostgreSQL queda previsto para produccion/Railway, pero esta pausado temporalmente.
- Seguridad prevista: autenticacion, sesiones y RBAC aplicados en backend.
- Gestor de paquetes: npm.

## Desarrollo Local

Desde la raiz:

```bash
npm run frontend:dev
npm run backend:dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:3000`.

Backend:

```bash
cd backend
npm install
npm run start:dev
```

Abrir `http://localhost:4000/api/v1/health`.

## Scripts

Raiz:

```bash
npm run frontend:dev
npm run frontend:build
npm run frontend:lint
npm run backend:dev
npm run backend:build
npm run backend:typecheck
```

Frontend, desde `frontend/`:

```bash
npm run dev
npm run lint
npm run build
npm run start
```

Backend, desde `backend/`:

```bash
npm run start:dev
npm run build
npm run typecheck
```

## Variables De Entorno

Frontend: copiar `frontend/.env.example` a `frontend/.env.local`.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Backend: copiar `backend/.env.example` a `backend/.env.local`.

```bash
NODE_ENV=development
BACKEND_PORT=4000
CORS_ORIGINS=http://localhost:3000
DB_TYPE=sqlite
SQLITE_PATH=./data/alfacode-hub.sqlite
# DATABASE_URL=postgresql://usuario:clave@host:5432/base # futuro, cuando se retome PostgreSQL
```

## Reinicio Del Sistema

La logica de sistema se desarrollara desde cero en fases posteriores sobre el stack vigente. No se deben asumir dependencias de datos, autenticacion o RBAC instaladas hasta que I-01 las verifique y registre.
