# Tarea actual - I-27 (vista general de proyectos) sobre I-26

## Estado

**Trabajo actualmente autorizado:** I-26 (DEC-049), por solicitud directa del responsable: `/hub` muestra un panel distinto segun el rol (autoridades: panel del semillero + "Mi trabajo"; demas roles: panel personal ampliado). Indicadores G-01 a G-07 y M-07 a M-10 en `docs/catalogo-indicadores.md`. Dependencia nueva `recharts`. Sin cambios de esquema, commit, push ni despliegue.
**Trabajo adicional autorizado:** I-27 primera parte (DEC-050): vista general `/hub/proyectos` con indicadores, pestañas, filtros, orden y vista de tarjetas o tabla. Implementada y verificada tecnicamente (verify 82 + 311, E2E 150/150); pendiente de recorrido en navegador y aprobacion. Tercera parte (tablero y backlog `/hub/proyectos/[id]/tareas`) implementada y verificada tecnicamente (verify 92 + 313, E2E 156/156). Segunda parte (pagina `/hub/proyectos/[id]`) implementada y verificada tecnicamente (verify 84 + 313, E2E 153/153); pendiente de recorrido en navegador y aprobacion.
**Estado I-26 (2026-10-23):** implementada y verificada tecnicamente en SQLite (verify 76 + 305, E2E 145/145); pendiente de recorrido en navegador real y de aprobacion del responsable. Evidencia en `context/estado-actual.md`.
**Iteracion anterior:** I-25 concluida y aprobada (DEC-048); su registro se conserva debajo.

**Fase activa (anterior):** 6 - I-25, validacion de F6-01 a F6-08 (DEC-047). I-23 e I-24 implementadas y verificadas tecnicamente, sin aprobacion formal atribuida. PostgreSQL pausado: criterio F6 de compatibilidad bloqueado.
**Trabajo autorizado anterior:** I-25 por "continua con i 25" (DEC-047): solo pruebas, revision y correcciones de defectos comprobados. Sin funcionalidades nuevas, commit, push ni despliegue.
**Resultado I-25 (2026-10-22):** ejecutada; sin defectos comprobados. Verify 74 + 297, E2E 143/143, Chrome 17/17 y 22/22. Criterios F6 cumplidos en SQLite salvo PostgreSQL (bloqueado). Detalle en `docs/revision-i25.md`. I-23/I-24/I-25 aprobadas (DEC-048). No hay iteracion siguiente autorizada.
**Aprobadas:** Fase 0 (DEC-004), I-04 (DEC-007), I-05 (DEC-008), I-06 (DEC-011), I-07 (DEC-013), I-08, I-09, I-10 y DEC-016 (DEC-020), I-11 y DEC-021 (DEC-022), I-12, DEC-023 y registro con Hoja de Vida (DEC-024), I-13 (DEC-026), I-14 y DEC-027 (DEC-028).
**Aprobacion posterior:** I-17/DEC-034, I-18/DEC-036 e I-19/DEC-038 revisadas y aprobadas por el responsable (DEC-039); sus apartados historicos siguientes conservan la evidencia de ejecucion y los pendientes tecnicos comunicados.
**Pendiente:** prueba de interaccion en navegador real (arrastrar tarjetas, selectores, modales).
**I-14 (F3-01 a F3-04):** aprobada (DEC-028).
**I-15 (F3-05 a F3-09):** aprobada por el responsable el 2026-10-18 (DEC-031), incluidas las decisiones de implementacion de DEC-030.
**Trabajo autorizado anterior (I-22, concluida):** I-22: verificar solicitudes, decisiones, privacidad, desvinculacion, historia e integridad de la Fase 5, por "continua con 9 22" (I-22 segun la continuidad; DEC-043). Solo pruebas/revision/correcciones de defectos comprobados, sin funcionalidades nuevas. No implica aprobacion formal de I-20/I-21 ni autoriza Fase 6 o despliegue.
**Resultado I-22 (2026-10-21):** verificada tecnicamente en SQLite: `npm run verify` salida 0 (72 + 273), `npm run e2e` salida 0 (130/130), audits sin cambios respecto a I-16, sin defectos comprobados ni correcciones de codigo. Detalle y recorrido manual pendiente en `docs/revision-i22.md`. Aprobada con I-20/I-21 por el responsable el 2026-10-21 (DEC-044); recorrido en Chrome 35/36 registrado en `docs/revision-i22.md`. No hay iteracion habilitada: Fase 6 requiere nueva autorizacion.

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
- I-18 autorizada posteriormente en DEC-035 por "continuemos"; no se atribuye aprobacion formal a I-17/DEC-034. Se conserva la revision pendiente.

## I-18 (eventos y actividades, F4-05 a F4-08)

**Autorizacion:** DEC-035. **Estado:** implementada y verificada tecnicamente en SQLite; pendiente de aprobacion del responsable. Reglas de implementacion: DEC-036, pendientes de revision.

| Tarea | Resultado | Verificacion |
|---|---|---|
| F4-05 | Actividades institucionales/de proyecto, fechas/horas, modalidad, ubicacion/enlace, organizador y estados explicitos | API `/events`; fecha UTC normalizada, permisos de equipo/organizador, finalizacion y cancelacion con motivo |
| F4-06 | Participantes con roles y asistencia opcional, sin duplicados | PK evento+usuario; solo admin/coordinator confirma asistencia; auditoria de cambios y conservacion tras finalizar |
| F4-07 | Convocatorias con apertura/cierre, organizador externo, requisitos y enlace | Tipo `call` sin crear postulaciones, cuentas externas ni integraciones |
| F4-08 | Agenda y calendario mensual con filtros y detalle en modal, registro de participantes/asistencia, evidencias reutilizadas | `/hub/actividades`, `/hub/proyectos/[id]/actividades`, menu y pestana; productos ya incluidos desde I-17 |

### Archivos y comandos ejecutados

- Backend nuevo: `backend/src/database/migrations/1728800000000-events.ts`; `backend/src/modules/events/{event.entities,event.dto,events.service,events.controller,events.module,events.http.spec}.ts`. Integracion en `app.module.ts` y `database.options.ts`; se conserva `synchronize: false`.
- Frontend nuevo: `frontend/src/features/events/{types.ts,types.test.ts,events-page.tsx,components/{event-form,event-detail,events-catalog}.tsx}`, paginas de actividades general/de proyecto y `frontend/src/lib/api/all-items.ts`. Modificados menu/pestanas y formularios/catalogo academicos para reutilizar la ayuda paginada, sin arrastrar un formulario de otro modulo al nuevo bundle.
- `npm --prefix backend run typecheck`: OK; prueba especifica `tsx --test src/modules/events/events.http.spec.ts`: 11/11. `npm --prefix frontend test`: 72/72 (3 nuevas de calendario/fechas); lint y build OK tras corregir dos llaves JSX omitidas en etiquetas de fechas.
- `npm run check`: OK: 72 pruebas frontend y 251 backend; lint sin advertencias, ambos builds/typecheck, sin migraciones pendientes y health directo/proxy/pagina tecnica.
- `npm run e2e`: 85/85; trece migraciones aplicadas desde cero, revertidas completamente y reaplicadas en SQLite temporal; evento/inscripcion/duplicado/asistencia/finalizacion/convocatoria, paginas SSR con calendario y permisos, y persistencia tras reiniciar. Evidencia enlazada al archivo existente, sin duplicacion fisica. Un fallo intermedio del script leia `/auth/me` con la envoltura de login; se corrigio para usar su contrato real (`id` directo).
- Base local: respaldo SQLite online `backend/data/alfacode-hub.backup-2026-10-18-i18.sqlite`; `npm --prefix backend run migration:run` aplico `Events1728800000000`; `migration:show` sin pendientes. Comparacion con respaldo de conteos en `users`, `projects`, `tasks`, `research_results`, `documents`, `academic_products` y `recognitions`: conservados; `PRAGMA foreign_key_check` sin errores.
- Sin instalaciones ni dependencias nuevas; bases/respaldo ignorados en Git. Sin commit, push, publicacion, notificaciones ni usuarios reales.

### Criterios y pendientes

- Satisfechos en SQLite: evento programado/iniciado/finalizado, participantes sin duplicados, asistencia autorizada y auditada; ajenos sin acceso por ID; convocatorias informativas; filtros de fecha en Bogota y calendario completo del mes (recorre todas las paginas autorizadas); evidencia/certificados desde Gestion documental sin ampliar permisos.
- Se conservan los pendientes de I-16: PostgreSQL, navegador local no disponible, observacion ESLint y almacenamiento productivo. No se afirma compatibilidad PostgreSQL ni interaccion real de UI; las pruebas E2E usan API y paginas SSR.
- I-17/DEC-034 e I-18/DEC-036 pendientes de revision. I-19 fue autorizada posteriormente por DEC-037; no se atribuye aprobacion formal a los resultados anteriores.

## I-19 (verificacion de cierre de Fase 4)

**Autorizacion:** DEC-037, "continuemos con i 19". **Estado:** verificacion automatizada satisfactoria en SQLite, pendiente de revision. No se aprueban I-17/I-18 ni el cierre integral de la fase por esta ejecucion.

- Alcance: revision de F4-01 a F4-08, sin funcionalidades nuevas. Matriz de los seis criterios del plan, resultados y recorrido manual pendiente en `docs/revision-i19.md`.
- Modificados en esta iteracion: `scripts/e2e.mjs` (13 comprobaciones adicionales; historial de dos autores internos y externa, permisos y conteos, filtros de fecha, ciclo de actividad, evidencia compartida, revocacion de acceso con conservacion de historia, reincorporacion sin duplicados y actor de asistencia auditado); `AGENTS.md`, `README.md`, `context/{README,estado-actual,tarea-actual}.md`, `docs/decisiones.md`. Creado `docs/revision-i19.md`. Cambios previos de I-18 conservados sin commit.
- `node --check scripts/e2e.mjs`: OK. `npm run check`: salida 0, lint, 72 pruebas frontend y 251 backend, ambos builds/typecheck, sin migraciones pendientes y tres health. El smoke utilizo endpoints locales existentes; Next.js rechazo un segundo dev, sin detener el servidor del responsable.
- `npm run e2e`: salida 0, 98/98 comprobaciones; trece migraciones desde cero, reversion y reaplicacion en base temporal, API/SSR, persistencia tras reinicio, integridad fisica/FK y cuatro documentos con sus cuatro archivos integros. Sin fallos intermedios en esta ejecucion.
- Auditorias ejecutadas: backend completa 0 vulnerabilidades (salida 0); frontend completa cinco altas de desarrollo (salida 1, cadena ESLint ya documentada); frontend `--omit=dev` 0 (salida 0). No se modificaron dependencias ni lockfiles; observacion de seguridad abierta.
- `git diff --check`: OK con advertencias LF/CRLF. Sin instalaciones, nuevas migraciones ni cambios a la base local, commit, push o despliegue. Las reversiones se limitaron a SQLite temporal.
- Criterios funcionales comprobados por API/SSR sobre SQLite. Pendientes: interaccion real en navegador y equivalencia PostgreSQL (pausado); observacion ESLint y almacenamiento/retencion productivos conservados. Siguiente paso: revisar I-17/I-18/I-19 y decidir cierre/continuidad con esos pendientes antes de autorizar Fase 5.

## I-20 (solicitudes administrativas, F5-01 a F5-04)

**Autorizacion:** Fase 5 en DEC-039. **Estado:** implementada y verificada tecnicamente en SQLite; sin atribuir aprobacion humana del incremento.

| Tarea | Implementacion | Evidencia |
|---|---|---|
| F5-01 | `administrative_requests`: solicitante, tipo, asunto, descripcion, estado, responsable, respuesta y timestamps; sin duplicar vinculacion | Migracion `AdministrativeRequests1728810000000`, modulo `backend/src/modules/administration/*` |
| F5-02 | Certificado, cambio de datos, desvinculacion, responsabilidades y general | DTO/API y prueba de los cinco tipos; `membership` rechazado |
| F5-03 | Pendiente -> en revision -> aprobada/rechazada; aprobada -> completada en tramites comunes, respuestas obligatorias para decidir/completar | Transiciones explicitas y auditadas; salida no se completa generica hasta implementar procedimiento I-21 |
| F5-04 | Bandeja propia y de revision; solo autoridades tramitan peticiones ajenas, sin autoaprobacion ni asignacion propia | Permisos backend y restricciones SQL; totales/paginacion filtrados antes de devolver resultados |

- Archivos nuevos: `backend/src/database/migrations/1728810000000-administrative-requests.ts`, `backend/src/modules/administration/{administrative-request.entity,administrative-request.dto,administration.service,administration.controller,administration.module,administration.http.spec}.ts`.
- Integracion en `backend/src/app.module.ts` y `backend/src/database/database.options.ts`; ampliado `scripts/e2e.mjs` con flujo de solicitudes, autoaprobacion y persistencia. Actualizados AGENTS/README/context/decisiones; `docs/revision-i19.md` registra aprobacion posterior sin borrar pendientes.
- Reglas de implementacion en DEC-040: todos los tramites de este bloque son institucionales; asignacion de responsable organiza la bandeja sin exclusividad. Aprobar no ejecuta cambios de datos/roles/cuentas. Completar un tramite comun registra ejecucion manual, sin generar constancias; la salida requiere el procedimiento seguro de I-21.
- Pruebas especificas `tsx --test src/modules/administration/administration.http.spec.ts`: 12/12. Primer intento 11/12 por expectativa del test que trataba roles de `/auth/me` como objetos; su contrato son cadenas. Se corrigio el test y se repitio satisfactoriamente.
- `npm --prefix backend run typecheck` y `npm --prefix backend run build`: OK. `node --check scripts/e2e.mjs`: OK.
- Respaldo online `backend/data/alfacode-hub.backup-2026-10-18-i20.sqlite`; `npm --prefix backend run migration:run`: una aplicada; `migration:show`: sin pendientes. Conteos de usuarios/proyectos/tareas/resultados/documentos/productos/reconocimientos/eventos/participantes conservados frente al respaldo; integridad SQLite y FK correctas. Base y respaldo ignorados en Git.
- `npm run check`: salida 0; lint, 72 pruebas frontend y 263 backend, compilaciones/typecheck y migraciones. Smoke alcanzo endpoints locales existentes; sus intentos duplicados chocaron con Next.js y el puerto 4000. Quedo un watcher adicional huerfano de esa prueba (PID 17844), identificado por arbol de procesos y detenido explicitamente; entonces finalizo el comando. Se conservaron los servidores del responsable y no se presenta el smoke como arranque aislado de la nueva funcionalidad.
- `npm run e2e`: salida 0, 107/107 (9 adicionales I-20); catorce migraciones aplicadas/revertidas/reaplicadas en SQLite temporal; solicitudes, autoaprobacion impedida, responsable y decision trazables, historial privado y persistencia tras reinicio; integridad fisica/FK y archivos correcta. Limpieza del entorno temporal completada y puertos 3100/4100 liberados.
- Pendientes de este bloque: F5-05 a F5-07 (salida efectiva, adjuntos y UI) en I-21; verificacion integral Fase 5 en I-22, dentro de la autorizacion ya vigente. PostgreSQL/navegador/ESLint/almacenamiento productivo conservan su estado. Sin dependencias nuevas, commit, push ni despliegue.

## I-21 (desvinculacion, adjuntos e interfaz, F5-05 a F5-07)

**Autorizacion:** DEC-039/041; "continua". **Estado:** implementada y verificada tecnicamente en SQLite; sin aprobacion formal atribuida a I-20/I-21.

| Tarea | Resultado | Evidencia |
|---|---|---|
| F5-05 | Salida aprobada con confirmacion, autoridad vigente, bloqueo de responsabilidades y desactivacion/revocacion transaccional sin borrar aportes | `withdrawal.service.ts`, regla compartida `users/deactivate-account.ts`, pruebas de permisos, reasignacion, historia y doble envio |
| F5-06 | Adjuntos exclusivos de tramite, almacenamiento/validacion/descarga de Gestion documental, permisos del solicitante/autoridad e historial auditado | `RequestAttachments1728820000000`, `request-attachment.entity.ts`, endpoints en `DocumentsController`; pruebas de fuga, compartir, carga invalida y solo lectura |
| F5-07 | Mis solicitudes, nueva solicitud, detalle/historial, revision por autoridades y flujo de salida | `/hub/tramites`, `/hub/tramites/[id]`, formularios y confirmaciones en modales, filtros/paginacion, shadcn Select y menu diferenciado de Vinculaciones |

### Archivos y verificaciones

- Backend nuevos: `backend/src/database/migrations/1728820000000-request-attachments.ts`, `backend/src/modules/documents/request-attachment.entity.ts`, `backend/src/modules/users/deactivate-account.ts`, `backend/src/modules/administration/{withdrawal.service,administration-flows.http.spec}.ts`. Modificados administracion (DTO/controlador/modulo/servicio), documentos (controlador/servicio), `members.service.ts` y `database.options.ts`. Sin dependencias nuevas ni cambio de proveedor de archivos.
- Frontend nuevos: `frontend/src/features/administration/{types,requests-page}.ts(x)`, `components/{request-form,requests-catalog,request-detail}.tsx`, rutas de listado/detalle de tramites. Modificados menu y tipos/lista documental (vinculo al tramite, sin ofrecer edicion generica de sus permisos). Paginas servidor con lecturas privadas paralelas; acciones cliente reutilizan API/CSRF.
- Reglas de implementacion en DEC-042. Reasignar responsabilidades usa pantallas existentes y no altera silenciosamente proyectos/tareas. Retiene pertenencias, autorias y asistencia como historia; la cuenta inactiva no accede al HUB. Vista previa paginada y recomprobacion transaccional antes de ejecutar. Envios simultaneos de la misma solicitud no producen doble ejecucion.
- `tsx --test src/modules/administration/administration-flows.http.spec.ts`: 10/10. Regresion documentos+integrantes: 39/39. Lint frontend y typecheck backend OK. `npm run verify` final salida 0: 72 pruebas frontend + 273 backend (345), lint/build/typecheck y migraciones sin pendientes. Una primera verificacion acumulada tambien paso antes de agregar los casos de doble envio y listado de responsables (271 backend).
- `npm run e2e`: salida 0, 119/119 (12 adicionales de I-21); quince migraciones desde cero/reversion completa/reaplicacion en SQLite temporal; paginas SSR autorizadas/404, carga a traves de proxy, privacidad y solo lectura, salida aprobada bloqueada por tarea abierta y ejecutada tras reasignacion explicita, cuenta sin sesion con aportes conservados, persistencia tras reinicio. Integridad SQLite/FK y cinco archivos concordantes con metadatos/tamano/SHA-256. Entorno temporal limpiado; 3100/4100 liberados.
- Tres comprobaciones HTTP directas con timeout: API 4000, proxy 3000 y pagina tecnica 3000, todas 200 y contenido esperado. No se lanzo el smoke que intenta duplicar los servidores abiertos; se preservaron sus procesos. `node --check scripts/e2e.mjs` y `git diff --check`: OK. Base y respaldo ignorados en Git.
- Incidencias intermedias corregidas: primer comando tsx desde la raiz no aplico tsconfig backend (decoradores); reejecutado desde backend. Un parentesis SQL de visibilidad documental provoco fallos de listado; corregido y regresion 39/39. Una prueba intento leer PDF con ayudante JSON; usa ahora lectura binaria. Lint detecto JSX dentro de try/catch en pagina; se separo captura de errores HTTP de renderizado. Typecheck detecto union de objetos del test con propiedades opcionales; se tiparon los casos como `Record<string,string>[]`. No se ocultaron fallos.
- Respaldo online `backend/data/alfacode-hub.backup-2026-10-18-i21.sqlite`; `npm --prefix backend run migration:run`: una aplicada, `migration:show`: sin pendientes. Conteos previos de diez tablas conservados; integridad fisica y FK SQLite correctas. No se ejecutaron reversiones sobre la base local.

### Pendientes y continuidad

- Interaccion real en navegador (crear, seleccionar, foco de modales, confirmar y descargar desde UI) sigue pendiente; las pruebas SSR no la sustituyen. PostgreSQL pausado, alertas ESLint y almacenamiento/retencion productivos conservan su estado.
- I-22 corresponde a revision acumulada de Fase 5, dentro de la autorizacion vigente; no se marca cierre integral ni aprobacion humana de I-21 por implementarla.
- Sin instalaciones, commit, push, despliegue ni datos personales reales. Cambios anteriores conservados.

## I-23 (catalogo de indicadores y paneles, F6-01 a F6-04)

**Autorizacion:** DEC-045 ("autorizo empezar con la fase 6"). **Estado:** implementada y verificada tecnicamente en SQLite; pendiente de revision.

| Tarea | Resultado | Evidencia |
|---|---|---|
| F6-01 | Catalogo con definicion, fuente, filtros, corte, permiso y consulta, escrito antes de implementar | `docs/catalogo-indicadores.md` |
| F6-02 | Panel institucional solo admin/coordinator: integrantes activos, proyectos por estado/tipo, actividades realizadas y asistencias, productos por estado, tareas y cumplimiento | `GET /tracking/institutional`, `/hub/seguimiento`; fixture contada a mano y E2E contra SQLite |
| F6-03 | Panel de proyecto: avance ("Sin tareas" sin datos), vencidas, proximas 7 dias, sin responsable, sprint activo y ultimo cierre (snapshot), entregables, actividades, equipo y fechas | `GET /tracking/projects/:id`, `/hub/proyectos/[id]/seguimiento` |
| F6-04 | Panel personal: proyectos, tareas abiertas/vencidas/terminadas, asistencias, proximas actividades y productos, filtrado por visibilidad | `GET /tracking/me`, `/hub` |

- Archivos nuevos: `backend/src/modules/tracking/{tracking.service,tracking.controller,tracking.module,tracking.http.spec}.ts`; `frontend/src/features/tracking/{types,types.test,personal-panel}.ts(x)`, `components/panel-ui.tsx`; paginas `app/(privado)/hub/seguimiento/page.tsx` y `app/(privado)/hub/proyectos/[id]/seguimiento/page.tsx`; `docs/catalogo-indicadores.md`.
- Modificados: `backend/src/app.module.ts`, `frontend/src/app/(privado)/hub/page.tsx`, `components/layout/app-shell.tsx`, `features/projects/components/project-header.tsx`, `scripts/e2e.mjs`, README/AGENTS/context/decisiones.
- Comandos: `npx tsx --test src/modules/tracking/tracking.http.spec.ts` 10/10 al primer intento; `npm run verify` salida 0 (74 + 283), repetido tras ajustes de texto; `npm run e2e` salida 0, 136/136; recorrido Chrome headless 17/17 (script temporal fuera del repositorio).
- Pendientes: PostgreSQL (DEC-045), graficos y estados de carga/error completos (F6-08, I-24), reportes y seguimiento cualitativo (I-24). Sin migraciones, dependencias, commit, push ni despliegue.

## I-24 (seguimiento cualitativo, reportes, exactitud y UI, F6-05 a F6-08)

**Autorizacion:** DEC-046 ("continua con i 24"). **Estado:** implementada y verificada tecnicamente en SQLite; pendiente de revision.

| Tarea | Resultado | Evidencia |
|---|---|---|
| F6-05 | Observaciones de proyecto (avance, dificultad, resultado, general) sin persona evaluada ni puntaje; permisos de proyecto y auditoria | Migracion `ProjectObservations1728830000000`, `observations.service.ts`, seccion en `/hub/proyectos/[id]/seguimiento` |
| F6-06 | Reportes de proyectos, produccion y actividades, solo autoridades, filtros y paginacion en pantalla | `reports.service.ts`, `/hub/reportes`, catalogo R-01..R-03 |
| F6-07 | Exactitud contra fixture manual y permisos antes de agregar | `reports.http.spec.ts` 12/12; E2E compara reporte con SQLite |
| F6-08 | Barras accesibles con color validado por tema, estados de carga/error/"Sin datos", tabla con desplazamiento interno | `panel-ui.tsx`, `panel-states.tsx`, `error.tsx`, token `--hub-chart`; Chrome 22/22 |

- Archivos nuevos: migracion `backend/src/database/migrations/1728830000000-project-observations.ts`; `backend/src/modules/tracking/{project-observation.entity,tracking.dto,observations.service,reports.service,reports.http.spec}.ts`; `frontend/src/features/tracking/{reports-page.tsx,components/observations.tsx,components/panel-states.tsx}`; `frontend/src/app/(privado)/hub/reportes/{page,error}.tsx`; `error.tsx` en `hub/seguimiento` y `hub/proyectos/[id]/seguimiento`.
- Modificados: `database.options.ts`, `tracking.{controller,module,service}.ts`, `globals.css` (token), `panel-ui.tsx`, `types.ts`, paginas de seguimiento, menu, `scripts/e2e.mjs`, catalogo, README/AGENTS/context/decisiones.
- Comandos: `npx tsx --test src/modules/tracking/reports.http.spec.ts` 12/12; `npm run verify` salida 0 (74 + 295, sin migraciones pendientes tras aplicar la nueva a la base local con respaldo); `npm run e2e` salida 0, 141/141; Chrome 22/22.
- Pendientes: PostgreSQL (DEC-045/046), exportacion PDF/Excel (posterior), lector de pantalla no evaluado. Siguiente: I-25 validacion de Fase 6.

## No realizar sin nueva autorizacion

- No publicar con usuarios reales sin nueva autorizacion. Iteracion activa I-23 (DEC-045); I-24/I-25 despues, dentro de la Fase 6 autorizada.
- No elegir proveedor de almacenamiento de produccion ni crear credenciales sin autorizacion (F3-06).
- No modificar el trabajo de otras personas colaboradoras sin acuerdo.
- No configurar PostgreSQL ni Railway.
- No crear datos reales de personas.
