# Qué plugins permiten correr el ESLint del portafolio en ESLint 10

Investigación para el issue #50 (hijo del mapa #49). Fecha: 2026-10-29.

## Respuesta corta

- Los tres plugins bloqueados (`eslint-plugin-react` 7.37.5, `eslint-plugin-import` 2.32.0 y `eslint-plugin-jsx-a11y` 6.10.2) **corren en ESLint 10.13** si se envuelven con `fixupPluginRules` de `@eslint/compat` 2.1.1. Con el `eslint.config.js` actual sin envolver, ESLint 10 se cae en la primera regla de React.
- **`jsx-a11y` 6.10.2 funciona en ESLint 10 sin tocar nada**: sus reglas solo usan `context.options`, `context.report` y `context.settings`, y ninguna API que ESLint 10 haya quitado. El único problema es que su peer dice `^9`.
- `eslint-plugin-jsx-a11y-x` 0.2.0 declara `^9 || ^10` y su `configs.recommended` trae **las mismas 35 reglas con las mismas opciones** que `jsxA11y.configs.recommended`. Lo único que cambia es el prefijo (`jsx-a11y-x/`). Lo mantiene la organización `eslint-community` y tiene actividad semanal.
- `eslint-plugin-import-x` 4.17.1 porta `import/order` tal cual: con la misma configuración da exactamente los mismos avisos.
- `@eslint-react/eslint-plugin` 5.28.8 cubre la mayoría de `react/recommended`, pero no todo: tiene huecos y reglas nuevas. Sobre el `src/` actual, su `recommended-typescript` agrega 11 avisos, y eso rompe `--max-warnings=0`.
- ESLint 10 no rompe nada de `eslint.config.js`. Las tres reglas nuevas de `eslint:recommended` no disparan sobre `src/`.

## Método

Además de las fuentes primarias de abajo, hice una prueba empírica en un directorio aparte, fuera del repo. Instalé `eslint@10.13.0`, `@eslint/js@10.0.1`, `@eslint/compat@2.1.1`, los plugins actuales y sus alternativas, y `prettier@3.6.2`, la misma versión del lockfile. Después lintée una copia de `src/` y un archivo sonda con errores conocidos de cada plugin: `import/order` desordenado, `<img>` sin `alt`, `<a href="#">`, un `div` con `onClick`, un `map` sin `key`, y `dangerouslySetInnerHTML` con hijos. Probé cinco configuraciones:

| Configuración                                                             | Resultado en ESLint 10.13                                                                                                                          |
| :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.js` tal cual                                               | Se cae: `Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function` (por `settings.react.version: 'detect'`). |
| Igual, con `settings.react.version: '19.3'` fijo                          | Se cae: `sourceCode.getTokenOrCommentAfter is not a function` en `import/order`.                                                                   |
| Igual, envolviendo solo `import` con `fixupPluginRules` y la versión fija | Funciona: `src/` limpio, la sonda da los 11 hallazgos esperados. `react` y `jsx-a11y` corren sin envolver.                                         |
| Los tres envueltos con `fixupPluginRules`, con `'detect'`                 | Funciona: `src/` limpio, la sonda da los mismos 11 hallazgos.                                                                                      |
| `@eslint-react` + `import-x` + `jsx-a11y-x`                               | Funciona: la sonda da hallazgos equivalentes y `src/` da 11 avisos nuevos de `@eslint-react` (ver pregunta 2).                                     |

Un `grep` de las APIs que ESLint 10 eliminó ([context][m10-context], [SourceCode][m10-sourcecode]) en el código publicado de cada plugin muestra lo siguiente:

- `eslint-plugin-jsx-a11y/lib`: **ninguna**. Solo usa `context.options`, `context.report` y `context.settings`.
- `eslint-plugin-react/lib`: `context.getFilename` (detección de versión), `getSourceCode`, `getScope`, `getAncestors`, `markVariableAsUsed`, `getJSDocComment` y 15 usos de `isSpaceBetweenTokens`.
- `eslint-plugin-import/lib`: `getTokenOrCommentBefore/After` (en `order`), `context.parserOptions` y `context.parserPath`.

`@eslint/compat` 2.1.1 reimplementa justamente esos métodos (`getFilename`, `getTokenOrCommentAfter`, `isSpaceBetweenTokens`, etc.) dentro de `fixupPluginRules`. Su README avisa que no garantiza que funcione con todos los plugins ([README de @eslint/compat][compat]).

## 1. ¿Alguno de los tres corre en ESLint 10? ¿Hay versión próxima?

| Plugin                   | Última versión (fecha) | Peer `eslint` | ¿Corre en ESLint 10?                                                                                                                            | Soporte en camino                                                                                                                                                                                                                                                                                   |
| :----------------------- | :--------------------- | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint-plugin-react`    | 7.37.5 (2025-04-03)    | `… \|\| ^9.7` | Solo con `fixupPluginRules`, o con `settings.react.version` fijo para las reglas de `recommended`. Con `'detect'` se cae ([#3977][react-3977]). | Nada publicado. El `package.json` de `master` sigue en `^9.7`, y los PR de ESLint 10 ([#3979][react-3979], [#4022][react-4022]) están abiertos. El mantenedor dice que no son compatibles hasta que cambie el peer ([comentario][react-3977]). La etiqueta `next` es 7.8.0-rc.0, una versión vieja. |
| `eslint-plugin-import`   | 2.32.0 (2025-06-20)    | `… \|\| ^9`   | Solo con `fixupPluginRules`: `import/order` usa `getTokenOrCommentAfter`, que ESLint 10 eliminó.                                                | **Sí, en `main` sin publicar.** El PR [#3230][import-3230] ("ESLint v10 support") se mergeó el 2026-06-29, y el `package.json` de `main` ya declara `… \|\| ^9 \|\| ^10`. Falta la release: [#3278 "Cut new release"][import-3278] sigue abierto, y [#3292][import-3292] se cerró como duplicado.   |
| `eslint-plugin-jsx-a11y` | 6.10.2 (2024-10-26)    | `… \|\| ^9`   | **Sí, sin envolver**: no usa ninguna API eliminada. Con `fixupPluginRules` también funciona. Solo hay que aceptar el aviso de peer.             | Nada publicado. El PR [#1081][a11y-1081] ("Add ESLint 10 support") está abierto, y el último commit en `main` es del 2026-01-06. El mantenedor dice que piensa darle soporte, sin fecha ([#1075][a11y-1075]).                                                                                       |

Contexto: ESLint 9 llegó a fin de vida el 2026-08-06, y ESLint 10 es la única versión con soporte ([Version Support][eslint-support]).

Para usar un plugin con peer `^9` en ESLint 10, pnpm 10 instala igual y solo avisa del peer no cumplido. El aviso se silencia con `pnpm.peerDependencyRules.allowedVersions`.

## 2. `react` → `@eslint-react/eslint-plugin` 5.x

`@eslint-react/eslint-plugin` 5.28.8 declara peer `eslint: *` y `typescript: *`, y publica versiones a diario (la 5.30.0-beta.16 salió el 2026-10-29). `eslint-plugin-react-x` es el mismo núcleo: comparte versión, y en `@eslint-react` sus reglas aparecen sin prefijo y también como `x-*`. La tabla de abajo cruza las 22 reglas de `pluginReact.configs.recommended` con [la guía oficial de migración][er-migration] y con el contenido real de los configs del paquete instalado:

| `react/…` (recommended)                                | Equivalente en `@eslint-react`                                                                                                    | ¿En `recommended-typescript`?                                |
| :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------- |
| `jsx-key`                                              | `no-missing-key` (+ `no-duplicate-key`, `no-implicit-key`)                                                                        | Sí (`no-missing-key`)                                        |
| `jsx-no-comment-textnodes`                             | `jsx-no-comment-textnodes`                                                                                                        | Sí (warn)                                                    |
| `no-children-prop`                                     | `jsx-no-children-prop`                                                                                                            | Sí (warn)                                                    |
| `no-danger-with-children`                              | `dom-no-dangerously-set-innerhtml-with-children`                                                                                  | Sí                                                           |
| `no-direct-mutation-state`                             | `no-direct-mutation-state`                                                                                                        | Sí                                                           |
| `no-find-dom-node`                                     | `dom-no-find-dom-node`                                                                                                            | Sí                                                           |
| `no-render-return-value`                               | `dom-no-render-return-value`                                                                                                      | Sí                                                           |
| `no-deprecated`                                        | Parcial: `no-component-will-*`, `no-create-ref`, `no-forward-ref`, `dom-no-render`, `dom-no-hydrate`, `dom-no-find-dom-node`, …   | Sí                                                           |
| `no-unsafe` (off por defecto)                          | `no-unsafe-component-will-*`                                                                                                      | Sí (warn)                                                    |
| `jsx-no-target-blank`                                  | `dom-no-unsafe-target-blank`                                                                                                      | **No**: hay que activarla (`src/` tiene 4 `target="_blank"`) |
| `no-unknown-property`                                  | `dom-no-unknown-property`                                                                                                         | **No**: hay que activarla                                    |
| `display-name`                                         | Parcial: `no-missing-component-display-name` + `no-missing-context-display-name`                                                  | **No**                                                       |
| `jsx-no-duplicate-props`                               | Solo como regla propia con `@eslint-react/kit`                                                                                    | No existe en el plugin                                       |
| `no-string-refs`                                       | Solo como regla propia con `@eslint-react/kit` (solo reporta)                                                                     | No existe en el plugin                                       |
| `jsx-uses-react`, `jsx-uses-vars`, `jsx-no-undef`      | Innecesarias: ESLint 10 ya sigue las referencias JSX ([guía de ESLint 10][m10-jsx]), y TypeScript detecta componentes indefinidos | —                                                            |
| `react-in-jsx-scope`                                   | Sin equivalente (el repo ya la apaga)                                                                                             | —                                                            |
| `prop-types`, `require-render-return`, `no-is-mounted` | Sin equivalente: son "legacy" (propTypes y clases), y TypeScript cubre `prop-types`                                               | —                                                            |
| `no-unescaped-entities`                                | **Sin equivalente**: no aparece en la tabla de migración. TypeScript solo rechaza `>` y `}` sueltos en JSX, no las comillas.      | —                                                            |

Lo que se pierde de verdad es poco: `no-unescaped-entities` (solo comillas y apóstrofos) y `jsx-no-duplicate-props`, que TypeScript cubre en parte con el error de props duplicadas en JSX. Para no perder `jsx-no-target-blank`, `no-unknown-property` y `display-name` hay que activar a mano sus reemplazos.

**Superposición con `eslint-plugin-react-hooks` 7.** `@eslint-react` 5 trae sus propias versiones de `rules-of-hooks`, `exhaustive-deps`, `purity`, `set-state-in-effect`, `use-memo`, etc., y publica `disable-conflict-eslint-plugin-react-hooks` para apagar las de `react-hooks`. Hay que elegir uno de los dos para esas reglas. `react-hooks` 7.1.1 ya declara `^10` y puede quedarse.

**Avisos nuevos sobre `src/`** con `recommended-typescript` (todos `warn`, pero rompen `--max-warnings=0`):

- `set-state-in-effect`: `MainHeader.tsx:36` y `Scene.tsx:127`. `react-hooks` no los marca hoy.
- `naming-convention-ref-name`: `Gallery.tsx:118-119` y `Scene.tsx:156`.
- `no-array-index-key`: `Scene.tsx:219` y `parts.tsx:300`.
- `no-context-provider` y `no-use-context`: `i18n.tsx:113,117` y `theme.tsx:43,47`, que son los modismos de React 19.

## 3. `import` → `eslint-plugin-import-x` 4.x

`eslint-plugin-import-x` 4.17.1 declara `eslint: ^8.57.0 || ^9.0.0 || ^10.0.0`, y sus peers `@typescript-eslint/utils` y `eslint-import-resolver-node` son opcionales. Lo mantiene la organización `un-ts` y tiene actividad diaria. `import-x/order` acepta las mismas opciones: `groups` con los mismos grupos predefinidos y `newlines-between` con `always` ([docs de `order`][importx-order]).

**Se porta tal cual.** Basta con renombrar `import/order` a `import-x/order` y la clave del plugin. Sobre la sonda dio los mismos cuatro avisos que `import/order` (grupos sin línea en blanco, `node:path` antes de `react` y `../other` antes de `./helper`), y sobre `src/` no dio ninguno, igual que hoy. La alternativa sin cambiar de plugin es esperar la release de `eslint-plugin-import`, que ya tiene ESLint 10 en `main`, o usar `fixupPluginRules` mientras tanto.

## 4. `jsx-a11y` → `eslint-plugin-jsx-a11y-x` 0.2

**Cobertura.** Comparé en tiempo de ejecución `jsxA11y.configs.recommended.rules` (6.10.2) con `jsxA11yX.configs.recommended.rules` (0.2.0): son **idénticos** en reglas, severidades y opciones (las de `no-noninteractive-element-interactions`, `no-noninteractive-element-to-interactive-role`, `interactive-supports-focus`, etc.). La única diferencia es el prefijo `jsx-a11y-x/`. Del plugin se quitaron tres reglas deprecadas que el `recommended` original no activa: `accessible-emoji`, `label-has-for` y `no-onchange` ([release v0.2.0][a11yx-releases]). El `recommended` de 0.2.0 todavía lista `label-has-for: off` aunque la regla ya no existe. ESLint 10 lo tolera (lo probé), y en `main` ya está corregido ([#105][a11yx-repo]). Sobre la sonda, `jsx-a11y-x` dio exactamente los mismos cuatro errores que `jsx-a11y`.

**Migración** ([README][a11yx-repo]): hay que cambiar el import, el namespace `jsx-a11y/` → `jsx-a11y-x/` y la clave `settings['jsx-a11y']` → `settings['jsx-a11y-x']` (el repo no la usa). El paquete es solo ESM y requiere Node 20 o más, lo que coincide con `engines` del repo.

**Quién lo mantiene y cuánta actividad tiene.**

- Nació en 2024-10 como fork comunitario en `es-tooling` (el grupo de e18e), y en octubre de 2026 pasó a la organización [`eslint-community`][a11yx-repo].
- En npm el único mantenedor es `43081j` (James Garbutt, de e18e). El que más contribuye en el fork es `jdufresne`, con 46 commits, entre ellos el soporte de ESLint 10 (#79).
- Hay commits casi todas las semanas: el último es del 2026-10-27, hubo 5 en octubre, y tiene 58 estrellas y 6 issues abiertos.
- Hay solo tres releases (0.1.0, 0.1.1 y 0.2.0, esta del 2026-05-10). En `main` hay cambios sin publicar que pueden romper configuraciones, como el rechazo de propiedades desconocidas en las opciones (#108).
- En el issue de ESLint 10 del plugin original, se cita como el fork más usado junto con `@htmlacademy/eslint-plugin-jsx-a11y` 6.11.0, que también declara `^10` ([#1075][a11y-1075]).

## 5. ¿ESLint 10 cambia algo de `eslint.config.js`?

Según la [guía de migración a 10.0.0][m10]:

- **Flat config.** No cambia el formato. Se elimina por completo eslintrc, así que `.eslintrc.cjs` queda como archivo muerto (ya lo era con ESLint 9 y flat config) y conviene borrarlo. La búsqueda de configuración ahora parte del directorio de cada archivo; con un solo `eslint.config.js` en la raíz, eso no afecta a este repo. Los comentarios `/* eslint-env */` pasan a ser error, y el repo no tiene ninguno.
- **`languageOptions.globals`.** Sin cambios en el formato. Como `no-undef` está apagado, la lista fija de globals no afecta el resultado.
- **`js.configs.recommended`.** Suma `no-unassigned-vars`, `no-useless-assignment` y `preserve-caught-error`. Con `@eslint/js` 10.0.1 (peer `^10`), ninguna dispara sobre `src/`. Los configs del núcleo ahora tienen la propiedad `name`, pero el repo esparce solo `.rules`, así que no le afecta.
- **Referencias JSX.** ESLint 10 las sigue en el análisis de alcance, lo que vuelve innecesarias `react/jsx-uses-vars` y `jsx-uses-react`. Sobre `src/` no apareció ningún `no-unused-vars` nuevo.
- **Node.** Requiere `^20.19 || ^22.13 || >=24`, y `engines` del repo (`^22.13.0 || ^24.0.0 || >=26.0.0`) ya cumple.
- **Resto de dependencias.** `@typescript-eslint` 8.72.1, `eslint-plugin-react-hooks` 7.1.1 y `eslint-plugin-testing-library` 7.16.2 ya declaran `^10`. `eslint-plugin-prettier` 5.5.7 declara `>=8`, `eslint-config-prettier` 10.1.8 declara `>=7`, y `eslint-plugin-react-refresh` 0.5.7 declara `^9 || ^10`. `@eslint/js` tiene que pasar a 10.

## Fuentes

- Metadatos de npm (`npm view <pkg> version peerDependencies time dist-tags maintainers`), consultados el 2026-10-29.
- [Guía de migración a ESLint 10.0.0][m10] · [Version Support de ESLint][eslint-support]
- [README de @eslint/compat][compat]
- eslint-plugin-react: [#3977][react-3977], [#3979][react-3979], [#4022][react-4022]
- eslint-plugin-import: [#3230][import-3230], [#3278][import-3278], [#3292][import-3292]
- eslint-plugin-jsx-a11y: [#1075][a11y-1075], [#1081][a11y-1081]
- [eslint-plugin-jsx-a11y-x (repo y README)][a11yx-repo] · [releases][a11yx-releases]
- [Guía de migración de ESLint React desde eslint-plugin-react][er-migration]
- [eslint-plugin-import-x: regla `order`][importx-order]

[m10]: https://eslint.org/docs/latest/use/migrate-to-10.0.0
[m10-context]: https://eslint.org/docs/latest/use/migrate-to-10.0.0#rule-context
[m10-sourcecode]: https://eslint.org/docs/latest/use/migrate-to-10.0.0#sourcecode-methods-removed
[m10-jsx]: https://eslint.org/docs/latest/use/migrate-to-10.0.0#jsx-reference-tracking
[eslint-support]: https://eslint.org/version-support/
[compat]: https://github.com/eslint/rewrite/tree/main/packages/compat
[react-3977]: https://github.com/jsx-eslint/eslint-plugin-react/issues/3977
[react-3979]: https://github.com/jsx-eslint/eslint-plugin-react/pull/3979
[react-4022]: https://github.com/jsx-eslint/eslint-plugin-react/pull/4022
[import-3230]: https://github.com/import-js/eslint-plugin-import/pull/3230
[import-3278]: https://github.com/import-js/eslint-plugin-import/issues/3278
[import-3292]: https://github.com/import-js/eslint-plugin-import/issues/3292
[a11y-1075]: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/1075
[a11y-1081]: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/pull/1081
[a11yx-repo]: https://github.com/eslint-community/eslint-plugin-jsx-a11y-x
[a11yx-releases]: https://github.com/eslint-community/eslint-plugin-jsx-a11y-x/releases
[er-migration]: https://www.eslint-react.xyz/docs/migrating-from-eslint-plugin-react
[importx-order]: https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/order.md
