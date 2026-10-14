# Tarea actual - Fase 2, I-12 (sprints opcionales) en revision

## Estado

**Fase:** 2 - Proyectos, tareas y sprints (2A y 2B aprobadas; 2C implementada, en revision).
**Aprobadas:** Fase 0 (DEC-004), I-04 (DEC-007), I-05 (DEC-008), I-06 (DEC-011), I-07 (DEC-013), I-08, I-09, I-10 y DEC-016 (DEC-020), I-11 y DEC-021 (DEC-022).
**I-11:** aprobada (DEC-022).
**Pendiente:** prueba de interaccion en navegador real (arrastrar tarjetas, selectores, modales).
**I-12:** autorizada (DEC-022); implementada y verificada tecnicamente, sin commit.
**Trabajo actualmente autorizado:** ninguno adicional tras cerrar I-12.

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

**Estado:** autorizada (DEC-022); implementada y verificada tecnicamente. Decisiones en DEC-023.

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

## No realizar sin nueva autorizacion

- No iniciar trabajo posterior a I-12 (cierre del MVP, Fase 3) sin autorizacion.
- No modificar el trabajo de otras personas colaboradoras sin acuerdo.
- No configurar PostgreSQL ni Railway.
- No crear datos reales de personas.
