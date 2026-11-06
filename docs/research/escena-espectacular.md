# Cómo renderizar una Caracas espectacular

Research para [#111](https://github.com/Starloss/Portfolio/issues/111), dentro del mapa [#104 Rework con impeccable](https://github.com/Starloss/Portfolio/issues/104). Parte de lo que se decidió en [#108](https://github.com/Starloss/Portfolio/issues/108): la UI será sobria y toda la ambición va a la Escena, porque la Escena de siluetas planas "no impresiona".

**Qué se leyó.** Las páginas oficiales de cada dataset (Copernicus, AWS Open Data, USGS, JAXA, la nota legal de Sentinel y OpenStreetMap), las políticas de Google Map Tiles, los READMEs y el código de las librerías (three.js, ogl, `mapbox/martini`, `zeux/meshoptimizer`, `takram-design-engineering/three-geospatial`, `ebruneton/precomputed_atmospheric_scattering`), el paper de Hillaire (EGSR 2020), la documentación de Open-Meteo, caniuse y los referentes que se citan abajo. También se leyeron el código de la Escena actual (`src/app/scene/`) y las ADR 0001, 0003 y 0006. No se descargaron datasets, no se corrió ningún build ni navegador y no se midió nada en un dispositivo. **Los pesos marcados como "estimación" son cuentas propias, no mediciones.**

## En una frase

La forma más barata de que Caracas impresione es un **relieve horneado**: renderizar *offline*, una sola vez y desde los datos reales de elevación, el Ávila y la ciudad vistos desde la cámara de la Escena, en capas con color, normales y profundidad, y que el shader los **reilumine en vivo** con el sol, la luna y el Clima reales. Se ve como 3D, cuesta como 2D y cabe en la arquitectura que ya existe (ogl en un Worker). El 3D real con malla es el siguiente escalón, y el cielo y las nubes volumétricas físicas son el techo: el más espectacular en escritorio, pero rompe el presupuesto en móvil.

## Punto de partida: lo que ya existe

- El perfil del Ávila **ya sale de datos reales**: `scripts/avila-profile.ts` lee el tile SRTM 1" `N10W067` y, desde Los Próceres (10,4745 N, −66,9065 O, 949 m), traza un rayo cada 0,5° de azimut, con curvatura y refracción, para obtener tres crestas por distancia (≤3 km, ≤6,5 km y el horizonte). Escribe `src/app/scene/avila-data.ts`. Los Hitos ya tienen sus coordenadas reales. Es decir, el *pipeline* de datos de elevación ya existe; lo que es plano es cómo se pinta.
- La Escena WebGL (ADR 0003) usa `ogl` en un Worker con OffscreenCanvas, recibe sol, luna, Clima, hora y Viaje de cámara de la página, y dibuja las siluetas SVG rasterizadas como texturas, con nubes y niebla de ruido 2D. La detección deja la SVG con reduced-motion, Save-Data, sin WebGL2 o con GPU baja. Los teléfonos también pasan por la detección, y el vigilante vuelve a la SVG por debajo de ~45 fps.
- El presupuesto de script es de 160 kB (ADR 0006) y solo lo mide la corrida móvil de Lighthouse, donde la GPU es por software y por eso **la WebGL nunca se carga**. Consecuencia importante para el veredicto: Lighthouse no ve el costo de la Escena espectacular. Ese costo solo se puede medir en un dispositivo real.
- La ADR 0003 descartó explícitamente **three.js** (≈150 kB gzip para un plano 2.5D), el **3D real** desde datos de elevación ("más caro en bytes, en tiempo y en tests") y el **arte nuevo pintado** (porque la SVG y la WebGL dejarían de ser la misma Caracas). Cualquier opción de abajo que reabra una de esas tres decisiones necesita una ADR nueva si se adopta en `main`.

## 1. Datos de elevación del Ávila

| Fuente | Resolución | Licencia y atribución | Qué mide | Acceso |
|---|---|---|---|---|
| **SRTM 1" (NASA/USGS)** | 1" ≈ 30 m | Dominio público: "USGS-authored or produced data and information are considered to be in the U.S. Public Domain" [USGS-CR]. El crédito es opcional ("U.S. Geological Survey"). | Superficie por radar en banda C (2000), con huecos rellenados por la NGA [SRTM] | EarthExplorer (GeoTIFF/DTED ≈25 MB por tile, BIL ≈7 MB) [SRTM], o el espejo `elevation-tiles-prod/skadi` que ya usa el repo. Si se usa ese espejo de Mapzen, piden "SRTM data courtesy of the U.S. Geological Survey" [JOERD] |
| **NASADEM** | 1" ≈ 30 m | NASA, mismo régimen que SRTM | Reprocesado de SRTM con menos huecos | LP DAAC / Earthdata [NASADEM] (la página dio 403 al leerla; no se verificó el detalle) |
| **Copernicus DEM GLO-30** | 1" ≈ 30 m (GLO-90: 3") | Gratis para todo uso, **con aviso obligatorio**. Si se modifica (y una malla o un horneado lo son): "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved" [COP-DEM] [COP-LIC] | **DSM** (incluye edificios y vegetación), datum EGM2008, de TanDEM-X (2011–2015) [COP-DEM] | AWS `s3://copernicus-dem-30m`, Cloud Optimized GeoTIFF, tiles de 1°×1° [AWS-COP] |
| **ALOS AW3D30 (JAXA)** | ≈30 m | Gratis para uso comercial y no comercial bajo los términos de JAXA; registro obligatorio [AW3D30] | DSM óptico estéreo, v4.1 (abril de 2024) [AW3D30] | Portal de JAXA |
| **Google Photorealistic 3D Tiles** | Variable (malla fotogramétrica) | **No sirve.** Prohíbe "pre-fetch, index, store, or cache" y los usos offline, exige el logo de Google en pantalla y no permite derivar objetos de las tiles [GMAPS-POL] | Malla fotogramétrica | API de pago con clave |

**Veredicto de datos.** No hay ningún problema de licencia si se sigue con **SRTM** (o NASADEM): es dominio público y el repo ya lo usa. Copernicus GLO-30 suele ser más limpio en montaña, pero obliga a mostrar un aviso largo en el sitio, por ejemplo en el pie o en una página de créditos. Eso es aceptable, pero no gratis para una UI sobria. Google 3D Tiles queda descartado: no se puede hornear ni cachear, y su logo choca con la UI. No se encontró ningún DEM abierto de mayor resolución (LiDAR) para Caracas.

**Lo que 30 m da y lo que no.** Desde Los Próceres, la Silla y el Humboldt están a unos 8 km (cuenta propia con las coordenadas del script). A esa distancia, 30 m subtienden ≈0,2°. Con los 80° de azimut de la Escena repartidos en 1920 px (≈0,04°/px), **cada muestra del DEM ocupa unos 5 px en pantalla**. Las formas grandes (la Silla, las quebradas, el Pico Oriental) salen bien, pero de cerca el relieve se ve liso. Hace falta detalle extra: un *normal map* con ruido o, mejor, un horneado que agregue microrrelieve y vegetación.

**Cómo convertirlo en algo ligero para la web.**

- **Recorte.** El frente del Ávila visible desde la ciudad cabe aproximadamente en 0,25° × 0,14° (de −67,00 a −66,75 y de 10,48 a 10,62). A 1" son unos 900 × 500 muestras, ≈0,9 MB en Int16 crudo. Es la fuente, no lo que se envía.
- **Heightmap en textura + grilla desplazada en el vertex shader.** WebGL2 permite leer texturas en el vertex shader. Se envía un PNG de 16 bits (o RGB "terrarium") de 513 × 257, unos 50 m por muestra, y una grilla plana que el shader eleva. La malla no pesa nada. *Estimación: 100–250 kB* para el heightmap, más un normal map horneado desde los 30 m originales (1024 × 512, *estimación: 150–300 kB*).
- **Malla adaptativa (RTIN).** `@mapbox/martini` genera, "en milisegundos", una malla con nivel de detalle a partir de una grilla de (2^k+1)² y un error máximo en metros [MARTINI]. Si se cuantiza y se comprime con meshoptimizer (EXT/KHR_meshopt_compression: vértices de 2 a 4 veces más chicos, índices de 1 a 1,2 bytes por triángulo [MESHOPT]), una malla de 20–40 mil triángulos queda en *estimación: 60–120 kB*. El decodificador meshopt de three.js pesa 29 kB sin comprimir [THREE-LIBS].
- **Panorama horneado (ver la opción A).** El mismo trazado de rayos que hoy saca las crestas puede sacar, por píxel, la **profundidad** y la **normal** del terreno visto desde la cámara. El resultado son imágenes y no una malla. Es la vía más ligera y la que más se parece a lo que ya hace `scripts/avila-profile.ts`.

**Color del terreno.** Las imágenes Sentinel-2 (10 m) son libres de reproducir, modificar y distribuir, con el aviso "Contains modified Copernicus Sentinel data [Año]" [S2-LEGAL]. Sirven para teñir el Ávila con su verde real y las manchas de las quebradas. La alternativa sin aviso es un color procedural por altura y pendiente.

## 2. Cielo, atmósfera y luz por hora

| Técnica | Qué da | Costo | Notas |
|---|---|---|---|
| **Preetham (1999), analítico** | Cielo de día por fórmula cerrada; es el `Sky` de three.js [THREE-SKY] | Muy barato: unas pocas operaciones por píxel | Sin noche. Flojo con el sol muy bajo, justo en el amanecer y el atardecer que más lucen. Se puede portar a ogl en ~100 líneas de GLSL |
| **Bruneton, scattering precomputado** | Cielo, transmitancia, irradiancia y perspectiva aérea físicas, en tablas precalculadas (BSD) [BRUNETON] | Precálculo de texturas 3D/4D en float; luego barato | `@takram/three-atmosphere` lo implementa para three.js, con un generador de texturas y perspectiva aérea como post-proceso. Necesita `three` y `postprocessing`, y un framebuffer HalfFloat [TAKRAM-ATM] |
| **Hillaire (EGSR 2020)** | LUTs pequeñas (transmitancia, multi-scattering, sky-view y un volumen de perspectiva aérea) que se recalculan cada frame, así que la atmósfera puede cambiar sin precálculo pesado | Escala de un iPhone 6s a una PC de gama alta, ajustando la resolución de las LUT y las muestras [HILLAIRE] [HILLAIRE-TALK] | Es lo que usa Unreal. Es la opción "física" que mejor encaja con un sol que se mueve por hora. Hay que portarla a mano a ogl (son 4 pases chicos) |
| **Gradientes por hora (lo actual) + tinte** | Lo que hoy hace `sky.ts`, más el tinte por hora que en #108 funcionó en Cabré | Casi nulo | No es física, pero dosificada se ve bien. Es el respaldo |

**Luz sobre el relieve.** Con normales (opción A o B), la luz física sale de tres términos: el **sol directo** (Lambert sobre la normal, atenuado por la transmitancia de la LUT), el **cielo** (irradiancia de la LUT) y la **perspectiva aérea** (inscatter y extinción según la profundidad). El tercero es el que hace que el Ávila "se aleje" y se vea enorme. La **luna** usa el mismo modelo con otra intensidad y otro color. La posición y la fase ya las calcula `vault.ts`. La **ciudad de noche** es emisiva: las ventanas y el alumbrado de la Avenida Bolívar no dependen del cielo.

**Clima.** Hoy se pide `current=temperature_2m,weather_code` (`src/lib/clima.ts`). Open-Meteo también ofrece `cloud_cover_low`, `cloud_cover_mid`, `cloud_cover_high` y `visibility` en datos horarios, y su documentación dice que todo lo horario también está como `current`, aunque la lista de variables actuales no los muestra, así que hay que probarlo [OPEN-METEO]. Con eso, la bruma de la perspectiva aérea y la cobertura de nubes salen de datos reales y no solo de las cinco categorías del Clima.

## 3. Nubes

| Técnica | Costo en móvil | Veredicto |
|---|---|---|
| **Volumétricas con raymarching** (`@takram/three-clouds`) | El autor lo dice: "Volumetric clouds are not a lightweight effect". Su tabla: **iPhone 13, 36–53 fps en calidad Low** con upscaling temporal; iPad Pro M4, 60 fps en Medium; MacBook M3 Max, 92–95 fps en High a 4K. Sin upscaling, la M3 Max cae a 31 fps [TAKRAM-CLOUDS] | **Rompe el presupuesto móvil**: el vigilante corta a ~45 fps. Además el propio autor recomienda un skybox si Low no alcanza. Solo sirve para escritorio y exige three.js + postprocessing |
| **Raymarching corto propio** (8–16 pasos, a media resolución, una sola capa) | *Estimación:* de 2 a 4 veces el costo de las nubes de ruido actuales | Posible en escritorio con un nivel de calidad. Riesgoso en móvil |
| **Capas 2D de ruido iluminadas** (lo actual, más normales derivadas del ruido y luz del sol) | Barato | Mejora visible con poco: borde iluminado por el sol, sombra inferior y color de la LUT |
| **Nubes pintadas u horneadas en capas** (sprites con alfa y normal) | Barato | Se ven "de verdad" si el horneado es bueno. Combina con la opción A |
| **Bruma y nubes pegadas al Ávila** (la nube que se queda en la Silla) | Barato: niebla por altura y profundidad | Es *la* imagen de Caracas, y con profundidad horneada sale casi gratis |

## 4. Los Hitos con detalle

- **Fotogrametría disponible: ninguna aprovechable.** No se encontraron modelos abiertos del Hotel Humboldt ni de las Torres de Parque Central en Sketchfab ni en 3D Warehouse. En CGTrader hay un "Caracas terrain" low-poly de pago y modelos de otras torres (Centro Simón Bolívar, BBVA), no de estas [SKETCHFAB-SEARCH]. Google 3D Tiles no se puede usar como fuente porque no permite derivar objetos [GMAPS-POL].
- **Low-poly modelado o procedural (recomendado).** Las formas son simples. El Humboldt es un cilindro de 14 pisos sobre una base. Las Torres de Parque Central son dos prismas de ≈225 m y 56 pisos, y los bloques residenciales son de ≈120 m [SKYSCRAPER]. El Teleférico son cables y cabinas que ya tienen un modelo (`circuit.ts`). Generados por código, son unos cientos de triángulos cada uno y unos pocos kB, con ventanas emisivas por shader. El realismo no sale de la geometría: sale de la luz y la atmósfera de la sección 2.
- **OpenStreetMap para la masa de la ciudad.** Las huellas de los edificios de Caracas pueden extruirse para el skyline de fondo. La licencia es ODbL: pide atribución ("© OpenStreetMap contributors" con enlace a `/copyright`), y la base derivada se comparte con la misma licencia [OSM]. Para el fondo lejano basta un skyline procedural, sin la atribución.
- **Ilustración pintada por capas.** Es el "arte nuevo pintado" que rechazó la ADR 0003. Puede ser lo más bello, pero exige un ilustrador y no sigue la hora real a menos que se pinte con normales. Si se pinta, que sea como en la opción A: color, normal y profundidad, no un color fijo.

## 5. Tecnología

| | Peso de JS | Qué aporta | Encaje con la Escena actual |
|---|---|---|---|
| **ogl** (actual) | Core 8 kB, Math 6 kB y Extras 15 kB minzip; menos con tree-shaking [OGL] | Mínimo: shaders propios, GLTFLoader en Extras | Total. Ya corre en el Worker |
| **three.js** (WebGLRenderer) | **181 kB minzip** (v0.187.0) [BUNDLEPHOBIA] | Ecosistema: Sky, KTX2, meshopt, takram, postprocessing | Sería un chunk diferido 7 veces más pesado que ogl. Solo lo cargan los equipos capaces. Lighthouse móvil no lo ve |
| **three.js WebGPURenderer + TSL** | Similar o mayor | WebGPU con caída automática a WebGL2. TSL compila a WGSL o GLSL. `ShaderMaterial`, `RawShaderMaterial` y `onBeforeCompile` no funcionan y hay que portarlos a nodos [THREE-WEBGPU] | Reescribir los shaders actuales. WebGLRenderer sigue mantenido, pero sin nuevas funciones grandes [THREE-WEBGPU] |
| **WebGPU** puro | — | Compute shaders (LUTs, nubes) | Chrome 113+, Chrome Android y Safari/iOS 26; Firefox lo tiene desactivado por defecto según caniuse, ≈89 % global [CANIUSE-WEBGPU]. Hay que mantener un camino WebGL2 de todos modos |
| **Imágenes o video pre-renderizados por hora** | 0 kB de JS extra | Calidad de render offline sin límite | Ver abajo |

**Imágenes o video por hora.** Apple anima con secuencias de imágenes dibujadas en un canvas al hacer scroll: 148 frames en el ejemplo, y el artículo advierte que "loading hundreds of images will always result in a bloated page" [CSS-TRICKS]. Para la Escena el problema es **combinatorio**. La posición real del sol cambia minuto a minuto, el Clima tiene 5 estados, la luna tiene fases y el Viaje de cámara recorre toda la altura. 24 horas × 5 Clima ya son 120 imágenes por encuadre, y aun así el sol "salta". **Sirve como respaldo, no como Escena**: un puñado de fotos fijas (amanecer, día, atardecer y noche, *estimación: 100–250 kB* cada una en AVIF a 1920 px) para móvil, reduced-motion y equipos sin WebGL2.

**Costo de GPU en móvil.** Lo que manda es el costo por píxel (*fill rate*):

- Limitar el DPR (la Escena ya lo hace con las texturas).
- Calcular el cielo y la atmósfera en LUTs chicas y no por píxel.
- Evitar el raymarching volumétrico.
- Cuidar la memoria de texturas. Una RGBA de 2048 × 1024 sin compresión ocupa 8 MB de VRAM, así que tres por capa son 24 MB. Comprimir con KTX2/Basis ahorra VRAM, pero el transcodificador pesa 527 kB de wasm sin comprimir [THREE-LIBS], y no compensa para pocas texturas. Mejor empaquetar: profundidad en el alfa del color y normales en dos canales.

**Fallbacks y reduced-motion.** El esquema de la ADR 0003 (detección, vigilante y caída) sirve igual. Lo que cambia es *a qué* se cae. Con la opción A, el respaldo puede ser **una foto del mismo horneado** iluminada a la hora de carga, así que la Escena quieta y la animada son la misma Caracas. Eso resuelve la objeción de la ADR 0003 al arte nuevo. Con reduced-motion se pinta un solo frame con la luz real y sin animación, y se ve espectacular igual: la luz no es movimiento.

## 6. Referentes

| Sitio | Qué impresiona | Técnica |
|---|---|---|
| **[bruno-simon.com](https://bruno-simon.com)** (folio 2025) | Un mundo low-poly entero, con vehículo y física | three.js r187 con `three/webgpu` y TSL. El terreno sale de una textura de datos pintada (`terrainData.png`) sobre una grilla de 128 subdivisiones. Los GLB están comprimidos con gltf-transform. Usa Rapier para la física [FOLIO-2025] |
| **[igloo.inc](https://igloo.inc)** (abeto; Site of the Year 2024 de Awwwards) | Hielo y volúmenes que parecen offline | three.js y three-mesh-bvh. Volúmenes VDB de Houdini con un exportador propio, "smaller than a typical website image". Partículas y UI dibujadas en WebGL. Optimizado para equipos de gama baja, sin fallback documentado [IGLOO] |
| **[Demos de takram/three-geospatial](https://takram-design-engineering.github.io/three-geospatial/)** (Fuji, Tokio, Manhattan) | La luz del sol y la bruma sobre paisajes reales, a cualquier hora | Atmósfera de Bruneton, nubes volumétricas y perspectiva aérea sobre 3D Tiles de Google. Es lo más cercano a "Caracas física", y su tabla de rendimiento muestra el límite en móvil [TAKRAM-ATM] [TAKRAM-CLOUDS] |
| **[firewatchgame.com](https://www.firewatchgame.com)** | Un paisaje pintado con mucha profundidad | Seis capas de ilustración que se mueven a distinta velocidad con el scroll (parallax CSS o JS) [FIREWATCH]. Es el techo de lo "2.5D pintado sin luz" |
| **Páginas de producto de Apple** | Objetos fotorrealistas que giran con el scroll | Secuencias pre-renderizadas en canvas. Una prueba con varias instancias que cita el artículo llegó a 55,8 MB en 1609 requests [CSS-TRICKS] |
| **MapLibre GL con terreno y cielo** | Relieve real con niebla y horizonte | Tiles raster-dem con `sky-color`, `horizon-color`, `fog-color` y `atmosphere-blend` (experimental; la niebla requiere el terreno 3D) [MAPLIBRE-SKY]. Demuestra que un DEM de 30 m con niebla ya se lee como paisaje, aunque con el look de un mapa |

Además, la ADR 0003 cita como referencia la intro del blog de Kimi, que es una foto con un canvas encima, no una escena 3D. Es el mismo principio que la opción A.

## 7. Recomendación para el prototipo (ordenada)

### A. Relieve horneado y reiluminado (recomendada)

Un script offline, hermano de `scripts/avila-profile.ts`, traza un rayo por píxel desde la cámara de la Escena contra el DEM (SRTM, de dominio público) y escribe, por cada capa de cresta y para la ciudad, una imagen de **profundidad** y otra de **normales**, con microrrelieve de ruido. El **color** sale de Sentinel-2 o es procedural por altura y pendiente. Los Hitos se rasterizan en el mismo panorama a partir de su geometría low-poly, con una máscara emisiva para la Noche. En ogl, un shader nuevo reilumina todo con el sol y la luna reales, LUTs de cielo al estilo Hillaire, perspectiva aérea por profundidad, niebla pegada al Ávila según `cloud_cover_low` y `visibility`, y nubes 2D iluminadas. El Viaje de cámara y el parallax siguen funcionando por capas y profundidad.

- **Peso.** *Estimación:* 0,6–1,2 MB de imágenes, cargadas después de la detección y solo en equipos capaces. +5–15 kB de JS en el chunk de WebGL. El chunk principal no cambia.
- **Costo de GPU.** Unas pocas lecturas de textura por píxel más una LUT. Similar al actual.
- **Respaldo.** Fotos fijas del mismo horneado (Día y Noche, o cuatro horas) en lugar de la SVG.
- **Riesgo: bajo-medio.** El riesgo está en el arte (que el horneado no se vea "de GIS") y no en la técnica. No necesita Blender ni GPU local: el trazado de rayos es Node puro, como el script actual. Reabre la ADR 0003 en "arte nuevo" y en el papel de la SVG.

### B. 3D real con malla, ogl y Hitos low-poly

Heightmap de 16 bits desplazado en el vertex shader (o malla Martini con meshopt), normal map horneado desde los 30 m, los Hitos procedurales en 3D y el mismo modelo de luz y atmósfera de A. Permite un **Viaje de cámara de verdad** que baja por el cable del Teleférico, con giros y perspectiva real. Ninguna capa 2.5D da eso.

- **Peso.** *Estimación:* 250–500 kB de datos y +15–30 kB de JS (ogl).
- **Costo de GPU.** Medio. La geometría es barata, pero en un DEM de 30 m el primer plano se ve liso a menos de ~2 km, y la cámara del Teleférico pasa justo por ahí: hace falta detalle procedural.
- **Riesgo: medio-alto.** Lo difícil es componer encuadres tan buenos como uno pintado: un 3D a medias se ve como Google Earth. Más tests de Playwright, y reabre la ADR 0003 en "3D real".

### C. Escaparate físico con three.js y takram (solo escritorio)

Atmósfera de Bruneton, nubes volumétricas y perspectiva aérea de `@takram/three-atmosphere` y `three-clouds` sobre la malla de B. Es el resultado más "wow" en escritorio, porque el cielo y las nubes de cualquier hora salen físicamente correctos.

- **Peso.** ≥181 kB minzip de three.js, más postprocessing y takram. *Estimación:* 250–350 kB de JS diferido, más datos.
- **Costo de GPU.** Alto. iPhone 13 a 36–53 fps en Low: no pasa el vigilante. En móvil cae a A o B.
- **Riesgo: alto.** Son dos motores (ogl en móvil y three.js en escritorio) o una migración completa. Ninguno de los dos corre en el Worker de ogl sin rehacer el canal de mensajes. Hay que portar los shaders actuales.

**Lo que no se recomienda:** Google 3D Tiles (por licencia y por su logo), video o imágenes por hora como Escena principal (combinatorio y pesado; solo sirven de respaldo) y nubes volumétricas en móvil.

## Lo que cambia el plan

1. **No hay problema de licencia con SRTM**, que ya se usa. Copernicus GLO-30 exige un aviso de copyright largo y visible: si se elige, hay que darle lugar en la UI. **Google 3D Tiles queda fuera**: no permite hornear ni cachear.
2. **Las nubes volumétricas físicas rompen el presupuesto móvil**: según su autor, ni en Low llegan a 45 fps en un iPhone 13. Sirven solo como mejora de escritorio.
3. **three.js sube el chunk de WebGL de ~15–30 kB a ≥181 kB.** No toca el presupuesto de 160 kB, porque Lighthouse móvil no carga la WebGL, pero sí la carga real en los equipos capaces.
4. **Lighthouse no mide la Escena espectacular** (en CI no hay GPU). El veredicto tiene que medirla en el teléfono de Diego y en un escritorio, con el vigilante como juez.
5. Si se adopta A o B, hacen falta **ADR nuevas** que reemplacen partes de la 0003 (arte nuevo, 3D real y el papel de la SVG como base).

## Fuentes

- [USGS-CR] USGS, [Copyrights and Credits](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits)
- [SRTM] USGS EROS, [SRTM 1 Arc-Second Global](https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm-1)
- [JOERD] tilezen/joerd, [attribution.md](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)
- [NASADEM] NASA Earthdata, [NASADEM_HGT v001](https://www.earthdata.nasa.gov/data/catalog/lpcloud-nasadem-hgt-001) (la página no se pudo leer: 403)
- [COP-DEM] Copernicus Data Space, [COP-DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM) y [avisos](https://dataspace.copernicus.eu/node/1306)
- [COP-LIC] [Licence COP-DEM-GLO-30-F](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf)
- [AWS-COP] AWS Open Data, [Copernicus DEM](https://registry.opendata.aws/copernicus-dem/)
- [AW3D30] JAXA EORC, [ALOS World 3D 30m](https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/aw3d30_e.htm)
- [GMAPS-POL] Google, [Map Tiles API policies](https://developers.google.com/maps/documentation/tile/policies)
- [S2-LEGAL] Comisión Europea, [Legal notice on the use of Copernicus Sentinel Data](https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice)
- [OSM] OpenStreetMap, [Copyright and License](https://www.openstreetmap.org/copyright)
- [MARTINI] [mapbox/martini](https://github.com/mapbox/martini)
- [MESHOPT] [zeux/meshoptimizer](https://github.com/zeux/meshoptimizer) (README: vertex/index codecs, EXT_meshopt_compression)
- [THREE-LIBS] three.js, [`examples/jsm/libs`](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/libs) (`basis_transcoder.wasm` 527.333 B, `meshopt_decoder.module.js` 29.256 B, sin comprimir)
- [THREE-SKY] three.js, [`examples/jsm/objects/Sky.js`](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Sky.js)
- [THREE-WEBGPU] three.js manual, [WebGPURenderer](https://threejs.org/manual/en/webgpurenderer.html) y [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- [BUNDLEPHOBIA] [three@0.187.0](https://bundlephobia.com/package/three)
- [OGL] [oframe/ogl](https://github.com/oframe/ogl) (tabla de tamaños del README)
- [BRUNETON] [ebruneton/precomputed_atmospheric_scattering](https://github.com/ebruneton/precomputed_atmospheric_scattering)
- [HILLAIRE] S. Hillaire, [A Scalable and Production Ready Sky and Atmosphere Rendering Technique](https://diglib.eg.org/handle/10.1111/cgf14050), EGSR 2020
- [HILLAIRE-TALK] [Slides de SIGGRAPH 2020](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf)
- [TAKRAM-ATM] [@takram/three-atmosphere](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/atmosphere)
- [TAKRAM-CLOUDS] [@takram/three-clouds, "Performance tweaks"](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/clouds)
- [OPEN-METEO] [Open-Meteo Forecast API](https://open-meteo.com/en/docs)
- [CANIUSE-WEBGPU] [caniuse: WebGPU](https://caniuse.com/webgpu) (consultado el 2026-11-05)
- [SKETCHFAB-SEARCH] Búsqueda en Sketchfab, CGTrader y 3D Warehouse del 2026-11-05, sin modelos del Humboldt ni de Parque Central
- [SKYSCRAPER] CTBUH, [Parque Central](https://www.skyscrapercenter.com/complex/158)
- [FOLIO-2025] [brunosimon/folio-2025](https://github.com/brunosimon/folio-2025) (`package.json`, `sources/Game/Terrain.js`)
- [IGLOO] Awwwards, [Igloo Inc: Case Study](https://www.awwwards.com/igloo-inc-case-study.html)
- [FIREWATCH] H. Macpherson, [Recreating the Firewatch Parallax Effect](https://medium.com/@hamstu/recreating-the-firewatch-parallax-effect-213694d42f4e), y S. Beckham, [CSS parallax effect](https://medium.com/@samdbeckham/css-parallax-effect-b6ce9d71c0bb)
- [CSS-TRICKS] [Let's Make One of Those Fancy Scrolling Animations Used on Apple Product Pages](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)
- [MAPLIBRE-SKY] [MapLibre Style Spec: sky](https://maplibre.org/maplibre-style-spec/sky/)
