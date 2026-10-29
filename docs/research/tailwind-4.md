# Migración a Tailwind 4

Investigación para el issue #51 (hijo del mapa #49). Fecha: 2026-10-29.

**Pregunta:** ¿qué implica migrar el portafolio de Tailwind 3.4 a Tailwind 4 con su configuración actual (`tailwind.config.cjs` en CommonJS, colores con variables CSS, fuente `display`, `darkMode: 'class'`, plugin `addBase` que inyecta `tokens.json`, `@layer`/`@apply` en `src/tailwind.css`, PostCSS con `autoprefixer`, Vite 8 con Rolldown)?

## Respuesta corta

La migración es chica y sin bloqueos. La versión actual es **Tailwind 4.3.3** (`npm view tailwindcss version`).

1. **El config actual funciona tal cual con `@config`**, plugin `addBase` incluido. Lo verifiqué: el build lo cargó y emitió `:root{--ui-…}` y `.dark{--ui-…}`. Lo único que no soporta `@config` es `corePlugins`, `safelist` y `separator`, y este config no usa ninguno.
2. **Destino recomendado: configuración en CSS** (`@theme inline` + `@custom-variant dark`), con los tokens **todavía en `tokens.json`**. Se publican con un plugin local de 10 líneas cargado con `@plugin`. Los tests de contraste no cambian. Lo probé y compila igual.
3. **Usar `@tailwindcss/vite`**, que soporta Vite 8 desde la 4.2.2 (peer `vite: ^5.2.0 || ^6 || ^7 || ^8`). Compila bien con Rolldown (build verificado con Vite 8.3.5). Se borran `postcss.config.cjs`, `autoprefixer` y la dependencia directa de PostCSS para Tailwind.
4. **Hay pocos cambios por defecto que nos toquen**: `shadow-sm` → `shadow-xs` (1 uso), `rounded` → `rounded-sm` (1 uso), el cursor de los `<button>` vuelve a `default` (6 botones), `space-y-*` cambia de selector (22 usos, equivalentes aquí) y `hover:` solo aplica con `(hover: hover)`. El color de borde por defecto **no** nos afecta: todos los `border` tienen color explícito.
5. **El CSS crece ~1,2 kB comprimido**: de **5,3 kB** a **6,4 kB** con gzip (de 20,3 a 28,2 kB sin comprimir). Queda muy por debajo del presupuesto de 15 kB de Lighthouse.
6. **`npx @tailwindcss/upgrade` sirve de punto de partida, pero no se puede aplicar a ciegas.** Rompe `Badge` (renombra la variante `'outline'` a `'outline-solid'`), deja dos tests rojos y agrega un bloque de compatibilidad de bordes que aquí sobra.

## Hechos clave (con fuente)

### 1. `@config` con el config actual

- "JavaScript config files are no longer auto-detected". Se cargan con `@config "../../tailwind.config.js";`. [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- "The `corePlugins`, `safelist`, and `separator` options from the JavaScript-based config are not supported in v4.0." [Functions and directives, Compatibility](https://tailwindcss.com/docs/functions-and-directives#compatibility)
- "`@config` and `@plugin` directives may be used in conjunction with `@theme`, `@utility` […]. Things defined in CSS will be merged where possible and otherwise take precedence over those defined in configs, presets, and plugins." [mismo lugar]
- `@config` y `@plugin` existen "solely for compatibility with Tailwind CSS v3.x". `theme()` está "deprecated". [mismo lugar]
- **Verificado:** el upgrade tool no pudo convertir el config a CSS ("could not be automatically migrated […] so your CSS has been updated to load your existing configuration file") y agregó `@config '../tailwind.config.cjs';`. El build (`vite build` con `@tailwindcss/postcss`) salió bien, con `:root{--ui-page:#5ea8dc;…}`, `.dark{--ui-page:#050a1a;…}`, `.bg-page`, `.border-line{border-color:var(--ui-border)}` y `.font-display` correctos. Que sea `.cjs` dentro de un paquete `"type": "module"` no molesta.
- `darkMode: 'class'` vía `@config` genera `.dark\:x:is(.dark *)`, el mismo selector que en v3.4.
- **Nada deja de funcionar.** El costo es depender de una capa de compatibilidad (`@config`) que la documentación marca como legado.

### 2. Lo mismo en CSS (`@theme`, `@custom-variant`, `@layer base`) y los tokens

- `@theme` define tokens que generan utilidades: `--color-*` → `bg-*`, `text-*`, `border-*`; `--font-*` → `font-*`. Extender es definir un nombre nuevo; `--color-*: initial` borra la paleta por defecto. [Theme variables](https://tailwindcss.com/docs/theme)
- "When a theme variable references another variable, use `@theme inline`". Sin `inline`, `var()` se resuelve donde se define la variable de tema y puede dar valores inesperados. [Theme variables](https://tailwindcss.com/docs/theme)
- Las variables de `@theme` "are also required to be defined top-level and not nested under other selectors or media queries". Para variables que no generan utilidades se usa `:root` normal. [Theme variables](https://tailwindcss.com/docs/theme)
  - Por eso **`@theme` no puede reemplazar el `.dark { … }`** del plugin. Los valores de Día y de Noche siguen siendo variables `--ui-*` en `:root` y `.dark`, y `@theme inline` solo mapea `--color-page: var(--ui-page)`, etc.
- Modo oscuro por clase: `@custom-variant dark (&:where(.dark, .dark *));`. [Dark mode](https://tailwindcss.com/docs/dark-mode)
- `@plugin` "accepts either a package name or a local path" y carga plugins JS heredados. [Functions and directives](https://tailwindcss.com/docs/functions-and-directives)
- `@layer base` sigue existiendo como capa CSS nativa. Lo que cambia es `@layer utilities`/`@layer components`: "are no longer hijacked", y se usa `@utility`. [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)

**Opciones para `tokens.json`** (la decisión pendiente del mapa #49):

| Opción | Cómo | Pros | Contras |
|---|---|---|---|
| A. `@config` tal cual | `@config '../tailwind.config.cjs'` | Cero cambios en el config | Capa de compatibilidad; el config JS queda vivo |
| **B. CSS + `@plugin` local (recomendada)** | `@theme inline` para nombres y fuente; `src/app/theme/tokens-plugin.cjs` con el mismo `addBase` lee `tokens.json` | Sigue habiendo **una sola fuente** (JSON) para CSS y tests; se borra `tailwind.config.cjs` | Usa `@plugin` (también compatibilidad), aunque es una API estable y mínima |
| C. Tokens a CSS | Valores en `:root`/`.dark` dentro de `tailwind.css` | Todo en CSS, sin JS | Los tests de contraste tendrían que parsear CSS o duplicar valores: **se pierde la fuente única** |

Probé la opción B en una copia desechable (build OK). El `src/tailwind.css` queda así:

```css
@import 'tailwindcss';
@plugin './app/theme/tokens-plugin.cjs';
@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
    --color-page: var(--ui-page);
    --color-primary: var(--ui-primary);
    --color-on-primary: var(--ui-on-primary);
    --color-amber: var(--ui-amber-text);
    --color-amber-decor: var(--ui-amber-decor);
    --color-ink: var(--ui-text);
    --color-muted: var(--ui-text-muted);
    --color-surface: var(--ui-surface);
    --color-line: var(--ui-border);
    --color-focus-inner: var(--ui-focus-inner);
    --color-focus-outer: var(--ui-focus-outer);
    --font-display: "Space Grotesk", "Space Grotesk Fallback", "Space Grotesk Fallback Android", system-ui, sans-serif;
}
/* …las @font-face y el @layer base actuales, sin cambios… */
```

`tokens-plugin.cjs` es el mismo `plugin(({ addBase }) => addBase({ ':root': vars('day'), '.dark': vars('night') }))` que hoy vive en `tailwind.config.cjs`. `tokens.ts` y `ui-tokens.test.ts` no cambian; solo hay que actualizar el comentario de `tokens.ts`, que menciona `tailwind.config.cjs`.

Notas:
- `--color-amber` convive con la escala por defecto `amber-50…950`: `text-amber` usa el token y `text-amber-500` la paleta. En v3, `extend.colors.amber` como string reemplazaba la escala; aquí no se usa la escala, así que da igual.
- `.container-section` y `.text-balance` (custom) **no se usan en ningún componente**. Además, `text-balance` ya es una utilidad nativa desde v3.4. Se pueden borrar en vez de migrarlas a `@utility`.

### 3. `@tailwindcss/vite` frente a `@tailwindcss/postcss`, `autoprefixer` y Rolldown

- La guía recomienda el plugin de Vite: "use the dedicated plugin `@tailwindcss/vite` […] instead of the PostCSS plugin". [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide), [Instalación con Vite](https://tailwindcss.com/docs/installation/using-vite)
- PostCSS: "imports and vendor prefixing is now handled for you automatically, so you can remove `postcss-import` and `autoprefixer`." [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- Changelog 4.2.2 (2026-03-18): "Add support for Vite 8 in `@tailwindcss/vite`" ([#19790](https://github.com/tailwindlabs/tailwindcss/pull/19790)). [CHANGELOG](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md)
- `npm view @tailwindcss/vite@4.3.3`: `peerDependencies: { vite: "^5.2.0 || ^6 || ^7 || ^8" }`; depende de `tailwindcss`, `@tailwindcss/node` y `@tailwindcss/oxide` (sin PostCSS).
- **Verificado:** con `@tailwindcss/vite@4.3.3` + Vite 8.3.5 (Rolldown), el build tardó 1,0 s (2,8 s en v3 con PostCSS) sin errores ni avisos.
- **`autoprefixer` sobra.** Comparé los prefijos del CSS final: v4 mantiene `-webkit-backdrop-filter`, `-webkit-text-size-adjust`, `-webkit-font-smoothing`, etc. Los `-moz-placeholder` que desaparecen son irrelevantes para los navegadores mínimos de v4.
- Con el plugin de Vite se borra `postcss.config.cjs` y salen `autoprefixer` y (salvo otro uso) `postcss` de `devDependencies`. El upgrade tool, en cambio, eligió `@tailwindcss/postcss` porque ya había un `postcss.config.cjs`; también funciona, pero no es la vía recomendada para Vite.

### 4. Cambios por defecto que afectan a este código y qué hace `npx @tailwindcss/upgrade`

Fuente de todos los cambios: [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide). Busqué con grep en `src/` (sin `__tests__`) cada patrón afectado:

| Cambio v4 | Usos en el código | Efecto | Acción |
|---|---|---|---|
| `shadow-sm` (v3) = `shadow-xs` (v4) | `MainHeader.tsx:67` (sombra al hacer scroll) | Sin renombrar, la sombra se vería más fuerte | Renombrar a `shadow-xs` (lo hace el tool); actualizar `Home.test.tsx:45` (`/shadow-sm/`) |
| `rounded` (v3 0,25rem) = `rounded-sm` (v4) | `MainHeader.tsx:55` (`linkBase`) | La forma bare sigue funcionando por compatibilidad | Renombrar a `rounded-sm` (lo hace el tool) |
| Borde por defecto `currentColor` en vez de `gray-200` | 21 `border`/`border-b`/`border-2`, **todos con color explícito** (`border-line`, `border-primary`, `border-white/40`, `border-slate-*`, `before:border-primary`) | Ninguno | **No** agregar el bloque de compatibilidad que inserta el tool |
| `ring` 3px → 1px, color `currentColor` | 0 usos (el foco usa `outline` + `box-shadow` propios) | Ninguno | — |
| `outline-none` → `outline-hidden`; `outline` = 1px | 0 usos como clase | Ninguno | — |
| `space-y-*` usa `:not(:last-child)` + `margin-block-end` en vez de `~` + `margin-top` | 22 usos (`Home.tsx:67` `space-y-[20vh] md:space-y-[35vh]`, `ProjectDetail.tsx` ×12, `Block.tsx:31`, `Hero.tsx` ×2, etc.) | Equivalente salvo que el último hijo esté oculto o haya márgenes propios que colapsen. Ningún contenedor `space-y` tiene hijos con `hidden`/`md:hidden` | Confirmar con el diff visual del mapa |
| Preflight: `<button>` con `cursor: default` | 6 `<button>` (`MainHeader.tsx`: menú, tema, idioma; `Gallery.tsx`: cerrar, anterior/siguiente). Ninguno tiene `cursor-pointer` | **Regresión visible**: dejan de mostrar la mano (el de la galería conserva `cursor-zoom-in`) | Agregar en `@layer base` `button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer; }` como sugiere la guía, o `cursor-pointer` por botón |
| `hover:` solo con `@media (hover: hover)` | 17 usos (`hover:border-primary`, `hover:opacity-90`, `hover:underline`…) | En táctil deja de quedar el hover "pegado" tras tocar. Es una mejora | Ninguna |
| `transition`/`transition-colors` incluyen `outline-color` | 8 usos | El color del `outline` de foco viene de `:focus-visible` (incondicional), así que no hay animación rara al enfocar | Ninguna |
| Atributo `hidden` gana a `block`/`flex` | 0 usos del atributo | Ninguno | — |
| `aspect-[16/9]`, `z-[100]`, `aspect-[2/1]` | `ProjectCover.tsx`, `Gallery.tsx` | Siguen funcionando; el tool los canonicaliza (`aspect-video`, `z-100`, `aspect-2/1`) | Cosmético |
| Opacidad con colores `var()` (`bg-primary/50`) | 0 usos | — | (En v4 funcionaría vía `color-mix`; en v3 no) |
| Deprecadas (`bg-opacity-*`, `flex-shrink-*`, `overflow-ellipsis`…), `bg-[--var]`, apilado de variantes, gradientes, `transform-none`, `container`, `placeholder` | 0 usos | — | — |

**Hallazgo aparte:** `MainHeader.tsx:183` usa `animate-fade-in`, que no está definida ni en v3 ni en v4. Hoy no hace nada. No lo causa la migración, pero conviene saberlo.

**Qué hace `npx @tailwindcss/upgrade@4.3.3`** (lo corrí en una copia con git y su propio commit base):
- Requiere Node 20+ y la guía recomienda correrlo "in a new branch". [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- Cambia `@tailwind base/components/utilities` por `@import 'tailwindcss'` y agrega `@config '../tailwind.config.cjs'` (no supo convertir el config por el plugin y el `require` de JSON).
- Inserta el bloque de compatibilidad de `border-color: var(--color-gray-200, currentcolor)`, que aquí sobra.
- Convierte `@layer components { .container-section }` y `@layer utilities { .text-balance }` en `@utility`.
- `package.json`: `tailwindcss` ^4.3.3, agrega `@tailwindcss/postcss`, quita `autoprefixer`; `postcss.config.cjs` pasa a `'@tailwindcss/postcss': {}`.
- Plantillas: `shadow-sm`→`shadow-xs`, `rounded`→`rounded-sm`, `aspect-[16/9]`→`aspect-video`, `aspect-[1/2]`→`aspect-1/2`, `aspect-[2/1]`→`aspect-2/1`, `z-[100]`→`z-100`.
- **Falso positivo:** en `Badge.tsx` reescribió el **tipo y el string** `'outline'` → `'outline-solid'` (`variant?: 'default' | 'outline-solid'`). No es una clase, es el valor de una prop. Resultado: `tsc` falla (`ui.test.tsx(16,20): Type '"outline"' is not assignable…`) y `Badge variants` falla en Vitest. No tocó los tests.
- Vitest tras el tool: **2 fallos / 162 OK** (`Badge variants` y el `toMatch(/shadow-sm/)` de `Home.test.tsx`). Los dos se arreglan revirtiendo el cambio de `Badge` y actualizando la expresión regular.
- `Badge` solo se usa en tests (ningún componente lo importa). Su candidato natural es el issue #47 (quitar lo que no se usa), no esta migración.

### 5. Tamaño del CSS frente al presupuesto de 15 kB

- El presupuesto (`lighthouserc.json`) es `resource-summary:stylesheet:size` ≤ 15000 bytes, mediana de 5 corridas. `resource-summary` suma el `transferSize` de cada recurso, y el servidor estático de LHCI usa `compression()`: "`this._app.use(compression());`". [fallback-server.js](https://github.com/GoogleChrome/lighthouse-ci/blob/main/packages/cli/src/collect/fallback-server.js). Así que lo que cuenta es el tamaño **comprimido (gzip)**.
- Medí el CSS de `dist/assets/index-*.css` (todo el CSS de la app: Tailwind + `styles.css` + `scene.css` + `@font-face`):

| Build | Sin comprimir | gzip -9 | brotli |
|---|---|---|---|
| v3.4.17 actual (PostCSS + autoprefixer) | 20 251 B | **5 278 B** | 4 646 B |
| v4.3.3 vía upgrade tool (`@config` + `@tailwindcss/postcss` + bloque de bordes) | 28 304 B | 6 459 B | 5 681 B |
| v4.3.3 opción B (`@tailwindcss/vite` + `@theme inline` + `@plugin`) | 28 150 B | **6 429 B** | 5 654 B |

- **+1,15 kB gzip (+22 %)**, y el CSS queda en ~43 % del presupuesto. De dónde sale el aumento en el CSS de v4: 42 `@property` (~2,6 kB sin comprimir); el `@layer properties` con un `@supports` de respaldo para navegadores sin `@property`; el `@layer theme` con las variables usadas (~1,5 kB); y un Preflight más largo (`::file-selector-button`, `::-webkit-datetime-edit-*`, etc.).
- Vite reporta 6,47 kB gzip, consistente con la tabla.

## Recomendación para el issue de implementación

1. Partir de `npx @tailwindcss/upgrade` en una rama nueva y corregir sobre su salida:
   - revertir el cambio de `Badge.tsx` (`'outline-solid'` → `'outline'`);
   - quitar el bloque de compatibilidad de `border-color`;
   - pasar de `@tailwindcss/postcss` a `@tailwindcss/vite` (agregar `tailwindcss()` en `vite.config.ts` y borrar `postcss.config.cjs`; sacar `postcss` de `devDependencies` si nada más lo usa).
2. Reemplazar `@config` por la opción B: `@custom-variant dark`, `@theme inline` con los 11 colores y `--font-display`, y `@plugin './app/theme/tokens-plugin.cjs'`. Borrar `tailwind.config.cjs` y actualizar el comentario de `tokens.ts`.
3. Borrar `.container-section` y `.text-balance` (sin uso; `text-balance` es nativa).
4. Restaurar `cursor: pointer` en botones con el snippet de la guía.
5. Actualizar `Home.test.tsx:45` a `/shadow-xs/`.
6. Verificar con el script desechable de Playwright del mapa (home y un Caso de estudio, Día y Noche, móvil y escritorio). Mirar sobre todo los `space-y` de `ProjectDetail` y `Home`, la sombra de la barra y los bordes de los bloques.
7. Lighthouse: el CSS debería medir ~6,4 kB; no hace falta tocar el presupuesto.

## Fuentes

- [Tailwind CSS v4 Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Functions and directives (incl. Compatibility)](https://tailwindcss.com/docs/functions-and-directives)
- [Theme variables](https://tailwindcss.com/docs/theme)
- [Dark mode](https://tailwindcss.com/docs/dark-mode)
- [Installing with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [CHANGELOG de tailwindcss](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md) (4.2.2: soporte de Vite 8)
- `npm view` de `tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/postcss`, `@tailwindcss/upgrade` (todas 4.3.3, 2026-10-29)
- [LHCI fallback-server.js](https://github.com/GoogleChrome/lighthouse-ci/blob/main/packages/cli/src/collect/fallback-server.js) (compresión del servidor estático)
- Verificación empírica en copias desechables del repo (`git archive` de `462b714`): `pnpm install --frozen-lockfile`, `vite build`, `npx @tailwindcss/upgrade@4.3.3`, `tsc --noEmit`, `vitest run`. Nada de eso se commiteó.
