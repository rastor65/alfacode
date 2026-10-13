# Versiones y verificacion tecnica — I-01

**Fecha:** 2026-10-12
**Iteracion:** I-01, tareas F0-01 a F0-04
**Alcance inicial:** inspeccion del repositorio, dependencias instaladas, scripts y endpoint actual. No se inicializaron aplicaciones nuevas.

## Entorno

| Herramienta | Version verificada | Comando |
|---|---:|---|
| Node.js | v24.16.0 | `node -v` |
| npm | 11.5.2 | `npm -v` |
| Git | 2.49.0.windows.1 | `git --version` |

Next.js declara en `frontend/node_modules/next/package.json` el requisito `node >=20.9.0`; la version local de Node cumple ese requisito.

## Gestor de paquetes

- Gestor usado: npm.
- Hay `package-lock.json` en `frontend/` y `backend/`.
- El `package.json` raiz solo coordina scripts por aplicacion.

## Frontend verificado

Ubicacion: `frontend/`

| Paquete | Version instalada |
|---|---:|
| `next` | 16.4.0 |
| `react` | 19.3.0 |
| `react-dom` | 19.3.0 |
| `typescript` | 5.9.3 |
| `tailwindcss` | 4.3.3 |
| `@tailwindcss/turbopack` | 4.3.3 |
| `eslint` | 9.39.5 |
| `eslint-config-next` | 16.4.0 |

Estructura observada:

- App Router en `frontend/src/app`.
- Rutas publicas del portafolio: `/`, `/contacto`, `/equipo`, `/investigacion`, `/proyectos`, `/proyectos/[slug]`, `/publicaciones`.
- Tailwind CSS se importa desde `frontend/src/app/globals.css`.
- Turbopack configura `@tailwindcss/turbopack` en `frontend/next.config.ts`.
- Los directorios vacios heredados bajo `frontend/src/app/app`, `frontend/src/app/api` y `frontend/src/app/login` fueron eliminados tras verificar que no contenian archivos.

Dependencias ausentes verificadas:

- No estan instalados `next-auth`, `@auth/core`, `typeorm`, `sqlite3`, `better-sqlite3` ni `pg` en `frontend/`.

## Backend verificado

Ubicacion: `backend/`

| Paquete | Version instalada |
|---|---:|
| `@nestjs/common` | 12.1.2 |
| `@nestjs/core` | 12.1.2 |
| `@nestjs/config` | 12.0.1 |
| `@nestjs/platform-express` | 12.1.2 |
| `@nestjs/typeorm` | 12.0.2 |
| `typeorm` | 0.3.31 |
| `better-sqlite3` | 12.11.1 |
| `pg` | 8.23.1 |
| `typescript` | 5.9.3 |
| `tsx` | 4.23.15 |
| `reflect-metadata` | 0.2.2 |
| `rxjs` | 7.8.2 |
| `argon2` | 0.45.1 (I-05) |
| `class-validator` | 0.15.1 (I-05) |
| `class-transformer` | 0.5.1 (I-05) |
| `helmet` | 8.3.0 (I-05) |
| `@types/express` (dev) | 5.x (I-05; Express instalado 5.2.1) |

Estructura observada:

- `backend/src/main.ts` crea una aplicacion NestJS y configura CORS por `CORS_ORIGINS`.
- `backend/src/main.ts` usa prefijo global `api/v1`.
- `backend/src/database/database.module.ts` configura TypeORM por entorno.
- `backend/src/database/data-source.ts` expone el DataSource para scripts de migracion.
- `backend/src/database/migrations/1728690000000-schema-bootstrap.ts` contiene la migracion inicial.
- `backend/src/health` contiene `HealthModule`, `HealthController` y `HealthService`.
- Endpoint real actual: `GET /api/v1/health`.
- `GET /api/health` ya no existe y responde 404.
- `backend/src/database/migrations/1728690000000-schema-bootstrap.ts` crea `schema_metadata` y registra `schema_bootstrap=initialized`.

Dependencias de persistencia:

- Instaladas `@nestjs/typeorm`, `typeorm`, `better-sqlite3` y `pg`.
- SQLite es el motor predeterminado de desarrollo con `DB_TYPE=sqlite` y `SQLITE_PATH=./data/alfacode-hub.sqlite`.
- TypeORM se ejecuta con `synchronize: false`.
- No hay modulos de negocio, autenticacion ni RBAC instalados.

## Estructura y archivos de entorno

| Elemento | Estado |
|---|---|
| `frontend/` | Existe |
| `backend/` | Existe |
| `docs/` | Existe |
| `context/` | Existe |
| `.gitignore` | Existe |
| `README.md` | Existe |
| `.editorconfig` | Existe |
| `frontend/.env.example` | Existe |
| `backend/.env.example` | Existe |

Observaciones:

- Existe `frontend/.env.local`; no se leyo su contenido para evitar exponer secretos.
- Existe `backend/data/alfacode-hub.sqlite` con tamano 0 bytes; esta bajo ruta ignorada por `.gitignore`.
- `.gitignore` excluye `.env*`, conserva `**/.env.example`, excluye `backend/data/` y archivos SQLite bajo `frontend/db/`.

## Comandos ejecutados

Las primeras verificaciones registran el estado encontrado durante I-01. Las verificaciones posteriores registran los cambios autorizados despues de I-01.

| Comando | Resultado |
|---|---|
| `git status --short` | Worktree con muchos cambios previos por separacion frontend/backend y limpieza de logica/base de datos |
| `node -v` | `v24.16.0` |
| `npm -v` | `11.5.2` |
| `git --version` | `git version 2.49.0.windows.1` |
| `npm --prefix frontend ls next react react-dom tailwindcss @tailwindcss/turbopack typescript eslint eslint-config-next --depth=0` | Versiones listadas correctamente |
| `npm --prefix backend ls @nestjs/common @nestjs/core @nestjs/config @nestjs/platform-express typescript tsx reflect-metadata rxjs --depth=0` | Versiones listadas correctamente |
| `npm --prefix backend ls typeorm sqlite3 better-sqlite3 pg --depth=0` | Estado inicial: `(empty)`, exit code 1 esperado por paquetes ausentes |
| `npm --prefix frontend ls next-auth @auth/core typeorm sqlite3 better-sqlite3 pg --depth=0` | `(empty)`, exit code 1 esperado por paquetes ausentes |
| `npm --prefix frontend run lint` | OK, exit code 0 |
| `npm --prefix frontend run build` | OK, exit code 0; Next.js genero 16 paginas estaticas |
| `npm --prefix backend run typecheck` | OK, exit code 0 |
| `npm --prefix backend run build` | OK, exit code 0 |
| `npm --prefix backend run start` | Estado inicial: OK; NestJS arranco y mapeo `GET /api/health` |
| `Invoke-WebRequest http://localhost:4000/api/health` | Estado inicial: 200 con `{"status":"ok","service":"alfacode-hub-api",...}` |
| `Invoke-WebRequest http://localhost:4000/api/v1/health` | Estado inicial: 404; endpoint pendiente de adaptar |
| `npm --prefix backend install @nestjs/typeorm@12.0.2 typeorm@^0.3 better-sqlite3 pg` | OK; npm reporto 0 vulnerabilidades |
| `npm --prefix backend ls @nestjs/typeorm typeorm better-sqlite3 pg --depth=0` | OK; `@nestjs/typeorm@12.0.2`, `typeorm@0.3.31`, `better-sqlite3@12.11.1`, `pg@8.23.1` |
| `npm --prefix backend run typecheck` | OK despues de instalar dependencias y cambiar prefijo |
| `npm --prefix backend run build` | OK despues de instalar dependencias y cambiar prefijo |
| `npm --prefix frontend run lint` | OK despues de eliminar directorios vacios |
| `npm --prefix frontend run build` | OK despues de eliminar directorios vacios |
| `Invoke-WebRequest http://localhost:4000/api/v1/health` | 200 con `{"status":"ok","service":"alfacode-hub-api",...}` |
| `Invoke-WebRequest http://localhost:4000/api/health` | 404 despues de mover el prefijo a `/api/v1` |
| `npm --prefix backend run typecheck` | OK despues de configurar TypeORM con SQLite |
| `npm --prefix backend run build` | OK despues de configurar TypeORM con SQLite |
| `npm --prefix frontend run lint` | OK despues de configurar SQLite en backend |
| `npm --prefix frontend run build` | OK despues de configurar SQLite en backend |
| `npm --prefix backend run start` | OK; TypeOrmCoreModule inicializo correctamente |
| `Invoke-WebRequest http://localhost:4000/api/v1/health` | 200 con `{"status":"ok","service":"alfacode-hub-api","database":"ok",...}` |
| `npm --prefix backend run migration:show` | Estado inicial: `Pending migrations: true` |
| `npm --prefix backend run migration:run` | OK; ejecuto `SchemaBootstrap1728690000000` |
| `npm --prefix backend run migration:show` | OK; `Pending migrations: false` |
| `npm --prefix backend run migration:revert` | OK; revirtio la ultima migracion |
| `npm --prefix backend run migration:run` | OK; dejo aplicada nuevamente `SchemaBootstrap1728690000000` |
| Consulta directa SQLite | OK; tablas `migrations`, `schema_metadata`, `sqlite_sequence`; registro `schema_bootstrap=initialized` |

## Pendientes detectados

1. Definir estrategia concreta de autenticacion y RBAC antes de Fase 1.
2. Corregir mojibake/encoding visible en varios documentos si se autoriza una normalizacion de codificacion completa.
3. Retomar PostgreSQL solo cuando el responsable lo autorice.

## Estado de I-01

I-01 queda implementada y verificada tecnicamente para su alcance de inspeccion. No se marca aprobada por el responsable.

## Verificacion tecnica - I-02

**Fecha:** 2026-10-12
**Iteracion:** I-02, cierre de pendientes de Fase 0 sobre SQLite
**Alcance:** comunicacion frontend -> backend sin alterar el portafolio publico; PostgreSQL permanece pausado.

Cambios verificados:

- `frontend/next.config.ts` configura rewrite de `/api/v1/:path*` hacia `API_PROXY_TARGET` con valor predeterminado `http://localhost:4000`.
- `frontend/.env.example` documenta `NEXT_PUBLIC_API_URL=/api/v1` y `API_PROXY_TARGET=http://localhost:4000`.
- `frontend/src/app/system/health/page.tsx` agrega una pagina tecnica no enlazada que consulta `/api/v1/health`.
- `backend/src/health/health.controller.ts` y `backend/src/health/health.service.ts` usan inyeccion explicita para funcionar correctamente en `tsx watch`.
- `frontend/AGENTS.md` fue generado por `next dev` dentro del paquete `frontend/`, siguiendo las reglas de Next.js 16.

Comandos ejecutados durante I-02:

| Comando | Resultado |
|---|---|
| `npm --prefix frontend run lint` | OK |
| `npm --prefix frontend run build` | OK; Next.js compilo y registro `/system/health` como ruta dinamica |
| `npm --prefix backend run typecheck` | OK antes y despues de corregir inyeccion |
| `npm --prefix backend run build` | OK antes y despues de corregir inyeccion |
| `npm --prefix backend run migration:show` | OK; `Pending migrations: false` |
| `npm --prefix backend run start:dev` | OK; NestJS mapeo `GET /api/v1/health` |
| `npm --prefix frontend run dev` | OK; Next.js sirvio `http://localhost:3000` y genero `frontend/AGENTS.md` |
| `Invoke-WebRequest http://localhost:4000/api/v1/health` | OK; 200 con `status: "ok"`, `service: "alfacode-hub-api"` y `database: "ok"` |
| `Invoke-WebRequest http://localhost:3000/api/v1/health` | OK; 200 via rewrite de Next.js hacia backend |
| `Invoke-WebRequest http://localhost:3000/system/health` | OK; 200 y HTML con `Disponible` y `alfacode-hub-api` |

Incidencia corregida:

- Durante la primera prueba runtime, `GET /api/v1/health` devolvio 500 porque `tsx watch` no estaba resolviendo la inyeccion implicita del controlador. Se corrigio con `@Inject(HealthService)` y `@InjectDataSource()`.

Estado de I-02:

I-02 queda implementada y verificada tecnicamente para SQLite. No se marca aprobada por el responsable. PostgreSQL sigue pausado.

## Verificacion tecnica - I-03

**Fecha:** 2026-10-12
**Iteracion:** I-03, calidad y cierre tecnico de Fase 0 sobre SQLite
**Alcance:** comandos reproducibles desde la raiz, smoke automatizado de health/API/proxy y documentacion de arranque.

Cambios verificados:

- `package.json` raiz agrega `verify`, `smoke:health`, `check` y `backend:migration:show`.
- `scripts/smoke-health.mjs` levanta backend y frontend, espera los endpoints, valida health directo, proxy de Next.js y pagina tecnica, y apaga procesos al finalizar.
- `README.md` documenta los comandos de verificacion de Fase 0.

Comandos ejecutados durante I-03:

| Comando | Resultado |
|---|---|
| `npm run verify` | OK; frontend lint/build, backend typecheck/build y `migration:show` con `Pending migrations: false` |
| `npm run smoke:health` | Primer intento fallo por `spawn EINVAL` en Windows; se corrigio el runner |
| `npm run smoke:health` | OK; `Backend health`, `Next.js API proxy` y `Frontend technical health page` |
| `npm run check` | OK; ejecuta `verify` + `smoke:health` |
| Comprobacion HTTP posterior | OK; backend y frontend quedaron detenidos tras el smoke |

Estado de I-03:

I-03 queda implementada y verificada tecnicamente para SQLite. No se marca aprobada por el responsable. PostgreSQL sigue pausado. Fase 0 queda lista para revision/aprobacion del responsable antes de iniciar Fase 1.
