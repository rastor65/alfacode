# AlfaCode HUB (SGPAI)

**Documento inicial de planificaciÃ³n y requerimientos**

**Sistema de GestiÃ³n de Proyectos y Actividades Investigativas**
**Semillero de InvestigaciÃ³n AlfaCode**

VersiÃ³n 0.2 Â· 11 de octubre de 2026
Estado: borrador conceptual para orientar el desarrollo. No constituye una propuesta institucional aprobada.

> **Nota de vigencia 2026-10-12:** el stack vigente del repositorio es Next.js/React, NestJS/Node, TypeORM y SQLite para desarrollo. PostgreSQL se conserva como objetivo futuro de produccion/Railway, pero esta pausado temporalmente hasta nueva autorizacion.

## PresentaciÃ³n

Este documento reÃºne la definiciÃ³n inicial de AlfaCode HUB, sus nueve mÃ³dulos funcionales y una ruta tentativa de desarrollo. EstÃ¡ pensado como una guÃ­a de trabajo flexible: describe quÃ© se espera del producto y quÃ© decisiones deberÃ¡n concretarse mientras se construye una primera versiÃ³n funcional.

AlfaCode HUB no se plantea Ãºnicamente como un gestor de proyectos, sino como una plataforma interna que conecta **personas, proyectos y resultados**. El portafolio pÃºblico de AlfaCode tendrÃ¡ una finalidad diferente: presentar el semillero y su trabajo al exterior.

**Ãndice general**

1. DescripciÃ³n general del sistema
2. GestiÃ³n de usuarios, roles y permisos
3. GestiÃ³n de proyectos
4. GestiÃ³n investigativa
5. ProducciÃ³n acadÃ©mica
6. GestiÃ³n de eventos y actividades
7. GestiÃ³n documental
8. Seguimiento y evaluaciÃ³n
9. GestiÃ³n administrativa
10. Reportes y estadÃ­sticas
11. Plan de desarrollo por fases

# 1. DescripciÃ³n general del sistema

## 1.1. IdentificaciÃ³n del proyecto

| Elemento | DefiniciÃ³n |
|---|---|
| Nombre del producto | AlfaCode HUB |
| Nombre tÃ©cnico | Sistema de GestiÃ³n de Proyectos y Actividades Investigativas |
| Siglas | SGPAI |
| OrganizaciÃ³n | Semillero de InvestigaciÃ³n AlfaCode |
| Tipo de sistema | Plataforma web de gestiÃ³n integral |
| Alcance inicial | Uso interno exclusivo de AlfaCode |
| Usuarios | Administradores, coordinadores, docentes, investigadores y estudiantes |
| Estado | Idea en planificaciÃ³n y desarrollo preliminar |

## 1.2. IntroducciÃ³n

AlfaCode HUB serÃ¡ una plataforma web orientada a centralizar y facilitar los procesos acadÃ©micos, investigativos, colaborativos y administrativos del Semillero de InvestigaciÃ³n AlfaCode. PermitirÃ¡ gestionar integrantes, proyectos, tareas, actividades, documentos, producciÃ³n acadÃ©mica y seguimiento institucional desde un mismo entorno.

A diferencia de un gestor de proyectos convencional, el sistema tambiÃ©n contemplarÃ¡ el historial de participaciÃ³n de los integrantes y la relaciÃ³n entre los proyectos desarrollados y sus resultados. La plataforma se organizarÃ¡ de forma modular para incorporar funcionalidades progresivamente.

## 1.3. Planteamiento del problema

La operaciÃ³n de un semillero implica coordinar personas, proyectos, reuniones, documentos, productos acadÃ©micos y procesos de organizaciÃ³n. Cuando la informaciÃ³n se encuentra distribuida en varias herramientas, puede resultar difÃ­cil consultar avances, conservar evidencias, conocer responsabilidades y consolidar indicadores.

AlfaCode HUB nace como una posible respuesta a esa necesidad de centralizaciÃ³n y trazabilidad. **Este planteamiento es una hipÃ³tesis de producto** y deberÃ¡ contrastarse con la forma en que AlfaCode opera actualmente.

## 1.4. Objetivo general

DiseÃ±ar y desarrollar una plataforma web integral que permita centralizar la gestiÃ³n de integrantes, proyectos, actividades investigativas, producciÃ³n acadÃ©mica, documentaciÃ³n y procesos internos de AlfaCode, facilitando la colaboraciÃ³n y el seguimiento de sus resultados.

## 1.5. Objetivos especÃ­ficos

1. Gestionar usuarios, roles, permisos y vinculaciones.
2. Facilitar la creaciÃ³n, planificaciÃ³n y seguimiento de proyectos de diferentes categorÃ­as.
3. Organizar lÃ­neas, metodologÃ­as y resultados de investigaciÃ³n.
4. Registrar la producciÃ³n acadÃ©mica y tecnolÃ³gica del semillero.
5. Gestionar eventos, reuniones, capacitaciones y convocatorias.
6. Centralizar documentos y evidencias.
7. Ofrecer seguimiento de actividades, proyectos e integrantes.
8. Apoyar procesos administrativos internos.
9. Presentar indicadores, estadÃ­sticas y reportes.
10. Establecer una base tecnolÃ³gica modular y mantenible.

## 1.6. Alcance funcional

El sistema comprenderÃ¡ nueve mÃ³dulos, desarrollados gradualmente.

| MÃ³dulo | Alcance resumido |
|---|---|
| GestiÃ³n de integrantes | Perfiles, roles, vinculaciones e historial de participaciÃ³n |
| GestiÃ³n de proyectos | Propuestas, equipos, tareas, cronogramas y entregables |
| GestiÃ³n investigativa | LÃ­neas de investigaciÃ³n, metodologÃ­as y resultados |
| ProducciÃ³n acadÃ©mica | ArtÃ­culos, ponencias, publicaciones y reconocimientos |
| Eventos y actividades | Reuniones, capacitaciones, convocatorias y asistencia |
| GestiÃ³n documental | Actas, informes, certificados y evidencias |
| Seguimiento y evaluaciÃ³n | Indicadores, avances, compromisos y evaluaciones |
| GestiÃ³n administrativa | Solicitudes, vinculaciones y procesos internos |
| Reportes y estadÃ­sticas | Paneles, consultas y reportes consolidados |

Se podrÃ¡n gestionar proyectos de investigaciÃ³n, desarrollo de software, innovaciÃ³n, extensiÃ³n, formaciÃ³n y otras iniciativas internas. Los datos de investigaciÃ³n serÃ¡n opcionales cuando la categorÃ­a del proyecto no los requiera.

## 1.7. Actores principales

- **Administrador:** administra la configuraciÃ³n, las cuentas y la seguridad operativa.
- **Coordinador:** supervisa y organiza los procesos del semillero.
- **Docente o lÃ­der:** orienta proyectos, equipos y actividades asignadas.
- **Investigador:** participa en investigaciones, proyectos y generaciÃ³n de resultados.
- **Estudiante:** colabora en proyectos y actividades conforme a sus asignaciones.

Los cargos reales de AlfaCode y los permisos concretos aÃºn deben validarse. Un rol institucional no serÃ¡ necesariamente igual al rol de una persona dentro de un proyecto.

## 1.8. Identidad y principios

**AlfaCode HUB â€” InvestigaciÃ³n, colaboraciÃ³n y gestiÃ³n en un solo lugar.**

Los tres pilares del producto serÃ¡n: **Personas** (integrantes y equipos), **Proyectos** (investigaciÃ³n y desarrollo) y **Resultados** (productos e impacto). Como principios de diseÃ±o se consideran la modularidad, trazabilidad, seguridad, facilidad de uso, mantenibilidad e integridad de la informaciÃ³n.

## 1.9. TecnologÃ­as preliminares

| Capa | TecnologÃ­a |
|---|---|
| Frontend | Next.js + React |
| Backend | Node.js; NestJS como framework propuesto |
| Lenguaje principal | TypeScript (propuesto) |
| Base de datos | PostgreSQL en producciÃ³n |
| Base de datos local | SQLite como alternativa de desarrollo |
| ComunicaciÃ³n | API REST |
| Despliegue | Railway |
| Versionamiento | Git y GitHub (propuestos) |

## 1.10. Exclusiones iniciales

Por el momento no se contemplan la gestiÃ³n de mÃºltiples organizaciones independientes, una aplicaciÃ³n mÃ³vil nativa, la sustituciÃ³n del portafolio pÃºblico, la contabilidad/nÃ³mina/facturaciÃ³n ni integraciones externas todavÃ­a no definidas. Estas exclusiones son tentativas.

## 1.11. Resultado esperado

La plataforma deberÃ¡ brindar un entorno Ãºnico en el que se relacionen personas, proyectos y resultados, con informaciÃ³n histÃ³rica consultable y funciones Ãºtiles para la operaciÃ³n diaria de AlfaCode. Su primera versiÃ³n serÃ¡ limitada y servirÃ¡ para validar la idea antes de una eventual presentaciÃ³n institucional.

# 2. GestiÃ³n de usuarios, roles y permisos

## 2.1. DescripciÃ³n

Este mÃ³dulo permitirÃ¡ administrar las cuentas de los integrantes, sus perfiles, sus roles institucionales y el acceso a las distintas funcionalidades. Se utilizarÃ¡ una estructura jerÃ¡rquica, sin impedir que una misma persona asuma responsabilidades diferentes en proyectos distintos.

## 2.2. Roles iniciales

| Rol | Responsabilidad principal |
|---|---|
| Administrador | ConfiguraciÃ³n general, cuentas, permisos y seguridad |
| Coordinador | GestiÃ³n institucional y supervisiÃ³n del semillero |
| Docente / LÃ­der | CoordinaciÃ³n de equipos, proyectos y actividades asignadas |
| Investigador | ParticipaciÃ³n en investigaciones y gestiÃ³n de aportes |
| Estudiante | ParticipaciÃ³n en proyectos y actividades asignadas |

Los roles representan una **propuesta**, no una estructura organizativa confirmada. Se separarÃ¡n los permisos institucionales de los permisos especÃ­ficos de cada proyecto: un estudiante podrÃ¡ liderar un proyecto sin convertirse en administrador del sistema.

## 2.3. Registro y acceso

Se contemplan dos mecanismos de registro:

1. **Registro con solicitud:** la persona diligencia un formulario; un usuario autorizado revisa la solicitud y aprueba o rechaza la vinculaciÃ³n.
2. **Registro por invitaciÃ³n:** una persona autorizada envÃ­a una invitaciÃ³n; el invitado completa su cuenta y recibe el rol asignado.

El sistema contarÃ¡ tambiÃ©n con inicio y cierre de sesiÃ³n, recuperaciÃ³n de contraseÃ±a y actualizaciÃ³n de perfil.

## 2.4. Permisos iniciales

| Funcionalidad | Acceso previsto |
|---|---|
| ConfiguraciÃ³n del sistema | Administrador |
| GestiÃ³n general de integrantes | Administrador y coordinador |
| AprobaciÃ³n de vinculaciones | Usuarios autorizados |
| CreaciÃ³n de proyectos | Coordinador y roles habilitados |
| DirecciÃ³n de proyectos | LÃ­deres asignados |
| GestiÃ³n de tareas | Participantes autorizados del proyecto |
| Consulta de informaciÃ³n | SegÃºn rol, propiedad y vinculaciÃ³n |
| Reportes institucionales | Coordinador y roles habilitados |

Los permisos definitivos deberÃ¡n implementarse en el backend, no solamente ocultarse en la interfaz.

## 2.5. Perfil del integrante

El perfil podrÃ¡ incluir nombre completo, correo, fotografÃ­a opcional, rol, programa acadÃ©mico o Ã¡rea, contacto, fecha y estado de vinculaciÃ³n, proyectos asociados e historial de participaciÃ³n. Se distinguirÃ¡n los datos personales de la informaciÃ³n institucional.

## 2.6. Estados de vinculaciÃ³n

- **Pendiente:** solicitud en revisiÃ³n.
- **Activo:** integrante actualmente vinculado.
- **Inactivo:** integrante sin participaciÃ³n activa.
- **Rechazado:** solicitud no aprobada.

El historial de contribuciones podrÃ¡ conservarse cuando una persona quede inactiva, sujeto a polÃ­ticas de privacidad y conservaciÃ³n de datos.

## 2.7. Funciones prioritarias

1. Registrar usuarios e iniciar sesiÃ³n.
2. Invitar personas y revisar solicitudes.
3. Asignar roles y administrar perfiles.
4. Listar integrantes y consultar informaciÃ³n autorizada.
5. Activar o desactivar cuentas.
6. Aplicar validaciÃ³n de permisos en las operaciones del sistema.

## 2.8. Pendientes

Validar cargos reales, responsables de aprobaciÃ³n, datos obligatorios, posibilidad de varios roles institucionales y permisos especÃ­ficos de cada mÃ³dulo.

# 3. GestiÃ³n de proyectos

## 3.1. DescripciÃ³n

Este mÃ³dulo permitirÃ¡ crear, organizar y supervisar proyectos desarrollados por AlfaCode. CentralizarÃ¡ responsables, equipos, tareas, avances, entregables y fechas relevantes. Cada proyecto podrÃ¡ gestionarse mediante tareas tradicionales o, de manera opcional, mediante sprints. No se limitarÃ¡ a la investigaciÃ³n.

## 3.2. Tipos de proyectos

| Tipo | DescripciÃ³n |
|---|---|
| InvestigaciÃ³n | GeneraciÃ³n de conocimiento y resultados investigativos |
| Desarrollo de software | Aplicaciones, sistemas y soluciones tecnolÃ³gicas |
| InnovaciÃ³n | Prototipos y nuevas soluciones |
| ExtensiÃ³n | Actividades y proyectos con la comunidad |
| Internos | Iniciativas de funcionamiento y organizaciÃ³n del semillero |
| Otros | CategorÃ­as adicionales definidas posteriormente |

## 3.3. InformaciÃ³n de cada proyecto

Cada proyecto podrÃ¡ registrar nombre, descripciÃ³n, tipo, objetivo general, objetivos especÃ­ficos opcionales, lÃ­der, integrantes, fecha de inicio, fecha estimada de cierre, estado y documentos relacionados. Se buscarÃ¡ un formulario de creaciÃ³n simple, con campos obligatorios mÃ­nimos.

## 3.4. Estados del proyecto

| Estado | Significado |
|---|---|
| Propuesta | Registrado y pendiente de revisiÃ³n, si se requiere aprobaciÃ³n |
| PlanificaciÃ³n | En preparaciÃ³n y organizaciÃ³n |
| En ejecuciÃ³n | Actualmente en desarrollo |
| Pausado | Temporalmente detenido |
| Finalizado | Actividades concluidas |
| Cancelado | Proyecto que no continuarÃ¡ |

Los cambios de estado dependerÃ¡n de los permisos asignados.

## 3.5. Equipos de trabajo

Cada proyecto podrÃ¡ incluir un lÃ­der y varios colaboradores. El lÃ­der coordinarÃ¡ tareas y seguimiento; los colaboradores participarÃ¡n en actividades y entregables. Una persona podrÃ¡ pertenecer a varios equipos y desempeÃ±ar diferentes responsabilidades.

## 3.6. Modalidades de trabajo

Cada proyecto podrÃ¡ elegir una modalidad de organizaciÃ³n sin afectar su tipo (investigaciÃ³n, desarrollo de software, innovaciÃ³n, etc.):

| Modalidad | Funcionamiento |
|---|---|
| Tradicional | Tareas, responsables, fechas y entregables, sin obligaciÃ³n de organizar sprints. |
| Ãgil con sprints | Tareas reunidas en un backlog y planificadas en ciclos de trabajo de duraciÃ³n definida. |

La modalidad serÃ¡ configurable por proyecto. Los sprints serÃ¡n opcionales; no se impondrÃ¡ Scrum como metodologÃ­a obligatoria al semillero.

## 3.7. GestiÃ³n de tareas

Las tareas podrÃ¡n tener tÃ­tulo, descripciÃ³n, responsable, fecha lÃ­mite, prioridad, estado y evidencias. Sus estados iniciales serÃ¡n **pendiente, en progreso, en revisiÃ³n y completada**. Se podrÃ¡n asignar a integrantes vinculados al proyecto. En proyectos Ã¡giles, una tarea podrÃ¡ permanecer en el backlog o asignarse a un sprint, sin duplicarla.

## 3.8. Backlog y gestiÃ³n de sprints

En los proyectos que activen la modalidad Ã¡gil se incorporarÃ¡ un **backlog**: lista de tareas que aÃºn no se han planificado en un sprint. Un sprint tendrÃ¡ nombre, objetivo, fecha de inicio, fecha de fin, estado y tareas asignadas. Su duraciÃ³n podrÃ¡ definirse segÃºn el equipo; como referencia, podrÃ­an utilizarse ciclos de una a cuatro semanas.

Los estados iniciales del sprint serÃ¡n **planificado, en curso, finalizado y cancelado**. Se propone permitir un solo sprint en curso a la vez por proyecto para simplificar el seguimiento inicial.

El flujo bÃ¡sico serÃ¡:

1. Registrar o priorizar tareas en el backlog.
2. Crear un sprint y seleccionar las tareas que se trabajarÃ¡n.
3. Iniciar el sprint y actualizar las tareas desde un tablero Kanban bÃ¡sico.
4. Consultar las tareas completadas y pendientes dentro del sprint.
5. Cerrar el sprint; las tareas no terminadas podrÃ¡n regresar al backlog o replanificarse en otro sprint, conservando su historial.

La gestiÃ³n de sprints se realizarÃ¡ por lÃ­deres o integrantes con permisos de planificaciÃ³n. Los demÃ¡s integrantes gestionarÃ¡n las tareas segÃºn sus autorizaciones.

## 3.9. Seguimiento de avances

Se consultarÃ¡n tareas terminadas y pendientes, actividades, entregables, fechas y estado del proyecto. En proyectos Ã¡giles tambiÃ©n se mostrarÃ¡ el avance del sprint activo y el historial de sprints. El porcentaje de tareas completas serÃ¡ un indicador operativo aproximado y no una mediciÃ³n automÃ¡tica de la calidad o cumplimiento de objetivos.

## 3.10. Entregables y resultados

Los entregables podrÃ¡n incluir informes, documentos, aplicaciones, prototipos, presentaciones y evidencias. Cada uno podrÃ¡ relacionarse con un proyecto, responsable, fecha y estado. Las publicaciones y resultados investigativos se conectarÃ¡n con sus mÃ³dulos especÃ­ficos.

## 3.11. RelaciÃ³n con otros mÃ³dulos

El mÃ³dulo se conectarÃ¡ con integrantes (equipos), investigaciÃ³n (lÃ­neas y hallazgos), producciÃ³n acadÃ©mica (productos), gestiÃ³n documental (archivos), seguimiento (avances y sprints, cuando existan) y reportes (estadÃ­sticas). La informaciÃ³n general de un proyecto se registrarÃ¡ una sola vez.

## 3.12. Funciones prioritarias

1. Crear, editar y consultar proyectos.
2. Asignar lÃ­deres e integrantes.
3. Cambiar estados del proyecto.
4. Crear, asignar y actualizar tareas.
5. Elegir por proyecto entre gestiÃ³n tradicional y gestiÃ³n Ã¡gil.
6. Crear y planificar sprints, con tareas tomadas del backlog.
7. Visualizar tareas en un tablero Kanban bÃ¡sico cuando se utilicen sprints.
8. Consultar el avance y cerrar los sprints, gestionando las tareas pendientes.
9. Registrar entregables bÃ¡sicos y consultar el avance general.

## 3.13. Funciones futuras

GrÃ¡ficos burndown, velocidad del equipo, retrospectivas, diagramas de Gantt, dependencias entre tareas, recordatorios, versiones de entregables, registros detallados e integraciÃ³n con repositorios de cÃ³digo.

## 3.14. Pendientes

Definir quiÃ©n crea o aprueba proyectos, si puede haber varios lÃ­deres, quÃ© campos serÃ¡n obligatorios, reglas de visibilidad y cÃ³mo se valorarÃ¡ el progreso real. Para los sprints, concretar quiÃ©n puede iniciarlos o cerrarlos, si se podrÃ¡ cambiar la modalidad de un proyecto en ejecuciÃ³n y quÃ© duraciÃ³n recomendarÃ¡ AlfaCode.

# 4. GestiÃ³n investigativa

## 4.1. DescripciÃ³n

La gestiÃ³n investigativa permitirÃ¡ organizar lÃ­neas de investigaciÃ³n, metodologÃ­as, avances acadÃ©micos y resultados cientÃ­ficos. SerÃ¡ complementaria a la gestiÃ³n operativa de proyectos: las tareas y los cronogramas permanecerÃ¡n en el mÃ³dulo de proyectos.

## 4.2. LÃ­neas de investigaciÃ³n

Cada lÃ­nea podrÃ¡ registrar nombre, descripciÃ³n, objetivos, responsable, estado (activa o inactiva) y proyectos asociados. Un proyecto podrÃ¡ vincularse con una o varias lÃ­neas cuando corresponda.

## 4.3. InformaciÃ³n especÃ­fica de investigaciÃ³n

| Elemento | InformaciÃ³n prevista |
|---|---|
| Problema de investigaciÃ³n | SituaciÃ³n o necesidad que se estudia |
| Pregunta de investigaciÃ³n | Interrogante central |
| JustificaciÃ³n | Razones y relevancia del estudio |
| Objetivos | PropÃ³sitos generales y especÃ­ficos |
| MetodologÃ­a | Enfoque, procedimientos e instrumentos |
| LÃ­nea de investigaciÃ³n | Ãrea temÃ¡tica del proyecto |
| Resultados | Hallazgos y aportes documentados |

Estos campos serÃ¡n opcionales para proyectos sin naturaleza investigativa. Los datos generales del proyecto no se duplicarÃ¡n.

## 4.4. MetodologÃ­as

Se podrÃ¡n registrar enfoque, tipo de investigaciÃ³n, tÃ©cnicas, instrumentos, procedimientos y observaciones. Inicialmente se priorizarÃ¡n campos descriptivos flexibles sobre formularios acadÃ©micos extensos.

## 4.5. Seguimiento investigativo

Los investigadores autorizados podrÃ¡n registrar avances metodolÃ³gicos, actividades, dificultades, observaciones, hallazgos preliminares y evidencias. Esta informaciÃ³n complementarÃ¡, pero no sustituirÃ¡, el seguimiento de tareas del proyecto.

## 4.6. Resultados investigativos

Cada resultado podrÃ¡ incluir tÃ­tulo, descripciÃ³n, proyecto, participantes, fecha y evidencias. Se podrÃ¡n clasificar como hallazgos, prototipos, aportes metodolÃ³gicos u otros. Si un resultado se transforma en una publicaciÃ³n, se vincularÃ¡ con ProducciÃ³n acadÃ©mica.

## 4.7. RelaciÃ³n con otros mÃ³dulos

Se integrarÃ¡ con proyectos, integrantes, producciÃ³n acadÃ©mica, documentos, seguimiento y reportes. Por ejemplo, un proyecto puede tener metodologÃ­a, producir un resultado y derivar un artÃ­culo sin repetir los datos de equipo y proyecto.

## 4.8. Funciones prioritarias

1. Administrar lÃ­neas de investigaciÃ³n.
2. Asociar lÃ­neas a proyectos.
3. Registrar informaciÃ³n metodolÃ³gica.
4. Documentar avances y resultados.
5. Relacionar evidencias y archivos.

## 4.9. Funciones futuras

Indicadores cientÃ­ficos especÃ­ficos, clasificaciÃ³n avanzada de productos, historial detallado, mapas de relaciones e integraciones con repositorios acadÃ©micos.

## 4.10. Pendientes

Confirmar lÃ­neas oficiales de AlfaCode, responsables de su administraciÃ³n, campos acadÃ©micos obligatorios, revisiÃ³n de resultados y visibilidad de la informaciÃ³n investigativa.

# 5. ProducciÃ³n acadÃ©mica

## 5.1. DescripciÃ³n

Este mÃ³dulo registrarÃ¡ los productos cientÃ­ficos, acadÃ©micos y tecnolÃ³gicos generados por el semillero y sus integrantes. PermitirÃ¡ consultar contribuciones, asociarlas con proyectos y mantener un historial de producciÃ³n.

## 5.2. Tipos de productos

| Tipo | Ejemplos |
|---|---|
| ArtÃ­culos cientÃ­ficos | ArtÃ­culos publicados o en preparaciÃ³n |
| Ponencias | Trabajos presentados en encuentros acadÃ©micos |
| PÃ³steres | Presentaciones visuales de investigaciÃ³n |
| CapÃ­tulos de libro | Contribuciones a libros acadÃ©micos |
| Libros | Obras acadÃ©micas y de investigaciÃ³n |
| Productos tecnolÃ³gicos | Software, prototipos y desarrollos |
| Otros | CategorÃ­as futuras |

## 5.3. Registro de productos

El formulario podrÃ¡ incluir tÃ­tulo, tipo, descripciÃ³n, autores, proyecto asociado, fecha de publicaciÃ³n o presentaciÃ³n, estado, revista o evento, enlace externo, DOI opcional y documentos de respaldo. Los campos variarÃ¡n segÃºn la categorÃ­a.

## 5.4. Estados

- **En elaboraciÃ³n:** producto en desarrollo.
- **Enviado:** presentado para evaluaciÃ³n.
- **Aceptado:** aprobado para publicaciÃ³n o presentaciÃ³n.
- **Publicado / Presentado:** divulgado oficialmente.
- **Rechazado:** no aceptado.

Los estados se adaptarÃ¡n a productos que no siguen un proceso editorial, como algunos desarrollos tecnolÃ³gicos.

## 5.5. Autores y participantes

Un producto podrÃ¡ tener varios autores internos y colaboradores externos que no cuenten con usuario. Los productos se mostrarÃ¡n en los perfiles de los integrantes relacionados y podrÃ¡n asociarse con uno o varios proyectos si se justifica.

## 5.6. Reconocimientos y participaciones

Se contempla registrar premios, distinciones, ponencias, concursos y reconocimientos vinculados con integrantes, proyectos o actividades. Si una participaciÃ³n corresponde a un evento registrado, se asociarÃ¡ al evento existente.

## 5.7. RelaciÃ³n con otros mÃ³dulos

El mÃ³dulo usarÃ¡ informaciÃ³n de integrantes, proyectos, resultados investigativos, eventos, documentos y reportes para mostrar el origen de cada producto y su contribuciÃ³n al semillero.

## 5.8. Funciones prioritarias

1. Registrar, consultar y editar productos.
2. Clasificar productos por tipo y estado.
3. Asociar autores y colaboradores.
4. Relacionar productos con proyectos.
5. Vincular archivos, enlaces y evidencias.
6. Consultar el historial de productos de un integrante.

## 5.9. Funciones futuras

ExportaciÃ³n bibliogrÃ¡fica, perfiles acadÃ©micos, integraciÃ³n con ORCID, validaciÃ³n institucional, estadÃ­sticas por perÃ­odo y visualizaciÃ³n de redes de colaboraciÃ³n.

## 5.10. Pendientes

Definir permisos de registro, mecanismos de validaciÃ³n, categorÃ­as oficiales, autores externos, visibilidad pÃºblica y tratamiento de reconocimientos.

# 6. GestiÃ³n de eventos y actividades

## 6.1. DescripciÃ³n

El mÃ³dulo de eventos y actividades permitirÃ¡ planificar, organizar y documentar reuniones, capacitaciones, convocatorias y eventos acadÃ©micos. TambiÃ©n permitirÃ¡ registrar la participaciÃ³n de los integrantes y consultar un calendario institucional.

## 6.2. Tipos de actividades

| Tipo | Ejemplos |
|---|---|
| Reuniones | CoordinaciÃ³n, planificaciÃ³n y seguimiento |
| Capacitaciones | Talleres, cursos y sesiones de formaciÃ³n |
| Eventos acadÃ©micos | Congresos, seminarios y conferencias |
| Convocatorias | Oportunidades de participaciÃ³n |
| Actividades internas | Jornadas de trabajo o integraciÃ³n |
| Otras | Actividades adicionales del semillero |

## 6.3. InformaciÃ³n de una actividad

Cada registro podrÃ¡ incluir tÃ­tulo, descripciÃ³n, tipo, fechas y horas de inicio y finalizaciÃ³n, lugar o enlace virtual, organizador, participantes, proyecto asociado, estado y documentos de apoyo.

## 6.4. Estados

- **Programada:** aÃºn no realizada.
- **En curso:** actualmente en desarrollo.
- **Finalizada:** completada.
- **Cancelada:** no se llevarÃ¡ a cabo.

Los estados se actualizarÃ¡n manualmente al inicio y podrÃ¡n automatizarse posteriormente cuando sea Ãºtil.

## 6.5. Participantes y asistencia

Se distinguirÃ¡n las condiciones de organizador, inscrito, asistente y ausente. El registro de asistencia serÃ¡ opcional. Se podrÃ¡ contemplar participaciÃ³n externa cuando la actividad lo requiera.

## 6.6. Calendario

El sistema mostrarÃ¡ prÃ³ximas actividades y permitirÃ¡ consultar su detalle y filtrar por fecha, categorÃ­a o proyecto. Los recordatorios y las sincronizaciones externas podrÃ¡n aÃ±adirse despuÃ©s.

## 6.7. Convocatorias

Una convocatoria podrÃ¡ registrar organizador externo, apertura, cierre, requisitos, enlace de inscripciÃ³n y estado. En la primera versiÃ³n se gestionarÃ¡ como informaciÃ³n consultable, sin incorporar todo el proceso de postulaciÃ³n.

## 6.8. Evidencias

Las actividades podrÃ¡n vincular actas, listas de asistencia, fotografÃ­as, presentaciones, certificados, informes y grabaciones. Los archivos se administrarÃ¡n mediante GestiÃ³n documental.

## 6.9. RelaciÃ³n con otros mÃ³dulos

Se conectarÃ¡ con integrantes (asistentes), proyectos (reuniones), investigaciÃ³n (actividades acadÃ©micas), producciÃ³n (ponencias), documentos (evidencias), seguimiento (participaciÃ³n) y reportes (estadÃ­sticas).

## 6.10. Funciones prioritarias

1. Crear, consultar, editar y cancelar actividades.
2. Clasificarlas y asignar organizadores.
3. Asociar participantes.
4. Registrar asistencia cuando aplique.
5. Consultar calendario y prÃ³ximas actividades.
6. Asociar proyectos y evidencias.

## 6.11. Funciones futuras

Notificaciones, inscripciÃ³n en lÃ­nea, confirmaciones, certificados automÃ¡ticos, cÃ³digos QR de asistencia, integraciÃ³n con calendarios y gestiÃ³n de postulaciones.

## 6.12. Pendientes

Precisar quiÃ©n crea actividades, si habrÃ¡ inscripciÃ³n libre, quiÃ©n registra asistencia, si existen eventos privados, manejo de invitados externos y estrategia de notificaciones.

# 7. GestiÃ³n documental

## 7.1. DescripciÃ³n

El mÃ³dulo documental serÃ¡ el repositorio interno de archivos de AlfaCode. PermitirÃ¡ cargar, organizar, consultar y descargar documentos autorizados, relacionÃ¡ndolos con proyectos, actividades, integrantes y otros procesos.

## 7.2. Tipos de documentos

| Tipo | Ejemplos |
|---|---|
| Actas | Registros de reuniones y decisiones |
| Informes | Avances, resultados y actividades |
| Certificados | Constancias y reconocimientos |
| Evidencias | FotografÃ­as, capturas y soportes |
| Documentos de proyecto | Propuestas, especificaciones y entregables |
| Documentos acadÃ©micos | ArtÃ­culos, presentaciones y materiales |
| Documentos administrativos | Solicitudes y formularios |
| Otros | Archivos adicionales |

## 7.3. Registro

Cada documento podrÃ¡ tener nombre, descripciÃ³n, categorÃ­a, archivo, fecha, usuario que lo carga, mÃ³dulo o entidad relacionada y nivel de acceso. Los metadatos se guardarÃ¡n en la base de datos y el archivo en un almacenamiento persistente apropiado.

## 7.4. OrganizaciÃ³n y consulta

Se permitirÃ¡ buscar por nombre, filtrar por categorÃ­a y consultar documentos vinculados a proyectos, actividades e integrantes. El enfoque inicial se basarÃ¡ en categorÃ­as y relaciones, sin exigir Ã¡rboles complejos de carpetas.

## 7.5. Niveles de acceso

| Nivel | Acceso previsto |
|---|---|
| General | Integrantes autorizados del semillero |
| Restringido | Miembros o responsables del proceso asociado |
| Privado | Propietario y usuarios expresamente autorizados |

Los controles se aplicarÃ¡n al consultar metadatos, visualizar y descargar archivos. Los permisos de administrador no deberÃ¡n implicar automÃ¡ticamente acceso irrestricto a documentos sensibles sin una regla justificada.

## 7.6. Documentos de proyectos

Se podrÃ¡n vincular propuestas, documentaciÃ³n tÃ©cnica, informes, entregables y evidencias con proyectos existentes. Un mismo registro de documento podrÃ¡ consultarse desde el repositorio y desde el proyecto, evitando copias duplicadas.

## 7.7. Documentos de actividades

Las actividades podrÃ¡n asociar actas, asistencias, presentaciones, fotografÃ­as y certificados. El mÃ³dulo de actividades mostrarÃ¡ vÃ­nculos al repositorio documental.

## 7.8. Almacenamiento

PostgreSQL almacenarÃ¡ metadatos, permisos y relaciones. Los contenidos binarios se guardarÃ¡n en almacenamiento persistente apropiado, con referencias desde la base de datos. Se validarÃ¡n extensiÃ³n real, tamaÃ±o y autorizaciÃ³n; las descargas deberÃ¡n utilizar mecanismos seguros. No se dependerÃ¡ del disco temporal de una instancia desplegada.

## 7.9. RelaciÃ³n con otros mÃ³dulos

EstarÃ¡ integrado con integrantes, proyectos, investigaciÃ³n, producciÃ³n acadÃ©mica, eventos, procesos administrativos y seguimiento. Su objetivo serÃ¡ ofrecer un servicio documental comÃºn y no varios sistemas independientes de archivos.

## 7.10. Funciones prioritarias

1. Cargar documentos y registrar metadatos.
2. Consultar y descargar segÃºn permisos.
3. Clasificar y buscar archivos.
4. Asociar documentos con proyectos y actividades.
5. Editar informaciÃ³n descriptiva.
6. Eliminar o desactivar registros con autorizaciÃ³n.

## 7.11. Funciones futuras

Versiones, carpetas personalizables, plantillas, actas/certificados generados, firma electrÃ³nica, vistas previas, auditorÃ­a detallada y bÃºsqueda en el contenido.

## 7.12. Pendientes

Elegir almacenamiento concreto, formatos y tamaÃ±os admitidos, reglas de carga/eliminaciÃ³n, tratamiento de informaciÃ³n sensible, retenciÃ³n y aprobaciÃ³n documental.

# 8. Seguimiento y evaluaciÃ³n

## 8.1. DescripciÃ³n

Este mÃ³dulo facilitarÃ¡ la consulta del avance de proyectos, compromisos y participaciÃ³n institucional. Se priorizarÃ¡ reutilizar los datos ya registrados, evitando pedir informes repetitivos a los integrantes.

## 8.2. Seguimiento de proyectos

Se podrÃ¡n visualizar estado, tareas completadas y pendientes, entregables, fechas, actividades y Ãºltimas actualizaciones. En proyectos Ã¡giles se consultarÃ¡ tambiÃ©n el avance del sprint activo. Un porcentaje de tareas terminadas podrÃ¡ usarse como referencia operativa, sin confundirlo con el logro real de objetivos.

## 8.3. Seguimiento de integrantes

| Indicador | DescripciÃ³n |
|---|---|
| Proyectos activos | Proyectos en que participa |
| Tareas asignadas | Responsabilidades actuales |
| Tareas completadas | Tareas marcadas como finalizadas |
| ParticipaciÃ³n en eventos | Actividades con asistencia registrada |
| Productos acadÃ©micos | Productos vinculados al integrante |
| Historial | ParticipaciÃ³n registrada a lo largo del tiempo |

Los datos se usarÃ¡n para acompaÃ±amiento y anÃ¡lisis contextual, no como una clasificaciÃ³n automÃ¡tica del desempeÃ±o personal.

## 8.4. Seguimiento de actividades

Se consultarÃ¡n actividades programadas, realizadas y canceladas, participantes, asistencia y evidencias. Esto permitirÃ¡ conocer el grado de participaciÃ³n en la operaciÃ³n del semillero.

## 8.5. Indicadores generales

| Indicador | DescripciÃ³n |
|---|---|
| Integrantes activos | Miembros actualmente vinculados |
| Proyectos activos | Proyectos en ejecuciÃ³n |
| Proyectos finalizados | Proyectos concluidos |
| Actividades realizadas | Eventos y reuniones finalizados |
| Productos registrados | ProducciÃ³n acadÃ©mica o tecnolÃ³gica |
| Cumplimiento de tareas | ProporciÃ³n de tareas completadas |

## 8.6. EvaluaciÃ³n de proyectos

Se contempla registrar observaciones sobre cumplimiento de objetivos, calidad de entregables, avances, dificultades y resultados. Inicialmente podrÃ¡n ser comentarios estructurados de un lÃ­der o coordinador; rÃºbricas avanzadas se dejarÃ¡n para despuÃ©s.

## 8.7. EvaluaciÃ³n de integrantes

En el futuro, responsables autorizados podrÃ¡n registrar observaciones sobre responsabilidades, colaboraciÃ³n y participaciÃ³n. Sus criterios y visibilidad deberÃ¡n definirse antes de implementarlas para evitar evaluaciones poco justas o divulgaciÃ³n indebida.

## 8.8. Paneles por rol

- **CoordinaciÃ³n:** estado del semillero, proyectos, actividades e indicadores generales.
- **Liderazgo de proyecto:** tareas, entregables y avance de su equipo.
- **Integrantes:** proyectos propios, tareas, prÃ³ximas actividades e historial.

## 8.9. RelaciÃ³n con otros mÃ³dulos

TomarÃ¡ informaciÃ³n de integrantes, proyectos, investigaciÃ³n, producciÃ³n acadÃ©mica, eventos, documentos y reportes. El mÃ³dulo de Reportes se encargarÃ¡ de la presentaciÃ³n consolidada e histÃ³rica de estadÃ­sticas, mientras Seguimiento atenderÃ¡ la operaciÃ³n cotidiana.

## 8.10. Funciones prioritarias

1. Consultar progreso de proyectos.
2. Mostrar tareas pendientes y completas.
3. Consultar participaciÃ³n registrada.
4. Mostrar indicadores bÃ¡sicos.
5. Resumir compromisos segÃºn el rol.

## 8.11. Funciones futuras

Evaluaciones periÃ³dicas, indicadores configurables, metas, alertas, comparaciones entre perÃ­odos, planes de mejora y tendencias de participaciÃ³n.

## 8.12. Pendientes

Seleccionar indicadores realmente Ãºtiles, responsables de evaluaciÃ³n, polÃ­ticas de privacidad, metas institucionales y mecanismos para validar los avances.

# 9. GestiÃ³n administrativa

## 9.1. DescripciÃ³n

Este mÃ³dulo agruparÃ¡ solicitudes y trÃ¡mites internos del semillero. La informaciÃ³n de cuentas y perfiles permanecerÃ¡ en GestiÃ³n de integrantes; aquÃ­ se administrarÃ¡n decisiones, aprobaciones y procesos.

## 9.2. Tipos de solicitudes

| Tipo | Finalidad |
|---|---|
| VinculaciÃ³n | Solicitar ingreso al semillero |
| DesvinculaciÃ³n | Finalizar la participaciÃ³n |
| ActualizaciÃ³n de informaciÃ³n | Modificar datos institucionales |
| Certificados | Solicitar constancias |
| Cambio de responsabilidad | Solicitar ajustes de rol o asignaciÃ³n |
| Solicitudes generales | Otras peticiones a coordinaciÃ³n |

## 9.3. Registro de solicitudes

Cada solicitud podrÃ¡ incluir tipo, asunto, descripciÃ³n, solicitante, fecha, estado, revisor, respuesta y archivos. El usuario podrÃ¡ consultar su historial y el estado del trÃ¡mite.

## 9.4. Estados

| Estado | DescripciÃ³n |
|---|---|
| Pendiente | Recibida, sin revisiÃ³n |
| En revisiÃ³n | Analizada por el responsable |
| Aprobada | Aceptada |
| Rechazada | No aprobada |

Se podrÃ¡ aÃ±adir **completada** cuando sea necesario separar una aprobaciÃ³n de la ejecuciÃ³n efectiva del trÃ¡mite.

## 9.5. VinculaciÃ³n

La persona registra su solicitud; un coordinador o usuario autorizado la revisa y toma una decisiÃ³n. Cuando se aprueba, el sistema podrÃ¡ habilitar la vinculaciÃ³n y los permisos correspondientes. TambiÃ©n habrÃ¡ invitaciones administrativas. Este proceso reutilizarÃ¡ el registro de usuarios del mÃ³dulo de Integrantes.

## 9.6. DesvinculaciÃ³n

Se registrarÃ¡n persona, fecha, motivo u observaciÃ³n, responsable y estado. La desvinculaciÃ³n no significarÃ¡ necesariamente borrar los aportes ya asociados a proyectos, productos o actividades; se deberÃ¡n aplicar las polÃ­ticas de privacidad y retenciÃ³n.

## 9.7. Responsabilidades administrativas

Se podrÃ¡n asociar responsables a actividades, procesos internos, equipos y solicitudes. Estas asignaciones serÃ¡n diferentes de los roles de autenticaciÃ³n y de las tareas de proyecto.

## 9.8. OrganizaciÃ³n interna

La coordinaciÃ³n podrÃ¡ consultar integrantes activos, roles institucionales, procesos asignados, solicitudes pendientes e historial de vinculaciones. La gestiÃ³n por perÃ­odos acadÃ©micos podrÃ¡ abordarse despuÃ©s.

## 9.9. RelaciÃ³n con otros mÃ³dulos

Se integrarÃ¡ con integrantes, proyectos, eventos, documentos, seguimiento y reportes. Una solicitud aprobada actualizarÃ¡ el dato pertinente sin generar registros paralelos contradictorios.

## 9.10. Funciones prioritarias

1. Registrar y consultar solicitudes.
2. Clasificarlas y asignar revisores.
3. Aprobar, rechazar y responder.
4. Consultar historial.
5. Gestionar vinculaciones y desvinculaciones.
6. Restringir operaciones por permisos y registrar responsables de las decisiones.

## 9.11. Funciones futuras

Flujos de aprobaciÃ³n de varias etapas, notificaciones, generaciÃ³n de constancias, perÃ­odos acadÃ©micos, plantillas y automatizaciÃ³n de asignaciones.

## 9.12. Pendientes

Determinar solicitudes realmente necesarias, responsables de aprobaciÃ³n, perÃ­odos de vinculaciÃ³n, modificaciones de roles y trÃ¡mites que requieran autorizaciÃ³n institucional.

# 10. Reportes y estadÃ­sticas

## 10.1. DescripciÃ³n

El mÃ³dulo reunirÃ¡ los datos generados por los demÃ¡s componentes para ofrecer resÃºmenes, filtros y reportes que ayuden a conocer la evoluciÃ³n del semillero. No serÃ¡ necesario implementar herramientas complejas de inteligencia de negocios para la primera versiÃ³n.

## 10.2. Panel general

MostrarÃ¡ de manera resumida integrantes activos, proyectos por estado, actividades, productos, tareas y participaciÃ³n, siempre conforme a los permisos del usuario.

## 10.3. EstadÃ­sticas de integrantes

| Indicador | DescripciÃ³n |
|---|---|
| Integrantes activos | Miembros con vinculaciÃ³n vigente |
| Integrantes inactivos | Miembros sin participaciÃ³n activa |
| Nuevas vinculaciones | Ingresos por perÃ­odo |
| ParticipaciÃ³n en proyectos | Integrantes vinculados a proyectos |
| ParticipaciÃ³n en eventos | Asistencias registradas |

## 10.4. EstadÃ­sticas de proyectos

Se podrÃ¡n consultar cantidad total, distribuciÃ³n por categorÃ­a y estado, proyectos iniciados o finalizados por perÃ­odo, integrantes por equipo y tareas pendientes/completadas. En proyectos Ã¡giles podrÃ¡n agregarse estadÃ­sticas bÃ¡sicas de sprints.

## 10.5. EstadÃ­sticas investigativas

Se contemplan proyectos por lÃ­nea de investigaciÃ³n, lÃ­neas activas, resultados registrados y proyectos con productos acadÃ©micos asociados.

## 10.6. ProducciÃ³n acadÃ©mica

| Indicador | DescripciÃ³n |
|---|---|
| Productos registrados | Total de productos |
| Productos por tipo | ArtÃ­culos, ponencias, software y otros |
| Productos por perÃ­odo | Registrados o publicados en un rango |
| Productos por proyecto | RelaciÃ³n entre producciÃ³n y proyectos |
| ParticipaciÃ³n de autores | Autores vinculados a los productos |

## 10.7. Eventos y actividades

Se podrÃ¡n analizar actividades programadas o realizadas, categorÃ­as, participantes, asistencia y distribuciÃ³n por perÃ­odo.

## 10.8. Reportes iniciales

- **Integrantes:** relaciÃ³n de miembros y participaciÃ³n general.
- **Proyectos:** responsables, estados y avances.
- **Actividades:** eventos y asistencia.
- **ProducciÃ³n acadÃ©mica:** productos de un perÃ­odo.
- **General del semillero:** principales indicadores institucionales.

Al inicio podrÃ¡n consultarse en pantalla; la exportaciÃ³n a PDF o Excel quedarÃ¡ como mejora posterior.

## 10.9. Filtros

Se proponen filtros por fecha, estado y tipo de proyecto, actividad, lÃ­nea de investigaciÃ³n y clase de producto acadÃ©mico. Cada secciÃ³n tendrÃ¡ Ãºnicamente los filtros que aporten valor.

## 10.10. VisualizaciÃ³n

El diseÃ±o inicial podrÃ¡ usar tarjetas numÃ©ricas, grÃ¡ficos de barras y circulares, tablas e indicadores de progreso. Se priorizarÃ¡ una visualizaciÃ³n clara, sin paneles saturados.

## 10.11. Permisos y privacidad

CoordinaciÃ³n consultarÃ¡ indicadores institucionales; lÃ­deres, informaciÃ³n de sus proyectos; integrantes, sus datos y participaciÃ³n autorizada. Los reportes no deberÃ¡n exponer documentos privados, datos personales restringidos ni evaluaciones confidenciales.

## 10.12. RelaciÃ³n con otros mÃ³dulos

UsarÃ¡ informaciÃ³n consolidada de integrantes, proyectos, investigaciÃ³n, producciÃ³n acadÃ©mica, eventos, gestiÃ³n documental, seguimiento y administraciÃ³n. No funcionarÃ¡ como fuente independiente de datos operativos.

## 10.13. Funciones prioritarias

1. Panel bÃ¡sico de indicadores.
2. EstadÃ­sticas de integrantes y proyectos.
3. Resumen de actividades y productos.
4. Filtros sencillos.
5. Consultas acordes con los permisos.

## 10.14. Funciones futuras

Exportaciones, comparaciones entre perÃ­odos, reportes personalizados, visualizaciones avanzadas, informes automÃ¡ticos, histÃ³ricos y anÃ¡lisis de tendencias.

## 10.15. Pendientes

Determinar indicadores prioritarios, usuarios de cada reporte, periodicidad, perÃ­odos acadÃ©micos, formatos de exportaciÃ³n y metas institucionales relevantes.

# 11. Plan de desarrollo por fases

## 11.1. Enfoque

AlfaCode HUB se desarrollarÃ¡ de manera incremental. Aunque los nueve mÃ³dulos estÃ¡n considerados, se implementarÃ¡n en etapas para poder probarlos y ajustarlos. Este plan es una guÃ­a flexible, sin fechas ni compromisos institucionales definitivos.

## 11.2. Stack tecnolÃ³gico

| Componente | SelecciÃ³n o propuesta |
|---|---|
| Frontend | Next.js + React |
| Backend | Node.js con NestJS (propuesto) |
| Lenguaje | TypeScript |
| Arquitectura | Monolito modular y API REST (propuesta) |
| Base de datos principal | PostgreSQL |
| Base de datos local alternativa | SQLite |
| Despliegue | Railway |
| Control de versiones | Git y GitHub (propuestos) |

Para minimizar diferencias entre ambientes, se recomienda probar tempranamente con PostgreSQL incluso si SQLite se usa en experimentos locales. La elecciÃ³n del ORM y la estrategia de migraciones quedan pendientes.

## 11.3. Fase 0: preparaciÃ³n del proyecto

**Objetivo:** crear la base tÃ©cnica de trabajo.

- Crear el repositorio y el archivo README.
- Configurar Next.js/React y NestJS.
- Definir carpetas y variables de entorno.
- Configurar la conexiÃ³n con PostgreSQL.
- Probar una solicitud de Next.js/React a la API y de la API a la base de datos.
- Preparar mecanismos bÃ¡sicos de pruebas y ejecuciÃ³n local.

**Resultado:** aplicaciÃ³n inicial conectada de extremo a extremo.

## 11.4. Fase 1: autenticaciÃ³n e integrantes

**Objetivo:** habilitar usuarios y permisos.

- Registro, inicio y cierre de sesiÃ³n.
- GestiÃ³n de perfiles.
- Roles y control de acceso desde el servidor.
- Solicitudes de vinculaciÃ³n y revisiÃ³n.
- Invitaciones administrativas.
- Lista de integrantes y activaciÃ³n/desactivaciÃ³n de cuentas.
- ProtecciÃ³n de contraseÃ±as, validaciÃ³n de entradas y manejo seguro de sesiones.

**Resultado:** cuentas funcionales y acceso controlado segÃºn responsabilidades.

## 11.5. Fase 2: proyectos, tareas y sprints

**Objetivo:** ofrecer la primera capacidad operativa principal, con metodologÃ­as de trabajo opcionales por proyecto.

- Crear, consultar y editar proyectos.
- Clasificarlos y gestionar estados.
- Designar lÃ­deres y participantes.
- Crear, asignar y actualizar tareas.
- Elegir entre organizaciÃ³n tradicional y Ã¡gil por proyecto.
- Implementar backlog, creaciÃ³n y planificaciÃ³n de sprints.
- Asignar tareas a sprints y visualizar un tablero Kanban bÃ¡sico.
- Iniciar y cerrar sprints; replanificar tareas sin terminar.
- Consultar avances, entregables y progreso del sprint activo, cuando aplique.

**Resultado:** primera versiÃ³n mÃ­nima utilizable (MVP) para gestionar proyectos y equipos, con sprints opcionales.

## 11.6. Fase 3: investigaciÃ³n y documentos

**Objetivo:** registrar contenido investigativo y evidencias.

- LÃ­neas de investigaciÃ³n y asociaciÃ³n a proyectos.
- InformaciÃ³n metodolÃ³gica y resultados.
- Carga, clasificaciÃ³n y consulta de archivos.
- AsociaciÃ³n de documentos con proyectos.
- Permisos documentales.

**Resultado:** proyectos con contenido investigativo y documentaciÃ³n centralizada.

## 11.7. Fase 4: producciÃ³n acadÃ©mica y eventos

**Objetivo:** registrar productos y actividades del semillero.

- Productos acadÃ©micos y tecnolÃ³gicos.
- Autores, reconocimientos y proyectos relacionados.
- Eventos, reuniones y calendario.
- Participantes, asistencia y evidencias.

**Resultado:** historial consultable de producciÃ³n y participaciÃ³n.

## 11.8. Fase 5: gestiÃ³n administrativa

**Objetivo:** habilitar trÃ¡mites internos.

- Solicitudes y revisiones.
- Aprobaciones y respuestas.
- Desvinculaciones e historial.
- Responsables de procesos.

**Resultado:** organizaciÃ³n de solicitudes internas, reutilizando el flujo de vinculaciÃ³n que ya exista desde la Fase 1.

## 11.9. Fase 6: seguimiento y reportes

**Objetivo:** consultar el estado de la operaciÃ³n y sus indicadores.

- Seguimiento de proyectos e integrantes.
- Panel general de indicadores.
- EstadÃ­sticas de tareas, actividades y productos.
- Filtros y reportes bÃ¡sicos.

**Resultado:** visiÃ³n consolidada del trabajo del semillero.

## 11.10. Primera versiÃ³n funcional

El **MVP** comprenderÃ¡ las fases 0, 1 y 2: aplicaciÃ³n conectada, cuentas y roles, gestiÃ³n bÃ¡sica de integrantes, creaciÃ³n de proyectos, equipos y tareas. Los proyectos podrÃ¡n trabajar de forma tradicional o mediante backlog y sprints bÃ¡sicos, con tablero Kanban y cierre de sprint. Se validarÃ¡ su utilidad antes de incorporar mÃ³dulos adicionales.

## 11.11. Arquitectura inicial

- **Next.js/React:** interfaces, rutas, formularios y visualizaciÃ³n.
- **NestJS:** API, reglas de negocio, validaciones, autenticaciÃ³n y permisos.
- **PostgreSQL:** persistencia de usuarios, proyectos, tareas, sprints opcionales y relaciones.

Se propone un monolito modular para reducir la complejidad de despliegue y mantenimiento. La estructura podrÃ¡ evolucionar conforme crezca el producto.

## 11.12. OrganizaciÃ³n de repositorio

```text
alfacode-hub/
â”œâ”€â”€ frontend/            # AplicaciÃ³n Next.js/React
â”œâ”€â”€ backend/             # API NestJS
â”œâ”€â”€ docs/                # DocumentaciÃ³n de trabajo
â”œâ”€â”€ README.md
â””â”€â”€ .gitignore
```

## 11.13. MÃ©todo de implementaciÃ³n

Para cada funcionalidad se definirÃ¡ su propÃ³sito, se identificarÃ¡n los datos, se implementarÃ¡ la lÃ³gica de backend, se desarrollarÃ¡ la interfaz y se comprobarÃ¡ su funcionamiento. Las iteraciones serÃ¡n pequeÃ±as y se probarÃ¡n antes de integrarse.

## 11.14. Pruebas y validaciÃ³n

Se verificarÃ¡n autenticaciÃ³n, autorizaciÃ³n, validaciÃ³n de formularios, integridad de datos, operaciones de la API y comunicaciÃ³n entre componentes. Se aÃ±adirÃ¡n pruebas automatizadas de forma progresiva.

## 11.15. Despliegue

Se propone Railway para alojar frontend, backend y PostgreSQL. PodrÃ¡n realizarse despliegues de prueba durante el desarrollo. Antes de un uso real deberÃ¡n revisarse variables de entorno, migraciones, respaldo de datos, control de acceso y tratamiento de archivos. Una prueba en lÃ­nea no equivale a una versiÃ³n lista para uso institucional.

## 11.16. Prioridades

| Prioridad | Elementos |
|---|---|
| Alta | Entorno tÃ©cnico, autenticaciÃ³n, roles, integrantes, proyectos, equipos, tareas y sprints bÃ¡sicos opcionales |
| Media | Panel inicial, seguimiento sencillo y primeros entregables |
| Posterior | Documentos, investigaciÃ³n, producciÃ³n, eventos, administraciÃ³n y estadÃ­sticas ampliadas |

## 11.17. Decisiones abiertas

Queda por concretar la jerarquÃ­a real de AlfaCode, la matriz de permisos, el ORM, las migraciones, la estrategia de autenticaciÃ³n, el diseÃ±o de interfaces, las reglas para crear y cerrar sprints, el almacenamiento de archivos y los criterios de aceptaciÃ³n del MVP. No todas deben resolverse antes de comenzar: se tomarÃ¡n cuando afecten a una funcionalidad concreta.

## 11.18. Resultado esperado

El desarrollo progresivo permitirÃ¡ validar AlfaCode HUB como plataforma interna para personas, proyectos y resultados. Las funcionalidades y reglas podrÃ¡n ajustarse antes de una eventual presentaciÃ³n formal al semillero.
