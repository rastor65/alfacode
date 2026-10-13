# AlfaCode HUB â€” Backlog maestro de tareas para agentes de IA
**VersiÃ³n:** 1.0
**Estado:** propuesta operativa, sin ejecuciÃ³n verificada
**UbicaciÃ³n en el repositorio:** `docs/backlog-tareas.md`
**Total:** 78 tareas de implementaciÃ³n (`F0-01` a `F6-08`) + 5 iteraciones de validaciÃ³n/cierre (incluido el cierre del MVP).
**Producto:** AlfaCode HUB (SGPAI). **Idioma:** espaÃ±ol. **Primer MVP:** Fases 0, 1 y 2.

> **IMPORTANTE:** Este archivo es el **catÃ¡logo operativo de tareas**. El documento `docs/plan-desarrollo.md` define el alcance y las reglas detalladas. El archivo `context/tarea-actual.md` seÃ±ala **quÃ© trabajo estÃ¡ autorizado ahora**. **No ejecutar una tarea por aparecer aquÃ­**: solamente ejecutar las autorizadas en la iteraciÃ³n activa.

> **Nota de vigencia 2026-10-12:** PostgreSQL queda pausado temporalmente por decision del responsable. Las tareas y criterios que lo mencionan siguen documentando el objetivo futuro de produccion/Railway, pero no deben ejecutarse ni tratarse como bloqueo inmediato hasta nueva autorizacion. El trabajo de datos actual se verifica con SQLite.

## 1. Fuentes, jerarquÃ­a y reglas
1. **Orden del responsable:** la instrucciÃ³n explÃ­cita vigente del usuario prevalece. No atribuirse aprobaciones.
2. **Requisitos y lÃ­mites:** `docs/plan-desarrollo.md`; para arquitectura, `docs/AlfaCode_HUB_Diseno_Tecnico_Inicial_v0.2.md`; para visiÃ³n, `docs/AlfaCode_HUB_Documento_Completo_v0.2.md`.
3. **Plan de tareas:** este backlog describe las entregas y verificaciones sin sustituir las reglas anteriores.
4. **Estado real:** `context/estado-actual.md` y los resultados comprobados en el cÃ³digo. No confundir una casilla inicial con evidencia.
5. **AsignaciÃ³n actual:** `context/tarea-actual.md`, editado o autorizado por el responsable. Ante contradicciones, detener solo el trabajo afectado y pedir una decisiÃ³n.

**Restricciones invariables:** Next.js + React + TypeScript; Node.js/NestJS + API REST `/api/v1`; TypeORM; **SQLite para desarrollo** y **PostgreSQL futuro para producciÃ³n en Railway**; migraciones con `synchronize=false`; monolito modular; permisos aplicados en backend; modo tradicional y Ã¡gil, con **sprints opcionales**; `sprint_id` nullable. No desplegar, crear servicios externos, provocar gastos, importar datos reales ni realizar operaciones Git destructivas sin autorizaciÃ³n.

**Estados permitidos en los registros de trabajo:** `pendiente`, `en_curso`, `bloqueada`, `implementada`, `verificada_tecnicamente`, `aprobada_responsable`. No escribir â€œcompletadaâ€ sin evidencia de aceptaciÃ³n; la aprobaciÃ³n humana se registra solo cuando existe.

## 2. Procedimiento obligatorio de ejecuciÃ³n
1. El responsable selecciona la siguiente iteraciÃ³n en el orden de la secciÃ³n 3 y actualiza `context/tarea-actual.md` con el ID, los IDs de tareas y el estado `autorizada` (o autoriza expresamente en el chat del agente).
2. El agente lee `AGENTS.md`, `context/tarea-actual.md`, `docs/plan-desarrollo.md`, este backlog, el diseÃ±o tÃ©cnico y las decisiones registradas. Inspecciona `git status`, scripts y tests antes de tocar archivos.
3. Ejecuta **una tarea por vez**, en orden dentro de la iteraciÃ³n. Reutiliza cÃ³digo existente y no adelanta tareas no autorizadas.
4. Para cada tarea: implementar â†’ probar â†’ registrar **comando y resultado real** â†’ dejar evidencia del archivo o prueba â†’ pasar a la siguiente tarea de la **misma** iteraciÃ³n.
5. Al cerrar la iteraciÃ³n: ejecutar pruebas integradas correspondientes; actualizar `context/estado-actual.md` con IDs, archivos, comandos, pruebas, bloqueos y pendientes; informar al responsable; **detenerse**.
6. Tras la revisiÃ³n, el responsable autoriza la prÃ³xima iteraciÃ³n y actualiza `context/tarea-actual.md`; el agente **no debe autoseleccionar** el prÃ³ximo trabajo.
7. Cada cierre de fase exige los criterios de aceptaciÃ³n del plan, pruebas SQLite y PostgreSQL cuando corresponda, y aprobaciÃ³n del responsable.

**Regla para un fallo:** si una prueba falla, corregir en el alcance actual o marcar tarea/iteraciÃ³n `bloqueada`, con reproducciÃ³n exacta. Nunca afirmar que algo pasÃ³ sin ejecutar la prueba. **Regla de precedencia:** si el cÃ³digo y la documentaciÃ³n no coinciden, documentar la diferencia y solicitar decisiÃ³n cuando afecte una regla de negocio; no cambiar los requisitos en silencio.

## 3. Mapa de iteraciones en orden
| IteraciÃ³n | Trabajo autorizado cuando se active | Criterio de salida |
|---|---|---|
| **I-01** | PreparaciÃ³n Next.js/React y NestJS. `F0-01` a `F0-04` | Ambas aplicaciones compilan; versiones registradas; docs/context preservados. |
| **I-02** | Datos y conexiÃ³n bÃ¡sica sobre SQLite. `F0-05` a `F0-09`, omitiendo PostgreSQL mientras este pausado | SQLite funciona; migraciones SQLite; `/health` y Next.js/Reactâ†”API operativos sin alterar el portafolio. |
| **I-03** | Calidad y cierre Fase 0. `F0-10` a `F0-11` | ConstrucciÃ³n limpia, pruebas y documentaciÃ³n reproducible; puerta de Fase 0 superada. |
| **I-04** | Cuentas y seguridad. `F1-01` a `F1-07` | Modelo + sesiÃ³n seguros, restablecimiento protegido y roles creados. |
| **I-05** | VinculaciÃ³n y pantallas. `F1-08` a `F1-14` | Registro/invitaciÃ³n y permisos reales E2E; puerta de Fase 1 superada. |
| **I-06** | Proyectos y equipos. `F2-01` a `F2-06` | Crear proyecto, administrar equipo y verificar visibilidad segura. |
| **I-07** | Tareas y tablero. `F2-07` a `F2-12` | Tareas con asignaciones vÃ¡lidas, backlog y Kanban persistentes. |
| **I-08** | Sprints opcionales. `F2-13` a `F2-21` | Ciclo del sprint completo con historial, seguridad y auditorÃ­a. |
| **I-09** | ValidaciÃ³n integral del MVP. **Solo verificaciÃ³n y revisiÃ³n; sin funcionalidades nuevas** | E2E integral, migraciones PostgreSQL y pruebas de seguridad; aceptaciÃ³n explÃ­cita del MVP. |
| **I-10** | InvestigaciÃ³n. `F3-01` a `F3-04` | LÃ­neas, fichas y resultados conectados a proyectos. |
| **I-11** | Documentos. `F3-05` a `F3-09` | Almacenamiento privado y controles de acceso en backend. |
| **I-12** | ValidaciÃ³n Fase 3. **Solo verificaciÃ³n y revisiÃ³n; sin funcionalidades nuevas** | Pruebas de investigaciÃ³n, documentos, privacidad y compatibilidad PostgreSQL. |
| **I-13** | ProducciÃ³n acadÃ©mica. `F4-01` a `F4-04` | Productos, autorÃ­as y reconocimientos con trazabilidad. |
| **I-14** | Eventos y calendario. `F4-05` a `F4-08` | Eventos, asistencia y convocatorias probados. |
| **I-15** | ValidaciÃ³n Fase 4. **Solo verificaciÃ³n y revisiÃ³n; sin funcionalidades nuevas** | Pruebas de relaciones y privacidad; cierre autorizado. |
| **I-16** | TramitaciÃ³n. `F5-01` a `F5-04` | Solicitudes, tipos, estados y permisos comprobados. |
| **I-17** | DesvinculaciÃ³n y UI. `F5-05` a `F5-07` | DesvinculaciÃ³n segura, auditorÃ­a y flujo de solicitudes E2E. |
| **I-18** | ValidaciÃ³n Fase 5. **Solo verificaciÃ³n y revisiÃ³n; sin funcionalidades nuevas** | Pruebas de permisos y conservaciÃ³n de historial; cierre autorizado. |
| **I-19** | Indicadores y paneles. `F6-01` a `F6-04` | MÃ©tricas bien definidas, paneles institucionales y personales autorizados. |
| **I-20** | Reportes y verificaciÃ³n. `F6-05` a `F6-08` | Filtros, seguimiento, exactitud de conteos y UI. |
| **I-21** | ValidaciÃ³n Fase 6. **Solo verificaciÃ³n y revisiÃ³n; sin funcionalidades nuevas** | Pruebas completas SQLite/PostgreSQL y cierre funcional validado. |

**Notas sobre hitos:** `I-09` marca el cierre tÃ©cnico del **MVP**; `I-12`, `I-15`, `I-18` e `I-21` verifican las fases posteriores. Todos requieren validaciÃ³n humana antes de avanzar. La preparaciÃ³n/despliegue real en Railway es un **proceso separado** sujeto a autorizaciÃ³n, no una tarea que se ejecute automÃ¡ticamente.

## 4. Backlog detallado por fase
**CÃ³mo leer cada tarea:** `QuÃ© hacer` procede del plan aprobado para ejecuciÃ³n; `Entregable` es el resultado a mostrar; `VerificaciÃ³n` fija la evidencia mÃ­nima. Consultar `docs/plan-desarrollo.md` para detalles de permisos, endpoints, lÃ­mites y pruebas de fase. El estado de cada ID se controla **exclusivamente** en `context/estado-actual.md`: si no existe evidencia en el repositorio real, debe tratarse como **pendiente**, no como trabajo completado.

### Fase 0 â€” PreparaciÃ³n y fundamentos

**Puerta de entrada:** documentaciÃ³n leÃ­da; inspeccionar proyecto existente. **Puerta de salida actual:** Next.js/Reactâ†”NestJSâ†”SQLite verificados. La prueba PostgreSQL queda diferida hasta nueva autorizacion.

#### `F0-01` â€” Inspeccionar el entorno (iteraciÃ³n `I-01`)
- **Dependencia:** I-01 autorizado, inspecciÃ³n previa.
- **QuÃ© hacer:** Comprobar sistema operativo, Node/npm, estado Git, archivos existentes y compatibilidad de herramientas; registrar versiones exactas en `docs/versiones.md`.
- **Entregable:** `docs/versiones.md` con versiones detectadas, compatibilidad verificada y estado de Git.
- **VerificaciÃ³n mÃ­nima:** Registrar resultados reales de `node -v`, `npm -v`, herramientas, `git status` y documentaciÃ³n de compatibilidad; no instalar si hay conflicto.

#### `F0-02` — Verificar estructura del repositorio (iteracion `I-01`)
- **Dependencia:** `F0-01`
- **Que hacer:** Comprobar `frontend/`, `backend/`, `docs/`, `context/`, `README.md`, `.editorconfig` y `.gitignore`; registrar faltantes sin borrar ni reinicializar contenido existente.
- **Entregable:** Estado documentado de la estructura existente y faltantes detectados.
- **VerificaciÃ³n mÃ­nima:** Verificar que `/docs` y `/context` no se pierden; comprobar exclusiÃ³n de `.env`, `backend/data/` y bases SQLite; `git status` sin archivos secretos.

#### `F0-03` â€” Verificar frontend Next.js/React existente (iteraciÃ³n `I-01`)
- **Dependencia:** `F0-02`
- **QuÃ© hacer:** Usar Next.js/React instalado, App Router, Tailwind CSS y Turbopack existentes; verificar compilaciÃ³n y pÃ¡gina inicial. No aÃ±adir kit visual innecesario.
- **Entregable:** `frontend/` existente con Next.js/React, App Router, Tailwind CSS y Turbopack verificados.
- **Verificacion minima:** Consultar dependencias instaladas y ejecutar los scripts disponibles de lint/build del frontend; registrar resultados reales.

#### `F0-04` — Verificar backend NestJS existente (iteracion `I-01`)
- **Dependencia:** `F0-03`
- **Que hacer:** Consultar dependencias instaladas, scripts, configuracion, endpoint de salud actual y faltantes para `/api/v1`; no reinicializar la aplicacion.
- **Entregable:** Estado documentado del backend NestJS existente y faltantes para el contrato `/api/v1`.
- **Verificacion minima:** Ejecutar build/typecheck o scripts disponibles; registrar el estado real del endpoint de salud sin inventar resultados.

#### `F0-05` â€” Instalar TypeORM y SQLite (iteraciÃ³n `I-02`)
- **Dependencia:** `F0-04`
- **QuÃ© hacer:** Usar el controlador SQLite compatible verificado para la versiÃ³n elegida (por ejemplo `better-sqlite3`). Configurar creaciÃ³n de carpeta `data/` y conexiÃ³n desde entorno; habilitar claves forÃ¡neas.
- **Entregable:** TypeORM conectado a SQLite local y configuraciÃ³n por entorno.
- **VerificaciÃ³n mÃ­nima:** Arrancar NestJS con `DB_TYPE=sqlite`; verificar conexiÃ³n, claves forÃ¡neas activas y DB fuera de Git; `synchronize=false`.

#### `F0-06` â€” Preparar PostgreSQL (iteraciÃ³n `I-02`)
- **Dependencia:** `F0-05`
- **Estado vigente:** pausada temporalmente por decision del responsable; no ejecutar hasta nueva autorizacion.
- **QuÃ© hacer:** Instalar `pg` y configuraciÃ³n alternativa de `DataSource`. AÃ±adir mecanismo reproducible para levantar PostgreSQL de pruebas, por ejemplo `compose.test.yml` local (no es el despliegue de Railway).
- **Entregable:** Controlador PostgreSQL y configuraciÃ³n alternativa; entorno de prueba reproducible.
- **VerificaciÃ³n mÃ­nima:** Conectar de forma aislada a PostgreSQL de pruebas cuando el entorno estÃ© disponible; comprobar que SQLite sigue siendo predeterminado en local.

#### `F0-07` â€” Definir migraciones (iteraciÃ³n `I-02`)
- **Dependencia:** `F0-06`
- **Estado vigente:** ejecutar/verificar solo con SQLite mientras `F0-06` este pausada; registrar que PostgreSQL queda diferido.
- **QuÃ© hacer:** Configurar scripts para ejecutar y revertir migraciones por motor. Crear una migraciÃ³n mÃ­nima verificable (por ejemplo `schema_bootstrap`) y comprobar que se aplica en una base vacÃ­a de ambos motores; no usar `synchronize`.
- **Entregable:** DataSource y migraciones versionadas para ambos motores.
- **VerificaciÃ³n mÃ­nima:** En bases vacÃ­as ejecutar `run`, `revert` y `run` de migraciÃ³n mÃ­nima con SQLite y PostgreSQL; jamÃ¡s usar `synchronize=true`.

#### `F0-08` â€” Implementar salud (iteraciÃ³n `I-02`)
- **Dependencia:** `F0-07`
- **QuÃ© hacer:** `GET /api/v1/health` devuelve `200 {"status":"ok"}` solo si la API responde y su conexiÃ³n bÃ¡sica con la DB funciona; fallo de DB devuelve estado no exitoso sin secretos.
- **Entregable:** `GET /api/v1/health` que verifica conexiÃ³n a DB.
- **VerificaciÃ³n mÃ­nima:** Con DB activa devuelve 200 y `status: ok`; simulando fallo de conexiÃ³n devuelve estado no exitoso sin revelar secretos.

#### `F0-09` â€” Conectar interfaz y API (iteraciÃ³n `I-02`)
- **Dependencia:** `F0-08`
- **QuÃ© hacer:** PÃ¡gina inicial simple con indicador Â«Servicio disponibleÂ» cuando `GET /api/v1/health` devuelve Ã©xito; mostrar error de conexiÃ³n si falla. Configurar proxy de desarrollo `/api/v1` hacia NestJS.
- **Entregable:** PÃ¡gina Next.js/React conectada al endpoint health mediante proxy.
- **VerificaciÃ³n mÃ­nima:** Comprobar mensaje de disponibilidad al responder la API y mensaje de error al apagar el backend; sin direcciÃ³n interna hardcodeada.

#### `F0-10` â€” Calidad automÃ¡tica (iteraciÃ³n `I-03`)
- **Dependencia:** `F0-09`
- **QuÃ© hacer:** Crear scripts de lint, build y test para ambas aplicaciones; ejecutar en CI (GitHub Actions cuando haya repositorio remoto autorizado) con `npm ci`. Incluir pruebas smoke para API y Next.js/React.
- **Entregable:** Scripts reproducibles de lint, build y tests; workflow CI preparado cuando aplique.
- **VerificaciÃ³n mÃ­nima:** Ejecutar comandos reales en `frontend/` y `backend/`; reportar fallos y no declarar CI ejecutada si no hay repositorio remoto.

#### `F0-11` â€” Documentar arranque limpio (iteraciÃ³n `I-03`)
- **Dependencia:** `F0-10`
- **QuÃ© hacer:** Instrucciones para clonar, instalar, copiar `.env.example`, aplicar migraciones y levantar ambos servicios. Verificar desde un entorno o base local limpia.
- **Entregable:** README con instalaciÃ³n limpia, `.env.example`, migraciones y ejecuciÃ³n.
- **VerificaciÃ³n mÃ­nima:** Seguir los pasos desde instalaciÃ³n/base limpia y registrar resultado, comandos y problemas sin omitir pasos manuales.

**Cierre de F0 (`I-03`)**: build/tests de Next.js/React y NestJS; health con y sin DB; Next.js/React consume API; migraciones SQLite y PostgreSQL desde base limpia; credenciales fuera de Git; reproducciÃ³n documentada.

### Fase 1 â€” Identidad, autenticaciÃ³n e integrantes

**Puerta de entrada:** Fase 0 verificada/aprobada. **Puerta de salida:** usuarios aprobados e invitados con sesiones y permisos seguros.

#### `F1-01` â€” Migraciones y entidades (iteraciÃ³n `I-04`)
- **Dependencia:** Fase 0 aprobada.
- **QuÃ© hacer:** Crear `users`, `roles`, `user_roles`, `sessions`, `membership_requests`, `invitations` y `verification_tokens` (con `token_hash`, `user_id`, `purpose`, `expires_at`, `used_at`; `purpose` âˆˆ `email_verification`, `password_reset`). AÃ±adir restricciones de unicidad y claves forÃ¡neas.
- **Entregable:** Migraciones y entidades de cuentas, roles, sesiones, solicitudes, invitaciones y tokens.
- **VerificaciÃ³n mÃ­nima:** Migrar desde base vacÃ­a en SQLite/PostgreSQL; probar unicidad/FKs y que los secretos se guardan como hash.

#### `F1-02` â€” Usuarios (iteraciÃ³n `I-04`)
- **Dependencia:** `F1-01`
- **QuÃ© hacer:** Campos mÃ­nimos: `id`, `full_name`, `email_normalized` (Ãºnico), `password_hash`, `account_status`, `email_verified_at`, `created_at`, `updated_at`. Estados: `pending`, `active`, `inactive`, `rejected`. Email normalizado (trim y minÃºsculas) antes de consultar y guardar.
- **Entregable:** Servicios/DTO de usuarios y normalizaciÃ³n de correos.
- **VerificaciÃ³n mÃ­nima:** Rechazar emails duplicados aunque cambien mayÃºsculas o espacios; no exponer `password_hash` en respuestas.

#### `F1-03` â€” Roles (iteraciÃ³n `I-04`)
- **Dependencia:** `F1-02`
- **QuÃ© hacer:** Insertar roles fijos iniciales con cÃ³digos de la secciÃ³n 1.2 mediante seed **idempotente**. No generar usuarios ficticios en producciÃ³n.
- **Entregable:** Seed idempotente de cinco roles institucionales.
- **VerificaciÃ³n mÃ­nima:** Ejecutar seed dos veces sin duplicados; confirmar cÃ³digos y nombres previstos.

#### `F1-04` â€” Primer administrador (iteraciÃ³n `I-04`)
- **Dependencia:** `F1-03`
- **QuÃ© hacer:** Crear comando de bootstrap **de un solo uso**, interactivo o con secreto introducido en ejecuciÃ³n; no permitir que reemplace administradores existentes. Probar que falla si ya existe un administrador.
- **Entregable:** Comando seguro para bootstrap del primer administrador.
- **VerificaciÃ³n mÃ­nima:** Crear un solo admin con secreto introducido en ejecuciÃ³n; segundo intento se rechaza; no hay contraseÃ±a fija en repositorio.

#### `F1-05` â€” Sesiones (iteraciÃ³n `I-04`)
- **Dependencia:** `F1-04`
- **QuÃ© hacer:** Login solo para usuario `active` con correo verificado; comparaciÃ³n segura de hash Argon2id; crear sesiÃ³n revocable (secciÃ³n 2.3); `POST /auth/logout`, `GET /auth/me` y guard de sesiÃ³n.
- **Entregable:** Login, logout, consulta de sesiÃ³n y guard backend con cookie HttpOnly.
- **VerificaciÃ³n mÃ­nima:** Login `active` + correo verificado funciona; `pending`/`inactive` fallan; logout revoca la sesiÃ³n; cookies seguras segÃºn entorno.

#### `F1-06` â€” RecuperaciÃ³n (iteraciÃ³n `I-04`)
- **Dependencia:** `F1-05`
- **QuÃ© hacer:** Solicitud de restablecimiento con token efÃ­mero de un solo uso; invalidar sesiones anteriores al confirmar nueva contraseÃ±a. No revelar existencia de cuentas.
- **Entregable:** Solicitud y confirmaciÃ³n de restablecimiento de contraseÃ±a.
- **VerificaciÃ³n mÃ­nima:** Token de un solo uso expira, no filtra existencia del correo y al cambiar contraseÃ±a revoca sesiones anteriores.

#### `F1-07` â€” Control de abuso y CSRF (iteraciÃ³n `I-04`)
- **Dependencia:** `F1-06`
- **QuÃ© hacer:** Implementar rate limit, control de origen/cabecera CSRF en operaciones mutables, expiraciÃ³n y limpieza de sesiones.
- **Entregable:** ProtecciÃ³n contra abuso y CSRF, expiraciÃ³n y limpieza de sesiones.
- **VerificaciÃ³n mÃ­nima:** Probar peticiones mutables sin protecciÃ³n, intentos reiterados de login y sesiones caducadas; acceso denegado correctamente.

#### `F1-08` â€” Registro pÃºblico controlado (iteraciÃ³n `I-05`)
- **Dependencia:** `F1-07`
- **QuÃ© hacer:** Crear usuario `pending`; enviar verificaciÃ³n de correo; registrar solicitud `pending`; impedir sesiÃ³n hasta verificaciÃ³n **y aprobaciÃ³n**. La aprobaciÃ³n asigna rol institucional explÃ­cito.
- **Entregable:** Registro pÃºblico controlado con solicitud `pending` y verificaciÃ³n de correo.
- **VerificaciÃ³n mÃ­nima:** Sin verificaciÃ³n + aprobaciÃ³n no existe acceso normal; aprobar no omite verificaciÃ³n; probar ambos motores.

#### `F1-09` â€” AprobaciÃ³n/rechazo (iteraciÃ³n `I-05`)
- **Dependencia:** `F1-08`
- **QuÃ© hacer:** Solo `admin`/`coordinator`; registrar autor, fecha, observaciones y transiciÃ³n. No permitir que una solicitud resuelta se apruebe nuevamente.
- **Entregable:** Bandeja y operaciÃ³n de aprobar/rechazar solicitudes con auditorÃ­a.
- **VerificaciÃ³n mÃ­nima:** Solo `admin`/`coordinator`; doble aprobaciÃ³n prohibida; queda autor, fecha y resoluciÃ³n.

#### `F1-10` â€” Invitaciones (iteraciÃ³n `I-05`)
- **Dependencia:** `F1-09`
- **QuÃ© hacer:** Crear token aleatorio con hash, expiraciÃ³n inicial de 72 horas y uso Ãºnico. `admin`/`coordinator` asigna rol autorizado. El usuario invitado completa registro y verifica el correo correspondiente; la aceptaciÃ³n produce cuenta `active` sin solicitud pÃºblica adicional. No emitir invitaciones para correo ya activo sin flujo explÃ­cito.
- **Entregable:** Invitaciones de un uso, caducidad inicial de 72h y rol controlado.
- **VerificaciÃ³n mÃ­nima:** Token expirado/usado/alterado no permite registro; email debe coincidir; no se crea cuenta duplicada activa.

#### `F1-11` â€” Entrega de invitaciones (iteraciÃ³n `I-05`)
- **Dependencia:** `F1-10`
- **QuÃ© hacer:** Integrar correo transaccional mediante interfaz reemplazable; usar transportador de pruebas local en desarrollo. Para demo interna sin SMTP, permitir mostrar el enlace **una sola vez** al creador, sin guardarlo en logs. ProducciÃ³n con registros reales requiere entrega segura y verificaciÃ³n funcional.
- **Entregable:** Adaptador de envÃ­o con transporte simulado en desarrollo.
- **VerificaciÃ³n mÃ­nima:** Verificar entrega fake y ausencia de tokens en logs; enlaces de desarrollo mostrados solo en contexto controlado, nunca expuestos pÃºblicamente.

#### `F1-12` â€” Perfiles (iteraciÃ³n `I-05`)
- **Dependencia:** `F1-11`
- **QuÃ© hacer:** `GET/PATCH /users/me` para nombre y datos editables. Nadie puede cambiar su propio `role`, `account_status` o verificaciÃ³n de correo desde el perfil.
- **Entregable:** API y pantalla de perfil propio con campos editables permitidos.
- **VerificaciÃ³n mÃ­nima:** Usuario edita nombre/datos vÃ¡lidos, pero no puede modificar por API su rol, estado o verificaciÃ³n.

#### `F1-13` â€” AdministraciÃ³n de integrantes (iteraciÃ³n `I-05`)
- **Dependencia:** `F1-12`
- **QuÃ© hacer:** Listado paginado, bÃºsqueda, roles, activaciÃ³n/desactivaciÃ³n y detalle para usuarios autorizados; registrar cambios sensibles. No borrar en cascada la historia de participaciÃ³n.
- **Entregable:** Listado/administraciÃ³n de integrantes y auditorÃ­a de cambios sensibles.
- **VerificaciÃ³n mÃ­nima:** PaginaciÃ³n y bÃºsqueda; usuario sin permiso recibe 403; no se elimina historial por desactivaciÃ³n; Ãºltimo admin protegido.

#### `F1-14` â€” Interfaz Next.js/React (iteraciÃ³n `I-05`)
- **Dependencia:** `F1-13`
- **QuÃ© hacer:** Login, registro, verificaciÃ³n, recuperaciÃ³n, perfil, listado de integrantes y cola de solicitudes, con mensajes de errores y estados de carga.
- **Entregable:** Pantallas Next.js/React para login, registro, recuperaciÃ³n, perfil y administraciÃ³n.
- **VerificaciÃ³n mÃ­nima:** E2E de registro pendiente, aprobaciÃ³n, acceso, perfil y cierre; interfaz muestra errores y loading; backend autoriza.

**Cierre de F1 (`I-05`)**: E2E de registro pendienteâ†’verificaciÃ³nâ†’aprobaciÃ³nâ†’login, invitaciÃ³n de un uso, recuperaciÃ³n, permisos y CSRF; sesiÃ³n revocable; PostgreSQL prueba migraciones y flujos crÃ­ticos.

### Fase 2 â€” Proyectos, tareas y sprints opcionales â€” MVP

**Puerta de entrada:** Fase 1 verificada/aprobada. **Puerta de salida:** MVP con proyectos tradicionales y Ã¡giles, tareas, backlog, Kanban y sprints opcionales.

#### `F2-01` â€” Entidades y migraciones (iteraciÃ³n `I-06`)
- **Dependencia:** Fase 1 aprobada.
- **QuÃ© hacer:** `projects`, `project_members`. Proyecto: `id`, `name`, `description`, `type`, `methodology`, `status`, `created_by`, `start_date?`, `end_date?`, timestamps. `methodology` âˆˆ `traditional`, `agile`. Tipos iniciales: `research`, `software`, `innovation`, `extension`, `internal`, `other`.
- **Entregable:** Tablas y entidades `projects` y `project_members` con modalidad.
- **VerificaciÃ³n mÃ­nima:** Migraciones SQLite/Postgres; validar tipos y modalidad `traditional`/`agile`, claves forÃ¡neas y fechas.

#### `F2-02` â€” Estados (iteraciÃ³n `I-06`)
- **Dependencia:** `F2-01`
- **QuÃ© hacer:** `proposed`, `planning`, `active`, `paused`, `completed`, `cancelled`. Cambios por endpoints explÃ­citos o patch validado; no permitir reactivar un proyecto `completed`/`cancelled` en el MVP.
- **Entregable:** Estados y transiciones vÃ¡lidas de proyecto.
- **VerificaciÃ³n mÃ­nima:** Probar transiciones permitidas y rechazo de reactivaciÃ³n `completed`/`cancelled`.

#### `F2-03` â€” Alta de proyecto (iteraciÃ³n `I-06`)
- **Dependencia:** `F2-02`
- **QuÃ© hacer:** Solo `admin` y `coordinator` por defecto. Un `teacher_leader` solo podrÃ¡ crear proyectos si se aprueba y configura explÃ­citamente un permiso adicional en una revisiÃ³n futura. El creador autorizado se aÃ±ade automÃ¡ticamente como lÃ­der **si** pertenece al semillero y estÃ¡ activo; si el creador es un administrador tÃ©cnico no participante, debe asignar un lÃ­der activo antes de activar el proyecto.
- **Entregable:** API para creaciÃ³n y asignaciÃ³n inicial de liderazgo.
- **VerificaciÃ³n mÃ­nima:** Solo admin/coordinador crean; no activar proyecto sin lÃ­der activo cuando creador no pertenece al equipo.

#### `F2-04` â€” Equipos (iteraciÃ³n `I-06`)
- **Dependencia:** `F2-03`
- **QuÃ© hacer:** AÃ±adir/quitar integrantes activos, roles de proyecto `leader` o `collaborator`. Un proyecto activo debe conservar al menos un lÃ­der; no quitar un miembro con tareas asignadas sin reasignar o desasignarlas en una operaciÃ³n explÃ­cita.
- **Entregable:** API para alta/baja de miembros y roles dentro de proyectos.
- **VerificaciÃ³n mÃ­nima:** No eliminar Ãºltimo lÃ­der de proyecto activo; miembro con tareas requiere reasignaciÃ³n/desasignaciÃ³n explÃ­cita.

#### `F2-05` â€” Visibilidad (iteraciÃ³n `I-06`)
- **Dependencia:** `F2-04`
- **QuÃ© hacer:** Coordinador ve proyectos institucionales; integrante ve proyectos donde participa. Por defecto otros integrantes no ven el contenido privado de proyectos ajenos. Admin tiene administraciÃ³n tÃ©cnica; acceso a contenido sensible se rige ademÃ¡s por las reglas de cada mÃ³dulo.
- **Entregable:** PolÃ­ticas de visibilidad por membresÃ­a y coordinaciÃ³n.
- **VerificaciÃ³n mÃ­nima:** Usuario ajeno no lee/edita proyectos privados por URL directa; coordinator puede consultar los autorizados.

#### `F2-06` â€” Frontend (iteraciÃ³n `I-06`)
- **Dependencia:** `F2-05`
- **QuÃ© hacer:** Listado con filtros, crear/editar, detalle, equipo, estados y mensajes de acceso denegado.
- **Entregable:** Pantallas de proyectos, detalle, miembros y estados.
- **VerificaciÃ³n mÃ­nima:** NavegaciÃ³n y operaciones bÃ¡sicas probadas con rol coordinador y colaborador; errores 403 visibles sin fuga de datos.

#### `F2-07` â€” Entidad `tasks` (iteraciÃ³n `I-07`)
- **Dependencia:** `F2-06`
- **QuÃ© hacer:** Campos: `id`, `project_id`, `sprint_id` nullable, `title`, `description?`, `assignee_id` nullable, `status`, `priority`, `due_date?`, `created_by`, timestamps. Prioridad: `low`, `medium`, `high`; estado: `todo`, `in_progress`, `in_review`, `done`.
- **Entregable:** Entidad/migraciÃ³n `tasks` con `sprint_id` opcional.
- **VerificaciÃ³n mÃ­nima:** Migrar ambos motores; FK, campos obligatorios, prioridad/estado correctos; tarea sin sprint vÃ¡lida.

#### `F2-08` â€” Reglas de asignaciÃ³n (iteraciÃ³n `I-07`)
- **Dependencia:** `F2-07`
- **QuÃ© hacer:** La persona asignada debe ser miembro activo del proyecto; una tarea nunca se vincula a dos proyectos; `sprint_id`, si existe, debe ser del **mismo** proyecto.
- **Entregable:** Restricciones de pertenencia para responsables, proyecto y sprint.
- **VerificaciÃ³n mÃ­nima:** Intentar asignar usuario ajeno o sprint de otro proyecto: operaciÃ³n rechazada; no mutar datos.

#### `F2-09` â€” CRUD (iteraciÃ³n `I-07`)
- **Dependencia:** `F2-08`
- **QuÃ© hacer:** LÃ­der/coordinador crea, modifica, asigna y prioriza tareas; colaborador puede actualizar **estado** de sus tareas asignadas; otras modificaciones requieren autoridad del proyecto. Registrar autor y timestamps.
- **Entregable:** CRUD de tareas con permisos segÃºn rol de proyecto.
- **VerificaciÃ³n mÃ­nima:** LÃ­der crea/edita/asigna; colaborador cambia solo estado de tarea propia; ajenos no pueden actuar.

#### `F2-10` â€” Backlog (iteraciÃ³n `I-07`)
- **Dependencia:** `F2-09`
- **QuÃ© hacer:** En proyectos Ã¡giles: `sprint_id IS NULL`; en proyectos tradicionales: todas las tareas tienen `sprint_id IS NULL`, pero se muestran como tareas normales (no interfaz de planificaciÃ³n de sprints).
- **Entregable:** Backlog Ã¡gil y lista de tareas tradicional.
- **VerificaciÃ³n mÃ­nima:** Tareas sin sprint aparecen en backlog solo si proyecto es Ã¡gil; tradicional no muestra planificaciÃ³n de sprint.

#### `F2-11` â€” Kanban bÃ¡sico (iteraciÃ³n `I-07`)
- **Dependencia:** `F2-10`
- **QuÃ© hacer:** Una Ãºnica tarea por tarjeta; columnas segÃºn estados fijos. Cambiar columna ejecuta actualizaciÃ³n autorizada y persiste tras recarga. Evitar bibliotecas de tablero sofisticadas en la primera versiÃ³n.
- **Entregable:** Tablero Kanban bÃ¡sico conectado a persistencia.
- **VerificaciÃ³n mÃ­nima:** Mover tarjeta cambia estado autorizado y persiste tras recargar; 403 sin permisos.

#### `F2-12` â€” Progreso (iteraciÃ³n `I-07`)
- **Dependencia:** `F2-11`
- **QuÃ© hacer:** Mostrar `tareas done / tareas totales` y conteos por estado. Si hay cero tareas, indicar Â«Sin tareasÂ»; **no** presentar 100 % de proyecto completado.
- **Entregable:** CÃ¡lculo visible de conteos y progreso de tareas.
- **VerificaciÃ³n mÃ­nima:** Con 0 tareas muestra â€œSin tareasâ€; progresos derivan de tareas reales, no muestran 100% falso.

#### `F2-13` â€” Entidad `sprints` (iteraciÃ³n `I-08`)
- **Dependencia:** `F2-12`
- **QuÃ© hacer:** `id`, `project_id`, `name`, `goal?`, `start_date`, `end_date`, `status`, timestamps. Estados: `planned`, `active`, `completed`, `cancelled`. Validar `start_date <= end_date`. DuraciÃ³n recomendada de 1â€“4 semanas, no imponerla rÃ­gidamente.
- **Entregable:** Entidad/migraciÃ³n `sprints` con ciclo de vida y fechas.
- **VerificaciÃ³n mÃ­nima:** Solo proyectos Ã¡giles crean sprints; fecha fin >= inicio; estados vÃ¡lidos en SQLite/Postgres.

#### `F2-14` â€” Un activo por proyecto (iteraciÃ³n `I-08`)
- **Dependencia:** `F2-13`
- **QuÃ© hacer:** Regla obligatoria respaldada por operaciÃ³n transaccional y restricciÃ³n de unicidad para `status='active'` por `project_id` cuando el motor lo permita. Probar activaciones concurrentes tambiÃ©n en PostgreSQL.
- **Entregable:** Regla de un sprint activo por proyecto.
- **VerificaciÃ³n mÃ­nima:** Intentos concurrentes de activar dos sprints se resuelven con uno solo activo (incluida prueba PostgreSQL).

#### `F2-15` â€” PlanificaciÃ³n (iteraciÃ³n `I-08`)
- **Dependencia:** `F2-14`
- **QuÃ© hacer:** LÃ­der/coordinador crea sprint `planned` y aÃ±ade tareas de backlog del mismo proyecto. No permitir tareas de otro proyecto ni agregar tareas a un sprint `completed` o `cancelled`.
- **Entregable:** PlanificaciÃ³n del sprint y asociaciÃ³n de tareas del backlog.
- **VerificaciÃ³n mÃ­nima:** No asignar tareas de otro proyecto ni aÃ±adir a sprint completado/cancelado.

#### `F2-16` â€” Inicio (iteraciÃ³n `I-08`)
- **Dependencia:** `F2-15`
- **QuÃ© hacer:** Solo `planned -> active`. No permitir si existe otro sprint activo. No iniciar sprints de proyectos no Ã¡giles o finalizados/cancelados.
- **Entregable:** TransiciÃ³n `planned -> active` con autorizaciones.
- **VerificaciÃ³n mÃ­nima:** Rechazar activaciÃ³n si otro sprint estÃ¡ activo o proyecto no Ã¡gil/cerrado; resultado transaccional.

#### `F2-17` â€” Cierre (iteraciÃ³n `I-08`)
- **Dependencia:** `F2-16`
- **QuÃ© hacer:** Solo `active -> completed`; capturar un **registro inmutable del estado final por tarea del sprint** en `sprint_closure_items` (`sprint_id`, `task_id`, `status_at_close`, `closed_at`). Las tareas `done` conservan su vinculaciÃ³n histÃ³rica; las incompletas vuelven al backlog (`sprint_id=null`) dentro de la misma transacciÃ³n. No marcar tareas pendientes como `done` automÃ¡ticamente.
- **Entregable:** Cierre transaccional, `sprint_closure_items` e historial inmutable.
- **VerificaciÃ³n mÃ­nima:** Guardar estado de tareas al cierre; incompletas vuelven al backlog, completadas quedan histÃ³ricas; reintento no duplica cierres.

#### `F2-18` â€” CancelaciÃ³n (iteraciÃ³n `I-08`)
- **Dependencia:** `F2-17`
- **QuÃ© hacer:** Permitir `planned/active -> cancelled` por lÃ­der/coordinador, con confirmaciÃ³n y motivo; devolver tareas no completadas al backlog y conservar historial. Un sprint `completed` o `cancelled` no se reactiva en el MVP.
- **Entregable:** CancelaciÃ³n autorizada y conservaciÃ³n de historial.
- **VerificaciÃ³n mÃ­nima:** Solicitar motivo; devolver pendientes al backlog; no reactivar sprint cerrado/cancelado.

#### `F2-19` â€” Cambios de modalidad (iteraciÃ³n `I-08`)
- **Dependencia:** `F2-18`
- **QuÃ© hacer:** `traditional -> agile` permitido solo por lÃ­der/coordinador cuando proyecto editable; todas las tareas existentes entran en backlog. `agile -> traditional` **solo si no hay sprints asociados** (ni histÃ³ricos); en caso contrario responder `409` hasta definir una polÃ­tica de conversiÃ³n.
- **Entregable:** Cambios permitidos de modalidad con protecciÃ³n de historial.
- **VerificaciÃ³n mÃ­nima:** Traditionalâ†’agile conserva tareas; agileâ†’traditional con sprints histÃ³ricos devuelve 409.

#### `F2-20` â€” Interfaz (iteraciÃ³n `I-08`)
- **Dependencia:** `F2-19`
- **QuÃ© hacer:** Lista de sprints, creaciÃ³n, planificaciÃ³n, inicio/cierre/cancelaciÃ³n, tablero del activo, progreso, historial bÃ¡sico. No mostrar menÃº de sprints en modalidad tradicional.
- **Entregable:** Interfaz de lista, planificaciÃ³n, inicio, cierre, cancelaciÃ³n e historial de sprints.
- **VerificaciÃ³n mÃ­nima:** Flujo E2E sprint completo; modo tradicional no muestra sprints; UI confirma operaciones destructivas.

#### `F2-21` â€” AuditorÃ­a mÃ­nima (iteraciÃ³n `I-08`)
- **Dependencia:** `F2-20`
- **QuÃ© hacer:** Registrar cambios de membresÃ­a, asignaciones, estado de proyecto, inicio/cierre de sprints y movimiento de tareas, con usuario y fecha.
- **Entregable:** Registro de auditorÃ­a para cambios significativos.
- **VerificaciÃ³n mÃ­nima:** Crear/cambiar responsables/estados y cerrar sprints deja actor, fecha y operaciÃ³n; no expone secretos.

**Cierre de F2 (`I-09`)**: E2E de proyecto tradicional (sin sprints), proyecto Ã¡gil (backlogâ†’sprintâ†’cierre), cambios de roles/equipos, acceso horizontal, concurrencia de sprint activo y comparaciÃ³n SQLite/PostgreSQL. **MVP verificado â‰  piloto institucional aprobado**.

### Fase 3 â€” InvestigaciÃ³n y documentos

**Puerta de entrada:** Fase 2 verificada/aprobada. **Puerta de salida:** criterios especÃ­ficos de Fase 3 en `docs/plan-desarrollo.md`.

#### `F3-01` â€” LÃ­neas de investigaciÃ³n (iteraciÃ³n `I-10`)
- **Dependencia:** Fase 2 aprobada.
- **QuÃ© hacer:** Entidad `research_lines` (`name`, `description`, `objectives?`, `responsible_user_id?`, `status`); CRUD de coordinador/administrador, lectura autorizada.
- **Entregable:** Modelo y CRUD de lÃ­neas de investigaciÃ³n.
- **VerificaciÃ³n mÃ­nima:** Solo roles autorizados gestionan; validaciÃ³n de nombre/estado y lectura con permisos.

#### `F3-02` â€” AsociaciÃ³n con proyectos (iteraciÃ³n `I-10`)
- **Dependencia:** `F3-01`
- **QuÃ© hacer:** `project_research_lines` para relaciÃ³n muchos-a-muchos. Permitir varias lÃ­neas por proyecto.
- **Entregable:** RelaciÃ³n N:M lÃ­neas y proyectos.
- **VerificaciÃ³n mÃ­nima:** Vincular mÃºltiples lÃ­neas; prevenir duplicados; rechazar proyectos/lÃ­neas inexistentes.

#### `F3-03` â€” Ficha investigativa (iteraciÃ³n `I-10`)
- **Dependencia:** `F3-02`
- **QuÃ© hacer:** `project_research_profiles`: proyecto Ãºnico, problema, pregunta, justificaciÃ³n, metodologÃ­a y notas. Opcional; no obligar a proyectos de software o internos a llenar estos campos.
- **Entregable:** Ficha investigativa opcional por proyecto.
- **VerificaciÃ³n mÃ­nima:** Proyecto no investigativo funciona sin ficha; misma ficha puede consultarse/editarse sin duplicados.

#### `F3-04` â€” Resultados (iteraciÃ³n `I-10`)
- **Dependencia:** `F3-03`
- **QuÃ© hacer:** `research_results`: tÃ­tulo, descripciÃ³n, proyecto, autores/participantes, fecha y referencias documentales. Guardar resultados sin duplicar tareas.
- **Entregable:** Resultados investigativos relacionados con proyectos y participantes.
- **VerificaciÃ³n mÃ­nima:** Crear/consultar resultado con participantes vÃ¡lidos; no duplicar entidades de tareas.

#### `F3-05` â€” Metadatos de archivos (iteraciÃ³n `I-11`)
- **Dependencia:** `F3-04`
- **QuÃ© hacer:** `documents`: ID, nombre original, tipo/categorÃ­a, tamaÃ±o, MIME validado, storage key, autor, Ã¡mbito, nivel de acceso y timestamps; relacionar con proyecto, resultado o actividad por un vÃ­nculo validado.
- **Entregable:** Metadatos `documents` y asociaciones documentales.
- **VerificaciÃ³n mÃ­nima:** Archivos referenciados por clave privada, con autor, MIME, tamaÃ±o y contexto; sin rutas arbitrarias.

#### `F3-06` â€” Interfaz de almacenamiento (iteraciÃ³n `I-11`)
- **Dependencia:** `F3-05`
- **QuÃ© hacer:** Desarrollar contrato `StorageService` con adaptador de disco **solo local** y adaptador para almacenamiento de objetos privado en producciÃ³n. **Elegir proveedor/credenciales con autorizaciÃ³n antes del despliegue de este mÃ³dulo**; no usar disco efÃ­mero de Railway para documentos definitivos.
- **Entregable:** Interfaz `StorageService` y adaptadores local/principal privado.
- **VerificaciÃ³n mÃ­nima:** Adaptador local funciona; almacenamiento de producciÃ³n queda bloqueado hasta escoger proveedor y credenciales aprobadas.

#### `F3-07` â€” Seguridad documental (iteraciÃ³n `I-11`)
- **Dependencia:** `F3-06`
- **QuÃ© hacer:** Descargas a travÃ©s de controlador autorizado o URLs firmadas de corta duraciÃ³n; validar extensiÃ³n **y contenido**, tamaÃ±o mÃ¡ximo inicial de 20 MiB configurable, nombre de objeto aleatorio, sin ejecuciÃ³n, sin rutas arbitrarias.
- **Entregable:** Carga/descarga segura con tamaÃ±o/tipo verificables.
- **VerificaciÃ³n mÃ­nima:** Probar archivo demasiado grande, extensiÃ³n MIME incoherente y path traversal; descarga restringida.

#### `F3-08` â€” Permisos documentales (iteraciÃ³n `I-11`)
- **Dependencia:** `F3-07`
- **QuÃ© hacer:** `general`, `restricted`, `private`; autorizaciÃ³n segÃºn rol, pertenencia al proyecto y reglas explÃ­citas del documento. Un enlace conocido no concede acceso.
- **Entregable:** AutorizaciÃ³n `general`/`restricted`/`private`.
- **VerificaciÃ³n mÃ­nima:** Usuario con enlace de documento ajeno recibe 403/404 sin contenido; probar acceso horizontal.

#### `F3-09` â€” UI y filtros (iteraciÃ³n `I-11`)
- **Dependencia:** `F3-08`
- **QuÃ© hacer:** Formulario de investigaciÃ³n, lÃ­neas, resultados, subida y consulta de archivos permitidos.
- **Entregable:** Pantallas de investigaciÃ³n, archivos, bÃºsqueda y filtros.
- **VerificaciÃ³n mÃ­nima:** Flujos E2E de guardar investigaciÃ³n y cargar/descargar solo con permisos vÃ¡lidos.

**Cierre de F3 (`I-12`)**: lÃ­neas y resultados, carga/descarga autorizada, validaciÃ³n de archivos, privacidad, pruebas de almacenamiento y migraciones SQLite/PostgreSQL.

### Fase 4 â€” ProducciÃ³n acadÃ©mica, eventos y actividades

**Puerta de entrada:** Fase 3 verificada/aprobada. **Puerta de salida:** criterios especÃ­ficos de Fase 4 en `docs/plan-desarrollo.md`.

#### `F4-01` â€” ProducciÃ³n acadÃ©mica (iteraciÃ³n `I-13`)
- **Dependencia:** Fase 3 aprobada.
- **QuÃ© hacer:** `academic_products`: tipo (`article`, `presentation`, `poster`, `book_chapter`, `book`, `software`, `other`), tÃ­tulo, descripciÃ³n, estado, fecha y fuente/DOI/enlace opcional.
- **Entregable:** Entidad y CRUD de producciÃ³n acadÃ©mica.
- **VerificaciÃ³n mÃ­nima:** Crear productos de tipos previstos; validar estado, fecha, URL/DOI cuando corresponda.

#### `F4-02` â€” AutorÃ­as (iteraciÃ³n `I-13`)
- **Dependencia:** `F4-01`
- **QuÃ© hacer:** `product_authors` con usuario interno o autor externo de nombre explÃ­cito, orden de autorÃ­a y sin crear cuentas falsas para colaboradores externos.
- **Entregable:** AutorÃ­as internas/externas y orden de autorÃ­a.
- **VerificaciÃ³n mÃ­nima:** Varios autores; autor externo no requiere cuenta falsa; orden estable y sin duplicaciÃ³n no deseada.

#### `F4-03` â€” AsociaciÃ³n (iteraciÃ³n `I-13`)
- **Dependencia:** `F4-02`
- **QuÃ© hacer:** Relacionar productos con proyectos y resultados de investigaciÃ³n; no duplicar los datos del proyecto.
- **Entregable:** Relaciones de producto con proyectos/resultados.
- **VerificaciÃ³n mÃ­nima:** Conservar una referencia Ãºnica al proyecto/resultado; no duplicar sus datos bÃ¡sicos.

#### `F4-04` â€” Reconocimientos (iteraciÃ³n `I-13`)
- **Dependencia:** `F4-03`
- **QuÃ© hacer:** Registro sencillo de reconocimiento, fecha, participante/proyecto y evidencia opcional.
- **Entregable:** Registro de reconocimientos con participantes/proyectos.
- **VerificaciÃ³n mÃ­nima:** Crear/consultar reconocimiento con referencias autorizadas y evidencia opcional.

#### `F4-05` â€” Eventos (iteraciÃ³n `I-14`)
- **Dependencia:** `F4-04`
- **QuÃ© hacer:** `events`: tipo (`meeting`, `training`, `academic`, `call`, `internal`, `other`), tÃ­tulo, fechas, modalidad, ubicaciÃ³n/enlace, organizador y estado (`scheduled`, `in_progress`, `completed`, `cancelled`).
- **Entregable:** Modelo/CRUD de eventos y estados.
- **VerificaciÃ³n mÃ­nima:** Fechas vÃ¡lidas, organizador identificado y transiciones coherentes de estado.

#### `F4-06` â€” ParticipaciÃ³n (iteraciÃ³n `I-14`)
- **Dependencia:** `F4-05`
- **QuÃ© hacer:** `event_participants`: persona registrada, rol en evento, asistencia (`registered`, `attended`, `absent`); impedir duplicados por evento+integrante.
- **Entregable:** Inscritos, organizadores y asistentes por evento.
- **VerificaciÃ³n mÃ­nima:** Asistencia vinculada a evento/persona; no duplicados; solo autoridad puede confirmar asistencia.

#### `F4-07` â€” Convocatorias (iteraciÃ³n `I-14`)
- **Dependencia:** `F4-06`
- **QuÃ© hacer:** Registro informativo de fechas, requisitos y enlace; gestiÃ³n avanzada de postulaciones queda fuera.
- **Entregable:** Convocatorias informativas con fechas/requisitos/enlace.
- **VerificaciÃ³n mÃ­nima:** Crear/consultar convocatoria sin gestionar postulaciones completas; no inventar sincronizaciÃ³n externa.

#### `F4-08` â€” Interfaz (iteraciÃ³n `I-14`)
- **Dependencia:** `F4-07`
- **QuÃ© hacer:** Listados de productos/eventos, formularios, detalle, registro de asistencia y calendario bÃ¡sico. Reutilizar documentos de Fase 3.
- **Entregable:** Pantallas y calendario bÃ¡sico de productos y actividades.
- **VerificaciÃ³n mÃ­nima:** E2E de crear evento, registrar asistencia, listar productos y consultar calendario con permisos.

**Cierre de F4 (`I-15`)**: productos con autores internos/externos; eventos y asistencia, calendario, pruebas E2E y relaciones no duplicadas.

### Fase 5 â€” GestiÃ³n administrativa

**Puerta de entrada:** Fase 4 verificada/aprobada. **Puerta de salida:** criterios especÃ­ficos de Fase 5 en `docs/plan-desarrollo.md`.

#### `F5-01` â€” Solicitudes generales (iteraciÃ³n `I-16`)
- **Dependencia:** Fase 4 aprobada.
- **QuÃ© hacer:** Entidad `administrative_requests`: solicitante, tipo, asunto, descripciÃ³n, estado, responsable, respuesta y timestamps. **No duplicar** `membership_requests` de Fase 1.
- **Entregable:** Solicitudes administrativas separadas de la vinculaciÃ³n.
- **VerificaciÃ³n mÃ­nima:** Migraciones y CRUD de `administrative_requests`; no crear segundo registro de membresÃ­a.

#### `F5-02` â€” Tipos (iteraciÃ³n `I-16`)
- **Dependencia:** `F5-01`
- **QuÃ© hacer:** Certificados, cambio de datos, desvinculaciÃ³n, responsabilidades, solicitud general. La aprobaciÃ³n de vinculaciÃ³n se gestiona exclusivamente en el flujo existente.
- **Entregable:** CatÃ¡logo inicial de tipos de solicitudes internas.
- **VerificaciÃ³n mÃ­nima:** Validar tipo, acceso y formato; vinculaciÃ³n sigue usando flujo de F1.

#### `F5-03` â€” Estados (iteraciÃ³n `I-16`)
- **Dependencia:** `F5-02`
- **QuÃ© hacer:** `pending`, `in_review`, `approved`, `rejected`, `completed` (cuando la aprobaciÃ³n requiera ejecuciÃ³n posterior); validar transiciones.
- **Entregable:** Transiciones y respuestas de solicitudes.
- **VerificaciÃ³n mÃ­nima:** Rechazar transiciones invÃ¡lidas; fecha y usuario de decisiÃ³n persistidos.

#### `F5-04` â€” Autoridad (iteraciÃ³n `I-16`)
- **Dependencia:** `F5-03`
- **QuÃ© hacer:** Solicitante consulta solo sus solicitudes; coordinador/administrador revisa segÃºn Ã¡mbito; el solicitante no puede aprobarse a sÃ­ mismo.
- **Entregable:** PolÃ­ticas de acceso a solicitudes y revisiÃ³n.
- **VerificaciÃ³n mÃ­nima:** Solicitante no lee solicitudes ajenas ni se autoaprueba; coordinador limita permisos a su Ã¡mbito.

#### `F5-05` â€” DesvinculaciÃ³n (iteraciÃ³n `I-17`)
- **Dependencia:** `F5-04`
- **QuÃ© hacer:** Desactivar cuenta cuando proceda sin borrar participaciones; exigir reasignaciÃ³n explÃ­cita de proyectos/tareas pendientes cuando sea necesaria.
- **Entregable:** Flujo de desvinculaciÃ³n con conservaciÃ³n histÃ³rica.
- **VerificaciÃ³n mÃ­nima:** No borrar proyectos/productos previos; impedir desvinculaciÃ³n irresponsable sin tratar tareas asignadas.

#### `F5-06` â€” AuditorÃ­a y adjuntos (iteraciÃ³n `I-17`)
- **Dependencia:** `F5-05`
- **QuÃ© hacer:** Respuestas y decisiones con responsable/fecha; adjuntos mediante mÃ³dulo documental.
- **Entregable:** AuditorÃ­a de trÃ¡mites y adjuntos a documentos.
- **VerificaciÃ³n mÃ­nima:** Decisiones tienen responsable/fecha; adjuntos usan mÃ³dulo documental sin duplicar almacenamiento.

#### `F5-07` â€” Interfaz (iteraciÃ³n `I-17`)
- **Dependencia:** `F5-06`
- **QuÃ© hacer:** Mis solicitudes, nueva solicitud, detalle/historial y bandeja de revisiÃ³n para autoridades.
- **Entregable:** Pantallas para mis solicitudes y bandeja de revisiÃ³n.
- **VerificaciÃ³n mÃ­nima:** E2E solicitudâ†’revisiÃ³nâ†’resoluciÃ³n; usuario no autorizado no ve bandeja.

**Cierre de F5 (`I-18`)**: solicitudes con transiciones vÃ¡lidas, sin autoaprobaciÃ³n ni exposiciÃ³n de datos; historial y desvinculaciÃ³n conservados.

### Fase 6 â€” Seguimiento, evaluaciÃ³n, reportes y estadÃ­sticas

**Puerta de entrada:** Fase 5 verificada/aprobada. **Puerta de salida:** criterios especÃ­ficos de Fase 6 en `docs/plan-desarrollo.md`.

#### `F6-01` â€” CatÃ¡logo de indicadores (iteraciÃ³n `I-19`)
- **Dependencia:** Fase 5 aprobada.
- **QuÃ© hacer:** Especificar para cada indicador: definiciÃ³n, fuente, filtros, fecha de corte, permisos y consulta que lo calcula.
- **Entregable:** CatÃ¡logo de mÃ©tricas con fuentes, alcance y filtros.
- **VerificaciÃ³n mÃ­nima:** Documentar fÃ³rmula/fuente/fecha de corte y permiso antes de implementar cada mÃ©trica.

#### `F6-02` â€” Panel institucional (iteraciÃ³n `I-19`)
- **Dependencia:** `F6-01`
- **QuÃ© hacer:** Integrantes activos, proyectos por estado/tipo, actividades realizadas, productos acadÃ©micos y tareas pendientes/completadas.
- **Entregable:** Panel institucional con agregados autorizados.
- **VerificaciÃ³n mÃ­nima:** Contar elementos con datos sintÃ©ticos conocidos; filtrar datos visibles antes de agregaciÃ³n.

#### `F6-03` â€” Panel de proyecto (iteraciÃ³n `I-19`)
- **Dependencia:** `F6-02`
- **QuÃ© hacer:** Progreso operativo de tareas, sprint actual si existe, entregables y fechas; separar indicadores de actividad de evaluaciÃ³n de calidad.
- **Entregable:** Panel de progreso de proyectos y sprint activo.
- **VerificaciÃ³n mÃ­nima:** Contadores coinciden con tareas y sprints; sin tareas mostrar â€œSin tareasâ€, no 100%.

#### `F6-04` â€” Panel personal (iteraciÃ³n `I-19`)
- **Dependencia:** `F6-03`
- **QuÃ© hacer:** Proyectos propios, tareas propias, asistencias y productos vinculados, respetando privacidad.
- **Entregable:** Panel personal a partir de relaciones existentes.
- **VerificaciÃ³n mÃ­nima:** Usuario solo ve sus asignaciones/asistencias/productos autorizados; probar acceso horizontal.

#### `F6-05` â€” Seguimiento cualitativo (iteraciÃ³n `I-20`)
- **Dependencia:** `F6-04`
- **QuÃ© hacer:** Observaciones de avances y dificultades; evaluaciones nominales mÃ¡s complejas se implementarÃ¡n Ãºnicamente cuando sus criterios, privacidad y destinatarios estÃ©n aprobados.
- **Entregable:** Observaciones cualitativas de seguimiento.
- **VerificaciÃ³n mÃ­nima:** Guardar observaciones autorizadas; no agregar ranking ni evaluaciÃ³n automatizada no aprobada.

#### `F6-06` â€” Reportes (iteraciÃ³n `I-20`)
- **Dependencia:** `F6-05`
- **QuÃ© hacer:** Filtros por rango de fechas, tipo de proyecto, estado, lÃ­nea y producto; paginaciÃ³n; ver resultados en pantalla. ExportaciÃ³n a PDF/Excel es **posterior**, salvo priorizaciÃ³n explÃ­cita.
- **Entregable:** Reportes filtrables/paginados visibles en pantalla.
- **VerificaciÃ³n mÃ­nima:** Fechas y estados aplican correctamente; exportaciÃ³n no requerida; permisos antes de consultas.

#### `F6-07` â€” Pruebas de exactitud (iteraciÃ³n `I-20`)
- **Dependencia:** `F6-06`
- **QuÃ© hacer:** Crear datos sintÃ©ticos con resultados conocidos y comparar manualmente conteos; comprobar que permisos restringen filas **antes** de calcular agregados.
- **Entregable:** Pruebas de exactitud de agregados y aislamiento.
- **VerificaciÃ³n mÃ­nima:** Comparar resultado contra fixture manual y verificar que agregados no revelan datos restringidos.

#### `F6-08` â€” UI (iteraciÃ³n `I-20`)
- **Dependencia:** `F6-07`
- **QuÃ© hacer:** Tarjetas, tablas y grÃ¡ficos bÃ¡sicos accesibles; estados de carga, error y Â«Sin datosÂ».
- **Entregable:** UI de indicadores, filtros y estados vacÃ­os/accesibilidad.
- **VerificaciÃ³n mÃ­nima:** NavegaciÃ³n por teclado, carga/error/vacÃ­o, etiquetas y grÃ¡ficos basados en datos reales.

**Cierre de F6 (`I-21`)**: conteos contra fixtures conocidos, privacidad de agregados, reportes y UI con estados de error/vacÃ­o; compatibilidad PostgreSQL.

## 5. Puertas de revisiÃ³n que NO son tareas de implementaciÃ³n
- **`I-09` â€” Cierre MVP:** comprobar todas las pruebas y condiciones de salida F0/F1/F2, datos sintÃ©ticos, instrucciones de arranque y permisos. Entregar lista de resultados con evidencia; solicitar aprobaciÃ³n antes de piloto o prÃ³xima fase.
- **`I-12`, `I-15`, `I-18`, `I-21` â€” Cierres posteriores:** ejecutar el conjunto de pruebas acumuladas de la fase, verificar migraciones SQLite/PostgreSQL, integridad de datos, autorizaciÃ³n y documentaciÃ³n; registrar aprobaciÃ³n pendiente hasta decisiÃ³n explÃ­cita.
- **No transformar un fallo conocido en â€œpendiente no crÃ­ticoâ€ sin autorizaciÃ³n**. Las observaciones de seguridad, pÃ©rdida de datos o acceso indebido bloquean cierre y despliegue.

## 6. PreparaciÃ³n de Railway (actividad independiente, previa autorizaciÃ³n explÃ­cita)
Este proceso **no se ejecuta automÃ¡ticamente al terminar la fase 6**; se puede preparar un borrador de configuraciÃ³n sin crear recursos.
- [ ] **R-01.** Solicitar autorizaciÃ³n para crear/usar proyecto Railway, desplegar servicios y potenciales costes.
- [ ] **R-02.** Configurar servicios Next.js/React/NestJS y PostgreSQL privado usando secretos del entorno; **nunca** subir `.env` a Git.
- [ ] **R-03.** Aplicar migraciones PostgreSQL controladamente y registrar comprobaciÃ³n de compatibilidad.
- [ ] **R-04.** Validar HTTPS, cookies `Secure`/`HttpOnly`, CSRF, permisos y flujo de invitaciÃ³n/verificaciÃ³n reales (o deshabilitados si no estÃ¡n listos).
- [ ] **R-05.** Configurar copia de seguridad y **probar restauraciÃ³n** antes de tratar datos reales.
- [ ] **R-06.** Hacer pruebas de humo, documentar versiÃ³n, rollback, responsable, fecha y lÃ­mites. Publicar/pilotear solo con autorizaciÃ³n.

## 7. Plantilla para `context/tarea-actual.md`
**No hay que copiar las 78 tareas a `/context`**. Al iniciar cada iteraciÃ³n, reemplazar Ãºnicamente los campos entre corchetes; mantener el catÃ¡logo entero en este archivo.

```markdown
# Tarea actual â€” [I-XX]
**Estado:** pendiente de autorizaciÃ³n | autorizada | en curso | pendiente de revisiÃ³n
**IteraciÃ³n:** [I-XX]
**Fase:** [0..6]
**Tareas autorizadas:** [ej. F0-05, F0-06, F0-07, F0-08, F0-09]
**Objetivo:** [copiar resumen de la tabla de iteraciones]

## Instrucciones
1. Lee `AGENTS.md`, `docs/plan-desarrollo.md`, `docs/backlog-tareas.md` y `context/estado-actual.md`.
2. Inspecciona Git, el cÃ³digo y las pruebas existentes antes de modificar.
3. Ejecuta SOLO las tareas indicadas, en ese orden, con las pruebas de cada una.
4. Ante bloqueo, informa; no adelantes otra iteraciÃ³n.

## Evidencias requeridas
- Rutas creadas/modificadas y comportamiento.
- Comandos realmente ejecutados y resultados.
- Criterios alcanzados y fallidos de cada ID.
- Migraciones y pruebas SQLite/PostgreSQL si corresponden.
- Riesgos, bloqueos y decisiones pendientes.

## Cierre
- Actualiza `context/estado-actual.md` sin atribuirte aprobaciones humanas.
- Detente; espera la autorizaciÃ³n explÃ­cita del responsable.
```

## 8. Ejemplo exacto para continuar tras I-01
1. El agente presenta evidencias de `F0-01` a `F0-04`; el responsable revisa compilaciÃ³n y conservaciÃ³n de documentos.
2. Si lo aprueba, el responsable cambia `context/tarea-actual.md` a `I-02`, indicando **solo** `F0-05` a `F0-09`, y estado `autorizada`.
3. El agente consulta aquÃ­ la descripciÃ³n y verificaciÃ³n de esas cinco tareas, implementa y prueba **una a una**, actualiza el estado y se detiene.
4. Se repite con `I-03`, `I-04`, etc. **No se necesita escribir de nuevo el plan**; solo actualizar la tarea activa y el registro de progreso.

**Prompt para el agente:**

```text
Lee AGENTS.md y las rutas que cita. IteraciÃ³n autorizada: I-XX.
Consulta `context/tarea-actual.md`, `docs/backlog-tareas.md`, `docs/plan-desarrollo.md`
y `context/estado-actual.md`. Inspecciona primero el repositorio.
Ejecuta exclusivamente los IDs indicados en tarea-actual, uno por vez.
Prueba cada entrega y reporta resultados reales. No avances ni despliegues.
Al terminar, actualiza estado-actual y espera mi aprobaciÃ³n.
```

## 9. Registro sugerido de avances (NO inventar estados)
Para cada iteraciÃ³n agregar a `context/estado-actual.md` una entrada:

```markdown
### [YYYY-MM-DD] â€” IteraciÃ³n [I-XX]
- Estado: implementada | verificada tÃ©cnicamente | bloqueada | aprobada por el responsable
- Tareas: [IDs y estado individual]
- Cambios: [archivos concretos]
- Pruebas: [comando => resultado real]
- Migraciones: [motor, versiÃ³n, resultado]
- Pendientes/bloqueos: [detalle y forma de reproducir]
- AprobaciÃ³n humana: pendiente | confirmada (referencia de decisiÃ³n)
```

---
**Alcance de esta guÃ­a:** plan inicial para el desarrollo gradual del prototipo. Las decisiones organizacionales pendientes y el uso de datos reales deben ser aprobados antes de cualquier adopciÃ³n institucional.
