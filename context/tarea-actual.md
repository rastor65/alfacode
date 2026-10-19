# Tarea actual - Fase 4, I-17 (produccion academica)

## Estado

**Fase activa:** 4 - Produccion academica, I-17 (F4-01 a F4-04), autorizada con pendientes de I-16 por DEC-033. La Fase 3 no se declara cerrada. Fase 2 cerrada y aprobada en SQLite (I-13, DEC-025 y DEC-026).
**Aprobadas:** Fase 0 (DEC-004), I-04 (DEC-007), I-05 (DEC-008), I-06 (DEC-011), I-07 (DEC-013), I-08, I-09, I-10 y DEC-016 (DEC-020), I-11 y DEC-021 (DEC-022), I-12, DEC-023 y registro con Hoja de Vida (DEC-024), I-13 (DEC-026), I-14 y DEC-027 (DEC-028).
**Pendiente:** prueba de interaccion en navegador real (arrastrar tarjetas, selectores, modales).
**I-14 (F3-01 a F3-04):** aprobada (DEC-028).
**I-15 (F3-05 a F3-09):** aprobada por el responsable el 2026-10-18 (DEC-031), incluidas las decisiones de implementacion de DEC-030.
**Trabajo actualmente autorizado:** I-17 (F4-01 a F4-04: productos, autorias, asociaciones y reconocimientos), autorizada expresamente el 2026-10-18 con los pendientes de I-16 registrados (DEC-033). I-16 no se declara aprobada ni Fase 3 cerrada. PostgreSQL sigue pausado.

## Fases de I-08

| Fase | Contenido | Estado |
|---|---|---|
| I-08.1 | Base (cliente de API con CSRF, sesion en servidor, componentes de formulario), `/ingresar`, `/panel`, cerrar sesion, layout privado sutil, temas claro/oscuro/sistema con desplegable | Revisada por el responsable |
| I-08.2 | `/registro`, `/invitacion`; tras DEC-016: solicitud sin contrasena, `/cambiar-contrasena` obligatoria con contrasena temporal y sin `/verificar-correo` | Verificada tecnicamente |
| I-08.3 | `/recuperar-contrasena`, `/restablecer-contrasena`, enlace desde `/ingresar`; repaso de accesibilidad | Verificada tecnicamente |

## Resultado tecnico verificado de I-08.3

- Paginas reales en puertos aislados con base y outbox temporales: `/ingresar` enlaza a `/recuperar-contrasena`; `/recuperar-contrasena` y `/restablecer-contrasena` 200 (esta con `no-referrer` y boton deshabilitado hasta leer el enlace); el correo lleva `/restablecer-contrasena#token=...`; restablecer 200, la sesion anterior queda cerrada (307 a `/ingresar`) y la contrasena nueva funciona; sin secretos ni errores en los logs.
- Accesibilidad: enlace "Saltar al contenido" con `main#contenido`; el menu movil recibe el foco al abrirse y Escape lo devuelve al boton; el indicador de carga respeta `prefers-reduced-motion`; `lang="es"` ya estaba. Contraste WCAG AA verificado en I-08.1.
- `npm run verify` OK (26 + 127 pruebas).
- **No verificado por el agente:** la interaccion en un navegador real (envio de formularios, foco, desplegables).

## I-09 (gestion, F1-14 segunda parte) por fases

**Estado:** autorizada (DEC-017).

| Fase | Contenido | Estado |
|---|---|---|
| I-09.1 | `/perfil`: datos de la cuenta, editar nombre, cambiar contrasena en la misma vista | Verificada tecnicamente |
| I-09.2 | `/solicitudes`: pestanas por estado, paginacion, aprobar con rol y comentario, rechazar, aviso de entrega de la contrasena temporal (correo, manual una sola vez con copiar, o fallo con reintento) | Verificada tecnicamente |
| I-09.3 | `/integrantes` (busqueda, filtro por rol; autoridades: correo, filtro por estado, invitar) e `/integrantes/[id]` (autoridades: activar/desactivar con motivo, rol al reactivar, asignar y quitar roles, regenerar contrasena temporal) | Verificada tecnicamente |

## Resultado tecnico verificado de I-09.1 e I-09.2

- `frontend/src/lib/api/server.ts`: lectura desde el servidor con la cookie y la IP real de quien navega; `getSessionUser` lo reutiliza.
- `npm --prefix frontend test`: 30 pruebas OK (roles asignables, autoridad, filtros de URL).
- Puertos aislados con base y outbox temporales: `/solicitudes` (admin) muestra pendientes con mensaje y acciones; tras aprobar, la pestana de aprobadas muestra rol, revisor, fecha en hora de Bogota y comentario; un investigador ve el aviso de permiso y no tiene el enlace en el menu; `/perfil` muestra correo, roles, estado, fecha de alta y los formularios; editar el nombre se refleja en la vista. Sin errores en los logs.
- `npm run verify` OK (30 + 127 pruebas).
- **No verificado por el agente:** la interaccion en un navegador real (aprobar o rechazar desde la interfaz, copiar la contrasena temporal, reintento).

## Resultado tecnico verificado de I-09.3

- `npm --prefix frontend test`: 33 pruebas OK (`canManageMember`, filtros).
- Puertos aislados con base y outbox temporales, por rol: un estudiante ve nombres y roles sin correos ajenos, sin invitar, sin pestanas de estado ni enlaces al detalle, y recibe 404 en `/integrantes/[id]`; el admin ve correos, invitar, pestanas y enlaces; busqueda por nombre y filtro por rol funcionan; en su propio detalle el admin no tiene acciones; un coordinator no puede administrar al admin y, sobre una estudiante, solo se le ofrecen `researcher` y `teacher_leader` para agregar; tras desactivar, la persona aparece en Inactivos y su detalle ofrece activar. Sin errores en los logs.
- `npm run verify` OK (33 + 127 pruebas).
- **No verificado por el agente:** la interaccion en un navegador real.

## I-10 (Fase 2: proyectos y equipos, F2-01 a F2-06) por fases

**Estado:** autorizada (DEC-018). Crear proyectos: solo `admin` y `coordinator` (valor por defecto del plan).

| Fase | Contenido | Estado |
|---|---|---|
| I-10.1 | Backend: migracion `ProjectsAndTeams1728740000000` (`projects`, `project_members`), politica de acceso, estados, equipo, auditoria; API `GET/POST /projects`, `GET/PATCH /projects/:id`, `POST /projects/:id/status`, `GET/POST /projects/:id/members`, `PATCH/DELETE /projects/:id/members/:userId` | Verificada tecnicamente |
| I-10.2 | Frontend en `/hub/proyectos` (DEC-019): listado con filtros, crear/editar, detalle, equipo y estados (en modales) | Verificada tecnicamente |

## Resultado tecnico verificado de I-10.1

- `npm --prefix backend test`: 145 pruebas OK (18 nuevas de proyectos: creacion y validacion, visibilidad con 404 para ajenos y docente lider sin pertenencia, correos solo para autoridades, equipo por lider y no por colaborador, integrantes activos, lider obligatorio en proyecto activo, transiciones y bloqueo de proyectos finalizados, edicion auditada).
- Migracion aplicada, revertida y reaplicada en la base local (usuarios intactos).
- `npm run verify` OK (38 + 145 pruebas).
- Las mutaciones de control no se completaron: el responsable interrumpio esa ejecucion; una mutacion quedo aplicada y se restauro desde su respaldo verificado (sin `if (false)` restantes, pruebas en verde).
- Pendiente de I-11: impedir retirar a un miembro con tareas asignadas (F2-04) cuando existan tareas.

## Resultado tecnico verificado de I-10.2

- Vistas privadas movidas bajo `/hub` con redirecciones 307 desde las rutas anteriores (DEC-019).
- `/hub/proyectos`: listado (autoridades ven todos; el resto, los suyos) con busqueda y filtros de estado y metodologia en la URL; boton "Nuevo proyecto" solo para autoridades; detalle en modal con edicion, cambios de estado con confirmacion y motivo, y equipo (agregar integrantes activos, cambiar rol, retirar). Las acciones se muestran segun los `permissions` que calcula el backend, que sigue siendo quien autoriza.
- `npm --prefix frontend test` 43 OK (nueva `features/projects/types.test.ts`; detecto que `parseProjectStatus` aceptaba claves heredadas como `constructor`, corregido); lint OK; `npm run verify` OK (43 + 145 pruebas).
- Flujo verificado en puertos aislados 3100/4100 con base temporal (luego eliminada): redireccion sin sesion, `/panel` -> `/hub`, login, alta, listado con lider, activacion, filtros, parametros invalidos ignorados, bloqueo al retirar al unico lider de un proyecto activo, las cinco vistas `/hub/*` con 200. No se uso navegador real: la interaccion de los modales queda pendiente de revision del responsable.

## I-11 (Fase 2B: tareas, backlog, Kanban y progreso, F2-07 a F2-12)

**Estado:** autorizada (DEC-020); implementada y verificada tecnicamente. Decisiones en DEC-021.

| Parte | Contenido | Estado |
|---|---|---|
| Backend | Migracion `Tasks1728750000000`; modulo `tasks` (entidad, politica, DTO, servicio, controlador); `GET/POST /projects/:id/tasks`, `GET/PATCH /projects/:id/tasks/:taskId`; `progress` en proyectos; F2-04 con `?unassignTasks=true`; auditoria de tareas (F2-21 en lo que toca a tareas) | Verificada tecnicamente |
| Frontend | `/hub/proyectos/[id]/tareas`: tablero de cuatro columnas, filtros (todas, mis tareas, sin responsable), alta, detalle y edicion en modales, mover con selector o arrastrando; progreso en listado y detalle; enlace al tablero; confirmacion al retirar a alguien con tareas abiertas | Verificada tecnicamente |

## Resultado tecnico verificado de I-11

- `npm --prefix backend test`: 162 pruebas OK (17 nuevas de tareas: alta y valores por defecto, colaborador sin alta, responsable miembro activo, validacion sin `projectId`/`sprintId` del cliente, movimientos del colaborador que persisten, limites del colaborador, edicion del lider, solo lectura en proyectos finalizados, tarea de otro proyecto 404, ajeno 404, filtros y orden, progreso, F2-04 y auditoria).
- Tres mutaciones de control detectadas y revertidas: sin filtro de proyecto al cargar la tarea, colaborador sin comprobar asignacion, retiro sin comprobar tareas abiertas.
- Migracion aplicada, revertida y reaplicada en la base local (respaldo previo; usuarios intactos).
- `npm --prefix frontend test`: 52 pruebas OK (progreso sin porcentaje con cero tareas, filtros, agrupacion, orden, vencimiento en hora de Bogota).
- `npm run verify` OK (52 + 162 pruebas, sin migraciones pendientes).
- Flujo real en puertos aislados 3100/4100 con base y outbox temporales (luego eliminadas): 20/20 comprobaciones (proyecto agil con "Backlog", tablero vacio con "Sin tareas", alta, asignacion invalida 409, colaborador mueve solo lo suyo, progreso en tablero y listado, vencida, 404 para ajenos e ID invalido, redireccion sin sesion, retiro con confirmacion y desasignacion, solo lectura al cancelar). Sin errores ni secretos en los logs.
- **No verificado por el agente:** la interaccion en un navegador real.

## I-12 (Fase 2C: sprints opcionales, F2-13 a F2-21)

**Estado:** aprobada (DEC-024). Decisiones en DEC-023.

| Parte | Contenido | Estado |
|---|---|---|
| Backend | Migracion `Sprints1728760000000` (`sprints`, `sprint_closure_items`, reconstruccion de `tasks` con clave compuesta, indice de un activo); modulo `sprints`; `GET/POST /projects/:id/sprints`, `GET/PATCH /projects/:id/sprints/:sprintId`, `POST/DELETE .../tasks`, `POST .../start`, `.../complete`, `.../cancel`; `POST /projects/:id/methodology`; filtro `sprintId` en tareas; reapertura al backlog; auditoria de sprints | Verificada tecnicamente |
| Frontend | `/hub/proyectos/[id]/sprints` con lista, alta, detalle, planificacion, ciclo de vida e historial; selector de sprint en el tablero agil; pestanas del proyecto; cambio de modalidad en el detalle del proyecto | Verificada tecnicamente |

## Resultado tecnico verificado de I-12

- `npm --prefix backend test`: 181 pruebas OK (19 nuevas de sprints: tradicional sin sprints, planificacion, fechas, tarea de otro proyecto rechazada por API y por la clave compuesta, tarea ya planificada, devolver al backlog y edicion solo planificada, segundo activo rechazado, cuatro inicios simultaneos con un solo activo, indice unico ante escritura directa, proyecto finalizado, tablero del sprint, cierre con registro y backlog, registro inmutable y reapertura, cancelacion con motivo, permisos del colaborador, ajeno 404, sprint de otro proyecto, cambio de modalidad y auditoria).
- Tres mutaciones de control detectadas y revertidas: cierre sin devolver pendientes al backlog, planificacion sin filtrar por proyecto, cambio a tradicional sin comprobar sprints.
- Migracion aplicada, revertida y reaplicada en la base local con respaldo previo (usuarios intactos, `PRAGMA foreign_key_check` sin errores).
- `npm --prefix frontend test`: 55 pruebas OK; lint y typecheck OK.
- `npm run verify` OK (55 + 181 pruebas, sin migraciones pendientes).
- Recorrido E2E (prueba F2-12) en puertos aislados 3100/4100 con base y outbox temporales: registro publico, aprobacion, contrasena temporal por correo, cambio obligatorio, proyecto agil, equipo, tareas, sprint, inicios simultaneos, tablero del sprint, cierre, historial, modalidad y proyecto tradicional sin sprints: 17/17 (una comprobacion del script usaba un nombre invalido; corregido y confirmado aparte). Tras reiniciar el backend, sprint, historial y tareas persisten (prueba F2-9): 2/2. Sin errores ni secretos en los logs; base, outbox y respaldos eliminados.
- **No verificado por el agente:** la interaccion en un navegador real.
- **Bloqueado:** la prueba F2-11 (SQLite y PostgreSQL) mientras PostgreSQL siga pausado; por eso no se declara "MVP listo" (puerta MVP del plan).

## I-13 (cierre de la Fase 2, puerta MVP)

**Estado:** aprobada (DEC-026). PostgreSQL fuera del cierre por DEC-025.

### Pruebas de aceptacion F2

| # | Criterio | Evidencia | Estado |
|---|---|---|---|
| 1 | Tradicional sin sprints, ni por API | `sprints.http.spec.ts` "modalidad tradicional" | Cumplido |
| 2 | Agil con tareas en backlog | `sprints.http.spec.ts` "crear y planificar"; E2E | Cumplido |
| 3 | Lider crea, planifica, activa; Kanban | `sprints.http.spec.ts` "tablero del sprint activo"; E2E | Cumplido |
| 4 | Un solo sprint activo, tambien concurrente | `sprints.http.spec.ts` (inicios simultaneos e indice unico) | Cumplido |
| 5 | Tarea de otro proyecto rechazada | `sprints.http.spec.ts` (API y clave compuesta) | Cumplido |
| 6 | Cierre con registro; pendientes al backlog | `sprints.http.spec.ts` "cierre y cancelacion"; E2E | Cumplido |
| 7 | Ajeno no accede cambiando ID | `projects`, `tasks` y `sprints.http.spec.ts`; E2E | Cumplido |
| 8 | Colaborador no crea sprints ni reasigna | `sprints.http.spec.ts`, `tasks.http.spec.ts`; E2E | Cumplido |
| 9 | Persistencia tras reiniciar | E2E: reinicio del backend con sprint activo, sesiones y tareas intactas | Cumplido (servidor; navegador no probado) |
| 10 | "Sin tareas", sin porcentaje | `frontend/src/features/tasks/types.test.ts`; E2E (progreso 0 de 0) | Cumplido |
| 11 | Migraciones desde cero y flujos en SQLite y PostgreSQL | E2E: 9 migraciones ida, vuelta completa e ida en SQLite | SQLite cumplido; PostgreSQL diferido (DEC-025) |
| 12 | E2E registro/invitacion -> ... -> historial | `npm run e2e:mvp`: 32/32 | Cumplido (a nivel de API) |

### Resultado tecnico verificado de I-13

- Nuevo `scripts/e2e-mvp.mjs` y script raiz `npm run e2e:mvp` (renombrados en I-14 a `scripts/e2e.mjs` y `npm run e2e`): base, outbox y puerto (4100) temporales; migraciones desde cero, reversion completa y reaplicacion; admin por bootstrap no interactivo; invitacion y aceptacion; registro con Hoja de Vida, aprobacion, contrasena temporal y cambio obligatorio; proyecto agil, equipo, tareas, sprint, tablero, reinicio del backend, cierre, historial, progreso y acceso ajeno. Ejecutado dos veces: 32/32 en ambas; temporales eliminados y puerto liberado.
- `npm audit`: backend 0 (todas y produccion); frontend 0 en produccion y 5 altas solo de desarrollo en la cadena de `eslint-config-next` (`braces`/`micromatch`/`fast-glob`), las mismas registradas en I-08.1; la correccion automatica degrada a `eslint-config-next@14` y no se aplico.
- `register-form.tsx`: eliminadas las 3 advertencias de lint (import y setters sin uso), sin cambio de comportamiento.
- `npm run verify` OK (55 + 182 pruebas, lint sin advertencias).
- Base local: respaldo `backend/data/alfacode-hub.backup-2026-10-15.sqlite` y `migration:run` aplico `MembershipRequestCv1728750000000`; sin pendientes.

### Pendientes documentados (puerta MVP)

- **PostgreSQL (DEC-025):** implementar las migraciones para PostgreSQL y repetir F2 #11 antes de cualquier publicacion con usuarios reales.
- **Navegador real:** la interaccion (arrastrar tarjetas, selectores, modales, formulario de registro en 3 pasos) no la verifico el agente; requiere una revision manual.
- **Despliegue en Koyeb:** `Dockerfile`, `backend/Dockerfile` y `backend/docker-entrypoint.sh` llegaron desde `main`, fuera del plan (Railway, produccion pausada). Requiere decision del responsable.
- **Bootstrap no interactivo del admin** (`BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD`, desde `main`): util para despliegue y pruebas, pero la contrasena viaja en variables de entorno; revisar antes de produccion.
- **Timestamp repetido:** `MembershipRequestCv1728750000000` y `Tasks1728750000000`; funciona (nombres distintos), no se renombra.
- **Dependencias de desarrollo:** 5 vulnerabilidades en la cadena de ESLint, sin correccion compatible por ahora.
- **Hoja de Vida:** la migracion de `cv_data` tampoco soporta PostgreSQL (como las demas).

## I-14 (Fase 3: investigacion, F3-01 a F3-04)

**Estado:** aprobada (DEC-028). Decisiones en DEC-027.

| Parte | Contenido | Estado |
|---|---|---|
| Backend | Migracion `Research1728770000000` (`research_lines`, `project_research_lines`, `project_research_profiles`, `research_results`, `research_result_participants`); modulo `research`; `GET/POST /research-lines`, `GET/PATCH/DELETE /research-lines/:id`; `GET/POST /projects/:id/research-lines`, `DELETE /projects/:id/research-lines/:lineId`; `GET/PUT /projects/:id/research-profile`; `GET/POST /projects/:id/research-results`, `GET/PATCH/DELETE /projects/:id/research-results/:resultId`; auditoria | Verificada tecnicamente |
| Frontend | `/hub/investigacion` (catalogo de lineas) y pestana «Investigacion» del proyecto (lineas, ficha, resultados); menu lateral; enlace desde el detalle del proyecto | Verificada tecnicamente |

### Resultado tecnico verificado de I-14

- `npm --prefix backend test`: 201 pruebas OK (19 nuevas: politica, gestion de lineas solo por autoridades, consulta por cualquier integrante, nombres duplicados con tildes y mayusculas, responsable activo, eliminar solo sin proyectos, asociacion multiple sin duplicados, lineas inactivas o inexistentes, colaborador sin gestion, ajeno 404 y lineas sin proyectos ajenos, proyecto sin ficha, ficha unica, resultados sin crear tareas, participantes del equipo y conservacion tras salir, resultado de otro proyecto 404, proyecto finalizado en solo lectura, auditoria).
- Tres mutaciones de control detectadas y revertidas: asociar lineas inactivas, participantes ajenos al proyecto, resultado buscado sin su proyecto.
- Una prueba fallo de forma intermitente en `npm run verify` por orden inestable (dos asociaciones en el mismo segundo); se corrigio ordenando las lineas del proyecto por nombre y la prueba de investigacion paso tres veces seguidas.
- `npm --prefix frontend test`: 59 pruebas OK (4 nuevas); lint y typecheck OK.
- `npm run verify` OK (59 + 201, sin migraciones pendientes).
- `npm run e2e`: 44/44 (32 de la Fase 2 + 8 de investigacion por API + 4 de paginas reales: catalogo, pestana del proyecto con linea, ficha y resultado, 404 para ajenos y redireccion sin sesion). Temporales eliminados y puertos 3100/4100 liberados; el servidor `next dev` del responsable en el puerto 3000 no se toco.
- Base local: respaldo `backend/data/alfacode-hub.backup-2026-10-15-i14.sqlite`; `migration:run`, `revert` y `run` de `Research1728770000000`; sin pendientes.
- **No verificado por el agente:** la interaccion en un navegador real (modales, selectores, casillas de participantes).

## I-15 (Fase 3: documentos, F3-05 a F3-09)

**Estado:** aprobada (DEC-031). Decisiones del responsable en DEC-029 y de implementacion en DEC-030.

| Parte | Contenido | Estado |
|---|---|---|
| Backend | Migracion `Documents1728780000000` (`documents`, `document_grants`, indice unico `research_results (id, project_id)`); modulo `documents` con `StorageService` (disco local o deshabilitado), validacion por firma, politica `general`/`restricted`/`private`; `GET/POST /documents`, `GET/POST /projects/:id/documents`, `GET/PATCH/DELETE /documents/:id`, `GET /documents/:id/download`; auditoria | Verificada tecnicamente |
| Frontend | `/hub/documentos` (repositorio con busqueda y filtros; carga institucional para la coordinacion), pestana «Documentos» del proyecto, formulario de carga y edicion con personas autorizadas, documentos de cada resultado en la pestana de investigacion; `apiUpload` | Verificada tecnicamente |

### Resultado tecnico verificado de I-15

- `npm --prefix backend test`: 227 pruebas OK (26 nuevas: firmas de los siete formatos, contenido incoherente, macros, directorio ZIP, saneo de nombres, `Content-Disposition`, almacenamiento local y path traversal, configuracion de produccion, politica; carga y descarga byte a byte, Word y PNG, 413, 415, archivo ausente, campos extra, sesion y CSRF, restringido, general, privado con autorizacion y su retiro, autorizaciones solo en privados y activos, gestion, eliminacion con archivo, proyecto finalizado, repositorio institucional, vinculo a resultado propio y no ajeno tambien en la base de datos, modulo deshabilitado con 503).
- Las pruebas detectaron y se corrigieron: nombres con tildes corrompidos (latin1) y descarga serializada como JSON (`StreamableFile`).
- Cuatro mutaciones de control detectadas y revertidas: restringido abierto, PDF sin firma, privado abierto, resultado de otro proyecto.
- `npm --prefix frontend test`: 67 pruebas OK (8 nuevas); lint y typecheck OK.
- `npm run verify` OK (67 + 227, sin migraciones pendientes).
- `npm run e2e`: 58/58 (14 nuevas de documentos: carga vinculada a un resultado, descarga identica como adjunto, ajeno 404, contenido falso 415, privado visible para la coordinacion y no para ajenos, institucional general; 19 MiB subidos y descargados integros a traves del proxy de Next.js, mas de 20 MiB con 413; paginas de documentos del proyecto, repositorio y enlace desde el resultado). La prueba a traves del proxy revelo el corte a 10 MB de Next.js (corregido).
- Incidencia: en una ejecucion intermedia, una carga de la prueba llego al backend de desarrollo del responsable (puerto 4000) porque la compilacion de produccion del frontend fija el destino del proxy; ese backend la rechazo con 403 por el origen antes de leer el archivo. Corregido compilando la prueba en `.next/e2e` con su propio destino.
- Base local: respaldo `backend/data/alfacode-hub.backup-2026-10-15-i15.sqlite`; `migration:run`, `revert` y `run` de `Documents1728780000000`; sin pendientes.
- **No verificado por el agente:** la interaccion en un navegador real (selector de archivos, modales, casillas de autorizacion, descarga desde el navegador).
- **Pendiente antes de produccion:** elegir proveedor de almacenamiento privado y credenciales (DEC-029); hasta entonces el modulo responde 503 con `NODE_ENV=production`.

## I-16 (verificacion de cierre de la Fase 3)

**Fecha:** 2026-10-18. **Estado:** verificacion SQLite satisfactoria; pendiente de revision del responsable. No se declara cierre integral mientras queden los criterios y observaciones siguientes.

### Matriz de aceptacion F3

| # | Criterio del plan | Evidencia ejecutada | Resultado |
|---|---|---|---|
| 1 | Proyecto no investigativo sin ficha | E2E: proyecto `software`, consulta inicial con `profile: null` | Cumplido en SQLite |
| 2 | Persona autorizada asocia linea y registra resultado | E2E: coordinador asocia linea y crea resultado con participante; estudiante consulta sin gestion | Cumplido en SQLite |
| 3 | Documento consultable desde el proyecto sin duplicacion fisica | E2E: vinculo al resultado, pagina de documentos, descarga identica; cuatro cargas validas, cuatro metadatos y cuatro archivos tras consultas y reinicio | Cumplido en SQLite/local |
| 4 | Ajeno no descarga cambiando ID/URL | E2E: 404 en restringido y privado, tambien tras reinicio; pruebas backend de autorizaciones y retiro de permisos | Cumplido en SQLite |
| 5 | Rechazo de exceso de tamano y tipos no permitidos | Backend: 413/415; E2E: falso PDF 415, 19 MiB integro por proxy, mas de 20 MiB 413, sin residuos en disco | Cumplido |
| 6 | Metadatos/relaciones en ambos motores y almacenamiento externo antes de produccion | SQLite: 11 migraciones ida/vuelta/ida, integridad fisica y claves foraneas sin errores; almacenamiento local con tamanos y SHA-256 correctos | Parcial: PostgreSQL pausado; proveedor externo pendiente (DEC-029) |

### Comandos ejecutados

- `npm run check`: OK; 67 pruebas frontend + 227 backend, lint, builds, typecheck, `migration:show` sin pendientes y health directo/proxy/pagina tecnica.
- `npm run e2e`: 65/65 (58 existentes + 7 nuevas comprobaciones de persistencia, permisos, integridad y archivos). Ejecuta `migration:run`, once `migration:revert`, `migration:show` y reaplicacion solo en SQLite temporal. Sin nuevas migraciones ni instalaciones.
- `npm --prefix backend audit --json`: 0 vulnerabilidades (salida 0).
- `npm --prefix frontend audit --omit=dev --json`: 0 vulnerabilidades de produccion (salida 0).
- `npm --prefix frontend audit --json`: 5 altas en `braces`, `micromatch`, `fast-glob`, `@next/eslint-plugin-next` y `eslint-config-next` (salida 1), las mismas ya registradas. La solucion automatica propone degradar a `eslint-config-next@14.2.35`; no se aplico.

### Pendientes de cierre y produccion

- Continuacion autorizada en DEC-032: ver [revision de seguridad y recorrido de navegador](../docs/revision-i16.md). `node scripts/review-eslint-security.mjs`: 138 archivos, 0 errores/advertencias, 0 llamadas a la ruta `globSync` observada. Las alertas siguen abiertas; el controlador local del navegador esta bloqueado por infraestructura. Modo de revision aislada: `npm run e2e -- --review`.
- PostgreSQL: completar y validar metadatos/relaciones F3 cuando se levante la pausa; no se extiende automaticamente a Fase 3 la excepcion de Fase 2.
- Seguridad: revisar/resolver las cinco altas de herramientas de desarrollo; no se reclasifican como no criticas ni se omiten del cierre.
- Interaccion real en navegador: modales, selectores, selector de archivos, autorizaciones y descarga. Las paginas se verificaron por HTTP/SSR; no se ejecutaron acciones de UI en navegador.
- Antes de produccion: proveedor privado, politica de conservacion y prueba del almacenamiento externo. Produccion documental sigue deshabilitada hasta configuracion autorizada (DEC-029).
- Pendientes de I-16 conservados. Posteriormente DEC-033 autorizo I-17 sin declarar cerrada la Fase 3. Sin commit, push ni despliegue.

## I-17 (produccion academica, F4-01 a F4-04)

**Autorizacion:** DEC-033. **Estado:** implementada y verificada tecnicamente en SQLite; pendiente de aprobacion del responsable. Decisiones de implementacion: DEC-034, pendientes de revision.

| Tarea | Entregable implementado | Evidencia |
|---|---|---|
| F4-01 | Productos por tipo/estado, fecha, fuente, DOI y enlace; CRUD, filtros y paginacion | API `/academic-products`, modales y vistas `/hub/produccion` y `/hub/proyectos/[id]/produccion` |
| F4-02 | Autores internos/externos, orden estable con botones, sin cuentas falsas | Validaciones de exclusividad/duplicados; historial filtrado desde perfil e integrantes; conserva autores que salieron del equipo |
| F4-03 | Un proyecto opcional y multiples resultados del mismo proyecto, sin copiar sus datos | `academic_product_results`, FK compuesta; filtros de acceso en SQL antes de contar |
| F4-04 | Reconocimientos personales/de proyecto con fecha y evidencia existente opcional | API `/recognitions`, enlace a Gestion documental; prueba de permisos y borrado sin eliminar archivos |

### Cambios y comprobaciones

- Migracion nueva: `backend/src/database/migrations/1728790000000-academic.ts`. Tablas `academic_products`, `product_authors`, `academic_product_results`, `recognitions`. Se integra en `database.options.ts` con sus entidades; `synchronize: false` conservado.
- Backend nuevo: `backend/src/modules/academic/{academic.entities,academic.dto,academic.service,academic.controller,academic.module,academic.http.spec}.ts`; integrado en `app.module.ts`. `DocumentsModule` exporta `DocumentsService` para reutilizar permisos de evidencia.
- Frontend nuevo: `frontend/src/features/academic/*`, pagina general y pagina de produccion de proyecto. Modificados menu, pestanas de proyecto, perfil e integrantes para consultar historial autorizado. Sin cambiar tokens de tema ni instalar bibliotecas.
- Pruebas: 13 nuevas HTTP backend y 2 frontend. Cubren tipos, DOI/URL/fechas, autorias ordenadas/externas, duplicados, campos protegidos, permisos por proyecto, totales sin fugas, referencias cruzadas, historial, proyecto finalizado y evidencia privada/compartida/borrada.
- `npm run check`: OK (69 pruebas frontend, 240 backend, lint, builds/typecheck, migraciones y tres comprobaciones health). Tras ajustar la busqueda literal con comodines escapados, se repitieron las 13 pruebas HTTP de I-17: 13/13.
- `npm run e2e`: 74/74; doce migraciones ida/vuelta/ida en SQLite temporal, API y paginas SSR, persistencia despues de reiniciar, integridad de SQLite y archivos. Un fallo intermedio revelo que la pagina del proyecto ajeno devolvia error de servidor; se corrigio reutilizando `loadProjectData` para mostrar 404.
- Base local: respaldo SQLite online `backend/data/alfacode-hub.backup-2026-10-18-i17.sqlite`; `npm --prefix backend run migration:run` aplico una migracion y `migration:show` sin pendientes. Comparacion de conteos de `users`, `projects`, `tasks`, `research_results` y `documents` con el respaldo: conservados; `PRAGMA foreign_key_check` sin errores.
- Primer intento E2E: el build detecto una conversion de tipos en el borrado generico, corregida separando la carga de producto y reconocimiento. No se ocultaron fallos.
- Sin instalaciones, commit, push ni despliegue. El respaldo y la base local estan ignorados en Git.

### Limites y siguiente paso

- Pendientes heredados de I-16: alertas ESLint, navegador local no disponible, PostgreSQL pausado y almacenamiento productivo por elegir. La UI nueva tampoco se declara probada en navegador; E2E verifica API y HTML renderizado.
- No se implementan eventos, calendario ni asistencia (I-18), integraciones externas ni visibilidad publica. Producto: un proyecto por registro en esta iteracion (DEC-034).
- Siguiente paso: revision y aprobacion del responsable de I-17/DEC-034; luego autorizar I-18. No iniciar esa iteracion automaticamente.

## No realizar sin nueva autorizacion

- No iniciar I-18 (eventos) ni publicar con usuarios reales sin nueva autorizacion. I-17 esta autorizada por DEC-033.
- No elegir proveedor de almacenamiento de produccion ni crear credenciales sin autorizacion (F3-06).
- No modificar el trabajo de otras personas colaboradoras sin acuerdo.
- No configurar PostgreSQL ni Railway.
- No crear datos reales de personas.
