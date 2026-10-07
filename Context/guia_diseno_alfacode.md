# Guía de Diseño AlfaCode v1.0

## 1. Concepto de marca

La identidad debe representar:

**Problema → Investigación → Construcción → Tecnología → Solución → Impacto**

AlfaCode no debería sentirse como un club de programación ni como una página institucional universitaria convencional. La referencia conceptual debe ser:

**Research & Software Lab universitario**

Los atributos principales son:

**Elegante · Moderno · Innovador · Tecnológico · Minimalista**

Y como valores secundarios:

- precisión;
- conocimiento;
- sistemas;
- colaboración;
- experimentación;
- ingeniería;
- impacto.

El concepto gráfico central será:

### Sistemas conectados

El nodo del isotipo, las líneas y la estructura abierta del logo pueden convertirse en el lenguaje visual de toda la plataforma.

Esto permite representar:

- integrantes conectados a proyectos;
- tecnologías;
- líneas de investigación;
- flujo de información;
- arquitectura;
- investigación;
- colaboración;
- impacto.

---

## 2. Logo e identidad gráfica

El logo seleccionado debe convertirse en la **fuente de verdad visual** de AlfaCode.

### Logotipo horizontal

Usarlo en:

- navbar pública;
- login;
- documentos;
- correos;
- presentaciones;
- encabezados institucionales.

### Isotipo

Usarlo en:

- favicon;
- sidebar contraída;
- avatar institucional;
- loading;
- app icon;
- redes;
- elementos gráficos.

### Composición vertical

Reservarla para:

- portadas;
- posters;
- piezas institucionales;
- eventos;
- publicaciones.

### Regla importante

No recrear nunca la palabra `AlfaCode` con una fuente parecida.

El wordmark debe utilizarse siempre como **activo gráfico oficial**.

Idealmente, la versión definitiva del logo debería existir en:

**SVG + PNG transparente + monocromático + reversed**

y el SVG debería ser la versión principal utilizada en la plataforma.

---

## 3. Paleta principal

### Colores oficiales

| Token | Color | Uso |
|---|---:|---|
| Alfa Primary | `#469EB4` | Identidad principal |
| Alfa Ice | `#E1FEFF` | Secundario, fondos y highlights |
| Deep Lab | `#08151B` | Fondo oscuro principal |
| Lab Navy | `#0B1D25` | Superficies oscuras |
| Carbon Blue | `#102832` | Cards oscuras |

La combinación principal de marca sería:

**#469EB4 + #E1FEFF + #08151B**

---

## 4. Escala de color Alfa

No utilizar solamente `#469EB4`. El sistema necesita tonos derivados.

| Nivel | Hex | Uso |
|---|---|---|
| 50 | `#F1FAFC` | Fondos suaves |
| 100 | `#E1FEFF` | Highlight / secondary |
| 200 | `#BFE9F0` | Bordes destacados |
| 300 | `#8FD1DD` | Elementos suaves |
| 400 | `#64B6C7` | Hover decorativo |
| 500 | `#469EB4` | Brand principal |
| 600 | `#347F92` | CTA sobre fondo claro |
| 700 | `#286273` | Texto/enlaces |
| 800 | `#1E4957` | Estados activos |
| 900 | `#14333D` | Superficies profundas |
| 950 | `#08151B` | Fondo principal |

Hay un detalle de accesibilidad importante:

**`#469EB4` sobre blanco tiene aproximadamente 3.08:1 de contraste**, por lo que no conviene utilizarlo para texto normal pequeño.

Para links, botones o texto sobre blanco utilizar preferiblemente:

**`#347F92` o `#286273`.**

`#347F92` sobre blanco ronda **4.57:1**, suficiente para WCAG AA en texto normal.

---

## 5. Neutros

Evitar grises completamente neutros. Los grises de AlfaCode deberían tener una ligera tendencia azul.

| Token | Hex |
|---|---:|
| Ink | `#10242C` |
| Slate 800 | `#29404A` |
| Slate 600 | `#5D7179` |
| Slate 400 | `#93A5AC` |
| Border | `#D5E6EA` |
| Surface | `#EEF7F9` |
| Canvas | `#F7FBFC` |
| White | `#FFFFFF` |

Esto hará que incluso las zonas claras sigan perteneciendo visualmente a AlfaCode.

---

## 6. Colores semánticos

Los estados funcionales no deben depender del azul corporativo.

| Estado | Color |
|---|---|
| Success | `#278A65` |
| Warning | `#B7791F` |
| Error | `#C84A4A` |
| Info | `#347F92` |
| Neutral | `#5D7179` |

Por ejemplo:

**Proyecto**

- Propuesta → Neutral
- Investigación → Azul
- Diseño → Turquesa suave
- Desarrollo → Primary
- Validación → Ámbar
- Finalizado → Verde
- Bloqueado → Rojo

Siempre acompañar el color de **texto o iconografía**. Nunca comunicar el estado únicamente mediante color.

---

## 7. Light y Dark

No haría que todo AlfaCode fuera oscuro.

### Portal público

Puede ser aproximadamente:

**65 % oscuro / 35 % claro**

porque permite una identidad más tecnológica y expresiva.

### Sistema administrativo

Recomiendo prácticamente lo contrario:

**70 % claro / 30 % oscuro**

Por ejemplo:

```text
Sidebar       → Dark
Topbar        → Light
Workspace     → Light
Cards         → White
Tables        → White
Modal         → White
Highlights    → Primary
```

Esto hará mucho más cómoda la gestión diaria de:

- proyectos;
- integrantes;
- publicaciones;
- formularios;
- tablas;
- filtros.

Un dashboard completamente oscuro se ve llamativo, pero termina siendo menos cómodo cuando hay mucha información administrativa.

Posteriormente sí puede existir **Dark Mode** completo.

---

## 8. Tipografía

Recomiendo utilizar **dos familias principales**.

### Sora

Para:

- H1;
- H2;
- títulos destacados;
- números grandes;
- Hero;
- proyectos destacados.

Da la sensación tecnológica y geométrica que necesita AlfaCode.

### Manrope

Para:

- interfaz;
- cuerpo;
- formularios;
- tablas;
- botones;
- navegación;
- dashboard.

Tiene excelente legibilidad y sigue sintiéndose moderna.

### Opcional: JetBrains Mono

Solamente para elementos muy concretos:

- identificadores;
- versiones;
- metadata técnica;
- código;
- pequeños labels tecnológicos.

No utilizarla como fuente general.

---

## 9. Escala tipográfica

### Portal público

| Elemento | Tamaño |
|---|---:|
| Display XL | 64–72 px |
| H1 | 52–64 px |
| H2 | 40–48 px |
| H3 | 28–32 px |
| H4 | 22–24 px |
| Body Large | 18 px |
| Body | 16 px |
| Small | 14 px |
| Caption | 12 px |

### Plataforma interna

Reducir la escala:

| Elemento | Tamaño |
|---|---:|
| Page title | 28–32 px |
| Section | 22–24 px |
| Card title | 17–18 px |
| Body | 14–16 px |
| Label | 13–14 px |
| Metadata | 12 px |

El sistema interno debe sentirse **más compacto y productivo** que el portafolio.

---

## 10. Pesos tipográficos

Limitar los pesos.

**400** → cuerpo  
**500** → UI  
**600** → títulos / botones  
**700** → títulos destacados

Evitar llenar toda la interfaz de bold.

Los títulos grandes pueden depender más del **tamaño y espacio** que del peso.

---

## 11. Espaciado

Utilizar sistema basado en **4 px / 8 px**.

```text
4
8
12
16
24
32
40
48
64
80
96
128
```

Los valores más usados deberían ser:

`8 · 12 · 16 · 24 · 32 · 48`

Esto crea consistencia entre todas las pantallas.

---

## 12. Border radius

El logo ya tiene terminaciones suaves, pero la plataforma no debería volverse excesivamente redondeada.

| Componente | Radius |
|---|---:|
| Input | 8 px |
| Button | 8–10 px |
| Card | 12 px |
| Modal | 16 px |
| Hero element | 16–20 px |
| Glass container | 16–20 px |
| Badge | 6–999 px |

No utilizar `24px` o `32px` en todas las cards.

Eso alejaría el diseño del carácter técnico.

---

## 13. Bordes

Los bordes deben aportar más estructura que las sombras.

Light:

`#D5E6EA`

Dark:

`rgba(225, 254, 255, 0.10)`

Active:

`#469EB4`

Focus:

`#469EB4` con halo exterior.

Esto encaja mejor con una identidad de ingeniería y sistemas.

---

## 14. Sombras

Muy sutiles.

Cards normales:

```css
0 2px 8px rgba(8, 21, 27, 0.05)
```

Elevated:

```css
0 8px 32px rgba(8, 21, 27, 0.10)
```

No utilizar sombras negras enormes.

En dark mode es mejor trabajar con:

- bordes;
- contraste entre superficies;
- iluminación.

---

## 15. Liquid Glass

Debe ser parte de AlfaCode, pero **no del 100 % de AlfaCode**.

### Sí utilizarlo en

- navbar pública;
- login;
- hero;
- overlays;
- filtros flotantes;
- modales especiales;
- paneles visuales;
- command palette.

### No utilizarlo en

- tablas;
- inputs;
- formularios largos;
- cada card;
- filas;
- administración diaria.

Una configuración aproximada:

```css
background: rgba(225, 254, 255, 0.06);
border: 1px solid rgba(225, 254, 255, 0.12);
backdrop-filter: blur(16px);
```

---

## 16. Iconografía

Recomiendo iconografía tipo **Lucide**.

Características:

- outline;
- stroke 1.5–2 px;
- geometría simple;
- sin rellenos innecesarios.

Los iconos funcionales deberían seguir un mismo sistema.

Para identidad gráfica propia utilizar:

**nodos + líneas + módulos + conexiones**

No utilizar constantemente:

- robots;
- cerebros;
- `</>`;
- terminales;
- chips;
- bombillos.

Pueden existir en contextos específicos, pero no deben convertirse en la identidad principal.

---

## 17. Patrón gráfico AlfaCode

Este debería ser uno de los elementos más importantes del branding.

A partir del isotipo:

```text
●─────●
      │
●─────●────●
            \
             ●
```

Crear composiciones basadas en:

- nodos;
- ramificaciones;
- conexiones;
- caminos;
- módulos.

Cada nodo puede representar:

```text
Problema
   ↓
Investigación
   ↓
Tecnología
   ↓
Construcción
   ↓
Resultado
```

Este patrón puede aparecer en:

- fondos;
- separadores;
- diagrams;
- loaders;
- hero;
- cards;
- empty states;
- presentaciones;
- redes.

---

## 18. Cards

No todas deben verse iguales.

### Standard card

Para administración.

```text
┌────────────────────────────┐
│ Título                     │
│ Información                │
│                            │
│ Metadata                   │
└────────────────────────────┘
```

White + border.

### Project card

Más visual.

Imagen → título → línea → tecnologías → estado.

### Metric card

Número grande + etiqueta + pequeña tendencia.

### Glass card

Reservada para portal público y algunos dashboards visuales.

---

## 19. Botones

### Primary

Light UI:

**#347F92 + texto blanco**

Dark UI:

**#469EB4 + texto #08151B**

### Secondary

Fondo transparente + border.

### Ghost

Sin background.

### Destructive

Rojo únicamente para:

- eliminar;
- cancelar acciones críticas;
- revocar.

Nunca convertir todos los CTA en botones filled.

---

## 20. Inputs

Los formularios administrativos deberían ser sobrios.

Altura:

**40–44 px**

Labels siempre visibles.

Estados:

Default → Border  
Hover → Border oscuro  
Focus → Primary  
Error → Error  
Disabled → Surface neutral

No depender exclusivamente de placeholders.

---

## 21. Tablas

Las tablas van a ser fundamentales.

Usaría:

- header suave;
- filas de 44–48 px;
- divisores discretos;
- hover muy ligero;
- sticky header;
- filtros arriba;
- paginación clara.

Ejemplo:

```text
Proyecto         Línea       Estado       Equipo     ⋯
──────────────────────────────────────────────────────
Hotel PMS        Software    Desarrollo   5          ⋯
Edu IA           IA          Validación   4          ⋯
IoT Health       IoT         Investigación 6         ⋯
```

Evitar bordes completos tipo Excel.

---

## 22. Badges

Utilizarlos para información secundaria:

`IA`

`IoT`

`Software`

`Activo`

`Publicado`

`Interno`

`Borrador`

Deben ser discretos.

No convertir cada dato en badge.

---

## 23. Diseño de proyectos

El proyecto debe convertirse en el **objeto central del ecosistema**.

En público puede ser muy visual.

En interno debería mostrar inmediatamente:

```text
Proyecto

Estado
████████░░

Equipo
● ● ● ● +3

Líneas
IA · Software

Próximo hito
Validación del prototipo

Última actividad
Hace 2 días
```

Esto conecta visualmente administración y narrativa pública.

---

## 24. Dashboard

No llenarlo de gráficas.

Primero:

### Información accionable

- proyectos activos;
- hitos vencidos;
- solicitudes pendientes;
- publicaciones en revisión;
- próximos eventos.

Después:

### Analítica

- proyectos por estado;
- proyectos por línea;
- publicaciones por año;
- miembros activos.

---

## 25. Gráficas

Utilizar una paleta limitada.

Principal:

`#469EB4`

Variantes:

`#64B6C7`  
`#8FD1DD`  
`#286273`  
`#BFE9F0`

Y colores semánticos únicamente cuando correspondan.

Evitar dashboards arcoíris.

---

## 26. Fotografías

Preferir siempre:

- integrantes reales;
- laboratorios;
- eventos;
- proyectos;
- desarrollo;
- prototipos;
- dispositivos;
- presentaciones.

Evitar fotografías stock de personas mirando laptops.

Tratamiento:

- contraste limpio;
- luz fría moderada;
- fondos naturales;
- overlay azul solo cuando haga falta.

---

## 27. Capturas de software

Los proyectos deben demostrar capacidad técnica.

Mostrar:

- dashboard;
- interfaces;
- dispositivos;
- diagramas;
- prototipos.

Preferiblemente dentro de composiciones limpias, no dentro de mockups excesivamente realistas de laptops.

---

## 28. Diagramas

Los diagramas deberían ser parte de la identidad.

Utilizar:

- líneas finas;
- nodos;
- etiquetas;
- bloques;
- flujos.

Ejemplo:

```text
Usuario
   │
   ▼
Frontend ────── IA
   │            │
   ▼            ▼
Datos ─────── Modelo
```

La geometría debe derivarse visualmente del isotipo.

---

## 29. Motion Design

Dos comportamientos diferentes.

### Web pública

Puede utilizar:

**400–700 ms**

para:

- reveal;
- diagramas;
- hero;
- proyectos;
- conexiones.

### Aplicación administrativa

**150–250 ms**

para:

- dropdowns;
- modals;
- tabs;
- buttons;
- sidebar.

Nada debería moverse continuamente dentro del panel de administración.

---

## 30. Loading

Evitar spinners genéricos cuando sea posible.

Podrían utilizarse pequeñas animaciones derivadas del isotipo:

```text
nodo → conexión → nodo
```

Pero para contenido utilizar principalmente **skeleton loaders**.

---

## 31. Empty states

También deberían tener personalidad AlfaCode.

Por ejemplo:

**No hay proyectos todavía**

Una pequeña representación de dos nodos que todavía no están conectados.

CTA:

**Crear proyecto**

No hace falta recurrir a ilustraciones cartoon.

---

## 32. Sidebar administrativa

Recomiendo:

**#08151B**

Logo horizontal o isotipo arriba.

Navegación:

```text
Dashboard

GESTIÓN
Proyectos
Integrantes
Investigación
Tecnologías

CONOCIMIENTO
Publicaciones
Artículos

COMUNIDAD
Eventos
Logros
Convocatorias
Solicitudes
Aliados

SISTEMA
Multimedia
Sitio web
Configuración
```

Activo:

fondo suave derivado de `#469EB4`.

---

## 33. Topbar

Fondo:

`#FFFFFF`

o en dark mode:

`#0B1D25`

Contendrá:

- breadcrumb;
- búsqueda;
- notificaciones;
- perfil.

No debe competir visualmente con el contenido.

---

## 34. Autenticación

Aquí sí podemos utilizar una versión más expresiva.

Pantalla dividida:

```text
┌─────────────────┬────────────────────┐
│                 │                    │
│ Identidad       │ Login              │
│ AlfaCode        │                    │
│                 │                    │
│ Sistemas        │ Email              │
│ conectados      │ Password           │
│                 │                    │
└─────────────────┴────────────────────┘
```

Lado visual oscuro con nodos + isotipo.

Formulario claro y limpio.

---

## 35. Responsive

Tres grandes breakpoints conceptuales:

**Mobile** < 768  
**Tablet** 768–1024  
**Desktop** > 1024

En administración:

Desktop → sidebar fija.  
Tablet → sidebar colapsada.  
Mobile → drawer.

Las tablas grandes deberían poder convertirse parcialmente en cards o permitir scroll horizontal controlado.

---

## 36. Tono de comunicación

AlfaCode debería hablar como un equipo técnico, pero comprensible.

Evitar frases como:

> Revolucionando el futuro con tecnología disruptiva.

Preferir:

> Desarrollamos soluciones tecnológicas a partir de problemas reales.

O:

> Investigación aplicada al desarrollo de soluciones reales.

El lenguaje debe ser:

**preciso + claro + profesional + cercano**

---

## 37. Naming de acciones

En administración utilizar siempre:

**Ver proyecto**  
**Crear proyecto**  
**Editar integrante**  
**Publicar artículo**  
**Registrar evento**

Evitar:

**Continuar**  
**Aceptar**  
**Proceder**

cuando no queda claro qué ocurrirá.

---

## 38. Identidad por áreas

Se puede distinguir cada área sin crear cuatro marcas.

Por ejemplo:

**Software** → Primary 500  
**IA** → Primary 300  
**IoT** → Primary 700  
**Investigación** → Ice + Primary 600

Pero mantenerlas dentro de la misma familia.

No asignaría morado a IA, verde a IoT, naranja a investigación, etc. Eso fragmentaría demasiado la marca.

---

## 39. Portal vs sistema interno

Esta es probablemente la regla más importante.

| Aspecto | Portal público | Sistema interno |
|---|---|---|
| Objetivo | Impactar | Trabajar |
| Fondos | Oscuros predominantes | Claros predominantes |
| Animación | Media | Baja |
| Glass | Moderado | Muy poco |
| Tipografía | Grande | Compacta |
| Cards | Expresivas | Funcionales |
| Diagramas | Protagonistas | Informativos |
| Imágenes | Muchas | Contextuales |
| Densidad | Baja | Media/Alta |

Eso mantiene una sola marca sin obligar a que ambas interfaces se comporten igual.

---

## 40. Tokens iniciales

```css
:root {
  /* Brand */
  --alfa-50: #F1FAFC;
  --alfa-100: #E1FEFF;
  --alfa-200: #BFE9F0;
  --alfa-300: #8FD1DD;
  --alfa-400: #64B6C7;
  --alfa-500: #469EB4;
  --alfa-600: #347F92;
  --alfa-700: #286273;
  --alfa-800: #1E4957;
  --alfa-900: #14333D;
  --alfa-950: #08151B;

  /* Neutral */
  --ink: #10242C;
  --slate-800: #29404A;
  --slate-600: #5D7179;
  --slate-400: #93A5AC;

  --border: #D5E6EA;
  --surface-muted: #EEF7F9;
  --canvas: #F7FBFC;
  --surface: #FFFFFF;

  /* Semantic */
  --success: #278A65;
  --warning: #B7791F;
  --danger: #C84A4A;
  --info: #347F92;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Space */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

---

# Dirección final

AlfaCode debería tener visualmente **dos personalidades de una misma marca**:

## AlfaCode Showcase

Oscuro · Experimental · Liquid Glass · Diagramas · Movimiento · Storytelling.

## AlfaCode Workspace

Claro · Preciso · Ordenado · Estructurado · Productivo · Data-driven.

Y ambos unidos por cinco elementos que nunca cambian:

**#469EB4 + #E1FEFF + Sora/Manrope + geometría del isotipo + lenguaje de nodos/conexiones.**

Con esto, AlfaCode cuenta con la base de un **Design System completo para todo el ecosistema**, no solo para el portafolio público.
