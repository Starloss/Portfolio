# Costo de la Bóveda celeste y el tinte en SVG móvil

Investigación para el ticket #75, hijo del mapa #64. Fecha: 2026-10-31.

## Pregunta

¿La Bóveda celeste (variante C: 3,6 s, con franja de ocaso que gira) y el tinte de Clima caben en la Escena SVG móvil sin bajar de Lighthouse ≥ 90, y qué forma deben tener?

## Respuesta corta

**Caben, pero no con la forma del prototipo.** Hay que escribirlas con `transform` y `opacity` en el compositor, sin `requestAnimationFrame`, y sin animar `fill` durante 3,6 s.

| Pregunta                       | Respuesta                                                                                                                                       | Base                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| ¿Sirve el prototipo (rAF)?     | No. Ocupa el hilo principal 3.398 ms de los 3.600 ms del giro y solo actualiza 129 de 216 fotogramas                                              | Medido                           |
| ¿Sirve en CSS?                 | Sí. Sin el paisaje, baja a 296 ms y 10 actualizaciones del hilo principal; el giro sigue dibujando 217 fotogramas                                 | Medido, con GPU de escritorio    |
| ¿Cuántas estrellas?            | **120 en dos `<path>`**. Dan 30 visibles, las mismas que hoy. Caben hasta 240 como nodos sueltos; con `<path>`, 1.000 sin Long Tasks              | Medido                           |
| ¿Franja de ocaso?              | Viable: es una sola capa que rota                                                                                                                 | Medido, falta un teléfono real   |
| ¿Colores del paisaje en 3,6 s? | **Con `fill`, no**: 3.230 ms de hilo principal aunque el cielo vaya en CSS. Con `fill` de 0,6 s al centro del giro, sí (913 ms, menos TBT que hoy) | Medido                           |
| ¿Fundido del paisaje en 3,6 s? | Prometedor, **sin validar**: mi experimento falló hacia Noche                                                                                     | Medido solo hacia Día            |
| ¿Tinte?                        | Barato en cualquier forma; mejor dos capas con solo `opacity`                                                                                     | Medido                           |
| ¿Peso?                         | **+2.156 B de JS y +249 B de CSS en gzip**. Quedarían ~1.232 B de los 3.388 B de margen                                                           | Peso medido; margen estimado     |
| ¿Lighthouse ≥ 90?              | Probable: el giro cae fuera de la ventana del TBT. **No corrí Lighthouse**                                                                        | Estimado                         |

**Dos hechos cambian decisiones ya tomadas:**

1. **Con `tormenta` el tinte es opaco y tapa toda la Bóveda.** La fórmula da `min(1, 0,85 + 0,1625) = 1`. En la URL del encargo no se ve ni sol, ni luna, ni franja, ni estrellas ([captura](boveda-svg-movil/capturas/P0-url-encargo-mid.png)), y el giro se sigue pagando entero detrás. Hay que topar la opacidad o aceptar que en móvil no hay Bóveda con tormenta.
2. **El presupuesto de JS es el límite real.** Las deltas de arriba **no** incluyen la astronomía de sol y luna ni la obtención del Clima, que deben caber en los ~1.232 B restantes o cargarse aparte.

## Cómo se midió

- **Build:** producción (`vite build`) de `origin/prototype/clima-estados` en `5c84a87`, más el [parche del laboratorio](boveda-svg-movil/laboratorio.patch), que añade las variantes por URL. Servido con `vite preview`.
- **Navegador:** Chromium 156 con Playwright 1.64.1, 390×844, DPR 3, móvil y táctil, `Emulation.setCPUThrottlingRate` x4.
- **Giro:** clic real en el botón de tema y ventana de 3.600 ms desde `EventDispatch`. 6 giros por configuración, alternando Noche y Día; se informa la mediana.
- **Métricas:** traza de Chromium, con el tiempo propio de cada evento para no contar dos veces lo anidado. Las Long Tasks son `RunTask` > 50 ms. "TBT del giro" es la suma de lo que excede 50 ms **dentro de esa ventana**; no es el TBT de Lighthouse. "Clic → pintado" es la mayor duración de Event Timing.
- **Máquina:** Ryzen 7 3800X, RTX 3060 Ti por ANGLE/D3D11.
- **Scripts y datos:** [`measure.mjs`](boveda-svg-movil/measure.mjs), [`configs.mjs`](boveda-svg-movil/configs.mjs), [`size.mjs`](boveda-svg-movil/size.mjs), [`results-gpu-dpr3.json`](boveda-svg-movil/results-gpu-dpr3.json), [`size-results.json`](boveda-svg-movil/size-results.json).

## Resultados medidos

Mediana en ms por giro de 3.600 ms. "Commits" son las actualizaciones del hilo principal; "Draws", los fotogramas dibujados por el compositor (el ideal es 216).

### El giro completo

| Configuración                                 | Script | Estilo | Pintado | Hilo principal | Long Tasks | TBT del giro (peor) | Clic → pintado | Commits | Draws | Perdidos |
| --------------------------------------------- | ------ | ------ | ------- | -------------- | ---------- | ------------------- | -------------- | ------- | ----- | -------- |
| `base`: hoy, sin Bóveda, colores en 0,6 s     | 140    | 410    | 152     | **819**        | 3          | 78 (139)            | 336            | 30      | 217   | 0        |
| `P0`: URL del encargo, tormenta               | 440    | 1.201  | 748     | **3.359**      | 1          | 57 (104)            | 364            | 127     | 216   | 8        |
| `P1`: rAF, 420, `fill` 3,6 s, nublado         | 431    | 1.219  | 753     | **3.398**      | 1,5        | 57 (68)             | 336            | 129     | 216   | 8        |
| `P2`: igual, sin tinte                        | 421    | 1.213  | 770     | **3.419**      | 2,5        | 48 (105)            | 312            | 135     | 217   | 7        |
| `S1`: `P1` al final del Viaje                 | 402    | 1.200  | 833     | **3.449**      | 1          | 25 (38)             | 260            | 154     | 217   | 0        |
| `R1`: CSS, 120, `fill` 0,6 s, tinte `opacity` | 129    | 500    | 176     | **913**        | 1          | 11 (26)             | 284            | 50      | 217   | 13       |

"Pintado" agrupa `Paint`, `Layerize` y `Commit`. El hilo principal además incluye maquetación, pre-pintado y GC, que están en el JSON.

### Qué se lleva el tiempo

| Configuración                       | Hilo principal | Lectura                                                     |
| ----------------------------------- | -------------- | ----------------------------------------------------------- |
| `P3`: rAF, 420, paisaje sin animar  | 2.781          | **El bucle rAF solo ya ocupa el 77 % del giro**             |
| `P4`: rAF, 120, paisaje sin animar  | 2.769          | Quitar estrellas no ayuda: el costo no está en las estrellas |
| `C0`: CSS, 120, paisaje sin animar  | 296            | El mismo cielo, casi 10 veces menos                         |
| `L1`: CSS, 120, `fill` 3,6 s        | 3.230          | **`fill` devuelve casi todo lo ganado**                     |
| `L2`: CSS, 120, `fill` 0,6 s        | 965            | Un cambio corto se paga una sola vez                        |

La traza de `P1` marca los fallos de composición por propiedad: `fill` y `stroke`, además de `color` y `border-*-color` de la interfaz. Coincide con que `fill` y `background-color` no se animan en el compositor, y con la guía de [web.dev](https://web.dev/articles/animations-guide): "restrict animations to `opacity` and `transform`".

El prototipo además nunca detiene su bucle rAF, también en reposo ([`BovedaSvg.tsx`](https://github.com/Starloss/Portfolio/blob/prototype/clima-estados/src/app/scene/prototype-boveda/BovedaSvg.tsx)). Lo leí en el código; no medí su costo en reposo.

### Estrellas, en CSS y sin animar el paisaje

| Estrellas          | Visibles en 390×844 | Hilo principal | Pintado | Long Tasks | TBT del giro | Clic → pintado |
| ------------------ | ------------------- | -------------- | ------- | ---------- | ------------ | -------------- |
| 30                 | 7                   | 271            | 43      | 0          | 0            | 164            |
| 60                 | 16                  | 283            | 43      | 0          | 0            | 180            |
| 120                | 30                  | 296            | 44      | 0          | 0            | 188            |
| 240                | 59                  | 277            | 48      | 0          | 1            | 196            |
| 420                | 102                 | 282            | 62      | 1          | 4            | 232            |
| 1.000              | 235                 | 312            | 131     | 2          | 60           | 312            |
| 1.000 en `<path>`  | 235 (calculadas)    | 257            | 38      | 0          | 0            | 176            |

- **El tope lo pone el número de nodos, no la animación.** Con nodos sueltos, el pintado empieza a crecer a partir de ~420.
- **Las 420 del prototipo solo dan 12 visibles en móvil.** Están repartidas en un disco de ~1.960 px de radio, pensado para escritorio. Basta un sector de ±1,15 rad y 1.050 px de radio: lo más lejano de la pantalla está a ~990 px del pivote y el campo gira ±0,9 rad.
- **Limitación de `<path>`:** todas las estrellas de un mismo `<path>` titilan juntas. Para titilar por grupos hacen falta más `<path>`, sin que eso añada un nodo por estrella.

### Tinte

| Configuración                                | Hilo principal | Raster | Commits |
| -------------------------------------------- | -------------- | ------ | ------- |
| `C0`: sin tinte                              | 296            | 3,5    | 10,5    |
| `T1`: tinte del prototipo (`background-color`) | 313            | 10,0   | 13,5    |
| `T2`: dos capas con solo `opacity`           | 306            | 3,4    | 10,5    |
| `T3`: dos capas, opaco (tormenta)            | 290            | 3,4    | 10      |

Las diferencias de hilo principal entran en el ruido. Lo único claro es que `background-color` triplica el raster, aunque sigue siendo poco.

### Peso en el chunk principal

Compilé `origin/main` y cada variante sin barras ni lectura de URL, reemplazando las estrellas y la luna de hoy, con gzip nivel 6.

| Variante                            | JS gzip | Δ JS       | Δ CSS   |
| ----------------------------------- | ------- | ---------- | ------- |
| `main`                              | 126.413 | 0          | 0       |
| SVG rAF, 420, más tinte del prototipo | 129.224 | **+2.811** | 0       |
| SVG rAF, 420                        | 128.881 | +2.468     | 0       |
| CSS con `<circle>`, más tinte CSS   | 128.524 | **+2.111** | +249    |
| CSS con `<path>`, más tinte CSS     | 128.569 | **+2.156** | +249    |
| CSS con `<circle>`                  | 128.173 | +1.760     | +249    |
| Solo tinte CSS                      | 126.732 | +319       | 0       |

Sumado a los 151.612 B de CI (dato del encargo), esto da **~153.768 B** con `<path>`, y deja **~1.232 B** de margen, o 154.423 B y 577 B para la versión rAF. Es una **estimación**: supone que la delta local se suma tal cual a `resource-summary:script:size`, y no volví a correr LHCI. El CSS queda en ~6,7 kB, lejos de sus 15 kB.

Aún faltan en esa delta el manejo de un giro interrumpido, que el experimento no implementa, y lo ya dicho sobre astronomía y Clima.

## Lighthouse ≥ 90 (estimado, sin medir)

- El [TBT](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time) suma las Long Tasks entre FCP y TTI, y pesa [30 %](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring). Un giro tras un clic queda fuera de esa ventana, así que su costo no entra en la nota.
- Lo que sí entra es la carga: ~2,2 kB gzip más de JS y los nodos de las estrellas. Con `<path>`, el DOM es de 530 nodos frente a 551 de hoy (`C6` contra `base`, medido al final de cada corrida).
- Por eso espero que la nota no sea el problema, y que sí lo sea el presupuesto de JS. El gate de CI lo confirmará en el ticket de producción.

## Recomendación

1. **Bóveda en CSS, sin rAF.** El giro, las estrellas y el cielo de Noche con `@keyframes` y `transition`. El sol y la luna con `element.animate()`, porque su arco depende de la hora: es JS solo al arrancar el giro, y el resto corre en el compositor.
2. **120 estrellas en `<path>`**, en un sector y no en un disco.
3. **Franja en un cuadrado de `250vmax`**, no `600vmax`. Ajustando los cortes del degradado se ve igual.
4. **Paisaje con `fill` de 0,6 s centrado en el giro.** Medida en las dos direcciones, deja el hilo principal cerca de hoy (913 ms contra 819) y con menos TBT (11 contra 78). A cambio, el paisaje cambia en 0,6 s y no acompaña todo el giro.
5. **Tinte en dos capas con solo `opacity`.**
6. **Decidir el tope de opacidad del tinte con tormenta**, para que la Bóveda no desaparezca.

## Lo que no quedó validado

- **Fundido del paisaje (`L3`): el dato hacia Noche no vale.** El `animationend` de `.scene-fade-in` (0,6 s, en ventanas, halo y baliza, que solo existen de noche) burbujea hasta el contenedor y corta el fundido antes de tiempo; es un fallo de mi experimento. Hacia Día no hay esos elementos, y ahí dio 289 ms, TBT 3 y 11 commits. Ese número **no incluye** el remontaje al terminar, que cae fuera de la ventana. Antes de elegir este camino hay que corregirlo (filtrar por `animationName`, sin remontar) y medirlo de nuevo.
- **Ningún teléfono real.** x4 sobre un Ryzen se aproxima a un móvil medio [según Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md), pero la GPU es de escritorio. Los 217 fotogramas de CSS **no prueban** fluidez en un teléfono.
- **Supuesto sin verificar:** entiendo que x4 limita el hilo principal y no el compositor ni el raster, lo que haría optimistas esas columnas. No lo encontré documentado.
- **Memoria de GPU, estimada:** las capas con contenido a mitad del giro suman 13,3 MP en CSS frente a 7,1 MP en rAF; la mayor es la franja, de 2.110×2.110. A DPR 3 serían hasta ~480 MB si se rasterizara todo, aunque Chromium solo rasteriza mosaicos cerca de lo visible. Es el mayor riesgo en un teléfono modesto y conviene probarlo en uno.
- **Corrida interrumpida.** El sistema detuvo el servidor y la matriz por falta de memoria en la máquina, tras 21 de 22 configuraciones, y no los relancé. Por eso faltan: `S2` (la candidata al final del Viaje), la comparación sin GPU, la de DPR 1 y Lighthouse.
- **Ruido.** Máquina compartida, con poca memoria hacia el final, y los primeros ~5 minutos coincidieron con una copia de archivos mía. Una prueba previa de 2 giros dio `P1` 3.412–3.433 ms (coincide) y `C0` 245–256 ms (contra 296). Diferencias menores de ~50 ms en hilo principal no significan nada.
- **Fotogramas perdidos.** `R1` pierde 13 de ~217, `C0` 7 y `base` 0 de mediana (16 hacia Noche, 0 hacia Día). No analicé en qué momento del giro ocurren; es posible que sea la creación de capas al arrancar, pero no lo comprobé.
- **Fidelidad del experimento.** Usa `cubic-bezier(.65,0,.35,1)` como aproximación de la curva del prototipo y no implementa ni el giro interrumpido ni el deslizamiento de los astros en reposo.

## Hallazgos para otros tickets

- **Respuesta del botón de tema:** el clic → pintado ya es de 336 ms en `base`, por encima de los [200 ms de un INP bueno](https://web.dev/articles/inp). No lo causa la Bóveda: `R1` da 284 ms. Todo apunta a las transiciones de `fill`, porque sin ellas baja a 164–200 ms (`C1`, `C2`, `P3`) y con ellas se queda en 284–320 ms (`L1`, `L2`, `R1`). Es una correlación medida, no una causa aislada, y solo es comparable bajo x4.
- **Contraste a mitad del giro:** el texto blanco queda sobre la parte clara del cielo durante parte del giro ([captura](boveda-svg-movil/capturas/C0-css-120-sin-fill-mid.png)). Es transitorio y lo vi en capturas, sin medir el contraste. Afecta a cuándo cambia la interfaz (`ui=inicio`, `mitad`, `final`).

## Fuentes

- web.dev, [How to create high-performance CSS animations](https://web.dev/articles/animations-guide).
- web.dev, [Interaction to Next Paint](https://web.dev/articles/inp).
- Chrome for Developers, [Total Blocking Time](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time).
- Chrome for Developers, [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).
- Lighthouse, [Network and CPU throttling](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md).
- Código: `lighthouserc.json` y `src/app/scene/` en `origin/main`; `prototype-boveda/` y `prototype-clima/` en `origin/prototype/clima-estados`.
