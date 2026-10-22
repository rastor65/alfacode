# Registro de decisiones — AlfaCode HUB

Este archivo documenta dudas y cambios que afectan arquitectura, alcance, seguridad o comportamiento. No reemplaza al diseno tecnico ni al plan de desarrollo.

## Decisiones vigentes

### DEC-001 — Stack tecnologico vigente

- **Fecha:** 2026-10-12
- **Estado:** aprobada por instruccion del responsable en la conversacion de trabajo.
- **Decision:** el frontend vigente es **Next.js + React + TypeScript**, aprovechando el proyecto ya instalado. No se debe instalar Angular ni crear un segundo frontend sin autorizacion explicita.
- **Backend:** **Node.js + NestJS + TypeScript**, API REST versionada para AlfaCode HUB.
- **Datos:** **TypeORM** como ORM previsto; **SQLite** para desarrollo local; **PostgreSQL** para produccion en Railway y pruebas de compatibilidad.
- **Seguridad futura:** autenticacion, sesiones y RBAC deben implementarse en backend cuando la fase correspondiente lo autorice.
- **Archivos afectados:** `AGENTS.md`, `docs/plan-desarrollo.md`, `docs/backlog-maestro.md`, `docs/AlfaCode_HUB_Diseno_Tecnico_Inicial_v0.2.md`, `docs/AlfaCode_HUB_Documento_Completo_v0.2.md`, `context/*`.

### DEC-002 — I-01 no inicializa aplicaciones

- **Fecha:** 2026-10-12
- **Estado:** aprobada por instruccion del responsable.
- **Decision:** `context/tarea-actual.md` debe orientar I-01 a inspeccionar estructura, dependencias instaladas, scripts y compatibilidad del stack existente. No debe inicializar Angular, reinstalar Next.js, crear otro frontend ni instalar persistencia durante I-01.
- **Razon:** el repositorio ya tiene `frontend/` y `backend/`; la primera iteracion debe preservar lo existente y registrar faltantes.

### DEC-003 - PostgreSQL pausado temporalmente

- **Fecha:** 2026-10-12
- **Estado:** aprobada por instruccion del responsable.
- **Decision:** durante las siguientes tareas se trabajara solamente con SQLite como base de datos local. PostgreSQL se mantiene como decision futura para produccion/Railway, pero no se configurara ni se probara de momento.
- **Justificacion:** reducir alcance operativo mientras se construye la base inicial.
- **Impacto:** migraciones y datos se verifican en SQLite hasta nueva autorizacion; no se debe declarar compatibilidad PostgreSQL completada.

### DEC-004 - Aprobacion de I-01, I-02, I-03 y cierre de Fase 0

- **Fecha:** 2026-10-12
- **Estado:** aprobada.
- **Decision:** el responsable aprueba I-01, I-02 e I-03 y autoriza continuar con la siguiente iteracion (I-04, inicio de Fase 1).
- **Aprobacion del responsable:** confirmada en la conversacion de trabajo del 2026-10-12 ("i 01, i 02 e i 03 las apruebo, continua con la siguiente").

### DEC-005 - Estrategia de sesion y alcance de I-04

- **Fecha:** 2026-10-12
- **Estado:** aplicada en I-04; derivada sin cambios de `plan-desarrollo.md` seccion 2.3, que ya fija la implementacion.
- **Decision:** sesion opaca revocable en tabla `sessions`; token aleatorio de 32 bytes enviado solo en cookie `HttpOnly`; en base de datos se guarda unicamente su hash SHA-256; duracion 7 dias sin renovacion silenciosa; cada validacion exige sesion no revocada, no vencida y usuario `active`. Contrasenas con Argon2id (se instalara al implementar login, F1-05).
- **Detalles de implementacion:** IDs UUID generados en la aplicacion; roles institucionales insertados por seed idempotente (`npm run backend:seed:roles`), no por migracion; la migracion `IdentityBase1728700000000` falla explicitamente en PostgreSQL hasta que se retome (DEC-003).
- **Pendiente para iteraciones siguientes:** tablas `membership_requests`, `invitations` y `verification_tokens` (resto de F1-01), login/logout/me, cookie, CSRF y rate limit. Atendido en I-05 (DEC-006).
- **Aprobacion del responsable:** confirmada junto con la aprobacion de I-04 (DEC-007).

### DEC-006 - Protecciones de autenticacion de I-05 e IP del cliente

- **Fecha:** 2026-10-13
- **Estado:** aplicada en I-05; pendiente de revision del responsable.
- **Contexto:** el responsable autorizo I-05 incluyendo CSRF, rate limit y "todas las protecciones necesarias".
- **Decisiones:**
  - **Rutas privadas por defecto:** guard global; solo `@Public()` (health, login) queda abierto. Roles con `@RequireRoles()` evaluados en backend (union de roles).
  - **CSRF:** patron sincronizador ligado a la sesion. Al iniciar sesion se genera un token CSRF; se guarda su hash en `sessions.csrf_token_hash` y su valor viaja en la cookie legible `alfacode_csrf` y en el cuerpo del login. Toda operacion mutable autenticada exige la cabecera `X-CSRF-Token` correcta. Ademas, toda operacion mutable (incluido login) exige `Origin`/`Referer` en `CORS_ORIGINS`.
  - **Rate limit:** en memoria, ventana fija de 15 min, contando **solo intentos fallidos** de login: 5 por cuenta+IP (se reinicia al acertar), 20 por cuenta desde cualquier IP y 50 por IP. Asi un atacante no bloquea al dueno de la cuenta en otra red y una red compartida (NAT del campus) no se bloquea por los aciertos de sus usuarios. Ademas, 300 peticiones/min por IP en toda la API. Solo valido con una instancia del backend; con replicas debe moverse a un almacen compartido.
  - **Concurrencia de Argon2id:** maximo 4 verificaciones simultaneas (64 MiB cada una) y 100 en espera; por encima responde 503 `SERVICE_BUSY`. El hash ficticio se precalcula al arrancar.
  - **Login:** Argon2id (64 MiB, t=3, p=4), rehash automatico si cambian parametros, verificacion contra hash ficticio si el correo no existe (sin enumeracion por tiempo ni por mensaje), estado de cuenta revelado solo tras contrasena correcta, rotacion de sesion al volver a iniciar sesion.
  - **Validacion:** DTO validados con una clase explicita por endpoint (`DtoValidationPipe`), porque `tsx` no emite metadatos y un `ValidationPipe` global se saltaria la validacion en desarrollo. Se rechazan propiedades no declaradas.
  - **Otros:** `helmet`, errores uniformes `{code, message, details}` sin trazas, limite de cuerpo JSON 100 kB, limpieza horaria de sesiones vencidas.
- **Hallazgo (IP del cliente):** verificado con un servidor de eco que el rewrite de Next.js 16 **no agrega** `X-Forwarded-For` y **reenvia sin filtrar** el que envie el cliente; ademas Next.js ya no expone la IP en `proxy.ts` ni en Route Handlers cuando se aloja por cuenta propia.
- **Correccion (2026-10-13, por instruccion del responsable):** el frontend se ejecuta con un **servidor personalizado** documentado por Next.js (`frontend/server/index.mjs`), unico punto con acceso al socket real. Antes de pasar la peticion a Next.js (incluidas conexiones WebSocket), `server/client-ip.mjs` elimina `X-Forwarded-For`, `X-Real-IP` y `Forwarded` recibidos y escribe una sola `X-Forwarded-For` con la IP real: la del socket si Next.js recibe conexiones directas (`FRONTEND_TRUSTED_PROXY_HOPS=0`), o la entrada agregada por el proxy mas externo si hay N proxies de confianza delante. El backend confia solo en ese salto: `TRUST_PROXY=loopback` por defecto fuera de produccion.
- **Requisito para produccion:** configurar `FRONTEND_TRUSTED_PROXY_HOPS` segun los proxies que haya delante de Next.js, y en el backend `TRUST_PROXY` con la direccion o subred del servidor de Next.js (el backend no debe ser accesible publicamente si confia en esa cabecera). Con `NODE_ENV=production` el backend **no arranca** si `TRUST_PROXY` o `CORS_ORIGINS` no estan definidos explicitamente, o si `CORS_ORIGINS` contiene origenes que no son `https://`. `TRUST_PROXY=false` explicito solo es valido si el backend recibe las conexiones directamente. La topologia concreta debe confirmarse al planear el despliegue.
- **Aprobacion del responsable:** pendiente.

### DEC-007 - Aprobacion de I-04 y autorizacion de I-05

- **Fecha:** 2026-10-13
- **Estado:** aprobada.
- **Decision:** el responsable aprueba I-04 y autoriza I-05, incluyendo CSRF, rate limit y todas las protecciones necesarias.
- **Aprobacion del responsable:** confirmada en la conversacion de trabajo ("apruebo i 04, autorizo i 05, incluye csrf, rate limit y todas las protecciones necesarias").

### DEC-008 - Aprobacion de I-05 y autorizacion de I-06

- **Fecha:** 2026-10-13
- **Estado:** aprobada.
- **Decision:** el responsable aprueba I-05 (incluidas las correcciones de hallazgos y la IP real del cliente) y autoriza I-06.
- **Aprobacion del responsable:** confirmada en la conversacion de trabajo ("apruebo i 05, continua con i 06"). Con ello DEC-006 queda aprobada.

### DEC-009 - Vinculacion de integrantes (I-06)

- **Fecha:** 2026-10-13
- **Estado:** aplicada en I-06; pendiente de revision del responsable.
- **Decisiones:**
  - **Primer administrador (F1-04):** comando `npm run backend:bootstrap:admin`, interactivo; la contrasena se introduce en ejecucion sin mostrarse. Falla si ya existe cualquier usuario con rol `admin`, si el correo ya existe o si faltan los roles. El correo queda verificado porque lo declara quien ejecuta el comando.
  - **Correo (F1-11):** interfaz `Mailer` reemplazable con `outbox` (desarrollo: un `.eml` por correo en `backend/data/outbox/`, ignorado por Git), `memory` (pruebas) y `none`. En produccion solo se admite `none` hasta integrar un correo real; con `none` el registro publico responde 503 `REGISTRATION_DISABLED` (plan, seccion 2.3) y la invitacion devuelve el enlace una sola vez a quien invita (`delivery: "manual"`).
  - **Enlaces:** `${APP_PUBLIC_URL}/verificar-correo#token=...` e `${APP_PUBLIC_URL}/invitacion#token=...`. El token viaja en el fragmento, que el navegador no envia al servidor ni a logs. Las paginas del frontend que los consumen corresponden a F1-14.
  - **Registro (F1-08):** respuesta 202 identica exista o no el correo (a una cuenta existente se le envia un aviso sin enlace); el hash Argon2id se calcula en ambos casos. El correo se envia dentro de la transaccion. Verificacion valida 24 h y de un solo uso. Limite: 10 registros/hora y 20 verificaciones/15 min por IP.
  - **Aprobacion (F1-09):** solo `admin`/`coordinator`; solo se aprueba si el correo esta verificado (409 `EMAIL_NOT_VERIFIED`); transicion condicionada a `pending` (409 `REQUEST_ALREADY_RESOLVED`); registra autor, fecha, comentario y rol. El rechazo deja la cuenta en `rejected`.
  - **Invitaciones (F1-10):** 72 h, un solo uso, hash del token; una nueva invitacion revoca las abiertas para el mismo correo; no se invita a correos con cuenta existente (cualquier estado; 409). La aceptacion crea la cuenta `active` con correo verificado y el rol autorizado, sin solicitud publica. Limite: 10 aceptaciones/15 min por IP.
  - **Roles:** `admin` asigna cualquier rol; `coordinator` solo `teacher_leader`, `researcher` y `student` (403 `ROLE_NOT_ASSIGNABLE`).
  - **Contrasenas nuevas:** de 12 a 128 caracteres.
  - **Auditoria:** tabla `audit_events` (actor, accion, objetivo, detalles JSON sin secretos), escrita en la misma transaccion que el cambio. Sin clave foranea al actor, para conservar el historial.
- **Limites conocidos:** un correo rechazado o con registro pendiente no puede recibir invitacion ni registrarse de nuevo hasta que exista administracion de integrantes (F1-13). No hay reenvio de verificacion.
- **Aprobacion del responsable:** pendiente.

### DEC-010 - Solo correos institucionales @uniguajira.edu.co

- **Fecha:** 2026-10-13
- **Estado:** aprobada por instruccion del responsable ("agrega la validacion para que los unicos correos autorizados sean los del dominio @uniguajira.edu.co"); implementada dentro de I-06.
- **Decision:** solo se admiten correos cuyo dominio sea exactamente `uniguajira.edu.co` (comparacion de lo que sigue a la ultima `@`, sin distinguir mayusculas). Se rechazan subdominios (`@estudiantes.uniguajira.edu.co`) e imitaciones (`@uniguajira.edu.co.evil.com`).
- **Alcance:** la regla se aplica en todos los puntos de entrada de correo: registro, creacion de invitaciones, aceptacion de invitaciones (por si la politica cambio despues de emitirlas), comando de bootstrap del administrador y login (ninguna cuenta fuera del dominio puede iniciar sesion aunque existiera). Respuesta: 400 `EMAIL_DOMAIN_NOT_ALLOWED`.
- **Configuracion:** `ALLOWED_EMAIL_DOMAINS` (lista separada por comas), con `uniguajira.edu.co` por defecto; valores invalidos impiden arrancar.
- **Subdominios:** el responsable confirmo el 2026-10-13 que la universidad no usa subdominios de correo; la comparacion exacta queda como definitiva.

### DEC-011 - Aprobacion de I-06 y autorizacion de I-07

- **Fecha:** 2026-10-13
- **Estado:** aprobada.
- **Decision:** el responsable aprueba I-06 (incluida la restriccion de dominio DEC-010) y autoriza I-07. Con ello DEC-009 queda aprobada.
- **Aprobacion del responsable:** confirmada en la conversacion de trabajo ("apruebo i 06, puedes continuar con i 07").

### DEC-012 - Recuperacion, perfil y administracion de integrantes (I-07)

- **Fecha:** 2026-10-13
- **Estado:** aplicada en I-07; pendiente de revision del responsable.
- **Recuperacion (F1-06):** `POST /auth/forgot-password` responde 202 identico exista o no la cuenta; solo cuentas activas y verificadas reciben correo, que se envia sin esperar para no delatar la cuenta por tiempo. Token de un solo uso valido 30 minutos en `#token=` de `/restablecer-contrasena`; una nueva solicitud invalida la anterior. `POST /auth/reset-password` revoca todas las sesiones y se audita. Limites: 10 solicitudes/15 min por IP, 3/hora por cuenta, 10 confirmaciones/15 min por IP. Sin correo real responde 503 `PASSWORD_RESET_DISABLED` (plan, seccion 2.3).
- **Perfil (F1-12):** `GET/PATCH /users/me`; solo `fullName` es editable y cualquier otro campo se rechaza con 400.
- **Integrantes (F1-13):**
  - `GET /users`: cualquier integrante ve solo activos con `id`, `fullName` y `roles`, busca por nombre y filtra por rol; las autoridades ven ademas correo, estado y verificacion, buscan tambien por correo y filtran por estado. La busqueda es literal (se escapan `%` y `_`).
  - `GET /users/:id`: solo autoridades.
  - `PATCH /users/:id/status`: transiciones `active -> inactive`, `inactive -> active` y `rejected -> active` (esta ultima exige `roleCode` si la persona no tiene roles y correo verificado); las cuentas `pending` se resuelven desde la cola. Desactivar revoca sus sesiones de inmediato.
  - **Rutas nuevas, no listadas en el plan:** `POST /users/:id/roles` y `DELETE /users/:id/roles/:roleCode` para asignar y retirar roles institucionales.
  - Reglas: nadie cambia su propio estado ni sus roles; un coordinator no asigna ni retira `admin`/`coordinator` ni administra a personas con esos roles; una cuenta activa conserva al menos un rol; nunca se deja el sistema sin un `admin` activo (defensa en profundidad: por la API no es alcanzable porque quien actua seria otro admin activo). No hay borrado de usuarios.
  - Todo cambio de estado o rol se audita con actor, valores anteriores y nuevos y motivo.
- **Aprobacion del responsable:** pendiente.

### DEC-013 - Aprobacion de I-07 y autorizacion de I-08 por fases

- **Fecha:** 2026-10-13
- **Estado:** aprobada.
- **Decision:** el responsable aprueba I-07 (con ello DEC-012) y autoriza I-08, pidiendo dividir las tareas grandes en fases. I-08 (F1-14, pantallas de acceso) se divide en: I-08.1 base, login, panel minimo y logout; I-08.2 registro, verificacion de correo y aceptacion de invitacion; I-08.3 recuperacion y restablecimiento de contrasena y repaso de estados y accesibilidad. Cada fase se entrega para revision antes de seguir.
- **Aprobacion del responsable:** confirmada en la conversacion de trabajo ("apruebo i 07, continua con i 08, recuerda que si es una tarea grande, dividirla en varias fases").

### DEC-014 - Arquitectura de autenticacion en el frontend (I-08.1)

- **Fecha:** 2026-10-13
- **Estado:** aplicada en I-08.1; pendiente de revision del responsable.
- **Decision:** los formularios son componentes de cliente que llaman a `/api/v1` en el mismo origen (`src/lib/api/client.ts`), no Server Actions. Asi la cookie `HttpOnly` la fija el propio backend, el navegador envia `Origin` y la IP real llega por el servidor personalizado: se reutilizan los controles ya probados (origen, CSRF, limites por IP). En operaciones mutables el cliente reenvia en `X-CSRF-Token` el valor de la cookie `alfacode_csrf`.
- **Sesion en el servidor:** `src/lib/auth/session.ts` (`server-only`) valida la cookie contra `GET /auth/me` en cada renderizado, memoizado por peticion con `cache` y reenviando la IP real del cliente. Las paginas protegidas llaman a `requireSessionUser` en la propia pagina (no solo en un layout). Es una comprobacion para decidir que mostrar; la autorizacion efectiva sigue en el backend.
- **Rutas:** `/ingresar` (login, `noindex`) y `/panel` (minimo, protegido, `noindex`). El destino `?next=` se valida con `safeNextPath` contra redirecciones abiertas.
- **Layout de vistas privadas (instruccion del responsable, 2026-10-13):** header superior, menu lateral y contenido (`src/components/layout/app-shell.tsx`), aplicado con el grupo de rutas `src/app/(privado)/` sin cambiar URLs. A peticion del responsable se hizo sutil: header fijo con linea inferior y fondo translucido, menu lateral separado por una linea fina, contenido directamente sobre el fondo; el selector de tema y "Cerrar sesion" (variante `ghost`) estan al pie del menu lateral. El selector de tema es un desplegable (`src/components/theme/theme-menu.tsx`, patron de menu WAI-ARIA con `menuitemradio`): fila en el menu lateral que abre hacia arriba, e icono en el header de las pantallas de acceso. Por debajo de `lg` el menu lateral se abre desde un boton del header (cierra con Escape, clic fuera o al navegar). El layout solo obtiene el usuario para mostrarlo; cada pagina verifica la sesion. El menu solo lista vistas ya implementadas.
- **Temas (instruccion del responsable, 2026-10-13):** las vistas del HUB (acceso y privadas) admiten claro, oscuro y sistema; por defecto sistema. Los colores son variables CSS (`--hub-*` en `globals.css`) que cambian segun `data-theme` sobre `.hub-theme`; el modo sistema lo resuelve `prefers-color-scheme` sin JavaScript. La preferencia se guarda en la cookie no sensible `alfacode_theme` (1 ano, `SameSite=Lax`) y el servidor la aplica al renderizar, por lo que no hay parpadeo ni script en linea. Contraste de los tokens verificado contra WCAG AA (minimo 4,71:1). **Portafolio publico (instruccion del responsable, 2026-10-13):** tambien admite los tres temas, con la misma cookie y el mismo desplegable en el header publico (icono junto a "Ingresar"). `PublicThemeProvider` envuelve la portada y `PublicPageShell` con la clase `.public-site`; como sus componentes se escribieron con la paleta de Tailwind en oscuro, en claro `.public-site` reasigna esa paleta (`white`, `slate-*`, `cyan-*`, `emerald-400`) y los colores que no son de la paleta pasan a tokens `--site-*`, de modo que el modo oscuro no cambia (salvo dos rotulos que pasan de opacidad 70 % a 80 % para cumplir contraste en claro). Consecuencia: las rutas publicas leen la cookie y pasan de prerenderizadas a renderizadas por peticion, igual que las pantallas de acceso. Contraste del texto en claro verificado contra WCAG AA (minimo 4,67:1).
- **Enlaces con token (I-08.2):** `/verificar-correo` e `/invitacion` leen el token del fragmento en el navegador con `useSyncExternalStore` (sin desajuste de hidratacion), lo quitan de la barra de direcciones tras usarlo y declaran `referrer: no-referrer`. La verificacion de correo exige pulsar un boton, para que los filtros de correo que abren enlaces automaticamente no consuman el token de un solo uso.
- **Pruebas:** se agrega `tsx@4.23.15` como dependencia de desarrollo del frontend para probar modulos TypeScript con `node:test` (resuelve los alias `@/`).
- **Hallazgo:** `npm audit` del frontend reporta 5 vulnerabilidades altas previas en la cadena de ESLint (`braces` via `eslint-config-next`), solo de desarrollo; `npm audit --omit=dev` reporta 0. La correccion automatica bajaria `eslint-config-next` a 14 (cambio incompatible), por lo que no se aplico.
- **Aprobacion del responsable:** pendiente.

### DEC-015 - Correo real por SMTP de Google

- **Fecha:** 2026-10-13
- **Estado:** aprobada por instruccion del responsable ("quiero usar el smtp de google"); implementada, pendiente de la prueba funcional con credenciales reales.
- **Decision:** nuevo transporte `MAIL_TRANSPORT=smtp` con `nodemailer@10.0.11` (con tipos propios, sin dependencias; se eligio una version con 16 dias publicada en lugar de la 10.1.0 de 2 dias). Por defecto `smtp.gmail.com:465` con TLS implicito (en 587 se exige STARTTLS), TLS minimo 1.2 y tiempos de espera de 10 a 20 s. Credenciales solo por variables de entorno (`SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`); si faltan, el backend no arranca. Al arrancar se comprueba la conexion en segundo plano y se registra el resultado sin secretos. En produccion se admiten `smtp` o `none`.
- **Autenticacion de Google:** el usuario y la contrasena normales ya no sirven por SMTP; se requiere una contrasena de aplicacion (16 caracteres), que exige verificacion en dos pasos. En cuentas de una organizacion (Google Workspace) el administrador puede tenerla deshabilitada; alternativas: pedir a TI que la habilite, usar OAuth 2.0 o el servicio SMTP relay de Workspace (cambios futuros), o una cuenta personal de Gmail.
- **Cambio de diseno:** registro e invitaciones envian el correo despues de confirmar la transaccion (antes se enviaba dentro), para no bloquear SQLite durante el envio por red. Si el envio falla se compensa: el registro pendiente se borra (con su solicitud y token; queda la auditoria `user.registration_rolled_back`) y la invitacion se revoca (`invitation.revoked`); la API responde 503 `MAIL_DELIVERY_FAILED`. Un registro con correo existente y uno nuevo responden igual ante el fallo. La recuperacion de contrasena ya enviaba despues de confirmar y sin esperar.
- **Prueba funcional:** `npm run backend:mail:test -- destinatario@uniguajira.edu.co` comprueba conexion y credenciales y envia un correo de prueba.
- **Aprobacion del responsable:** decision confirmada; falta su prueba con credenciales reales.

### DEC-016 - Solicitud sin contrasena y contrasena temporal al aprobar

- **Fecha:** 2026-10-13
- **Estado:** aprobada por instruccion del responsable ("cuando un usuario solicita unirse, no debe llenar su contrasena ... si la acepta, se debe autogenerar una contrasena ... y que el sistema le obligue a cambiarla apenas inicie sesion"). Opciones confirmadas por el responsable: se quita la verificacion previa del correo; las invitaciones no cambian.
- **Conflicto con el plan:** `plan-desarrollo.md` F1-08 pide verificar el correo antes de aprobar y lista `POST /auth/verify-email`. Por la jerarquia de decisiones prevalece la instruccion del responsable; el plan no se modifica y este registro documenta la diferencia. La propiedad del correo se sigue comprobando: al usar la contrasena temporal enviada a el (o un enlace de recuperacion).
- **Flujo:**
  1. `POST /auth/register` recibe nombre, correo y mensaje (una contrasena se rechaza con 400). Crea el usuario `pending` con una contrasena inutilizable (hash de un secreto aleatorio) y la solicitud `pending`. No envia correos. Respuesta identica exista o no la cuenta.
  2. Al aprobar se activa la cuenta, se asigna el rol y se genera una contrasena temporal de 16 caracteres aleatorios (aprox. 93 bits, sin caracteres ambiguos), valida 72 h; solo se guarda su hash. Se envia por correo despues de confirmar.
  3. En el primer ingreso con la temporal el correo queda verificado (`user.email_verified`, fuente `temporary_password`). Mientras `must_change_password` sea verdadero, el backend responde 403 `PASSWORD_CHANGE_REQUIRED` en toda ruta salvo `GET /auth/me`, `POST /auth/logout` y `POST /auth/change-password`. El frontend redirige a `/cambiar-contrasena`.
  4. `POST /auth/change-password` (contrasena actual + nueva) quita la obligacion, invalida la temporal y revoca las demas sesiones; limita los fallos con la contrasena actual a 5 cada 15 minutos.
- **Entrega y fallos:** respuesta de aprobacion con `credentials.delivery`: `email`, `manual` (sin SMTP: la contrasena se devuelve una sola vez a quien aprueba) o `failed` (la aprobacion se mantiene). `POST /users/:id/temporary-password` (admin/coordinator, nunca sobre la propia cuenta ni sobre quien no puede administrar, solo cuentas activas) genera una nueva temporal, revoca sesiones y la entrega. Reactivar una cuenta rechazada o que nunca ingreso tambien genera una temporal. Vencida, la persona puede usar la recuperacion de contrasena (ahora disponible para cuentas activas aun sin verificar; el enlace verifica el correo).
- **Seguridad:** la contrasena temporal no se registra en logs ni en la auditoria; todas las respuestas de `/api/v1` llevan `Cache-Control: no-store`. Se elimino `POST /auth/verify-email` y la pagina `/verificar-correo`; la tabla `verification_tokens` sigue en uso para la recuperacion.
- **Migracion:** `PasswordLifecycle1728730000000` agrega `users.must_change_password` y `users.password_expires_at`.
- **Riesgo aceptado:** enviar una contrasena por correo deja una credencial en el buzon hasta su primer uso; se mitiga con vencimiento de 72 h, cambio obligatorio y revocacion de sesiones.
- **Aprobacion del responsable:** decision confirmada; implementacion pendiente de su revision.

### DEC-017 - Autorizacion de I-09 y estado de I-08

- **Fecha:** 2026-10-13
- **Estado:** I-09 autorizada ("autorizo i 09, continuemos").
- **Contexto:** el responsable integro I-04 a I-08 en `main` (commit `a2dd3d8`, PR #1). No declaro de forma explicita la aprobacion de I-08 ni de DEC-016; se registra la autorizacion de I-09 y la integracion, sin marcarlas como aprobadas.
- **Cambios de otra persona colaboradora (rastor65):** commits `7da7c27` (script de build raiz), `19296ef` (logos oficiales) y `b137c57` (pantallas de acceso con escena Three.js y dependencia `three`). El nuevo `auth-shell.tsx` usa colores oscuros fijos, por lo que las pantallas de acceso ya no respetan el tema claro pedido por el responsable; queda como punto a decidir, sin cambios del agente sobre ese trabajo.
- **I-09 por fases:** I-09.1 perfil; I-09.2 cola de solicitudes; I-09.3 integrantes e invitaciones.
- **Convencion de modales (instruccion del responsable):** crear, editar, ver detalle y confirmar acciones se hace en modales (`src/components/ui/modal.tsx`, sobre `<dialog>` nativo con `showModal()`: foco atrapado, fondo inerte, Escape y devolucion del foco). Las paginas quedan como listados y vistas de lectura; se elimino la pagina `/integrantes/[id]`. Los datos de un modal se cargan en el evento que lo abre, no en un efecto.
- **Select de shadcn (instruccion del responsable):** los selectores usan el `Select` de shadcn/ui (`src/components/ui/select.tsx`, copiado al estilo shadcn y adaptado a los tokens del HUB) sobre `@radix-ui/react-select@2.3.7` (se evitaron 2.3.8, 2.4.0 y 2.4.1 por tener menos de dos semanas). No se ejecuto `shadcn init` porque reescribiria `globals.css` y los tokens de tema. Dentro de un modal, la lista se monta en el propio `<dialog>` (`PortalContainerContext`), porque lo montado en `body` quedaria debajo de la capa superior e inerte. shadcn no estaba instalado: los demas componentes de `ui/` siguen siendo propios.
- **Convencion de layout (instruccion del responsable):** el contenido de cada vista privada va centrado en el area de contenido con un ancho comun (`mx-auto w-full max-w-3xl`), para que no quede pegado a la izquierda ni cambie de posicion al navegar.

### DEC-018 - Commit de I-09 y autorizacion de I-10

- **Fecha:** 2026-10-13
- **Estado:** autorizado ("hazlo", en respuesta a la propuesta de hacer commit y preparar I-10).
- **Decision:** se hace commit en `dev` de I-09 y de los ajustes posteriores (modales, `Select` y `Switch` de shadcn, centrado, filtros e interruptores de roles). Se autoriza I-10 (Fase 2: proyectos y equipos, F2-01 a F2-06).
- **Pendiente:** el responsable no declaro de forma explicita la aprobacion de I-08, I-09 ni DEC-016; quedan registradas como integradas y autorizadas para continuar, no como aprobadas. El plan pone como dependencia de la Fase 2 "Fase 1 aceptada"; prevalece la instruccion del responsable de continuar.
- **Creacion de proyectos:** sin respuesta sobre el permiso adicional para `teacher_leader` (F2-03), se aplica el valor por defecto del plan: solo `admin` y `coordinator` crean proyectos.

### DEC-019 - Vistas privadas bajo `/hub`

- **Fecha:** 2026-10-13
- **Estado:** autorizado ("hazlo como recomiendas", en respuesta a la propuesta de agrupar lo privado bajo `/hub`).
- **Contexto:** la ruta `/proyectos` ya la usa el portafolio publico; los proyectos del HUB necesitaban otra.
- **Decision:** todas las vistas privadas pasan a `/hub` (`/hub`, `/hub/proyectos`, `/hub/integrantes`, `/hub/solicitudes`, `/hub/perfil`); el destino tras el login es `/hub`. Las rutas anteriores (`/panel`, `/perfil`, `/solicitudes`, `/integrantes`) redirigen con 307 desde `next.config.ts`, temporales para no fijarlas en caches mientras la estructura evoluciona. Las pantallas de acceso (`/ingresar`, `/registro`, `/cambiar-contrasena`, recuperacion) no cambian.
- **Impacto:** el backend no cambia. Enlaces guardados a las rutas anteriores siguen funcionando.

### DEC-020 - Aprobacion de I-08, I-09, I-10 y DEC-016; autorizacion de I-11

- **Fecha:** 2026-10-13
- **Estado:** aprobado ("aprobados I-08, I-09, I-10 y DEC-016. continua con i 11").
- **Decision:** el responsable aprueba I-08 (pantallas de acceso), I-09 (gestion de perfil, solicitudes e integrantes), I-10 (proyectos y equipos) y DEC-016 (solicitud sin contrasena y contrasena temporal). Se autoriza I-11 (Fase 2B: tareas, backlog, Kanban y progreso, F2-07 a F2-12), incluida la regla pendiente de F2-04 sobre miembros con tareas asignadas.
- **Pendiente:** la Fase 1 y la Fase 2 no pueden cerrarse formalmente mientras PostgreSQL siga pausado (pruebas F1-9 y F2-11).

### DEC-021 - Decisiones de implementacion de I-11 (tareas, backlog y Kanban)

- **Fecha:** 2026-10-13
- **Estado:** aprobada (DEC-022).
- **`sprint_id` sin clave foranea:** la migracion `Tasks1728750000000` crea `tasks.sprint_id` nullable y sin FK, porque `sprints` llega en la Fase 2C. La API de I-11 no acepta `sprintId` (siempre `null`). En I-12 la migracion de sprints debera reconstruir `tasks` en SQLite para agregar la FK y la regla de mismo proyecto.
- **F2-04, retiro con tareas:** `DELETE /projects/:id/members/:userId` responde 409 `MEMBER_HAS_ASSIGNED_TASKS` (con `details.openTasks`) si la persona tiene tareas abiertas (`status != done`). Con `?unassignTasks=true` las desasigna en la misma transaccion, con auditoria por tarea. Las tareas `done` conservan a su responsable como historial.
- **Permisos (F2-09):** autoridad y lider gestionan todos los campos; el colaborador solo cambia `status` de las tareas que tiene asignadas (si envia cualquier otro campo, 403). Proyectos `completed`/`cancelled`: tareas en solo lectura (409). No hay borrado de tareas: el plan no define `DELETE` para tareas en la API minima F2.
- **Kanban (F2-11):** sin bibliotecas; cada tarjeta se mueve con un selector de estado accesible por teclado o arrastrandola (HTML5 nativo). Ambos hacen el mismo `PATCH` de `status`.
- **Progreso (F2-12):** `progress` (`total`, `done`, `byStatus`) en el listado, el detalle y la lista de tareas; con cero tareas la interfaz dice "Sin tareas" y nunca muestra un porcentaje.
- **Ruta y ancho:** el tablero vive en `/hub/proyectos/[id]/tareas` (pagina de lectura, con alta y edicion en modales, segun la convencion de DEC-017). Usa `max-w-6xl` en lugar del ancho comun `max-w-3xl` porque cuatro columnas no caben; es la unica excepcion.
- **Aprobacion del responsable:** confirmada (DEC-022).

### DEC-022 - Aprobacion de I-11 y autorizacion de I-12

- **Fecha:** 2026-10-13
- **Estado:** aprobado ("apruebo y autorizo", en respuesta a la propuesta de aprobar I-11 y DEC-021, hacer commit y autorizar I-12).
- **Decision:** se aprueban I-11 y DEC-021; se hace commit en `dev` y se autoriza I-12 (Fase 2C: sprints opcionales, F2-13 a F2-21).

### DEC-023 - Decisiones de implementacion de I-12 (sprints opcionales)

- **Fecha:** 2026-10-13
- **Estado:** aplicada en I-12; pendiente de revision del responsable.
- **Estados del sprint:** `planned`, `active`, `completed`, `cancelled`, segun F2-13 del plan; el diseno tecnico v0.2 menciona `closed`, pero prevalece el plan.
- **Integridad en la base de datos:** la migracion `Sprints1728760000000` reconstruye `tasks` (SQLite no agrega claves foraneas con `ALTER TABLE`) con la clave compuesta `(sprint_id, project_id) -> sprints (id, project_id)`, que impide asociar una tarea a un sprint de otro proyecto aunque se salte la API. Un indice unico parcial (`project_id WHERE status = 'active'`) garantiza un solo sprint activo por proyecto; el servicio lo comprueba antes y traduce el conflicto del indice a 409. Revertir la migracion devuelve todas las tareas al backlog.
- **Historial:** `sprint_closure_items` se escribe al cerrar y tambien al cancelar (F2-18 pide conservar historial); no hay API para modificarlo. El progreso de un sprint finalizado se calcula con ese registro, no con las tareas actuales.
- **Reabrir una tarea:** si una tarea `done` de un sprint finalizado cambia a otro estado, vuelve al backlog (`sprint_id = null`, auditado como `task.sprint_changed` con `reason: reopened`) para poder planificarla de nuevo; el registro de cierre no cambia.
- **Planificacion:** se agregan tareas del backlog y se devuelven al backlog mientras el sprint este planificado o activo. Solo se edita (nombre, objetivo, fechas) un sprint planificado. Cancelar exige motivo.
- **F2-19, cambio de modalidad:** `POST /projects/:id/methodology` (ruta nueva, no listada en la API minima, porque la modalidad no forma parte de la edicion general). `agile -> traditional` responde 409 `PROJECT_HAS_SPRINTS` si existe cualquier sprint.
- **Interfaz:** `/hub/proyectos/[id]/sprints` (solo agiles; 404 en tradicionales) con lista, alta, detalle, planificacion, inicio, cierre, cancelacion e historial en modales. El tablero de un proyecto agil tiene un selector (sprint activo o planificado, backlog, todas); por defecto muestra el sprint activo. Una tarea creada mientras se ve un sprint planificable se agrega a ese sprint. Los proyectos tradicionales no muestran pestana ni enlaces de sprints.
- **Aprobacion del responsable:** confirmada en DEC-024.

### DEC-024 - Aprobacion de I-12 y del registro con Hoja de Vida; autorizacion de I-13 (cierre de la Fase 2)

- **Fecha:** 2026-10-15
- **Estado:** aprobado ("cerremos la fase 2"; en la consulta posterior el responsable eligio aprobar I-12 y el registro con Hoja de Vida).
- **Decision:** se aprueban I-12, DEC-023 y el registro con Hoja de Vida (trabajo de `main` del 2026-10-14, integrado en `dev` con `04bb40d`). Se autoriza I-13: cierre de la Fase 2 segun la puerta MVP del plan (pruebas de aceptacion F2, prueba E2E completa, revision de dependencias de seguridad y registro de pendientes).
- **Fuera de alcance:** iniciar la Fase 3, publicar con usuarios reales, el despliegue en Koyeb.

### DEC-025 - Cierre de la Fase 2 validado solo en SQLite

- **Fecha:** 2026-10-15
- **Estado:** aprobado (opcion "Excepcion documentada" elegida por el responsable).
- **Contexto/problema:** la prueba de aceptacion F2 #11 exige aplicar las migraciones desde cero y ejecutar los flujos criticos en SQLite y en PostgreSQL. PostgreSQL esta pausado por decision del responsable (DEC-003) y las migraciones lanzan un error explicito con `DB_TYPE=postgres`.
- **Opciones analizadas:** reactivar PostgreSQL ahora; cerrar con excepcion documentada.
- **Decision:** la Fase 2 se cierra validada solo en SQLite. La parte PostgreSQL de F2 #11 queda como requisito obligatorio, sin excepcion posible, antes de cualquier publicacion con usuarios reales o despliegue en produccion.
- **Consecuencia:** no se declara el MVP listo para produccion; se declara funcionalmente cerrado en desarrollo local.
- **Aprobacion del responsable:** confirmada.

### DEC-026 - Aprobacion de I-13 y autorizacion de la Fase 3 por iteraciones

- **Fecha:** 2026-10-15
- **Estado:** aprobado ("autorizo i 13, continua con la fase 3"; en la consulta posterior el responsable eligio ejecutar por iteraciones y hacer commit y push de I-13).
- **Decision:** se aprueba I-13; la Fase 2 queda cerrada (validada en SQLite, DEC-025). Se autoriza la Fase 3 en tres iteraciones, con revision del responsable entre ellas: I-14 investigacion (F3-01 a F3-04), I-15 documentos (F3-05 a F3-09), I-16 cierre de la Fase 3 (solo verificacion). Queda autorizada ahora I-14; I-15 e I-16 se inician tras la revision de la anterior.
- **Numeracion:** `docs/backlog-maestro.md` llama I-10, I-11 e I-12 a estas iteraciones; la numeracion real avanzo, por lo que se usan I-14, I-15 e I-16.
- **Decisiones del responsable:** se piden con el selector de respuestas.

### DEC-027 - Decisiones de implementacion de I-14 (investigacion)

- **Fecha:** 2026-10-15
- **Estado:** aplicada en I-14; pendiente de revision del responsable.
- **Lineas (F3-01):** las crean, editan, desactivan y eliminan solo `admin` y `coordinator`; cualquier integrante activo las consulta. El nombre es unico sin distinguir mayusculas, tildes ni espacios repetidos (columna `name_normalized`; `lower()` de SQLite no cubre tildes). Una linea con proyectos no se elimina (409 `RESEARCH_LINE_IN_USE`): se desactiva. Una linea inactiva sigue en los proyectos que ya la tenian, pero no se asocia a otros. El responsable es opcional y debe ser un integrante activo de cualquier rol.
- **Detalle de una linea:** muestra solo los proyectos que la persona puede ver (autoridades: todos; demas: aquellos en los que participa) y el total de proyectos asociados.
- **Informacion investigativa del proyecto (F3-02 a F3-04):** la gestiona quien gestiona el proyecto (autoridad o lider) mientras el proyecto no este finalizado; los colaboradores la consultan; un ajeno recibe 404. Es el mismo criterio que las tareas (DEC-021).
- **Ficha (F3-03):** opcional para cualquier tipo de proyecto, una por proyecto (clave primaria `project_id`), con los campos del plan: problema, pregunta, justificacion, metodologia y notas. Se guarda con `PUT` (reemplazo completo). Los objetivos y las metodologias detalladas (enfoque, tecnicas, instrumentos) del documento de requisitos no se agregaron porque el plan no los incluye.
- **Resultados (F3-04):** tipo segun el documento de requisitos (hallazgo, prototipo, aporte metodologico, otro), fecha opcional, referencias documentales en texto libre (los archivos se vinculan en I-15) y participantes. Los participantes deben ser integrantes del proyecto; quien ya figuraba en un resultado se conserva aunque haya salido del equipo, para no reescribir la autoria. Se pueden eliminar (auditado).
- **Fuera de alcance:** el seguimiento investigativo (avances, dificultades) del documento de requisitos (seccion 4.5), que el plan no incluye en F3.
- **Interfaz:** `/hub/investigacion` (catalogo con busqueda y filtro por estado; alta, detalle, edicion y eliminacion en modales) y la pestana «Investigacion» de cada proyecto (`/hub/proyectos/[id]/investigacion`) con lineas, ficha y resultados.
- **Prueba E2E:** `scripts/e2e-mvp.mjs` pasa a `scripts/e2e.mjs` (`npm run e2e`), con la parte de investigacion y las paginas reales de Next.js en el puerto 3100 usando la compilacion de produccion (Next.js no admite un segundo `next dev` en la misma carpeta).
- **Aprobacion del responsable:** confirmada en DEC-028.

### DEC-028 - Aprobacion de I-14 y autorizacion de I-15 (documentos)

- **Fecha:** 2026-10-15
- **Estado:** aprobado (opcion "Aprobar, commit y seguir" del selector).
- **Decision:** se aprueban I-14 y DEC-027; commit y push a `dev`; se autoriza I-15 (F3-05 a F3-09: documentos, almacenamiento, seguridad y permisos documentales). Las decisiones abiertas de documentos se piden al responsable antes de implementarlas.

### DEC-029 - Decisiones del responsable para documentos (I-15)

- **Fecha:** 2026-10-15
- **Estado:** aprobado (respuestas del selector).
- **Formatos:** PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), PNG, JPEG y WebP; se validan extension y contenido real. Limite inicial de 20 MiB configurable (F3-07).
- **Documentos privados:** los ven quien los subio, las personas autorizadas expresamente y tambien `admin` y `coordinator`. Es la regla justificada que pide la seccion 7.5 del documento de requisitos ("los permisos de administrador no deberan implicar automaticamente acceso irrestricto a documentos sensibles sin una regla justificada"); la razon es poder administrar documentos de personas que salgan del semillero.
- **Ambito:** documentos de un proyecto (opcionalmente de uno de sus resultados) y un repositorio institucional sin proyecto (actas, certificados, formatos) gestionado por la coordinacion. Las actividades se agregaran en la Fase 4.
- **Almacenamiento de produccion:** se decide despues. Se implementa `StorageService` con adaptador de disco local para desarrollo; en produccion el modulo documental queda deshabilitado (503) hasta elegir proveedor y credenciales con autorizacion. No se usa el disco efimero del servidor.

### DEC-030 - Decisiones de implementacion de I-15 (documentos)

- **Fecha:** 2026-10-15
- **Estado:** aprobada con I-15 (DEC-031, 2026-10-18).
- **Permisos (ademas de DEC-029):** suben documentos a un proyecto todos sus integrantes (lider y colaboradores) y las autoridades; al repositorio institucional, solo `admin` y `coordinator`. Editan metadatos y permisos o eliminan: quien lo subio, el lider del proyecto y las autoridades, siempre que puedan verlo (el lider no gestiona el documento privado de otra persona). Las personas autorizadas a un privado lo ven y descargan, pero no lo gestionan ni ven a quien mas se autorizo. Un documento restringido institucional lo ven solo las autoridades (el "proceso asociado" es la coordinacion). Sin acceso se responde 404 en metadatos y descarga.
- **Valores por defecto:** acceso `restricted` en proyectos y `general` en el repositorio institucional; categoria `other`; titulo tomado del nombre del archivo.
- **Validacion (F3-07):** extension permitida y firma del contenido sin dependencias nuevas (PDF, PNG, JPEG, WebP; DOCX/XLSX/PPTX leyendo el directorio central del ZIP y exigiendo su parte principal); se rechazan documentos de Office con macros (`vbaProject.bin`). El nombre original se sanea y solo se usa para mostrar y para `Content-Disposition`; el archivo se guarda con un UUID aleatorio. Se guarda el SHA-256.
- **Descarga:** solo por `GET /documents/:id/download`, como adjunto, con `nosniff`, `Content-Security-Policy: sandbox` y `no-store`. Se responde con Express directamente porque `StreamableFile` no se reconoce entre las copias ESM y CommonJS de Nest 12 (se serializaba como JSON; detectado por las pruebas).
- **Nombres con tildes:** multer interpreta el nombre como latin1 por defecto; se configura `defParamCharset: "utf8"` (detectado por las pruebas).
- **Proxy de Next.js:** el `rewrite` de `/api/v1` corta los cuerpos a 10 MB; se fija `experimental.proxyClientMaxBodySize: "21mb"` (20 MiB mas la envoltura multipart). Detectado por la prueba E2E a traves del proxy.
- **Resultados:** un documento de proyecto puede vincularse a un resultado del mismo proyecto (clave compuesta en la base de datos). Al eliminar el resultado, sus documentos siguen en el proyecto sin el vinculo. La pestana de investigacion enlaza los documentos de cada resultado.
- **Eliminacion:** borra metadatos y archivo (el archivo despues de confirmar la transaccion; si fallara, queda un archivo inaccesible y se registra). Proyectos finalizados: documentos en solo lectura, descarga permitida.
- **No incluido:** auditoria de cada descarga, versiones de un mismo documento, vista previa en el navegador y documentos de actividades (Fase 4).
- **Prueba E2E:** el frontend se compila en `frontend/.next/e2e` (`NEXT_DIST_DIR`) con el proxy hacia la API temporal; `tsconfig.json` incluye de forma permanente esa ruta de tipos para que Next.js no lo reescriba. Antes de este cambio, una peticion de la prueba (la carga de 19 MiB) llego al backend de desarrollo del responsable en el puerto 4000, que la rechazo con 403 por el origen sin procesar el archivo.
- **Aprobacion del responsable:** confirmada en DEC-031.

### DEC-031 - Aprobacion de I-15 y autorizacion de I-16

- **Fecha:** 2026-10-18
- **Estado:** aprobado ("apruebo i 15, continuemos con i 16").
- **Decision:** el responsable aprueba I-15 (documentos) y sus decisiones de implementacion (DEC-030), y autoriza I-16: ejecutar las verificaciones acumuladas de cierre de la Fase 3 y registrar evidencia y pendientes. No se autoriza la Fase 4 ni un despliegue.
- **Limites vigentes:** PostgreSQL sigue pausado. La comprobacion del criterio F3 de metadatos y relaciones en ambos motores queda pendiente mientras dure esa pausa; no se declara compatibilidad PostgreSQL ni cierre integral de la fase por esta autorizacion. Proveedor de almacenamiento privado y politica de conservacion deben resolverse antes de uso real.
- **Aprobacion de I-16:** pendiente del resultado tecnico y de revision del responsable.

### DEC-032 - Continuacion de I-16: seguridad y navegador

- **Fecha:** 2026-10-18
- **Estado:** ejecucion autorizada ("hazlo", tras recomendar revisar ESLint y probar interacciones en navegador manteniendo PostgreSQL pausado).
- **Alcance:** investigar las cinco alertas de desarrollo, preparar y ejecutar las pruebas de UI que permita el entorno local, y documentar resultados. No implica aceptar vulnerabilidades, aprobar I-16, levantar la pausa de PostgreSQL ni iniciar Fase 4.
- **Evidencia:** `docs/revision-i16.md`; no hay version corregida de `braces` en el registro consultado; el plugin estable mas reciente conserva la cadena. Control del navegador local no disponible; el navegador remoto no accede al localhost del equipo. Se prepara `npm run e2e -- --review` para revision aislada.
- **Pendiente:** prueba real de UI con controlador funcional y resolucion o decision explicita sobre la observacion de seguridad. No se declara cerrada la fase.

### DEC-033 - Autorizacion de I-17 con pendientes de I-16

- **Fecha:** 2026-10-18
- **Estado:** aprobado ("Si, iniciar I-17 con esos pendientes", respuesta al selector).
- **Decision:** se autoriza I-17, F4-01 a F4-04 (productos academicos, autorias internas/externas, asociaciones y reconocimientos), aun con los pendientes registrados de I-16. Prevalece esta instruccion sobre la puerta de entrada de Fase 4 del plan.
- **Limites:** I-16 no queda aprobada y la Fase 3 no se declara cerrada. No se acepta ni reclasifica la vulnerabilidad ESLint; las pruebas de UI siguen pendientes del navegador. PostgreSQL sigue pausado. Sin eventos (I-18), despliegues ni usuarios reales.
- **Estado de I-17:** implementada y verificada tecnicamente en SQLite; aprobacion del resultado pendiente (ver `context/tarea-actual.md`).

### DEC-034 - Implementacion de I-17 (produccion academica)

- **Fecha:** 2026-10-18
- **Estado:** aprobada por el responsable en DEC-039, con pendientes tecnicos informados.
- **Modelo:** `academic_products`, `product_authors`, `academic_product_results` y `recognitions`, por migracion `Academic1728790000000`. Producto institucional sin proyecto o con un proyecto y varios resultados de ese mismo proyecto; sin copiar datos del proyecto. La FK compuesta comprueba el vinculo tambien fuera de la API. No se implementa asociacion multiproyecto en esta iteracion.
- **Estados:** `in_progress`, `submitted`, `accepted`, `published`, `rejected`, a partir de la seccion 5.4 de requisitos. `published` se presenta como "Publicado / presentado". No se inventa un flujo de aprobacion editorial. Fechas de calendario validas, DOI `10.<registrante>/<identificador>` y URLs solo HTTP/HTTPS; sin consultas a servicios externos.
- **Permisos:** sin proyecto, administran `admin` y `coordinator`; los productos institucionales los consultan integrantes activos. En un proyecto, administran autoridades y lideres; consultan sus miembros y autoridades. Un rol institucional `teacher_leader` por si solo no concede acceso. Proyectos completados/cancelados conservan consulta, sin cambios. Los filtros de visibilidad se aplican antes de contar y paginar; ajenos reciben 404 en detalle y mutaciones de registros de proyecto.
- **Autorias:** al menos una y hasta 50, internas por UUID o externas por nombre, exclusivamente. El orden lo determina la lista; duplicados rechazados. Autores internos nuevos: activos y del equipo si hay proyecto. Se conservan los autores ya asociados al editar en el mismo proyecto, aunque hayan salido; no se crean cuentas externas ni se exponen correos. El historial por integrante muestra solo los productos que quien consulta puede ver; ser autor no concede acceso al proyecto si ya no pertenece a el.
- **Reconocimientos:** una persona, un proyecto o ambos; persona nueva activa y del equipo si hay proyecto. Personales sin proyecto: autoridades y destinatario consultan; solo autoridades gestionan. Con proyecto: tambien consulta el equipo; autoridades/lider gestionan. Si el destinatario no tiene acceso al proyecto, la respuesta personal oculta la referencia al proyecto.
- **Evidencia:** referencia opcional a un documento existente del mismo ambito. Se valida acceso con `DocumentsService`, que se exporta desde el modulo documental. La lectura vuelve a comprobar permisos: oculta referencia y titulo si no se puede ver. Eliminar un reconocimiento no elimina su archivo; eliminar el documento anula la referencia. Sin almacenamiento paralelo ni ampliacion de permisos documentales.
- **API:** `/academic-products` y `/recognitions`: GET paginado, POST, GET por UUID, PUT de reemplazo de campos editables y DELETE con auditoria transaccional. Autor de creacion, IDs y propiedades extra no se aceptan por asignacion masiva. CSRF, sesion y origen se mantienen en los controles existentes.
- **Interfaz:** `/hub/produccion`, `/hub/proyectos/[id]/produccion`, menu privado y pestana del proyecto; listados con filtros/paginacion, detalle/alta/edicion/eliminacion en modales existentes, autorias ordenables con botones y selectores shadcn. Enlaces de historial desde perfil e integrantes. Eventos y calendario quedan para I-18.
- **Limites:** SQLite; sin nuevas dependencias; PostgreSQL, navegador real y observacion ESLint mantienen sus pendientes. I-17 no queda aprobada por esta entrada.

### DEC-035 - Autorizacion de I-18 (eventos y actividades)

- **Fecha:** 2026-10-18
- **Estado:** autorizada ("continuemos", tras presentar I-18 como siguiente iteracion).
- **Decision:** ejecutar I-18, F4-05 a F4-08: eventos, participantes/asistencia, convocatorias informativas y vistas/calendario basico, reutilizando Gestion documental. Se registra autorizacion para continuar, sin atribuir aprobacion formal de I-17/DEC-034.
- **Limites:** mantienen su estado los pendientes de I-16, PostgreSQL y almacenamiento productivo. Sin notificaciones, sincronizaciones externas, postulaciones completas, certificados automaticos, despliegue ni datos personales reales. No se autoriza I-19 ni Fase 5.

### DEC-036 - Implementacion de I-18 (eventos, asistencia y calendario)

- **Fecha:** 2026-10-18
- **Estado:** aprobada por el responsable en DEC-039, con pendientes tecnicos informados.
- **Modelo:** `events`, `event_participants` y `event_documents`, mediante `Events1728800000000`. Actividades institucionales o de un proyecto; el proyecto no cambia una vez creada la actividad, para no trasladar inscripciones ni evidencias a otro ambito. Sin datos ni cuentas externas de asistentes.
- **Creacion y gestion:** solo `admin`/`coordinator` crean actividades institucionales; tambien crean actividades de proyecto los lideres que pueden gestionarlo. Organizador principal obligatorio, activo y del equipo si hay proyecto; queda inscrito una sola vez con rol `organizer`. Autoridades, organizador principal y lideres del proyecto gestionan metadatos, inscripciones y evidencias dentro de su acceso. Un rol institucional `teacher_leader` no concede acceso a un proyecto ajeno. Actividades institucionales consultables por integrantes activos; las de proyecto solo por equipo/autoridades. Visibilidad filtrada antes de contar/paginar; un ID ajeno devuelve 404.
- **Estados:** se crea `scheduled`; cambios manuales por endpoint explicito: `scheduled -> in_progress/cancelled`, `in_progress -> completed/cancelled`. Cancelar exige motivo y conserva participantes/evidencias. Finalizadas/canceladas no se reabren ni editan sus metadatos. Borrado solo de actividad programada con el organizador como unica inscripcion y sin evidencias; para las demas se usa cancelacion.
- **Participacion:** UUID de integrante activo, del equipo cuando hay proyecto; rol descriptivo `participant`, `speaker` u `organizer`, distinto de roles institucionales. Clave primaria evento+usuario evita duplicados. Se inscriben personas durante programacion/ejecucion; sin autoinscripcion libre ni gestion de invitados externos. Se retiran solo inscripciones sin asistencia confirmada, nunca al organizador principal sin cambiarlo antes. El historial ya registrado no se elimina por desactivar o retirar al integrante del proyecto.
- **Asistencia:** opcional, inicia en `registered`; `attended` y `absent` solo los confirman `admin`/`coordinator` durante/despues de una actividad, con actor/fecha y evento de auditoria. Organizador o lider sin esos roles no confirma asistencia. Finalizar no transforma inscripciones en asistencia. Se permiten correcciones auditadas tras finalizar; una actividad cancelada no admite registros.
- **Fechas y modalidades:** API exige ISO 8601 extendido con zona explicita, normaliza UTC con milisegundos y exige final posterior al inicio. Interfaz edita en Bogota, independientemente de la zona del equipo. Filtros calendario por fecha de Bogota y solapamiento de intervalos, incluyendo cruces de medianoche. Modalidad `onsite`, `online` o `hybrid`; ubicacion y/o enlace HTTP/HTTPS segun corresponda. No se crean temporizadores ni integraciones de calendario.
- **Convocatorias:** tipo `call`, con responsable interno, organizador externo opcional, apertura/cierre, requisitos y enlace externo de inscripcion. Solo informacion; sin postulaciones, avisos ni seguimiento de candidatos.
- **Documentos:** tabla de vinculos a documentos existentes del mismo ambito; no modifica permisos ni copia archivos. Se vuelve a comprobar acceso documental al vincular, listar y desvincular; titulos/IDs/totales de privados no autorizados no se revelan. Se permite agregar evidencia despues de finalizar; canceladas quedan en lectura. La UI reutiliza `DocumentForm` y los endpoints de Gestion documental para cargar y luego vincular. Un fallo del vinculo conserva el archivo en el repositorio y se informa. Desvincular no elimina el archivo; eliminar un documento elimina solo su relacion por FK.
- **Interfaz/API:** `/hub/actividades` y `/hub/proyectos/[id]/actividades`, menu y pestana; filtros por tipo/estado/proyecto, calendario mensual y agenda desde hoy. El calendario recorre todas las paginas autorizadas del mes; los detalles y formularios usan modales, con inscripciones paginadas y confirmaciones accesibles. REST `/events` con listado/alta/detalle/PUT/DELETE y subrutas de estado, participantes, asistencia y documentos. Se extrae `allItems` a una ayuda compartida para no importar formularios academicos desde actividades.
- **Limites:** sin nuevas dependencias; SQLite verificado, PostgreSQL pendiente. Navegador real, observacion ESLint y almacenamiento productivo conservan su estado. No se aprueba I-17, I-18 ni el cierre de ninguna fase mediante esta entrada.

### DEC-037 - Autorizacion de I-19 (verificacion de Fase 4)

- **Fecha:** 2026-10-18
- **Estado:** autorizada ("continuemos con i 19").
- **Decision:** ejecutar la verificacion acumulada de F4-01 a F4-08: relaciones, privacidad, fechas/filtros, migraciones, persistencia e integridad. Solo pruebas, revision y correcciones de defectos comprobados; sin funcionalidades nuevas.
- **Numeracion:** se mantiene la secuencia real I-17/I-18/I-19 para produccion, actividades y cierre; corresponde a I-13/I-14/I-15 del mapa original de `backlog-maestro.md`, desfasado tras las subdivisiones previas (DEC-026). No corresponde al bloque de indicadores del mapa original.
- **Limites:** no implica aprobacion formal de I-17/I-18 ni cierre integral de Fase 3 o 4. PostgreSQL sigue pausado; navegador, observacion ESLint y almacenamiento productivo mantienen sus pendientes. Sin Fase 5, despliegue, commit ni push.

### DEC-038 - Resultado de verificacion I-19

- **Fecha:** 2026-10-18
- **Estado:** aprobada por el responsable en DEC-039, sobre la verificacion SQLite y conservando sus limitaciones.
- **Evidencia:** `docs/revision-i19.md`, con matriz de criterios F4 y recorrido manual pendiente. `npm run check` salida 0 (72 pruebas frontend, 251 backend); `npm run e2e` salida 0 (98/98, trece migraciones ida/vuelta/ida, persistencia e integridad). Se agregaron 13 comprobaciones acumuladas, sin funcionalidades nuevas ni cambios de arquitectura/permisos.
- **Resultado:** productos con dos autores internos y autora externa consultables segun permiso; al retirar integrante se revoca acceso sin borrar autoria/asistencia; evidencias compartidas sin copias ni borrado por desvincular; fechas Bogota, estados y asistencia auditada comprobados.
- **Pendientes:** prueba de interaccion UI, PostgreSQL pausado, cinco alertas altas de desarrollo ESLint y almacenamiento/retencion productivos. Auditorias backend completa y frontend de produccion: cero vulnerabilidades. No se declara cierre integral de Fases 3/4 ni aprobacion de I-17/I-18/I-19. Fase 5 requiere nueva autorizacion.

### DEC-039 - Aprobacion de I-17/I-18/I-19 y autorizacion de Fase 5

- **Fecha:** 2026-10-18
- **Estado:** aprobado ("revisados y aprobados, continua con la fase 5, pero antes, dime que conlleva la fase 5").
- **Decision:** se aprueban I-17/DEC-034, I-18/DEC-036 e I-19/DEC-038 y se autoriza Fase 5. Se explico su alcance antes de comenzar: solicitudes, revisiones/estados, respuestas trazables, desvinculacion sin borrar historia, adjuntos reutilizados e interfaz; sin certificados automaticos.
- **Secuencia operativa:** I-20 F5-01 a F5-04 (modelo, API, tipos, estados, permisos); I-21 F5-05 a F5-07 (desvinculacion, adjuntos y UI); I-22 verificacion acumulada. Se habilita una iteracion a la vez, comenzando I-20. El mapa original I-16/I-17/I-18 del backlog se corresponde con I-20/I-21/I-22 en la numeracion real.
- **Limites:** aprobacion de los resultados SQLite con los pendientes ya informados; no se declara equivalencia PostgreSQL ni se resuelven por aprobacion las alertas ESLint, navegador o almacenamiento/retencion. Fase 3 conserva sus pendientes. Sin Fase 6, despliegue, commit ni push por esta instruccion.

### DEC-040 - Implementacion de I-20 (solicitudes administrativas)

- **Fecha:** 2026-10-18
- **Estado:** implementada y verificada tecnicamente en SQLite; aprobacion del resultado pendiente.
- **Modelo/API:** `administrative_requests` por migracion `AdministrativeRequests1728810000000`; REST `/administrative-requests`, detalle, historial paginado, responsable y cambio de estado. No duplica `membership_requests`. Cinco tipos: `certificate`, `data_change`, `withdrawal`, `responsibility_change`, `general`.
- **Ambito:** tramites institucionales, sin introducir ambitos de proyectos ni cargos. `mine` limita siempre al solicitante; `review` solo admin/coordinator, que atienden solicitudes institucionales ajenas. Permisos SQL antes de contar/paginar; ajenos reciben 404. La respuesta no expone correo ni credenciales de las personas relacionadas.
- **Revision:** responsable asignable solo si es autoridad activa y distinto del solicitante. Iniciar revision sin responsable asigna al actor; la asignacion organiza la bandeja y no concede exclusividad ni sustituye el permiso institucional. Otra autoridad puede tramitar una solicitud ajena. El solicitante, incluso admin/coordinator, no cambia estados ni asigna responsable en su propia solicitud. Restricciones SQL refuerzan la separacion de solicitante, revisor, decisor y ejecutor.
- **Estados:** `pending -> in_review -> approved/rejected`; `approved -> completed`. Rechazo/completada finales. Respuesta obligatoria para decidir o completar, con actor y fecha separados; auditoria transaccional conserva las respuestas anteriores al completar. No se borran ni se reabren solicitudes y no se modifica su contenido despues de registrarlas en este bloque.
- **Ejecucion:** aprobar no modifica cuentas, datos ni roles. Completar los tramites comunes registra su ejecucion manual mediante respuesta explicita, no genera documentos. La desvinculacion no se puede completar con el endpoint generico; I-21 implementara su procedimiento efectivo con responsabilidades pendientes y desactivacion segura. No se crea un simulacro de desactivacion.
- **Historial:** reutiliza `audit_events` con proyeccion de acciones del tramite, actor/nombre y detalles propios; consulta bajo el mismo permiso de solicitud. Sin historial paralelo ni ampliacion de acceso a la auditoria general.
- **Limites:** I-20 solo F5-01 a F5-04 y trazabilidad minima necesaria para verificar decisiones. F5-05 a F5-07 (salida, adjuntos e interfaz) siguen para I-21 dentro de Fase 5 autorizada; sin aprobacion ficticia de I-20 ni de toda Fase 5. Sin nuevas dependencias; PostgreSQL pausado.
- **Evidencia:** 12 pruebas HTTP nuevas; `npm run check` salida 0 (72 frontend + 263 backend) con limpieza explicita del watcher adicional del smoke; `npm run e2e` salida 0, 107/107, catorce migraciones ida/vuelta/ida, persistencia tras reinicio e integridad SQLite/archivos. Base local respaldada y una migracion aplicada sin alterar conteos previos. Detalles e incidencia de smoke en `context/tarea-actual.md`.

### DEC-041 - Continuacion de Fase 5: I-21

- **Fecha:** 2026-10-18
- **Estado:** ejecucion autorizada ("continua" y Fase 5 autorizada por DEC-039).
- **Alcance:** F5-05 a F5-07, desvinculacion efectiva sin borrar historia, auditoria/adjuntos privados mediante Gestion documental y pantallas. No implica aprobacion formal del resultado I-20.
- **Criterios de ejecucion:** completar salida solo con solicitud aprobada, autoridad distinta del solicitante y permiso vigente para administrar su cuenta; bloquear responsabilidades pendientes y exigir reasignarlas explicitamente con las funciones existentes. Conservar proyectos, tareas terminadas, autorias y asistencia; revocar sesiones al desactivar. Adjuntos visibles solo para solicitante y autoridades, incluidos metadatos/descarga; mismo almacenamiento/validacion documental, sin repositorio paralelo.
- **Limites:** PostgreSQL pausado; sin servicios externos, notificaciones, generacion automatica de certificados ni Fase 6. Los pendientes tecnicos anteriores se conservan.

### DEC-042 - Implementacion de I-21 (salida, adjuntos e interfaz)

- **Fecha:** 2026-10-18
- **Estado:** implementada y verificada tecnicamente en SQLite; aprobacion del resultado pendiente.
- **Salida:** endpoint especifico `/administrative-requests/:id/withdrawal`, solo solicitud `withdrawal` aprobada, confirmacion del UUID de solicitante y motivo. Conserva la decision original y registra actor/fecha de ejecucion. Se reutiliza la regla de desactivacion de integrantes (`deactivateAccount`, extraida y compartida), sin permitir autoejecucion, administrar pares desde coordinator ni dejar al sistema sin admin activo. Cierra sesiones en la misma transaccion que completa y audita el tramite; cuenta ya inactiva puede registrar salida si cumple las demas condiciones, sin reactivarla.
- **Responsabilidades:** vista previa paginada y nueva comprobacion dentro de la transaccion de ejecucion: liderazgos/tareas no terminadas de proyectos no finalizados, organizacion de actividades programadas/en curso y solicitudes pendientes/en revision asignadas. Se bloquea hasta reasignar explicitamente mediante las herramientas existentes o resolver/cancelar la responsabilidad cuando proceda; no se retiran tareas ni se trasladan cargos automaticamente. Proyectos, miembros, tareas terminadas, autorias, resultados y asistencia permanecen como historia. Los proyectos finalizados conservan sus responsables historicos.
- **Adjuntos (F5-06):** `administrative_request_documents`, un vinculo exclusivo por documento a una solicitud, sin almacenar archivos aparte ni modificar esquemas previos de documentos. Carga por Gestion documental, mismas firmas/formatos/limites y adaptador; metadatos institucionales privados, sin autorizaciones a terceros ni resultado/proyecto. La solicitud determina acceso efectivo (solicitante/autoridades), tambien en repositorio, detalle y descarga genericos. Ser quien subio el archivo como autoridad no concede acceso si pierde ese rol y la solicitud es ajena.
- **Cambios de adjuntos:** solicitante agrega durante pendiente/revision; autoridades ajenas tambien durante aprobada para aportar respuesta/certificado. Puede eliminar quien subio o una autoridad, dentro de esos estados. Completada/rechazada quedan en lectura. No se aceptan cambios genericos de metadatos/permisos ni compartir estos documentos: se elimina/adjunta correccion cuando el estado lo permita. La UI identifica el adjunto de tramite en el repositorio y enlaza a su solicitud. Eliminacion usa Gestion documental y deja auditoria de solicitud/documento, sin versiones paralelas. No se vinculan archivos preexistentes de otro ambito.
- **Interfaz (F5-07):** `/hub/tramites` con mis solicitudes, bandeja de revision, filtros y paginacion; `/hub/tramites/[id]` con respuesta, responsable, historial/adjuntos paginados y acciones por permisos. Formularios/confirmaciones usan modales existentes, selectores shadcn, tokens y ancho del HUB. Vinculaciones conserva `/hub/solicitudes`, identificado con esa etiqueta en el menu para distinguirlo. Nuevas pantallas servidor y acciones cliente con sesion/CSRF existentes, sin cache privada compartida.
- **Alcance:** implementa F5-05 a F5-07; historial reutiliza auditoria existente. Sin notificaciones ni generacion automatica de certificados, sin nuevas dependencias ni cambios de arquitectura de almacenamiento/autenticacion. Solo SQLite; I-22 corresponde a verificacion acumulada y no se aprueba mediante esta entrada.
- **Verificacion:** pruebas especificas 10/10, regresion documentos/integrantes 39/39; `npm run verify` final salida 0 (72 frontend + 273 backend, lint/build/typecheck y migraciones sin pendientes); tres health directos sobre servidores locales 200. `npm run e2e` salida 0, 119/119, quince migraciones ida/vuelta/ida, API/SSR, salida bloqueada/reasignada/ejecutada, adjuntos privados, persistencia tras reinicio e integridad SQLite/cinco archivos. Respaldo online local antes de aplicar una migracion y conteos previos conservados; pendientes navegador/PostgreSQL/ESLint/almacenamiento productivo sin cambios.

### DEC-043 - Continuacion con I-22: verificacion de Fase 5

- **Fecha:** 2026-10-18
- **Estado:** ejecucion autorizada ("continua con 9 22", entendido como I-22, el siguiente bloque presentado, dentro de Fase 5 autorizada por DEC-039).
- **Alcance:** verificacion acumulada de F5-01 a F5-07, relaciones/permisos, decisiones, adjuntos, desvinculacion e historia, migraciones e integridad SQLite. Solo revision y pruebas, con correcciones de defectos comprobados si aparecen; sin funcionalidades nuevas.
- **Limites:** no aprueba formalmente I-20/I-21 ni declara cierre integral de Fase 5. PostgreSQL sigue pausado; pendientes de UI real, ESLint y almacenamiento/retencion productivos conservados. No autoriza Fase 6, commit, push ni despliegue.

### DEC-044 - Aprobacion de I-20, I-21 e I-22

- **Fecha:** 2026-10-21
- **Estado:** aprobada por el responsable ("apruebo i 20, 21 y 22"), incluidas las reglas de implementacion de DEC-040 y DEC-042.
- **Solicitud asociada:** ejecutar la prueba de interaccion en navegador real pendiente de `docs/revision-i22.md`. Ejecutada el mismo dia en Chrome headless via DevTools Protocol sobre el entorno `--review`: 35/36; bloqueos de salida con enlaces no observables con las fixtures (sin responsabilidades abiertas), cubiertos por HTTP/E2E. Detalle en `docs/revision-i22.md`.
- **Limites:** no autoriza Fase 6, commit, push ni despliegue. PostgreSQL sigue pausado; ESLint y almacenamiento/retencion productivos conservan su estado.

### DEC-045 - Autorizacion de Fase 6 e iteracion I-23

- **Fecha:** 2026-10-21
- **Estado:** Fase 6 autorizada por el responsable ("autorizo empezar con la fase 6"). I-23 implementada y verificada tecnicamente en SQLite (2026-10-21); reglas de implementacion pendientes de revision del responsable.
- **Numeracion:** el backlog maestro asigna a F6 las iteraciones I-19/I-20/I-21, ya usadas en la ejecucion real. Por continuidad: I-23 = F6-01 a F6-04 (catalogo y paneles institucional, de proyecto y personal); I-24 = F6-05 a F6-08 (seguimiento cualitativo, reportes, exactitud y UI); I-25 = validacion de Fase 6, solo verificacion.
- **Reglas de implementacion de I-23 (propuestas por el agente, sujetas a revision):**
  - Catalogo en `docs/catalogo-indicadores.md`, escrito antes de implementar: definicion, fuente, filtros, fecha de corte, permiso y consulta de cada indicador.
  - Panel institucional solo para admin/coordinator (matriz v0.2: "Reportes institucionales: Coordinador y roles habilitados"; no se definen otros roles habilitados). Otras personas reciben 403 en API y 404 en la pagina.
  - Panel de proyecto con el mismo acceso que el proyecto (autoridad, lider o colaborador; sin acceso 404). Entregables = resultados investigativos y productos academicos vinculados al proyecto; no se crea una entidad nueva.
  - Panel personal solo con datos de la propia persona y filtrado por la visibilidad vigente antes de contar; sin rankings ni comparaciones entre personas.
  - Fecha de corte: momento de la consulta (se devuelve); dias calendario en America/Bogota. Sprints cerrados usan `sprint_closure_items`. Avance solo con total > 0; si no, "Sin tareas".
  - Sin migraciones, dependencias ni graficos (los graficos basicos corresponden a F6-08/I-24).
- **Conflicto registrado:** el criterio F6 "consultas agregadas y filtros funcionan en SQLite y PostgreSQL" no puede verificarse mientras PostgreSQL siga pausado (DEC-003). Se usaran consultas portables (QueryBuilder/SQL estandar) y la verificacion PostgreSQL quedara pendiente para I-25 o la reactivacion del motor; no se declara cumplido.
- **Limites:** no autoriza commit, push, despliegue ni datos reales. I-24 e I-25 se ejecutan tras I-23 dentro de esta autorizacion de fase, sin declararse aprobadas sin revision.

### DEC-046 - Continuacion con I-24 (seguimiento cualitativo, reportes, exactitud y UI)

- **Fecha:** 2026-10-21
- **Estado:** ejecucion autorizada ("continua con i 24", dentro de la Fase 6 autorizada en DEC-045). I-23 sin aprobacion formal atribuida. I-24 implementada y verificada tecnicamente en SQLite (2026-10-21); reglas pendientes de revision.
- **Ajuste durante la implementacion:** los `loading.tsx` de ruta iniciaban streaming y fijaban HTTP 200 antes de `notFound()` (documentacion de Next.js, "Status codes"), lo que el E2E detecto como perdida del 404 de I-23. Se retiraron; el permiso se comprueba antes de un `<Suspense>` interno que muestra la carga.
- **Reglas de implementacion (propuestas por el agente, sujetas a revision):**
  - **F6-05 observaciones:** tabla nueva `project_observations` (migracion versionada SQLite) con proyecto, autor, tipo (`progress` avance, `difficulty` dificultad, `result` resultado, `general` observacion) y texto. Registran lider del proyecto o autoridad mientras el proyecto sea editable; consultan quienes tienen acceso al proyecto. Sin edicion (se elimina y se registra de nuevo); elimina el autor si conserva permiso o una autoridad; alta y baja auditadas. Sin campo de persona evaluada, puntaje, ranking ni evaluacion automatica (evaluaciones nominales no aprobadas, plan F6-05 y documento completo 8.7).
  - **F6-06 reportes:** `/hub/reportes`, solo admin/coordinator, como el panel institucional. Tres reportes en pantalla: proyectos, produccion academica y actividades. Filtros: rango de fechas, tipo de proyecto/producto/actividad, estado y linea de investigacion (via `project_research_lines` del proyecto vinculado); paginacion de 20 (max. 100). Rango de fechas: proyectos cuyo periodo planificado se cruza con el rango (sin fecha de inicio se excluyen al filtrar por fechas); productos por `product_date` (sin fecha se excluyen al filtrar); actividades por dia de inicio en Bogota. Sin exportacion PDF/Excel (posterior).
  - **F6-07:** pruebas con fixture contada a mano para filtros, limites de fechas, paginacion, totales y permisos antes de agregar.
  - **F6-08:** graficos de barras horizontales propios (HTML/CSS con cifras en texto, sin dependencias), estados de carga (`loading.tsx`), error (`error.tsx`) y "Sin datos" en paneles y reportes.
- **Limites:** sin dependencias nuevas, PostgreSQL (migracion falla explicitamente en ese motor como las anteriores, DEC-003), commit, push ni despliegue. I-25 valida despues la fase.

### DEC-047 - Continuacion con I-25: validacion de Fase 6

- **Fecha:** 2026-10-22
- **Estado:** ejecucion autorizada ("continua con i 25", dentro de la Fase 6 autorizada en DEC-045). I-23/I-24 sin aprobacion formal atribuida.
- **Alcance:** verificacion acumulada de F6-01 a F6-08 contra los criterios de aceptacion F6: exactitud con fixtures, no inferencia de cifras privadas, terminadas sin duplicar por sprints, pantallas sin datos, permisos, migraciones e integridad SQLite y UI. Solo pruebas, revision y correccion de defectos comprobados; sin funcionalidades nuevas.
- **Limites:** el criterio "SQLite y PostgreSQL" queda bloqueado mientras PostgreSQL siga pausado (DEC-003/DEC-045); no se declara cierre integral de la Fase 6 ni aprobacion humana. Sin commit, push ni despliegue.
- **Resultado (2026-10-22):** ejecutada; sin defectos comprobados. Cuatro de cinco criterios F6 cumplidos en SQLite; PostgreSQL bloqueado. Evidencia en `docs/revision-i25.md`.

### DEC-048 - Aprobacion de I-23, I-24 e I-25

- **Fecha:** 2026-10-22
- **Estado:** aprobadas por el responsable ("apruebo las iteraciones, haz los commits"), incluidas las reglas de implementacion de DEC-045 y DEC-046.
- **Alcance de la aprobacion:** resultados de I-23/I-24/I-25 en SQLite. El criterio F6 de compatibilidad PostgreSQL sigue bloqueado (DEC-003); no se declara disponibilidad productiva.
- **Solicitud asociada:** registrar el trabajo en Git (commits locales en `dev`). No autoriza push, despliegue, reactivacion de PostgreSQL ni nueva fase.

## Referencias vigentes

- `AlfaCode_HUB_Diseno_Tecnico_Inicial_v0.2.md`
- `AlfaCode_HUB_Documento_Completo_v0.2.md`
- `plan-desarrollo.md`
- `backlog-maestro.md`
- `context/tarea-actual.md`

## Plantilla para nuevas decisiones

### DEC-XXX — [titulo corto]

- **Fecha:** [YYYY-MM-DD]
- **Estado:** propuesta | aprobada | rechazada | pendiente
- **Contexto/problema:** ...
- **Opciones analizadas:** ...
- **Decision:** ...
- **Justificacion:** ...
- **Archivos afectados:** ...
- **Aprobacion del responsable:** pendiente | confirmada (con referencia)

El agente puede registrar propuestas, pero no se atribuira autorizaciones que el responsable no haya concedido.
