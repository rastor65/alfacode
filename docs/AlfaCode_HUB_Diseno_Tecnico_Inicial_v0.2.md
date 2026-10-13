# AlfaCode HUB (SGPAI)

## DiseÃ±o tÃ©cnico inicial â€” v0.2

**Fecha:** 11 de octubre de 2026
**Estado:** borrador de trabajo, sujeto a cambios
**Documento relacionado:** *AlfaCode HUB â€” Documento completo de planificaciÃ³n v0.2*
**Cambio de esta versiÃ³n:** SQLite para desarrollo local y PostgreSQL para producciÃ³n en Railway.

> Este documento convierte la idea funcional de AlfaCode HUB en decisiones tÃ©cnicas iniciales para comenzar el desarrollo. No constituye una especificaciÃ³n institucional definitiva.

> **Nota de vigencia 2026-10-12:** PostgreSQL se mantiene como objetivo futuro para produccion/Railway, pero queda pausado temporalmente por decision del responsable. Hasta nueva autorizacion, las tareas de datos se verifican con SQLite y no se declara compatibilidad PostgreSQL completada.

## 1. Objetivo de esta etapa

Preparar una base tÃ©cnica para construir el primer producto mÃ­nimo funcional (MVP): autenticaciÃ³n, integrantes, proyectos, equipos, tareas y gestiÃ³n **opcional** de sprints. Los demÃ¡s mÃ³dulos se implementarÃ¡n por fases.

## 2. Arquitectura propuesta

| Componente | DecisiÃ³n inicial | Nota |
|---|---|---|
| Frontend | Next.js + React + TypeScript | AplicaciÃ³n web para los integrantes |
| Backend | Node.js + NestJS | API REST organizada por mÃ³dulos |
| Base de datos de desarrollo | SQLite | Base de datos local predeterminada, en un archivo; no requiere servidor |
| Base de datos de producciÃ³n | PostgreSQL | Base de datos persistente del despliegue en Railway |
| Pruebas de compatibilidad | PostgreSQL | Se realizarÃ¡n antes de desplegar cambios que afecten los datos |
| Acceso a datos | TypeORM (propuesto) | ConfiguraciÃ³n segÃºn el entorno; soporte para SQLite y PostgreSQL |
| Despliegue | Railway | Servicios separados para frontend, backend y PostgreSQL |
| Repositorio | Git; GitHub (propuesto) | Un repositorio para el sistema |
| Arquitectura de aplicaciÃ³n | Monolito modular | Un backend, organizado por dominios |

**DecisiÃ³n sobre bases de datos:** el desarrollo cotidiano utilizarÃ¡ **SQLite**. El despliegue en Railway utilizarÃ¡ **PostgreSQL**. Se compartirÃ¡n las entidades y la lÃ³gica de negocio siempre que sea posible, pero se verificarÃ¡ la compatibilidad del esquema, las consultas y las migraciones para ambos motores. No se asumirÃ¡ que los scripts SQL sean intercambiables.

### 2.1. ConfiguraciÃ³n por entorno

| Entorno | Motor | ConfiguraciÃ³n prevista |
|---|---|---|
| Desarrollo local (`development`) | SQLite | Archivo local, por ejemplo `backend/data/alfacode-hub.sqlite` |
| Pruebas de integraciÃ³n antes del despliegue (`test-postgres`) | PostgreSQL | Instancia de prueba, separada de producciÃ³n; puede ejecutarse con Docker |
| ProducciÃ³n (`production`) | PostgreSQL | Servicio PostgreSQL de Railway, configurado mediante variables de entorno |

La aplicaciÃ³n seleccionarÃ¡ **una sola conexiÃ³n** segÃºn las variables de entorno; no necesita mantener conectados ambos motores simultÃ¡neamente. La base SQLite y las credenciales locales no se subirÃ¡n al repositorio.

Ejemplo orientativo de `backend/.env.example` para desarrollo:

```dotenv
NODE_ENV=development
DB_TYPE=sqlite
SQLITE_PATH=./data/alfacode-hub.sqlite
```

Para producciÃ³n se configurarÃ¡n, como mÃ­nimo, `DB_TYPE=postgres` y `DATABASE_URL` mediante las variables seguras de Railway. No se escribirÃ¡n credenciales reales en `.env.example`, en la documentaciÃ³n ni en Git. La ruta SQLite se resolverÃ¡ de forma estable desde el backend para evitar depender del directorio desde el que se ejecute el proceso.

### 2.2. Compatibilidad y migraciones

1. Mantener **TypeORM** como propuesta inicial y configurar su `DataSource` en funciÃ³n de `DB_TYPE`.
2. Evitar depender de caracterÃ­sticas exclusivas de PostgreSQL en entidades y consultas que tambiÃ©n deban funcionar en SQLite (por ejemplo, `jsonb`, arreglos nativos o tipos `enum` de PostgreSQL).
3. Cuando el esquema cambie, crear o adaptar las migraciones requeridas para **cada motor**; no copiar SQL generado para un motor y ejecutarlo sin revisiÃ³n en el otro.
4. Mantener `synchronize: false` en producciÃ³n. Preferir migraciones versionadas como mecanismo de cambios de esquema; la sincronizaciÃ³n automÃ¡tica solo podrÃ­a emplearse temporalmente sobre bases locales descartables, nunca como sustituto de las migraciones de producciÃ³n.
5. Validar con PostgreSQL los cambios de tablas, restricciones, Ã­ndices y consultas **antes del despliegue**, aunque la funcionalidad ya funcione con SQLite.
6. No trasladar automÃ¡ticamente el archivo SQLite local a la base productiva: en el MVP se tratarÃ¡ como datos de desarrollo. Si mÃ¡s adelante se requiere migrar datos reales, se prepararÃ¡ un proceso explÃ­cito de exportaciÃ³n, transformaciÃ³n y validaciÃ³n.

**Versiones:** instalar una versiÃ³n compatible y con soporte de Node.js, Next.js/React y NestJS; fijar las versiones reales en los archivos de dependencias y en la documentaciÃ³n una vez creado el repositorio. No depender de versiones `latest` indefinidamente.

### Esquema de comunicaciÃ³n

```text
Navegador del integrante
          |
          v
     Frontend Next.js/React
          |
       HTTPS / JSON
          |
          v
       API NestJS
  (autenticaciÃ³n, permisos,
    proyectos y sprints)
          |
     segÃºn entorno
       /       \
      v         v
 SQLite local  PostgreSQL
 (desarrollo)  (Railway)
```

El frontend nunca accederÃ¡ directamente a la base de datos. Las verificaciones de permisos se realizarÃ¡n en el backend, no Ãºnicamente ocultando botones o rutas del frontend.

## 3. Estructura inicial del repositorio

```text
alfacode-hub/
â”œâ”€â”€ frontend/                 # AplicaciÃ³n Next.js/React
â”‚   â””â”€â”€ src/app/
â”‚       â”œâ”€â”€ core/             # AutenticaciÃ³n, guards, cliente HTTP
â”‚       â”œâ”€â”€ shared/           # Componentes reutilizables
â”‚       â””â”€â”€ features/
â”‚           â”œâ”€â”€ auth/
â”‚           â”œâ”€â”€ integrantes/
â”‚           â”œâ”€â”€ proyectos/
â”‚           â””â”€â”€ dashboard/
â”œâ”€â”€ backend/                  # AplicaciÃ³n NestJS
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ common/           # Guardias, validaciones, utilidades
â”‚       â”œâ”€â”€ database/         # ConfiguraciÃ³n por entorno y migraciones
â”‚       â”‚   â””â”€â”€ migrations/    # Migraciones revisadas para SQLite y PostgreSQL
â”‚       â””â”€â”€ modules/
â”‚           â”œâ”€â”€ auth/
â”‚           â”œâ”€â”€ users/
â”‚           â”œâ”€â”€ roles/
â”‚           â”œâ”€â”€ membership/
â”‚           â”œâ”€â”€ projects/
â”‚           â”œâ”€â”€ sprints/
â”‚           â””â”€â”€ tasks/
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ planificacion.md
â”‚   â””â”€â”€ diseno-tecnico-inicial.md
â”œâ”€â”€ .gitignore               # Excluir backend/data/, *.sqlite, *.sqlite3, *.db y .env
â””â”€â”€ README.md
```

Esta es una propuesta de organizaciÃ³n, no una estructura que deba mantenerse sin cambios. Los mÃ³dulos pueden compartir servicios comunes, pero la lÃ³gica especÃ­fica debe permanecer en su dominio. La carpeta `backend/data/` podrÃ¡ crearse localmente al iniciar el sistema; no deberÃ¡ versionarse con su contenido.

## 4. Modelo de datos mÃ­nimo del MVP

No diseÃ±aremos todavÃ­a todas las tablas de los nueve mÃ³dulos. Estas entidades cubren Ãºnicamente la primera versiÃ³n.

| Entidad / tabla | Campos principales (propuestos) | PropÃ³sito |
|---|---|---|
| `users` | `id`, `full_name`, `email`, `password_hash`, `status`, `created_at` | Cuenta y perfil bÃ¡sico |
| `roles` | `id`, `code`, `name` | Rol institucional: administrador, coordinador, docente/lÃ­der, investigador o estudiante |
| `user_roles` | `user_id`, `role_id` | Asignar uno o mÃ¡s roles institucionales cuando sea necesario |
| `membership_requests` | `id`, `user_id`, `status`, `reviewed_by`, `reviewed_at` | Solicitudes de ingreso y decisiones de aprobaciÃ³n |
| `invitations` | `id`, `email`, `token_hash`, `role_id`, `expires_at`, `accepted_at`, `created_by` | Invitaciones administrativas seguras |
| `projects` | `id`, `name`, `description`, `type`, `methodology`, `status`, `created_by` | Registro de proyectos y su modalidad de trabajo |
| `project_members` | `project_id`, `user_id`, `project_role`, `joined_at` | ParticipaciÃ³n como lÃ­der o colaborador |
| `sprints` | `id`, `project_id`, `name`, `goal`, `start_date`, `end_date`, `status` | Ciclos de trabajo para proyectos Ã¡giles |
| `tasks` | `id`, `project_id`, `sprint_id`, `assignee_id`, `title`, `description`, `status`, `priority`, `due_date` | Trabajo pendiente y asignado a integrantes |

**Campos comunes sugeridos:** `created_at`, `updated_at` y, cuando corresponda, quiÃ©n realizÃ³ cambios relevantes. Los identificadores podrÃ¡n implementarse con UUID generados desde la aplicaciÃ³n, verificando su representaciÃ³n en SQLite y PostgreSQL. Se priorizarÃ¡n tipos y restricciones compatibles entre ambos motores.

### Relaciones principales

```text
users 1 â”€â”€â”€ N membership_requests
users N â”€â”€â”€ N roles                 (mediante user_roles)
users N â”€â”€â”€ N projects              (mediante project_members)
projects 1 â”€â”€â”€ N project_members
projects 1 â”€â”€â”€ N tasks
projects 1 â”€â”€â”€ N sprints            (solo modalidad Ã¡gil)
sprints 1 â”€â”€â”€ N tasks               (asociaciÃ³n opcional)
users 1 â”€â”€â”€ N tasks                 (responsable opcional)
```

### Reglas importantes

1. Un proyecto podrÃ¡ trabajar en modalidad **tradicional** o **Ã¡gil**.
2. Las tareas pertenecerÃ¡n siempre a un proyecto. `sprint_id` serÃ¡ **opcional**: si estÃ¡ vacÃ­o, la tarea podrÃ¡ permanecer en el backlog del proyecto o gestionarse sin sprints.
3. En la modalidad tradicional no se asignarÃ¡n tareas a sprints.
4. Un sprint pertenecerÃ¡ a un Ãºnico proyecto; una tarea solo podrÃ¡ asociarse a un sprint de **ese mismo proyecto**.
5. La persona responsable de una tarea deberÃ¡ pertenecer al equipo del proyecto, salvo una excepciÃ³n explÃ­cita definida posteriormente.
6. En la primera versiÃ³n, un proyecto Ã¡gil tendrÃ¡ como mÃ¡ximo **un sprint activo** a la vez.
7. Al cerrar un sprint, sus tareas incompletas se moverÃ¡n explÃ­citamente al backlog o a otro sprint; no se marcarÃ¡n como completadas automÃ¡ticamente.
8. Los roles de proyecto (`leader`, `collaborator`) serÃ¡n independientes de los roles institucionales.
9. Las cuentas pendientes de aprobaciÃ³n no tendrÃ¡n acceso normal a la plataforma.
10. Las decisiones sobre solicitudes, accesos y cambios relevantes deberÃ¡n dejar un registro mÃ­nimo de quiÃ©n actuÃ³ y cuÃ¡ndo.

**Estados preliminares:** proyectos (`proposed`, `planning`, `active`, `paused`, `completed`, `cancelled`); sprints (`planned`, `active`, `closed`); tareas (`todo`, `in_progress`, `in_review`, `done`). Son valores internos y podrÃ¡n mostrarse traducidos en la interfaz.

## 5. MÃ³dulos del backend para el MVP

| MÃ³dulo | Responsabilidad |
|---|---|
| `auth` | Registro, inicio de sesiÃ³n, recuperaciÃ³n de acceso y sesiones |
| `users` | Perfil, consulta y administraciÃ³n de integrantes |
| `roles` | Roles institucionales y control de permisos |
| `membership` | Solicitudes de vinculaciÃ³n e invitaciones |
| `projects` | InformaciÃ³n, estados, integrantes y responsables de proyectos |
| `sprints` | CreaciÃ³n, activaciÃ³n y cierre de sprints opcionales |
| `tasks` | Tareas, backlog, responsables, prioridades y estados |

La autenticaciÃ³n definirÃ¡ inicialmente cÃ³mo mantener la sesiÃ³n de forma segura. Para el MVP se evaluarÃ¡ una soluciÃ³n con cookies `HttpOnly` y controles de CSRF cuando corresponda, o un mecanismo equivalente que evite exponer secretos de sesiÃ³n al cÃ³digo del navegador. Nunca almacenar contraseÃ±as en texto plano: utilizar un algoritmo de hash para contraseÃ±as recomendado para este fin (por ejemplo, Argon2id).

## 6. Pantallas iniciales de Next.js/React

1. **Inicio de sesiÃ³n** y recuperaciÃ³n de acceso.
2. **Solicitud de registro** e invitaciÃ³n.
3. **Panel principal** con informaciÃ³n resumida segÃºn el usuario.
4. **Mi perfil**.
5. **Integrantes** (listado y administraciÃ³n para roles autorizados).
6. **Proyectos** (listado, formulario y detalle).
7. **Equipo del proyecto**.
8. **Tareas del proyecto** (lista o tablero sencillo).
9. **Sprints** (solamente si el proyecto utiliza modalidad Ã¡gil).

Las rutas deberÃ¡n tener guardias de navegaciÃ³n para mejorar la experiencia, pero la autorizaciÃ³n real estarÃ¡ en el backend.

## 7. API REST inicial (borrador)

Usaremos como prefijo de ejemplo `/api/v1`.

| MÃ©todo | Ruta | AcciÃ³n |
|---|---|---|
| `GET` | `/health` | Verificar servicio y conexiÃ³n a la base de datos |
| `POST` | `/auth/register` | Crear una solicitud de registro |
| `POST` | `/auth/login` | Iniciar sesiÃ³n |
| `POST` | `/auth/logout` | Cerrar sesiÃ³n |
| `GET` | `/users/me` | Consultar perfil propio |
| `GET` | `/membership-requests` | Consultar solicitudes (autorizados) |
| `PATCH` | `/membership-requests/:id` | Aprobar o rechazar una solicitud |
| `POST` | `/invitations` | Crear una invitaciÃ³n (autorizados) |
| `POST` | `/invitations/accept` | Aceptar invitaciÃ³n vÃ¡lida |
| `GET / POST` | `/projects` | Listar y crear proyectos |
| `GET / PATCH` | `/projects/:id` | Consultar o actualizar un proyecto |
| `POST` | `/projects/:id/members` | AÃ±adir integrantes al proyecto |
| `GET / POST` | `/projects/:id/tasks` | Listar o crear tareas |
| `PATCH` | `/projects/:id/tasks/:taskId` | Actualizar una tarea |
| `GET / POST` | `/projects/:id/sprints` | Listar o crear sprints |
| `PATCH` | `/projects/:id/sprints/:sprintId` | Actualizar el estado de un sprint |

Estas rutas son una guÃ­a; los cuerpos de solicitud, validaciones y permisos se detallarÃ¡n al implementar cada funcionalidad.

## 8. Primer incremento de desarrollo: Fase 0

**Objetivo:** comprobar que la base tÃ©cnica funciona antes de implementar usuarios o proyectos.

### Actividades

- [ ] Verificar repositorio, estructura y `README.md` existentes; registrar faltantes sin reinicializar.
- [ ] Verificar la aplicacion Next.js/React existente dentro de `frontend/` y sus dependencias instaladas.
- [ ] Verificar backend NestJS existente dentro de `backend/`.
- [ ] Instalar las dependencias del ORM y del controlador SQLite seleccionado.
- [ ] Configurar SQLite en un archivo local e integrar su conexiÃ³n con NestJS.
- [ ] Preparar la configuraciÃ³n para PostgreSQL a travÃ©s de variables de entorno (`DB_TYPE`, `DATABASE_URL`).
- [ ] Configurar un `.env.example` sin credenciales, y excluir `.env` y archivos SQLite del repositorio.
- [ ] Definir la estrategia de migraciones para SQLite y PostgreSQL antes de crear las primeras tablas del MVP.
- [ ] Crear `GET /api/v1/health` y una pÃ¡gina simple en Next.js/React que consulte la API.
- [ ] AÃ±adir manejo bÃ¡sico de errores, validaciÃ³n y configuraciÃ³n de CORS.
- [ ] Registrar estado y comandos ejecutados; no hacer commits ni push sin autorizacion.

### Criterios para dar por terminada la Fase 0

- Next.js se inicia localmente.
- NestJS responde a una peticiÃ³n HTTP.
- El backend se conecta a **SQLite** y puede ejecutar una consulta de verificaciÃ³n.
- La pantalla inicial consulta exitosamente la API.
- El sistema permite configurar PostgreSQL sin modificar el cÃ³digo de los mÃ³dulos de negocio (la verificaciÃ³n real del esquema se realizarÃ¡ antes del primer despliegue).
- No hay contraseÃ±as, secretos ni archivos de bases locales expuestos en el repositorio.
- Existe una guÃ­a breve para ejecutar el proyecto desde cero sin instalar un servidor de base de datos.

## 9. Orden inmediatamente posterior

1. **Fase 1A:** modelo `users`, registro con aprobaciÃ³n y autenticaciÃ³n.
2. **Fase 1B:** roles, invitaciones y gestiÃ³n bÃ¡sica de integrantes.
3. **Fase 2A:** proyectos y miembros de equipo.
4. **Fase 2B:** tareas y backlog.
5. **Fase 2C:** sprints opcionales (crear, activar, asignar tareas y cerrar).

El tablero Kanban puede aparecer durante la Fase 2B o 2C, siempre que reutilice los mismos estados y tareas.

**Puerta de calidad previa al primer despliegue:** crear una base PostgreSQL de pruebas, aplicar las migraciones correspondientes y ejecutar allÃ­ los flujos bÃ¡sicos (usuarios, proyectos, sprints y tareas). El hecho de que funcionen en SQLite no serÃ¡ criterio suficiente para publicar en Railway.

## 10. Decisiones que quedan abiertas

- Confirmar TypeORM como ORM o seleccionar otra alternativa antes de crear migraciones.
- Elegir el controlador SQLite y los comandos para ejecutar las migraciones de cada motor.
- Acordar los permisos concretos de coordinador y lÃ­der de proyecto.
- Determinar la polÃ­tica de registro pÃºblico e invitaciones.
- Elegir el mecanismo definitivo de sesiÃ³n/autenticaciÃ³n.
- Decidir mÃ¡s adelante dÃ³nde se guardarÃ¡n documentos y evidencias.
- Definir cuÃ¡ndo serÃ¡ Ãºtil desplegar una versiÃ³n de pruebas en Railway y cÃ³mo se ejecutarÃ¡n las pruebas con PostgreSQL antes de cada despliegue.

**Siguiente tarea recomendada:** ejecutar la Fase 0 y registrar en el repositorio las decisiones que hayan quedado fijadas por el cÃ³digo.

## Referencias tÃ©cnicas para la implementaciÃ³n

- Next.js — documentacion oficial: <https://nextjs.org/docs>
- NestJS â€” primeros pasos: https://docs.nestjs.com/first-steps
- NestJS â€” integraciÃ³n con TypeORM: https://docs.nestjs.com/data/typeorm
- TypeORM â€” configuraciÃ³n de migraciones: https://typeorm.io/docs/migrations/setup/
- Railway â€” despliegue de monorepos: https://docs.railway.com/deployments/monorepo
- Railway â€” despliegue de NestJS: https://docs.railway.com/guides/nest

---

**AlfaCode HUB â€” Documento tÃ©cnico preliminar v0.2.** Complementa, no reemplaza, el documento funcional v0.2. La elecciÃ³n de SQLite para desarrollo y PostgreSQL para producciÃ³n queda reflejada en esta versiÃ³n.
