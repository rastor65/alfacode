# Tarea actual - Fase 1, I-08 (pantallas de acceso, F1-14) por fases

## Estado

**Fase:** 1 - Identidad, autenticacion e integrantes
**Aprobadas:** Fase 0 (DEC-004), I-04 (DEC-007), I-05 (DEC-008), I-06 (DEC-011), I-07 (DEC-013).
**I-08:** autorizada por fases (DEC-013). Las tres fases estan implementadas y verificadas tecnicamente.
**Pendiente:** revision y aprobacion del responsable de I-08 (en particular I-08.2 e I-08.3) y de DEC-016.
**Trabajo actualmente autorizado:** ninguno adicional tras cerrar I-08.

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

## No realizar sin nueva autorizacion

- No iniciar la Fase 2 sin aprobacion del cierre de la Fase 1 y autorizacion explicita.
- No modificar el trabajo de otras personas colaboradoras sin acuerdo.
- No configurar PostgreSQL ni Railway.
- No crear datos reales de personas.
