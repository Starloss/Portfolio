# Fuentes display auto-hospedadas: candidatas y costo

Investigación para el issue #4 (hijo del mapa #1). Fecha: 2026-10-24.

**Pregunta:** ¿qué 3–4 tipografías display con licencia libre sirven para los títulos del portafolio y cuánto cuesta auto-hospedarlas sin romper Lighthouse móvil ≥90 (LCP/CLS)?

## Respuesta corta

- **Recomendada: Bricolage Grotesque** en su corte display (`opsz` 48–96), un solo peso (700), como archivo propio: **≈22 KiB** woff2 latin, con preload.
- Alternativas: **Space Grotesk** (la más barata, 12,5 KiB), **Fraunces** (serif cálida, ≈17–18 KiB con corte display propio) y **Unbounded** (ancha, de póster; 20,6 KiB, pero la más difícil en móvil).
- **Cuerpo:** mantener la pila del sistema (`font-sans` de Tailwind). Cuesta 0 bytes y deja la fuente display como la única fuente crítica.
- **Carga:** archivo propio en `src/assets/fonts/`, `@font-face` con `font-display: swap` y `unicode-range` latin, `<link rel="preload">` en `index.html` y una fuente de respaldo con métricas ajustadas (`size-adjust`, `ascent-override`, etc.) para Arial y Roboto.
- **Hallazgo clave:** los archivos estáticos y `wght` de Fontsource y Google Fonts traen el corte de **texto** (`opsz` 14), no el display. Para Bricolage y Fraunces el corte display solo se consigue con el archivo `opsz` completo (75 / 66 KiB) o generando un archivo propio (~17–22 KiB). Por eso conviene usar archivos propios y no `@fontsource`.

## Método

- Los metadatos (licencia, ejes, subsets) vienen de la API de Fontsource (`api.fontsource.org/v1/fonts/<id>` y `/v1/variable/<id>`).
- Los tamaños de archivo vienen de los listados de jsDelivr de los paquetes npm `@fontsource/*@5.3.0` y `@fontsource-variable/*@5.3.0`, y de los woff2 que sirve la API CSS2 de Google Fonts.
- Bajé los woff2 y los revisé con fontTools 4.60.2: cobertura de glifos, tablas `fvar`, `hhea` y `OS/2`, y anchos de avance.
- Las instancias con `opsz` fijo las generé con `fontTools.varLib.instancer` y las comparé con lo que sirve Google Fonts al pedir `opsz` explícito. Los tamaños coinciden (21,8 frente a 21,8 KiB; 16,9 frente a 16,8 KiB).
- Los valores de `size-adjust` siguen la fórmula de Chrome for Developers (ver Fuentes). El ancho medio se pondera con una frase en español del portafolio y no con frecuencias del inglés. Los comparé con Arial Bold y Times New Roman Bold de Windows, y con Roboto y Noto Serif 700 de Google Fonts.

## Comparativa

Todas son **OFL-1.1**. Los `OFL.txt` de `google/fonts` revisados no declaran *Reserved Font Name*, así que se pueden subsetear o instanciar sin renombrar. Todas cubren **todo el español** en el subset `latin` (U+0000–00FF + U+2000–206F + €): `á é í ó ú ü ñ`, sus mayúsculas, `¿ ¡ « » — – “ ” ‘ ’ €`. No falta ningún glifo.

Tamaños del woff2 **latin** (KiB):

| Fuente | Variable (ejes) | Estático 700 | Variable `wght` (Fontsource) | Corte display propio, 700 | Otros |
|---|---|---|---|---|---|
| **Bricolage Grotesque** | sí: `opsz` 12–96, `wdth` 75–100, `wght` 200–800 | 21,9 (*opsz 14*) | 40,4 (*opsz 14*) | **21,8** (opsz 96) / 21,9 (opsz 48) | `opsz.css` de Fontsource: 75,1; opsz 32–96 a 700: 37,4 |
| **Space Grotesk** | sí: `wght` 300–700 | **12,5** | 21,8 | n/a (sin `opsz`) | |
| **Fraunces** | sí: `opsz` 9–144, `wght` 100–900, `SOFT`, `WONK` | 17,8 (*opsz 14*) | 35,8 (*opsz 14*) | **16,9** (opsz 144) / 18,0 (opsz 72) | `opsz`: 65,7; `full`: 118,2 |
| **Unbounded** | sí: `wght` 200–900 | 20,6 | 49,7 | n/a (sin `opsz`) | |
| *Inter (cuerpo opcional)* | `wght` 100–900 | 23,8 (400: 23,1) | 47,1 | | |

Descartadas tras medir:

- **Syne** (13,7 KiB a 700): se ensancha mucho al subir de peso. A 700 su `size-adjust` frente a Arial Bold es 114 %.
- **Sora** (14,8 KiB): correcta, pero con poco carácter para títulos.
- **Archivo** (14,2 KiB): neutra. Su eje `wdth` cuesta 88 KiB.

### Bricolage Grotesque (recomendada)

- **Carácter:** grotesca con raíces francesas y británicas (Antique Olive, Grotesque Nº 9) y un toque "wonky". Sus tamaños pequeños usan ink traps exagerados. Diseño de Mathieu Triay, 2023.
- **Por qué encaja:** tiene personalidad sin ser un chiste. Es cálida y un poco irreverente, lo que acompaña bien una ilustración estilizada de Caracas, y se lee perfecto en tamaños grandes. El eje `wdth` (75–100) permite una versión condensada si palabras largas como "desarrollador" o "Experiencia" no caben a 360 px. Eso cuesta más bytes; mejor decidirlo en el prototipo.
- **Ojo:** el carácter display (contraformas más cerradas, espaciado más apretado) solo aparece con `opsz` alto. A 700, el ancho medio baja de 0,493 em (opsz 14) a 0,446 em (opsz 96). El estático de Fontsource y Google es el de opsz 14.
- **Cuerpo:** system UI.

### Space Grotesk

- **Carácter:** proporcional derivada de Space Mono. Conserva detalles idiosincráticos de la monoespaciada (Florian Karsten, 2018).
- **Por qué encaja:** dice "desarrollador" sin palabras y es la más barata: 12,5 KiB un peso, o 21,8 KiB variable 300–700. Sus métricas son casi iguales a las de Arial Bold (`size-adjust` 101 %), así que el riesgo de CLS es mínimo.
- **Contra (opinión):** es muy común en portafolios de desarrolladores y se diferencia menos.
- **Cuerpo:** system UI. Aquí `@fontsource/space-grotesk` sirve tal cual, porque no hay eje `opsz` que perder.

### Fraunces

- **Carácter:** serif "Old Style" suave, inspirada en Windsor, Souvenir y Cooper. Tiene ejes de suavidad (`SOFT`) y de glifos "wonky" (`WONK`). Diseño de Undercase Type.
- **Por qué encaja:** es la opción cálida. Combina con la luz ámbar de las ventanas y el atardecer, y contrasta con la geometría de las Torres de Parque Central.
- **Contra:** se lee más editorial que "Lead Developer". Igual que Bricolage, los archivos de Fontsource traen el corte opsz 14, así que el corte display exige un archivo propio (16,9–18 KiB).
- **Cuerpo:** system UI. Una serif display sobre una sans de sistema es un contraste clásico.

### Unbounded

- **Carácter:** sans display ancha y redondeada, de póster, con 8 pesos (NaN, 2022).
- **Por qué podría encajar:** es la de más impacto para un nombre corto en el Hero.
- **Contra:**
  - Es la más ancha: `size-adjust` de 131 % frente a Arial Bold y 140 % frente a Roboto.
  - Las palabras largas del español se parten pronto en móvil, y ajustar el respaldo es lo más difícil (`ascent-override` cae a ~71–76 %).
  - El variable cuesta 49,7 KiB.
- **Uso recomendado:** solo para el nombre o titulares muy cortos.
- **Cuerpo:** system UI.

## Fontsource o archivos propios

**Archivos propios.** Razones:

1. **El corte display de Bricolage y Fraunces no está en los archivos baratos de Fontsource.** `@fontsource/<f>` y `@fontsource-variable/<f>` (`wght`) fijan `opsz` en 14. Lo comprobé midiendo anchos: los valores coinciden con opsz 14 y no con opsz 96 o 144. El corte display requiere `@fontsource-variable/<f>/opsz.css`, que pesa 75,1 KiB (Bricolage) o 65,7 KiB (Fraunces), frente a ~17–22 KiB de un archivo propio de un peso.
2. **El preload.** Fontsource documenta el preload importando el woff2 con `?url` dentro de un componente. En esta SPA eso se ejecuta después del JS y no adelanta nada. Un `<link rel="preload">` en `index.html` sí lo hace. Vite 5 reescribe `<link href>` de `index.html` como asset con hash (`assetAttrsConfig = { link: ['href'], … }` en `packages/vite/src/node/plugins/html.ts`, v5.4.11). Así el preload y el `url()` del CSS apuntan al mismo archivo con hash. Esto hay que verificarlo en el build, porque una URL distinta descargaría la fuente dos veces.
3. **Sin dependencia nueva** y control total del subset y del `unicode-range`.

Para Space Grotesk o Unbounded, Fontsource sería aceptable, pero el punto 2 sigue aplicando.

**Cómo obtener el archivo** (para la fase de implementación, no ahora):

- **Opción A, rápida:** pedirlo a la API CSS2 de Google Fonts con el `opsz` explícito (`family=Bricolage+Grotesque:opsz,wght@96,700`) y guardar el woff2 del bloque `/* latin */`. Ya viene subseteado a latin (21,8 KiB).
- **Opción B, reproducible:** partir del variable oficial y fijar ejes con `fontTools.varLib.instancer` (`opsz=96, wght=700`), luego subsetear con `pyftsubset` al rango latin. Da el mismo tamaño.
- **En ambos casos:** guardar `OFL.txt` junto a la fuente en `src/assets/fonts/`. La OFL permite redistribuir siempre que cada copia lleve el aviso de copyright y la licencia.

## Estrategia de carga

1. **Un solo archivo crítico:** la fuente display a 700, subset latin. Si hace falta un segundo peso (por ejemplo 500 para subtítulos), sin preload. Con 2 o más pesos de Bricolage, el variable propio con `opsz` fijo y `wght` 500–800 cuesta 37,7 KiB. Compensa a partir de 2 pesos.
2. **`@font-face`** en `src/tailwind.css` (`@layer base`), con `font-display: swap` y el `unicode-range` latin de Google/Fontsource:
   `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`.
3. **Preload** en el `<head>` de `index.html`: `<link rel="preload" as="font" type="font/woff2" crossorigin href="/src/assets/fonts/bricolage-display-700.woff2">`.
   - `crossorigin` es obligatorio aunque la fuente sea del mismo origen.
   - Solo esa fuente: "Avoid preloading all font files" (Fontsource); el preload "ignores `unicode-range`" (web.dev).
   - El titular del Hero es probablemente el elemento LCP, porque el `<svg>` inline no es candidato a LCP según web.dev. Adelantar la fuente lo favorece directamente.
4. **`swap` frente a `optional`:**
   - **`optional`** es lo más rápido y nunca produce cambio de diseño. Pero si la fuente llega tarde, esa visita se queda con la del sistema. Es justo lo que pasa en una conexión móvil lenta, el escenario que emula Lighthouse.
   - **`swap`** siempre muestra la identidad, a cambio de un posible salto. Ese salto se neutraliza con el punto 5.
   - **Recomendación:** `swap` + preload + respaldo ajustado. Si Lighthouse CI muestra CLS atribuible a la fuente, pasar a `optional`. Las dos opciones aprueban la auditoría *font-display* de Lighthouse (`swap`, `optional`, `fallback`).
5. **Respaldo con métricas ajustadas.** Son dos `@font-face` locales, porque Android no tiene Arial (solo Roboto) y el ajuste depende de la fuente local. En la pila de Tailwind van en orden; si Arial no existe, ese `@font-face` falla y entra el siguiente.

   ```css
   @font-face {
     font-family: 'Bricolage Fallback';
     src: local('Arial Bold'), local('Arial-BoldMT'), local('Arial');
     font-weight: 700;
     size-adjust: 90.6%; ascent-override: 102.6%; descent-override: 29.8%; line-gap-override: 0%;
   }
   @font-face {
     font-family: 'Bricolage Fallback Android';
     src: local('Roboto Bold'), local('Roboto-Bold'), local('Roboto');
     font-weight: 700;
     size-adjust: 96.8%; ascent-override: 96.0%; descent-override: 27.9%; line-gap-override: 0%;
   }
   /* tailwind.config: fontFamily.display = ['"Bricolage Grotesque"', '"Bricolage Fallback"', '"Bricolage Fallback Android"', 'system-ui', 'sans-serif'] */
   ```

   Valores calculados a 700 (rehacer si cambia el peso o el `opsz`):

   | Fuente (700) | Respaldo | size-adjust | ascent | descent | line-gap |
   |---|---|---|---|---|---|
   | Bricolage opsz 96 | Arial Bold | 90.6% | 102.6% | 29.8% | 0% |
   | Bricolage opsz 96 | Roboto 700 | 96.8% | 96.0% | 27.9% | 0% |
   | Bricolage opsz 48 | Arial Bold | 96.4% | 96.5% | 28.0% | 0% |
   | Bricolage opsz 48 | Roboto 700 | 103.0% | 90.3% | 26.2% | 0% |
   | Space Grotesk | Arial Bold | 101.0% | 97.4% | 28.9% | 0% |
   | Space Grotesk | Roboto 700 | 107.9% | 91.2% | 27.1% | 0% |
   | Fraunces opsz 72 | Times New Roman Bold | 106.6% | 91.8% | 23.9% | 0% |
   | Fraunces opsz 72 | Noto Serif 700 | 90.5% | 108.1% | 28.2% | 0% |
   | Unbounded | Arial Bold | 130.7% | 76.2% | 18.8% | 0% |
   | Unbounded | Roboto 700 | 139.6% | 71.3% | 17.5% | 0% |

   **Soporte en navegadores:**
   - `size-adjust` es Baseline (todos los navegadores desde septiembre de 2023).
   - `ascent-override`, `descent-override` y `line-gap-override` **no** son Baseline (MDN: "Limited availability"). En Safari solo se aplica el `size-adjust`, que es lo que más pesa.
   - Los valores son un punto de partida. Hay que validarlos superponiendo fuente y respaldo en el prototipo del Hero.
6. **Caché:** con el archivo en `src/assets/`, Vite le pone hash al nombre y Vercel lo sirve desde su CDN. web.dev advierte que auto-hospedar solo gana claramente con CDN y HTTP/2, y Vercel cumple ambos.
7. **No incrustar la fuente** como data-URI en el CSS: web.dev lo desaconseja. Los woff2 de >4 KiB superan el `assetsInlineLimit` de Vite, así que no se incrustan solos.

## Costo total estimado (recomendación)

| Recurso | Bytes |
|---|---|
| Bricolage Grotesque display 700, latin (preload) | ~21,8 KiB |
| Cuerpo (system UI) | 0 |
| **Total crítico** | **~22 KiB**, 1 petición |

Como referencia: con Fraunces serían ~17–18 KiB, con Space Grotesk 12,5 KiB, con Unbounded 20,6 KiB. Agregar Inter como fuente de cuerpo sumaría 23–47 KiB y una segunda fuente crítica; no lo recomiendo con el presupuesto de Lighthouse.

## Decisiones abiertas para Diego

- Elegir entre las 4 viéndolas con el titular real del Hero, en ES y EN, a 360 px y en escritorio. Encaja con el ticket de prototipo del Hero.
- Con Bricolage: qué `opsz` (48 es más legible a 36–44 px en móvil; 96 es más display) y si hace falta `wdth` condensado.

## Fuentes

- Fontsource API (metadatos, ejes): https://api.fontsource.org/v1/fonts/bricolage-grotesque, https://api.fontsource.org/v1/variable/bricolage-grotesque (y lo mismo para `space-grotesk`, `fraunces`, `unbounded`, `syne`, `sora`, `archivo`, `inter`)
- Listado de archivos y tamaños de los paquetes: https://data.jsdelivr.com/v1/packages/npm/@fontsource-variable/bricolage-grotesque@5.3.0?structure=flat (y equivalentes `@fontsource/*@5.3.0`)
- Fontsource, preload con Vite: https://fontsource.org/docs/getting-started/preload
- Fontsource, ejes variables (`opsz.css`, `full.css`): https://fontsource.org/docs/getting-started/variable
- Google Fonts CSS2 API (instancias con `opsz` explícito): https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@96,700
- Descripciones y licencias upstream: https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque, …/fraunces, …/spacegrotesk, …/unbounded, …/syne (`DESCRIPTION.en_us.html`, `METADATA.pb`, `OFL.txt`)
- Texto oficial de la OFL 1.1: https://openfontlicense.org/open-font-license-official-text/
- web.dev, Best practices for fonts (Hempenius y Pollard, act. 2022-10-04): https://web.dev/articles/font-best-practices
- web.dev, Largest Contentful Paint (svg inline no es candidato; texto con fuente web en el block period no cuenta): https://web.dev/articles/lcp
- Chrome for Developers, Improved font fallbacks (fórmulas de `size-adjust` y overrides; Android solo tiene Roboto): https://developer.chrome.com/blog/font-fallbacks
- Lighthouse, auditoría font-display: https://developer.chrome.com/docs/lighthouse/performance/font-display
- MDN, `size-adjust` (Baseline 2023) y `ascent-override` (no Baseline): https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust, https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/ascent-override
- Vite 5.4.11, procesamiento de `<link href>` en `index.html`: https://github.com/vitejs/vite/blob/v5.4.11/packages/vite/src/node/plugins/html.ts
