# Qué propone impeccable

Research para [#106](https://github.com/Starloss/Portfolio/issues/106), dentro del mapa [#104 Rework con impeccable](https://github.com/Starloss/Portfolio/issues/104).

**Qué se leyó.** El repo [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) en el commit [`c8891a9`](https://github.com/pbakaus/impeccable/tree/c8891a9ae865d6ee311836ae5199bfce0fe115b1) (5 de noviembre de 2026, "Sync generated provider output"). La skill dice `version: 4.8.0` y el motor `0.1.18`. Además se leyeron las páginas de [impeccable.style/docs](https://impeccable.style/docs/). Solo se leyó: no se clonó el repo, no se corrió `npx` ni ningún script suyo. Los archivos se leyeron como texto (raw de GitHub y la API de contenidos de GitHub).

Abreviaturas de las fuentes, todas fijadas a ese commit:

- **[SKILL]**: [`.claude/skills/impeccable/SKILL.md`](https://github.com/pbakaus/impeccable/blob/c8891a9ae865d6ee311836ae5199bfce0fe115b1/.claude/skills/impeccable/SKILL.md)
- **[ref/x]**: `.claude/skills/impeccable/reference/x.md` en el mismo commit, por ejemplo [ref/init](https://github.com/pbakaus/impeccable/blob/c8891a9ae865d6ee311836ae5199bfce0fe115b1/.claude/skills/impeccable/reference/init.md)
- **[README]**: [`README.md`](https://github.com/pbakaus/impeccable/blob/c8891a9ae865d6ee311836ae5199bfce0fe115b1/README.md)
- **[launcher]**: [`.claude/skills/impeccable/scripts/impeccable`](https://github.com/pbakaus/impeccable/blob/c8891a9ae865d6ee311836ae5199bfce0fe115b1/.claude/skills/impeccable/scripts/impeccable)
- **[docs/x]**: `https://impeccable.style/docs/x`

## En una frase

impeccable es una skill de dirección de diseño para agentes. Da un vocabulario de comandos (`/impeccable <comando> <objetivo>`) para planear, construir, criticar y pulir UI. Antes de diseñar pide un `PRODUCT.md` con la verdad del producto. Al terminar escribe un `DESIGN.md` con el sistema visual. Por debajo corre un motor binario con un detector determinista de "AI slop" [README] [SKILL].

## Modelo mental

### Modos

Cada superficie se clasifica por lo que significa el éxito para el visitante [SKILL]:

- **Persuade:** landing, marketing, precios.
- **Operate:** UI de app, dashboards, ajustes.
- **Read:** docs, artículos, changelogs.
- **Experience:** "Portfolios, galleries, showcases. Let the artifact lead from the first viewport; the interface recedes."

El portafolio cae en **Experience**. Ese modo pide compromiso total: trabajo audaz y con punto de vista, donde el display y el motion pueden llevar la voz [SKILL] [ref/typeset] [ref/animate].

### Refinamiento o rediseño

Son los dos caminos y no se mezclan [SKILL]:

- **Refinamiento:** conserva la identidad actual, el comportamiento, el copy y todo lo que esté fuera del alcance.
- **Rediseño:** conserva la verdad del producto, el contenido, la función y las restricciones, pero trata el look viejo "as evidence and anti-reference". Reemplaza el mundo visual y reescribe `DESIGN.md`.

La skill lo dice así: "Never split the difference into polish on the discarded look."

### "The brief wins"

Las estéticas, fuentes y paletas fijadas por el usuario mandan, aunque choquen con una advertencia de patrón saturado [SKILL]. Esto importa para la Escena (ver *Encaje*).

## Comandos y flujo

Los 24 comandos de la tabla de [SKILL]:

| Grupo | Comandos |
|---|---|
| Construir | `shape` (planear UX/UI antes del código), `init` (escribe `PRODUCT.md`), `document` (escribe `DESIGN.md` desde el código), `extract` (saca tokens y componentes a un sistema), `craft` (alias obsoleto) |
| Evaluar | `critique` (revisión UX con puntaje), `audit` (a11y, rendimiento, responsive) |
| Refinar | `polish`, `bolder`, `quieter`, `distill`, `harden`, `onboard` |
| Potenciar | `animate`, `colorize`, `typeset`, `layout`, `delight`, `overdrive` |
| Arreglar | `clarify` (copy de la UI), `adapt` (pantallas y dispositivos), `optimize` (rendimiento) |
| Iterar | `live` (overlay en el navegador sobre el dev server para elegir variantes), `generate` (N variantes de un elemento) |

Además hay `hooks`, `doctor` y `pin` [SKILL].

Cómo se enruta un pedido [SKILL] [ref/routing]:

- **Sin argumento:** muestra un menú según el estado del proyecto y nunca ejecuta nada solo. Si falta `PRODUCT.md`, recomienda primero `init`.
- **Sin comando explícito:** se trata como trabajo de diseño general. Una superficie nueva o un rediseño sin `PRODUCT.md` pasa por `init` y después por `new-work`.

### Flujo recomendado para mejorar un sitio existente

Según [docs/improve-design]:

1. Contexto: qué duele y qué no se toca.
2. Opcional, `critique` del objetivo.
3. Un comando enfocado: `polish`, `layout`, `typeset`, `distill`, `clarify`, `bolder` o `quieter`.
4. Solo si se quiere cambiar la identidad, un rediseño por el flujo *new-work*.
5. Verificar en ancho móvil y correr `audit` antes de publicar.

### Flujo *new-work*: rediseño o mundo nuevo

Según [ref/new-work]:

1. **Preguntas.** Hace 2 o 3 preguntas: modo, éxito, qué no se toca y qué haría que el resultado se sintiera mal.
2. **Direcciones.** Para un mundo nuevo, lista siete referencias culturales concretas. Luego corre `impeccable concept-seed --scope direction`, que "reparte" una dirección asignada y retadores. El usuario elige en una página de decisión local con tarjetas y puede re-tirar en modo normal, más seguro o más audaz.
3. **Contrato de dirección.** Escribe en el brief de la superficie un "Direction contract" de unas 150 palabras: THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM y FINISH. Ese contrato nunca debe aparecer en el código que se publica.
4. **Construcción.** Hay dos caminos:
   - **comp-first:** una imagen generada fija la meta y el build se mide contra ella con "gates" numéricos.
   - **code-first:** se construye directo y la ambición queda escrita en el contrato.

   Sin generación de imágenes, solo existe code-first.
5. **Cierre.** Un sub-agente `impeccable-finish-reviewer` revisa el resultado, con dos rondas como máximo. El documentador escribe `DESIGN.md` y `.impeccable/design.json` al final, desde lo construido.

### Qué hace `critique`

Según [ref/critique]:

- Corre dos evaluaciones aisladas, en sub-agentes si los hay. Una es la revisión de diseño (heurísticas, carga cognitiva, personas). La otra es el detector más evidencia del navegador.
- Puntúa las 10 heurísticas de Nielsen de 0 a 4, sobre 40.
- Clasifica los problemas en P0 (bloquea) a P3 (pulido).
- Guarda snapshots en `.impeccable/critique/`, que después lee `polish`.
- Necesita automatización de navegador y un dev server o una URL.

## Qué contexto pide antes de diseñar

Pide **sí o sí un archivo de contexto**. Son tres capas [docs/context] [ref/init] [ref/document].

### 1. `PRODUCT.md`: la verdad del producto

Lo escribe `init`. Antes de preguntar explora el repo. Después entrevista con a lo sumo tres preguntas por ronda, y exige al menos una respuesta o aprobación real antes de escribirlo.

Las secciones de la plantilla:

- `## Platform` (`web`)
- `## Stack`, solo en proyectos nuevos
- `## Users`
- `## Product Purpose`
- `## Positioning`
- `## Operating Context`
- `## Capabilities and Constraints`
- `## Brand Commitments`
- `## Evidence on Hand`
- `## Product Principles`
- `## Accessibility & Inclusion`

Lleva además el comentario `<!-- impeccable:product-schema 1 -->` copiado tal cual.

Qué no entra en `PRODUCT.md`:

- En `init` **no** se pregunta por estética, colores, tipografía ni referencias visuales. Si el usuario da una restricción visual obligatoria, se anota sin expandirla.
- No se inventan testimonios, cifras ni clientes. "Evidence on Hand" debe declarar también lo que falta y no puede fabricarse.

### 2. `DESIGN.md`: el sistema visual

Lo escribe `document` desde el código, o el documentador al final de un rediseño.

- **Frontmatter YAML** con tokens: colors, typography, rounded, spacing, components.
- **Hasta ocho secciones en orden fijo:** Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts.
- **Sidecar** `.impeccable/design.json`, con rampas, sombras, motion, breakpoints y snippets de componentes.
- **De dónde lee los tokens:** primero las custom properties de CSS, después `tailwind.config.*`, después archivos de tokens y estilos globales. Si hay navegador, también los estilos computados.
- **Preguntas:** hace dos rondas cualitativas sobre la metáfora "North Star", la voz, los nombres de color, la elevación y la sensación de los componentes.

### 3. Briefs por superficie: `.impeccable/surfaces/*.md`

Uno por página o ruta, con el propósito, la dirección elegida, el modo y el contrato de dirección.

### Otros archivos

- `.impeccable/config.json` guarda, por ejemplo, `buildPath` (`comp` o `code`), `hook.enabled` y `telemetry` [ref/init] [ref/hooks].
- **Dónde los busca:** `PRODUCT.md` y `DESIGN.md` van en la raíz. impeccable también mira `.agents/context/` y `docs/`, y usa la primera ubicación con contexto [docs/context]. En este repo hay un `docs/`, así que un `docs/PRODUCT.md` también funcionaría.
- **Qué se commitea:** `PRODUCT.md`, `DESIGN.md`, `.impeccable/config.json`, `.impeccable/surfaces/`, `.impeccable/design.json`, `.impeccable/live/config.json` y `.impeccable/critique/ignore.md` [ref/init].
- **Qué se ignora:** el estado de ejecución. El README da la lista de `.gitignore`: `**/.impeccable/config.local.json`, `hook.cache.json`, `hook.pending.json`, `*.png`, `review/`, `questions/`, `live/server.json`, `live/sessions/`, `live/previews/` y otros de `live/` [README].

## Principios que impone

### Piso de oficio

Lo da [ref/craft-floor], y se lee antes de cualquier edición de UI:

- **Contraste:** texto ≥4.5:1 y texto grande ≥3:1. Sobre superficies de color, el texto secundario se tiñe del tono y nunca es gris.
- **Profundidad:** las sombras tienen offset y blur suave. Un halo de color sin offset es decoración.
- **Espaciado:** grupos apretados y separaciones generosas, con más aire arriba de un título que abajo.
- **Tipo:** medida de 65 a 75ch, display de 6rem como máximo, tracking no menor a -0.04em y títulos balanceados.
- **Motion:** un solo momento de autor, y no la misma entrada en todas las secciones. Ease-out exponencial desde un estado ya visible. Se vale ir más allá de transform y opacity: blur, clip-path, mask.
- **Estados:** hover, disabled, loading, error, empty y foco de teclado.
- **Superficies del navegador:** selección de texto, caret, scrollbars, anillos de foco, offset del subrayado y numerales tabulares, todos tematizados desde la paleta.
- **Copy:** el lenguaje del producto. Los controles nombran su acción. Los errores nombran el problema y la salida.

### Tipografía

Según [ref/typeset]:

- Pocos roles y familias, con una jerarquía inconfundible.
- Body de 1rem como mínimo y prosa de 45 a 75ch.
- En texto claro sobre fondo oscuro, compensar con un poco más de interlineado, de tracking y de peso.
- `text-wrap: balance` en títulos y `pretty` en el cuerpo.
- Cargar solo las fuentes usadas, con fallbacks de métricas compatibles.
- En Persuade y Experience, el display puede llevar la voz.

### Color

Según [ref/colorize] y [ref/new-work]:

- Roles y no "bolsas de swatches": canvas, texto, acción, foco, bordes, semánticos.
- OKLCH para paletas web nuevas.
- Una estrategia explícita: Restrained, Committed, Full palette o Drenched.
- El oscuro se diseña y no se invierte.
- "Dark or light is never a default": se decide con una frase sobre la escena física de uso.

### Layout

Según [ref/layout]:

- Test de entrecerrar los ojos.
- Agrupar por proximidad antes de añadir contenedores.
- Ritmo por contraste entre intervalos apretados y generosos.
- Escala de espaciado de base 4.
- Responsive estructural: reordenar o colapsar según lo importante.
- `gap` para el ritmo entre hermanos.
- El orden del DOM y del foco coincide con el visual.

### Motion

Según [ref/animate]:

- **Una tesis de motion:** el momento focal, la continuidad, el feedback y el presupuesto.
- **Duraciones:** 100 a 150 ms para feedback, 150 a 300 ms para cambios de estado, 300 a 500 ms para vistas y 500 a 800 ms para una entrada focal.
- **Curvas:** `cubic-bezier(0.16, 1, 0.3, 1)` y nada de bounce por reflejo.
- **Librería:** usar la librería de motion que ya tenga el proyecto y no añadir dependencias.
- **Robustez:** el contenido es visible por defecto. Los loops se detienen fuera de pantalla.
- **Reduced motion:** cada animación tiene una ruta `prefers-reduced-motion`. Esa ruta da menos movimiento sin borrar el feedback.

### Copy

Según [ref/clarify]:

- Verbo y objeto específicos.
- El mismo término para el mismo concepto en todo el producto.
- Los errores dicen qué falló, por qué y cómo salir.
- Los estados vacíos distinguen el primer uso, sin resultados y fallo.
- Hay que preguntar antes de cambiar afirmaciones factuales.

## Anti-patrones que busca

### Lista "Refuse"

Viene de [ref/craft-floor]. Son defaults de la categoría que el brief puede justificar, salvo los marcados como prohibición:

- Tarjetas iguales de ícono, título y texto como estructura de la página. Las tarjetas anidadas están siempre mal.
- La plantilla de la "métrica de héroe": un número grande, una etiqueta chica y stats de apoyo.
- **Eyebrow o kicker sobre un título. Está prohibido sin excepción.**
- Números de sección como 01 / 02 / 03.
- Un modal sin necesidad.
- Texto con gradiente.
- Glass o blur como decoración.
- `border-left` de color de más de 1px.
- Sombras duras con offset fuera de un mundo neobrutalista.
- Sparklines o anillos de progreso como relleno.
- Monospace como disfraz de lo "técnico".
- Fuente del sistema como display.
- Emoji en lugar de íconos.
- Máscaras geométricas imitando contornos orgánicos.
- Claro u oscuro elegido por categoría.

### Fuentes saturadas

Según [ref/new-work], nombrar una de estas exige una razón que ninguna otra cara cumpla:

- Fraunces, Playfair Display, Cormorant, Lora, Crimson y Newsreader
- Syne
- **Space Grotesk**, Space Mono e IBM Plex
- **Inter como display**
- DM Sans, DM Serif, Outfit, Plus Jakarta Sans e Instrument Sans

### Clusters de look a evitar

Según [ref/new-work]:

- Crema, serif de alto contraste y acento terracota.
- Casi negro con un acento neón y bordes brillantes.
- Hairlines editoriales, serif itálica y labels mono chicos.
- Tinta plana saturada con sombras duras.

### Detector

Según [README] y [docs/detector]:

- Tiene 62 reglas deterministas, sin LLM ni API key. Por ejemplo, `gradient-text` y `overused-font`.
- Se corre con `impeccable detect <ruta|url> [--json]`. Escanea `.tsx`, `.jsx`, `.html`, `.css` y otros.
- El exit code 2 indica hallazgos.
- Se pueden ignorar valores con razón, por ejemplo `ignores add-value overused-font Inter --reason "..."`.
- Del README, los ejemplos canónicos: Inter para todo, gradientes de morado a azul, tarjetas dentro de tarjetas, texto gris sobre color y un tile de ícono redondeado sobre cada título.

## Cómo se instala como skill de Claude Code

Hay tres formas [README] [docs/]:

1. `npx impeccable install` desde la raíz del proyecto. Instala la skill, los sub-agentes y el hook de diseño.
2. Como plugin: `/plugin marketplace add pbakaus/impeccable` y después `/plugin`, Discover, Impeccable.
3. **Copia manual**, que es la forma que usaría el mapa: copiar la carpeta `.claude/skills/impeccable/` del repo a `.claude/skills/impeccable/` del proyecto. En palabras del README: "A manual copy skips the design hook and subagents."

### Qué trae la carpeta en `c8891a9`

```
.claude/skills/impeccable/
  SKILL.md
  reference/*.md                # 41 referencias: comandos, modos, new-work, critique…
  reference/degraded/*.md       # versiones inline de los 4 sub-agentes
  scripts/impeccable            # launcher POSIX sh
  scripts/impeccable.cmd        # launcher para Windows sin sh
  scripts/VERSION               # 0.1.18
  scripts/engine-checksums.txt  # sha256 del motor por plataforma
  scripts/command-metadata.json
  scripts/data/font-index.json  # ~1.1 MB
  scripts/live-browser*.js, scripts/modern-screenshot.umd.js   # ~620 KB, para live
```

Fuera de la carpeta, y no incluidos en la copia manual, hay dos cosas:

- `.claude/agents/impeccable-{asset-producer,documenter,finish-reviewer,manual-edit-applier}.md`. Sin ellos, la skill usa `reference/degraded/`.
- El hook en `.claude/settings.json`. Corre `scripts/impeccable hook` en `SessionStart`, en `PostToolUse` (Edit|Write) y en `Stop`. El instalador lo escribe en `.claude/settings.local.json` en el ámbito de proyecto [ref/hooks].

### El motor binario

Es lo más importante para instalar [launcher] [SKILL]:

- La skill espera correr `scripts/impeccable context` una vez por sesión, y también `detect`, `concept-seed`, `surface-brief`, `critique-storage`, `live-server`…
- El launcher busca un binario en este orden: `bin/<os>-<arch>/` (gitignoreado y no incluido en el repo), `~/.impeccable/bin/`, `~/.impeccable/bin/0.1.18/` y el `PATH`.
- Si no lo encuentra, **lo descarga de `https://github.com/pbakaus/impeccable/releases/download/engine-v0.1.18/impeccable-windows-x64.exe`**. La descarga se verifica con el sha256 de `engine-checksums.txt` y se guarda en `~/.impeccable/bin/0.1.18/`.
- En Windows sin `sh` se usa `impeccable.cmd`.

Es decir: copiar la carpeta no ejecuta nada, pero **el primer uso de la skill descarga y ejecuta un binario fuera del repo**, en `%USERPROFILE%\.impeccable\`.

### Si el motor no corre

La skill tiene un modo degradado [SKILL]. Avisa "Context loading did not run; I'll read the existing project context directly" y sigue leyendo `PRODUCT.md` y `DESIGN.md` a mano.

Se pierden el detector, el reparto de direcciones (`concept-seed`), la página de decisión, los snapshots de `critique` y `live`.

### Red y telemetría

Según [docs/privacy] (https://impeccable.style/privacy) y [README]:

- **Reparto de direcciones:** viene de la API de impeccable, que puede reportar qué tipo de tarjeta se eligió (no los nombres de las direcciones).
- **Chequeo de versión:** una vez al día contra `impeccable.style/api/version`.
- **Cómo apagarlo:** `IMPECCABLE_NO_TELEMETRY=1` o `DO_NOT_TRACK=1`, `"telemetry": false` en `.impeccable/config.json`, e `IMPECCABLE_NO_UPDATE_CHECK=1`.

### Generación de imágenes

Según [docs/image-generation]:

- La herramienta nativa del harness se usa si existe. Los docs nombran Codex y Cursor, no Claude Code.
- Si no, la API de OpenAI con `OPENAI_API_KEY`.
- Sin ninguna de las dos, solo queda el camino code-first.

### Licencia

Apache 2.0 [README]. "Impeccable started from Anthropic's frontend-design skill." Una copia redistribuida debería conservar `LICENSE` y `NOTICE.md` del repo junto a la carpeta, o al menos referenciarlos.

## Encaje con este repo

### Plataforma y stack

`web`, con Vite + React 19. El detector escanea `.tsx` y `.css`, y `live`, `generate` y `detect` son solo para web [ref/routing] [ref/hooks]. No hay nada en contra del stack.

### Tailwind v4

El repo no tiene `tailwind.config.*`. Los tokens viven en `src/tailwind.css` (`@theme inline` sobre las variables `--ui-*` que publica `src/app/theme/tokens-plugin.cjs`).

`document` busca primero las custom properties de CSS, así que debería encontrar el sistema. Ni los docs ni las referencias aclaran si el detector entiende las clases utilitarias de Tailwind (por ejemplo `bg-gradient-to-r … bg-clip-text`). Hay que verificarlo al instalar.

### motion

[ref/animate] pide usar la librería de motion existente y no añadir dependencias. Encaja con `motion` y con `src/lib/motion.tsx`. La ruta `prefers-reduced-motion` obligatoria ya existe en el repo.

### La Escena SVG

Es el roce principal:

- En el camino comp-first, el "hero gate" rechaza como veto duro "an inline SVG past an icon's budget". Allí todo lo pintado debe ser un *plate* raster sacado de la imagen generada: "Anything drawn is a plate" [ref/new-work].
- La Escena es justamente una ilustración SVG por capas ([ADR 0001](../adr/0001-escena-svg-por-capas-sin-webgl.md)).
- Ese gate solo existe en comp-first. Con Claude Code sin `OPENAI_API_KEY` el camino es code-first y el gate no aplica.
- Aun así conviene fijar la Escena y sus Hitos en el brief, como "Brand Commitments" en `PRODUCT.md`, para que "the brief wins" la proteja de un rediseño que la trate como "look viejo".

### La capa WebGL

new-work dice "When the chosen world names a technique (canvas, WebGL, view transitions, generative motion), build the technique itself, not a static imitation of it". Va a favor de la Escena WebGL ([ADR 0003](../adr/0003-escena-webgl-sobre-la-svg.md)).

### Fuentes actuales

- Los títulos usan Space Grotesk 700, que está en la lista de fuentes saturadas. En un rediseño, impeccable pedirá justificarla o reemplazarla.
- El cuerpo usa el `font-sans` del sistema. Inter solo se usa en el CV y la imagen OG (`src/build/`), y "Inter-as-display" es otro default marcado.

### Día y Noche

"Dark or light is never a default" encaja con el Cielo vivo. El tema inicial ya se decide por la hora de Caracas ([ADR 0004](../adr/0004-tema-inicial-por-la-hora-de-caracas.md)), que es exactamente "una escena física de uso".

### Presupuesto de script

impeccable no conoce los 160 kB ([ADR 0006](../adr/0006-presupuesto-de-script-de-160-kb.md)). Hay que darlos como restricción en `PRODUCT.md` (Capabilities and Constraints). [ref/animate] pide medir el rendimiento en los dispositivos objetivo.

### Cifras clave

La plantilla de la "métrica de héroe" (número grande, etiqueta chica) es un default que impeccable rechaza. Choca con la forma de la franja de Impacto. El contenido de las Cifras clave queda fuera del alcance, pero su forma visual sí puede cambiar.

### Eyebrows

Están prohibidos sin excepción. Si el sitio usa etiquetas sobre los títulos de sección, `critique` o el hook las marcarán.

### PC débil

- `critique`, `live`, `generate` y el escaneo de URLs de `detect` necesitan navegador automatizado y dev server local. `live` es explícitamente "only on local checkouts".
- Eso choca con la regla del repo de no correr pruebas pesadas en local.
- Alternativas: `critique` contra la URL del preview de Vercel, `detect` sobre archivos (estático y liviano), y nada de `live`.

### Contexto disponible en el repo para `PRODUCT.md`

`init` lo explora antes de preguntar:

- **Users:** el encabezado de [`GLOSSARY.md`](../../GLOSSARY.md): recruiters y hiring managers.
- **Product Purpose:** la Señal de interés como medida de éxito.
- **Brand Commitments:** los Hitos, el Cielo vivo, el Clima y el Viaje de cámara del glosario.
- **Capabilities and Constraints:** los ADRs.
- **Evidence on Hand:** las Experiencias, los Proyectos, las Cifras clave y la regla del Dato pendiente, que coincide con "no fabricar evidencia".

Lo único que el repo no responde es "Positioning": qué distingue a Diego. Eso es una pregunta para Diego.

## Para el ticket que la instale

1. En la rama `research/impeccable`, copiar `.claude/skills/impeccable/` del commit fijado (o del release que se elija) a `.claude/skills/impeccable/`. Agregar `LICENSE` y `NOTICE.md` del repo dentro de la carpeta.
2. Decidir si se aceptan la descarga del motor a `%USERPROFILE%\.impeccable\bin\0.1.18\` y sus llamadas de red. Si no se aceptan, la skill corre en modo degradado.
3. No instalar el hook ni los sub-agentes con la copia manual. Si se quieren, copiar `.claude/agents/impeccable-*.md` y fusionar el hook en `.claude/settings.json`, que hoy tiene los hooks de CodeGraph.
4. Agregar al `.gitignore` las entradas de `.impeccable/` del README.
5. Exportar `IMPECCABLE_NO_TELEMETRY=1` e `IMPECCABLE_NO_UPDATE_CHECK=1` si no se quiere tráfico.
6. Primer uso: `/impeccable init`, que escribe `PRODUCT.md` desde el repo y pregunta solo lo que falta. Después `/impeccable document` para fijar el sistema actual como "antes".

## No verificado

- La lista completa de las 62 reglas del detector. Ni los docs ni las referencias la enumeran.
- Si el detector entiende clases de Tailwind.
- Si Claude Code cuenta como "harness-native image tool". Los docs no lo nombran.
- Qué datos exactos manda `concept-seed` a la API, más allá de lo que dice la política de privacidad.
