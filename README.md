# AlfaCode

Portafolio publico y AlfaCode HUB, construidos con Next.js, React, TypeScript y Tailwind CSS, con API NestJS.

## Estructura

```text
frontend/   # Portafolio publico y HUB privado Next.js
backend/    # API NestJS para AlfaCode HUB
docs/       # Documentacion tecnica
context/    # Estado operativo e instrucciones para agentes
AGENTS.md   # Instrucciones para agentes
```

## Estado Actual

- El frontend conserva el portafolio publico y ofrece las vistas privadas bajo `/hub`.
- Fases 0 a 2 aprobadas en desarrollo local (PostgreSQL diferido); investigacion I-14 y documentos I-15 aprobados. I-17 implementa produccion academica con los pendientes de I-16 registrados (DEC-033): ver [tarea actual](context/tarea-actual.md). No se declara cerrada integralmente la Fase 3.
- El contenido del portafolio vive en archivos TypeScript estaticos.
- El backend expone API REST bajo `/api/v1` para identidad, integrantes, proyectos, tareas, sprints, investigacion, documentos, productos academicos y reconocimientos, con permisos en servidor.

## Stack

- Frontend: Next.js 16.4.0, React 19.3.0, TypeScript, Tailwind CSS 4, Turbopack.
- Backend base: Node.js, NestJS, TypeScript, API REST.
- Persistencia: TypeORM con SQLite en desarrollo. PostgreSQL queda previsto para produccion/Railway, pero esta pausado temporalmente.
- Seguridad: autenticacion, sesiones revocables, CSRF y RBAC aplicados en backend.
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

Verificacion aislada de conexion frontend -> backend:

```bash
http://localhost:3000/system/health
http://localhost:3000/api/v1/health
```

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
npm run backend:migration:show
npm run verify
npm run smoke:health
npm run check
npm run e2e
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
npm run migration:show
npm run migration:run
npm run migration:revert
```

Verificacion de Fase 0 desde la raiz:

```bash
npm run verify       # lint/build/typecheck y migraciones pendientes
npm run smoke:health # levanta frontend/backend, prueba health y apaga procesos
npm run check        # ejecuta verify + smoke:health
```

## Variables De Entorno

Frontend: copiar `frontend/.env.example` a `frontend/.env.local`.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api/v1
API_PROXY_TARGET=http://localhost:4000
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

## Verificacion del HUB

`npm run e2e` compila backend y frontend, usa SQLite, correo outbox y archivos temporales, y prueba la API y paginas renderizadas en puertos 4100/3100. Comprueba migraciones, permisos, investigacion, documentos, productos/autorías/reconocimientos, cargas por proxy, persistencia tras reinicio e integridad de datos y archivos; elimina sus temporales al terminar. Requiere esos puertos libres y no sustituye la prueba de interaccion en navegador.

Documentos: almacenamiento local solo para desarrollo; en produccion el modulo queda deshabilitado hasta elegir un proveedor privado. PostgreSQL y almacenamiento externo siguen pendientes de validacion antes de uso real. Consultar [estado actual](context/estado-actual.md) y [decisiones](docs/decisiones.md).
