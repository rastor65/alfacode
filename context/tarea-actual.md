# Tarea actual - Fase 3, I-14 (investigacion) autorizada

## Estado

**Fase:** 3 - Investigacion y documentos. Fase 2 cerrada y aprobada (I-13, DEC-026), validada solo en SQLite (DEC-025).
**Aprobadas:** Fase 0 (DEC-004), I-04 (DEC-007), I-05 (DEC-008), I-06 (DEC-011), I-07 (DEC-013), I-08, I-09, I-10 y DEC-016 (DEC-020), I-11 y DEC-021 (DEC-022), I-12, DEC-023 y registro con Hoja de Vida (DEC-024), I-13 (DEC-026).
**Pendiente:** prueba de interaccion en navegador real (arrastrar tarjetas, selectores, modales).
**Trabajo actualmente autorizado:** I-14 (F3-01 a F3-04: lineas de investigacion, asociacion con proyectos, ficha investigativa, resultados). I-15 e I-16 tras la revision de I-14 (DEC-026).

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

- Nuevo `scripts/e2e-mvp.mjs` y script raiz `npm run e2e:mvp`: base, outbox y puerto (4100) temporales; migraciones desde cero, reversion completa y reaplicacion; admin por bootstrap no interactivo; invitacion y aceptacion; registro con Hoja de Vida, aprobacion, contrasena temporal y cambio obligatorio; proyecto agil, equipo, tareas, sprint, tablero, reinicio del backend, cierre, historial, progreso y acceso ajeno. Ejecutado dos veces: 32/32 en ambas; temporales eliminados y puerto liberado.
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

## No realizar sin nueva autorizacion

- No iniciar I-15 (documentos) ni publicar con usuarios reales sin autorizacion.
- No modificar el trabajo de otras personas colaboradoras sin acuerdo.
- No configurar PostgreSQL ni Railway.
- No crear datos reales de personas.
