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
