# motion con React 19: scroll, LazyMotion y reduced-motion

Investigación para el issue #3 (hijo del mapa #1). Fecha: 2026-10-24. Versión estudiada: **`motion` 14.6.0** (publicada el 2026-10-20).

**Pregunta:** ¿qué hay que saber de `motion` (ex framer-motion) para usarla en el Viaje de cámara, en las animaciones de entrada de secciones y en la transición Home↔Proyecto sin romper Lighthouse móvil ≥90?

## Respuesta corta

- **React 19:** compatible. `motion@14.6.0` declara `react`/`react-dom` `^18.0.0 || ^19.0.0` y el CI de motion corre una suite con React 19 desde la 12.29.0. Funciona sin cambios con el `@testing-library/react@14` del repo.
- **Peso real** (build de Vite 5 como el del repo, gzip): el arranque recomendado (`LazyMotion` con `domAnimation` cargado aparte, `m`, `useScroll`, `useTransform` y `MotionConfig`) suma **+19,6 kB al JS inicial** y **+16,9 kB en un chunk diferido**. Hoy el JS inicial del portafolio pesa 90,5 kB, así que es **+22 %**. Con `<motion.div>` directo serían +44,9 kB. **No usar `domMax`** (+45,1 kB): solo agrega drag y animaciones de layout.
- **Scroll en el compositor, pero solo con condiciones.** `useScroll` + `useTransform` corre fuera del hilo principal (WAAPI con `ScrollTimeline`) **solo si** se cumplen tres cosas: el estilo enlazado es `transform` (como string) u `opacity`, `useScroll()` no recibe `offset` ni `target`, y el elemento es HTML, no SVG. Con `style={{ y }}`, que es el uso típico de la documentación, **corre en el hilo principal**. Lo verifiqué en Chrome 155.
- **Reduced motion:** `MotionConfig reducedMotion="user"` **no frena** los valores ligados al scroll (lo verifiqué en jsdom y en Chrome). Solo corta las animaciones de `transform` y de layout. Para la Escena hay que dejar de pasar el MotionValue a mano. Además, `useReducedMotion()` **no reacciona** a cambios: lee la preferencia una sola vez al montar. Conviene un hook propio y reactivo que alimente tanto a la Escena como a `MotionConfig`.
- **Transición Home↔Proyecto:** el `<Link viewTransition>` de React Router **no hace nada con `BrowserRouter`**, porque solo funciona con `RouterProvider`. La mejor opción es **`<ViewTransition>` de React**, que pide subir React a ≥19.3 (hoy hay 19.1.1). No cuesta bytes de motion, y `BrowserRouter` 7.13 ya envuelve cada navegación en `startTransition`. `AnimatePresence` es el plan B (+1,7 kB). No conviene usar `layoutId` porque obliga a cargar `domMax`.
- **Tests (Vitest + jsdom):** `MotionGlobalConfig.skipAnimations = true` en `vitest.setup.ts`, más un mock de `IntersectionObserver`. **Sin ese mock, `whileInView` tira `ReferenceError` al montar.** `useScroll` no avanza en jsdom porque no hay layout. Por eso la lógica del Viaje de cámara (rangos y salidas) se testea como funciones puras.

## Método

- **Fuentes primarias:** el `CHANGELOG.md` de `motiondivision/motion`, la documentación de motion.dev, el código publicado en npm (`framer-motion`, `motion-dom` y `motion-utils` 14.6.0), el código publicado de `react-router@7.13.0` (la versión del lockfile), la documentación de React Router y react.dev, y `mdn/browser-compat-data`.
- **Peso:** armé apps mínimas con React 19.3.1 y las compilé con **Vite 5 + `@vitejs/plugin-react`**, igual que el repo. Medí el JS inicial (la entrada y sus imports estáticos, según `manifest.json`) y el JS diferido, con gzip -9, y le resté una app base que solo tiene React. También compilé el portafolio actual (`pnpm build` sobre `main`, 73610ce) para tener la línea base.
- **Aceleración del scroll:** compilé una página con cinco variantes de capa y la abrí en **Chrome 155 headless** (puppeteer-core). Después de hacer scroll revisé `element.getAnimations()`: si aparece una animación con `ScrollTimeline`, corre en el compositor; si no, el JS escribe `style.transform` en cada frame. Repetí la prueba emulando `prefers-reduced-motion: reduce`.
- **Tests:** escribí 16 casos en Vitest 1.6 + jsdom 24 + `@testing-library/react` 14, que son las versiones del repo.

## 1. Compatibilidad con React 19

| Hecho | Fuente |
|---|---|
| `motion@14.6.0`: `peerDependencies` `react`/`react-dom` `^18.0.0 \|\| ^19.0.0`. Depende de `framer-motion@14.6.0`, fijado a la misma versión desde la 14.0.0. | npm (`npm view motion`), CHANGELOG 14.0.0 |
| La suite de React 19 corre en CI desde la 12.29.0. Hay arreglos de `AnimatePresence` en Strict Mode de React 19 hasta la 13.1.1. | CHANGELOG 12.29.0, 13.1.1 |
| `AnimateView` (`motion/react-animate-view`) **requiere React ≥19.3**. El resto de la API sigue soportando React 18. | motion.dev/docs/react-animate-view |
| La 13.0.0 quitó la dependencia opcional `@emotion/is-prop-valid`. Para filtrar props hay que usar `<MotionConfig isValidProp>`. | CHANGELOG 13.0.0 |
| En jsdom, motion 14.6.0 con React 19 y `@testing-library/react@14` renderiza `m`, `motion`, `AnimatePresence` y `LazyMotion` (síncrono y asíncrono) sin errores. La única excepción es `whileInView` (ver §6). | Prueba propia |

Import: **`motion/react`**. No usar `framer-motion`, que es un paquete interno de `motion`.

## 2. Peso real con LazyMotion

Medido con Vite 5 y gzip -9, como delta sobre una app que solo tiene React 19 (67,3 kB gz):

| Configuración | JS inicial (gz) | Chunk diferido (gz) |
|---|---|---|
| `<motion.div>` (todo incluido) | **+44,9 kB** | — |
| `LazyMotion` + `domAnimation` síncrono + `m` | +30,6 kB | — |
| `LazyMotion` + `domMax` síncrono + `m` | +45,1 kB | — |
| `LazyMotion` con `domAnimation` **asíncrono** + `m` | **+14,5 kB** | 18,2 kB |
| **Escena:** `useScroll` + `useTransform` + `MotionConfig` + `useReducedMotion` + `m`, `domAnimation` asíncrono | **+19,6 kB** | 16,9 kB |
| La Escena + `AnimatePresence` (transición de rutas) | +21,3 kB | 16,9 kB |
| `AnimateView` (`motion/react-animate-view`) | +3,3 kB | — |
| `useAnimate` de `motion/react-mini` | +3,2 kB | — |
| `scroll()` + `animate()` vanilla (`motion`) | +26,3 kB | — |
| `<ViewTransition>` de React (sin motion) | +0 kB | — |

- **Línea base del portafolio actual:** `index-*.js` pesa 288 kB crudos y **90,5 kB gz**, en un único chunk. La Escena agregaría +19,6 kB gz al inicial (**+22 %**) y 16,9 kB diferidos.
- **Comparación con la documentación** (motion.dev/docs/react-reduce-bundle-size): "motion ≈ 43kb" coincide con lo medido (44,9). `domAnimation` "+24kb" y `domMax` "+38kb" también cuadran como totales (30,6 y 45,1). **"`m` + `LazyMotion` just over 5kb" no se cumple en una app real:** el bundle `size-rollup-m.js` que trae el paquete da 5,0 kB gz, pero con `LazyMotion` y lo necesario para usarlo el inicial queda en **14,5 kB**.
- **`domAnimation` alcanza:** cubre animaciones, variantes, `exit`, hover/tap/focus y `whileInView`. `domMax` solo agrega pan/drag y animaciones de layout (`layout`, `layoutId`), que este rediseño no necesita.
- **`m` sin `LazyMotion` no renderiza nada animado:** ni siquiera aplica los MotionValues de `style` (prueba propia: el `transform` se queda en `none`). El `renderer` viene en el paquete de features. Con carga asíncrona, la Escena empieza a moverse cuando llega el chunk. Como arranca en `progress = 0`, la diferencia no se ve.

## 3. `useScroll` + `useTransform`: ¿solo propiedades del compositor?

### Qué dice la documentación

motion.dev/docs/react-use-scroll: "`useScroll` is able to run some animations with the browser's `ScrollTimeline`"... "Browsers are capable of animating some values, like `opacity`, `transform`, `clipPath` and `filter`, entirely on the GPU", ya sea "directly to an `opacity` style" o "via `useTransform` to one of the above styles".

### Qué hace el código (14.6.0)

- `useScroll()` adjunta una configuración `accelerate` a `scrollYProgress` **solo si** `supportsScrollTimeline() && !offset` (sin `target`), o `supportsViewTimeline()` con un `offset` traducible (con `target`). Ver `framer-motion/dist/es/value/use-scroll.mjs`, `canAccelerateScroll`.
- `useTransform(input, [..], [..])` propaga `accelerate` **solo si** el rango es un array, no hay función transformadora, `clamp` no es `false` y la entrada no viene de otro `useTransform`, porque solo se permite un nivel de transformación (`!inputAccelerate.isTransformed`). Ver `value/use-transform.mjs`.
- `VisualElement.bindToMotionValue(key, value)` crea la animación WAAPI en el compositor **solo si** `acceleratedValues.has(key)` y `this.current instanceof HTMLElement`. El conjunto `acceleratedValues` es `opacity`, `clipPath`, `filter`, `transform` y `backgroundColor`. **`y`, `x` y `scale` no están en la lista**, y los elementos SVG no son `HTMLElement`. Ver `motion-dom/dist/es/render/VisualElement.mjs` y `animation/waapi/utils/accelerated-values.mjs`.
- La 13.5.0 hizo que todos los `offset` corran en el hilo principal. La 13.4.4 quitó `ScrollTimeline` para callbacks JS: "benchmarked no improvement over `scrollInfo`". Ver el CHANGELOG.
- La aceleración de transforms independientes (`x`, `y`…) de la 14.2.0 es para **animaciones** (`animate`, `whileInView`), no para valores ligados al scroll.

### Verificación en Chrome 155

Tras `scrollTo(0, 2500)`, en cinco capas `position: fixed`:

| Capa | Animación WAAPI | Quién la mueve |
|---|---|---|
| `style={{ y: useTransform(p, [0,1], ['0px','-300px']) }}` | ninguna | **hilo principal** (JS escribe `translateY(-170px)` en cada frame) |
| `style={{ transform: useTransform(p, [0,1], ['translateY(0px)','translateY(-300px)']) }}` | 1, `ScrollTimeline` | **compositor** |
| `style={{ opacity: useTransform(p, [0,1], [1, 0.2]) }}` | 1, `ScrollTimeline` | **compositor** |
| `transform` con `useScroll({ offset: ['start start','end end'] })` | ninguna | hilo principal |
| `<m.g>` dentro de un `<svg>` con `style={{ transform }}` | ninguna | hilo principal |

### En móviles de gama media

- En el **camino acelerado**, el desplazamiento corre en el hilo del compositor y va sincronizado con el scroll aunque el hilo principal esté ocupado. Soporte de `ScrollTimeline`: Chrome/Edge/Android 115, Safari/iOS 26 y Firefox 159 (BCD de MDN). En navegadores más viejos, motion cae solo al camino JS.
- En el **camino JS**, motion usa un solo listener de scroll (`scrollInfo`) y mide una vez por frame para todos los valores. Después escribe `style.transform` en el frameloop. El transform no provoca layout ni repintado si la capa está promovida, pero cada frame depende del hilo principal. En Android, el scroll lo maneja el compositor, así que con el hilo principal ocupado la capa se atrasa un frame o más respecto del scroll. Esto es una inferencia sobre el modelo de hilos de Chrome; no lo medí en un dispositivo real.
- Lighthouse en modo navegación no hace scroll. El costo que mide es el de bytes y TBT del §2, no la fluidez del Viaje de cámara.

### Cómo armar cada capa de la Escena

- Envolver cada capa SVG en un **`<m.div>` HTML** y animar ese div. No animar `<m.g>` ni `<m.svg>` internos.
- Ligar **`transform` como string** (`'translate3d(0,-12%,0)'`) u `opacity`, nunca `y`.
- Llamar a `useScroll()` **sin `offset` ni `target`** (progreso de toda la página) y aplicar **un solo** `useTransform` por capa, que sale directo de `scrollYProgress`. Para que una capa se mueva solo en un tramo, usar varios puntos en el rango de entrada (`[0, 0.3, 1]`), que sigue siendo acelerable, y no encadenar transforms.
- Agregar `will-change: transform` a las capas grandes para que sean capas de composición.

## 4. prefers-reduced-motion global

| Hecho | Fuente |
|---|---|
| `MotionConfig reducedMotion`: `"user"` respeta el dispositivo, `"always"` lo fuerza y `"never"` lo ignora (es el **valor por defecto**). Si está activo, "transform and layout animations will be disabled"; `opacity` y `backgroundColor` siguen animándose. | motion.dev/docs/react-motion-config, react-accessibility |
| Prueba propia: con `reducedMotion="always"`, `animate={{ x: 0, opacity: 1 }}` salta `x` al valor final y anima `opacity`. | jsdom |
| **No cubre la Escena:** con `reducedMotion="always"` (jsdom) o `"user"` + `prefers-reduced-motion: reduce` (Chrome 155), los MotionValues ligados al scroll **siguen moviendo las capas** en las cinco variantes. La documentación recomienda no aplicar el MotionValue: "set the element's `y` style to `0`". | Pruebas propias, motion.dev/docs/react-accessibility |
| `useReducedMotion()` hace `useState(prefersReducedMotion.current)` sin setter: **no se re-renderiza** si el usuario cambia la preferencia. El código tiene un `// TODO See if people miss automatically updating`, aunque el JSDoc dice que "actively respond[s] to changes". Además no mira `MotionConfig`; para eso está `useReducedMotionConfig()`, que se exporta. | `framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs` |
| motion lee `matchMedia('(prefers-reduced-motion)')` **una vez por módulo** y llama a `.addEventListener('change', …)`. Sin `matchMedia` devuelve `false`. | `motion-dom/dist/es/render/utils/reduced-motion/index.mjs` |

**Setup recomendado:** un único hook propio y reactivo que alimente las dos cosas.

```tsx
// src/lib/motion/usePrefersReducedMotion.ts
const query = '(prefers-reduced-motion: reduce)';
const subscribe = (cb: () => void) => {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mql = window.matchMedia(query);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
};
const get = () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
export const usePrefersReducedMotion = () => useSyncExternalStore(subscribe, get, () => false);

// Raíz de la app
const reduce = usePrefersReducedMotion();
<MotionConfig reducedMotion={reduce ? 'always' : 'never'}>
  <LazyMotion features={loadFeatures} strict>…</LazyMotion>
</MotionConfig>

// Escena: estática con el encuadre del hero
const { scrollYProgress } = useScroll();
const t = useTransform(scrollYProgress, [0, 1], ['translate3d(0,0%,0)', 'translate3d(0,-12%,0)']);
<m.div className="layer" style={reduce ? undefined : { transform: t }}>…</m.div>
```

- Pasar `'always'`/`'never'` en lugar de `"user"` vuelve reactivo a `MotionConfig` (el contexto se recalcula cuando cambia `reducedMotion`) y deja un solo punto que mockear en los tests.
- Como red de seguridad conviene agregar CSS: `@media (prefers-reduced-motion: reduce) { .layer { transform: none !important; } }`. Esto también corta la animación WAAPI, porque `!important` del autor le gana a las animaciones en la cascada. `tailwind.css` ya tiene un bloque `prefers-reduced-motion`.

## 5. Transición Home↔Proyecto con React Router 7

El repo usa **modo declarativo** (`<BrowserRouter><Routes>` en `src/app/App.tsx`) con `react-router-dom@7.13.0` y `react@19.1.1`.

| Opción | ¿Sirve con `BrowserRouter`? | Costo | Notas |
|---|---|---|---|
| **`<ViewTransition>` de React** (recomendada por la doc de RR) | **Sí.** `BrowserRouter` 7.13 envuelve `setState` en `React.startTransition` salvo que se pase `unstable_useTransitions={false}`. | **0 kB**. Pide **React ≥19.3**; `react-router@7.13.0` acepta `react >=18`. | Hay que ponerlo como componente de un **route padre** con `<Outlet/>`. Los elementos compartidos usan `<ViewTransition name="…">` en ambos lados. Back/Forward (`popstate`) puede no animar. La reducción de movimiento se hace con CSS (`::view-transition-*` sin animación); React no la aplica sola. Soporte de `startViewTransition`: Chrome 111, Safari 18, Firefox 144; donde no existe, navega normal. |
| `AnimateView` de motion | Sí (encima de `<ViewTransition>`) | +3,3 kB, React ≥19.3 | Solo si las animaciones CSS de view transitions no alcanzan. Es gratis: ya no requiere Motion+. |
| `<Link viewTransition>` / `useViewTransitionState` (API "legacy" de RR) | **No.** El `startViewTransition` vive en `RouterProvider`; `BrowserRouter` usa `history` como navigator e ignora la opción. `useViewTransitionState` lanza un `invariant` fuera de `RouterProvider`. | 0 kB | Obligaría a migrar a `createBrowserRouter`. La doc actual de RR la marca como deprecada. |
| `AnimatePresence mode="wait"` con `<Routes location={loc} key={loc.pathname}>` | Sí | +1,7 kB sobre la Escena | Retrasa la página nueva lo que dure la salida. `mode="wait"` admite un solo hijo. Hay que llevar el scroll arriba en `onExitComplete`. |
| `layout` / `layoutId` (elemento compartido con motion) | Sí | **+14,5 kB** (requiere `domMax`) | Ambos elementos tienen que coexistir. Pesa demasiado para un efecto de transición. |

**Recomendación:** subir React a ≥19.3 en la fase que haga la transición y usar `<ViewTransition>` con CSS. Las clases `project-enter-*` que ya existen sirven de fallback.

## 6. Testear `motion` en Vitest + jsdom

Qué le falta a jsdom 24: `matchMedia`, `IntersectionObserver`, `ScrollTimeline`, `document.startViewTransition` y `Element.prototype.animate`. Resultados de las pruebas:

| Caso | Resultado |
|---|---|
| `whileInView` sin mock de `IntersectionObserver` | **`ReferenceError: IntersectionObserver is not defined`** al montar. `InViewFeature.update()` revisa si existe, pero `mount()` no. |
| `whileInView` con un mock de IO que reporta `isIntersecting: true` | Revela (`opacity: 1`) ✓ |
| `MotionGlobalConfig.skipAnimations = true` + `animate` | Salta al valor final ✓ |
| `skipAnimations` + `AnimatePresence` `exit` | El hijo se desmonta ✓ |
| `LazyMotion` con features asíncronas (`import()`) | Carga y anima en jsdom ✓ |
| `LazyMotion strict` con un `<motion.div>` adentro | Lanza error ✓ (sirve para que nadie importe `motion` completo) |
| `useScroll` + `fireEvent.scroll` | `scrollYProgress` queda en **0**: jsdom no tiene layout (`scrollHeight` = 0) |
| `useReducedMotion` con `matchMedia` mockeado **antes** del primer uso en el archivo | `true` ✓. Si se mockea después, sigue en `false` porque motion cachea por módulo. |

**Setup recomendado para `vitest.setup.ts`:**

```ts
import { MotionGlobalConfig } from 'motion/react';
MotionGlobalConfig.skipAnimations = true;

class MockIntersectionObserver {
  constructor(private cb: IntersectionObserverCallback) {}
  observe = (el: Element) =>
    this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], this as never);
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
if (!('IntersectionObserver' in window)) (window as any).IntersectionObserver = MockIntersectionObserver;
```

- **Escena / Viaje de cámara:** extraer los rangos de cada capa (`[0, 0.3, 1] → [...]`) a un módulo puro y testearlo sin DOM. El componente se testea con `usePrefersReducedMotion` mockeado (`vi.mock`): con `true` se comprueba que la capa no tiene `style.transform`; con `false`, que se renderizan las capas. No hace falta testear el scroll real.
- **Cuidado con el mock existente** en `src/__tests__/ui.test.tsx`: `window.matchMedia = () => ({ matches: true })` no tiene `addEventListener`. Si motion inicializa su listener de reduced motion mientras ese mock está activo, va a tirar `TypeError`. Los mocks de `matchMedia` deberían incluir `addEventListener` y `removeEventListener`.
- **API de frames manuales:** el CHANGELOG de la 14.6.0 anuncia `stepFrames` "for tests", pero **no se exporta** en el paquete publicado. Solo vive en los utils de test del repo de motion. Lo público es `processFrame(t)` + `MotionGlobalConfig.useManualTiming`. Con `skipAnimations` alcanza.
- En los tests se imprime el warning "You have Reduced Motion enabled on your device" cada vez que el mock devuelve `true`. Es inofensivo.

## Setup recomendado (resumen)

```tsx
// src/lib/motion/features.ts  → chunk diferido
import { domAnimation } from 'motion/react';
export default domAnimation;

// src/lib/motion/MotionProvider.tsx
import { LazyMotion, MotionConfig } from 'motion/react';
const loadFeatures = () => import('./features').then((r) => r.default);
export const MotionProvider = ({ children }) => {
  const reduce = usePrefersReducedMotion();
  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>
      <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>
    </MotionConfig>
  );
};
```

- Importar siempre `m` (no `motion`) desde `motion/react`. `strict` hace que el error salte en desarrollo y en los tests.
- Entradas de sección: `<m.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>`. Con reduced motion, `y` salta al final y queda solo el fade, que es lo que se busca.
- Escena: `useScroll()` sin opciones, un `useTransform` por capa hacia `transform` como string, `<m.div>` HTML por capa y `style` en `undefined` cuando hay reduced motion (§3 y §4).
- Transición: `<ViewTransition>` de React (≥19.3), sin motion (§5).
- No usar `domMax`, `layoutId`, `motion` completo ni `framer-motion`.

## Fuentes

- motion, CHANGELOG: <https://github.com/motiondivision/motion/blob/main/CHANGELOG.md> (entradas 12.29.0, 12.30.0, 12.34.0, 13.0.0, 13.1.1, 13.4.0, 13.4.4, 13.4.7, 13.5.0, 14.0.0, 14.2.0 y 14.6.0)
- motion en npm, `peerDependencies` y `dependencies` de 14.6.0: <https://www.npmjs.com/package/motion>
- Código publicado (`framer-motion@14.6.0`, `motion-dom@14.6.0`): `value/use-scroll.mjs`, `value/use-transform.mjs`, `render/VisualElement.mjs` (`bindToMotionValue`), `animation/waapi/utils/accelerated-values.mjs`, `utils/reduced-motion/use-reduced-motion.mjs`, `render/utils/reduced-motion/index.mjs`, `motion/features/viewport/index.mjs`, `frameloop/process-frame.mjs`, `components/MotionConfig/index.mjs`
- motion.dev: <https://motion.dev/docs/react-reduce-bundle-size>, <https://motion.dev/docs/react-use-scroll>, <https://motion.dev/docs/react-accessibility>, <https://motion.dev/docs/react-motion-config>, <https://motion.dev/docs/react-animate-presence>, <https://motion.dev/docs/react-animate-view>
- React Router, View Transitions: <https://reactrouter.com/how-to/view-transitions>. Código de `react-router@7.13.0` (`dist/development/chunk-JZWAC4HX.mjs`): `BrowserRouter`, `RouterProvider`, `NavLink` y `useViewTransitionState`.
- React, `<ViewTransition>`: <https://react.dev/reference/react/ViewTransition>. npm `react` latest = 19.3.1, que exporta `ViewTransition`.
- MDN browser-compat-data: `api/ScrollTimeline.json`, `css/properties/animation-timeline.json`, `api/Document.json#startViewTransition` y `css/properties/view-transition-name.json`
- Mediciones propias: builds de Vite 5.4 con React 19.3.1 y motion 14.6.0, gzip -9 de Node; Chrome 155 headless con puppeteer-core 23; Vitest 1.6.1 + jsdom 24.
