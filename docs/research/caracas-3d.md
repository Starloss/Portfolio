# Datos y stack para una Caracas 3D creíble

Research para [#114](https://github.com/Starloss/Portfolio/issues/114), dentro del mapa [#104 Rework con impeccable](https://github.com/Starloss/Portfolio/issues/104). Sigue al veredicto de [#112](https://github.com/Starloss/Portfolio/issues/112) sobre el primer corte (`?escena=relieve`, commit `1836396`). Diego dijo: "Muy plano, vamos a intentar el camino más 3D con Three.js o lo que convenga, que de verdad parezca una ciudad y una montaña y no tanto un mapa plano". Este documento **no repite** [escena-espectacular.md](./escena-espectacular.md) (#111). Allí están las fuentes de elevación básicas (SRTM, GLO-30, AW3D30), la descalificación de Google 3D Tiles, los modelos de cielo (Preetham, Bruneton, Hillaire), la tabla de rendimiento de las nubes de takram y seis referentes. Aquí se responde lo que faltaba: **con qué datos se hace la ciudad, cómo se hornea, qué se agrega a la montaña, con qué motor y con qué presupuesto**.

**Qué se leyó y qué se midió.** Se hicieron consultas de conteo a la Overpass API de OpenStreetMap el 2026-11-06. Se leyeron las páginas oficiales de licencia y cobertura de OSM, OSMF, Overture, Microsoft, Google Open Buildings, Meta/WRI, ESA WorldCover, EOX y Copernicus, los READMEs y el código de `three.js`, `postprocessing` y `takram-design-engineering/three-geospatial` (incluidos los punteros LFS de sus assets, para conocer el peso real), las APIs de bundlephobia y de npm, las guías de rendimiento de PlayCanvas y Meta y los repos de los referentes. No se descargó ningún dataset, no se corrió ningún build y no se midió nada en un dispositivo. **Lo marcado como "estimación" es una cuenta propia, no una medición.**

## En una frase

La Caracas creíble sale de tres capas de datos abiertos horneadas *offline* en archivos chicos: el **relieve de Copernicus GLO-30** con el color de un **mosaico Sentinel-2** y **árboles reales del mapa de dosel de Meta**, los **edificios de Overture** (OSM con los huecos rellenos por Google y Microsoft) extruidos en el Worker con ventanas procedurales que se encienden de Noche, y los **Hitos modelados a mano**. Todo se dibuja en **three.js WebGLRenderer dentro del mismo Worker con OffscreenCanvas** que ya existe, con la atmósfera física de `@takram/three-atmosphere`, en tres niveles de calidad. Los datos suman unos **1,3–1,8 MB en móvil** y **2,5–3,5 MB en escritorio** (*estimación*), más unos **250–300 kB gzip de JS** diferido.

## 1. La ciudad: edificios

### 1.1 Cobertura real de OpenStreetMap (Overpass, 2026-11-06)

Conteos de `way` y `relation` con `building=*` en cada caja (s, o, n, e). El porcentaje es sobre el total de la zona.

| Zona | Caja | Edificios | con `height` | con `building:levels` | `roof:shape` | `building:part` |
|---|---|---|---|---|---|---|
| **Chacao** (municipio, área administrativa) | — | 1768 | 436 (25 %) | 675 (38 %) | — | — |
| **Altamira** | 10.490, −66.858, 10.507, −66.838 | 1301 | 380 (29 %) | 529 (41 %) | 3 | 2 |
| **El Rosal** | 10.484, −66.866, 10.494, −66.855 | 256 | 5 (2 %) | 115 (45 %) | 31 | 0 |
| **Centro** (El Silencio–Capitolio–Catedral) | 10.500, −66.922, 10.512, −66.905 | 739 | 46 (6 %) | 240 (32 %) | 8 | 1 |
| **Parque Central** | 10.496, −66.904, 10.503, −66.894 | 196 | 112 (57 %) | 95 (48 %) | 4 | 26 |
| **Petare** (barrio) | 10.470, −66.820, 10.490, −66.800 | 6556 | — | — | — | — |
| **23 de Enero / Catia** | 10.500, −66.945, 10.515, −66.930 | 285 | — | — | — | — |
| **Valle completo** (la caja del prototipo) | 10.44, −67.00, 10.53, −66.74 | **66 115** | 2266 (3,4 %) | 3901 (5,9 %) | — | 58 |

En el valle completo, **1478** edificios tienen `building:levels` de 10 a 99 y **753** tienen `height` de 30 m o más. [OVERPASS]

**Lectura.**
- **Las huellas de la ciudad formal están.** Chacao, Altamira, El Rosal, el centro y Parque Central tienen sus edificios dibujados, y las torres que se ven desde el Ávila están casi todas mapeadas.
- **Las alturas, a medias.** Entre el 30 y el 50 % de los edificios de las zonas de torres tienen pisos o altura, pero en el valle completo solo el 6 %. Donde falta el dato, hay que estimarlo (sección 1.3).
- **Los barrios, desparejos.** Petare tiene más de 6500 casas mapeadas en unos 5 km², mientras que 23 de Enero y Catia tienen 285 en una caja de unos 2,7 km², lo que indica huecos. Las huellas de Google y Microsoft pueden rellenarlos (sección 1.2).
- **Los Hitos están en OSM, pero no completos.** La Torre Este (way 601165340) y la Torre Oeste (way 601178803) tienen `height=225`, `roof:shape=flat` y `building:colour=#a9a9a9`, aunque los pisos no coinciden: 56 en una y 64 en la otra. El **Hotel Humboldt** (way 103925749) tiene huella pero no tiene altura ni pisos. El **Teleférico** es la `aerialway=gondola` 341508868, con las estaciones Maripérez y Ávila (68674982 y 68674983). [OVERPASS]
- **Casi no hay techos ni partes.** `roof:shape` y `building:part` son raros. Los techos y la volumetría fina se generan por regla, no salen del dato.

### 1.2 Fuentes de huellas y alturas y sus licencias

| Fuente | Cubre Caracas | Alturas | Licencia | Atribución |
|---|---|---|---|---|
| **OpenStreetMap** | Sí; ver la tabla 1.1 | Parciales (`height`, `building:levels`) | ODbL 1.0: "If you alter or build upon our data, you may distribute the result only under the same license" [OSM-COPY] | "© OpenStreetMap contributors" con enlace a `openstreetmap.org/copyright`. En un mapa interactivo, "in a corner of the map" o junto al mapa [OSMF-ATTR] |
| **Overture Maps** (`buildings`) | Sí: une OSM, Microsoft, Google Open Buildings y Esri, sin duplicados [OVERTURE-ATTR] | `height`, `num_floors`, `min_height`, `roof_shape`, `roof_height` en el esquema [OVERTURE-SCHEMA]. En Caracas solo vienen de OSM; las alturas por LiDAR de Overture son de EE. UU. [OVERTURE-HEIGHT] | ODbL [OVERTURE-ATTR] | "© OpenStreetMap contributors, Overture Maps Foundation" más una línea por fuente (Google: CC BY 4.0; Microsoft) [OVERTURE-ATTR] |
| **Google Open Buildings v3** (polígonos) | Sí; "VEN Venezuela" figura en la lista [GOB] | No | **A elección: CC BY 4.0 u ODbL 1.0** [GOB] | Según la licencia elegida |
| **Google Open Buildings 2.5D Temporal** | Sí; Venezuela incluida, 2016–2023 [GOB-T] | **Raster de altura** con resolución efectiva de 4 m. El error absoluto medio es de 1,5 m, pero solo se evaluó en Norteamérica, Europa y Japón; en el Sur Global se evaluó "mostly qualitatively" [GOB-T] | A elección: CC BY 4.0 u ODbL [GOB-T] | Igual |
| **Microsoft Global ML Building Footprints** | Sin confirmar en el texto (solo se publica un mapa de cobertura) | Solo en EE. UU. y Europa occidental [MS-BLD] | CDLA Permissive 2.0 [MS-BLD] | Aviso de licencia |

**Qué implica la ODbL en la práctica.**
1. **Atribución visible.** Una línea "© OpenStreetMap contributors" junto a la Escena (por ejemplo, en una esquina del Indicador o en el pie) con enlace a `/copyright` cumple la guía de mapas interactivos [OSMF-ATTR].
2. **Compartir la base derivada.** Si la Escena es un Produced Work hecho desde una base modificada (huellas de OSM con alturas propias o de Google), hay que poder ofrecer esa base: "the underlying database has to be published as well" (ODbL §4.6) [OSMF-PW]. Como el repo es público, alcanza con versionar el extracto y el script de horneado, o el GeoJSON intermedio, bajo ODbL. Un binario de huellas cuantizadas que se puede volver a extraer está más cerca de una base que de una imagen, así que es mejor tratarlo como ODbL desde el principio.
3. **Mezclar fuentes sin conflicto.** Google se toma bajo ODbL (está permitido) y Microsoft es CDLA-Permissive. Las dos se pueden combinar con OSM sin choque de licencias.

**Recomendación de fuente.** Conviene descargar **Overture `building` para la caja del valle** (`overturemaps download --bbox=-67.00,10.44,-66.74,10.53 -f geoparquet --type=building` [OVERTURE-PY]). Eso da en un solo paso las huellas de OSM, con sus alturas, más las de Google y Microsoft donde OSM tiene huecos, ya sin duplicados. Las alturas que falten se completan en el horneado (1.3).

### 1.3 Alturas que faltan

Prioridad por edificio, en el script de horneado:

1. `height` de OSM u Overture.
2. `building:levels` × 3,2 m, más 1–2 m de parapeto (*supuesto propio*; la wiki de Simple 3D Buildings no fija metros por piso y recomienda `height` [S3DB]).
3. **La mediana del raster 2.5D de Google** dentro de la huella. El raster se pide para la caja del valle desde Earth Engine (`GOOGLE/Research/open-buildings-temporal/v1`) o desde los GeoTIFF de GCS [GOB-T]. Es la fuente con más cobertura, pero en Caracas su precisión no está validada.
4. Una regla por zona y por área: casas de barrio de 2–4 pisos, residencial formal de 4–12 pisos.
5. **Una lista corta curada a mano** (*estimación*: 30–60 torres), con las que entran en el encuadre del Viaje de cámara, como Parque Central, el Centro Ciudad Comercial Tamanaco, las Torres del Centro Simón Bolívar y las torres de Altamira. Son las que se reconocen, así que no pueden quedar mal.

### 1.4 Cómo hornear edificios creíbles y livianos

**Qué viaja.** No conviene enviar una malla: es mejor enviar **huellas cuantizadas y extruirlas en el Worker**. Una pared extruida no aporta información nueva, solo vértices.

- **Formato.** Coordenadas locales en metros respecto del origen de la Escena, en Int16 con 0,5 m de paso (alcanza para ±16 km), con codificación delta por anillo. Cada huella lleva su altura (Uint8 en pasos de 1 m o Uint16), un tipo (torre, residencial, barrio, Hito) y una semilla.
- **Simplificación.** Douglas-Peucker de 1–2 m antes de cuantizar.
- **Peso.** Si se enviaran las 66 mil huellas del valle a unos 7 vértices cada una, serían ≈1,85 MB crudos y unos 0,6–0,8 MB con Brotli (*estimación*). Pero no hace falta: los edificios que se ven desde el recorrido del Viaje, filtrados por tamaño y distancia, son **unos 15–25 mil** (*estimación*), y pesan **≈250–450 kB**.
- **Extrusión en el Worker.** Paredes con normal plana y techo triangulado con `ShapeUtils`/Earcut, que vienen con three.js. *Estimación:* 50–150 ms en un teléfono medio para 20 mil huellas. Se hace una vez, en trozos, sin trabar el hilo principal.
- **Agrupar en pocas geometrías.** Una `BufferGeometry` fusionada por baldosa de la ciudad (de 1×1 km, por ejemplo) da entre 8 y 16 draw calls, cada una con su culling. `BatchedMesh` es la alternativa si se quiere culling por edificio.

**Techos.** Se generan por regla, porque `roof:shape` casi no existe en Caracas:
- Torres y edificios: techo plano con **parapeto** (un anillo de 1 m) y, con una probabilidad dada por la semilla, cajas de tanques o de ascensores. Son unos pocos triángulos que rompen el "bloque perfecto".
- Casas de barrio: losa plana con bordes irregulares y algunas láminas de zinc. Eso es Caracas.
- Hitos: modelados a mano (sección 4).

**Fachadas y ventanas sin texturas.** La geometría lleva una UV de fachada: `u` es la distancia sobre el perímetro dividida por el ancho de módulo (≈3,5 m) y `v` es la altura dividida por la altura de piso (≈3,2 m). El fragment shader dibuja la grilla de ventanas con `fract(uv)`, y tiene cuatro trucos:
- **El hash por ventana:** `hash(idEdificio, piso, columna)` decide si la ventana existe, su tono y si está encendida.
- **De Día,** el vidrio refleja el color del cielo de la LUT con un Fresnel. Esto es lo que más vende el realismo a la distancia, porque la torre "toma" el atardecer.
- **De Noche,** un emisivo cálido, de 2700–3500 K, en la fracción de ventanas encendidas. Esa fracción depende de la hora, igual que la Afluencia (más alta a las 20 h, mínima a las 3 h) y del tipo de edificio (oficina o vivienda). Encendido y apagado con histéresis por ventana, para que no titile.
- **El nivel de calle,** con planta baja más alta y locales iluminados.

Es la técnica de la "City" de mrdoob, explicada por Jerome Etienne: 20 000 cajas fusionadas y una textura de ventanas con ruido [CITY-100]. Aquí se cambia la textura por un cálculo en shader, para que siga la hora. El costo es de unas pocas instrucciones por píxel, sin texturas y sin VRAM.

**Color de fachada.** `building:colour` cuando existe (lo tienen las Torres). Si no, una paleta por tipo: concretos grises y beige para la ciudad formal, y **ladrillo naranja y bloque** para los barrios, con variación por la semilla.

**Barrios.** Miles de casas chicas no merecen extrusión individual a 5–10 km de distancia. Conviene una **caja instanciada** por casa, a partir del rectángulo orientado de la huella (centro, tamaño, giro y pisos): 8 bytes por instancia. Son 40 mil instancias, 320 kB crudos y ≈150–200 kB comprimidos (*estimación*), dibujadas en un solo draw call. Es el ladrillo de los cerros que se ve desde el Ávila.

**Luces de calle.** Las vías principales de OSM (`highway` de primary hacia arriba, la Autopista Francisco Fajardo y la Avenida Bolívar) se hornean como puntos cada 30–40 m y se dibujan como sprites con bloom de Noche. *Estimación:* 10–20 mil puntos, 40–80 kB.

**Alternativa offline evaluada.** **OSM2World** convierte OSM en glTF con techos y materiales PBR (normal, ORM y desplazamiento) desde la línea de comandos. Su código y sus assets son abiertos ("Use it freely for any purpose") [OSM2WORLD]. Sirve para hornear los **edificios cercanos** con más detalle, pero sus mallas texturizadas pesan mucho más que las huellas, y las ventanas no siguen la hora. Se reserva para el primer plano, si hace falta.

## 2. La montaña

### 2.1 DEM: ¿hay algo mejor que 30 m?

- **No hay un DEM abierto más fino que 30 m para Venezuela.** Ojo con el "ALOS PALSAR RTC de 12,5 m" de ASF: fuera de EE. UU. es **SRTM GL1 remuestreado** a 12,5 m, no un DEM de 12,5 m. ASF aclara que se incluye solo como referencia para la corrección radiométrica [ASF-RTC].
- **Copernicus GLO-30** es el que, en los estudios comparativos, sale primero o empatado. En un estudio en China con más de 240 mil puntos ICESat-2, el RMSE fue de 6,73 m para GLO-30, 6,59 m para NASADEM y 6,63 m para AW3D30, y "Copernicus DEM exhibits the greatest detail of terrain" [DEM-CN]. En Europa, el RMSE de GLO-30 fue de 1,91 m contra 2,82 m de SRTM [DEM-EMD]. Es un **DSM**, así que el dosel del Ávila sube unos metros, lo que ayuda a la silueta, y los edificios del valle hacen bultos que hay que **aplanar bajo las huellas** al hornear: el suelo se toma como el mínimo del vecindario. Su aviso largo ya estaba identificado en #111.
- **FABDEM** (GLO-30 sin edificios ni árboles) tiene licencia **CC BY-NC-SA 4.0, no comercial** [FABDEM]. Un portafolio que busca empleo está en zona gris, así que **no** se recomienda: aplanar bajo las huellas da lo mismo en el valle.
- **Conclusión.** Pasar del SRTM a **GLO-30 a 30 m**: el doble de la resolución que usó el prototipo (≈60 m) y más detalle en las quebradas. El relieve fino que el DEM no tiene (por debajo de 30 m) sale del **dosel** y de un **ruido de detalle** en el shader.

### 2.2 Color del terreno

| Fuente | Resolución | Licencia | Veredicto |
|---|---|---|---|
| **Sentinel-2 L3 Quarterly Mosaics** (Copernicus Data Space) | 10 m, sin nubes, por trimestre; COG por tile MGRS [CDSE-MOS] | Datos Sentinel: libres, con "Contains modified Copernicus Sentinel data [año]" [S2-LEGAL de #111]. La colección STAC dice `license: other`; se asume el régimen Sentinel, pero hay que confirmarlo | **Recomendado.** Un trimestre lluvioso (Q3) para el Ávila verde |
| **EOxCloudless** (s2maps) | 10 m | **CC BY-NC-SA 4.0** para uso no comercial; para uso comercial hace falta una licencia de EOX [EOX-LIC] | Descartado por NC-SA |
| **ESA WorldCover** | 10 m, 11 clases | CC BY 4.0: "© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium" [WORLDCOVER] | **Máscara de clases:** bosque, matorral, construido y suelo desnudo, para saber dónde van árboles y dónde va ciudad |
| **Procedural** por altura, pendiente y clase | — | — | Detalle de cerca, mezclado sobre el satélite |

El satélite de 10 m es el **color macro**. Visto en oblicuo desde el Viaje, cada píxel de 10 m queda chico a más de 2 km y la mancha verde real del Ávila (las quebradas, la línea de la Cota Mil, los claros quemados) se lee de inmediato. De cerca hace falta **detalle procedural**: un ruido triplanar de roca en las pendientes fuertes y de hierba o arbusto en las bajas, mezclado por clase de WorldCover. **La sombra y la luz no se toman del satélite**: hay que neutralizar la iluminación del mosaico (dividir por un sombreado del DEM con el sol de la escena, o desaturar las sombras), porque si no la luz horneada de la mañana del satélite pelea con el Cielo vivo.

### 2.3 Vegetación con volumen

- **Dato.** **Meta/WRI Canopy Height Maps v2**: altura del dosel global, a partir de imágenes de alta resolución de Vantor (ex Maxar), en **CC BY 4.0**. Atribución: Meta y WRI, y "Source imagery for CHM © 2016 Vantor". GeoTIFF en `s3://dataforgood-fb-data/forests/v2/global/dinov3_global_chm_v2_ml3/` [META-CHM2]. La v1 es de 1 m y tiene la misma licencia [META-CHM1]. Permite poner **árboles donde hay árboles, con su altura real**, y no esparcidos al azar.
- **Horneado.** Para el frente del Ávila (*estimación* ≈27 × 15 km), se toma el CHM en celdas de 10–20 m y se genera una lista de instancias (x, z en Int16, altura en Uint8 y variante en Uint8: 6 bytes por árbol).
- **Cuántos árboles se dibujan, en tres anillos:**
  1. **Cerca**, a menos de ~1,5 km del recorrido del Teleférico: árboles 3D low-poly instanciados (copa de 60–150 triángulos), 10–30 mil instancias.
  2. **Media distancia**: impostores (dos planos cruzados o un billboard con normal horneada), 50–150 mil instancias de 2–4 triángulos.
  3. **Lejos**: no son geometría. El CHM entra en el **normal map** del terreno como "brócoli", que es lo que se ve a más de 5 km.
- **Peso.** *Estimación:* 150–350 kB de instancias más 100–200 kB de atlas de copas.
- **Árboles de la ciudad.** Los Caobos, el Parque del Este y las avenidas arboladas usan el mismo CHM recortado al valle, y es lo que hace que Chacao no parezca un render de cajas.

### 2.4 Sombras del terreno sin shadow maps

El Ávila al amanecer y al atardecer se define por sus **sombras largas en las quebradas**, y un shadow map del terreno completo es caro en móvil. La alternativa es un **mapa de horizonte**: para cada texel del terreno se guarda el ángulo del horizonte en 8 acimuts, en dos texturas RGBA8 (*estimación*: 1024 × 704 px, 200–400 kB en WebP sin pérdidas). El shader compara la elevación del sol o de la luna con el horizonte interpolado en su acimut. Da sombras suaves y correctas a cualquier hora por 2 lecturas de textura. Es la técnica de *horizon mapping* (Max, 1988; Sloan y Cohen, 2000), y se hornea con el mismo trazado de rayos que ya hace `scripts/avila-profile.ts`. El mismo dato da una **oclusión ambiental** del terreno gratis.

### 2.5 Nubes pegadas al Ávila

#111 ya cubrió las opciones y su costo. Lo nuevo aquí:
- La nube "que se queda en la Silla" se resuelve con **niebla por altura**, con la base entre 1200 y 1800 m y la densidad sacada de `cloud_cover_low` de Open-Meteo, más **2–3 capas de sprites** de nube iluminados con la LUT. Funciona en todos los niveles de calidad.
- `@takram/three-clouds` queda para el nivel Alto como opción (sección 3.2).

## 3. El stack

### 3.1 Pesos reales

| Paquete | Versión | Peso | Fuente |
|---|---|---|---|
| `three` (todo el módulo) | 0.187.0 | 742 kB min, **185,7 kB gzip** | [BP-THREE] |
| `postprocessing` (todo) | 6.39.6 | 327 kB min, **112,6 kB gzip**. Con tree-shaking, solo EffectComposer, Bloom, SMAA y ToneMapping quedan en ≈30–50 kB (*estimación*) | [BP-PP] |
| `@takram/three-atmosphere` | 0.19.1 | 230 kB min, **61,9 kB gzip** (sin three, postprocessing ni react) | [BP-ATM] |
| `@takram/three-clouds` | 0.7.6 | 252 kB min, **59,3 kB gzip** | [BP-CLOUDS] |
| `@babylonjs/core` (todo) | 9.34.0 | 8,3 MB min, **1,84 MB gzip**. Con tree-shaking, los usuarios del foro reportan entre 240 y 650 kB gzip; no hay una cifra oficial | [BP-BABYLON] [BABYLON-FORUM] |
| `ogl` (actual) | 1.0.x | 8 + 6 + 15 kB minzip (Core, Math, Extras) | #111 |

**Assets de takram** (tamaños reales, leídos de los punteros Git LFS del repo):
- **Atmósfera:** las texturas precalculadas en EXR suman **≈9,7 MB** (`scattering` 4,09 MB, `higher_order_scattering` 3,58 MB, `single_mie_scattering` 1,95 MB, `transmittance` 28 kB, `irradiance` 2 kB). La alternativa es **generarlas en el cliente** con `PrecomputedTexturesGenerator`, que "performs precomputation incrementally over multiple frames" [TAKRAM-ATM]. Para la web, generar.
- **Nubes:** `shape.bin` 2,10 MB (128³), `local_weather.png` 680 kB, `turbulence.png` 50 kB, `shape_detail.bin` 33 kB y `stbn.bin` (del core) 1,05 MB, en total **≈3,9 MB**. Por defecto se bajan de `media.githubusercontent.com`, así que hay que alojarlos en el sitio. [TAKRAM-ASSETS]

### 3.2 Qué aporta cada uno y si corre en el Worker

- **three.js WebGLRenderer en un Worker: sí, oficialmente.** El ejemplo `webgl_worker_offscreencanvas` crea el `WebGLRenderer` sobre el canvas transferido, y aclara: "we don't use ImageLoader since it has a DOM dependency", así que usa `ImageBitmapLoader` [THREE-OFFSCREEN]. `GLTFLoader` ya elige `ImageBitmapLoader` cuando existe `createImageBitmap`, salvo en Safari anterior al 17 o Firefox anterior al 98 [THREE-GLTF]. Esos navegadores tampoco tienen WebGL en OffscreenCanvas, así que no cambia nada. **El protocolo actual (`protocol.ts`, `client.ts` y `worker.ts`) se conserva**: solo cambia el motor dentro del Worker.
- **`postprocessing` en un Worker: compatible en lo que se leyó.** Sus accesos a `document` están protegidos con `typeof document !== "undefined"` (`Timer`, `RawImageData`) [PP-SRC]. No se probó en ejecución.
- **`@takram/three-atmosphere`:**
  - **Qué da:** cielo, sol, luna, estrellas, luz del sol y del cielo, y **perspectiva aérea** como efecto de postprocesado.
  - **Restricciones:** el marco de referencia "is fixed to ECEF and cannot be configured"; para una escena local se usa `worldToECEFMatrix` con el marco norte-arriba-este del elipsoide en Caracas [TAKRAM-ATM]. La perspectiva aérea solo admite BRDF lambertiana, no admite transparencias encima y no tiene rayos de luz volumétricos [TAKRAM-ATM].
  - **Worker:** sus loaders son de datos (`DataTextureLoader`, EXR), sin DOM.
  - **Dependencias:** `three` ≥ 0.170 y `postprocessing` ≥ 6.36.7. Las de React solo hacen falta para `/r3f`.
  - **WebGPU:** la versión TSL es "Work-in-progress" y pide three ≥ 0.182 [TAKRAM-WEBGPU].
- **`@takram/three-clouds`:** solo funciona con la atmósfera. El componente de R3F carga las texturas con `TextureLoader`, que necesita el DOM; en el Worker hay que pasarle texturas ya creadas desde `ImageBitmap` (la API vanilla lo permite). El costo en móvil ya se sabía por #111: un iPhone 13 da 36–53 fps en Low. **Solo para el nivel Alto, y opcional.**
- **Babylon.js:**
  - Corre en un Worker desde la v4.1, pero sin manejo de inputs: `attachControl` no funciona y hay que mandar los eventos por mensajes [BABYLON-OFFSCREEN]. A la Escena le da igual, porque ya funciona así.
  - Trae más de serie: PBR, sombras en cascada, SSAO, postprocesado y WebGPU con fallback.
  - Pero pesa entre 1,3 y 3,5 veces más que three.js con tree-shaking, y **no tiene equivalente de takram**: la atmósfera física habría que escribirla.
  - **Descartado:** el peso y el ecosistema de cielo físico inclinan hacia three.js.
- **ogl con más trabajo.** Todo lo de las secciones 1 y 2 (extrusión, ventanas en shader, instancias y mapa de horizonte) es GLSL propio y podría hacerse en ogl. Lo que no hay en ogl es la atmósfera de Bruneton o Hillaire ya hecha, las sombras en cascada, el AO de pantalla y un postprocesado probado. Se ahorran ~250 kB, pero se pagan con semanas de shaders. Diego pidió el salto: **three.js**.
- **WebGPURenderer / TSL: todavía no.** Obligaría a reescribir los shaders en nodos, y takram para WebGPU está en "work-in-progress". El WebGLRenderer sigue mantenido, así que se migra después si conviene (#111).

### 3.3 Carga diferida

1. **Primer chunk (ya existe):** la SVG o la imagen fija, más la detección de `detect.ts`. Pesa 0 kB extra.
2. **Segundo chunk (Worker):** three.js, el motor de la Escena y takram-atmosphere. Lo cargan solo los equipos que pasan la detección. *Estimación:* 250–300 kB gzip. Lighthouse móvil no lo ve, como ya pasa hoy (#111).
3. **Datos:** se piden después del primer frame. Primero llegan el terreno y el color (la montaña aparece), después la ciudad y por último la vegetación, que entra con un fundido.
4. **Opcional (Alto):** `three-clouds` y sus 3,9 MB, solo si se activa.

## 4. Los Hitos

- **Hotel Humboldt.** Se modela a mano o por código, porque OSM no tiene su altura: un cilindro de 14 pisos sobre su base, sobre la huella de OSM (way 103925749). Con su corona iluminada de Noche.
- **Torres de Parque Central.** Los dos prismas de 225 m sobre las huellas de OSM, más los bloques residenciales. Llevan el mismo shader de ventanas, pero con un patrón propio (franjas horizontales). Al ser Hitos, no pueden caer bajo la regla genérica.
- **Teleférico.** El trazado de la `aerialway` de OSM (way 341508868) y las dos estaciones. Las cabinas ya existen en `circuit.ts` y `cabins.ts`.
- **Avenida Bolívar.** La geometría de OSM se hornea como franja de calle con luces. El Tráfico y la Afluencia actuales viven a nivel de calle, en la parte final del Viaje.
- **Guacamayas.** Se mantienen `birds.ts`, ahora como instancias 3D con alas animadas en el vertex shader.
- **Peso de los Hitos:** *estimación* ≤ 60 kB en GLB con meshopt.

## 5. Rendimiento: presupuesto y niveles

**Referencias de presupuesto.**
- PlayCanvas: "100-200 draw calls is a rough target for low end mobile devices" [PLAYCANVAS-OPT].
- Meta, para la GPU móvil del Quest 2: 750k–1M triángulos por frame [META-PERF].
- Needle, para WebXR en el navegador: menos de 100 draw calls y 200–300 mil triángulos visibles [NEEDLE-VR].

El costo que más pesa en un teléfono es el **costo por píxel**, no los triángulos: cuántos pases de pantalla completa hay y a qué resolución.

| | **Bajo** (teléfono medio) | **Medio** (laptop con iGPU, teléfono alto) | **Alto** (escritorio con dGPU o Apple M) |
|---|---|---|---|
| Triángulos visibles | ≤ 250 mil | ≤ 700 mil | ≤ 1,5 M |
| Draw calls | ≤ 50 | ≤ 100 | ≤ 160 |
| Memoria de texturas | ≤ 96 MB | ≤ 192 MB | ≤ 384 MB |
| Resolución | DPR ≤ 1,25 (≈1 MP) | DPR ≤ 1,5 | DPR ≤ 2 |
| Terreno | 60 m (el prototipo, ya horneado) | GLO-30 | GLO-30 + detalle |
| Ciudad | Torres y cajas de barrio; sin árboles urbanos | Todo, con árboles urbanos | Todo, con techos detallados |
| Vegetación | Solo en el normal map, más 5 mil impostores | Anillos 2–3, más 10 mil 3D | Los tres anillos |
| Sombras | Mapa de horizonte (terreno), sin sombras de edificios | Horizonte, más un shadow map de 2048 para la ciudad | Sombras en cascada (CSM) |
| Postprocesado | Un solo pase: perspectiva aérea, niebla y tone mapping | Aérea, más bloom a media resolución y SMAA | Aérea, AO de pantalla, bloom y SMAA |
| Nubes | Niebla por altura y 2 capas de sprites | Igual, con 3 capas | Igual, o `three-clouds` opcional |
| Datos | ≈1,3–1,8 MB | ≈2–2,8 MB | ≈2,5–3,5 MB (+3,9 MB con nubes) |

*Todos los valores de la tabla son una estimación y una propuesta de partida, no una medición.*

**Cuenta de draw calls del nivel Bajo** (*estimación*): cielo 1, terreno 1–4, ciudad 8–16, barrios 1, impostores 1–2, Hitos 4–6, luces 1, guacamayas 1 y un pase de pantalla. Son unas 25–35, con margen.

**Memoria del nivel Bajo** (*estimación*):
- Color del terreno de 2048 × 1024, unos 11 MB con mipmaps.
- Normal y dosel de 2048 × 1024, unos 11 MB.
- Horizonte, unos 6 MB.
- Altura, unos 2 MB.
- Atlas de árboles, unos 4 MB.
- LUTs de atmósfera, menos de 10 MB.
- Render targets en HalfFloat a 1 MP, unos 8–16 MB.

En total, **≈55–65 MB**. KTX2/Basis no hace falta en este nivel, porque el transcodificador pesa 527 kB de wasm (#111).

**Selección de nivel.** Primero decide la detección actual (`detect.ts`), con WebGL2, reduced-motion, Save-Data y GPU baja. Después, una heurística con `deviceMemory`, `hardwareConcurrency`, el nombre de la GPU (`WEBGL_debug_renderer_info`) y los fps de los primeros 2 s. El **vigilante** baja un nivel por debajo de ~45 fps, en lugar de saltar directo a la SVG, y del nivel Bajo pasa al fallback.

**Fallbacks.**
- **Sin WebGL2, con Save-Data o si el vigilante corta en Bajo:** una **imagen fija del mismo render**, una de Día y otra de Noche en AVIF (*estimación*: 150–250 kB cada una), elegida por la hora. Hay que generarla con la escena real (capturando el canvas en el preview) para que sea la misma Caracas (#111).
- **Con `prefers-reduced-motion`,** si el equipo puede, se dibuja **un frame con la luz real**, sin animación, sin Viaje de cámara (la cámara queda en el encuadre de cada sección, con un fundido) y sin guacamayas en vuelo. La luz no es movimiento (#111).

## 6. Referentes de ciudades 3D en la web que se ven reales

No se repiten los de #111 (bruno-simon, igloo, takram, Firewatch, Apple y MapLibre).

| Referente | Qué impresiona | Técnica |
|---|---|---|
| **[F4 Map](https://demo.f4map.com)** (F4 Group, París) | Es lo más parecido a una Caracas con Cielo vivo: ciudades OSM con **sombras dinámicas según la posición real del sol**, luz nocturna con la **posición y la fase reales de la luna**, cobertura de nubes según el pronóstico, y lluvia y nieve del clima en vivo | WebGL propio sobre edificios y árboles de OSM. Su changelog registra "use real moon position and phase for night lighting" e "improve sky cloud cover with weather forecast" [F4-CHANGELOG] [F4-WIKI]. Código cerrado |
| **[Streets GL](https://github.com/StrandedKitty/streets-gl)** | OSM con aspecto de videojuego: luz PBR, atmósfera y perspectiva aérea, hora del día configurable | Renderer WebGL2 propio con *render graph*, deferred shading y PBR. Postprocesado con TAA, SSAO, DoF, SSR y bloom. Edificios procedurales según Simple 3D Buildings, árboles procedurales y terreno con LOD. Licencia MIT, así que se puede leer [STREETS-GL] |
| **[Mapbox Standard](https://docs.mapbox.com/map-styles/standard/guides/)** | Las ciudades con *light presets* `dawn`, `day`, `dusk` y `night` | Es el patrón de esta Escena: **masa genérica extruida** "with detailed lighting effects, including facade details near landmarks" más **landmarks modelados** "as vibrant 3D models". El preset cambia la temperatura de color, la dirección de las sombras y la luz ambiente [MAPBOX-STD] |
| **"City" de mrdoob, explicada por Jerome Etienne** | Una ciudad nocturna convincente en 100 líneas | 20 000 cajas fusionadas en una sola geometría ("very important for performance") con una textura de ventanas generada, con ruido por cuarto [CITY-100]. Es la base del shader de ventanas de la sección 1.4 |
| **[OSM2World](https://osm2world.org)** | Modelos de ciudad OSM con materiales PBR | Un horneador *offline*: más de 250 claves de OSM, salida a glTF y GLB y materiales con normal, ORM y desplazamiento [OSM2WORLD]. Es el camino si el primer plano necesita más detalle que las extrusiones |

**Lo que tienen en común:**
- Ninguno usa fotogrametría.
- **El realismo sale de la luz** (sol real, sombras, perspectiva aérea y luz de ventanas) aplicada sobre geometría simple y procedural.
- **Los landmarks se modelan aparte.** Es exactamente la división entre ciudad genérica e Hitos de este plan.

## 7. Recomendación para el prototipo

### Datos a hornear

Todo sale de un script *offline* nuevo, hermano de `scripts/prototype-relieve.ts`, que corre una sola vez y escribe en `public/prototype/caracas/`.

| Dato | Fuente (licencia) | Formato | Peso (*estimación*) |
|---|---|---|---|
| Altura del terreno a 30 m | Copernicus GLO-30 (aviso de Copernicus) | Uint16 con delta y Brotli, o PNG de 16 bits; ventana del prototipo, ~937 × 649 | 500–800 kB (Bajo: el SRTM de 60 m actual, 300 kB) |
| Color del terreno | Sentinel-2 L3 Quarterly Mosaic, Q3 (Copernicus Sentinel) | WebP o AVIF de 2048 × 1024, con la iluminación neutralizada | 300–500 kB |
| Normal y dosel | GLO-30 + Meta CHM v2 (CC BY 4.0) | WebP de 2048 × 1024 (normal en RG, dosel en B, clase de WorldCover en A) | 400–700 kB |
| Horizonte y AO del terreno | Calculado del DEM | 2 × RGBA8 de 1024 × 704 | 200–400 kB |
| Árboles | Meta CHM v2 + WorldCover (CC BY 4.0) | 6 B por instancia | 150–350 kB, más el atlas (100–200 kB) |
| Edificios | Overture `building` (ODbL), con alturas de OSM, Google 2.5D y una lista curada | Huellas Int16 con delta, altura, tipo y semilla | 250–450 kB |
| Barrios | Igual | Cajas orientadas de 8 B | 150–200 kB |
| Luces de calle | Vías de OSM (ODbL) | Puntos Int16 | 40–80 kB |
| Hitos | Modelado propio sobre huellas de OSM | GLB con meshopt | ≤ 60 kB |

**Total:** ≈1,3–1,8 MB en Bajo y ≈2,5–3,5 MB en Alto, con carga progresiva.

### Stack

three.js 0.187 (WebGLRenderer) dentro del **Worker actual**, con el mismo protocolo, más `@takram/three-atmosphere` (LUTs generadas en el cliente, perspectiva aérea) y `postprocessing` con tree-shaking. Sin React Three Fiber, porque el Worker no tiene React. *Estimación:* 250–300 kB gzip diferidos. Las variantes se cambian con `?escena=caracas3d` y `?calidad=bajo|medio|alto`, para que Diego compare en su teléfono.

### Presupuesto

El de la tabla de la sección 5. Para el veredicto se mide en el teléfono de Diego en Bajo (la meta es ≥ 45 fps sostenidos) y en un escritorio en Alto.

### Orden de construcción

Cada paso se puede juzgar por separado:
1. **El terreno a 30 m** con el color de Sentinel, la atmósfera de takram y el mapa de horizonte. ¿La montaña ya "parece montaña"?
2. **La ciudad:** las extrusiones con el shader de ventanas de Día y de Noche, más los barrios. ¿Parece ciudad?
3. **Los Hitos y la vegetación.**
4. **El Viaje de cámara del Humboldt a la Avenida Bolívar,** los niveles de calidad y el fallback.

### Riesgos

1. **Las alturas de los edificios.** Faltan en el 94 % de los edificios del valle. El raster de Google no está validado en el Sur Global, así que una torre conocida con la altura equivocada se nota. *Mitigación:* la lista curada de 30–60 torres del encuadre.
2. **La atribución y la ODbL.** Hay que mostrar en la UI "© OpenStreetMap contributors" junto a la Escena, más una línea de créditos para Copernicus (DEM y Sentinel), Meta/WRI (Vantor) y ESA WorldCover. La base derivada (huellas y alturas) se publica bajo ODbL en el repo. **Choca un poco con la UI sobria de #113:** hay que darle un lugar discreto pero visible.
3. **El rendimiento de la atmósfera de takram en móvil no está medido**; solo están medidas las nubes. Si la perspectiva aérea como pase completo no cabe en Bajo, se cae a un Hillaire propio, más barato (#111).
4. **Generar las LUTs en el cliente** necesita render targets de float o half-float, y tarda unos frames en arrancar. Hay que probarlo en Safari de iOS.
5. **El "look Google Earth".** El satélite y el DEM a 30 m pueden verse "de GIS" de cerca. *Mitigación:* que el encuadre del Viaje se quede a más de 1,5 km del suelo hasta el final, más el detalle procedural y la vegetación 3D en el anillo cercano.
6. **La ADR 0003.** Pasar a three.js y al 3D real la reabre: la descartó por ≈150 kB y por el 3D real. Si esto llega a `main`, hace falta una ADR nueva (#111).
7. **La licencia de los mosaicos L3 de Copernicus** dice `license: other` en STAC. Antes de publicar hay que confirmar que es la licencia Sentinel. Si no, se arma el compuesto propio desde escenas L2A, que sí están bajo la nota legal Sentinel.

## Fuentes

- [OVERPASS] Overpass API (`overpass-api.de`), consultas `out count` hechas el 2026-11-06 con `osm_base` del 2026-11-06T04:50Z, para las cajas indicadas y el área administrativa de Chacao. Datos © OpenStreetMap contributors, ODbL.
- [OSM-COPY] OpenStreetMap, [Copyright and License](https://www.openstreetmap.org/copyright)
- [OSMF-ATTR] OSMF, [Attribution Guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)
- [OSMF-PW] OSMF, [Produced Work – Guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline)
- [S3DB] OSM Wiki, [Simple 3D Buildings](https://wiki.openstreetmap.org/wiki/Simple_3D_Buildings)
- [OVERTURE-ATTR] Overture Maps, [Attribution and licensing](https://docs.overturemaps.org/attribution/)
- [OVERTURE-SCHEMA] Overture Maps, [Schema: building](https://docs.overturemaps.org/schema/reference/buildings/building/) y [Buildings guide](https://docs.overturemaps.org/guides/buildings/)
- [OVERTURE-HEIGHT] Overture Maps, [Buildings theme hits 2.3B buildings](https://overturemaps.org/blog/2023/overture-buildings-theme-hits-2-3b-buildings-with-addition-of-google-open-buildings-data/) (alturas de 3DEP para EE. UU.; los polígonos de Google son 2D)
- [OVERTURE-PY] [OvertureMaps/overturemaps-py](https://github.com/OvertureMaps/overturemaps-py) (README, `download --bbox`)
- [GOB] Google Research, [Open Buildings](https://sites.research.google/gr/open-buildings/) (v3, lista de países y doble licencia)
- [GOB-T] Google Research, [Open Buildings 2.5D Temporal](https://sites.research.google/gr/open-buildings/temporal/)
- [MS-BLD] [microsoft/GlobalMLBuildingFootprints](https://github.com/microsoft/GlobalMLBuildingFootprints) (README: licencia CDLA Permissive 2.0 y regiones con alturas)
- [ASF-RTC] NASA Earthdata, [ALOS PALSAR RTC Project](https://www.earthdata.nasa.gov/data/projects/alos-palsar-rtc-project), y ASF, [RTC Product Guide v1.2](https://media.asf.alaska.edu/uploads/RTC/rtc_product_guide_v1.2.pdf) (tabla 1: SRTM GL1 "up sampling")
- [DEM-CN] Comparación de GLO-30, NASADEM y AW3D30 con ICESat-2 en China, *International Journal of Digital Earth* (2022), [doi:10.1080/17538947.2022.2094002](https://www.tandfonline.com/doi/full/10.1080/17538947.2022.2094002)
- [DEM-EMD] EMD International, [Accuracy of the Copernicus DEM](https://help.emd.dk/mediawiki/images/a/ae/20210920_AccuracyCopernicusDEM.pdf) (2021)
- [FABDEM] Hawker et al. 2022, *Environmental Research Letters* 17(2):024016, y [GEE Community Catalog: FABDEM](https://gee-community-catalog.org/projects/fabdem/) (CC BY-NC-SA 4.0)
- [CDSE-MOS] Copernicus Data Space, [The next level: cloudless mosaics](https://dataspace.copernicus.eu/node/883), [Time series of Quarterly Cloud Free Mosaics](https://dataspace.copernicus.eu/node/1290) y [STAC `sentinel-2-global-mosaics`](https://stac.dataspace.copernicus.eu/v1/collections/sentinel-2-global-mosaics)
- [EOX-LIC] EOX, [EOxCloudless License Summary](https://cloudless.eox.at/documentation/license)
- [WORLDCOVER] ESA, [WorldCover data access](https://esa-worldcover.org/en/data-access)
- [META-CHM2] AWS Open Data, [Meta/WRI Canopy Height Maps v2](https://registry.opendata.aws/dataforgood-fb-forestsv2/)
- [META-CHM1] AWS Open Data, [High Resolution Canopy Height Maps (v1)](https://registry.opendata.aws/dataforgood-fb-forests/), y [GEE Community Catalog: Meta trees](https://gee-community-catalog.org/projects/meta_trees/)
- [BP-THREE] [bundlephobia API: three](https://bundlephobia.com/package/three) (0.187.0: 742 263 B min y 185 679 B gzip)
- [BP-PP] [bundlephobia: postprocessing](https://bundlephobia.com/package/postprocessing) (6.39.6: 327 038 B y 112 598 B)
- [BP-ATM] [bundlephobia: @takram/three-atmosphere@0.19.1](https://bundlephobia.com/package/@takram/three-atmosphere) (229 825 B y 61 896 B), y npm registry (dependencias y peers)
- [BP-CLOUDS] [bundlephobia: @takram/three-clouds@0.7.6](https://bundlephobia.com/package/@takram/three-clouds) (252 406 B y 59 283 B)
- [BP-BABYLON] [bundlephobia: @babylonjs/core@9.34.0](https://bundlephobia.com/package/@babylonjs/core) (8 275 009 B y 1 841 290 B)
- [BABYLON-FORUM] Foro de Babylon.js, [Babylon bundle size](https://forum.babylonjs.com/t/babylon-bundle-size/48068), [Tree Shaking ES6](https://forum.babylonjs.com/t/tree-shaking-es6/35049) y [What are good tools for minimizing bundle size?](https://forum.babylonjs.com/t/what-are-good-tools-for-minimizing-bundle-size/56041) (reportes de usuarios, no oficiales)
- [BABYLON-OFFSCREEN] Babylon.js docs, [Offscreen Canvas](https://doc.babylonjs.com/features/featuresDeepDive/scene/offscreenCanvas)
- [TAKRAM-ATM] [three-geospatial/packages/atmosphere](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/atmosphere) (README: ECEF, `worldToECEFMatrix`, `PrecomputedTexturesGenerator` y limitaciones)
- [TAKRAM-WEBGPU] [atmosphere/WEBGPU.md](https://github.com/takram-design-engineering/three-geospatial/blob/main/packages/atmosphere/WEBGPU.md)
- [TAKRAM-ASSETS] three-geospatial, punteros Git LFS de `packages/atmosphere/assets`, `packages/clouds/assets` y `packages/core/assets` y `clouds/src/constants.ts` (`CLOUD_SHAPE_TEXTURE_SIZE = 128`), leídos con la API de GitHub el 2026-11-06
- [THREE-OFFSCREEN] three.js, [`examples/webgl_worker_offscreencanvas.html`](https://threejs.org/examples/webgl_worker_offscreencanvas.html) y [`examples/jsm/offscreen/scene.js`](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/offscreen/scene.js)
- [THREE-GLTF] three.js, [`GLTFLoader.js`](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js) (elección de `ImageBitmapLoader`)
- [PP-SRC] pmndrs/postprocessing, [`src/core/Timer.js`](https://github.com/pmndrs/postprocessing/blob/main/src/core/Timer.js) y [`src/textures/RawImageData.js`](https://github.com/pmndrs/postprocessing/blob/main/src/textures/RawImageData.js)
- [PLAYCANVAS-OPT] PlayCanvas, [Optimization Guidelines](https://developer.playcanvas.com/user-manual/optimization/guidelines/)
- [META-PERF] Meta Horizon, [Unity performance](https://developers.meta.com/horizon/documentation/unity/unity-perf/) (rangos de triángulos por dispositivo)
- [NEEDLE-VR] Needle Engine, [VR Performance](https://engine.needle.tools/docs/how-to-guides/xr/vr-performance)
- [F4-CHANGELOG] F4 Map, [changelog](https://core.f4map.com/changelog)
- [F4-WIKI] OSM Wiki, [F4 Map](https://wiki.openstreetmap.org/wiki/F4_Map)
- [STREETS-GL] [StrandedKitty/streets-gl](https://github.com/StrandedKitty/streets-gl) (README)
- [MAPBOX-STD] Mapbox, [Standard style guide](https://docs.mapbox.com/map-styles/standard/guides/)
- [CITY-100] J. Etienne, [How to do a procedural city in 100 lines](http://learningthreejs.com/blog/2013/08/02/how-to-do-a-procedural-city-in-100lines/) (2013)
- [OSM2WORLD] [OSM2World](https://osm2world.org/)
