# I-16: revision de seguridad e interaccion

Fecha: 2026-10-18. Continuacion autorizada por el responsable con "hazlo", en respuesta a revisar ESLint y probar la interfaz manteniendo PostgreSQL pausado.

## Seguridad de dependencias

- `npm --prefix frontend audit --json`: cinco alertas altas. Cadena: `eslint-config-next@16.4.0` -> `@next/eslint-plugin-next@16.4.0` -> `fast-glob@3.3.1` -> `micromatch@4.0.8` -> `braces@3.0.3`.
- Son una vulnerabilidad subyacente y cuatro propagaciones en dependientes, no cinco fallos independientes: [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). El aviso indica agotamiento de pila con patrones de llaves anidados y ninguna version corregida publicada.
- Consulta real del registro npm: `braces` latest = `3.0.3`; `@next/eslint-plugin-next` latest = `16.4.2`, que sigue dependiendo de `fast-glob@3.3.1`. Actualizar solo ese plugin a la version estable mas reciente no elimina esta cadena. No se instalaron versiones canary ni se degrado Next.js/ESLint.
- Codigo inspeccionado: `frontend/node_modules/@next/eslint-plugin-next/dist/utils/get-root-dirs.js`. La llamada a `globSync` ocurre cuando se configura `settings.next.rootDir` como cadena o lista; sin esa opcion usa `context.cwd`. `frontend/eslint.config.mjs` no declara esa opcion.
- `node scripts/review-eslint-security.mjs`: lint real mediante ESLint, 138 archivos, 0 errores, 0 advertencias y 0 llamadas a `fast-glob.globSync`. La instrumentacion solo cuenta llamadas; delega al metodo original y conserva las reglas. Este recorrido no demuestra ausencia de vulnerabilidad en otros usos o configuraciones.
- Se ensayaron muestras anidadas en procesos Node aislados: la primera fue rechazada por superar el limite de longitud; otra produjo resultados variables, y con 4999 niveles se observo `RangeError: Maximum call stack size exceeded`. No se usa esa reproduccion como prueba determinista ni se envia ningun patron al HUB.
- Conclusion: no se identifico entrada desde usuarios del HUB hacia esta ruta de lint. La vulnerabilidad de desarrollo sigue abierta con severidad alta; no se desactiva el audit, no se altera el lockfile ni se acepta el riesgo en nombre del responsable. Reevaluar cuando exista una correccion oficial o una sustitucion compatible revisada.

Comandos de consulta ejecutados: `npm --prefix frontend view braces version`, `npm --prefix frontend view braces dist-tags --json`, `npm --prefix frontend view @next/eslint-plugin-next dist-tags --json`, `npm --prefix frontend view @next/eslint-plugin-next@latest dependencies --json`, `npm --prefix frontend view eslint-config-next@16.4.0 dependencies --json`.

## Prueba de navegador: infraestructura

No se marca como realizada una prueba de interfaz por comprobar HTML con HTTP.

- Inventario del controlador local: ningun navegador disponible; abrir `iab` devuelve `Browser is not available: iab`.
- El componente Windows devuelve `Computer Use native pipe is unavailable` (error 2: archivo no encontrado).
- La segunda via de navegador indica que se ejecuta en un entorno remoto, cuyo `localhost` no es el equipo del proyecto. No permite comprobar la UI local. No se abrieron tuneles ni se publico el proyecto.
- El responsable pidio instrucciones para habilitar el controlador; se proporcionaron enlaces a las guias oficiales de Browser y configuracion de plugins. Esperar una conexion local funcional para ejecutar acciones.

## Entorno reproducible para revision de UI

Ejecutar desde la raiz:

```powershell
npm run e2e -- --review
```

El modo `--review` requiere una terminal interactiva (TTY), ejecuta primero las verificaciones acumuladas, mantiene la API y el frontend aislados en 4100/3100, imprime las rutas exactas del proyecto y de documentos de prueba y crea un PDF ficticio para el selector. Usa las cuentas E2E ya declaradas en `scripts/e2e.mjs`; no usar cuentas personales ni guardar claves en el navegador. Pulsar Enter en la terminal al terminar: el bloque `finally` detiene los procesos y elimina la base, el outbox y los archivos temporales. Tambien cierra automaticamente tras 15 minutos. No interrumpir el proceso a la fuerza si se quiere ejecutar esa limpieza.

Esta herramienta prepara el recorrido; no lo ejecuta ni valida por si sola. Cada fila sigue pendiente hasta observarla en navegador:

Incidencia de verificacion del modo: la primera ejecucion paso 65 comprobaciones, pero la sesion sin TTY no admitia Enter; se detuvieron los procesos de prueba. La eliminacion PowerShell de la carpeta ficticia `C:\Users\CRISTI~1\AppData\Local\Temp\alfacode-e2e-4duYnW` fue rechazada automaticamente por politica sin motivo adicional: queda esa carpeta fuera de Git, no una base real. Se agrego y comprobo rechazo temprano sin TTY, antes de crear el entorno.

Reejecucion con TTY: `npm run e2e -- --review` termino con salida 0 y 65/65 comprobaciones; se verifico el cierre por Enter, la eliminacion de su propia carpeta temporal y la liberacion de 3100/4100. Esta comprobacion valida el entorno de revision, no las acciones en navegador.

| Recorrido | Acciones y resultado esperado | Estado |
|---|---|---|
| Investigacion | Coordinacion: abrir modal de linea, editar con texto ficticio, guardar, recargar y comprobar persistencia | Pendiente |
| Selectores | Abrir selector de linea/resultado/categoria dentro del modal; flechas, Enter y Escape funcionan sin perder acceso al modal | Pendiente |
| Foco | Abrir con teclado, Tab/Shift+Tab dentro del dialogo, Escape cierra y devuelve foco al control que lo abrio | Pendiente |
| Resultados | Crear resultado ficticio, marcar participante, guardar y consultar el resultado asociado al proyecto | Pendiente |
| Archivos | Seleccionar el PDF ficticio de la ruta impresa, poner titulo, categoria y acceso restringido, cargar y comprobar listado | Pendiente |
| Privados | Estudiante crea privado y autoriza a la persona ajena ficticia; esa cuenta descarga; al retirar autorizacion obtiene 404. Coordinacion mantiene acceso por DEC-029 | Pendiente |
| Descarga | Descargar desde enlace de UI; comprobar archivo adjunto y contenido correspondiente al seleccionado | Pendiente |
| Errores | Intentar cargar sin archivo o con extension no admitida; mensaje comprensible y posibilidad de corregir | Pendiente |

El cierre integral de Fase 3 sigue sin aprobarse. Posteriormente DEC-033 autorizo I-17 (Fase 4: produccion academica) conservando estos pendientes; esa autorizacion no aprueba I-16 ni levanta la pausa de PostgreSQL. El almacenamiento productivo sigue pendiente.
