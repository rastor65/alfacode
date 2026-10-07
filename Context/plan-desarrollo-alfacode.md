# Plan de desarrollo de AlfaCode

## 1. Resumen ejecutivo del producto

AlfaCode debe construirse como una plataforma institucional de gestion del conocimiento, proyectos y produccion investigativa. No es un portafolio con panel de administracion: es una unica fuente de verdad donde la informacion se gestiona una vez, se relaciona con otros dominios del semillero y se publica automaticamente cuando su visibilidad lo permite.

El producto tendra dos experiencias dentro de una misma aplicacion:

- Portal publico: presenta proyectos, investigacion, equipo, publicaciones, articulos, eventos, logros, convocatorias, contacto y oportunidades de vinculacion.
- Plataforma interna: permite administrar proyectos, integrantes, lineas de investigacion, tecnologias, publicaciones, articulos, eventos, logros, solicitudes, aliados, multimedia, configuracion del sitio y permisos.

El principio central sera:

```text
Gestionar una vez -> reutilizar los datos -> publicar automaticamente
```

La arquitectura recomendada es:

```text
Next.js + TypeScript + Tailwind CSS
        |
Capa server-side minima del propio Next.js
        |
PostgreSQL administrado
  - tablas normalizadas
  - Row Level Security
  - funciones SQL puntuales
  - vistas de lectura
        |
Vercel Blob
```

No se desarrollara un backend tradicional independiente ni una API separada. Sin embargo, PostgreSQL no debe exponerse directamente al navegador: no existe una conexion segura frontend -> PostgreSQL puro sin revelar credenciales. Por eso la alternativa viable sera usar Next.js como frontera server-side minima dentro del mismo proyecto, mediante Server Components, Server Actions o Route Handlers estrictamente acotados. La seguridad de datos descansara en PostgreSQL, Row Level Security, politicas SQL, validacion en formularios y separacion estricta de credenciales publicas y privadas.

## 2. Alcance funcional

### Incluido

- Portal publico institucional.
- Plataforma interna autenticada.
- Gestion de usuarios, perfiles, integrantes y roles.
- RBAC basado en tablas, permisos y PostgreSQL RLS.
- Gestion integral de proyectos.
- Relaciones entre proyectos, integrantes, tecnologias, lineas, publicaciones, articulos, eventos, logros, recursos e hitos.
- Catalogos reutilizables de lineas de investigacion y tecnologias.
- Articulos editoriales con workflow.
- Publicaciones academicas con autores.
- Eventos, logros, convocatorias, solicitudes y aliados.
- CMS ligero para contenidos institucionales.
- Multimedia con Vercel Blob y metadatos en PostgreSQL.
- Auditoria ligera.
- SEO, accesibilidad, rendimiento y testing.

### Excluido del MVP

- Backend propio.
- Microservicios.
- Page builder completo.
- Jira interno avanzado.
- Automatizaciones complejas de investigacion.
- Analitica avanzada.
- Sistema de revision academica formal tipo journal.
- Integraciones externas no esenciales.

## 3. Arquitectura propuesta Frontend + PostgreSQL

### Diagrama logico

```text
Usuarios publicos
      |
Portal publico Next.js
      |
Capa de lectura publica en Next.js
      |
RLS: solo visibility = PUBLIC
      |
PostgreSQL / Vercel Blob publico

Usuarios autenticados
      |
App interna Next.js
      |
Capa server-side minima en Next.js
      |
RLS: permisos por rol, pertenencia y visibilidad
      |
PostgreSQL / Vercel Blob privado
```

### Capas internas del frontend

```text
UI pages/components
      |
Feature hooks / use cases
      |
Repositories / services
      |
Server Actions / Route Handlers / Server Components
      |
PostgreSQL + RLS
```

La UI no debe ejecutar consultas SQL directamente ni manejar credenciales de base de datos. Cada dominio tendra repositorios y casos de uso propios, ejecutados en el servidor de Next.js cuando requieran acceder a PostgreSQL.

### Separacion de responsabilidades

| Capa | Responsabilidad |
|---|---|
| Next.js App Router | Rutas publicas, rutas privadas, layouts, metadata, rendering y navegacion |
| Components | UI reutilizable, accesible y consistente |
| Features | Logica de negocio por dominio |
| Services/Repositories | Acceso organizado a PostgreSQL y Vercel Blob |
| Auth.js o identidad administrada | Login, logout, recuperacion, sesion y usuarios |
| PostgreSQL | Modelo relacional, constraints, indices y funciones SQL |
| PostgreSQL RLS | Seguridad real a nivel de fila |
| Vercel Blob | Imagenes, documentos y archivos publicos/privados |

## 4. Justificacion del stack tecnologico

### Next.js sobre React SPA

Se recomienda Next.js con App Router porque AlfaCode tiene un portal publico con alta importancia de SEO, paginas semanticas por proyecto/articulo/publicacion, OpenGraph, sitemap y robots. Next.js permite generar metadata por pagina, rutas dinamicas como `/proyectos/:slug`, carga optimizada de imagenes, code splitting por ruta y despliegue directo en Vercel.

Una SPA con React puro seria mas simple para el panel interno, pero menos conveniente para el portal publico: dependeria mas del renderizado del cliente, tendria peor base SEO y exigiria mas trabajo para metadata dinamica, sitemap y previews sociales.

Decision:

```text
Next.js = portal publico SEO + app interna autenticada en una misma base de codigo.
```

### Vercel como plataforma principal

Vercel sera la plataforma operativa del proyecto:

- Despliegue del frontend Next.js.
- Preview deployments por rama o pull request.
- Serverless Functions / Route Handlers para operaciones server-side.
- Variables de entorno por ambiente.
- Vercel Blob para archivos.
- Observabilidad basica del despliegue.
- Integracion con un PostgreSQL administrado desde Vercel Marketplace.

Esto mantiene una sola aplicacion y evita operar un backend tradicional independiente.

### PostgreSQL administrado desde Vercel

Se prioriza PostgreSQL como base de datos principal por su solidez relacional, normalizacion, constraints, indices, vistas, funciones SQL y Row Level Security. Para mantener el enfoque Vercel-first, la base debe provisionarse desde Vercel Marketplace con una integracion PostgreSQL, preferiblemente Neon Postgres si esta disponible en el proyecto.

Punto critico: PostgreSQL no debe consumirse directamente desde el navegador. A diferencia de una plataforma BaaS con SDK publico, PostgreSQL requiere credenciales privadas y conexion segura. Por tanto, el acceso a datos se realizara desde el runtime server-side de Next.js, manteniendo una sola aplicacion y evitando un backend tradicional independiente.

### Vercel Blob

Vercel Blob sera el almacenamiento oficial para imagenes, portadas, galerias, PDFs y recursos. Los archivos publicos se serviran directamente desde URLs de Blob. Los archivos privados se entregaran mediante funciones server-side de Next.js, validando permisos contra PostgreSQL antes de permitir acceso.

### Autenticacion

Para no construir autenticacion desde cero, se recomienda:

- Auth.js con adaptador PostgreSQL, si se quiere mantener todo alrededor de la misma base de datos.
- Clerk, Auth0 o similar, si se prefiere identidad administrada con menos operacion.

En ambos casos, la sesion debe convertirse en contexto seguro para PostgreSQL mediante variables de sesion por transaccion o filtros server-side reforzados con RLS.

### TypeScript

Reduce errores en entidades relacionales, formularios, permisos, estados de workflow y contratos entre UI y servicios.

### Tailwind CSS

Permite construir un sistema visual consistente, rapido y mantenible, con tokens para identidad AlfaCode: oscuro predominante, `#469EB4` como principal y `#E1FEFF` como secundario.

### Librerias recomendadas

| Necesidad | Recomendacion | Uso |
|---|---|---|
| Formularios | React Hook Form + Zod | Validacion, formularios CRUD, solicitudes |
| Server/data state | TanStack Query | Cache, invalidacion, paginacion, estados de carga |
| UI state local/global | Zustand o Context API | Sidebar, tema, filtros compartidos |
| Tablas | TanStack Table | Listados internos |
| Editor contenido | TipTap o MDX/Markdown controlado | Articulos editoriales |
| Animacion | Framer Motion moderado | Microinteracciones puntuales |
| Fechas | date-fns | Formato y rangos |

## 5. Mapa completo de modulos

| Modulo | Publico | Interno | Descripcion |
|---|---:|---:|---|
| Autenticacion | No | Si | Login, logout, recuperacion, sesion |
| Dashboard | No | Si | Indicadores operativos |
| Usuarios/perfiles | No | Si | Perfil, estado, roles |
| Integrantes | Si | Si | Equipo e informacion academica |
| Proyectos | Si | Si | Nucleo de la plataforma |
| Hitos/entregables | Parcial | Si | Seguimiento liviano de proyectos |
| Lineas de investigacion | Si | Si | Catalogo administrable |
| Tecnologias | Si | Si | Catalogo reutilizable |
| Articulos | Si | Si | Contenido editorial |
| Publicaciones | Si | Si | Produccion academica |
| Eventos | Si | Si | Actividades y participacion |
| Logros | Si | Si | Reconocimientos y resultados |
| Convocatorias | Si | Si | Llamados a nuevos integrantes |
| Solicitudes | Formulario | Si | Recepcion y revision |
| Aliados | Si | Si | Instituciones y empresas |
| Multimedia | Parcial | Si | Archivos y galerias |
| Sitio/CMS | Si consume | Si gestiona | Hero, textos, redes, contacto |
| Auditoria | No | Si | Registro de acciones relevantes |

## 6. Roles y permisos

### Roles iniciales

| Rol | Descripcion |
|---|---|
| Semillerista | Integrante autenticado con lectura interna basica |
| Lider de proyecto | Puede gestionar proyectos donde participa como lider |
| Docente / investigador | Puede asesorar, revisar y consultar informacion interna ampliada |
| Editor | Gestiona articulos y contenido editorial |
| Coordinador | Gestiona informacion general del semillero |
| Administrador | Acceso completo y gestion de usuarios/permisos |

### Permisos conceptuales

```text
projects.read
projects.create
projects.update
projects.delete
projects.publish
members.read
members.manage
articles.create
articles.review
articles.publish
publications.manage
events.manage
applications.review
site.manage
users.manage
```

### Implementacion RBAC

Tablas:

- `roles`
- `permissions`
- `user_roles`
- `role_permissions`

El frontend podra consultar los permisos efectivos del usuario para mostrar u ocultar acciones, pero la seguridad real se aplicara en PostgreSQL RLS. Las politicas deben consultar funciones SQL como `has_permission(current_app_user_id(), 'projects.update')` o `is_project_leader(current_app_user_id(), project_id)`.

Ejemplo conceptual:

```sql
create or replace function public.has_permission(user_id uuid, permission_key text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = has_permission.user_id
      and p.key = permission_key
  );
$$;
```

Nota: las funciones `security definer` deben tener `search_path` controlado y ser auditadas. No deben convertirse en atajos para saltarse RLS sin restricciones.

## 7. Modelo conceptual de datos

Entidades principales:

- Usuario autenticado: identidad gestionada por `app_users` o por las tablas del adaptador Auth.js.
- Perfil: datos basicos internos del usuario.
- Integrante: informacion academica, publica y de trayectoria.
- Rol/permiso: autorizacion granular.
- Proyecto: unidad central de investigacion/desarrollo.
- Linea de investigacion: clasificacion academica.
- Tecnologia: catalogo reutilizable.
- Hito: seguimiento de avance.
- Recurso/media: archivos vinculados.
- Articulo: contenido editorial web.
- Publicacion: produccion academica.
- Evento: actividad, participacion o presentacion.
- Logro: reconocimiento o resultado destacado.
- Convocatoria: llamado publico.
- Solicitud: postulacion enviada por visitante.
- Aliado: institucion externa.
- Configuracion del sitio: contenidos institucionales editables.
- Auditoria: registro de acciones criticas.

Relaciones clave:

- Un proyecto tiene muchos integrantes y un integrante participa en muchos proyectos.
- Un proyecto puede pertenecer a varias lineas y usar varias tecnologias.
- Una publicacion puede tener varios autores y relacionarse con proyecto/linea.
- Un articulo puede tener varios autores y tags.
- Eventos y logros pueden relacionarse con proyectos e integrantes.
- Los datos se publican por `visibility`, no por duplicacion.

## 8. Modelo relacional propuesto

### Convenciones generales

- PK principal: `id uuid default gen_random_uuid()`.
- Timestamps: `created_at timestamptz`, `updated_at timestamptz`.
- Auditoria basica: `created_by uuid references app_users(id)` cuando aplique.
- Slugs unicos en entidades publicas.
- Estados mediante enums PostgreSQL o checks controlados.
- Relaciones muchos-a-muchos mediante tablas puente.
- Borrado preferido: `status`, `archived_at` o `deleted_at` cuando el dato tenga valor historico.

### Enums sugeridos

```sql
visibility: PRIVATE, INTERNAL, PUBLIC
member_status: ACTIVE, INACTIVE, ALUMNI
project_status: PROPOSAL, RESEARCH, DESIGN, DEVELOPMENT, VALIDATION, COMPLETED, ARCHIVED
milestone_status: PENDING, IN_PROGRESS, COMPLETED, BLOCKED
article_status: DRAFT, REVIEW, APPROVED, PUBLISHED, ARCHIVED
application_status: RECEIVED, REVIEWING, INTERVIEW, ACCEPTED, REJECTED
event_modality: ONSITE, VIRTUAL, HYBRID
```

## 9. Listado de tablas y relaciones

### `app_users`

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| email | text | Unico, requerido |
| name | text | Nombre basico de cuenta |
| email_verified_at | timestamptz | Verificacion |
| image_url | text | Avatar externo opcional |
| status | text | ACTIVE/INACTIVE |
| created_at/updated_at | timestamptz | Auditoria |

Proposito: representar la identidad interna de aplicacion cuando se use Auth.js con adaptador PostgreSQL o sincronizar el usuario desde un proveedor de identidad administrado.
Indices: `email`, `status`.
Relaciones: 1:1 con `profiles`; M:N con roles.

### `profiles`

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK, FK a `app_users(id)` |
| display_name | text | Nombre visible |
| avatar_url | text | Imagen |
| email | text | Unico, sincronizado desde auth cuando aplique |
| status | text | ACTIVE/INACTIVE |
| last_seen_at | timestamptz | Ultimo acceso |
| created_at/updated_at | timestamptz | Auditoria |

Relaciones: 1:1 con `app_users`; 1:0..1 con `members`.
Indices: `email`, `status`.

### `members`

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| profile_id | uuid | FK nullable a `profiles(id)` |
| first_name, last_name | text | Requeridos |
| photo_media_id | uuid | FK a `media(id)` |
| bio | text | Biografia |
| academic_program | text | Programa |
| semester | smallint | Check mayor o igual a 1 |
| joined_at, left_at | date | Trayectoria |
| status | member_status | ACTIVE/INACTIVE/ALUMNI |
| email | text | Contacto |
| github_url, linkedin_url | text | Redes |
| orcid, cvlac_url, scholar_url, portfolio_url | text | Academia/portafolio |
| visibility | visibility | Publicacion |
| created_by | uuid | FK a `app_users` |
| created_at/updated_at | timestamptz | Auditoria |

Indices: `status`, `visibility`, `last_name`, `profile_id`.
Relaciones: M:N con proyectos, publicaciones, articulos, eventos y logros.

### `roles`, `permissions`, `user_roles`, `role_permissions`

| Tabla | Proposito | Campos clave |
|---|---|---|
| roles | Catalogo de roles | `id`, `name`, `key`, `description`, `is_system` |
| permissions | Catalogo de permisos | `id`, `key`, `description`, `module` |
| user_roles | Asigna roles a usuarios | `user_id`, `role_id`, `assigned_by`, `assigned_at` |
| role_permissions | Permisos por rol | `role_id`, `permission_id` |

Restricciones: unique `roles.key`, unique `permissions.key`, PK compuesta en tablas puente.
Indices: `user_roles.user_id`, `role_permissions.role_id`.

### `research_lines`

Campos:

- `id uuid PK`
- `name text not null`
- `slug text unique not null`
- `description text`
- `icon_key text`
- `status text`
- `responsible_member_id uuid FK members(id)`
- `visibility visibility`
- `created_by uuid`
- `created_at`, `updated_at`

Relaciones: M:N con proyectos, publicaciones e integrantes mediante tablas puente.
Indices: `slug`, `visibility`, `status`.

### `technologies`

Campos:

- `id uuid PK`
- `name text unique not null`
- `slug text unique not null`
- `category text`
- `icon_url text`
- `description text`
- `website_url text`
- `status text`
- `created_at`, `updated_at`

Relaciones: M:N con proyectos.
Indices: `slug`, `category`, `status`.

### `projects`

Campos:

- `id uuid PK`
- `name text not null`
- `slug text unique not null`
- `summary text`
- `description text`
- `problem_statement text`
- `objective text`
- `solution text`
- `start_date date`
- `end_date date`
- `status project_status`
- `visibility visibility`
- `cover_media_id uuid FK media(id)`
- `repository_url text`
- `demo_url text`
- `documentation_url text`
- `results text`
- `impact text`
- `published_at timestamptz`
- `created_by uuid FK app_users(id)`
- `created_at`, `updated_at`

Restricciones: slug unico, fechas coherentes, `published_at` requerido si `visibility = PUBLIC` mediante check diferible o logica de aplicacion.
Indices: `slug`, `status`, `visibility`, `start_date`, `created_by`.
Cardinalidad: 1:N con hitos y recursos; M:N con integrantes, lineas, tecnologias, publicaciones, articulos, eventos, logros y aliados.

### `project_members`

Campos:

- `project_id uuid FK projects(id)`
- `member_id uuid FK members(id)`
- `project_role text`
- `responsibility text`
- `joined_at date`
- `left_at date`
- `is_lead boolean default false`
- `created_at`

PK: (`project_id`, `member_id`).
Indices: `member_id`, `project_id`, `is_lead`.

### `project_technologies`, `project_research_lines`, `project_partners`

Tablas puente con PK compuesta:

- `project_id`
- entidad relacionada (`technology_id`, `research_line_id`, `partner_id`)
- `created_at`

### `project_milestones`

Campos:

- `id uuid PK`
- `project_id uuid FK projects(id)`
- `name text`
- `description text`
- `target_date date`
- `completed_at date`
- `status milestone_status`
- `responsible_member_id uuid FK members(id)`
- `notes text`
- `created_by uuid`
- `created_at`, `updated_at`

Indices: `project_id`, `status`, `target_date`.
Relaciones: 1:N con `project_deliverables`.

### `project_deliverables`

Campos:

- `id uuid PK`
- `milestone_id uuid FK project_milestones(id)`
- `project_id uuid FK projects(id)`
- `title text`
- `description text`
- `media_id uuid FK media(id)`
- `url text`
- `status text`
- `created_at`, `updated_at`

Indice: `milestone_id`, `project_id`.

### `project_resources`

Campos:

- `id uuid PK`
- `project_id uuid FK projects(id)`
- `media_id uuid FK media(id)`
- `title text`
- `resource_type text`
- `visibility visibility`
- `created_by uuid`
- `created_at`

Indice: `project_id`, `visibility`, `resource_type`.

### `articles`

Campos:

- `id uuid PK`
- `title text`
- `slug text unique`
- `excerpt text`
- `content jsonb` o `content_md text`
- `cover_media_id uuid`
- `category_id uuid`
- `seo_title text`
- `seo_description text`
- `status article_status`
- `visibility visibility`
- `published_at timestamptz`
- `created_by uuid`
- `created_at`, `updated_at`

Relaciones: M:N con autores (`article_authors`) y tags (`article_tags`); opcional M:N con proyectos.
Indices: `slug`, `status`, `visibility`, `published_at`.

### `article_authors`, `tags`, `article_tags`, `article_categories`

| Tabla | Campos principales |
|---|---|
| article_authors | `article_id`, `member_id`, `author_order` |
| tags | `id`, `name`, `slug` |
| article_tags | `article_id`, `tag_id` |
| article_categories | `id`, `name`, `slug`, `description` |

Restricciones: orden unico por articulo en autores.

### `publications`

Campos:

- `id uuid PK`
- `title text`
- `slug text unique`
- `abstract text`
- `year int`
- `doi text`
- `venue text`
- `link_url text`
- `file_media_id uuid FK media(id)`
- `type text`
- `project_id uuid nullable FK projects(id)`
- `research_line_id uuid nullable FK research_lines(id)`
- `visibility visibility`
- `created_by uuid`
- `created_at`, `updated_at`

Indices: `year`, `type`, `visibility`, `doi`, `project_id`.

### `publication_authors`

Campos:

- `publication_id uuid FK publications(id)`
- `member_id uuid nullable FK members(id)`
- `external_author_name text nullable`
- `author_order int`
- `orcid text`

PK sugerida: (`publication_id`, `author_order`).
Permite autores internos y externos sin guardar autores como strings agregados.

### `events`

Campos:

- `id uuid PK`
- `title text`
- `slug text unique`
- `description text`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `place text`
- `modality event_modality`
- `results text`
- `visibility visibility`
- `cover_media_id uuid`
- `created_by uuid`
- `created_at`, `updated_at`

Relaciones: M:N con participantes y proyectos.
Indices: `slug`, `starts_at`, `visibility`, `modality`.

### `event_participants`, `event_projects`

Campos:

- `event_id`
- `member_id` o `project_id`
- `role text`
- `created_at`

PK compuesta.

### `achievements`

Campos:

- `id uuid PK`
- `title text`
- `slug text unique`
- `description text`
- `type text`
- `awarded_at date`
- `issuer text`
- `visibility visibility`
- `cover_media_id uuid`
- `created_by uuid`
- `created_at`, `updated_at`

Relaciones: M:N con integrantes, proyectos y eventos.
Indices: `type`, `awarded_at`, `visibility`.

### `achievement_members`, `achievement_projects`, `achievement_events`

Tablas puente con PK compuesta e indices por cada FK.

### `calls`

Campos:

- `id uuid PK`
- `title text`
- `slug text unique`
- `description text`
- `opens_at timestamptz`
- `closes_at timestamptz`
- `requirements text`
- `target_profiles text`
- `slots int`
- `status text`
- `visibility visibility`
- `created_by uuid`
- `created_at`, `updated_at`

Indices: `slug`, `status`, `opens_at`, `closes_at`.

### `applications`

Campos:

- `id uuid PK`
- `call_id uuid FK calls(id)`
- `full_name text`
- `email text`
- `academic_program text`
- `semester smallint`
- `interests text`
- `skills text`
- `motivation text`
- `github_url text`
- `portfolio_url text`
- `status application_status`
- `reviewed_by uuid FK app_users(id)`
- `reviewed_at timestamptz`
- `created_at`, `updated_at`

Indices: `call_id`, `status`, `email`, `created_at`.
Seguridad: insert publico restringido, select solo revisores.

### `partners`

Campos:

- `id uuid PK`
- `name text`
- `slug text unique`
- `type text`
- `logo_media_id uuid`
- `description text`
- `website_url text`
- `status text`
- `visibility visibility`
- `created_at`, `updated_at`

Relaciones: M:N con proyectos.

### `media`

Campos:

- `id uuid PK`
- `store_name text`
- `path text`
- `url text`
- `file_name text`
- `mime_type text`
- `size_bytes bigint`
- `alt_text text`
- `caption text`
- `visibility visibility`
- `owner_id uuid FK app_users(id)`
- `created_at`, `updated_at`

Restricciones: unique (`store_name`, `path`).
Indices: `store_name`, `visibility`, `owner_id`, `mime_type`.

### `site_settings`

Campos:

- `id uuid PK`
- `key text unique`
- `value jsonb`
- `visibility visibility`
- `updated_by uuid`
- `created_at`, `updated_at`

Uso: hero, descripcion institucional, estadisticas, CTAs, redes, contacto, textos.

### `audit_logs`

Campos:

- `id uuid PK`
- `actor_user_id uuid FK app_users(id)`
- `action text`
- `entity_table text`
- `entity_id uuid`
- `before_data jsonb`
- `after_data jsonb`
- `created_at timestamptz`
- `ip_address inet nullable`

Indices: `actor_user_id`, `action`, `entity_table`, `created_at`.

### Tablas adicionales recomendadas

| Tabla | Motivo |
|---|---|
| `member_research_lines` | Integrantes asociados a lineas |
| `article_projects` | Articulos relacionados con proyectos |
| `publication_projects` | Si una publicacion puede relacionarse con varios proyectos |
| `notifications` | Avisos internos futuros |
| `saved_filters` | Preferencias internas futuras |

## 10. Estrategia de PostgreSQL RLS

La RLS debe estar habilitada en todas las tablas sensibles del esquema `public`. Las politicas deben responder a tres preguntas:

1. Quien consulta o muta.
2. Que permiso tiene.
3. Que fila intenta consultar o mutar.

Como no se usara Supabase, PostgreSQL no tendra automaticamente funciones como `auth.uid()`. La aplicacion Next.js debe abrir operaciones de base de datos estableciendo contexto seguro por transaccion, por ejemplo:

```sql
select set_config('app.user_id', '<uuid-del-usuario>', true);
select set_config('app.role', 'app_user', true);
```

Luego las politicas usan funciones auxiliares:

```sql
create or replace function public.current_app_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;
```

Esta configuracion debe hacerse solo en servidor, nunca desde el navegador.

Roles de base de datos sugeridos:

| Rol PostgreSQL | Uso |
|---|---|
| `app_public` | Lecturas publicas y formularios publicos estrictamente controlados |
| `app_user` | Operaciones de usuarios autenticados con RLS |
| `app_migrator` | Migraciones y cambios de esquema en CI/CD |
| `app_admin` | Operacion administrativa excepcional, no usado por el frontend |

### Reglas por tipo de usuario

| Actor | Lectura | Escritura |
|---|---|---|
| Visitante | Solo `visibility = PUBLIC` | Solo insert controlado en `applications` |
| Semillerista | `PUBLIC` + `INTERNAL` permitido | Actualizacion limitada de su perfil |
| Lider de proyecto | Proyectos donde es lider | Actualizar proyectos/hitos/recursos asignados |
| Editor | Articulos y contenido editorial | Crear/revisar/publicar articulos |
| Coordinador | Gestion general | Gestion de proyectos, integrantes, eventos, convocatorias |
| Administrador | Todo | Todo |

### Politicas conceptuales

Lectura publica de proyectos:

```sql
create policy "Public can read public projects"
on public.projects
for select
to app_public, app_user
using (visibility = 'PUBLIC');
```

Lectura interna para autenticados:

```sql
create policy "App users can read internal projects"
on public.projects
for select
to app_user
using (
  visibility = 'PUBLIC'
  or visibility = 'INTERNAL'
  or public.has_permission(public.current_app_user_id(), 'projects.read')
);
```

Edicion por lider de proyecto:

```sql
create policy "Project leaders can update their projects"
on public.projects
for update
to app_user
using (
  public.is_project_leader(public.current_app_user_id(), id)
  or public.has_permission(public.current_app_user_id(), 'projects.update')
)
with check (
  public.is_project_leader(public.current_app_user_id(), id)
  or public.has_permission(public.current_app_user_id(), 'projects.update')
);
```

Publicacion de proyecto:

```sql
create policy "Only publishers can publish projects"
on public.projects
for update
to app_user
using (public.has_permission(public.current_app_user_id(), 'projects.publish'))
with check (public.has_permission(public.current_app_user_id(), 'projects.publish'));
```

Solicitudes publicas:

```sql
create policy "Anyone can submit application"
on public.applications
for insert
to app_public, app_user
with check (
  status = 'RECEIVED'
);

create policy "Reviewers can read applications"
on public.applications
for select
to app_user
using (public.has_permission(public.current_app_user_id(), 'applications.review'));
```

### Formulario publico seguro

Para permitir solicitudes publicas sin comprometer la base:

- Habilitar solo `insert` en `applications` para el rol de base de datos `app_public`.
- Forzar `status = RECEIVED` en `with check`.
- No permitir `select`, `update` ni `delete` a `app_public`.
- Validar con Zod en frontend.
- Agregar CAPTCHA si aumenta el spam.
- Agregar rate limiting mediante proveedor de hosting, middleware de Next.js o un servicio antispam si se vuelve necesario.
- No exponer datos de otros solicitantes.

### Vercel Blob y permisos

Stores propuestos:

```text
alfacode-public-assets
alfacode-private-assets
```

Estructura:

```text
alfacode-public-assets/
  projects/
  articles/
  events/
  members/

alfacode-private-assets/
  projects/
  publications/
  internal/
```

Politicas:

- `alfacode-public-assets`: lectura publica por URL, escritura solo desde operaciones server-side autorizadas.
- `alfacode-private-assets`: lectura mediante funciones server-side que validan permisos en PostgreSQL.
- Avatares, portadas y galerias publicas usan el store publico.
- Documentos internos, evidencias no publicadas y archivos administrativos usan el store privado.

Vercel Blob no reemplaza la seguridad de PostgreSQL. La tabla `media` debe reflejar store, path, owner, URL, tamano, MIME y visibilidad. Los blobs publicos pueden servirse por URL directa. Los blobs privados deben resolverse desde Route Handlers o Server Actions que validen RBAC/RLS antes de transmitir o redirigir el archivo.

## 11. Arquitectura frontend

### Estructura propuesta

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── proyectos/
│   │   ├── investigacion/
│   │   ├── equipo/
│   │   ├── publicaciones/
│   │   ├── articulos/
│   │   ├── eventos/
│   │   ├── logros/
│   │   ├── unete/
│   │   └── contacto/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── recuperar/
│   │   └── restablecer/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── proyectos/
│   │   ├── integrantes/
│   │   ├── investigacion/
│   │   ├── tecnologias/
│   │   ├── publicaciones/
│   │   ├── articulos/
│   │   ├── eventos/
│   │   ├── logros/
│   │   ├── convocatorias/
│   │   ├── solicitudes/
│   │   ├── aliados/
│   │   ├── multimedia/
│   │   ├── sitio/
│   │   └── configuracion/
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── data-display/
│   └── feedback/
├── features/
│   ├── auth/
│   ├── projects/
│   ├── members/
│   ├── research/
│   ├── technologies/
│   ├── publications/
│   ├── articles/
│   ├── events/
│   ├── achievements/
│   ├── applications/
│   ├── partners/
│   ├── media/
│   └── site/
├── hooks/
├── lib/
│   ├── db/
│   ├── query/
│   ├── auth/
│   ├── storage/
│   └── validation/
├── services/
├── types/
├── utils/
└── config/
```

### Patron por feature

```text
features/projects/
├── components/
├── hooks/
├── services/
├── schemas/
├── types.ts
└── utils.ts
```

### Estado

| Tipo | Herramienta | Uso |
|---|---|---|
| Server/data state | TanStack Query | Listados, detalles, cache, paginacion, invalidacion |
| UI state local | `useState`, `useReducer` | Modales, filtros simples, tabs |
| UI state compartido | Zustand | Sidebar, preferencias, filtros persistentes |
| Sesion | Auth.js/proveedor de identidad + middleware | Usuario autenticado y proteccion de rutas |

No usar Zustand para duplicar datos que ya vienen de PostgreSQL; usarlo para estado de interfaz.

### Diseño visual

Identidad:

- Concepto: Research & Software Lab.
- Predominio oscuro.
- Paleta principal: `#469EB4`.
- Paleta secundaria: `#E1FEFF`.
- Liquid Glass sutil en paneles, sin perder legibilidad.
- Visuales de nodos, sistemas conectados, arquitectura y datos.
- Proyectos como protagonista del portal.
- Microinteracciones medidas y respetando `prefers-reduced-motion`.

## 12. Mapa de rutas publicas y privadas

### Publicas

```text
/
/proyectos
/proyectos/:slug
/investigacion
/investigacion/:slug
/equipo
/publicaciones
/articulos
/articulos/:slug
/eventos
/logros
/unete
/contacto
```

### Autenticacion

```text
/login
/recuperar
/restablecer
```

### Internas

```text
/app/dashboard
/app/proyectos
/app/proyectos/nuevo
/app/proyectos/:id
/app/integrantes
/app/investigacion
/app/tecnologias
/app/publicaciones
/app/articulos
/app/eventos
/app/logros
/app/convocatorias
/app/solicitudes
/app/aliados
/app/multimedia
/app/sitio
/app/configuracion
```

## 13. Flujos principales del sistema

### Publicar proyecto

```text
Coordinador crea proyecto
-> agrega resumen, problema, objetivo, solucion
-> relaciona integrantes, lineas y tecnologias
-> agrega hitos y recursos
-> sube portada y galeria
-> relaciona publicaciones/articulos/logros
-> cambia visibility a PUBLIC
-> el proyecto aparece en /proyectos y /proyectos/:slug
```

### Crear articulo

```text
Editor crea borrador
-> agrega contenido, autores, tags y SEO
-> cambia a REVIEW
-> revisor aprueba
-> editor publica
-> aparece en /articulos
```

### Solicitud de ingreso

```text
Visitante entra a /unete
-> completa formulario
-> se crea applications.status = RECEIVED
-> coordinador revisa en /app/solicitudes
-> cambia workflow a REVIEWING, INTERVIEW, ACCEPTED o REJECTED
```

### Gestion de multimedia

```text
Usuario autorizado sube archivo
-> se guarda en el store correcto de Vercel Blob
-> se crea registro media
-> se relaciona con proyecto, articulo, evento o integrante
-> RLS controla lectura segun visibility y permisos
```

## 14. Plan de desarrollo por fases

### Fase 0 - Analisis

| Elemento | Descripcion |
|---|---|
| Objetivo | Alinear alcance, dominios, modelo de datos, permisos, UX y criterios de MVP |
| Funcionalidades | Inventario de contenido, mapa de navegacion, flujos, matriz RBAC |
| Base de datos | Diseno conceptual y relacional |
| Frontend | Wireframes, rutas, layouts, design tokens |
| Seguridad | Definicion de roles, permisos y estrategia RLS |
| Dependencias | Ninguna |
| Resultado | Especificacion validada para iniciar construccion |
| Prioridad | Alta |

### Fase 1 - Base tecnica

| Elemento | Descripcion |
|---|---|
| Objetivo | Montar el fundamento tecnico |
| Funcionalidades | Next.js, TypeScript, Tailwind, cliente PostgreSQL server-side, Auth.js/identidad administrada, layouts |
| Base de datos | `profiles`, RBAC, enums, migraciones, seeds iniciales |
| Frontend | Login, recuperacion, layout publico, layout interno, guardas |
| Seguridad | RLS inicial, sesion, variables de entorno |
| Dependencias | Fase 0 |
| Resultado | App desplegable con login y rutas protegidas |
| Prioridad | Alta |

### Fase 2 - Estructura del semillero

| Elemento | Descripcion |
|---|---|
| Objetivo | Gestionar integrantes, lineas, tecnologias y roles |
| Funcionalidades | CRUD integrantes, lineas, tecnologias, asignacion de roles |
| Base de datos | `members`, `research_lines`, `technologies`, `user_roles` |
| Frontend | Listados, formularios, detalle, filtros |
| Seguridad | `members.manage`, `users.manage`, lectura interna |
| Dependencias | Fase 1 |
| Resultado | Semillero estructurado y catalogos listos |
| Prioridad | Alta |

### Fase 3 - Proyectos

| Elemento | Descripcion |
|---|---|
| Objetivo | Construir el nucleo de gestion de proyectos |
| Funcionalidades | CRUD proyectos, integrantes, tecnologias, lineas, hitos, recursos |
| Base de datos | `projects`, `project_members`, `project_technologies`, `project_research_lines`, `project_milestones`, `project_resources`, `media` |
| Frontend | Listado, detalle, editor de proyecto, hitos, galeria, recursos |
| Seguridad | Lideres editan sus proyectos; coordinadores administran; publicacion controlada |
| Dependencias | Fase 2 |
| Resultado | Proyectos gestionables internamente |
| Prioridad | Alta |

### Fase 4 - Portal publico

| Elemento | Descripcion |
|---|---|
| Objetivo | Publicar presencia institucional desde datos reales |
| Funcionalidades | Home, proyectos, detalle, investigacion, equipo, SEO |
| Base de datos | Lectura de `visibility = PUBLIC` |
| Frontend | Rutas publicas, cards, detalle, metadata, sitemap |
| Seguridad | Politicas select publicas estrictas |
| Dependencias | Fase 3 |
| Resultado | Portal publico funcional y alimentado por la plataforma |
| Prioridad | Alta |

### Fase 5 - Investigacion y contenido

| Elemento | Descripcion |
|---|---|
| Objetivo | Gestionar articulos y publicaciones academicas |
| Funcionalidades | Articulos, autores, tags, publicaciones, workflow editorial |
| Base de datos | `articles`, `article_authors`, `tags`, `publications`, `publication_authors` |
| Frontend | Editor, revision, listados publicos, detalle de articulo |
| Seguridad | `articles.create`, `articles.review`, `articles.publish`, `publications.manage` |
| Dependencias | Fase 4 |
| Resultado | Produccion editorial y academica publicada |
| Prioridad | Media |

### Fase 6 - Comunidad

| Elemento | Descripcion |
|---|---|
| Objetivo | Gestionar eventos, logros, convocatorias, solicitudes y aliados |
| Funcionalidades | CRUD eventos, logros, aliados, convocatorias, formulario de solicitud |
| Base de datos | `events`, `achievements`, `calls`, `applications`, `partners` |
| Frontend | Paginas publicas, panel de revision, formularios |
| Seguridad | Insert publico controlado en solicitudes; revision con permiso |
| Dependencias | Fase 4 |
| Resultado | Comunidad y vinculacion operativas |
| Prioridad | Media |

### Fase 7 - Administracion

| Elemento | Descripcion |
|---|---|
| Objetivo | Mejorar operacion interna y administracion del sitio |
| Funcionalidades | Dashboard, CMS ligero, auditoria, optimizacion |
| Base de datos | `site_settings`, `audit_logs`, vistas agregadas |
| Frontend | Dashboard, configuracion de hero/contacto/redes, reportes simples |
| Seguridad | `site.manage`, auditoria protegida |
| Dependencias | Fases 3 a 6 |
| Resultado | Operacion interna mas clara y trazable |
| Prioridad | Media |

### Fase 8 - Calidad

| Elemento | Descripcion |
|---|---|
| Objetivo | Preparar lanzamiento estable |
| Funcionalidades | Testing, accesibilidad, responsive, performance, SEO, seguridad |
| Base de datos | Pruebas RLS, indices, fixtures |
| Frontend | E2E, componentes, formularios, estados vacios/error |
| Seguridad | Revision de politicas, claves, permisos y storage |
| Dependencias | Fases previas |
| Resultado | Plataforma lista para produccion |
| Prioridad | Alta |

## 15. Historias de usuario principales

### Autenticacion

HU-001

Como integrante de AlfaCode, quiero iniciar sesion con mi correo y contrasena para acceder a la plataforma interna.

Criterios de aceptacion:

- El login usa Auth.js o un proveedor administrado de identidad.
- La sesion persiste al recargar.
- Las rutas `/app` redirigen a login si no hay sesion.

HU-002

Como usuario, quiero recuperar mi contrasena para restablecer el acceso sin intervencion tecnica.

Criterios:

- Se envia correo de recuperacion.
- El enlace permite crear nueva contrasena.
- No se expone informacion sensible.

### Proyectos

HU-003

Como coordinador de AlfaCode, quiero registrar un proyecto para administrar su informacion y posteriormente publicarlo en el portal.

Criterios:

- El proyecto se crea como `PRIVATE` o `INTERNAL`.
- Se valida nombre, slug, estado y resumen.
- Solo usuarios con permiso pueden crearlo.

HU-004

Como lider de proyecto, quiero editar los hitos de mi proyecto para reportar avances.

Criterios:

- Solo puedo editar proyectos donde soy lider o tengo permiso.
- Los hitos tienen estado, responsable y fecha objetivo.
- Los cambios quedan auditados.

HU-005

Como visitante, quiero ver proyectos publicos para conocer la capacidad tecnica de AlfaCode.

Criterios:

- Solo aparecen proyectos `PUBLIC`.
- Puedo entrar al detalle por slug.
- Se muestran integrantes, tecnologias, lineas y resultados publicos.

### Integrantes

HU-006

Como coordinador, quiero registrar integrantes para mantener actualizado el equipo.

Criterios:

- Se guardan datos academicos y enlaces.
- El integrante puede estar activo, inactivo o alumni.
- La visibilidad controla si aparece en el portal.

### Investigacion y tecnologias

HU-007

Como administrador, quiero gestionar lineas de investigacion desde la base de datos para no codificarlas en el frontend.

Criterios:

- Las lineas tienen slug, descripcion, icono y responsable.
- Pueden relacionarse con proyectos y publicaciones.
- Solo lineas publicas aparecen en el portal.

HU-008

Como coordinador, quiero asociar tecnologias a proyectos para mostrar el stack utilizado.

Criterios:

- Las tecnologias se seleccionan desde un catalogo.
- Una tecnologia puede estar en multiples proyectos.
- No se duplican tecnologias por proyecto.

### Articulos y publicaciones

HU-009

Como editor, quiero crear articulos en borrador para preparar contenido editorial.

Criterios:

- El articulo inicia en `DRAFT`.
- Puede pasar a `REVIEW`, `APPROVED` y `PUBLISHED`.
- Solo `PUBLISHED` y `PUBLIC` aparece en el portal.

HU-010

Como investigador, quiero registrar publicaciones academicas para centralizar la produccion cientifica.

Criterios:

- La publicacion admite autores internos y externos.
- Puede relacionarse con proyecto y linea.
- Puede incluir DOI, venue, archivo y enlace.

### Solicitudes

HU-011

Como visitante, quiero enviar una solicitud de ingreso para postularme al semillero.

Criterios:

- El formulario es publico.
- El registro se crea con estado `RECEIVED`.
- El visitante no puede leer solicitudes.

HU-012

Como coordinador, quiero revisar solicitudes para gestionar el proceso de ingreso.

Criterios:

- Puedo cambiar estado de la solicitud.
- Solo usuarios con `applications.review` acceden.
- Se registra quien revisa y cuando.

### CMS y dashboard

HU-013

Como coordinador, quiero actualizar textos institucionales sin cambiar codigo para mantener el portal vigente.

Criterios:

- Solo usuarios con `site.manage` modifican `site_settings`.
- Los cambios se reflejan en el portal.
- No se permite editar componentes arbitrarios.

HU-014

Como coordinador, quiero ver un dashboard con indicadores para entender el estado del semillero.

Criterios:

- Muestra proyectos activos, integrantes, publicaciones, solicitudes y eventos.
- Prioriza informacion util sobre graficos decorativos.
- Respeta permisos de lectura.

## 16. Definicion del MVP

El MVP debe demostrar el principio "gestionar una vez y publicar automaticamente".

### Incluido en MVP

- Next.js + TypeScript + Tailwind.
- PostgreSQL administrado configurado.
- Auth: login, logout, recuperacion y sesion mediante Auth.js o proveedor administrado.
- `app_users` y `profiles`.
- RBAC basico: administrador, coordinador, semillerista.
- RLS inicial en todas las tablas del MVP.
- Integrantes.
- Lineas de investigacion.
- Tecnologias.
- Proyectos.
- Integrantes por proyecto.
- Hitos.
- Recursos y multimedia basica.
- Publicaciones basicas.
- Portal publico: home, proyectos, detalle, investigacion, equipo, publicaciones, contacto.
- Panel interno: dashboard basico, proyectos, integrantes, lineas, tecnologias.

### No incluido en MVP

- Editor avanzado de articulos.
- Eventos/logros completos.
- Convocatorias y solicitudes.
- CMS extensivo.
- Analitica avanzada.
- Automatizaciones externas.

## 17. Roadmap V1 y V2

### MVP / V1.0

Base institucional y proyectos: autenticacion, RBAC basico, proyectos, integrantes, lineas, tecnologias, hitos, publicaciones basicas y portal publico.

### V1.1 - Contenido editorial

- Articulos.
- Tags y categorias.
- Workflow editorial.
- SEO avanzado por articulo.
- Relacion articulo-proyecto.

### V1.2 - Comunidad e impacto

- Eventos.
- Logros.
- Aliados.
- Galerias publicas.
- Relaciones con proyectos e integrantes.

### V1.3 - Convocatorias y solicitudes

- Convocatorias publicas.
- Formulario de postulacion.
- Workflow de revision.
- Notificaciones basicas por correo mediante proveedor externo si se vuelve necesario.

### V1.4 - Dashboard y analitica

- Dashboard operativo.
- Vistas agregadas.
- Auditoria visible.
- Indicadores por linea, tecnologia, estado y periodo.

### V2 - Gestion avanzada

- Plantillas de proyectos.
- Seguimiento avanzado de entregables.
- Reportes academicos.
- Exportacion de informacion.
- Integraciones con repositorios, ORCID, Google Scholar o CvLAC si aportan valor.
- Automatizaciones serverless solo cuando no exista alternativa segura desde Next.js/PostgreSQL RLS.

## 18. Estrategia de testing

### Frontend

| Tipo | Herramienta | Prioridad |
|---|---|---|
| Unit tests | Vitest | Servicios, utils, validaciones |
| Component tests | Testing Library | Formularios, tablas, estados |
| E2E | Playwright | Login, CRUD proyecto, publicacion, solicitud |
| Accesibilidad | axe/playwright | Rutas publicas y formularios |
| Responsive | Playwright screenshots | Home, proyectos, dashboard |

### Base de datos y RLS

- Tests SQL para politicas.
- Casos `app_public`, `app_user`, lider, editor, coordinador, admin.
- Verificar allow/deny para `select`, `insert`, `update`, `delete`.
- Fixtures por rol.
- Pruebas de Vercel Blob: lectura publica, archivos privados servidos desde funciones y permisos por rol.

### Procesos criticos

Prioridad alta:

- Login y sesion.
- Lectura publica limitada a `PUBLIC`.
- Creacion/edicion/publicacion de proyectos.
- Permisos de lider de proyecto.
- Solicitudes publicas sin lectura publica.
- Upload de archivos con permisos correctos.

## 19. Seguridad

### Principios

- El frontend no es frontera de seguridad.
- Toda tabla sensible debe tener RLS.
- Los permisos se verifican en PostgreSQL.
- La UI solo mejora experiencia, no reemplaza politicas.
- Minimo privilegio por defecto.

### Claves y variables de entorno

Permitidas en frontend:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_STORAGE_PUBLIC_URL
```

Nunca exponer:

```text
DATABASE_URL
POSTGRES_PASSWORD
AUTH_SECRET
BLOB_READ_WRITE_TOKEN
```

Las credenciales de base de datos, secretos de autenticacion y claves privadas de storage solo pueden vivir en entornos server-side seguros: Vercel/hosting, CI/CD o scripts administrativos. No deben estar en codigo cliente ni variables `NEXT_PUBLIC_*`.

### Validacion

- Validar formularios con Zod.
- Constraints en PostgreSQL.
- Checks para estados.
- Unique indexes para slugs.
- Sanitizacion del contenido editorial.
- Control de tamano y MIME en archivos.

### Auditoria

Acciones a registrar:

- Proyecto creado.
- Proyecto actualizado.
- Proyecto publicado.
- Integrante actualizado.
- Articulo publicado.
- Solicitud aceptada/rechazada.
- Permisos modificados.

Implementacion:

- Triggers PostgreSQL en tablas criticas.
- Funcion `log_audit_event`.
- `current_app_user_id()` como actor cuando la operacion se ejecute con sesion.
- Auditoria protegida por RLS: solo coordinador/admin.

## 20. Despliegue

Arquitectura recomendada:

```text
Frontend Next.js
      |
Vercel
      |
PostgreSQL administrado
      |
Vercel Blob
      |
Auth.js o proveedor de identidad
```

### Ambientes

| Ambiente | Uso |
|---|---|
| Local | Desarrollo con PostgreSQL local mediante Docker o base dev |
| Staging | Pruebas de integracion y contenido |
| Production | Portal y plataforma reales |

### Alternativas

- Netlify: viable para Next.js, pero no recomendada si la decision es centralizar despliegue y storage en Vercel.
- Railway/Render: viables como alternativa general, pero no recomendadas para esta arquitectura Vercel-first.

Vercel es la opcion principal por integracion con Next.js, preview deployments, variables de entorno, Vercel Blob, funciones server-side y Marketplace para conectar PostgreSQL administrado.

## 21. Riesgos tecnicos

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| RLS mal configurado | Exposicion de datos | Tests RLS, revision por rol, minimo privilegio |
| Consultas dispersas en componentes | Baja mantenibilidad | Repositories por feature |
| Modelo poco normalizado | Duplicidad e inconsistencias | Tablas puente y constraints |
| Publicar contenido incompleto | Portal inconsistente | Workflow, validaciones y previews |
| Blob publico por error | Filtracion de archivos | Stores separados, rutas privadas y validacion server-side |
| Exceso de librerias | Complejidad innecesaria | Introducir solo cuando resuelva un problema real |
| Slugs duplicados | URLs rotas | Unique indexes y validacion |
| N+1 queries | Bajo rendimiento | Queries compuestas, vistas, paginacion |
| Credenciales de PostgreSQL expuestas | Compromiso total | Nunca usar en frontend |

## 22. Recomendaciones para escalar en el futuro

- Mantener el modelo relacional como fuente de verdad.
- Agregar vistas SQL para consultas publicas frecuentes.
- Usar funciones SQL solo cuando simplifiquen permisos o agregaciones.
- Separar datos publicables mediante `visibility`, no mediante tablas duplicadas.
- Incorporar funciones serverless solo para tareas que no puedan hacerse con Next.js y PostgreSQL: webhooks, correos transaccionales, integraciones externas o procesos con secretos.
- Documentar permisos y politicas junto a las migraciones.
- Usar seeds controlados para roles, permisos, lineas y tecnologias iniciales.
- Revisar indices con datos reales despues del MVP.
- Mantener componentes accesibles y reutilizables desde el inicio.
- Diseñar el dashboard con preguntas operativas, no con graficos decorativos.

## Referencias tecnicas consultadas

- Next.js Metadata Files y rutas `sitemap.ts`/`robots.ts`: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
- Next.js `generateMetadata`: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- PostgreSQL Row Security Policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- PostgreSQL `set_config` y parametros de sesion: https://www.postgresql.org/docs/current/functions-admin.html
- Auth.js: https://authjs.dev/
- Vercel Blob: https://vercel.com/docs/vercel-blob
- Vercel Blob SDK: https://vercel.com/docs/vercel-blob/using-blob-sdk
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Vercel Marketplace: https://vercel.com/marketplace
