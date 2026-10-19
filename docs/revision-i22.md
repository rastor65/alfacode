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
- La ultima comprobacion del controlador local de navegador no fue funcional (I-16). En esta iteracion las verificaciones son API/SSR; no se declara prueba de clics, foco, selectores o selector nativo de archivos.

## Revision manual pendiente

Ejecutar `npm run e2e -- --review` en terminal interactiva y usar solo cuentas ficticias del script. Al finalizar pulsar Enter para detener procesos y limpiar el entorno temporal.

| Recorrido | Resultado esperado | Estado |
|---|---|---|
| Nueva solicitud | Elegir tipo, completar asunto/descripcion, enviar, abrir detalle y adjuntar un soporte | Pendiente |
| Bandejas y filtros | Estudiante ve las propias; autoridad consulta revision y propias, filtros/paginacion conservan el contexto | Pendiente |
| Revision | Asignar responsable, iniciar revision, aprobar/rechazar con respuesta; no aparecen acciones para autoaprobarse | Pendiente |
| Adjuntos | Selector de archivo, error por tipo/tamano, carga privada, descarga y eliminacion con confirmacion cuando el estado lo permite | Pendiente |
| Salida | Vista previa de bloqueos, enlaces a responsabilidades, reasignacion y nueva comprobacion; confirmacion antes de ejecutar | Pendiente |
| Historial y accesibilidad | Respuestas previas visibles, modales con teclado/foco/Escape, mensajes de error y vista movil sin controles ocultos | Pendiente |

## Comandos y resultados actuales

En curso; completar con la ejecucion real antes de entregar I-22.
