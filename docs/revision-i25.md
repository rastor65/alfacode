# I-25: validacion de la Fase 6

Fecha: 2026-10-22. Autorizacion: DEC-045/047; "continua con i 25".

## Alcance y estado

Verificacion acumulada de F6-01 a F6-08 implementadas en I-23 e I-24. Solo pruebas, revision de codigo y documentacion; sin funcionalidades nuevas, dependencias ni migraciones. No se encontraron defectos comprobados que requirieran correccion de codigo de la aplicacion.

No constituye aprobacion humana de I-23/I-24/I-25 ni cierre integral de la Fase 6: el criterio de compatibilidad PostgreSQL esta bloqueado mientras ese motor siga pausado (DEC-003).

## Matriz de criterios de aceptacion F6

| Criterio del plan | Evidencia reproducible | Estado |
|---|---|---|
| Indicadores coinciden con fixtures conocidas | `tracking.http.spec.ts` (panel institucional, proyecto, personal, sprint activo y snapshot) y `reports.http.spec.ts` (R-01..R-03) con datos contados a mano; E2E compara panel institucional y reporte de proyectos con conteos directos en SQLite | Cumplido en SQLite |
| Un usuario sin acceso no puede inferir cifras privadas por consulta global | Panel institucional y reportes solo admin/coordinator (403 API, 404 pagina, comprobado tambien con docente lider); panel de proyecto 404 sin acceso; panel personal sin parametro de usuario. I-25: insertar tarea, asistencia y producto de un proyecto ajeno asignados a la persona no cambia ninguna cifra de su panel, mientras la autoridad si ve el cambio | Cumplido en SQLite |
| "Terminadas" no suma tareas repetidas por reasignaciones de sprint | Conteos sobre `tasks` (una fila por tarea). I-25: con cuatro registros de cierre (una tarea en dos cierres y otra en cierre y sprint activo) el total y las terminadas igualan las filas de `tasks`; el ultimo sprint cerrado usa su propio snapshot | Cumplido en SQLite |
| Pantallas sin datos no muestran porcentajes enganosos ni errores | Avance `null` sin tareas ("Sin tareas"); pruebas unitarias de `progressLabel`. I-25 E2E: proyecto recien creado sin porcentajes, `NaN` ni `undefined`, con "Sin tareas", "Sin datos registrados." y "Aun no hay observaciones"; reporte sin resultados con aviso y pagina 200. Rango de fechas invertido muestra aviso | Cumplido |
| Consultas agregadas y filtros funcionan en SQLite y PostgreSQL | SQLite: todo lo anterior. Consultas escritas con QueryBuilder y SQL estandar (sin marcadores `?` ni funciones exclusivas de SQLite en los agregados). La migracion `ProjectObservations1728830000000` falla explicitamente en PostgreSQL, como las anteriores | **Bloqueado**: PostgreSQL pausado, sin prueba |

## Cobertura de tareas

- F6-01: `docs/catalogo-indicadores.md` define I-01..I-08, P-01..P-11, M-01..M-06, R-01..R-03 y las observaciones, con fuente, permiso, corte y consulta.
- F6-02/F6-03/F6-04: paneles institucional, de proyecto y personal (I-23).
- F6-05: observaciones sin persona evaluada, puntaje ni ranking; permisos de proyecto y auditoria (I-24).
- F6-06: reportes en pantalla con filtros y paginacion; exportacion PDF/Excel posterior por plan.
- F6-07: pruebas de exactitud y aislamiento (I-24 y ampliacion I-25).
- F6-08: barras accesibles con color validado por tema, estados de carga/error/vacio (I-24).

## Revision de codigo

Revisados `tracking.service.ts`, `reports.service.ts`, `observations.service.ts`, DTO y paginas. Parametros siempre enlazados; columnas de agrupacion fijas en codigo; permisos comprobados antes de consultar; los `<Suspense>` se abren despues de comprobar permisos para conservar el 404. Observaciones no bloqueantes:

- Observaciones registradas en el mismo segundo se ordenan de forma secundaria por id, no por orden exacto de registro.
- Un clic antes de terminar la hidratacion no abre el modal (comportamiento general de la carga transmitida); el siguiente clic funciona.
- Con colores forzados del sistema las barras pueden ocultarse; las cifras siempre estan en texto.

## Seguridad y pendientes heredados

- Auditorias: backend salida 0 sin vulnerabilidades; frontend produccion salida 0 sin vulnerabilidades; frontend completo cinco altas de desarrollo en la cadena ESLint (`@next/eslint-plugin-next`, `eslint-config-next`, `fast-glob`, `micromatch`, `braces`), ya documentadas en `revision-i16.md`. Sin cambios de dependencias.
- PostgreSQL pausado; almacenamiento y retencion productivos pendientes; sin despliegue ni usuarios reales.
- No se evaluo con lector de pantalla.

## Comandos y resultados

Ejecucion 2026-10-22 sobre el arbol de trabajo de `dev` (cambios de I-23/I-24/I-25 sin commit):

- Pruebas agregadas en I-25 (solo pruebas): dos casos en `tracking.http.spec.ts` (terminadas sin duplicar por cierres de sprint; no inferencia desde un proyecto ajeno) y dos comprobaciones E2E (proyecto sin datos; reporte sin resultados).
- `npx tsx --test src/modules/tracking/tracking.http.spec.ts`: 12/12.
- `npm run verify`: salida 0; lint, 74/74 frontend, build, typecheck, 297/297 backend (371 en total, 0 fallos), build y `migration:show` "Pending migrations: false".
- `npm run e2e`: salida 0, 143/143; dieciseis migraciones desde cero, reversion completa y reaplicacion en SQLite temporal; API y SSR en 4100/3100; persistencia tras reinicio; integridad SQLite/FK y archivos; panel institucional y reporte de proyectos iguales a conteos directos en SQLite.
- Chrome headless sobre `npm run e2e -- --review` (cuentas ficticias, script temporal fuera del repositorio): recorrido de paneles 17/17 (tres roles, escritorio y 375 px, 404 donde corresponde) y de reportes/observaciones 22/22 (filtros, colores por tema, tabla desplazable, modal con foco/Escape/validacion, registrar y eliminar, colaborador sin controles, sin excepciones JS).
- Auditorias: backend 0; frontend produccion 0; frontend completo 5 altas de desarrollo (ESLint), sin cambios.
- `node --check scripts/e2e.mjs` y `git diff --check`: salida 0.
- No se ejecutaron instalaciones, migraciones sobre la base local (ya aplicada en I-24 con respaldo), commit, push ni despliegue.

Resultado: cuatro de cinco criterios F6 cumplidos y verificados en SQLite; compatibilidad PostgreSQL bloqueada. Se solicita revision del responsable de I-23, I-24 e I-25 y decision sobre el cierre de la Fase 6 con esa limitacion.
