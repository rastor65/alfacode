# Instrucciones de ejecucion para el agente

## Antes de codificar

1. Lee `AGENTS.md` y los documentos en el orden indicado.
2. Confirma el ID de iteracion en `context/tarea-actual.md`.
3. Inspecciona archivos relevantes, estructura, dependencias instaladas, scripts disponibles y `git status`.
4. Identifica riesgos, cambios previstos y criterios de aceptacion.
5. Si la tarea esta marcada como **pendiente de autorizacion**, no alteres codigo hasta recibir la orden expresa de comenzar.

## Durante la implementacion

- Solo implementar tareas asignadas. No crear modulos futuros, dashboards ficticios ni pantallas que aparenten funcionalidades que no existen.
- No borrar ni sobreescribir contenido existente.
- Mantener separado el codigo de frontend, backend y documentacion.
- Respetar el frontend existente en Next.js/React; no instalar Angular ni crear un segundo frontend sin autorizacion explicita.
- Usar SQLite como base local. PostgreSQL/Railway queda pausado temporalmente hasta nueva autorizacion del responsable.
- Crear pruebas y ejecutar comandos que permitan verificar el incremento. No afirmar que una prueba paso si no se ejecuto.
- Si la ejecucion queda bloqueada, indicar que falta y como reproducir la verificacion pendiente.
- Consultar `docs/decisiones.md` antes de proponer nuevas dependencias, servicios o cambios de arquitectura.
- Proteger datos y secretos. Usar datos sinteticos para desarrollo y pruebas.

## Al finalizar

Informar: tareas y archivos modificados, comportamiento implementado, pruebas y resultados, riesgos y siguiente paso. Registrar resultados reales en `context/estado-actual.md`, sin marcar aprobaciones humanas ficticias.

## Cambios que requieren autorizacion previa

- Cambiar Next.js/React, NestJS, TypeORM, SQLite para desarrollo o PostgreSQL para produccion.
- Modificar alcance de fases, autenticacion, estrategia de roles/permisos o datos existentes.
- Desplegar en Railway, publicar servicios, crear cuentas, enviar comunicaciones, generar gastos o eliminar datos.
- Ejecutar comandos Git destructivos (`reset --hard`, `clean -fd`), sobrescribir archivos preexistentes o hacer `push` sin autorizacion.

Si el contexto operativo contradice `/docs`, detener solo el trabajo afectado, registrar el conflicto en `docs/decisiones.md` cuando aplique y solicitar resolucion.
