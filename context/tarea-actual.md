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

## Siguiente iteracion propuesta

**ID sugerido:** I-09
**Estado:** propuesta; no autorizada.
**Objetivo sugerido:** F1-14, segunda parte (gestion), dividida en fases: I-09.1 perfil propio (ver y editar nombre, cambiar contrasena); I-09.2 cola de solicitudes (listar, aprobar con rol y entrega de la contrasena temporal, rechazar); I-09.3 integrantes (listado con busqueda y filtros, detalle, activar/desactivar, roles, regenerar contrasena temporal) e invitaciones. El menu lateral mostrara cada vista segun el rol.

## No realizar sin nueva autorizacion

- No iniciar I-09 hasta que el responsable apruebe I-08.
- No configurar PostgreSQL ni Railway.
- No crear datos reales de personas.
