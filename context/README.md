# Contexto operativo del agente — AlfaCode HUB

Esta carpeta contiene guias de trabajo y estado operativo. No redefine requisitos funcionales ni decisiones de arquitectura. La documentacion que determina que construir esta en `/docs`.

## Archivos

| Archivo | Proposito | Quien lo actualiza |
|---|---|---|
| `instrucciones.md` | Procedimiento, limites y formato del reporte | Responsable; agente puede proponer cambios |
| `convenciones.md` | Resumen operativo de convenciones definidas en `/docs` | Responsable; agente actualiza cuando se autoriza alinear documentacion |
| `estado-actual.md` | Estado comprobado, bloqueos y proximo paso | Agente al cerrar una iteracion, sin atribuirse aprobacion humana |
| `tarea-actual.md` | Unica iteracion a ejecutar y criterios de salida | Responsable para activar/cambiar; agente reporta avance sin ampliar alcance |

## Fuente de verdad

- Plan y criterios: `../docs/plan-desarrollo.md`
- Diseno tecnico: `../docs/AlfaCode_HUB_Diseno_Tecnico_Inicial_v0.2.md`
- Concepto y requisitos: `../docs/AlfaCode_HUB_Documento_Completo_v0.2.md`
- Registro de decisiones: `../docs/decisiones.md`
- Backlog operativo: `../docs/backlog-maestro.md`

**Regla anti-duplicacion:** no copiar capitulos enteros desde `/docs` a `/context`; referenciar archivos y tareas por ruta o identificador.

## Punto de partida

Fase 5 autorizada por DEC-039, tras revision y aprobacion de I-17/I-18/I-19. Iteracion activa `I-21`: desvinculacion, adjuntos privados e interfaz (F5-05 a F5-07), por DEC-041. I-20 implementada/verificada, pendiente de aprobacion formal. I-22 corresponde despues a verificacion acumulada. Consultar `tarea-actual.md` y `estado-actual.md`. PostgreSQL, navegador, ESLint y almacenamiento productivo conservan sus pendientes.
