# Estado actual del proyecto — AlfaCode HUB

**Actualizado:** 12 de octubre de 2026
**Situacion:** base tecnica ajustada tras I-01; repositorio separado en frontend y backend; stack vigente verificado; PostgreSQL pausado temporalmente.

## Estado comprobado

| Area | Estado | Evidencia |
|---|---|---|
| Repositorio | Verificado | Existen `frontend/`, `backend/`, `docs/`, `context/`, `.gitignore`, `.editorconfig` y `README.md` |
| Frontend | Verificado | Next.js 16.4.0, React 19.3.0, TypeScript 5.9.3, Tailwind CSS 4.3.3 y `@tailwindcss/turbopack` 4.3.3; lint y build OK |
| Backend | Verificado | NestJS 12.1.2, TypeScript 5.9.3; typecheck y build OK; `GET /api/v1/health` responde 200 |
| Base de datos | SQLite de desarrollo configurado y migracion inicial aplicada | TypeORM usa `better-sqlite3` con `DB_TYPE=sqlite`, `SQLITE_PATH=./data/alfacode-hub.sqlite` y `synchronize: false`; `schema_metadata` aplicado por migracion |
| PostgreSQL | Pausado | Se mantiene como objetivo futuro de produccion/Railway, pero no se configurara ni probara de momento |
| Auth/RBAC | Pendiente | Debe implementarse en fases posteriores con autorizacion; no existe como capacidad aprobada en esta linea base |
| Portafolio publico | Conservado | El frontend actual mantiene la responsabilidad de portafolio publico |

## Iteracion activa propuesta

- **ID:** continuidad tras I-01.
- **Estado:** limpieza documental aplicada; pendiente de autorizacion de la siguiente iteracion.
- **Meta:** dejar el estado real alineado con la base tecnica verificada y con la decision de pausar PostgreSQL.
- **Siguiente accion:** el responsable decide si autoriza I-02.

## Registro de ejecucion

- 2026-10-12: se corrigio la documentacion operativa para reflejar el stack vigente: Next.js/React en frontend, NestJS/Node en backend, TypeORM con SQLite/PostgreSQL como persistencia prevista para AlfaCode HUB. No se marco ninguna iteracion como aprobada.
- 2026-10-12: I-01 ejecutada. Se creo `docs/versiones.md` con versiones reales, dependencias instaladas, faltantes y comandos ejecutados. Resultados: `npm --prefix frontend run lint` OK; `npm --prefix frontend run build` OK; `npm --prefix backend run typecheck` OK; `npm --prefix backend run build` OK; backend levantado temporalmente con `npm --prefix backend run start`; `GET /api/health` respondio 200 y `GET /api/v1/health` respondio 404. No se instalaron dependencias ni se inicializaron aplicaciones nuevas.
- 2026-10-12: por autorizacion del responsable, se instalaron dependencias faltantes de persistencia en backend (`@nestjs/typeorm`, `typeorm`, `better-sqlite3`, `pg`), se agrego `.editorconfig`, se eliminaron directorios vacios heredados en `frontend/src/app/app`, `frontend/src/app/api` y `frontend/src/app/login`, y se cambio el prefijo global del backend a `/api/v1`. Verificacion posterior: frontend lint/build OK, backend typecheck/build OK, `GET /api/v1/health` 200 y `GET /api/health` 404.
- 2026-10-12: se configuro SQLite como base de datos de desarrollo mediante `backend/src/database/database.module.ts`. TypeORM selecciona SQLite por defecto con `DB_TYPE=sqlite`, crea la carpeta del archivo local si hace falta y mantiene `synchronize: false`. Verificacion posterior: backend typecheck/build OK, frontend lint/build OK, `GET /api/v1/health` respondio 200 con `database: "ok"`.
- 2026-10-12: se creo la migracion inicial `SchemaBootstrap1728690000000` para la tabla tecnica `schema_metadata`. Se agregaron scripts `migration:show`, `migration:run` y `migration:revert`. Verificacion SQLite: `migration:show` mostro pendientes, `migration:run` aplico una migracion, `migration:revert` la revirtio, y `migration:run` la dejo aplicada nuevamente. Consulta directa confirmo tablas `migrations`, `schema_metadata`, `sqlite_sequence` y registro `schema_bootstrap=initialized`.
- 2026-10-12: por instruccion del responsable, PostgreSQL queda pausado temporalmente. La documentacion operativa debe orientar el trabajo inmediato a SQLite, sin declarar compatibilidad PostgreSQL hasta nueva autorizacion.

Cuando el agente termine una iteracion, debe anadir una entrada con fecha, IDs, archivos modificados, comandos realmente ejecutados, resultados, bloqueos y si esta `implementada`, `verificada_tecnicamente`, `pendiente de aprobacion` o `aprobada_responsable`.

## Bloqueos y decisiones abiertas

- Definir la estrategia concreta de autenticacion y RBAC antes de implementar Fase 1.
- Corregir mojibake/encoding visible en documentos si se autoriza una normalizacion de codificacion completa.
