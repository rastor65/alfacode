# Tarea actual - Fase 2, I-10 (proyectos y equipos) en revision

## Estado

**Fase:** 2 - Proyectos y equipos (iniciada por instruccion del responsable, DEC-018, sin aceptacion formal de la Fase 1).
**Aprobadas:** Fase 0 (DEC-004), I-04 (DEC-007), I-05 (DEC-008), I-06 (DEC-011), I-07 (DEC-013).
**Implementadas y verificadas tecnicamente, sin aprobacion explicita:** I-08 (pantallas de acceso), I-09 (gestion de perfil, solicitudes e integrantes), I-10 (proyectos y equipos, commit `f39f567` en `dev`) y DEC-016.
**Pendiente:** revision y aprobacion del responsable de I-08, I-09, I-10 y DEC-016; prueba de interaccion en navegador real.
**Trabajo actualmente autorizado:** ninguno adicional tras cerrar I-10. I-11 (tareas y Kanban) requiere autorizacion.

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

## No realizar sin nueva autorizacion

- No iniciar I-11 (tareas y Kanban) hasta que el responsable revise I-10.
- No modificar el trabajo de otras personas colaboradoras sin acuerdo.
- No configurar PostgreSQL ni Railway.
- No crear datos reales de personas.
