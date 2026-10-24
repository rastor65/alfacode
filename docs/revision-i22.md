# I-22: verificacion acumulada de la Fase 5

Fecha: 2026-10-18. Autorizacion: DEC-039/043; "continua con 9 22", entendido como I-22 por la continuidad del plan.

## Alcance y estado

Revision de F5-01 a F5-07 implementadas en I-20/I-21. Solo pruebas y documentacion; sin funcionalidades nuevas, dependencias, migraciones ni cambios de arquitectura o permisos. Se conserva el trabajo anterior sin commit.

Resultados de la ejecucion actual al final. No constituye aprobacion humana de I-20/I-21/I-22 ni cierre integral de la Fase 5. PostgreSQL sigue pausado; la interaccion en navegador real permanece pendiente.

## Matriz de criterios de aceptacion F5

| Criterio del plan | Evidencia reproducible | Limite |
|---|---|---|
| Integrante registra solicitud y solo ve las propias | `administration.http.spec.ts`: cinco tipos, bandeja propia limitada incluso para autoridades, ajenos sin detalle/historial ni totales; rechazo de vinculacion duplicada. E2E: API y paginas SSR propias/revision, detalle ajeno 404 | Clics/formulario del navegador pendientes |
| Autoridad cambia estados validos con decision rastreable | HTTP: revision previa, respuesta obligatoria, responsable activo, rechazo/completada finales, actores/fechas y respuestas anteriores en historial. E2E I-22: decision original de salida y ejecucion separadas, unica constancia efectiva | Aprobar no aplica automaticamente datos/roles ni genera certificados |
| No se puede aprobar la propia peticion alterando HTTP | HTTP: incluso admin no tramita su propia solicitud, DTO rechaza propiedades protegidas y SQL separa solicitante/revisor/decisor/ejecutor. E2E I-22: autoridad solicitante recibe 403 al aprobarse y 400 al inyectar otro solicitante; solicitud permanece en revision | Permiso siempre comprobado en backend |
| Desvincular conserva historia investigativa y de proyectos | `administration-flows.http.spec.ts`: responsabilidades abiertas bloquean, comprobacion transaccional tras vista previa, permisos jerarquicos, ultimo admin y doble envio. E2E I-22: conserva autorias, membresia, participante de resultado investigativo, responsable de tarea terminada, asistencia/rol de actividad y soporte de salida; persistencia tras reiniciar | Se desactiva cuenta y revocan sesiones; no se borran aportes. Reasignacion explicita con herramientas existentes |
| Adjuntos privados no accesibles fuera del permiso de solicitud | HTTP: lista/detalle/descarga, compartir/publicar rechazado, autoridad que pierde rol pierde acceso a solicitud ajena aunque subiera archivo, estados finales en lectura. E2E: proxy, 404 ajeno, integridad binaria, relacion exclusiva de tramite, privacidad y ausencia de autorizaciones externas en las fixtures | Almacenamiento privado y retencion productivos pendientes; descarga por Gestion documental |

## Cobertura de tareas

- F5-01/F5-02: `administrative_requests` e historial reutilizado; tipos generales separados de `membership_requests`. Autoridades atienden tramites institucionales; no se inventan nuevos cargos.
- F5-03/F5-04: transiciones y autorizacion efectiva; sesion, CSRF, origen y DTO protegidos existentes. Listas filtran permisos antes de contar/paginar.
- F5-05: liderazgo/tareas de proyectos no finalizados, organizacion de actividades abiertas y revision de solicitudes abiertas impiden completar la salida mientras corresponda resolverlas/reasignarlas. El historial de proyectos finalizados se conserva.
- F5-06: adjuntos usan metadatos/almacenamiento/validacion de Gestion documental; acciones con actor/fecha en auditoria transaccional. Decision y ejecucion son hechos distintos.
- F5-07: `/hub/tramites` y `/hub/tramites/[id]`, mis solicitudes, revision, filtros/paginacion, adjuntos y respuestas/historial. Vinculaciones conserva `/hub/solicitudes`.

## Ampliacion de pruebas en I-22

`scripts/e2e.mjs` agrega comprobaciones acumuladas de autoaprobacion por HTTP y conservacion de resultados investigativos, tareas terminadas, asistencia, documentos e historial al desactivar una cuenta ficticia. Tras reiniciar comprueba esos registros y la revocacion de sesion. Seis cargas validas deben producir seis archivos con tamanos/SHA-256 correctos y sin relaciones huerfanas. Estas pruebas usan SQLite, outbox y archivos temporales en 4100/3100, sin modificar datos locales.

El modo `npm run e2e -- --review` imprime tambien rutas de tramites propios, revision, detalle y salida completada para revision humana. La generacion de rutas no verifica interacciones.

Incidencia del primer recorrido I-22: paso 117 comprobaciones y fallo la nueva expectativa del responsable de una tarea. El script leia `assigneeId`, pero el contrato real de consulta es `assignee.userId`. Se corrigieron las dos comprobaciones del script (inmediata y tras reinicio), sin alterar la API ni los datos de la aplicacion. La limpieza de esa ejecucion termino; se repitio el recorrido completo. El modo interactivo `--review` no se ejecuto en esta iteracion.

## Seguridad y pendientes heredados

- `npm --prefix backend audit --json`: salida 0, cero vulnerabilidades.
- `npm --prefix frontend audit --omit=dev --json`: salida 0, cero vulnerabilidades de produccion.
- `npm --prefix frontend audit --json`: salida 1, cinco alertas altas de desarrollo en la cadena ESLint ya documentada en `revision-i16.md`. No se modificaron dependencias/lockfiles ni se acepta el riesgo en nombre del responsable.
- PostgreSQL pausado: sin pruebas de equivalencia ni migraciones de ese motor. No se presenta SQLite como apto para produccion.
- Proveedor de almacenamiento privado y retencion deben resolverse antes de uso real. Sin despliegue ni usuarios reales.
- La ultima comprobacion del controlador local de navegador no fue funcional (I-16). Tras la aprobacion (DEC-044) se ejecuto el recorrido en Chrome real sin interfaz, controlado por DevTools Protocol; ver "Recorrido en navegador".

## Recorrido en navegador (2026-10-21, tras DEC-044)

Entorno `npm run e2e -- --review` (130/130 previas) en consola interactiva propia, 3100/4100, solo cuentas ficticias. Google Chrome instalado en modo headless, perfiles aislados por cuenta, eventos reales de raton/teclado (`Input.dispatchMouseEvent/KeyEvent`) y selector nativo de archivos (`DOM.setFileInputFiles`). Script temporal fuera del repositorio, sin dependencias nuevas. Resultado: 35/36; el unico fallo fue una premisa del script (ver Salida).

| Recorrido | Resultado esperado | Estado |
|---|---|---|
| Nueva solicitud | Elegir tipo, completar asunto/descripcion, enviar, abrir detalle y adjuntar un soporte | Verificado: modal con foco inicial, envio vacio bloqueado, selector de tipo con raton y teclado, registro y redireccion al detalle pendiente |
| Bandejas y filtros | Estudiante ve las propias; autoridad consulta revision y propias, filtros/paginacion conservan el contexto | Verificado: estudiante sin bandeja de revision; autoridad filtra por texto/estado, la URL conserva vista/q/estado y los campos tras recargar. Paginacion con mas de una pagina no ejercitada (pocos registros) |
| Revision | Asignar responsable, iniciar revision, aprobar/rechazar con respuesta; no aparecen acciones para autoaprobarse | Verificado: asignar responsable con selector del modal, iniciar revision, aprobar con respuesta obligatoria; decisor visible; sin acciones de decision en la peticion propia de la autoridad. Rechazar no se recorrio en UI (cubierto por HTTP) |
| Adjuntos | Selector de archivo, error por tipo/tamano, carga privada, descarga y eliminacion con confirmacion cuando el estado lo permite | Verificado: .exe rechazado con mensaje, PDF cargado, descarga 200 `%PDF` por solicitante y autoridad, eliminar con confirmacion; persona ajena no ve el tramite. Limite de tamano no recorrido en UI |
| Salida | Vista previa de bloqueos, enlaces a responsabilidades, reasignacion y nueva comprobacion; confirmacion antes de ejecutar | Parcial: aviso de que aprobar no desactiva, sin completar generico, vista previa, confirmacion obligatoria, ejecucion completada con decision/ejecucion y sesion revocada (vuelve a /ingresar). La lista de bloqueos con enlaces no se observo: las cuentas ficticias no tenian responsabilidades abiertas en ese momento (bloqueo cubierto por HTTP/E2E) |
| Historial y accesibilidad | Respuestas previas visibles, modales con teclado/foco/Escape, mensajes de error y vista movil sin controles ocultos | Verificado: historial con altas/eliminacion, Tab contenido en modal, Escape cierra y devuelve foco, selector se cierra con Escape sin cerrar el modal, 375px sin desplazamiento horizontal y modal alcanzable; sin excepciones JS en consola. Lector de pantalla y contraste no evaluados aqui |

## Comandos y resultados actuales

Ejecucion final 2026-10-21 sobre el arbol limpio en `dev` (commit `3fd833f`):

- `node --check scripts/e2e.mjs`: salida 0. `git diff --check`: salida 0.
- `npm run verify`: salida 0; lint frontend, 72/72 pruebas frontend, build frontend, typecheck backend, 273/273 pruebas backend (345 en total, 0 fallos/omitidas), build backend y `migration:show` "Pending migrations: false".
- `npm run e2e`: salida 0, 130/130 comprobaciones (11 adicionales de I-22 frente a las 119 de I-21); quince migraciones desde cero, reversion completa y reaplicacion en SQLite temporal; API/SSR en 4100/3100, persistencia tras reinicio e integridad SQLite/archivos. Puertos 3100/4100 liberados al terminar.
- Auditorias: backend salida 0 sin vulnerabilidades; frontend produccion salida 0 sin vulnerabilidades; frontend completo salida 1, cinco altas de desarrollo (cadena ESLint ya documentada), sin cambios de dependencias.
- Revision de codigo de `administration.service.ts`, `withdrawal.service.ts`, `deactivate-account.ts` y adjuntos en `documents.service.ts`: sin defectos comprobados. Estados de proyecto/tarea/actividad usados en la consulta de responsabilidades coinciden con los enumerados vigentes. Observacion no bloqueante: el candado contra doble ejecucion de salida es en memoria (un proceso) y se complementa con la actualizacion condicionada `status = approved`; en un despliegue con varias instancias debe revisarse.
- No se ejecuto `npm run check` (el smoke duplicaria los servidores del responsable), ni migraciones sobre la base local, instalaciones, commit, push o despliegue. El modo `--review` no se ejecuto.

Resultado: criterios de aceptacion F5 comprobados mediante pruebas HTTP y E2E API/SSR en SQLite. Pendientes: recorrido manual en navegador real (tabla anterior), PostgreSQL pausado, alertas ESLint de desarrollo y almacenamiento/retencion productivos. I-22 implementada y verificada tecnicamente. Posteriormente el responsable aprobo I-20/I-21/I-22 (DEC-044) y se ejecuto el recorrido en navegador descrito arriba. Observacion menor de UI: la paginacion muestra "1 registros" (plural fijo). No se declara cierre integral de la Fase 5 mientras PostgreSQL siga pausado.
