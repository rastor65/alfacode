# Catalogo de indicadores (F6-01)

Version I-23, 2026-10-21. Autorizacion: DEC-045. Fuente de definiciones minimas: `plan-desarrollo.md` (Fase 6) y documento completo v0.2 (seccion 8).

Este catalogo se escribe **antes** de implementar cada metrica. Cualquier indicador nuevo o cambio de formula se registra aqui primero.

## Reglas comunes

- **Fecha de corte:** el momento de la consulta. La API devuelve `cutoff` (ISO 8601, UTC). Las comparaciones por dia ("hoy", "vencida", "proximos 7 dias") usan el calendario de America/Bogota (UTC-5, sin horario de verano).
- **Permisos antes de agregar:** cada conteo se calcula sobre el conjunto de filas que la persona ya puede consultar en el modulo de origen. Nunca se calcula un total global y luego se oculta.
- **Sin evaluacion de personas:** ningun indicador ordena, puntua ni compara integrantes. El avance de tareas es una referencia operativa, no una medida de calidad ni del logro de objetivos.
- **Porcentajes:** solo cuando el denominador es mayor que cero; si no, la UI muestra "Sin tareas" (o "Sin datos"), nunca 0 % ni 100 %. Se redondean al entero mas cercano.
- **Estados mostrados con cero:** los agrupamientos por estado/tipo devuelven todas las categorias conocidas, incluidas las que valen cero, para no ocultar la ausencia de datos.
- **Motor:** consultas con QueryBuilder/SQL portable. Verificadas en SQLite; PostgreSQL pendiente (DEC-003/DEC-045).

## Panel institucional

**Permiso:** solo `admin` y `coordinator`. Otras personas: API 403, pagina 404. Al ser autoridades, su conjunto autorizado es toda la base.
**Endpoint:** `GET /api/v1/tracking/institutional`. **Pagina:** `/hub/seguimiento`.

| ID | Indicador | Definicion y consulta | Fuente |
|---|---|---|---|
| I-01 | Integrantes activos | `COUNT(*)` de `users` con `account_status = 'active'` (todas las cuentas activas, cualquier rol) | `users` |
| I-02 | Proyectos por estado | `COUNT(*)` de `projects` agrupado por `status` (propuesto, planificacion, activo, pausado, finalizado, cancelado) | `projects` |
| I-03 | Proyectos por tipo | `COUNT(*)` de `projects` agrupado por `type` | `projects` |
| I-04 | Actividades por estado | `COUNT(*)` de `events` agrupado por `status`. **Actividades realizadas** = `completed` | `events` |
| I-05 | Asistencias registradas | `COUNT(*)` de `event_participants` con `attendance = 'attended'`. Las inscripciones `registered` no cuentan como asistencia | `event_participants` |
| I-06 | Productos academicos por estado | `COUNT(*)` de `academic_products` agrupado por `status`. "Registrados" = total; "publicados" = solo `published`. No se equiparan | `academic_products` |
| I-07 | Tareas por estado | `COUNT(*)` de `tasks` agrupado por `status`. **Terminadas** = `done`; **pendientes** = total - terminadas. Cada tarea cuenta una vez (no se suman reasignaciones de sprint) | `tasks` |
| I-08 | Cumplimiento de tareas | `terminadas / total * 100` solo si total > 0; si no, "Sin tareas" | derivado de I-07 |

## Panel de proyecto

**Permiso:** mismo acceso que el proyecto (`authority`, `leader`, `collaborator`); sin acceso, 404 sin revelar existencia.
**Endpoint:** `GET /api/v1/tracking/projects/:id`. **Pagina:** `/hub/proyectos/[id]/seguimiento`.

| ID | Indicador | Definicion y consulta | Fuente |
|---|---|---|---|
| P-01 | Tareas por estado | `COUNT(*)` de `tasks` del proyecto agrupado por `status` | `tasks` |
| P-02 | Avance operativo | `done / total * 100` si total > 0; si no, "Sin tareas" | derivado de P-01 |
| P-03 | Tareas vencidas | `due_date < hoy` y `status <> 'done'` | `tasks` |
| P-04 | Vencen en 7 dias | `hoy <= due_date <= hoy + 7` y `status <> 'done'` | `tasks` |
| P-05 | Tareas sin responsable | `assignee_id IS NULL` y `status <> 'done'` | `tasks` |
| P-06 | Sprint activo | Solo proyectos agiles: sprint con `status = 'active'` (a lo sumo uno), fechas y tareas actuales del sprint por estado con su avance | `sprints`, `tasks` |
| P-07 | Ultimo sprint finalizado | Sprint `completed` con mayor `finished_at`; total y terminadas desde el snapshot `sprint_closure_items.status_at_close`, no desde el estado actual | `sprint_closure_items` |
| P-08 | Entregables | Resultados investigativos del proyecto (`research_results.project_id`) y productos academicos vinculados (`academic_products.project_id`) por estado | `research_results`, `academic_products` |
| P-09 | Actividades del proyecto | `events` con `project_id` del proyecto agrupado por `status` | `events` |
| P-10 | Equipo | Miembros actuales y cuantos son lideres | `project_members` |
| P-11 | Fechas | Inicio y fin planificados del proyecto (`start_date`, `end_date`), tal como se registraron | `projects` |

Los indicadores de actividad (P-01 a P-09) se presentan separados de cualquier evaluacion de calidad, que no existe en I-23 (seguimiento cualitativo: F6-05, I-24).

## Panel personal

**Permiso:** cada persona solo consulta sus propios datos (`/tracking/me`, sin parametro de usuario: no hay forma de pedir los de otra persona). Cada conteo se filtra ademas por la visibilidad vigente del modulo de origen.
**Endpoint:** `GET /api/v1/tracking/me`. **Pagina:** `/hub` (Panel).

| ID | Indicador | Definicion y consulta | Fuente |
|---|---|---|---|
| M-01 | Mis proyectos | Proyectos donde la persona es miembro actual, por estado del proyecto, y cuantos lidera. Lista breve (maximo 10, por nombre) con enlace | `project_members`, `projects` |
| M-02 | Mis tareas abiertas | `assignee_id = yo`, `status <> 'done'`, en proyectos a los que tengo acceso; cuantas vencidas (`due_date < hoy`). Lista breve (maximo 10, por fecha limite, sin fecha al final) | `tasks` |
| M-03 | Mis tareas terminadas | `assignee_id = yo`, `status = 'done'`, en proyectos a los que tengo acceso | `tasks` |
| M-04 | Mis asistencias | `event_participants` propios con `attendance = 'attended'` en actividades visibles (institucionales o de proyectos con acceso) | `event_participants`, `events` |
| M-05 | Proximas actividades | Inscripciones propias en actividades `scheduled` con inicio posterior al corte, visibles; maximo 5, por fecha | `event_participants`, `events` |
| M-06 | Mis productos | Productos donde soy autor interno (`product_authors.user_id`) y visibles (sin proyecto o de proyecto con acceso), por estado | `product_authors`, `academic_products` |

"Acceso a proyecto" = ser miembro actual, o ser autoridad (admin/coordinator). Una persona retirada de un proyecto deja de ver sus conteos en el panel, igual que deja de ver el proyecto; sus aportes no se borran.

### Ampliacion I-26 (DEC-049)

Campos adicionales de `GET /api/v1/tracking/me`; los anteriores no cambian.

| ID | Indicador | Definicion y consulta | Fuente |
|---|---|---|---|
| M-07 | Mis tareas por vencer | Mis tareas abiertas visibles (como M-02) con `hoy <= due_date <= hoy + 7` | `tasks` |
| M-08 | Mis tareas por estado | Mis tareas visibles (como M-02/M-03) agrupadas por `status`, todas las categorias | `tasks` |
| M-09 | Tarjeta de proyecto | Para cada proyecto de la lista M-01: tareas del proyecto por avance (P-01/P-02), vencidas (P-03), sin responsable (P-05), mis tareas abiertas en el proyecto y sprint activo (P-06) con su avance. Incluye los lideres del proyecto. La interfaz destaca vencidas y sin responsable en los proyectos que la persona lidera, y muestra el lider en los demas. Ser miembro ya da acceso a estas cifras en el panel del proyecto | `tasks`, `sprints`, `project_members` |
| M-05b | Proyecto de la actividad | M-05 incluye el nombre del proyecto de cada actividad (o nulo si es institucional) | `events`, `projects` |
| M-10 | Observaciones recientes | Las 5 observaciones (F6-05) mas recientes de los proyectos donde la persona es miembro actual; tipo, extracto, autor, proyecto y fecha | `project_observations` |

## Lista de proyectos (I-27)

**Permiso:** cada persona cuenta y ve los proyectos que ya puede consultar (autoridad: todos; resto: donde es miembro). **Endpoint:** `GET /api/v1/projects`. **Pagina:** `/hub/proyectos`.

| ID | Indicador | Definicion |
|---|---|---|
| L-01 | Por proyecto | Mismas cifras que G-01 a G-04 y M-09 del proyecto: avance, vencidas, sin responsable, mis tareas abiertas, sprint activo, tiempo transcurrido, ultima actividad y alertas. Las alertas solo existen en proyectos `active` |
| L-02 | Resumen | `summary`: total visible, proyectos por estado, con alertas y tareas terminadas/total del conjunto. **No cambia** con filtros ni pagina |
| L-03 | Filtros | `q` (nombre o nombre de un lider), `status`, `methodology`, `alerts=true` (al menos una alerta). Se aplican sobre el conjunto visible; `total` cuenta el resultado filtrado |
| L-04 | Orden | `sort`: `activity` (ultima actividad, mas reciente primero; por defecto), `name`, `progress` (mayor primero) y `end_date` (mas proxima primero). Los proyectos sin dato (sin tareas, sin fecha de fin o sin actividad) van al final; el desempate es el nombre |

### Ampliacion del panel de proyecto (I-27, pagina de resumen)

Campos adicionales de `GET /api/v1/tracking/projects/:id`; los anteriores no cambian. **Pagina:** `/hub/proyectos/[id]`.

| ID | Indicador | Definicion |
|---|---|---|
| P-12 | Senales del proyecto | `signals`: tiempo transcurrido (G-02), ultima actividad (G-03) y alertas (G-04, solo proyectos activos), igual que en la lista y los paneles |
| P-13 | Mis tareas abiertas | `myTasks`: total de mis tareas abiertas en el proyecto y las 5 de fecha limite mas proxima (sin fecha al final): titulo, estado, prioridad y fecha |
| P-14 | Dias del periodo | La interfaz calcula dias transcurridos y totales entre `startDate` y `endDate` respecto a `today` (acotado al periodo); sin ambas fechas, "Sin fechas" |

## Panel del semillero en `/hub` (I-26)

**Permiso:** solo `admin` y `coordinator` (API 403). **Endpoint:** `GET /api/v1/tracking/overview`. **Pagina:** `/hub`, junto con I-01 a I-08 y el panel personal de la autoridad ("Mi trabajo").

| ID | Indicador | Definicion y consulta | Fuente |
|---|---|---|---|
| G-01 | Proyectos en curso | Proyectos con estado `proposed`, `planning`, `active` o `paused` (los finalizados y cancelados se cuentan en I-02, no se listan). Orden: activos, pausados, en planificacion y propuestos; luego por nombre. Maximo 50, con el total. Por proyecto: estado ("fase"), metodologia, fechas, lideres, tareas terminadas/total y avance (P-01/P-02), vencidas (P-03), sprint activo (P-06), tiempo transcurrido y ultima actividad | `projects`, `project_members`, `tasks`, `sprints`, `project_observations` |
| G-02 | Tiempo transcurrido | `(hoy - start_date) / (end_date - start_date) * 100`, acotado entre 0 y 100. Sin ambas fechas o con `end_date <= start_date`: sin dato | `projects` |
| G-03 | Ultima actividad | El mas reciente entre `projects.updated_at`, `tasks.updated_at` del proyecto y `project_observations.created_at` del proyecto | `projects`, `tasks`, `project_observations` |
| G-04 | Alertas de riesgo | Solo proyectos `active` de G-01. **Tareas vencidas:** P-03 > 0. **Fecha de fin superada:** `end_date < hoy`. **Sin actividad reciente:** G-03 anterior al corte menos 14 dias (o sin registro). **Atraso:** con tareas y G-02 disponible, `G-02 - P-02 >= 25` puntos. Un proyecto esta en riesgo si tiene al menos una alerta. Son alertas operativas, no una evaluacion del equipo | derivado |
| G-05 | Pendientes de gestion | Solicitudes de ingreso `pending` (`membership_requests`) y tramites `pending` e `in_review` (`administrative_requests`) | `membership_requests`, `administrative_requests` |
| G-06 | Agenda | Las 5 actividades `scheduled` con inicio posterior al corte, de todo el semillero, por fecha; con su proyecto si lo tienen | `events` |
| G-07 | Actividad reciente | Las 5 observaciones mas recientes (como M-10, de todos los proyectos) y los 5 productos academicos registrados mas recientemente (titulo, estado, proyecto, fecha de registro) | `project_observations`, `academic_products` |

"Fase" de un proyecto = su estado actual mas, en proyectos agiles, el sprint activo; no existe un campo de fase propio (DEC-049).

## Observaciones de seguimiento (F6-05, I-24)

No son indicadores numericos: son registros cualitativos del proyecto. `GET/POST /api/v1/projects/:id/observations`, `DELETE /api/v1/projects/:id/observations/:observationId`.

- **Contenido:** tipo (avance, dificultad, resultado, observacion general), texto de 10 a 5000 caracteres, autor y fecha.
- **Permisos:** consultan quienes tienen acceso al proyecto; registran lider o autoridad con el proyecto editable; elimina el autor con permiso vigente o una autoridad. Auditoria de alta y baja.
- **Exclusiones:** no se refieren a una persona evaluada, no tienen puntaje ni se agregan en rankings o porcentajes.

## Reportes (F6-06, I-24)

**Permiso:** solo `admin` y `coordinator` (API 403, pagina 404). **Pagina:** `/hub/reportes?tipo=proyectos|produccion|actividades`.
Todos los reportes aplican los filtros antes de contar; los totales del resumen corresponden exactamente al conjunto filtrado, no a la pagina visible. Paginacion de 20 filas (maximo 100).

| ID | Reporte | Filtros y reglas | Filas y resumen |
|---|---|---|---|
| R-01 | Proyectos (`GET /tracking/reports/projects`) | `from`/`to`: periodo planificado que se cruza con el rango (`start_date <= to` y `end_date` nula o `>= from`; sin `start_date` se excluye al filtrar por fechas). `type`, `status`, `researchLineId` (linea vinculada al proyecto) | Por nombre: tipo, estado, metodologia, fechas, lineas, tareas terminadas/total y avance, productos, resultados y actividades. Resumen: total y proyectos por estado; tareas terminadas/total del conjunto |
| R-02 | Produccion academica (`GET /tracking/reports/products`) | `from`/`to` sobre `product_date` (sin fecha se excluye al filtrar). `type` (tipo de producto), `status`, `projectType`, `researchLineId` (lineas del proyecto vinculado; productos sin proyecto se excluyen al filtrar por linea o tipo de proyecto) | Por fecha descendente (sin fecha al final), titulo: tipo, estado, fecha, proyecto y numero de autores. Resumen: total, por estado y por tipo |
| R-03 | Actividades (`GET /tracking/reports/events`) | `from`/`to` por dia de inicio en Bogota. `type`, `status`, `researchLineId` (lineas del proyecto de la actividad; institucionales se excluyen al filtrar por linea) | Por inicio descendente: tipo, estado, inicio, proyecto, participantes y asistencias. Resumen: total, por estado y asistencias registradas (`attended`) |

Validaciones: fechas `YYYY-MM-DD` reales y `from <= to`; si no, 400.

## Fuera de I-24

Exportacion PDF/Excel (posterior), metas, tendencias, comparaciones entre periodos e indicadores configurables (documento completo 8.11).
