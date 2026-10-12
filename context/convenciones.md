# Convenciones resumidas — AlfaCode HUB

> Este archivo resume convenciones operativas. Ante diferencias, prevalecen `docs/plan-desarrollo.md`, el diseno tecnico v0.2 y las decisiones registradas.

## Estructura

- Un repositorio con `frontend/` (Next.js + React), `backend/` (NestJS), `docs/` y `context/`.
- El portafolio publico vive en `frontend/` y no debe convertirse automaticamente en pantallas internas del HUB.
- La API del HUB se versionara bajo `/api/v1`; cualquier endpoint previo debe revisarse antes de usarlo como contrato estable.
- Arquitectura backend de monolito modular por dominios.

## Lenguaje y nombres

- Codigo y nombres tecnicos en ingles; documentacion y textos de interfaz en espanol.
- TypeScript y JSON: `camelCase` para propiedades; SQL: `snake_case` para tablas y columnas.
- UUID para identificadores. Fechas de instante en ISO 8601 UTC; fechas calendario `YYYY-MM-DD`.
- Evitar nomenclaturas o codigos de rol no definidos en `docs/plan-desarrollo.md`.

## Datos

- Desarrollo: SQLite, sin servidor local adicional.
- Produccion futura: PostgreSQL en Railway mediante variables seguras; pausado temporalmente para el trabajo actual.
- ORM previsto: TypeORM.
- `synchronize: false` en todos los entornos; cambios de esquema mediante migraciones versionadas.
- No usar caracteristicas exclusivas de PostgreSQL en entidades requeridas por ambos motores.
- No versionar archivos `.env`, bases SQLite ni credenciales.

## Seguridad

- Permisos comprobados en el servidor, aun cuando el frontend oculte acciones.
- Sesiones opacas revocables y cookies `HttpOnly` segun el plan.
- Nunca guardar tokens de sesion en `localStorage` ni contrasenas en texto plano.
- No divulgar secretos o datos personales en repositorio, pruebas o logs.

## Contratos y pruebas

- API con validaciones, errores homogeneos y paginacion segun `docs/plan-desarrollo.md`.
- Cada iteracion debe pasar las pruebas aplicables. Mientras PostgreSQL este pausado, las migraciones se verifican en SQLite y no se declara compatibilidad PostgreSQL.
- No describir funcionalidades futuras como si estuvieran implementadas.

## Funcionalidad clave del MVP

- Proyecto `traditional`: tareas sin sprints.
- Proyecto `agile`: backlog y sprints opcionales.
- `sprint_id` en tarea es nullable; sprint y tarea deben pertenecer al mismo proyecto.
- Maximo un sprint activo por proyecto agil en el MVP.
