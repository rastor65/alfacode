# AlfaCode Backend

Backend base de AlfaCode construido con NestJS y TypeScript.

## Estado

Esta aplicacion tiene NestJS y TypeORM configurado para usar SQLite en desarrollo. Todavia no tiene entidades, migraciones reales ni modulos de negocio.

Endpoint disponible:

```text
GET /api/v1/health
```

El endpoint ejecuta una consulta `SELECT 1` contra la conexion configurada y devuelve `database: "ok"` si la base responde.

## Desarrollo Local

```bash
npm install
npm run start:dev
```

El servicio escucha en `http://localhost:4000` por defecto.

## Variables De Entorno

Copia `.env.example` a `.env.local` dentro de `backend/`.

- `BACKEND_PORT`: puerto HTTP del backend.
- `CORS_ORIGINS`: lista separada por comas de origenes permitidos.
- `DB_TYPE`: `sqlite` en desarrollo. `postgres` queda reservado para cuando se retome PostgreSQL.
- `SQLITE_PATH`: ruta local del archivo SQLite.
- `DATABASE_URL`: cadena PostgreSQL, solo cuando se retome `DB_TYPE=postgres`.

TypeORM se ejecuta con `synchronize: false`; el esquema se gestiona con migraciones versionadas. Mientras PostgreSQL este pausado, la verificacion se realiza solo con SQLite.

## Migraciones

```bash
npm run migration:show
npm run migration:run
npm run migration:revert
```

La migracion inicial crea `schema_metadata`, una tabla tecnica minima para validar que SQLite aplica cambios versionados sin sincronizacion automatica.
