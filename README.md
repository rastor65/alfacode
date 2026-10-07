# AlfaCode

Plataforma institucional para gestionar proyectos, integrantes, investigacion y produccion academica de AlfaCode, usando sus propios datos para construir el portal publico.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL administrado desde Vercel Marketplace
- Vercel Blob
- Auth.js / NextAuth

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar cuando existan los servicios:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
AUTH_SECRET=
AUTH_URL=http://localhost:3000
```

## Estructura

```text
src/
├── app/
├── components/
├── config/
├── features/
├── lib/
└── types/

db/
└── migrations/

Context/
└── plan-desarrollo-alfacode.md
```

## Base de datos

La primera migracion esta en `db/migrations/0001_initial.sql`. Incluye las entidades del MVP, enums, relaciones, indices y primeras politicas RLS conceptuales para PostgreSQL.

## Estado actual

- Portal publico inicial.
- Rutas de proyectos y detalle por slug.
- Dashboard interno inicial.
- Estructura base por dominios.
- Conectores preparados para PostgreSQL y Vercel Blob.
