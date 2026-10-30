# Fuente de datos del Clima de Caracas

Investigación del ticket [#65](https://github.com/Starloss/Portfolio/issues/65), hijo del mapa [#64](https://github.com/Starloss/Portfolio/issues/64). Pruebas hechas el 2026-10-30, hacia las 18:10 de Caracas.

Rama desechable: este archivo no se mergea.

**Cómo leer las marcas:**

- **[V]** verificado en vivo con una petición real.
- **[D]** lo dice la documentación oficial; no lo comprobé.
- **[I]** inferencia o lectura mía.

## Respuesta

**Usar Open-Meteo, llamado directamente desde el navegador, con caché en `localStorage` de 30 minutos y sin función de Vercel.**

Petición recomendada:

```
https://api.open-meteo.com/v1/forecast?latitude=10.48&longitude=-66.90&current=temperature_2m,weather_code&timezone=America%2FCaracas
```

Tres motivos deciden:

1. **Una función de Vercel empeora Open-Meteo.** Sus términos advierten que quien usa Vercel puede recibir límites antes de lo esperado, porque los límites van por IP y aplicación. Desde el navegador, cada visitante tiene su propia IP. [D]
2. **MET Norway pide lo contrario.** Sus términos prefieren un proxy propio para clientes de navegador y dejan las condiciones de CORS «still under review». Usarlo bien obligaría a crear la primera función del sitio. [D]
3. **La calidad no desempata.** En Caracas, ambos usan ECMWF IFS como modelo. En la muestra, los dos dieron casi la misma temperatura y nubosidad. [V, una sola muestra]

## Comparación

| Criterio | Open-Meteo | MET Norway (Locationforecast 2.0) |
|---|---|---|
| Clave | No hace falta. Peticiones sin clave respondieron 200. [V] | No hace falta clave, pero sí identificarse. Respondió 200 con y sin User-Agent. [V] La falta de identificación se arriesga a un bloqueo. [D] |
| CORS | `access-control-allow-origin: *`; el preflight `OPTIONS` responde 200. [V] | `Access-Control-Allow-Origin: *`. [V] Solo se permiten peticiones simples y sus condiciones siguen en revisión. [D] |
| Uso desde el navegador | Sin restricción en los términos. | Prefiere un proxy propio. Sitios de poco volumen pueden hacer peticiones simples si se identifican con la cabecera `Origin`. [D] |
| Licencia de los datos | CC BY 4.0. [D] | CC BY 4.0 y NLOD 2.0. [D] |
| Sitio personal público | Gratis solo sin fines comerciales. Sirven los sitios privados sin suscripciones ni publicidad; las «promotional activities» cuentan como comerciales. [D] Ver [riesgos](#riesgos-y-lo-que-no-pude-verificar). | No distingue uso comercial en los términos consultados. [D] |
| Límites | 600/min, 5.000/h y 10.000/día; el tope mensual de 300.000 aún no se aplica. Sin garantía de disponibilidad. [D] | 20 peticiones/s por aplicación en total; respetar `Expires`. [D] |
| Actualización | `current` llega en pasos de 900 s. [V] Fuera de Europa Central y Norteamérica, esos 15 minutos se interpolan de datos horarios. ECMWF IFS se actualiza cada 6 horas. [D] | `Expires` a unos 30 min. [V] Datos globales 4 veces al día. [D] |
| Tamaño y tiempo de respuesta | 277 bytes comprimidos, 0,37 s (una medición). [V] | 2.805 bytes comprimidos (38.936 sin comprimir), 0,73 s (una medición). No se pueden pedir solo algunos campos. [V] |
| Caché HTTP | No envía `Cache-Control` ni `Expires`: la caché la pone el sitio. [V] | Envía `Expires`. [V] |
| Atribución | **Un enlace junto a cada lugar donde se muestren los datos**, más crédito, enlace a la licencia e indicar los cambios. [D] | Crédito a MET Norway, enlace a la licencia e indicar los cambios, «in any reasonable manner». [D] |
| Salida y puesta del sol | Sí, en la misma petición (`daily=sunrise,sunset`): 06:18 y 18:04. [V] | Sí, pero en otro endpoint (`sunrise/3.0/sun`): 06:18 y 18:04. [V] |
| Fase lunar | `daily=moon_phase` respondió 0,670, pero no aparece en la página de documentación que revisé. [V] | `sunrise/3.0/moon` respondió `moonphase: 234.67` grados (equivale a 0,652). [V] |

## Calidad de los datos para Caracas

**Modelo.** Ninguna fuente tiene un modelo regional para Venezuela.

- Open-Meteo usa «global models only» fuera de sus regiones de alta resolución. [D]
- Para Caracas, `best_match` devolvió la misma celda y los mismos valores que `ecmwf_ifs`: `10.5097,-66.9251`, 23,8 °C y 91 % de nubes. [V, una muestra]
- MET Norway usa ECMWF a unos 9 km para el resto del mundo. [D] Dio 23,4 °C y 90,6 % de nubes. [V, una muestra]
- Open-Meteo informó una elevación de 890 m. [V] Es coherente con el valle de Caracas. [I]

**Niebla.** Las dos fuentes abusan de ella.

- Open-Meteo marcó el código 45 en el 21 % de las horas de los últimos 92 días. [V]
- MET Norway marcó `fog` en 30 de sus 62 pronósticos horarios. [V]

**Llovizna.** Con el código literal, `lluvia` ocuparía el 31,4 % de las horas. El 24 % del total es el código 51, siempre con 0,4 mm/h o menos. [V]

**Tormenta.** Es casi invisible en los datos.

- El código 95 aparece en solo 5 de 2.232 horas (0,2 %), todas entre las 12:00 y las 15:00. [V]
- Con ECMWF IFS a 0,25° (`ecmwf_ifs025`) no aparece ninguna. Con GFS, 3. [V]
- Open-Meteo deriva las tormentas de parámetros de inestabilidad, salvo los códigos 96 y 99, que exigen pronóstico explícito de granizo. [D]

**Contraste con observaciones.** No hay estación pública para el valle de Caracas: `SVFM` no devolvió reportes y `SVMI` (Maiquetía) está en la costa, al otro lado del Ávila. [V] Sirve solo como indicio:

- En 7 días, `SVMI` emitió 164 reportes. [V]
- Ninguno trae niebla; 4 mencionan tormenta (2 de ellos en las cercanías) y 8 traen algún fenómeno. [V]
- Sugiere que el modelo exagera la niebla y quizá subestima las tormentas. [I]

**Límites de esta muestra.** Las horas pasadas son datos de modelo, no observaciones, y cubren solo del 30 de julio al 30 de octubre.

## Cómo se mapea a los 5 estados

### Open-Meteo (`weather_code`, recomendado)

| Estado | Códigos | Horas (92 días) [V] |
|---|---|---|
| despejado | 0, 1 | 18,6 % |
| parcial | 2 | 9,2 % |
| nublado | 3, 45, 48, **51** | 64,7 % |
| lluvia | 53, 55, 56, 57, 61–67, 80–82 | 7,3 % |
| tormenta | 95, 96, 97, 99 | 0,2 % |

- **El 51 va en nublado.** Si fuera lluvia, la lluvia animada estaría casi un tercio del tiempo, cuando la llovizna es de 0,4 mm/h como máximo. Es una decisión mía de diseño, a ajustar en los previews. [I]
- **Niebla en nublado.** Evita un estado que el mapa no tiene y que los datos exageran. [I]
- **Nieve (71–77, 85, 86).** No debería ocurrir en Caracas: tratarla como `lluvia`, sin pantalla de error. [I]
- **Código desconocido.** Se trata como un fallo: queda el cielo base, como ya decide el mapa.

### MET Norway (`symbol_code`, plan B)

Se quita el sufijo `_day`, `_night` o `_polartwilight` y se mapea el nombre base ([leyenda oficial](https://github.com/metno/weathericons/blob/main/weather/legend.csv)): [I]

| Estado | Símbolos |
|---|---|
| despejado | `clearsky`, `fair` |
| parcial | `partlycloudy` |
| nublado | `cloudy`, `fog` |
| lluvia | los que contienen `rain`, `sleet` o `snow` sin `thunder` |
| tormenta | los que contienen `thunder` |

En el pronóstico consultado no apareció ningún símbolo con `thunder`, y `probability_of_thunder` no figura en la tabla de datos globales. [V, D]

## Navegador o función de Vercel

| | Navegador (recomendado) | Función de Vercel con caché |
|---|---|---|
| Límite de Open-Meteo | Por visitante. | IP compartida con otros proyectos: Open-Meteo advierte de límites antes de lo esperado. [D] |
| Código nuevo | Un módulo cliente. | La primera función del sitio. Hoy no existe `api/`. [V] |
| Pruebas | Se intercepta la petición en los e2e. | `vite` y `vite preview` no sirven `api/`; los e2e necesitarían otro arreglo. [I] |
| Caché | Por visitante, en `localStorage`. | Compartida en la CDN, por región y sin garantía de permanencia. [D] |
| IP del visitante | Llega a Open-Meteo, que puede guardarla por motivos técnicos. [D] | Queda oculta. |
| Si Open-Meteo falla | Cielo base, como decide el mapa. | Además puede servir datos viejos con `stale-if-error`. [D] |

La función no se descarta por el coste: el plan Hobby incluye 1.000.000 de invocaciones al mes. [D] Se descarta porque añade infraestructura y, con Open-Meteo, un riesgo que no existe en el navegador.

**Plan B:** MET Norway detrás de una función con `s-maxage` ajustado a `Expires`. Es la opción que mejor cumple sus términos, y resuelve cualquier objeción de uso comercial. El cambio queda contenido si la fuente vive en un solo módulo que devuelve `{ estado, temperatura }`.

## Qué cambia para el mapa

1. **El indicador lleva un enlace.** Open-Meteo exige un enlace junto a donde se muestran los datos, por ejemplo «Caracas · 18:42 · 27° · lluvia · Open-Meteo». Si el Clima falla, no se muestran datos y el enlace puede desaparecer. [D, I]
2. **El tinte del cielo también muestra datos.** Sigue visible cuando el Hero ya salió de pantalla. Leo que basta con el enlace del Hero, pero un segundo crédito en el pie cuesta poco y cubre también la licencia y el aviso de cambios. [I]
3. **Salida del sol, puesta del sol y fase lunar no deben venir de la API.** El mapa pinta el cielo correcto y fija el tema antes de pedir el Clima, así que esos datos deben estar disponibles sin red. Hay que calcularlos en el cliente, cuidando el presupuesto de JS (147 de 150 kB según el mapa). [I]
4. **Refrescar cada 30 minutos.** Es el extremo alto del rango del mapa (15–30). El modelo se actualiza cada 6 horas, y en Caracas el paso de 15 minutos es interpolado. [D, I]
5. **`tormenta` necesita forzarse.** Saldrá muy pocas veces (0,2 % de las horas), así que probar los rayos depende del punto pendiente del mapa sobre forzar hora y Clima. [V, I]
6. **Sin cambios de CSP.** El repositorio no define `Content-Security-Policy`: `vercel.json` no tiene cabeceras y la búsqueda no encontró nada. [V]

## Riesgos y lo que no pude verificar

- **Uso no comercial.** Leo que un portafolio sin anuncios ni suscripciones entra como sitio privado, pero Open-Meteo también cuenta como comerciales las «promotional activities», y este sitio promociona a Diego para conseguir empleo. **No está confirmado por Open-Meteo.** Si se quiere certeza, se le puede preguntar, o usar el plan B. [I]
- **Acceso desde Venezuela.** Probé desde esta máquina, no desde una red venezolana. Si la API no responde allí, queda el cielo base. Conviene mirarlo en un preview desde Caracas.
- **Navegador real.** Comprobé CORS con `curl` enviando `Origin`, no con un navegador.
- **Límites.** No provoqué un 429, y el «por IP y aplicación» de los términos no explica cómo se identifica una aplicación.
- **Revalidación de MET Norway.** Una petición con `If-Modified-Since` devolvió 200 con cuerpo, no 304. Una sola prueba, sin conclusión.
- **Precisión real en Caracas.** No hay estación pública en el valle para medirla. Los porcentajes describen lo que el sitio mostraría, no si acierta.

## Fuentes

**Open-Meteo**

- [Términos](https://open-meteo.com/en/terms): límites, uso no comercial, aviso sobre Vercel, IP
- [Licencia](https://open-meteo.com/en/licence): CC BY 4.0 y atribución
- [Documentación](https://open-meteo.com/en/docs): `weather_code`, modelos, `current`
- [Precios](https://open-meteo.com/en/pricing): tope mensual y disponibilidad
- [Discusión #853](https://github.com/open-meteo/open-meteo/discussions/853): el mantenedor habla de IP compartidas en Vercel

**MET Norway**

- [Términos](https://api.met.no/doc/TermsOfService): identificación, proxy, CORS, caché, 20 peticiones/s
- [Licencia](https://docs.api.met.no/doc/License)
- [Modelo de datos](https://docs.api.met.no/doc/locationforecast/datamodel): ECMWF, cobertura y frecuencia
- [Sunrise 3.0](https://api.met.no/weatherapi/sunrise/3.0/documentation)
- [Leyenda de símbolos](https://github.com/metno/weathericons/blob/main/weather/legend.csv)

**Vercel**

- [CDN Cache](https://vercel.com/docs/caching/cdn-cache): `s-maxage`, `stale-if-error`, caché por región
- [Fair use](https://vercel.com/docs/limits/fair-use-guidelines): invocaciones de Hobby

**Observaciones**

- [Aviation Weather Center, API de METAR](https://aviationweather.gov/data/api/): `SVMI`, `SVFM`

**Peticiones en vivo**

- `api.open-meteo.com/v1/forecast` con `latitude=10.48&longitude=-66.90`; distribución con `hourly=weather_code,cloud_cover,precipitation&past_days=92&forecast_days=1`
- `api.met.no/weatherapi/locationforecast/2.0/compact?lat=10.48&lon=-66.90&altitude=900`
- `api.met.no/weatherapi/sunrise/3.0/sun` y `/moon` con `lat=10.48&lon=-66.90&offset=-04:00`
