# I-19: verificacion de la Fase 4

Fecha: 2026-10-18. Autorizacion: "continuemos con i 19" (DEC-037).

**Revision posterior:** el responsable aprobo I-17/I-18/I-19 y autorizo Fase 5 en DEC-039. Se conservan las limitaciones tecnicas indicadas en este informe; la aprobacion no equivale a ejecutar PostgreSQL ni las interacciones pendientes.

## Alcance y estado

Revision de F4-01 a F4-08 implementadas en I-17 e I-18. Solo pruebas y documentacion; sin nuevas funcionalidades, dependencias, migraciones, despliegue ni cambios de permisos. Se conservan los cambios previos de I-18 que estaban sin commit al comenzar.

Verificacion automatizada satisfactoria en SQLite. No constituye aprobacion del responsable ni cierre integral de la Fase 4. PostgreSQL sigue pausado; no se han probado interacciones en navegador real.

## Matriz de aceptacion del plan

| Criterio F4 | Evidencia reproducible | Limite |
|---|---|---|
| Producto con multiples autores y un proyecto, consultable desde cada perfil autorizado | `academic.http.spec.ts`: autores ordenados, filtros por autor, visibilidad y FK de resultados. `scripts/e2e.mjs`, I-19: mismo producto en historial de dos autores internos, sin duplicar conteo; paginas SSR del historial; un ajeno no ve registros ni totales | Interaccion del enlace desde perfil pendiente de navegador |
| Autor externo sin cuenta | Prueba HTTP compara cantidad de usuarios antes/despues; E2E mantiene autora externa junto con autores internos | Sin integracion de identidades externas |
| Programar, completar y registrar asistencia sin duplicados | `events.http.spec.ts`: ciclo, clave primaria compuesta, duplicados 409, correcciones auditadas. E2E: finalizacion preserva asistencia y no convierte al organizador inscrito en asistente | Sin asistencia automatica ni certificados automaticos |
| Asistencia protegida en backend | HTTP/E2E: miembro recibe 403; ajeno y miembro retirado reciben 404; auditoria comprueba que solo la autoridad registro el cambio efectivo | Controles visuales aun pendientes de navegador |
| Evidencias y certificados en Gestion documental | HTTP: privacidad, ambito, desvinculacion y FK al borrar documento. E2E: reconocimiento y actividad comparten documento, desvincular conserva archivo y reconocimiento; cuatro archivos para cuatro cargas validas, tamanos y SHA-256 coincidentes | Proveedor privado y retencion productivos pendientes; sin generacion de certificados |
| Fechas y filtros equivalentes SQLite/PostgreSQL | HTTP y pruebas frontend: UTC/Bogota, zonas explicitas, fechas invalidas, solapamiento, medianoche y meses. E2E agrega filtro de dia y estado para actividad completada | Verificado solo SQLite; equivalencia PostgreSQL pendiente por pausa expresa |

## Comprobaciones adicionales

- Retirar a un autor/asistente del proyecto revoca inmediatamente API, totales y paginas SSR del proyecto. Coordinacion conserva autorias, asistencia y evidencia. Reincorporar recupera consulta sin recrear ni duplicar esos registros. Solo se altera la base ficticia y aislada del recorrido.
- Reabrir o borrar una actividad completada se rechaza; intentos denegados no producen cambios de asistencia auditados.
- Recorrido acumulado con migraciones desde vacio, reversion completa y reaplicacion; persistencia al reiniciar API; integridad fisica y claves foraneas SQLite.
- El modo de revision `npm run e2e -- --review` ahora imprime tambien las rutas de produccion y actividades del proyecto ficticio. Imprimirlas no verifica la interaccion.

## Seguridad y limites de entorno

- `npm --prefix backend audit --json`: salida 0, cero vulnerabilidades.
- `npm --prefix frontend audit --json`: salida 1, cinco alertas altas de desarrollo en la cadena ESLint documentada en `revision-i16.md`.
- `npm --prefix frontend audit --omit=dev --json`: salida 0, cero vulnerabilidades de produccion.
- No se aplico la degradacion mayor sugerida por audit; no se modificaron dependencias ni lockfiles. La observacion sigue abierta, sin aceptar el riesgo en nombre del responsable.
- El controlador local de navegador no estaba disponible en la ultima comprobacion de I-16. No se presenta HTTP/SSR como prueba de clics, foco o selectores.

## Revision manual pendiente

Ejecutar `npm run e2e -- --review` en terminal interactiva, con las cuentas ficticias del script. Cerrar con Enter para detener procesos y limpiar su entorno temporal.

| Recorrido | Resultado esperado | Estado |
|---|---|---|
| Producto | Crear/editar desde modal, ordenar autores internos/externos, seleccionar resultado, guardar y recargar; consultar desde historial autorizado | Pendiente |
| Reconocimiento | Seleccionar evidencia autorizada, consultar detalle, quitar referencia sin borrar archivo | Pendiente |
| Actividad | Crear con fechas Bogota, modalidad y organizador; verificar calendario/agenda y filtros | Pendiente |
| Participacion | Inscribir desde modal, observar rechazo de duplicado, iniciar/finalizar; autoridad marca asistencia, integrante carece de control editable | Pendiente |
| Evidencia | Cargar mediante selector, vincular, descargar y desvincular; conservar archivo en repositorio | Pendiente |
| Teclado y movil | Selectores con flechas/Enter/Escape, Tab contenido en dialogo, retorno de foco, errores legibles y calendario sin ocultar controles | Pendiente |

## Resultados de ejecucion

- `node --check scripts/e2e.mjs`: salida 0.
- `npm run check`: salida 0; lint, 72 pruebas frontend y 251 backend (323 en total), compilaciones, typecheck, migraciones sin pendientes y tres comprobaciones health. El smoke alcanzo los servidores locales existentes en 3000/4000; el intento de segundo `next dev` fue rechazado por Next.js. No se detuvieron los servidores del responsable.
- `npm run e2e`: salida 0, 98/98 comprobaciones (13 adicionales de I-19); trece migraciones desde cero, reversion completa y reaplicacion; API y paginas SSR en 4100/3100; persistencia tras reiniciar e integridad SQLite/documentos. Sin fallos en esta ejecucion.
- `git diff --check`: salida 0; advertencias de conversion LF/CRLF, sin errores de espacios.
- No se ejecutaron instalaciones ni migraciones contra la base local en I-19. Las reversiones E2E afectan exclusivamente la base temporal del script.

Resultado: criterios funcionales comprobados mediante API/SSR en SQLite; interaccion en navegador, PostgreSQL y observacion ESLint pendientes. Revisar los resultados de I-17/I-18/I-19 y decidir el cierre con estas limitaciones antes de habilitar Fase 5. No se registra aprobacion humana.
