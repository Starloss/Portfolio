# Contraste y foco visible sobre la Escena

Investigación para el ticket "Contraste y foco visible sobre la Escena". Fecha: 2026-10-27.

## Pregunta

¿Los textos y controles del rediseño cumplen el contraste de WCAG 2.2 AA sobre la Escena, en Día y en Noche y a cualquier altura del Viaje de cámara? ¿Qué ajuste mínimo necesita cada par que falla? La meta es que Lighthouse accesibilidad ≥ 90 (regla `color-contrast` de axe) no dependa de la suerte y que el texto sea legible de verdad.

Fuentes medidas: variante **B · Bloques por sección** de `origin/prototype/layout-home`, variante **B · Ficha lateral** de `origin/prototype/caso-estudio` y los colores finales del Ávila de `origin/prototype/hitos` (`C.dia` / `C.noche`).

## Respuesta corta

Casi todo pasa. Fallan dos cosas reales y una tercera que solo engaña a Lighthouse.

1. **Hero en Día, en pantallas bajas** (alto ≤ ~730 px en escritorio, o móvil apaisado). Con `BASE = 0.3` fijo, la cresta del Ávila sube detrás de la propuesta de valor y de la ubicación:
   - Ubicación (14 px, `opacity: 0.85`): medí 3.26–3.88 en 1280×600, 1366×657, 1536×730 y 844×390. Peor caso calculado: **2.29** sobre la base del Ávila `#2f6b4f`. Umbral 4.5.
   - Propuesta de valor (19 px regular, que es texto *normal*): percentil 5 de **4.16** en 844×390. El cable del Teleférico la cruza (mínimo 1.57). Peor caso calculado: **2.58**.
   - **Arreglo A (preferido, determinista):** calcular el hundimiento del paisaje con la altura real del Hero, para que la cresta empiece al menos **16 px por debajo de la línea de ubicación**. Los CTA sí pueden quedar sobre la montaña, porque son sólidos: 6.29 y 12.96 en el peor caso.
   - **Arreglo B (si se quiere la montaña detrás del texto):** un velo de bruma detrás del bloque de texto, `rgba(232,244,251,0.5)`. El mínimo es α 0.40. Con 0.5, el peor caso queda en **5.70** (sobre el cable `#33424f`). Con el velo aplicado medí p5 ≥ 8.03 en todos los textos, en todos los tamaños que fallaban.
   - **En los dos casos:** quitar `opacity: 0.85` de la ubicación y usar el color sólido `#0d2233`. Sobre el cielo de Hitos `#5ea8dc` sube de 4.84 a **6.27**. Sin este cambio, el velo necesita α ≥ 0.51.
2. **Hero en Noche, si un punto claro de la Escena queda detrás del texto.** Pasa con el Humboldt `#fff2c9`, la luna `#f4f1e4` o el halo: **1.00–1.02** contra `#eef4f0`. Pasa en 1280×600: el Humboldt quedó detrás de "escalables" (mínimo 1.00).
   - Arreglo: la misma regla de la cresta (el Humboldt vive en la cresta) y la luna fuera de la columna de texto del Hero.
   - Alternativa: velo `rgba(6,11,28,0.65)`. El mínimo es α 0.60, y con 0.65 el peor caso queda en **5.59**.
3. **Lighthouse en Día: 86 (< 90) por un falso positivo.** axe compone los bloques translúcidos que están *debajo del pliegue* contra el fondo de `body`, que hoy es `#020617`, no contra la Escena. Por eso marca los rótulos de Skills (`primario` 13 px) con **4.47** contra `#d7dad9`. El peor caso real es 4.70.
   - Arreglo: `html { background-color: <cielo del modo> }`, con `#5ea8dc` en Día y `#050a1a` en Noche, y `body` transparente. axe pasa a ver 5.43, y con este arreglo y el de la lista Lighthouse da **100** en Día y en Noche.

Lo demás pasa en el peor caso posible, pero con poco margen en dos tokens:

- Día: `acento` 4.77 y `primario` 4.70.
- Noche: `suave` 4.80.

Regla para la implementación: **no bajar la opacidad de la superficie** de **0.84** en Día ni de **0.77** en Noche. Hoy está en 0.86 y 0.78.

**Foco visible:** los prototipos no tienen estilo de foco propio. Propongo un anillo de dos colores (técnica C40), con `:focus-visible { outline: 2px solid var(--foco-ext); outline-offset: 2px; box-shadow: 0 0 0 2px var(--foco-int); }`:

- Día: interior `#ffffff`, exterior `#14231c`. Contraste entre sí: 16.32.
- Noche: interior `#06140d`, exterior `#ffcf6e` (el ámbar de la identidad). Contraste entre sí: 12.93.

Cada par cubre *cualquier* fondo sólido con ≥ 3:1. Medido en pantalla, la banda exterior da 8.04–14.53 contra su fondo.

Otro hallazgo que baja Lighthouse: la regla `list` falla porque la línea del cable de Experiencia es un `<div>` hijo directo del `<ol>`. Cuesta 7 puntos y hoy deja la Noche en 93.

## Método

1. **Cálculo manual de composición (método principal).**
   - Uso la fórmula de luminancia relativa y de razón de contraste de WCAG 2.2, sin redondear. Understanding 1.4.3: "4.499:1 would not meet the 4.5:1 threshold".
   - La superficie translúcida se compone sobre el fondo con *source-over* en sRGB, igual que el navegador: `C = α·S + (1−α)·B`.
   - Para cada token probé todos los colores que la Escena puede poner detrás, a cualquier `alt`. De `prototype/layout-home`: los dos extremos del degradado del cielo, el horizonte, la lejana, el Ávila, la ciudad, las torres, las nubes compuestas, el Humboldt, el cable y la cabina. De `prototype/hitos`: las crestas, la ciudad, las guacamayas, la luna, las estrellas, el halo y las ventanas.
   - Me quedo con el peor. En Día es el más oscuro y en Noche el más claro.
   - El degradado `hexMix` interpola entre los dos extremos, así que los extremos acotan el resultado.
2. **`backdrop-filter: blur(6px)`.** El blur promedia vecinos, así que diluye detalles finos como el cable de 1.5 px, las estrellas o las ventanas. Un promedio nunca queda fuera del rango de sus colores, así que el blur no puede empeorar el contraste. Tampoco puede garantizar que lo mejore: el interior de áreas grandes (el Ávila, la luna de 46 px, el Humboldt) queda casi igual, y el filtro puede no estar disponible. Por eso doy dos peores casos:
   - "todo": incluye los detalles; es la garantía.
   - "áreas": solo superficies grandes; es la referencia realista.
3. **Medición en pantalla.**
   - Con Chrome headless y puppeteer-core abrí cada ruta y registré cada nodo de texto (rectángulos, color, opacidad acumulada, tamaño y peso).
   - Después volví transparente todo el texto, capturé la pantalla y comparé el color efectivo del texto contra **cada píxel** que tiene detrás.
   - Reporto el mínimo y el percentil 5. El percentil 5 descarta los bordes antialiasados de figuras finas.
   - Rutas medidas:
     - El Hero en 1440×900, 1440×760, 1536×730, 1366×657, 1280×600, 768×1024, 390×844, 360×640 y 844×390.
     - Los cinco `?ir=` del Home en 1440×900 y 390×844.
     - Los tres Casos de estudio (B) en 1440×900 y 390×844.
     - El lightbox y el Home simplificado del prototipo del Caso.
   - Todo en Día y en Noche.
4. **axe-core y Lighthouse.** Usé axe-core 4.10.2 y 4.14.0, inyectados, y Lighthouse 12.6.1, solo accesibilidad y con perfil móvil por defecto. Es la versión que fija `@lhci/cli@0.15.1`, según `docs/research/lighthouse-ci.md`, y resuelve `axe-core ^4.10.3`, que hoy es 4.14.0.
5. **Verificación de los arreglos.** Apliqué los arreglos propuestos a una copia local de los prototipos (no commiteada) y repetí la medición en pantalla y Lighthouse.

Umbrales usados:

- **4.5:1** para texto normal.
- **3:1** para texto grande: ≥ 24 px regular o ≥ 18.66 px bold. Understanding 1.4.3: "14pt and 18pt are equivalent to approximately 18.5px and 24px". Los 19 px bold del rol de Experiencia cuentan como grandes; los 19 px regulares de la propuesta de valor, no.
- **3:1** para componentes y gráficos (1.4.11).

## Pares medidos

"Peor caso" es el cálculo manual con todo color posible de la Escena detrás. "Medido" es el percentil 5 más bajo en pantalla entre todas las rutas y tamaños.

### Hero (texto directo sobre el cielo, sin panel)

| Elemento | Modo | Primer plano | Fondo efectivo peor caso | Ratio | Umbral | ¿Pasa? |
|---|---|---|---|---|---|---|
| "Hola, soy" 18 px | Día | `#0d2233` | cielo Hitos `#5ea8dc` | 6.27 (medido 7.81) | 4.5 | Sí |
| | Día | `#0d2233` | Ávila base `#2f6b4f`, si la cresta sube | 2.58 | 4.5 | **No** (no lo vi en pantalla) |
| Nombre 44–76 px bold | Día | `#0d2233` | Ávila base `#2f6b4f` | 2.58 (medido ≥ 7.92) | 3 | **No** en el peor caso; pasa en todo lo medido |
| Propuesta de valor 19 px | Día | `#0d2233` | cielo `#5ea8dc` | 6.27 | 4.5 | Sí |
| | Día | `#0d2233` | cresta Hitos `#3f7a5c` / Ávila base `#2f6b4f` / cable `#33424f` | 3.21 / 2.58 / 1.55 (medido p5 4.16 en 844×390, mín. 1.57) | 4.5 | **No** |
| Ubicación 14 px, opacidad 0.85 | Día | `#0d2233` @0.85 | cielo `#5ea8dc` | 4.84 | 4.5 | Sí, justo |
| | Día | `#0d2233` @0.85 | Ávila cumbre `#5f9c78` / base `#2f6b4f` | 4.05 / 2.29 (medido 3.26–3.88) | 4.5 | **No** |
| Chip del rol 13 px/600 | Día | `#14231c` | superficie 0.86 sobre `#1d4ed8` | 12.72 | 4.5 | Sí |
| CTA "Descargar CV" 15 px/600 | Día | `#ffffff` | `#2f6b4f` (sólido) | 6.29 | 4.5 | Sí |
| CTA "Contactar" 15 px/600 | Día | `#14231c` | superficie 0.86 sobre Ávila base | 12.96 | 4.5 | Sí |
| Texto del Hero (todos) | Noche | `#eef4f0` | cielo `#060b1c` / horizonte `#1b2c52` / cresta `#1c2c44` | 17.56 / 12.32 / 12.61 | 4.5 | Sí |
| | Noche | `#eef4f0` | halo del Humboldt (`#8c8779`) | 3.23 | 4.5 | **No** |
| | Noche | `#eef4f0` | Humboldt `#fff2c9` / luna `#f4f1e4` | 1.00 / 1.02 (medido mín. 1.00 en 1280×600) | 4.5 | **No** |
| Chip del rol / "Contactar" | Noche | `#eef4f0` | superficie 0.78 sobre `#ffffff` | 8.58 | 4.5 | Sí |
| CTA "Descargar CV" | Noche | `#06140d` | `#6fcf97` (sólido) | 9.92 | 4.5 | Sí |

Con el **arreglo B** aplicado (velo 0.5 en Día y 0.65 en Noche, ubicación sin opacidad), el peor caso calculado queda en 5.70 (Día) y 5.59 (Noche). Medido en 1280×600, 1366×657 y 844×390, en Día ningún texto baja de p5 8.03 y en Noche el mínimo es 6.07.

El velo se ve como una bruma rectangular sobre la montaña. Si no convence, el arreglo A evita el solapamiento sin velo.

### Bloques del Home (superficie translúcida sobre la Escena)

Superficie en Día: `rgba(250,252,248,0.86)`. La peor composición es `#ebdbd9`, sobre el ala de la guacamaya `#8f1218`. Si se cuentan solo áreas grandes, es `#e1e6e4`, sobre las torres.

Superficie en Noche: `rgba(8,18,27,0.78)`. La peor composición es `#3e464d`, sobre una estrella `#fff`. Si se cuentan solo áreas grandes, es `#3e4341`, sobre el Humboldt.

| Elemento | Modo | Primer plano | Fondo efectivo peor caso | Ratio todo / áreas (medido) | Umbral | ¿Pasa? |
|---|---|---|---|---|---|---|
| Títulos de sección 30 px bold; rol 19 px bold | Día | `texto` `#14231c` | `#ebdbd9` | 12.19 / 12.91 (13.34) | 3 | Sí |
| Texto de Cifra, logros, Contacto (14–18 px) | Día | `texto` | `#ebdbd9` | 12.19 / 12.91 (13.48) | 4.5 | Sí |
| Período de Experiencia 13 px; chips de Skills 13 px | Día | `suave` `#4b5d55` | `#ebdbd9` | 5.24 / 5.54 (5.81) | 4.5 | Sí |
| Cifra clave "Ver respaldo: … →" 12 px | Día | `acento` `#8a5200` | `#ebdbd9` | 4.77 / 5.05 (5.52) | 4.5 | Sí, margen 0.27 |
| Grupo de Skills ("Front"…) 13 px/600 | Día | `primario` `#2f6b4f` | `#ebdbd9` | 4.70 / 4.98 (5.38) | 4.5 | Sí, margen 0.20 (axe: 4.47, ver Resultados) |
| Valor de Cifra clave 36 px bold | Día | `primario` | `#ebdbd9` | 4.70 | 3 | Sí |
| Chip "Proyecto: … →" 13 px; botón de correo 15 px/600 | Día | `#ffffff` | `#2f6b4f` | 6.29 | 4.5 | Sí |
| Botones LinkedIn/GitHub/CV 15 px/600 | Día | `texto` | `#ebdbd9` | 12.19 | 4.5 | Sí |
| Tarjeta de Proyecto: tipo 12 px | Día | `acento` | `#ffffff` | 6.39 | 4.5 | Sí |
| Tarjeta: título 20 px bold / resumen 14 px / tech 13 px | Día | `texto` / `suave` | `#ffffff` | 16.32 / 7.01 / 7.01 | 3 / 4.5 | Sí |
| Marcador del diagrama BE 12 px | Día | `suave` | `#eaf2ec` | 6.14 | 4.5 | Sí |
| Títulos, texto, botones | Noche | `texto` `#eef4f0` | `#3e464d` | 8.58 / 9.00 (10.73) | 4.5 | Sí |
| Período, chips de Skills, resumen | Noche | `suave` `#a9bcb2` | `#3e464d` | 4.80 / 5.03 (7.70) | 4.5 | Sí, margen 0.30 |
| "Ver respaldo", tipo de Proyecto | Noche | `acento` `#ffcf6e` | `#3e464d` | 6.56 / 6.88 (11.73) | 4.5 | Sí |
| Grupo de Skills 13 px/600; valor de Cifra 36 px | Noche | `primario` `#6fcf97` | `#3e464d` | 5.04 / 5.28 (9.04) | 4.5 | Sí |
| Chip "Proyecto"; botón de correo | Noche | `#06140d` | `#6fcf97` | 9.92 | 4.5 | Sí |
| Tarjeta: tipo / título / resumen y tech | Noche | `acento` / `texto` / `suave` | `#0f1d29` | 11.73 / 15.34 / 8.57 | 4.5 | Sí |
| Marcador del diagrama BE | Noche | `suave` | `#13263a` | 7.70 | 4.5 | Sí |
| Borde de chips y botones secundarios (`borde` α 0.25) | Día / Noche | — | superficie | 1.40 / 1.60 | 3 | No aplica (ver abajo) |
| Marcador de estación de Experiencia (gráfico) | Día / Noche | `acento` | superficie | 4.77 / 6.56 | 3 | Sí |

**Opacidad mínima de la superficie** para que cada token pase con cualquier fondo (todo / áreas):

| Token | Día: α mínima (todo / áreas) | Noche: α mínima (todo / áreas) |
|---|---|---|
| `texto` | 0.42 / 0.28 | 0.61 / 0.59 |
| `suave` | 0.79 / 0.73 | 0.77 / 0.75 |
| `acento` | 0.84 / 0.79 | 0.68 / 0.66 |
| `primario` | 0.84 / 0.80 | 0.76 / 0.74 |

Los valores actuales (0.86 en Día, 0.78 en Noche) pasan. Son los pisos a respetar.

**1.4.11 y los bordes α 0.25:**

- Los botones secundarios tienen texto que los identifica, así que no necesitan un borde de 3:1. Understanding 1.4.11: "This success criterion does not require that controls have a visual boundary indicating the hit area"; el borde solo hace falta cuando no hay otra forma visual de identificar el control.
- Los chips de tech y Skills no son controles.
- Si algún chip pasa a ser interactivo (un filtro, por ejemplo), su texto lo identifica igual. Lo que sí necesita contraste es su foco.

### Caso de estudio (B · Ficha lateral, Escena fija con `alt = 1`)

Con `alt = 1`, detrás del bloque solo quedan el cielo (`#2a78b8` → `#e8f4fb`), las nubes y el borde de la lejana. Ese peor caso es más benigno que el del Home:

- Día, superficie sobre `#2a78b8` = `#ddeaef`: `texto` 13.23, `suave` 5.68, `acento` 5.18, `primario` 5.10.
- Noche, superficie sobre nube = `#162231`: `texto` 14.37, `suave` 8.03, `acento` 10.99, `primario` 8.43.

Igual conviene aplicar la tabla del Home como garantía. Si la Escena final muestra la luna o el Humboldt detrás del Caso, rigen esos números.

| Elemento | Modo | Primer plano | Fondo efectivo peor caso | Ratio (medido) | Umbral | ¿Pasa? |
|---|---|---|---|---|---|---|
| "← Proyectos" 14 px/600; índice 14 px | Día | `primario` | `#ddeaef` | 5.10 (5.13) | 4.5 | Sí |
| Tipo 13 px | Día | `acento` | `#ddeaef` | 5.18 (5.26) | 4.5 | Sí |
| h1 40 px bold, resumen 18 px, rótulos de Impacto 14 px, títulos de Decisión 17 px bold | Día | `texto` | `#ddeaef` | 13.23 (13.45) | 3 / 4.5 | Sí |
| Período y rol 14 px, tech 13 px, texto de Decisión 15 px | Día | `suave` | `#ddeaef` | 5.68 (6.01) | 4.5 | Sí |
| Número de Decisión 22 px bold | Día | `acento` | `#ddeaef` | 5.18 (5.74) | 3 | Sí |
| Valor de Impacto 30 px bold | Día | `primario` | `#ddeaef` | 5.10 (5.56) | 3 | Sí |
| "Demo ↗" 14 px/600; píldoras del diagrama BE 14 px/600 | Día | `#ffffff` | `#2f6b4f` | 6.29 | 4.5 | Sí |
| "Repositorio ↗" 14 px/600 | Día | `texto` | `#ddeaef` | 13.23 (14.41) | 4.5 | Sí |
| Flechas del diagrama BE (gráfico) | Día | `acento` | `opaca` `#f6f9f5` | 6.02 | 3 | Sí |
| Píldora BE contra el lienzo (gráfico) | Día | `#2f6b4f` | `#f6f9f5` | 5.93 | 3 | Sí |
| Todos los anteriores | Noche | `texto` / `suave` / `acento` / `primario` | `#162231` | 14.37 / 8.03 / 10.99 / 8.43 (mín. medido 8.52) | 4.5 | Sí |
| Píldoras y "Demo" | Noche | `#06140d` | `#6fcf97` | 9.92 | 4.5 | Sí |
| Flechas y píldoras BE (gráfico) | Noche | `acento` / `primario` | `#0a141d` | 12.74 / 9.77 | 3 | Sí |
| Leyenda del lightbox 14 px | ambos | `#e2e8f0` | `rgba(3,8,12,0.88)` sobre blanco = `#212629` | 12.43 | 4.5 | Sí |
| Flechas y ✕ del lightbox 20 px | ambos | `#ffffff` | `rgba(255,255,255,0.15)` sobre el velo = `#434649` | 9.48 (9.62) | 4.5 | Sí |
| Círculo del botón del lightbox vs velo | ambos | `#434649` | `#212629` | 1.62 | 3 | No aplica: el glifo identifica el control |

## Foco visible

**Qué exige WCAG 2.2:**

- **2.4.7 Focus Visible (AA):** "Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible." No fija un contraste propio, pero el indicador es contenido no textual, así que "they are also subject to Success Criterion 1.4.11 Non-text Contrast (Level AA)". 1.4.11 pide que el indicador tenga 3:1 "against the adjacent background".
- **2.4.11 Focus Not Obscured (Minimum) (AA):** "the component is not entirely hidden due to author-created content."
- **2.4.13 Focus Appearance** es **AAA** y no es requisito. Igual el anillo propuesto lo cumple en área: perímetro de 2 px y ≥ 3:1 entre estado enfocado y no enfocado.

**Estado de los prototipos:**

- No definen estilo de foco, así que dependen del indicador por defecto de cada navegador (técnica G165). No hay garantía de 3:1 sobre un cielo azul medio.
- Un anillo de un solo color de la paleta no alcanza. Por ejemplo, `primario` Día contra el cielo `#6fb3e0` da 2.76, y el blanco da 2.28: ninguno llega a 3:1.

**Propuesta: anillo de dos colores (W3C C40, "a two-color focus indicator that has sufficient contrast against any solid background color").** C40 pide que los dos colores tengan ≥ 9:1 entre sí.

```css
:root            { --foco-int: #ffffff; --foco-ext: #14231c; } /* Día */
[data-modo=noche]{ --foco-int: #06140d; --foco-ext: #ffcf6e; } /* Noche: ámbar de la identidad */
:focus-visible {
  outline: 2px solid var(--foco-ext);   /* banda exterior, de 2 a 4 px fuera del borde */
  outline-offset: 2px;
  box-shadow: 0 0 0 2px var(--foco-int); /* banda interior, de 0 a 2 px */
}
```

- `outline` sobrevive en modo de colores forzados. `box-shadow` agrega la segunda banda.
- Las dos siguen el `border-radius`.

**Cobertura teórica:**

- Día (`#14231c`/`#ffffff`, 16.32 entre sí): la banda oscura da ≥ 3:1 con todo fondo de L ≥ 0.143, y la blanca con todo fondo de L ≤ 0.300. No queda ningún hueco.
- Noche (`#ffcf6e`/`#06140d`, 12.93 entre sí): la oscura cubre L ≥ 0.117 y la ámbar L ≤ 0.190. Tampoco queda hueco.

**Mejor banda contra cada fondo:**

| Modo | Fondo | Interior | Exterior | Mejor |
|---|---|---|---|---|
| Día | cielo `#5ea8dc` / `#6fb3e0` | 2.59 / 2.28 | **6.30 / 7.15** | ≥ 3 |
| Día | Ávila cumbre / base | 3.22 / **6.29** | **5.06** / 2.59 | ≥ 3 |
| Día | superficie peor `#ebdbd9` / tarjeta `#fff` | 1.34 / 1.00 | **12.17 / 16.32** | ≥ 3 |
| Día | botón `primario` (lo que toca la banda interior) | **6.29** | 2.59 | ≥ 3 |
| Noche | cielo `#060b1c` / superficie `#060f17` / tarjeta `#0f1d29` | 1.04 / 1.02 / 1.10 | **13.43 / 13.23 / 11.73** | ≥ 3 |
| Noche | halo / Humboldt `#fff2c9` | **5.26 / 16.88** | 2.46 / 1.31 | ≥ 3 |
| Noche | superficie peor `#3e464d` | 1.96 | **6.58** | ≥ 3 |
| Noche | botón `primario` `#6fcf97` | **9.92** | 1.30 | ≥ 3 |

**Medido en pantalla** con Tab, con los arreglos aplicados:

| Caso | Banda exterior contra el fondo |
|---|---|
| CTA del Hero sobre el Ávila con velo, Día, 1280×600 | 8.04–8.51 |
| Cifra clave, Día | 13.97–14.38 |
| "Demo" del Caso, Día | 14.38–14.53 |
| "Contactar", Noche | 12.64–12.73 |
| Cifra clave, Noche | 12.71–13.09 |
| "Demo" del Caso, Noche | 12.70–12.81 |

En todos los casos la banda interior da 12.93–16.32 contra la exterior.

**2.4.11 (foco tapado):**

- La barra flotante de los prototipos (`position: fixed`, abajo) taparía elementos enfocados, pero es solo del prototipo. Si la versión final suma algo fijo o sticky, como un header o un selector Día/Noche, hay que usar `scroll-padding` (técnica C43) con su alto.
- La ficha sticky del Caso vive en su propia columna de la grilla y no se superpone a otros controles.
- La Escena va debajo del contenido, con `pointer-events: none`, y nunca tapa nada.
- **Lightbox:** no mueve el foco al diálogo ni lo atrapa. Con Tab, el foco sigue en la página de atrás, tapada por el velo con α 0.88. Hay que mover el foco al abrir, mantenerlo dentro y devolverlo al cerrar.
- El fondo del lightbox es oscuro también en Día, así que conviene aplicarle las variables de foco de Noche. El anillo de Día igual pasa por C40, porque su banda blanca da 15:1 contra el velo.

## Resultados de axe y Lighthouse

**Lighthouse 12.6.1** (accesibilidad, móvil, axe 4.14.0), sobre los prototipos tal cual:

| Ruta | Puntaje | Auditorías que fallan |
|---|---|---|
| `/prototype/layout?v=b&modo=dia` | **86** | `color-contrast`: "Front", "Back", "DevOps" y "Soft Skills" con 4.47 (`#2f6b4f` sobre `#d7dad9`). `list`: `<div>` dentro del `<ol>` de Experiencia |
| `/prototype/layout?v=b&modo=noche` | 93 | `list` |
| `/prototype/caso?v=b&p=superwallet&modo=dia` | 100 | — |
| `/prototype/caso?v=b&p=be&modo=dia` y `…&modo=noche` | 100 | — |

Con los arreglos aplicados (`html` con el color de cielo del modo, la línea del cable fuera del `<ol>`, el velo y el foco):

| Ruta | Puntaje |
|---|---|
| layout Día | **100** |
| layout Noche | **100** |
| caso boda Día | **100** |

`?ir=skills` da 97, solo por `skip-link`: los `href="#top"` de relleno del prototipo no tienen destino. Es un artefacto del prototipo.

**Por qué axe falla en Día:**

- `#d7dad9` es exactamente la superficie con α 0.86 sobre el `#020617` del `body`, que viene del `tailwind.css` actual (`dark:bg-slate-950`).
- La Escena es `position: fixed` y en la geometría de axe solo ocupa el rectángulo del viewport. Para los bloques *debajo del pliegue*, axe no la encuentra detrás y compone contra el fondo de `body`/`html`.
- Las mismas etiquetas dentro del viewport (`?ir=skills`) no fallan. axe las marca "incompleto" (`bgGradient`, `imgNode`).
- Lo comprobé cambiando solo el fondo de `html`/`body` a `#5ea8dc`: Día pasa a 0 violaciones, en axe 4.10.2 y en 4.14.0.
- Con un degradado en `body`, axe tampoco falla: marca todo "incompleto".
- Ojo: un color de cielo diurno en Noche haría fallar el Hero (2.32). El color tiene que seguir al modo.

**Diferencia entre versiones de axe:**

- **axe 4.10.2** sí falló el texto del Hero en Día con 1.24, contra `#020617`. No vio la Escena ni siquiera dentro del viewport, y quitarle `pointer-events: none` a las capas no cambió nada.
- **axe 4.14.0**, la que resuelve hoy Lighthouse 12.6.1, deja el Hero como "incompleto".
- El arreglo de `html` hace que las dos versiones pasen. Así el resultado no depende de qué axe resuelva el lockfile.

**Qué cuenta en el puntaje:**

- En `axe-audit.js`, un resultado "incompleto" sin error no cuenta como falla: solo las `violations` dan `score: 0`.
- El texto sobre degradados o imágenes, que axe no puede evaluar, no baja el puntaje, pero **tampoco queda verificado**. Deque lo documenta: la regla "will not report on text elements that have a `background-image`" y lista los degradados como difíciles de detectar.
- Por eso el método principal es el cálculo manual de composición, no axe.
- `color-contrast` pesa 7 de 404 en total, pero el puntaje solo promedia las auditorías aplicables. En esta página, una sola falla de contraste costó 7 puntos (93 → 86).

**Medición en pantalla** sobre los prototipos sin arreglos:

| Ruta | Textos que fallan (p5) |
|---|---|
| Hero Día 1280×600 | ubicación (3.69) |
| Hero Día 1366×657 | ubicación (3.81) |
| Hero Día 1536×730 | ubicación (3.88) |
| Hero Día 844×390 | propuesta de valor (4.16) y ubicación (3.26) |
| Resto del Hero, los cinco `?ir=` del Home y los tres Casos, Día y Noche | 0 |

En Noche 1280×600, el p5 pasa pero el mínimo da 1.00, con el Humboldt detrás de la propuesta.

Con el velo aplicado, ningún texto del Hero falla: en Día el p5 mínimo es 8.03 y en Noche el mínimo es 6.07.

## Fuentes

- W3C, Understanding SC 1.4.3 Contrast (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html. Cubre el tamaño grande (18.5 px bold / 24 px), el no redondeo, el borde o halo de las letras y F83 (imagen de fondo sin contraste).
- W3C, Understanding SC 1.4.11 Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html. Cubre el borde no requerido si hay otra identificación, el foco contra el fondo adyacente y "choose the least contrasting area" en degradados.
- W3C, Understanding SC 2.4.7 Focus Visible: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- W3C, Understanding SC 2.4.11 Focus Not Obscured (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- W3C, Understanding SC 2.4.13 Focus Appearance (AAA): https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- W3C, Technique C40, two-color focus indicator: https://www.w3.org/WAI/WCAG22/Techniques/css/C40
- W3C, Technique C43, `scroll-padding`: https://www.w3.org/WAI/WCAG22/Techniques/css/C43
- W3C, WCAG 2.2, definición de razón de contraste y luminancia relativa: https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
- Deque, regla `color-contrast` de axe 4.10: https://dequeuniversity.com/rules/axe/4.10/color-contrast
- Lighthouse 12.6.1, `core/audits/accessibility/axe-audit.js` (tratamiento de `incomplete`) y `core/config/default-config.js` (peso de `color-contrast` = 7): https://github.com/GoogleChrome/lighthouse/tree/v12.6.1/core
- Código fuente medido: `origin/prototype/layout-home` (`LayoutHomePrototype.tsx`: `COLORES`, `TOKENS`, `Escena`), `origin/prototype/caso-estudio` (`CasoEstudioPrototype.tsx`) y `origin/prototype/hitos` (`EscenaHitosPrototype.tsx`: `C.dia` / `C.noche`, luna, halo y guacamayas). En `origin/prototype/caso-estudio`, `src/tailwind.css` tiene el fondo actual del `body`.
