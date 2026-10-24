# Lighthouse CI en GitHub Actions (≥90 móvil)

Investigación para el issue #2 (hijo del mapa #1). Fecha: 2026-10-24.

**Pregunta:** ¿cómo agregamos Lighthouse CI al workflow `.github/workflows/ci.yml` de esta SPA (Vite 5 + React 19 + React Router 7, desplegada en Vercel) para que el CI falle si rendimiento o accesibilidad bajan de 90 en móvil?

## Respuesta corta

Usar **`@lhci/cli` (`lhci autorun`) directamente**, en un job propio de `ci.yml`, auditando el **`dist/` construido en el runner** con el servidor estático de LHCI (`staticDistDir` + `isSinglePageApplication`). Auditar `/` y las tres rutas `/projects/:id`, **5 corridas por URL** y la aserción con `aggregationMethod: "median-run"`, con `minScore: 0.9` como `error` para `performance` y `accessibility`. Guardar `.lighthouseci/` como artifact de Actions. No medir contra el preview de Vercel como check bloqueante; si se quiere, sumarlo después como medición informativa.

**Bloqueante previo:** hoy el CI falla en todos los pushes antes de llegar a lint/test (ver [Hallazgo: el CI actual está roto](#hallazgo-el-ci-actual-está-roto)). Hay que arreglarlo antes de que un gate de Lighthouse signifique algo.

## Hechos clave (con fuente)

### Perfil móvil
- Lighthouse emula un dispositivo móvil por defecto: "With the default configuration, Lighthouse emulates a mobile device." Desktop requiere `--preset=desktop`. [Lighthouse, emulation.md](https://github.com/GoogleChrome/lighthouse/blob/main/docs/emulation.md)
- Por lo tanto **no hay que configurar nada para obtener móvil**; solo no poner `preset: "desktop"` en `settings`. [LHCI configuration.md](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)

### `@lhci/cli` vs `treosh/lighthouse-ci-action`
- `@lhci/cli`: la versión actual en npm es **0.15.1** (última publicación: 2025-06-25) y fija `lighthouse` **12.6.1**, que requiere `node >=18.20` (`npm view @lhci/cli@0.15.1 dependencies`, `npm view lighthouse@12.6.1 engines`). La guía oficial instala `@lhci/cli@0.15.x` y usa Node 22.x en GitHub Actions. [LHCI getting-started.md](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- `treosh/lighthouse-ci-action@v12`: envuelve LHCI e incluye Lighthouse v12.6. Inputs relevantes: `urls`, `configPath`, `runs` (**por defecto 1**), `uploadArtifacts` (por defecto false), `temporaryPublicStorage`, `budgetPath`. Las aserciones se leen del `lighthouserc` vía `configPath`. [treosh/lighthouse-ci-action](https://github.com/treosh/lighthouse-ci-action)
- Las dos opciones usan la misma versión de Lighthouse (12.6.x). La action no aporta ningún motor distinto: aporta azúcar (subida de artifacts, outputs `links`/`manifest`/`assertionResults`) a cambio de una dependencia de terceros más.
- Detalle: el paquete `lighthouse` ya va por **13.5.0** (`engines: node >=22.19`), pero LHCI no se actualizó. Los puntajes de CI (12.6.1) pueden diferir un poco de PageSpeed Insights.

**Decisión: `@lhci/cli`.** Es la herramienta primaria y está documentada por Google. La configuración vive en un `lighthouserc` que también corre en local (`pnpm dlx @lhci/cli@0.15.1 autorun`), con el mismo comando que en CI, y no suma una action de terceros. Lo que aporta la action (subir artifacts) se reemplaza con un paso de `actions/upload-artifact`.

### Dónde medir: runner local vs preview de Vercel

**Runner local (recomendado)**
- `staticDistDir`: LHCI levanta un servidor estático propio sobre `dist/`. [configuration.md](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)
- `isSinglePageApplication: true` hace que ese servidor sirva `index.html` en lugar de un 404 para rutas desconocidas. Equivale al rewrite de `vercel.json` (`/((?!.*\.).*)` → `/index.html`), así que `/projects/superwallet` funciona sin `vite preview`.
- Con `staticDistDir` se pueden listar URLs concretas: "URLs will have their port replaced with the port of the local server". Por eso alcanza con escribir `http://localhost/projects/superwallet`. Si se usa `url`, la detección automática de HTML se desactiva.
- La guía de variabilidad de Lighthouse recomienda "Use localhost or a machine on the same exact network whenever stability is a concern". [Lighthouse, variability.md](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)
- El throttling simulado (el default) "mitigates these effects by replaying network activity on its own". Por eso la latencia del servidor local pesa poco en el puntaje. [variability.md](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)
- `ubuntu-latest` trae Google Chrome preinstalado: "Google Chrome 155.0.8059.39". [runner-images Ubuntu 24.04](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)

**Preview de Vercel (no recomendado como gate)**
- Vercel avisa por `deployment_status` o por `repository_dispatch` (`vercel.deployment.success`, con la URL en `github.event.client_payload.url`). Pero el evento `repository_dispatch` "will only trigger a workflow run if the workflow file exists on the default branch". [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)
- *Inferencia:* ese run se asocia a la rama por defecto y no al commit del PR, así que no sirve directamente como check requerido del PR. Habría que publicar un commit status a mano.
- Si los previews tienen Deployment Protection, hace falta el secreto de "Protection Bypass for Automation" en el header `x-vercel-protection-bypass` (disponible en todos los planes). [Vercel, Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- *No verificado:* no confirmé si este proyecto tiene la protección activa en previews.
- La guía de variabilidad advierte: "Web servers have variable load and do not always respond with the same delay." Medir contra un host remoto suma ruido de red y de CDN. [variability.md](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)
- Medir el preview tiene una ventaja real: refleja la compresión, el HTTP/2 y los headers de Vercel. Esa ventaja **no** compensa la complejidad ni el ruido para un gate bloqueante. Si más adelante interesa, conviene un job **informativo** (no requerido) contra producción, disparado por `vercel.deployment.success` o `vercel.deployment.promoted`.

### Rutas a auditar
- Rutas de `src/app/App.tsx`: `/`, `/projects/:id`, y `*` que redirige a `/`.
- Ids en `src/app/features/projects/data.ts`: `be-booking-engine`, `superwallet`, `wedding-invitation`.
- Recomendación: auditar las **4 URLs**. Son pocas y cada proyecto carga imágenes distintas (por ejemplo, `wedding-invitation` sumó imágenes en el último commit). Una sola ruta "representativa" podría ocultar una regresión de LCP en otra.

### Variabilidad: corridas, agregación, umbrales
- LHCI corre 3 veces por URL por defecto (`numberOfRuns`). [getting-started.md](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- La guía de Lighthouse dice: "The median Lighthouse score of 5 runs is twice as stable as 1 run". [variability.md](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md) → usar **`numberOfRuns: 5`**.
- **Cuidado con el default de LHCI:** sin opciones, las aserciones usan `aggregationMethod: "optimistic"` (el mejor run) y `minScore: 1`. Hay que fijar los dos explícitamente. [configuration.md](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)
- Métodos de agregación disponibles: `median`, `optimistic`, `pessimistic` y `median-run` ("Use the value of the run that was determined to be 'most representative' of all runs"). Recomiendo `median-run`, porque el puntaje evaluado corresponde a un run real y revisable.
- Las categorías se afirman así: `"categories:performance": ["error", {"minScore": 0.9}]`. `minScore` es una fracción entre 0 y 1.
- No usar el preset `lighthouse:recommended` como gate: afirma auditoría por auditoría y es mucho más estricto que "categoría ≥ 90". Para otras categorías alcanza con `warn`.
- Lighthouse aconseja no correr varios reportes en paralelo en la misma máquina ("DO NOT collect multiple Lighthouse reports at the same time on the same machine"). LHCI corre en serie, pero **no** hay que meter Lighthouse en la matriz de Node (18/20) ni correrlo en paralelo a otros pasos pesados del mismo job.
- Hardware: los runners Linux estándar de repos **públicos** tienen 4 CPU y 16 GB de RAM; los de privados, 2 CPU y 8 GB. [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) El repo es público (`gh repo view`), así que toca el runner más grande.
- Aun así: "Free CI environments and 'burstable' instances are typically quite volatile." [variability.md](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md) Si aparecen falsos rojos con un puntaje real cercano a 90, hay dos palancas: subir a 7 corridas, o fijar el gate en 0.9 y monitorear un umbral `warn` en 0.95 para tener margen. No recomiendo bajar el umbral, porque el ≥90 es la restricción del proyecto.

### Costo en minutos y reportes
- "GitHub Actions usage is free for self-hosted runners and for public repositories that use standard GitHub-hosted runners." [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) Para este repo público, el costo en minutos es **cero**: solo cuenta el tiempo de espera del PR.
- *Estimación, no medida:* 4 URLs × 5 corridas = 20 corridas de Lighthouse. Con unos 10–15 s por corrida, más instalación y build, el job tarda entre 5 y 7 min. Lo confirmaré en la primera ejecución real. Si molesta, bajar a 3 corridas en PR y dejar 5 en `main`.
- Reportes:
  - `upload.target: "filesystem"` escribe los reportes y un `manifest.json` en `outputDir`. [configuration.md](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)
  - Ese directorio y `.lighthouseci/` se suben con `actions/upload-artifact@v7`, que retiene 90 días por defecto. [actions/upload-artifact](https://github.com/actions/upload-artifact) El storage de artifacts comparte cuota con GitHub Packages (500 MB en Free). Los HTML de Lighthouse pesan poco, pero conviene fijar `retention-days: 14`.
  - `temporary-public-storage` da un link clickeable, pero es público y se borra "after a few days". Sirve como extra, no como archivo.
  - El servidor LHCI propio queda fuera de alcance para un portfolio.
  - Status checks con link al reporte: opcional con la GitHub App de LHCI (`LHCI_GITHUB_APP_TOKEN`). No hace falta para que el job falle, porque `lhci autorun` sale con código ≠ 0 si una aserción `error` falla. [getting-started.md](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)

## Hallazgo: el CI actual está roto

Los últimos 5 runs de `CI` en `main` fallaron en unos 15 s (`gh run list`). La anotación dice: `Unable to locate executable file: pnpm`. El problema es que `actions/setup-node@v4` con `cache: 'pnpm'` se ejecuta **antes** de `corepack enable`, y para cachear necesita encontrar `pnpm`.

La documentación de `setup-node` pone `pnpm/action-setup` **antes** de `actions/setup-node`. [setup-node advanced-usage](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md) Para arreglarlo, hay que mover la instalación de pnpm (`pnpm/action-setup`, o `corepack enable` con Node ya presente) antes del paso con `cache: 'pnpm'`. El boceto de abajo ya usa ese orden.

Además, Node 18 está fuera de soporte. LHCI 0.15.1 acepta `>=18.20`, pero el job de Lighthouse debería correr en una sola versión (Node 22, como la guía oficial).

## Boceto (no aplicado)

### `lighthouserc.json` (en la raíz)

JSON para evitar ambigüedades con `"type": "module"` en `package.json`.

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "isSinglePageApplication": true,
      "url": [
        "http://localhost/",
        "http://localhost/projects/be-booking-engine",
        "http://localhost/projects/superwallet",
        "http://localhost/projects/wedding-invitation"
      ],
      "numberOfRuns": 5
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9, "aggregationMethod": "median-run" }],
        "categories:accessibility": ["error", { "minScore": 0.9, "aggregationMethod": "median-run" }],
        "categories:best-practices": ["warn", { "minScore": 0.9, "aggregationMethod": "median-run" }],
        "categories:seo": ["warn", { "minScore": 0.9, "aggregationMethod": "median-run" }]
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": "./lhci-report"
    }
  }
}
```

### Job nuevo en `.github/workflows/ci.yml`

```yaml
  lighthouse:
    name: Lighthouse (móvil ≥90)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4        # antes de setup-node (ver hallazgo)

      - uses: actions/setup-node@v4
        with:
          node-version: 22.x
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm run build

      - name: Lighthouse CI
        run: pnpm dlx @lhci/cli@0.15.1 autorun

      - name: Subir reportes de Lighthouse
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-report
          path: |
            .lighthouseci
            lhci-report
          retention-days: 14
```

Notas del boceto:
- `pnpm/action-setup` sin `version` toma `packageManager` (`pnpm@10.15.0`) de `package.json`. Verificar en la implementación.
- El job es independiente de `build-test` (corre en paralelo, sin `needs`). Reconstruir con Vite es barato y evita pasar `dist/` por artifacts.
- Alternativa equivalente: agregar `@lhci/cli` como devDependency fijada y un script `"lhci": "lhci autorun"`. Así se fija la versión en el lockfile.
- Agregar `.lighthouseci/` y `lhci-report/` a `.gitignore`.
- Para que bloquee merges, marcar el check `Lighthouse (móvil ≥90)` como requerido en la protección de `main`.

## Preguntas abiertas para la implementación
- Confirmar el tiempo real del job y el puntaje base actual: si hoy ya está por debajo de 90, el gate falla desde el día uno.
- Decidir si se agrega un job informativo contra producción en Vercel (`repository_dispatch` → `vercel.deployment.promoted`).
- Revisar si los previews de Vercel tienen Deployment Protection, solo si se elige medir contra ellos.
