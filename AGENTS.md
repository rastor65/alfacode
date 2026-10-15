<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AlfaCode HUB — Guia para agentes de IA

> **Proyecto en desarrollo preliminar.** No es una propuesta institucional aprobada. No asumir que el repositorio ya tiene aplicaciones, configuraciones o pruebas implementadas: inspeccionarlo antes de actuar.

## Lectura obligatoria (en este orden)

1. `docs/plan-desarrollo.md`: fases, tareas, criterios de aceptacion y limites del alcance.
2. `docs/AlfaCode_HUB_Diseno_Tecnico_Inicial_v0.2.md`: arquitectura y decisiones tecnicas vigentes.
3. `docs/AlfaCode_HUB_Documento_Completo_v0.2.md`: concepto, modulos y requisitos preliminares.
4. `context/README.md`, `context/instrucciones.md`, `context/convenciones.md`.
5. `context/estado-actual.md` y `context/tarea-actual.md`: punto de continuidad y unica iteracion habilitada.
6. `docs/decisiones.md`: decisiones y conflictos pendientes.

Si falta uno de los documentos necesarios para una tarea, **no inventes su contenido**. Informa el bloqueo y pregunta o solicita el archivo.

## Jerarquia de decisiones

1. Instrucciones explicitas y actuales del responsable del proyecto.
2. El plan de ejecucion de `docs/plan-desarrollo.md`, para el alcance tecnico autorizado.
3. El diseño tecnico v0.2.
4. Los requisitos funcionales v0.2.
5. Los archivos de `/context`, que **solo explican como ejecutar y registrar el trabajo**, sin redefinir requisitos.

Si existe una contradiccion relevante, documentarla en `docs/decisiones.md` y pedir aclaracion antes de modificar la parte afectada. No decidir silenciosamente.

## Restricciones invariables del proyecto

- Frontend **Next.js + React + TypeScript**, conservando App Router, Tailwind CSS y Turbopack cuando ya existan.
- Backend **Node.js + NestJS**, API REST `/api/v1`, monolito modular.
- Acceso a datos **TypeORM**.
- Base de datos para **desarrollo local: SQLite**.
- Base de datos para **produccion futura en Railway: PostgreSQL**; actualmente pausada por decision del responsable hasta nueva autorizacion.
- **Migraciones versionadas** desde el inicio; `synchronize: false` en todos los entornos.
- Proyectos tradicionales **sin sprints**; proyectos agiles con **sprints opcionales**. Una tarea puede tener `sprint_id = null`.
- Autorizacion efectiva en backend; no confiar unicamente en controles visuales, rutas protegidas o componentes del frontend.
- No registrar credenciales, tokens, informacion personal real, archivos `.env` ni bases SQLite en Git.

## Modo de ejecucion

1. Inspecciona estructura existente, estado de Git, configuracion, dependencias instaladas y archivos antes de crear o modificar nada.
2. Implementa **unicamente** la iteracion habilitada en `context/tarea-actual.md`. No adelantes fases.
3. Realiza cambios pequeños y ejecuta realmente las pruebas pertinentes. Nunca inventes resultados.
4. No sobrescribas documentacion ni codigo previo; no ejecutes operaciones destructivas sin autorizacion.
5. No crees repositorios remotos, servicios Railway, despliegues publicos, cuentas reales ni recursos de pago sin autorizacion explicita.
6. Registra la evidencia en `context/estado-actual.md`. Si hay cambios arquitectonicos, propon una decision en `docs/decisiones.md` y espera confirmacion.
7. No marques una iteracion como **aprobada por el responsable** hasta que exista esa aprobacion. Puedes registrar que fue implementada y verificada tecnicamente.

## Formato de entrega al finalizar cada iteracion

- Identificador y resumen de tareas realizadas.
- Archivos creados/modificados.
- Comandos de instalacion, compilacion, pruebas y migraciones **realmente ejecutados**, con resultados.
- Criterios de aceptacion satisfechos, pendientes o bloqueados.
- Decisiones/riesgos y siguiente paso recomendado.

**Estado operativo actual:** Fase 0 e I-04 a I-12 aprobadas, junto con el registro con Hoja de Vida; I-13 (cierre de la Fase 2, solo SQLite por DEC-025) aprobada. Fase 3 autorizada por iteraciones (DEC-026): I-14 (investigacion) aprobada; I-15 (documentos) implementada y verificada tecnicamente, pendiente de aprobacion del responsable. Consultar `context/tarea-actual.md` antes de iniciar cualquier nueva iteracion.
