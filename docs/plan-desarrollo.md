# AlfaCode HUB (SGPAI) â€” Plan de desarrollo ejecutable para agente de IA

**VersiÃ³n:** 1.0
**Fecha:** 11 de octubre de 2026
**Estado:** guÃ­a tÃ©cnica de ejecuciÃ³n para un proyecto en etapa inicial; NO es una aprobaciÃ³n institucional
**Idioma del producto:** espaÃ±ol
**Alcance:** plataforma web interna del Semillero de InvestigaciÃ³n AlfaCode
**Fuentes del proyecto:** `docs/AlfaCode_HUB_Documento_Completo_v0.2.md` y `docs/AlfaCode_HUB_Diseno_Tecnico_Inicial_v0.2.md`

> **INSTRUCCIÃ“N PRINCIPAL PARA EL AGENTE:** Ejecuta las fases en orden, entrega incrementos pequeÃ±os verificables y **no declares finalizada una tarea o fase sin comprobar sus criterios de aceptaciÃ³n**. No agregues mÃ³dulos, dependencias, servicios externos o funcionalidades fuera de este plan por iniciativa propia. Registra cualquier decisiÃ³n no prevista y solicita aprobaciÃ³n cuando afecte alcance, costes, seguridad, datos existentes o servicios externos.

---

> **Uso con agentes:** leer `AGENTS.md` antes de este plan. `/docs` es la fuente de requisitos y diseÃ±o; `/context` guarda procedimientos, progreso y el trabajo autorizado. Para ejecutar tareas, consultar `context/tarea-actual.md`.

> **Nota de vigencia 2026-10-12:** por decision del responsable, PostgreSQL queda pausado temporalmente. Las tareas, criterios y pruebas que mencionan PostgreSQL se conservan como objetivo futuro de produccion/Railway, pero no bloquean el trabajo inmediato sobre SQLite hasta nueva autorizacion explicita. No declarar compatibilidad PostgreSQL completada mientras este pausado.

## 0. CÃ³mo interpretar este documento

### 0.1. Prioridad de instrucciones

1. Instrucciones explÃ­citas posteriores del responsable del proyecto.
2. Este plan de ejecuciÃ³n, una vez aprobado para el trabajo concreto.
3. DiseÃ±o tÃ©cnico inicial v0.2.
4. Documento de planificaciÃ³n funcional v0.2.
5. Convenciones de los frameworks y documentaciÃ³n oficial.

Ante contradicciones, **no elijas silenciosamente**: deja constancia en `docs/decisiones.md`, explica el conflicto y detÃ©n **solo la tarea afectada** hasta obtener una decisiÃ³n. ContinÃºa con tareas independientes si es seguro hacerlo.

### 0.2. Vocabulario de cumplimiento

- **DEBE / NO DEBE:** requisito obligatorio.
- **PUEDE:** opcional; no implementar sin necesidad identificada.
- **PROPUESTO:** opciÃ³n de trabajo revisable; no confundir con una decisiÃ³n institucional.
- **Bloqueo:** impide dar una tarea por terminada; no autoriza a inventar una soluciÃ³n.

### 0.3. Reglas generales de ejecuciÃ³n para el agente

- Trabajar en el repositorio existente si lo hay. **No sobreescribir, borrar ni reinicializar** trabajo previo sin revisar el estado de Git.
- **No crear repositorios remotos, servicios de Railway, dominios, gastos, cuentas reales ni despliegues pÃºblicos sin autorizaciÃ³n explÃ­cita.** Puede preparar los archivos y procedimientos necesarios.
- Antes de cada cambio: inspeccionar cÃ³digo, configuraciÃ³n, migraciones y tests existentes; describir brevemente quÃ© modificarÃ¡.
- Implementar una historia a la vez. Preferir cambios pequeÃ±os con pruebas y documentaciÃ³n.
- Mantener la lÃ³gica de autorizaciÃ³n en el backend; las restricciones visuales del frontend son solo apoyo.
- Usar datos ficticios en desarrollo y pruebas. No introducir informaciÃ³n personal real del semillero sin autorizaciÃ³n.
- No almacenar secretos, contraseÃ±as, tokens de invitaciÃ³n, cookies de sesiÃ³n o archivos SQLite en Git, logs o capturas de prueba.
- Ejecutar linters, compilaciones, migraciones y pruebas reales; **no dar por comprobado algo que no se ha ejecutado**.
- Si una herramienta no estÃ¡ disponible, documentar el bloqueo y cÃ³mo reproducir la comprobaciÃ³n pendiente.
- No cambiar el ORM, framework backend, estrategia de autenticaciÃ³n, entorno de datos ni esquema de permisos sin actualizar primero `docs/decisiones.md` y obtener aprobaciÃ³n si el cambio tiene impacto relevante.
- No anticipar funcionalidades de fases posteriores excepto cuando sea imprescindible preparar una interfaz o un contrato sin implementar.

### 0.4. Entregable de cada tarea

Cada tarea terminada deberÃ¡ informar, de forma breve:

```text
ID y nombre de la tarea:
Archivos creados/modificados:
Comportamiento implementado:
Comandos de validaciÃ³n ejecutados y resultado:
Pruebas aÃ±adidas:
Migraciones creadas o modificadas (si aplica):
Riesgos o decisiones pendientes:
Estado: completada | bloqueada | pendiente
```

Una fase se considera finalizada Ãºnicamente cuando **todas** sus tareas obligatorias, pruebas y criterios de salida estÃ©n satisfechos. Mantener `context/estado-actual.md` actualizado con el progreso real y respetar el alcance de `context/tarea-actual.md`.

---

## 1. Definiciones funcionales invariables del MVP

### 1.1. Producto

AlfaCode HUB serÃ¡ una plataforma integral de gestiÃ³n interna. Sus **nueve mÃ³dulos** son:

1. GestiÃ³n de integrantes.
2. GestiÃ³n de proyectos.
3. GestiÃ³n investigativa.
4. ProducciÃ³n acadÃ©mica.
5. GestiÃ³n de eventos y actividades.
6. GestiÃ³n documental.
7. Seguimiento y evaluaciÃ³n.
8. GestiÃ³n administrativa.
9. Reportes y estadÃ­sticas.

**El primer MVP comprende las fases 0, 1 y 2**. Los demÃ¡s mÃ³dulos se integrarÃ¡n despuÃ©s; no crear pÃ¡ginas Â«funcionalesÂ» con datos ficticios que aparenten capacidades aÃºn no implementadas.

### 1.2. Usuarios y roles

Roles institucionales iniciales: `admin`, `coordinator`, `teacher_leader`, `researcher`, `student`. La nomenclatura interna es en inglÃ©s para cÃ³digo; las etiquetas visibles son en espaÃ±ol. Un usuario podrÃ¡ tener varios roles institucionales mediante `user_roles`. Un **rol de proyecto** (`leader`, `collaborator`) es distinto del rol institucional.

La estructura jerÃ¡rquica real todavÃ­a debe validarse. **No inventar cargos oficiales**; utilizar estos perfiles como propuesta operativa del MVP.

### 1.3. Dos formas de vinculaciÃ³n

- **Solicitud de registro:** persona solicita acceso, se verifica la propiedad del correo antes de habilitar la cuenta y una autoridad acepta o rechaza la vinculaciÃ³n.
- **InvitaciÃ³n:** autoridad crea una invitaciÃ³n de un solo uso, con caducidad, para que la persona complete su registro con el rol autorizado.

Nunca conceder acceso ordinario a una solicitud `pending`. El primer administrador se configura mediante un proceso seguro de inicializaciÃ³n, no mediante credenciales por defecto.

### 1.4. GestiÃ³n de proyectos: dos modalidades

- `traditional`: tareas y entregables sin sprints.
- `agile`: tareas en backlog que pueden incorporarse a sprints.

**Un sprint es opcional.** Cada tarea pertenece obligatoriamente a un proyecto y puede tener `sprint_id = null`. En proyectos tradicionales **no debe** permitirse asignar sprints; una tarea Ã¡gil sin sprint pertenece al backlog. Cada proyecto Ã¡gil tendrÃ¡ **mÃ¡ximo un sprint activo** a la vez.

### 1.5. LÃ­mite del primer MVP

**Incluido:** autenticaciÃ³n, solicitudes e invitaciones, roles, perfiles, proyectos, miembros, tareas, backlog, tablero Kanban bÃ¡sico, sprints opcionales, seguimiento operativo simple.
**No incluido aÃºn:** publicaciÃ³n pÃºblica de contenidos, aplicaciÃ³n mÃ³vil, pagos, chat en tiempo real, automatizaciÃ³n de Scrum, evaluaciÃ³n avanzada, notificaciones push, reportes complejos, firma electrÃ³nica, integraciÃ³n con GitHub/ORCID/Google Calendar, mÃºltiples organizaciones.

---

## 2. Decisiones tÃ©cnicas para ejecutar sin ambigÃ¼edades

| Ãrea | DecisiÃ³n de trabajo | RestricciÃ³n |
|---|---|---|
| Interfaz | Next.js + React + TypeScript, componentes standalone, rutas lazy-loaded cuando convenga, formularios reactivos | No acceder a la base de datos desde el navegador |
| API | Node.js + NestJS, REST JSON bajo `/api/v1` | Monolito modular; NO microservicios |
| ORM | TypeORM | No cambiar a Prisma/Drizzle sin decisiÃ³n documentada |
| Desarrollo | **SQLite**, archivo `backend/data/alfacode-hub.sqlite` | El archivo y sus copias no se versionan |
| Compatibilidad | PostgreSQL de pruebas | Ejecutar antes de dar por aceptados cambios de esquema o flujos crÃ­ticos |
| ProducciÃ³n | **PostgreSQL en Railway** | No usar SQLite en producciÃ³n |
| Paquetes | npm con `package-lock.json` por aplicaciÃ³n | Instalar con `npm ci` en CI y despliegue |
| Identificadores | UUID generados por la aplicaciÃ³n | Representarlos como texto compatible entre motores |
| API | JSON y rutas versionadas | Errores y validaciones coherentes |
| AutenticaciÃ³n | SesiÃ³n opaca revocable, almacenada en base de datos y cookie `HttpOnly` | NO guardar tokens en `localStorage` |
| ContraseÃ±as | Hash Argon2id | Nunca almacenar ni registrar contraseÃ±as en texto claro |
| Pruebas | Unitarias + integraciÃ³n API + E2E de flujos centrales | Ejecutar contra SQLite y PostgreSQL donde aplique |
| DocumentaciÃ³n | Markdown en `docs/` | Actualizar al implementar o cambiar comportamiento |

**Versionado:** al iniciar la Fase 0, verificar las versiones instaladas de Next.js, React, Node.js, NestJS y TypeORM con documentacion oficial. Registrar las versiones exactas en `docs/versiones.md` y los archivos de dependencias; no usar `latest` como contrato permanente. Si las versiones no son compatibles, detener la instalacion y corregir la seleccion documentadamente.

### 2.1. Bases de datos: polÃ­tica obligatoria

1. `NODE_ENV=development` + `DB_TYPE=sqlite`: uso normal en local.
2. `DB_TYPE=postgres`: pruebas de integraciÃ³n y despliegue.
3. Configurar un `DataSource` por ejecuciÃ³n, seleccionado por variables de entorno. **Nunca** conectar dos bases a la vez por accidente.
4. Establecer `synchronize: false` **en todos los entornos**. Gestionar tablas con migraciones versionadas desde la primera entidad.
5. Preparar migraciones revisadas **por motor** cuando difieran los dialectos. Mantener un historial equivalente de cambios y probar arranque desde una base vacÃ­a y actualizaciÃ³n desde la revisiÃ³n anterior.
6. No usar `jsonb`, enums nativos o tipos especÃ­ficos de PostgreSQL en esquemas que tambiÃ©n deban ejecutar SQLite. Guardar fechas/hora en UTC; usar fechas calendario sin zona horaria cuando proceda.
7. Activar claves forÃ¡neas SQLite (`PRAGMA foreign_keys = ON`) y comprobarlo en pruebas.
8. En producciÃ³n, aplicar migraciones controladas antes de iniciar la nueva versiÃ³n del backend. **Nunca** usar sincronizaciÃ³n automÃ¡tica ni borrado/recreaciÃ³n de tablas.
9. No migrar Â«por defectoÂ» datos del SQLite de un desarrollador a PostgreSQL productivo.

### 2.2. Convenciones

- CÃ³digo TypeScript en inglÃ©s; textos, mensajes visibles y documentaciÃ³n en espaÃ±ol.
- Tablas/columnas SQL: `snake_case`; propiedades TypeScript y JSON: `camelCase`.
- IDs en URLs como UUID. Validar su formato en la API.
- Fechas de instantes: ISO 8601 UTC (`2026-10-11T20:15:00Z`); fechas de calendario: `YYYY-MM-DD`. Presentar fechas en zona `America/Bogota` salvo preferencia futura del usuario.
- Respuestas: `200` consulta/ediciÃ³n, `201` creaciÃ³n, `204` eliminaciÃ³n/desvinculaciÃ³n sin contenido, `400` validaciÃ³n, `401` no autenticado, `403` prohibido, `404` no encontrado o recurso no visible, `409` conflicto de estado, `422` regla de negocio invÃ¡lida cuando corresponda.
- Respuesta de error coherente, por ejemplo: `{"code":"PROJECT_NOT_EDITABLE","message":"El proyecto no admite cambios en este estado","details":null}`; no exponer trazas internas ni datos sensibles.
- Colecciones con `page=1`, `pageSize=20` por defecto, mÃ¡ximo `100`, respuesta `{"items":[],"page":1,"pageSize":20,"total":0}`.
- ValidaciÃ³n server-side de todos los DTO; ignorar/rechazar propiedades inesperadas mediante configuraciÃ³n global consistente; no admitir asignaciÃ³n masiva de campos protegidos (`role`, `status`, `createdBy`, etc.).
- Usar transacciones para operaciones que modifiquen varios registros relacionados.

### 2.3. AutenticaciÃ³n y lÃ­mites de seguridad

**ImplementaciÃ³n elegida para evitar alternativas incompatibles:** generar un token aleatorio criptogrÃ¡ficamente seguro en el login; enviar su valor solamente en una cookie de sesiÃ³n `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS; guardar **solo el hash SHA-256 del token** en la tabla `sessions`, con `user_id`, expiraciÃ³n y revocaciÃ³n. DuraciÃ³n inicial: 7 dÃ­as, sin renovaciÃ³n silenciosa. Logout revoca la sesiÃ³n actual y elimina la cookie. Cada peticiÃ³n protegida verifica sesiÃ³n vÃ¡lida **y estado actual del usuario**.

- En local HTTP se permite `Secure=false` solo bajo `NODE_ENV=development`; en producciÃ³n es obligatorio `Secure=true`.
- Preferir **un mismo origen web** para interfaz y `/api/v1`, usando proxy de Next.js o rewrites en desarrollo y proxy inverso en producciÃ³n. No abrir CORS con `*` para peticiones con cookies.
- Validar encabezado `Origin` en operaciones que modifican datos y agregar protecciÃ³n CSRF comprobable (token CSRF asociado a la sesiÃ³n en cabecera, o protecciÃ³n equivalente documentada). La cookie `SameSite` por sÃ­ sola **no sustituye** este control.
- Limitar intentos de login, registro, solicitud de recuperaciÃ³n e invitaciones. Mensajes de recuperaciÃ³n no deben revelar si existe el correo.
- Tokens de invitaciÃ³n, verificaciÃ³n y recuperaciÃ³n: aleatorios, de un solo uso, almacenados como hash y con caducidad; no registrarlos en logs.
- **Sin correo electrÃ³nico configurado**: se pueden probar enlaces con un buzÃ³n/transportador falso local, pero **no** habilitar auto-registro pÃºblico real ni declarar operativo el flujo de recuperaciÃ³n. La integraciÃ³n de correo transaccional deberÃ¡ estar validada antes de un piloto con registros reales.

---

## 3. Estructura prevista del repositorio

```text
alfacode-hub/
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/app/
â”‚   â”‚   â”œâ”€â”€ core/                # API, sesiÃ³n, guards, interceptores
â”‚   â”‚   â”œâ”€â”€ shared/              # Componentes reutilizables
â”‚   â”‚   â””â”€â”€ features/            # auth, integrantes, proyectos, dashboard
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ package-lock.json
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ common/              # DTO comunes, filtros, guards y polÃ­ticas
â”‚   â”‚   â”œâ”€â”€ database/
â”‚   â”‚   â”‚   â”œâ”€â”€ data-source/      # SQLite y PostgreSQL
â”‚   â”‚   â”‚   â””â”€â”€ migrations/
â”‚   â”‚   â”‚       â”œâ”€â”€ sqlite/
â”‚   â”‚   â”‚       â””â”€â”€ postgres/
â”‚   â”‚   â””â”€â”€ modules/             # auth, users, roles, membership,
â”‚   â”‚                            # projects, tasks, sprints...
â”‚   â”œâ”€â”€ data/                    # Datos SQLite locales: IGNORAR en Git
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ package-lock.json
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ AlfaCode_HUB_Documento_Completo_v0.2.md
â”‚   â”œâ”€â”€ AlfaCode_HUB_Diseno_Tecnico_Inicial_v0.2.md
â”‚   â”œâ”€â”€ plan-desarrollo.md
â”‚   â”œâ”€â”€ versiones.md                 # Se completa en F0-01
â”‚   â””â”€â”€ decisiones.md
â”œâ”€â”€ context/
â”‚   â”œâ”€â”€ README.md
â”‚   â”œâ”€â”€ instrucciones.md
â”‚   â”œâ”€â”€ convenciones.md
â”‚   â”œâ”€â”€ estado-actual.md
â”‚   â””â”€â”€ tarea-actual.md
â”œâ”€â”€ AGENTS.md
â”œâ”€â”€ .github/workflows/         # CI cuando se implemente
â”œâ”€â”€ .gitignore
â””â”€â”€ README.md
```

**No crear mÃ³dulos `placeholder` que simulen datos reales.** Crear carpetas segÃºn se implementen historias. Puede incorporarse un `package.json` raÃ­z para scripts de coordinaciÃ³n, manteniendo claros los scripts de cada aplicaciÃ³n.

### 3.1. Variables de entorno mÃ­nimas

```dotenv
# backend/.env.example (SIN secretos reales)
NODE_ENV=development
PORT=3000
DB_TYPE=sqlite
SQLITE_PATH=./data/alfacode-hub.sqlite
# Solo con DB_TYPE=postgres:
# DATABASE_URL=postgresql://usuario:CLAVE_LOCAL@localhost:5432/alfacode_hub_test
# WEB_ORIGIN=http://localhost:4200
# SESSION_COOKIE_NAME=alfacode_session
```

- La ruta SQLite se resolverÃ¡ respecto a la carpeta del backend, no al directorio de ejecuciÃ³n.
- Para Railway definir `NODE_ENV=production`, `DB_TYPE=postgres`, `DATABASE_URL` como referencia a PostgreSQL, origen web autorizado y configuraciÃ³n real de correo cuando aplique.
- Nunca imprimir `DATABASE_URL` completa, contraseÃ±as, claves ni secretos en logs.

---

## 4. Mapa de fases y dependencias

| Fase | Entrega principal | Requisito de entrada | Resultado verificable |
|---|---|---|---|
| **0. Fundamentos** | Monorepositorio, Next.js/React, NestJS, SQLite, migraciones y pruebas base | Plan leÃ­do y versiones compatibles seleccionadas | PÃ¡gina Next.js/React consume `/api/v1/health` |
| **1. Identidad e integrantes** | Registro, invitaciones, roles, sesiones, perfiles | Fase 0 aceptada | Usuario aprobado inicia sesiÃ³n; permisos reales operativos |
| **2. Proyectos, tareas y sprints** | Proyectos tradicionales y Ã¡giles; tablero | Fase 1 aceptada | **MVP funcional** validado en SQLite y PostgreSQL |
| **3. InvestigaciÃ³n y documentos** | LÃ­neas, metodologÃ­a, resultados y archivos | MVP aceptado | Proyectos vinculan informaciÃ³n investigativa y archivos privados |
| **4. ProducciÃ³n acadÃ©mica y actividades** | Productos, autorÃ­as, eventos, asistencia | Fase 3 aceptada | Historial acadÃ©mico y de participaciÃ³n consultable |
| **5. AdministraciÃ³n** | Solicitudes y procesos internos | Fase 4 aceptada | Solicitudes generales con revisiÃ³n y trazabilidad |
| **6. Seguimiento y reportes** | Indicadores, paneles y reportes | Fase 5 aceptada | EstadÃ­sticas coherentes y filtradas por permisos |

**Regla:** cada fase incluye diseÃ±o mÃ­nimo de datos, backend, frontend, pruebas y documentaciÃ³n. No existe una fase independiente de Â«hacer todas las pantallasÂ» ni de Â«hacer toda la base de datosÂ».

---

# FASE 0 â€” PreparaciÃ³n y fundamentos

**Meta:** una aplicaciÃ³n local mÃ­nima, reproducible, que conecte Next.js/React â†’ NestJS â†’ SQLite y estÃ© preparada para probar PostgreSQL. **No implementar usuarios ni proyectos todavÃ­a.**

### Tareas, en orden

- [ ] **F0-01. Inspeccionar el entorno.** Comprobar sistema operativo, Node/npm, estado Git, archivos existentes y compatibilidad de herramientas; registrar versiones exactas en `docs/versiones.md`.
- [ ] **F0-02. Verificar estructura del repositorio.** Comprobar `frontend/`, `backend/`, `docs/`, `context/`, `README.md`, `.editorconfig` y `.gitignore`; registrar faltantes sin borrar ni reinicializar contenido existente.
- [ ] **F0-03. Verificar frontend Next.js/React existente.** Usar Next.js/React instalado, App Router, Tailwind CSS y Turbopack existentes; verificar compilaciÃ³n y pÃ¡gina inicial. No aÃ±adir kit visual innecesario.
- [ ] **F0-04. Verificar backend NestJS existente.** Consultar dependencias instaladas, scripts, configuracion, endpoint de salud actual y faltantes para `/api/v1`; no reinicializar la aplicacion.
- [ ] **F0-05. Instalar TypeORM y SQLite.** Usar el controlador SQLite compatible verificado para la versiÃ³n elegida (por ejemplo `better-sqlite3`). Configurar creaciÃ³n de carpeta `data/` y conexiÃ³n desde entorno; habilitar claves forÃ¡neas.
- [ ] **F0-06. Preparar PostgreSQL.** Pausada temporalmente por decision del responsable; no ejecutar hasta nueva autorizacion. Cuando se retome: instalar `pg` y configuraciÃ³n alternativa de `DataSource`. AÃ±adir mecanismo reproducible para levantar PostgreSQL de pruebas, por ejemplo `compose.test.yml` local (no es el despliegue de Railway).
- [ ] **F0-07. Definir migraciones.** Mientras PostgreSQL este pausado, ejecutar/verificar solo con SQLite y registrar que PostgreSQL queda diferido. Cuando se retome: configurar scripts para ejecutar y revertir migraciones por motor. Crear una migraciÃ³n mÃ­nima verificable (por ejemplo `schema_bootstrap`) y comprobar que se aplica en una base vacÃ­a de ambos motores; no usar `synchronize`.
- [ ] **F0-08. Implementar salud.** `GET /api/v1/health` devuelve `200 {"status":"ok"}` solo si la API responde y su conexiÃ³n bÃ¡sica con la DB funciona; fallo de DB devuelve estado no exitoso sin secretos.
- [ ] **F0-09. Conectar interfaz y API.** PÃ¡gina inicial simple con indicador Â«Servicio disponibleÂ» cuando `GET /api/v1/health` devuelve Ã©xito; mostrar error de conexiÃ³n si falla. Configurar proxy de desarrollo `/api/v1` hacia NestJS.
- [ ] **F0-10. Calidad automÃ¡tica.** Crear scripts de lint, build y test para ambas aplicaciones; ejecutar en CI (GitHub Actions cuando haya repositorio remoto autorizado) con `npm ci`. Incluir pruebas smoke para API y Next.js/React.
- [ ] **F0-11. Documentar arranque limpio.** Instrucciones para clonar, instalar, copiar `.env.example`, aplicar migraciones y levantar ambos servicios. Verificar desde un entorno o base local limpia.

### Pruebas de aceptaciÃ³n F0

1. El frontend inicia y presenta una pantalla sin errores de consola relevantes.
2. `GET /api/v1/health` devuelve `200` con SQLite disponible; al desconectar la DB no informa falsamente estado saludable.
3. Desde Next.js/React se consume la API sin URL privada codificada en el frontend.
4. Una instalaciÃ³n limpia crea el esquema SQLite mediante migraciones, sin `synchronize`.
5. Las migraciones mÃ­nimas corren tambiÃ©n sobre PostgreSQL de pruebas.
6. `npm run build` y el comando de pruebas documentado pasan en ambos proyectos.
7. `.env`, bases SQLite, logs y credenciales no estÃ¡n incluidos en Git.

**Salida de fase:** documentar resultado real, comandos exactos y problemas detectados en `context/estado-actual.md`.

---

# FASE 1 â€” Identidad, autenticaciÃ³n e integrantes

**Meta:** usuarios seguros con permisos institucionales y dos procesos de vinculaciÃ³n, evitando que personas no aprobadas accedan al sistema.

## 1A. Modelo y sesiones

- [ ] **F1-01. Migraciones y entidades.** Crear `users`, `roles`, `user_roles`, `sessions`, `membership_requests`, `invitations` y `verification_tokens` (con `token_hash`, `user_id`, `purpose`, `expires_at`, `used_at`; `purpose` âˆˆ `email_verification`, `password_reset`). AÃ±adir restricciones de unicidad y claves forÃ¡neas.
- [ ] **F1-02. Usuarios.** Campos mÃ­nimos: `id`, `full_name`, `email_normalized` (Ãºnico), `password_hash`, `account_status`, `email_verified_at`, `created_at`, `updated_at`. Estados: `pending`, `active`, `inactive`, `rejected`. Email normalizado (trim y minÃºsculas) antes de consultar y guardar.
- [ ] **F1-03. Roles.** Insertar roles fijos iniciales con cÃ³digos de la secciÃ³n 1.2 mediante seed **idempotente**. No generar usuarios ficticios en producciÃ³n.
- [ ] **F1-04. Primer administrador.** Crear comando de bootstrap **de un solo uso**, interactivo o con secreto introducido en ejecuciÃ³n; no permitir que reemplace administradores existentes. Probar que falla si ya existe un administrador.
- [ ] **F1-05. Sesiones.** Login solo para usuario `active` con correo verificado; comparaciÃ³n segura de hash Argon2id; crear sesiÃ³n revocable (secciÃ³n 2.3); `POST /auth/logout`, `GET /auth/me` y guard de sesiÃ³n.
- [ ] **F1-06. RecuperaciÃ³n.** Solicitud de restablecimiento con token efÃ­mero de un solo uso; invalidar sesiones anteriores al confirmar nueva contraseÃ±a. No revelar existencia de cuentas.
- [ ] **F1-07. Control de abuso y CSRF.** Implementar rate limit, control de origen/cabecera CSRF en operaciones mutables, expiraciÃ³n y limpieza de sesiones.

## 1B. VinculaciÃ³n, invitaciones y roles

- [ ] **F1-08. Registro pÃºblico controlado.** Crear usuario `pending`; enviar verificaciÃ³n de correo; registrar solicitud `pending`; impedir sesiÃ³n hasta verificaciÃ³n **y aprobaciÃ³n**. La aprobaciÃ³n asigna rol institucional explÃ­cito.
- [ ] **F1-09. AprobaciÃ³n/rechazo.** Solo `admin`/`coordinator`; registrar autor, fecha, observaciones y transiciÃ³n. No permitir que una solicitud resuelta se apruebe nuevamente.
- [ ] **F1-10. Invitaciones.** Crear token aleatorio con hash, expiraciÃ³n inicial de 72 horas y uso Ãºnico. `admin`/`coordinator` asigna rol autorizado. El usuario invitado completa registro y verifica el correo correspondiente; la aceptaciÃ³n produce cuenta `active` sin solicitud pÃºblica adicional. No emitir invitaciones para correo ya activo sin flujo explÃ­cito.
- [ ] **F1-11. Entrega de invitaciones.** Integrar correo transaccional mediante interfaz reemplazable; usar transportador de pruebas local en desarrollo. Para demo interna sin SMTP, permitir mostrar el enlace **una sola vez** al creador, sin guardarlo en logs. ProducciÃ³n con registros reales requiere entrega segura y verificaciÃ³n funcional.
- [ ] **F1-12. Perfiles.** `GET/PATCH /users/me` para nombre y datos editables. Nadie puede cambiar su propio `role`, `account_status` o verificaciÃ³n de correo desde el perfil.
- [ ] **F1-13. AdministraciÃ³n de integrantes.** Listado paginado, bÃºsqueda, roles, activaciÃ³n/desactivaciÃ³n y detalle para usuarios autorizados; registrar cambios sensibles. No borrar en cascada la historia de participaciÃ³n.
- [ ] **F1-14. Interfaz Next.js/React.** Login, registro, verificaciÃ³n, recuperaciÃ³n, perfil, listado de integrantes y cola de solicitudes, con mensajes de errores y estados de carga.

### Permisos mÃ­nimos F1

| AcciÃ³n | Admin | Coordinator | Teacher/leader | Researcher | Student |
|---|---|---|---|---|---|
| Ver/editar perfil propio | SÃ­ | SÃ­ | SÃ­ | SÃ­ | SÃ­ |
| Consultar integrantes activos (datos no sensibles) | SÃ­ | SÃ­ | SÃ­ | SÃ­ | SÃ­ |
| Ver solicitudes de registro | SÃ­ | SÃ­ | No | No | No |
| Aprobar/rechazar vinculaciÃ³n | SÃ­ | SÃ­ | No | No | No |
| Invitar integrantes | SÃ­ | SÃ­ | No | No | No |
| Asignar rol institucional | SÃ­ | SÃ­* | No | No | No |
| Configurar seguridad general | SÃ­ | No | No | No | No |

`*` El coordinador solo podrÃ¡ asignar o retirar `teacher_leader`, `researcher` y `student`; NO podrÃ¡ asignar ni retirar `admin` o `coordinator`, ni elevar sus propios permisos. **Un administrador tampoco podrÃ¡ quitarse el Ãºltimo rol `admin` del sistema**. Cuando hay mÃºltiples roles se evalÃºa uniÃ³n de permisos institucionales, siempre limitada por el alcance del recurso.

### API mÃ­nima F1

| MÃ©todo | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/v1/auth/register` | PÃºblico, limitado |
| `POST` | `/api/v1/auth/verify-email` | Token vÃ¡lido |
| `POST` | `/api/v1/auth/login` | PÃºblico, limitado |
| `POST` | `/api/v1/auth/logout` | Usuario con sesiÃ³n |
| `GET` | `/api/v1/auth/me` | Usuario con sesiÃ³n |
| `POST` | `/api/v1/auth/forgot-password` | PÃºblico, limitado |
| `POST` | `/api/v1/auth/reset-password` | Token vÃ¡lido |
| `GET/PATCH` | `/api/v1/users/me` | Propietario |
| `GET` | `/api/v1/users` | Integrantes activos: solo `id`, `fullName` y roles visibles; administraciÃ³n: filtro autorizado (sin `passwordHash`, tokens ni sesiones) |
| `PATCH` | `/api/v1/users/:id/status` | Autoridad |
| `GET` | `/api/v1/membership-requests` | Autoridad |
| `POST` | `/api/v1/membership-requests/:id/approve` | Autoridad |
| `POST` | `/api/v1/membership-requests/:id/reject` | Autoridad |
| `POST` | `/api/v1/invitations` | Autoridad |
| `POST` | `/api/v1/invitations/accept` | Token vÃ¡lido |

Los formularios y endpoints deben ser consistentes; usar los nombres de ruta anteriores en el MVP y documentar cualquier cambio antes de consumirlos en Next.js/React.

### Pruebas de aceptaciÃ³n F1

1. Registro sin verificar/no aprobado **no** permite login.
2. Solicitud aprobada y correo verificado **sÃ­** permite login.
3. Usuario invitado usa el enlace **una sola vez**; despuÃ©s se rechaza; enlace caducado se rechaza.
4. Una persona estudiante no puede consultar solicitudes ni asignar roles, aunque haga peticiones HTTP directas.
5. Coordinador no puede crear otro administrador; el Ãºltimo admin no puede quedar eliminado/desactivado.
6. SesiÃ³n expirada o revocada devuelve `401`; logout invalida el acceso.
7. Cambiar la contraseÃ±a invalida las sesiones anteriores.
8. Cambios de rol/estado quedan auditados; no aparecen secretos en respuestas ni logs.
9. Todos los flujos crÃ­ticos anteriores funcionan sobre SQLite **y** PostgreSQL de pruebas.

**Salida de fase:** un usuario activo puede entrar al panel y consultar su perfil; autoridades administran vinculaciones sin conceder permisos indebidos.

---

# FASE 2 â€” Proyectos, tareas, backlog y sprints opcionales **(cierre del MVP)**

**Meta:** gestionar proyectos tradicionales o Ã¡giles de extremo a extremo sin duplicar tareas ni forzar Scrum.

## 2A. Proyectos y equipos

- [ ] **F2-01. Entidades y migraciones.** `projects`, `project_members`. Proyecto: `id`, `name`, `description`, `type`, `methodology`, `status`, `created_by`, `start_date?`, `end_date?`, timestamps. `methodology` âˆˆ `traditional`, `agile`. Tipos iniciales: `research`, `software`, `innovation`, `extension`, `internal`, `other`.
- [ ] **F2-02. Estados.** `proposed`, `planning`, `active`, `paused`, `completed`, `cancelled`. Cambios por endpoints explÃ­citos o patch validado; no permitir reactivar un proyecto `completed`/`cancelled` en el MVP.
- [ ] **F2-03. Alta de proyecto.** Solo `admin` y `coordinator` por defecto. Un `teacher_leader` solo podrÃ¡ crear proyectos si se aprueba y configura explÃ­citamente un permiso adicional en una revisiÃ³n futura. El creador autorizado se aÃ±ade automÃ¡ticamente como lÃ­der **si** pertenece al semillero y estÃ¡ activo; si el creador es un administrador tÃ©cnico no participante, debe asignar un lÃ­der activo antes de activar el proyecto.
- [ ] **F2-04. Equipos.** AÃ±adir/quitar integrantes activos, roles de proyecto `leader` o `collaborator`. Un proyecto activo debe conservar al menos un lÃ­der; no quitar un miembro con tareas asignadas sin reasignar o desasignarlas en una operaciÃ³n explÃ­cita.
- [ ] **F2-05. Visibilidad.** Coordinador ve proyectos institucionales; integrante ve proyectos donde participa. Por defecto otros integrantes no ven el contenido privado de proyectos ajenos. Admin tiene administraciÃ³n tÃ©cnica; acceso a contenido sensible se rige ademÃ¡s por las reglas de cada mÃ³dulo.
- [ ] **F2-06. Frontend.** Listado con filtros, crear/editar, detalle, equipo, estados y mensajes de acceso denegado.

## 2B. Tareas y backlog

- [ ] **F2-07. Entidad `tasks`.** Campos: `id`, `project_id`, `sprint_id` nullable, `title`, `description?`, `assignee_id` nullable, `status`, `priority`, `due_date?`, `created_by`, timestamps. Prioridad: `low`, `medium`, `high`; estado: `todo`, `in_progress`, `in_review`, `done`.
- [ ] **F2-08. Reglas de asignaciÃ³n.** La persona asignada debe ser miembro activo del proyecto; una tarea nunca se vincula a dos proyectos; `sprint_id`, si existe, debe ser del **mismo** proyecto.
- [ ] **F2-09. CRUD.** LÃ­der/coordinador crea, modifica, asigna y prioriza tareas; colaborador puede actualizar **estado** de sus tareas asignadas; otras modificaciones requieren autoridad del proyecto. Registrar autor y timestamps.
- [ ] **F2-10. Backlog.** En proyectos Ã¡giles: `sprint_id IS NULL`; en proyectos tradicionales: todas las tareas tienen `sprint_id IS NULL`, pero se muestran como tareas normales (no interfaz de planificaciÃ³n de sprints).
- [ ] **F2-11. Kanban bÃ¡sico.** Una Ãºnica tarea por tarjeta; columnas segÃºn estados fijos. Cambiar columna ejecuta actualizaciÃ³n autorizada y persiste tras recarga. Evitar bibliotecas de tablero sofisticadas en la primera versiÃ³n.
- [ ] **F2-12. Progreso.** Mostrar `tareas done / tareas totales` y conteos por estado. Si hay cero tareas, indicar Â«Sin tareasÂ»; **no** presentar 100 % de proyecto completado.

## 2C. Sprints (SOLO para modalidad Ã¡gil)

- [ ] **F2-13. Entidad `sprints`.** `id`, `project_id`, `name`, `goal?`, `start_date`, `end_date`, `status`, timestamps. Estados: `planned`, `active`, `completed`, `cancelled`. Validar `start_date <= end_date`. DuraciÃ³n recomendada de 1â€“4 semanas, no imponerla rÃ­gidamente.
- [ ] **F2-14. Un activo por proyecto.** Regla obligatoria respaldada por operaciÃ³n transaccional y restricciÃ³n de unicidad para `status='active'` por `project_id` cuando el motor lo permita. Probar activaciones concurrentes tambiÃ©n en PostgreSQL.
- [ ] **F2-15. PlanificaciÃ³n.** LÃ­der/coordinador crea sprint `planned` y aÃ±ade tareas de backlog del mismo proyecto. No permitir tareas de otro proyecto ni agregar tareas a un sprint `completed` o `cancelled`.
- [ ] **F2-16. Inicio.** Solo `planned -> active`. No permitir si existe otro sprint activo. No iniciar sprints de proyectos no Ã¡giles o finalizados/cancelados.
- [ ] **F2-17. Cierre.** Solo `active -> completed`; capturar un **registro inmutable del estado final por tarea del sprint** en `sprint_closure_items` (`sprint_id`, `task_id`, `status_at_close`, `closed_at`). Las tareas `done` conservan su vinculaciÃ³n histÃ³rica; las incompletas vuelven al backlog (`sprint_id=null`) dentro de la misma transacciÃ³n. No marcar tareas pendientes como `done` automÃ¡ticamente.
- [ ] **F2-18. CancelaciÃ³n.** Permitir `planned/active -> cancelled` por lÃ­der/coordinador, con confirmaciÃ³n y motivo; devolver tareas no completadas al backlog y conservar historial. Un sprint `completed` o `cancelled` no se reactiva en el MVP.
- [ ] **F2-19. Cambios de modalidad.** `traditional -> agile` permitido solo por lÃ­der/coordinador cuando proyecto editable; todas las tareas existentes entran en backlog. `agile -> traditional` **solo si no hay sprints asociados** (ni histÃ³ricos); en caso contrario responder `409` hasta definir una polÃ­tica de conversiÃ³n.
- [ ] **F2-20. Interfaz.** Lista de sprints, creaciÃ³n, planificaciÃ³n, inicio/cierre/cancelaciÃ³n, tablero del activo, progreso, historial bÃ¡sico. No mostrar menÃº de sprints en modalidad tradicional.
- [ ] **F2-21. AuditorÃ­a mÃ­nima.** Registrar cambios de membresÃ­a, asignaciones, estado de proyecto, inicio/cierre de sprints y movimiento de tareas, con usuario y fecha.

### Permisos mÃ­nimos F2

| AcciÃ³n | Admin / Coordinator | LÃ­der del proyecto | Colaborador del proyecto | No miembro |
|---|---|---|---|---|
| Consultar proyecto accesible | SÃ­ | SÃ­ | SÃ­ | No, salvo polÃ­tica explÃ­cita |
| Crear proyecto | SÃ­; `teacher_leader` solo con permiso adicional explÃ­cito | No por tener este rol solamente | No | No |
| AÃ±adir/quitar miembros | SÃ­ | SÃ­ | No | No |
| Crear/asignar tareas | SÃ­ | SÃ­ | No | No |
| Cambiar estado de tarea propia | SÃ­ | SÃ­ | SÃ­ | No |
| Crear/iniciar/cerrar sprint | SÃ­ | SÃ­ | No | No |
| Ver backlog y tareas del proyecto | SÃ­ | SÃ­ | SÃ­ | No |

Un `teacher_leader` institucional que no pertenece al proyecto **no recibe automÃ¡ticamente** acceso a modificarlo.

### API mÃ­nima F2

| MÃ©todo | Ruta | ObservaciÃ³n |
|---|---|---|
| `GET/POST` | `/api/v1/projects` | Listar accesibles / crear autorizado |
| `GET/PATCH` | `/api/v1/projects/:projectId` | Consultar / editar |
| `POST` | `/api/v1/projects/:projectId/status` | Cambiar estado validado |
| `GET/POST` | `/api/v1/projects/:projectId/members` | Listar / agregar |
| `PATCH/DELETE` | `/api/v1/projects/:projectId/members/:userId` | Cambiar rol / retirar |
| `GET/POST` | `/api/v1/projects/:projectId/tasks` | Listar / crear |
| `GET/PATCH` | `/api/v1/projects/:projectId/tasks/:taskId` | Consultar / actualizar |
| `GET/POST` | `/api/v1/projects/:projectId/sprints` | Solo proyectos Ã¡giles |
| `GET/PATCH` | `/api/v1/projects/:projectId/sprints/:sprintId` | Consultar / editar planificado |
| `POST` | `/api/v1/projects/:projectId/sprints/:sprintId/tasks` | Incorporar tareas del backlog |
| `DELETE` | `/api/v1/projects/:projectId/sprints/:sprintId/tasks/:taskId` | Devolver tarea a backlog cuando se permita |
| `POST` | `/api/v1/projects/:projectId/sprints/:sprintId/start` | Activar |
| `POST` | `/api/v1/projects/:projectId/sprints/:sprintId/complete` | Cerrar y registrar snapshot |
| `POST` | `/api/v1/projects/:projectId/sprints/:sprintId/cancel` | Cancelar con motivo |

**Contrato:** todos los endpoints de tareas/sprints comprueban tanto `projectId` de URL como el `project_id` del recurso. No confiar en un `projectId` proporcionado por el cliente sin validaciÃ³n de pertenencia real.

### Pruebas de aceptaciÃ³n F2 (obligatorias para finalizar el MVP)

1. Coordinador crea un proyecto tradicional y gestiona tareas; **no** aparecen sprints ni se permite crearlos por API.
2. Coordinador crea un proyecto Ã¡gil y tareas sin sprint (backlog).
3. LÃ­der crea sprint, asigna tareas del mismo proyecto, lo activa y mueve tareas por estados en Kanban.
4. Intento de activar dos sprints simultÃ¡neos en el mismo proyecto se rechaza, incluso bajo solicitudes concurrentes.
5. Intento de mover una tarea de un proyecto a sprint de otro es rechazado.
6. Cierre registra snapshot: las terminadas constan como completadas; las no terminadas regresan a backlog conservando historial.
7. Usuario ajeno no puede consultar ni modificar recursos restringidos aunque cambie IDs de URL.
8. Colaborador no puede crear sprints ni reasignar tareas a otros integrantes.
9. Cambios y operaciones crÃ­ticas se mantienen al reiniciar servidor y actualizar navegador.
10. Proyectos sin tareas muestran progreso Â«Sin tareasÂ»; porcentaje de tareas no se interpreta como cumplimiento cientÃ­fico.
11. Aplicar todas las migraciones desde cero y ejecutar los flujos crÃ­ticos tanto en **SQLite** como en **PostgreSQL**.
12. Prueba E2E completa: registro/invitaciÃ³n â†’ login â†’ proyecto Ã¡gil â†’ equipo â†’ tareas â†’ sprint â†’ cierre â†’ consulta historial.

**Puerta MVP:** No declarar Â«MVP listoÂ» hasta validar estas pruebas, revisar dependencias de seguridad, documentar pendientes y obtener la decisiÃ³n del responsable antes de publicar con usuarios reales.

---

# FASE 3 â€” GestiÃ³n investigativa y documental

**Meta:** registrar informaciÃ³n de investigaciÃ³n relacionada con proyectos y almacenar documentos sin exponer archivos privados.

### Tareas

- [ ] **F3-01. LÃ­neas de investigaciÃ³n.** Entidad `research_lines` (`name`, `description`, `objectives?`, `responsible_user_id?`, `status`); CRUD de coordinador/administrador, lectura autorizada.
- [ ] **F3-02. AsociaciÃ³n con proyectos.** `project_research_lines` para relaciÃ³n muchos-a-muchos. Permitir varias lÃ­neas por proyecto.
- [ ] **F3-03. Ficha investigativa.** `project_research_profiles`: proyecto Ãºnico, problema, pregunta, justificaciÃ³n, metodologÃ­a y notas. Opcional; no obligar a proyectos de software o internos a llenar estos campos.
- [ ] **F3-04. Resultados.** `research_results`: tÃ­tulo, descripciÃ³n, proyecto, autores/participantes, fecha y referencias documentales. Guardar resultados sin duplicar tareas.
- [ ] **F3-05. Metadatos de archivos.** `documents`: ID, nombre original, tipo/categorÃ­a, tamaÃ±o, MIME validado, storage key, autor, Ã¡mbito, nivel de acceso y timestamps; relacionar con proyecto, resultado o actividad por un vÃ­nculo validado.
- [ ] **F3-06. Interfaz de almacenamiento.** Desarrollar contrato `StorageService` con adaptador de disco **solo local** y adaptador para almacenamiento de objetos privado en producciÃ³n. **Elegir proveedor/credenciales con autorizaciÃ³n antes del despliegue de este mÃ³dulo**; no usar disco efÃ­mero de Railway para documentos definitivos.
- [ ] **F3-07. Seguridad documental.** Descargas a travÃ©s de controlador autorizado o URLs firmadas de corta duraciÃ³n; validar extensiÃ³n **y contenido**, tamaÃ±o mÃ¡ximo inicial de 20 MiB configurable, nombre de objeto aleatorio, sin ejecuciÃ³n, sin rutas arbitrarias.
- [ ] **F3-08. Permisos documentales.** `general`, `restricted`, `private`; autorizaciÃ³n segÃºn rol, pertenencia al proyecto y reglas explÃ­citas del documento. Un enlace conocido no concede acceso.
- [ ] **F3-09. UI y filtros.** Formulario de investigaciÃ³n, lÃ­neas, resultados, subida y consulta de archivos permitidos.

### Criterios de aceptaciÃ³n F3

- Proyecto no investigativo se crea sin ficha de investigaciÃ³n.
- Integrante autorizado asocia proyecto a lÃ­nea y registra resultado.
- Archivo subido se consulta desde su proyecto sin duplicar fÃ­sicamente el contenido.
- Persona no autorizada no puede descargar documento cambiando ID o URL.
- Se rechazan archivos mayores al lÃ­mite o tipos no permitidos, con respuesta comprensible.
- Metadatos y relaciones funcionan en SQLite y PostgreSQL; almacenamiento externo real se valida antes de producciÃ³n.

**Bloqueo explÃ­cito:** proveedor de almacenamiento privado, polÃ­tica de conservaciÃ³n y lÃ­mite final de formatos requieren decisiÃ³n antes de desplegar este mÃ³dulo para uso real.

---

# FASE 4 â€” ProducciÃ³n acadÃ©mica, eventos y actividades

**Meta:** asociar productos a autores/proyectos y registrar actividades, participaciones y asistencia.

### Tareas

- [ ] **F4-01. ProducciÃ³n acadÃ©mica.** `academic_products`: tipo (`article`, `presentation`, `poster`, `book_chapter`, `book`, `software`, `other`), tÃ­tulo, descripciÃ³n, estado, fecha y fuente/DOI/enlace opcional.
- [ ] **F4-02. AutorÃ­as.** `product_authors` con usuario interno o autor externo de nombre explÃ­cito, orden de autorÃ­a y sin crear cuentas falsas para colaboradores externos.
- [ ] **F4-03. AsociaciÃ³n.** Relacionar productos con proyectos y resultados de investigaciÃ³n; no duplicar los datos del proyecto.
- [ ] **F4-04. Reconocimientos.** Registro sencillo de reconocimiento, fecha, participante/proyecto y evidencia opcional.
- [ ] **F4-05. Eventos.** `events`: tipo (`meeting`, `training`, `academic`, `call`, `internal`, `other`), tÃ­tulo, fechas, modalidad, ubicaciÃ³n/enlace, organizador y estado (`scheduled`, `in_progress`, `completed`, `cancelled`).
- [ ] **F4-06. ParticipaciÃ³n.** `event_participants`: persona registrada, rol en evento, asistencia (`registered`, `attended`, `absent`); impedir duplicados por evento+integrante.
- [ ] **F4-07. Convocatorias.** Registro informativo de fechas, requisitos y enlace; gestiÃ³n avanzada de postulaciones queda fuera.
- [ ] **F4-08. Interfaz.** Listados de productos/eventos, formularios, detalle, registro de asistencia y calendario bÃ¡sico. Reutilizar documentos de Fase 3.

### Criterios de aceptaciÃ³n F4

- Producto acadÃ©mico se vincula a mÃºltiples autores y a un proyecto; se puede consultar desde cada perfil autorizado.
- Autor externo no necesita cuenta de acceso.
- Un evento se programa, completa y registra asistencia sin duplicar participantes.
- No se puede editar la asistencia de un evento ajeno sin autorizaciÃ³n.
- Certificados y evidencias usan GestiÃ³n documental, no un sistema paralelo de archivos.
- Fechas y filtros funcionan de manera equivalente en SQLite y PostgreSQL.

---

# FASE 5 â€” GestiÃ³n administrativa

**Meta:** tramitar solicitudes internas reutilizando los procesos de vinculaciÃ³n ya construidos.

### Tareas

- [ ] **F5-01. Solicitudes generales.** Entidad `administrative_requests`: solicitante, tipo, asunto, descripciÃ³n, estado, responsable, respuesta y timestamps. **No duplicar** `membership_requests` de Fase 1.
- [ ] **F5-02. Tipos.** Certificados, cambio de datos, desvinculaciÃ³n, responsabilidades, solicitud general. La aprobaciÃ³n de vinculaciÃ³n se gestiona exclusivamente en el flujo existente.
- [ ] **F5-03. Estados.** `pending`, `in_review`, `approved`, `rejected`, `completed` (cuando la aprobaciÃ³n requiera ejecuciÃ³n posterior); validar transiciones.
- [ ] **F5-04. Autoridad.** Solicitante consulta solo sus solicitudes; coordinador/administrador revisa segÃºn Ã¡mbito; el solicitante no puede aprobarse a sÃ­ mismo.
- [ ] **F5-05. DesvinculaciÃ³n.** Desactivar cuenta cuando proceda sin borrar participaciones; exigir reasignaciÃ³n explÃ­cita de proyectos/tareas pendientes cuando sea necesaria.
- [ ] **F5-06. AuditorÃ­a y adjuntos.** Respuestas y decisiones con responsable/fecha; adjuntos mediante mÃ³dulo documental.
- [ ] **F5-07. Interfaz.** Mis solicitudes, nueva solicitud, detalle/historial y bandeja de revisiÃ³n para autoridades.

### Criterios de aceptaciÃ³n F5

- Integrante registra solicitud y solo ve las propias.
- Autoridad cambia estados vÃ¡lidos y deja decisiÃ³n rastreable.
- Un usuario no puede aprobar su propia peticiÃ³n alterando datos HTTP.
- Desvincular un integrante no borra su historia investigativa o de proyectos.
- Adjuntos privados no quedan accesibles fuera del permiso de la solicitud.

---

# FASE 6 â€” Seguimiento, evaluaciÃ³n, reportes y estadÃ­sticas

**Meta:** mostrar indicadores fiables derivados de datos existentes, no crear registros duplicados ni mÃ©tricas engaÃ±osas.

### Tareas

- [ ] **F6-01. CatÃ¡logo de indicadores.** Especificar para cada indicador: definiciÃ³n, fuente, filtros, fecha de corte, permisos y consulta que lo calcula.
- [ ] **F6-02. Panel institucional.** Integrantes activos, proyectos por estado/tipo, actividades realizadas, productos acadÃ©micos y tareas pendientes/completadas.
- [ ] **F6-03. Panel de proyecto.** Progreso operativo de tareas, sprint actual si existe, entregables y fechas; separar indicadores de actividad de evaluaciÃ³n de calidad.
- [ ] **F6-04. Panel personal.** Proyectos propios, tareas propias, asistencias y productos vinculados, respetando privacidad.
- [ ] **F6-05. Seguimiento cualitativo.** Observaciones de avances y dificultades; evaluaciones nominales mÃ¡s complejas se implementarÃ¡n Ãºnicamente cuando sus criterios, privacidad y destinatarios estÃ©n aprobados.
- [ ] **F6-06. Reportes.** Filtros por rango de fechas, tipo de proyecto, estado, lÃ­nea y producto; paginaciÃ³n; ver resultados en pantalla. ExportaciÃ³n a PDF/Excel es **posterior**, salvo priorizaciÃ³n explÃ­cita.
- [ ] **F6-07. Pruebas de exactitud.** Crear datos sintÃ©ticos con resultados conocidos y comparar manualmente conteos; comprobar que permisos restringen filas **antes** de calcular agregados.
- [ ] **F6-08. UI.** Tarjetas, tablas y grÃ¡ficos bÃ¡sicos accesibles; estados de carga, error y Â«Sin datosÂ».

### Definiciones mÃ­nimas de indicadores

- **Integrantes activos:** total de `users.account_status = active`.
- **Proyectos activos:** total de `projects.status = active`.
- **Tareas terminadas:** total de `tasks.status = done` dentro del conjunto autorizado.
- **Avance operativo de tareas:** `terminadas / total * 100` **solo si total > 0**; en cero, mostrar Â«Sin tareasÂ».
- **ParticipaciÃ³n en actividades:** asistencias `attended`, sin contar inscripciones `registered` como asistencia.
- **Productos acadÃ©micos:** registros vÃ¡lidos no duplicados; no equiparar automÃ¡ticamente Â«registradosÂ» con Â«publicadosÂ».
- **Sprint cerrado:** utilizar snapshot `sprint_closure_items`, no recalcular retrospectivamente con el estado actual de tareas que pudieron cambiar.

### Criterios de aceptaciÃ³n F6

- Indicadores coinciden con fixtures conocidas.
- Un usuario sin acceso no puede inferir cifras de proyectos o evaluaciones privadas por una consulta global.
- La cuenta de Â«terminadasÂ» no suma tareas repetidas por reasignaciones de sprint.
- Las pantallas sin datos no muestran porcentajes engaÃ±osos ni errores.
- Consultas agregadas y filtros funcionan en SQLite y PostgreSQL.

---

## 5. Calidad, seguridad y pruebas transversales

### 5.1. DefiniciÃ³n de Â«HechoÂ» (DoD) para **cada historia**

Una historia se marca `completada` cuando:

- [ ] Cumple el caso de uso descrito y muestra mensajes comprensibles en espaÃ±ol.
- [ ] Valida entrada en frontend **y** backend; comprueba permisos en backend.
- [ ] Tiene pruebas unitarias de reglas importantes y al menos una prueba de integraciÃ³n de sus endpoints.
- [ ] Incluye prueba de error (no solo camino exitoso).
- [ ] Si cambia el esquema, contiene migraciones SQLite y PostgreSQL cuando correspondan, probadas desde esquema limpio.
- [ ] No incorpora secretos ni informaciÃ³n real en cÃ³digo, fixtures, repositorio o logs.
- [ ] Compila, pasa lint y pruebas disponibles; cualquier omisiÃ³n queda indicada explÃ­citamente.
- [ ] Actualiza documentaciÃ³n y estado de avance.

### 5.2. Pruebas mÃ­nimas por etapa

| Nivel | QuÃ© comprobar | CuÃ¡ndo |
|---|---|---|
| Unitarias | Reglas de negocio, validaciones, estados y autorizaciÃ³n | Cada historia |
| IntegraciÃ³n SQLite | Endpoints, restricciones, migraciones | Cada historia de datos |
| IntegraciÃ³n PostgreSQL | Migraciones, consultas, restricciones y concurrencia relevante | Antes de cerrar cada fase desde F1 |
| E2E navegador | Flujos reales en Next.js/React + API | Al cerrar F1, F2 y cada fase posterior |
| Seguridad | Acceso horizontal, escalamiento de roles, CSRF, sesiones y abuso | F1 y cambios sensibles |
| Accesibilidad | NavegaciÃ³n por teclado, etiquetas, contraste, errores de formularios | Pantallas nuevas |
| CompilaciÃ³n/dependencias | `npm ci`, lint, tests, builds | Cada PR o cambio equivalente |

### 5.3. Rendimiento y mantenimiento

En el MVP: paginar listados, indexar FKs y filtros frecuentes, evitar consultas N+1 evidentes, no cargar todos los documentos o tareas de una organizaciÃ³n en una sola respuesta. No imponer objetivos numÃ©ricos de usuarios concurrentes sin conocer el tamaÃ±o real del semillero; registrar mediciones de referencia antes de optimizar.

### 5.4. Observabilidad

Registrar errores con identificador de peticiÃ³n, marca de tiempo y nivel, sin contraseÃ±as, cookies, tokens ni contenido documental privado. AÃ±adir `GET /api/v1/health` y mensajes de diagnÃ³stico mÃ­nimos. No integrar servicios de analÃ­tica de terceros ni telemetrÃ­a externa sin consentimiento/aprobaciÃ³n del proyecto.

---

## 6. Despliegue a Railway: procedimiento y barreras

> **Preparar la configuraciÃ³n es trabajo tÃ©cnico; desplegar o generar costes requiere autorizaciÃ³n explÃ­cita.** El despliegue de prueba no equivale a puesta en funcionamiento institucional.

### Orden de preparaciÃ³n

- React — documentacion oficial: <https://react.dev/reference/react>
2. Preparar imagen/configuraciÃ³n de backend que escuche en `0.0.0.0` y use el puerto inyectado por Railway.
3. Preparar frontend servido en producciÃ³n con configuracion de build/hosting compatible con Next.js y **proxy `/api/v1` a backend**; preferir un Ãºnico origen de navegador.
4. Configurar servicio PostgreSQL **separado y privado** en Railway. No habilitar exposiciÃ³n pÃºblica de la DB sin necesidad aprobada.
5. Configurar `DB_TYPE=postgres`, `DATABASE_URL`, seguridad de cookies, origen y credenciales mediante variables protegidas del servicio; nunca pegarlas en Git.
6. Ejecutar migraciones PostgreSQL de forma controlada y reproducible; **no** ejecutar mÃºltiples rÃ©plicas migrando simultÃ¡neamente.
7. Activar despliegue backend y frontend; comprobar `health`, sesiÃ³n, navegaciÃ³n interna y reglas de acceso.
8. Configurar mecanismo de respaldo, realizar al menos una **prueba de restauraciÃ³n** antes de almacenar informaciÃ³n real.
9. Definir plan de reversiÃ³n: conservar versiÃ³n desplegada, hacer respaldo antes de cambios destructivos y usar migraciones compatibles hacia adelante cuando sea posible. No confiar en deshacer migraciones destructivas en producciÃ³n.
10. Registrar URL, versiÃ³n, fecha, responsable y resultado del despliegue en documentaciÃ³n interna.

### Barreras estrictas de publicaciÃ³n

- [ ] AprobaciÃ³n explÃ­cita del responsable.
- [ ] No existen credenciales por defecto o secretos de desarrollo.
- [ ] Todas las migraciones y pruebas crÃ­ticas pasaron en PostgreSQL.
- [ ] HTTPS, cookies seguras y protecciÃ³n CSRF operativos.
- [ ] Registro/invitaciÃ³n y recuperaciÃ³n de acceso funcionan realmente, o estÃ¡n **deshabilitados para usuarios externos** con alternativa aprobada.
- [ ] Permisos probados contra acceso directo a API y documentos.
- [ ] Backups definidos, probados y accesibles solo a autorizados.
- [ ] La aplicaciÃ³n no depende del disco efÃ­mero del servicio para documentos persistentes.
- [ ] Una persona autorizada validÃ³ los flujos del MVP y los lÃ­mites conocidos.

---

## 7. Orden de trabajo sugerido para un agente por iteraciones

Cada iteraciÃ³n debe producir un resultado observable. No iniciar todas las ramas a la vez.

| IteraciÃ³n | Alcance | Evidencia mÃ­nima |
|---|---|---|
| I-01 | F0-01 a F0-04 | Next.js/React y NestJS compilan |
| I-02 | F0-05 a F0-09 | SQLite + migraciones + health + Next.js/React consulta API |
| I-03 | F0-10 a F0-11 | README reproducible, lint/build/test y PostgreSQL smoke |
| I-04 | F1-01 a F1-07 | Usuarios y sesiÃ³n con pruebas de seguridad |
| I-05 | F1-08 a F1-14 | Vinculaciones, invitaciones y perfiles en UI |
| I-06 | F2-01 a F2-06 | Proyectos y equipos completos |
| I-07 | F2-07 a F2-12 | Tareas y backlog/tablero |
| I-08 | F2-13 a F2-21 | Sprints opcionales y cierre con snapshot |
| I-09 | Pruebas E2E y Postgres del MVP | Informe MVP: aprobado o bloqueado |
| I-10+ | Fases 3, 4, 5 y 6 | ValidaciÃ³n de salida de cada fase |

El agente solo podrÃ¡ marcar una iteraciÃ³n como completada si presenta resultados de pruebas **reales** y documentaciÃ³n de los cambios.

---

## 8. Decisiones que no debe inventar el agente

Estas decisiones aÃºn no estÃ¡n oficialmente definidas. El agente debe adoptar el **comportamiento conservador indicado** mientras no haya una decisiÃ³n del responsable:

| DecisiÃ³n abierta | Comportamiento temporal seguro | Momento de confirmaciÃ³n |
|---|---|---|
| JerarquÃ­a real del semillero | Usar los cinco roles propuestos, sin declararlos cargos oficiales | Antes del piloto institucional |
| Â¿QuiÃ©n autoriza proyectos? | Admin y coordinator; `teacher_leader` solo con permiso adicional explÃ­cito aprobado, nunca todos los usuarios | Antes de abrir registro real de proyectos |
| Â¿Son pÃºblicos los proyectos? | **Privados** para equipo + coordinaciÃ³n, por defecto | Antes de implementar difusiÃ³n pÃºblica |
| Â¿Puede haber mÃºltiples lÃ­deres? | SÃ­, si al menos uno permanece en proyecto activo | En F2 si el responsable quiere restringirlo |
| Â¿Los sprints son obligatorios? | **No**, solo modalidad `agile` | DecisiÃ³n ya fijada |
| Â¿Cambiar modalidad con sprints histÃ³ricos? | Bloquear `agile -> traditional` con historial | Si aparece esa necesidad |
| SMTP/proveedor de correo | Fake local; no habilitar registro pÃºblico real sin proveedor probado | Antes de piloto real F1 |
| Almacenamiento de documentos | Adaptador local solo en desarrollo; proveedor privado pendiente | Antes de producciÃ³n F3 |
| Identidad visual | UI funcional, simple y accesible; no inventar branding institucional | Antes de pulir interfaces |
| Fechas exactas del cronograma | No asignar fechas sin datos de equipo y dedicaciÃ³n | Al planificar sprints de desarrollo |
| MÃ©tricas de desempeÃ±o personal | No crear rankings ni calificaciones automÃ¡ticas | Antes de F6 |
| PublicaciÃ³n y datos reales | No publicar ni importar personas reales sin aprobaciÃ³n | Antes de despliegue/piloto |

**Si una decisiÃ³n pendiente impide cumplir seguridad o pruebas, registrar un bloqueo, nunca Â«resolverÂ» ocultando la falta de funcionalidad.**

---

## 9. Plantilla de solicitud al agente implementador

Copiar este texto al iniciar cada iteraciÃ³n:

```text
Trabaja en AlfaCode HUB siguiendo `docs/plan-desarrollo.md`.
IteraciÃ³n solicitada: [ID, por ejemplo I-02].

Antes de modificar el repositorio:
1. Lee `docs/plan-desarrollo.md`, `docs/AlfaCode_HUB_Diseno_Tecnico_Inicial_v0.2.md` y
   `context/estado-actual.md`.
2. Inspecciona los archivos existentes y el estado de Git.
3. Identifica dependencias y riesgos de la iteraciÃ³n.

Implementa SOLO las tareas de esa iteraciÃ³n, siguiendo las decisiones
invariables: Next.js/React, NestJS, TypeORM, SQLite local, PostgreSQL en Railway,
sprints opcionales, validaciÃ³n de permisos en backend y migraciones versionadas.

Ejecuta las pruebas pertinentes. No des por completada una tarea sin evidencia.
No hagas despliegues, compras, borrados destructivos ni cambios en servicios
externos sin mi autorizaciÃ³n explÃ­cita.

Al terminar entrega:
- Resumen de cambios y rutas de archivos;
- Comandos ejecutados y resultados;
- Estado de los criterios de aceptaciÃ³n;
- Problemas/bloqueos;
- PrÃ³xima tarea recomendada.
Actualiza `context/estado-actual.md` y `docs/decisiones.md` si aplica.
```

---

## 10. Criterio final del proyecto

La plataforma se considerarÃ¡ tÃ©cnicamente completada para el alcance planeado cuando:

1. Los nueve mÃ³dulos estÃ©n implementados de acuerdo con las fases aprobadas, con flujos integrados y sin duplicar datos de negocio.
2. Los proyectos tradicionales funcionen sin sprints; los proyectos Ã¡giles puedan gestionar backlog, sprints y cierre con historial.
3. Los permisos se apliquen en la API y protejan informaciÃ³n personal, evaluaciones y archivos.
4. Los datos y migraciones funcionen en SQLite (desarrollo) y PostgreSQL (producciÃ³n).
5. Las pruebas unitarias, de integraciÃ³n, E2E y de seguridad acordadas pasen.
6. Existan procedimientos reproducibles de instalaciÃ³n, despliegue, respaldo y recuperaciÃ³n.
7. El responsable del proyecto valide los criterios funcionales de cada fase.

**Importante:** este es un **plan de ejecuciÃ³n para un prototipo en evoluciÃ³n**, no una promesa de que el producto estÃ¡ listo para presentaciÃ³n o adopciÃ³n oficial por AlfaCode.

---

## 11. Referencias oficiales para decisiones de implementaciÃ³n

- Next.js — documentacion oficial: <https://nextjs.org/docs>
- React — documentacion oficial: <https://react.dev/reference/react>
- NestJS â€” documentaciÃ³n: <https://docs.nestjs.com/>
- TypeORM â€” migraciones: <https://typeorm.io/docs/migrations/setup/>
- TypeORM â€” SQLite: <https://typeorm.io/docs/drivers/sqlite/>
- Railway â€” PostgreSQL: <https://docs.railway.com/databases/postgresql>
- Railway â€” despliegue y servicios: <https://docs.railway.com/guides/docker-compose>

**Nota:** antes de ejecutar comandos concretos, verificar la documentaciÃ³n vigente de las versiones realmente instaladas; conservar los nÃºmeros de versiÃ³n y decisiones de compatibilidad en `docs/versiones.md`.
