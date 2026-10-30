# Cálculo de sol, luna y hora de Caracas sin red

Investigación para el issue #66 (hijo del mapa #64). Fecha: 2026-10-30. Rama desechable: no se mergea.

**Pregunta:** ¿cómo se calculan en el cliente la hora de Caracas, la salida y puesta del sol, la posición del sol y la luna y la fase lunar, y cuánto pesa? ¿Qué debe correr antes del primer pintado y qué puede ir en un chunk diferido?

Cada dato lleva su procedencia:

- **[Medido]**: lo corrí yo para esta nota.
- **[Código]**: leído en este repo o en el código de la librería.
- **[Doc]**: lo afirma la documentación o una fuente publicada, y no lo comprobé por mi cuenta.
- **[Inferencia]**: conclusión mía a partir de lo anterior.
- **[No verificado]**: queda sin comprobar.

## Respuesta corta

**Código propio, sin dependencias, repartido en dos piezas:**

| Pieza | Dónde corre | Qué hace | Peso |
| --- | --- | --- | --- |
| Compuerta del tema | Script clásico inline en el `<head>` de `index.html`, antes del CSS | Si hay elección guardada la aplica. Si no, calcula si el sol está sobre el horizonte de Caracas y pone `.dark` | 299 B gzip en el HTML; no cuenta como script en Lighthouse |
| Módulo `sky` | Chunk principal, al montar React | Altura y recorrido del sol y la luna, fracción iluminada, creciente o menguante, inclinación y hora de Caracas | 760 B gzip en el chunk principal |

- **Salida y puesta:** no hace falta calcularlas. El tema y el tinte salen de la altura del sol, y el indicador solo muestra la hora actual.
- **Hora:** `UTC-4` fija con aritmética de `Date`, más un test que la compara con `Intl` y `America/Caracas`. `Intl` en tiempo de ejecución cuesta unos 73 ms con CPU x4 la primera vez.
- **Nada va diferido:** un chunk aparte seguiría contando en el presupuesto de Lighthouse, pesaría más y haría que el astro apareciera tarde.

**Tres correcciones al punto de partida del mapa:**

1. El JS inicial real en CI no es 147 kB. Son **151.612 B**, porque el 147 no incluye Umami. Ver [El presupuesto real](#el-presupuesto-real).
2. `theme.tsx` guarda el tema en `localStorage` al montar. Con eso, la regla «sin elección guardada manda la hora» dejaría de valer desde la segunda visita, y hoy ya no vale para quien haya visitado el sitio. Ver [Lo que hay hoy](#lo-que-hay-hoy-en-el-tema).
3. Con posiciones reales, la luna falta durante la mitad de la noche y los astros pasan la mayor parte del tiempo a espaldas de una Escena que mira al norte. Ver [Decisiones del mapa afectadas](#decisiones-del-mapa-afectadas).

## Comparación de opciones

### Peso aislado

[Medido] Cada opción empaquetada con esbuild 0.25 (`bundle`, `minify`, ESM, tree-shaking), con gzip nivel 9. Script en `size.mjs`, incluido en el [apéndice](#apéndice-método).

| Opción | Lo que se importó | min (B) | gzip (B) |
| --- | --- | --- | --- |
| `astronomy-engine` 2.1.19 | `Observer`, `Equator`, `Horizon`, `SearchRiseSet`, `Illumination`, `MoonPhase` | 57.166 | 24.940 |
| `sunrise-sunset-js` 3.3.1 | Solo salida y puesta | 15.657 | 5.946 |
| `suncalc3` 2.0.5 | Completa, sin tree-shaking | 10.953 | 4.159 |
| `suncalc` 2.1.1 | Completa | 7.846 | 3.800 |
| `suncalc` 2.1.1 | `getPosition`, `getTimes`, `getMoonPosition`, `getMoonIllumination` | 6.559 | 3.221 |
| `suncalc` 2.1.1 | `getPosition`, `getMoonPosition`, `getMoonIllumination` | 5.400 | 2.607 |
| `suncalc` 1.9.0 | Completa | 3.885 | 1.969 |
| `lunarphase-js` 2.0.3 | Solo fase, `Moon` | 2.483 | 951 |
| **Propio `sky`** | Sol, luna, fase e inclinación | 1.185 | **747** |
| **Propio compuerta** | Solo «¿hay sol?» | 328 | **229** |

Dos datos de la versión 2 de `suncalc` que difieren de lo que se suele citar:

- [Medido] `npm` publica `suncalc` 2.1.1 (2026-10-05). La cifra que suele repetirse corresponde a la 1.9.0, de 2022.
- [Código] La 2.x cambió a las series de Meeus, con dos tablas de 60 filas para la luna. Es más precisa y pesa más. También cambió la API: ahora usa grados y el acimut se mide desde el norte.

### Peso real en el bundle

[Medido] Sumando cada variante a una copia de `origin/main` (`457fffb`), con `pnpm run build` completo. El gzip es el de la medición anterior: nivel 9 sobre el chunk `index-*.js`, base 126.212 B.

| Variante | Chunk principal (gzip) | HTML (gzip) |
| --- | --- | --- |
| Solo compuerta, con `theme.tsx` leyendo el DOM | −67 B | +299 B |
| Compuerta + `sky` propio | +705 B | +298 B |
| **Compuerta + `sky` + hora fija (recomendada)** | **+760 B** | **+299 B** |
| Compuerta + `sky` + hora con `Intl` | +792 B | +300 B |
| `suncalc` 2 sin `getTimes`, sin compuerta | +2.779 B | +0 B |
| `suncalc` 2 con `getTimes`, sin compuerta | +3.362 B | +0 B |

La compuerta aparece en las 8 páginas HTML que genera `postbuild` [Medido]. Vite deja intacto el script clásico inline [Medido].

### Precisión

[Medido] Contra `astronomy-engine`, cada hora de 2026 a 2035 (87.648 muestras), en Caracas (10,4806, −66,9036), con horizonte a nivel del mar. `sky` no modela la refracción, así que se compara contra la posición geométrica. Las librerías se comparan contra la aparente, porque ellas sí la aplican.

| Separación angular | Sol p50 / máx. | Luna p50 / máx. | Fracción iluminada, máx. |
| --- | --- | --- | --- |
| **Propio** | 0,005° / 0,012° | 0,086° / 0,372° | 0,34 pp |
| `suncalc` 2.1.1 | 0,012° / 0,472° | 0,012° / 0,484° | 0,011 pp |
| `suncalc` 1.9.0 y `suncalc3` 2.0.5 | 0,225° / 0,774° | 1,071° / 3,924° | 2,35 pp |

[Inferencia] Los máximos de `suncalc` 2 se deben a que su modelo de refracción y el de `astronomy-engine` difieren cerca del horizonte, porque la mediana es mucho menor. No lo aislé.

| Error de salida y puesta (3.652 días) | p50 | máx. |
| --- | --- | --- |
| Propio (cruce de la compuerta) | 0,018 min | 0,068 min |
| `suncalc` 2.1.1 | 0,027 min | 0,088 min |
| `suncalc` 1.9.0 | 1,29 min | 2,01 min |

Otras comprobaciones [Medido]:

- **Contraste externo con USNO:** consulté su API `rstt/oneday` para los días 1 y 15 de cada mes de 2026 (24 fechas). La compuerta da la misma hora al minuto en las 24, y `astronomy-engine` también. La diferencia máxima es de 0,5 min, que es el redondeo de USNO. `suncalc` 2 se desvía un minuto en una fecha (2026-06-01, puesta). La fracción iluminada coincide con la de USNO con diferencia máxima de 1 punto porcentual.
- **Creciente o menguante:** falla en 33 de 87.648 horas, justo alrededor de la luna nueva o llena. Ahí no se aprecia.
- **Inclinación de la parte iluminada:** contra `suncalc` 2, con la luna a más de 5% iluminada: p50 0,06°, p99 1,56°, máx. 19,4°. [Inferencia] Los picos deben ocurrir con la luna cerca del cenit, donde el ángulo paraláctico está mal condicionado. No lo aislé.
- **Costo por llamada, en Node:** compuerta 0,21 µs, `sky` 1,43 µs, `suncalc` 2 11,89 µs, `astronomy-engine` 37,06 µs.

**¿Cuánta precisión hace falta?** [Inferencia] Si un arco de 180° se dibuja a lo ancho de la pantalla, 1° equivale a unos 2,3 px con 412 px de ancho y a 8 px con 1.440 px. El peor error de la luna propia (0,37°) son unos 3 px. Con eso sobra para una Escena decorativa, y la precisión adicional de `suncalc` 2 no se llega a ver.

### Mantenimiento

| | Propio | `suncalc` 2 |
| --- | --- | --- |
| Código | Unas 50 líneas con fórmulas estables | Dependencia sin dependencias propias, con tests propios |
| Riesgo | Es nuestro y hay que probarlo; se cubre con valores de referencia fijos | Versión mayor de 2026-06, con cuatro versiones desde entonces [Medido] |
| Licencia | Ninguna que cumplir | BSD-2-Clause: hay que conservar el aviso de copyright [Código] |
| Validez | Las fórmulas del sol valen para unos dos siglos alrededor de 2000 según USNO [Doc]; medí 2026–2035 | «Good ~1900–2150» para el ΔT, según su código [Código] |
| Cobertura ≥80% | La lógica pura se cubre con tests del repo | No suma código propio que cubrir |

**Decisión:** código propio. `suncalc` 2 es muy buena opción y sería la elegida con margen de sobra, pero la diferencia de unos 2 kB se come casi todo el presupuesto restante, y lo que aporta (`getMoonTimes`, tablas de Meeus) no se aprovecha aquí. Si más adelante se necesitan salida y puesta de la luna o más precisión, se cambia detrás de la misma interfaz. `astronomy-engine` queda como referencia para generar los valores fijos de los tests, sin entrar al repo como dependencia.

Las fórmulas del sol son las de USNO, [Approximate Solar Coordinates](https://aa.usno.navy.mil/faq/sun_approx) [Doc]. Las de la luna son las de baja precisión del Astronomical Almanac. **No consulté el Almanac impreso.** Escribí los coeficientes de memoria y [MOONPOS.PRO](https://data.phys.ucalgary.ca/sort_by_project/other/poca/eu9367/001/IDL/STEELE/MOONPOS.PRO), que dice implementar esas fórmulas, trae la misma forma con diferencias en los últimos dígitos, probablemente de otra edición. Los doy por buenos por la comparación numérica de arriba, no por la cita. La spec debería citar la edición impresa o copiar los coeficientes de una fuente confirmada.

## Hora de Caracas

- [Doc] La [tzdb de IANA](https://data.iana.org/time-zones/tzdb/southamerica) registra `America/Caracas` en −4:00 desde 2016-05-01 a las 02:30, y en −4:30 entre 2007-12-09 y esa fecha. Venezuela cambió dos veces en 20 años.
- [Medido] `Intl` en Chromium 156 resuelve bien esos cambios: 07:30 el 2016-04-30 12:00Z, y 08:00 el 2016-05-02 12:00Z.
- [Medido] **El primer uso de `Intl.DateTimeFormat` con `timeZone` cuesta entre 67 y 87 ms con CPU x4**, mediana unos 73 ms, en 7 páginas nuevas por idioma. El idioma no cambia el resultado. Después cada `format` cuesta unos 8 µs.
- [Código] Hoy `src/` no usa `Intl` ni `toLocale*`, así que ese costo sería nuevo.
- [Medido] En Lighthouse móvil local, con 5 corridas por variante en tres rondas, la mediana de TBT fue:

| Ronda | Base | Hora fija | `Intl` |
| --- | --- | --- | --- |
| 1 | 116 ms | 114 ms | 121 ms |
| 2 | 112 ms | 113 ms | 147 ms |
| 3 | 128 ms | 133 ms | 148 ms |

La hora fija no se distingue de la base. `Intl` siempre queda peor, entre 5 y 35 ms, y en dos de esas rondas el rendimiento fue 0,92 en lugar de 0,93. Las rondas 1 y 2 usaron una variante previa de `theme.tsx` que no leía el DOM, y la ronda 3 la definitiva. [Inferencia] Eso no debería alterar la comparación, porque todas corrieron de día en Caracas y solo cambia cómo se decide el tema. El ruido entre rondas es grande: la base sola varía 16 ms.

**Recomendación:** constante `CARACAS_UTC_OFFSET = -4`, formato hecho a mano, y un test unitario que compare la constante con `Intl` y `America/Caracas`. El test se pondría rojo cuando el tzdata de Node recoja un cambio de ley. [Inferencia] El test avisa solo cuando Node actualiza su tzdata, y entre un cambio de ley y un despliegue la hora estaría errada. Para un indicador decorativo es aceptable.

[Doc] El [constructor de `Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat) acepta cualquier nombre IANA, y por eso sirve para el test.

La compuerta y `sky` no dependen de ninguna zona horaria: parten de `Date.now()` en UTC y de las coordenadas. Si el reloj del dispositivo está mal, todo estará mal. No hay forma de saberlo sin red, y es aceptable.

## Qué corre antes del primer pintado

### Lo que hay hoy en el tema

[Código] `index.html` **no aplica ningún tema**: no hay script inline. El tema lo pone `src/lib/theme.tsx`, en un `useEffect`, dentro de un módulo que el navegador evalúa al terminar de analizar el HTML. El [estándar HTML](https://html.spec.whatwg.org/multipage/scripting.html) lo describe así: un módulo sin `async` se evalúa «when the page has finished parsing», mientras que un script clásico inline se ejecuta de inmediato [Doc].

[Medido] Consecuencia: con CPU x4, en Chromium 156, frame a frame, con el sistema en oscuro:

| Momento | `.dark` | Fondo de `html` | Contenido en `#root` |
| --- | --- | --- | --- |
| ~60 ms (primer pintado) | no | `rgb(94, 168, 220)`, cielo de Día | vacío |
| ~985 ms | sí | `rgb(5, 10, 26)`, cielo de Noche | 4 hijos |

**Quien hoy ve Noche ve casi un segundo de cielo azul antes**, en esta medición local sin limitar la red. También pasa con una elección guardada: el fallo no depende de la preferencia del sistema. La compuerta lo corrige. Es un fallo actual, independiente del Cielo vivo.

[Código] Otros tres puntos del tema actual que afectan a este trabajo:

1. **`theme.tsx` escribe `localStorage.theme` al montar**, no solo con el toggle. [Medido] Tras la primera carga sin elección, `localStorage.theme` ya vale `dark` o `light`. Eso congela el tema desde la segunda visita, y hace imposible saber quién eligió: **toda persona que ya haya visitado el sitio tiene esa clave aunque nunca haya tocado el toggle.**
2. **`:root { color-scheme: light dark }`** en `src/tailwind.css`. Las barras de desplazamiento y los controles nativos siguen al sistema operativo, aunque el mapa decidió dejar de usarlo. Debe atarse a `.dark`.
3. **Las pruebas dependen de la preferencia del sistema:** `e2e/escena.spec.ts` elige el tema con `emulateMedia({ colorScheme })` y dejará de funcionar así. Otros siete tests unitarios simulan `matchMedia` (`branches`, `escena-upgrade`, `home-sections`, `main`, `Scene`, `theme`, `ui`). Parte de esos usos puede ser para otras consultas, como reduced-motion, así que hay que revisarlos uno por uno; no los audité.

### La compuerta

[Medido] Prototipo de 473 B en `<head>`, con la clave nueva `theme-choice` y `theme.tsx` leyendo `.dark` del DOM en lugar de decidir por su cuenta. Con la hora falseada en Chromium y CPU x4, frame a frame:

| Caso | Sistema | Estados vistos | `theme-choice` al cargar |
| --- | --- | --- | --- |
| Mediodía | Oscuro | Solo Día | vacío |
| 22:00 | Claro | Solo Noche | vacío |
| 18:03 del 30-oct (puesta USNO ~18:04) | Claro | Solo Día | vacío |
| 18:06 del 30-oct | Claro | Solo Noche | vacío |
| 22:00, eligió claro | Claro | Solo Día | `light` |
| Mediodía, eligió oscuro | Claro | Solo Noche | `dark` |
| 22:00, clave vieja `theme=light` | Claro | Solo Noche | vacío |

Ningún caso cambia de tema durante la carga. Ejecutarla cuesta 3 ms la primera vez con CPU x4 (incluye compilarla con `eval`) y menos de 0,3 ms después.

[Medido] En mi primer intento, `theme.tsx` conservaba su `getInitialTheme` y React revertía el tema a la preferencia del sistema al montar. **La compuerta no alcanza sola: `theme.tsx` tiene que dejar de decidir.**

[Medido] Lighthouse no cuenta el script inline como script: con la variante recomendada, `resource-summary:script` sube 729 B (solo el chunk) y `document` sube 308 B.

[Código] `vercel.json` no define `Content-Security-Policy`, así que hoy nada bloquea un script inline. Si se agrega una CSP, habrá que permitirlo con su hash.

### Por qué la altura del sol y no una ventana de horas

El mapa dice que «la hora de Caracas fija el tema». [Medido] Con `astronomy-engine`, de 2026 a 2035, en Caracas la salida va de 06:05 a 06:51 y la puesta de 18:01 a 18:54. Una ventana fija da el tema equivocado una parte de cada día:

| Regla | Error medio | Peor borde |
| --- | --- | --- |
| 06:00–18:00 | 55 min/día | 54 min |
| 06:30–18:30 | 29 min/día | 29 min |
| Altura del sol | ~0 | 4 s |

[Inferencia] La ventana ahorraría menos de 229 B, que es todo lo que pesa la compuerta aislada, pero haría que «coincide con la hora» y la posición real del sol se contradijeran a diario. **Recomiendo altura > −0,833°**, la convención de salida y puesta que usan USNO y `suncalc` [Código]. Es una sola constante: si Diego prefiere que sea Noche más tarde, se puede cambiar sin costo.

### Qué va en cada sitio

| Dato | Dónde | Por qué |
| --- | --- | --- |
| Tema inicial | Inline en `<head>` | Es lo único que se ve antes de montar React: el fondo de `html` |
| Hora, sol, luna, fase | Chunk principal, al montar | [Medido] `#root` está vacío hasta entonces, así que antes no hay nada que los muestre |
| Sol y luna en WebGL | Los manda la página por `protocol.ts` | [Código] Ya funciona así con `night`, y evita duplicar código en el Worker |
| Clima | Diferido, como decidió el mapa | Depende de red; lo cubre otro ticket |

**¿Por qué no diferir `sky`?** [Medido] Porque **un chunk diferido sigue contando si carga durante la corrida de Lighthouse**: `detect` y `motion-features`, ambos con `import()`, aparecen en `resource-summary:script`. Además `detect` pasa de 1.043 B de gzip a 1.428 B transferidos: un chunk propio suma unos 385 B ([Inferencia] sobre todo cabeceras). Diferir `sky` añadiría bytes, una petición y un astro que aparece tarde. No gana nada.

## El presupuesto real

[Medido] Reportes móviles de Lighthouse en CI, run `41109988744` de `main` (`457fffb`), ruta `/`:

| Script | Bytes transferidos |
| --- | --- |
| `index` | 127.885 |
| `motion-features` | 17.596 |
| `script.js` de Umami | 4.703 |
| `detect` | 1.428 |
| **Total** | **151.612** |

- [Código] La aserción de `lighthouserc.json` es `resource-summary:script:size ≤ 155.000`, y no 150.000. En `/projects/*` el total es 150.184, sin `detect`.
- [Inferencia] De ahí sale el «147 kB»: 127.885 + 17.596 + 1.428 + 64 = 146.973. Es exactamente lo que da una corrida local cuando el script de Umami responde 204.
- [Medido] En mi máquina Lighthouse recibió ese 204 con 64 B, mientras que `curl`, Chromium por su cuenta y Lighthouse en CI recibieron 200 con el script completo. **No encontré la causa.** Probé con el User-Agent de Lighthouse y con un `Referer` de localhost y `curl` siguió recibiendo 200.

| Opción, ruta `/` en CI | Total estimado | Margen hasta 155.000 B | Contra 150.000 B |
| --- | --- | --- | --- |
| Hoy | 151.612 B | 3.388 B | Ya se pasa por 1.612 B |
| **Propio** | ~152.341 B | ~2.659 B | Se pasa por ~2.341 B |
| `suncalc` 2 + compuerta | ~154.390 B | ~610 B | Se pasa por ~4.390 B |

[Inferencia] Los totales estimados suman a la cifra de CI el aumento medido en local. No corrí la variante en CI. La fila de `suncalc` usa su aumento en gzip, sin medirlo con Lighthouse.

**Falta que Diego decida** qué número manda: los 150 kB del mapa o los 155.000 B que exige CI. Si manda 150 kB, el sitio ya está por encima, con cualquier opción. El código del Clima y del indicador aún no está sumado.

## Decisiones del mapa afectadas

### La luna real falta durante media noche

[Medido] Con `sky`, cada 10 minutos, de 2026 a 2028:

- De noche, la luna está sobre el horizonte el **49,7%** del tiempo, y sobre el horizonte con más de 5% iluminada el **48,8%**.
- **168 de 1.097 noches** no tienen luna visible en ningún momento.

[Código] Hoy la Escena siempre muestra la luna, colocada por `moonPosition()` fuera de la columna de texto del Hero. La decisión «el sol o la luna van en su posición real» significa que, la mitad del tiempo, la Noche no tiene luna. Puede estar bien, porque quedan las estrellas, la ciudad y el Clima. Es una decisión visual que el mapa no tomó explícitamente.

### Los astros pasan buena parte del tiempo a espaldas de la Escena

[Medido] Caracas está en el trópico: en 2026 el sol llega a 89,9° de altura y en 131 días está al norte a mediodía solar. Con el sol sobre el horizonte, está al norte de la línea este-oeste solo el **43,0%** del tiempo. La luna visible de noche, el **42,3%**.

[Inferencia] El Ávila está al norte de Caracas, así que la Escena mira al norte. Es conocimiento geográfico general: ni el código ni el `GLOSSARY.md` lo fijan. Con una proyección literal por acimut, el astro quedaría fuera de cuadro más de la mitad del tiempo.

[Medido] Además, cerca del cenit el acimut salta: 95° en un solo minuto el 2026-08-25. **Por eso «posición real» no puede ser una proyección por acimut.** Recomiendo que `sky` entregue el ángulo horario y la altura, y dibujar un arco estilizado: el avance de oeste a este lo da el ángulo horario, con el este a la derecha, y la altura da la `y`. La hora y la altura serían reales; el punto exacto del cielo, una convención. Esto corresponde al ticket del Viaje de cámara o a la spec. [Medido] La altura del sol cambia como mucho 0,246° por minuto, unos 2 px con la escala de arriba, de modo que refrescar una vez por minuto basta.

### «Toggle contra hora» y «Visita larga» chocan al atardecer

[Inferencia] El tema nunca cambia solo y, si el tema no coincide con la hora, el astro va a una posición fija. Quien llega a las 17:50 en Día ve el sol real bajando. Al ponerse deja de coincidir, y el sol pasaría de golpe del horizonte a la posición fija, alta en el cielo. La spec debe decidir qué pasa. Sugiero fijar la «coincidencia» al cargar y al usar el toggle, y dejar el sol oculto bajo el horizonte hasta el siguiente cambio.

### Pruebas, CI y previews

[Inferencia] Sin la preferencia del sistema, el tema en CI dependerá de la hora del reloj: **Lighthouse evaluará Día o Noche según cuándo corra.** Esto afecta al punto «Cómo forzar hora y Clima» del mapa:

- [Medido] Falsear `Date.now` antes de la compuerta funciona, así que el `page.clock` de Playwright debería servir. [No verificado] No probé `page.clock` en sí.
- [No verificado] Falta definir cómo forzarla en LHCI. La configuración actual no inyecta nada antes de cargar. Si hace falta un parámetro de URL, lo tendría que leer la compuerta, y eso suma bytes al HTML.
- [Inferencia] El gate de accesibilidad ≥90 debería correr en los dos temas, o el resultado dependería de la hora del job.

### Migración de la clave de `localStorage`

[Código] No se puede distinguir una elección real de la escritura automática. Recomiendo una clave nueva (`theme-choice`) e ignorar `theme`. El coste es que quien eligió de verdad pierde esa elección una vez. Si se conservara `theme`, quien ya visitó el sitio nunca vería el tema por hora.

## Recomendación para la spec

1. **`index.html`:** compuerta inline antes del CSS. Lee `theme-choice`; si no hay, calcula la altura del sol; pone `.dark`.
2. **`src/lib/theme.tsx`:** el estado inicial se lee de `.dark`. Solo escribe en `theme-choice` desde `toggleTheme`.
3. **`src/tailwind.css`:** `color-scheme` atado a `.dark`.
4. **Módulo `sky` puro**, en el chunk principal: `sky(ms)` con sol y luna, y `caracasTime(ms)` con `UTC-4` fijo. Con tests contra valores fijos generados con `astronomy-engine` y contrastados con USNO, y uno que compare la constante con `Intl`.
5. **Una sola fuente para la compuerta.** [No verificado] Propongo un script a mano en `index.html`, más un test que lo extraiga del HTML, lo ejecute en `vm` con varias fechas y lo compare con `sky`. Así no hace falta un plugin de Vite. La alternativa sería inyectarlo desde TypeScript con `transformIndexHtml`.
6. **Dibujar la fase** con `fraction`, `waxing` y `tilt`: dos arcos en SVG. [Inferencia] Cerca del ecuador la luna se ve muy inclinada, a veces «en barca», así que la inclinación se notará.

[No verificado] El prototipo devuelve el acimut, no el ángulo horario. Cambiarlo no debería mover el peso de forma apreciable, pero no lo medí.

## Apéndice: método

- **Copia de medición:** `origin/main` (`457fffb`) extraída fuera del repo. En el worktree, Vite encuentra un `postcss.config.cjs` suelto en el checkout principal, que no está en `main`, y el build falla. Afecta solo a builds en worktrees dentro de ese checkout.
- **Lighthouse local:** `@lhci/cli@0.15.1`, Chromium de Playwright 1248, solo la ruta `/`, 5 corridas por variante. Sirve para comparar variantes entre sí, no para dar valores absolutos.
- **Lighthouse CI:** artefacto `lighthouse` del run `41109988744`.
- **Referencia:** `astronomy-engine` afirma ±1 minuto de arco y dice estar probado contra NOVAS y JPL Horizons ([README](https://github.com/cosinekitty/astronomy)) [Doc]. Lo contrasté solo en salida, puesta y fracción iluminada con el endpoint `https://aa.usno.navy.mil/api/rstt/oneday` de USNO [Medido].
- **Límites:** horizonte a nivel del mar, sin la altitud de Caracas ni el relieve. Probé solo en Chromium; Firefox y Safari no están medidos, tampoco el costo de `Intl`.

### Prototipo `sky`

```js
const { PI, sin, cos, tan, asin, atan2 } = Math;
const R = PI / 180;
const LAT = 10.4806 * R, LON = -66.9036;
const sinL = sin(LAT), cosL = cos(LAT);
const OBL = 23.4393 * R;

const equatorial = (l, b) => ({
    ra: atan2(sin(l) * cos(OBL) - tan(b) * sin(OBL), cos(l)),
    dec: asin(sin(b) * cos(OBL) + cos(b) * sin(OBL) * sin(l)),
});
const horizontal = (n, ra, dec) => {
    const H = (280.46062 + 360.98564737 * n + LON) * R - ra;
    return {
        H,
        alt: asin(sinL * sin(dec) + cosL * cos(dec) * cos(H)),
        az: atan2(sin(H), cos(H) * sinL - tan(dec) * cosL) + PI,
    };
};
const series = (T, terms, f) => terms.reduce((s, [a, b, c]) => s + a * f((b + c * T) * R), 0);
const LON_TERMS = [[6.29,135,477198.87],[-1.27,259.3,-413335.36],[.66,235.7,890534.22],[.21,269.9,954397.74],[-.19,357.5,35999.05],[-.11,186.5,966404.03]];
const LAT_TERMS = [[5.13,93.3,483202.02],[.28,228.2,960400.89],[-.28,318.3,6003.15],[-.17,217.6,-407332.21]];
const PAR_TERMS = [[.0518,135,477198.87],[.0095,259.3,-413335.36],[.0078,235.7,890534.22],[.0028,269.9,954397.74]];

export function sky(ms) {
    const n = ms / 864e5 - 10957.5;
    const T = n / 36525;
    const g = (357.528 + 0.9856003 * n) * R;
    const sl = (280.46 + 0.9856474 * n + 1.915 * sin(g) + 0.02 * sin(2 * g)) * R;
    const se = equatorial(sl, 0);
    const sh = horizontal(n, se.ra, se.dec);

    const ml = (218.32 + 481267.881 * T + series(T, LON_TERMS, sin)) * R;
    const mb = series(T, LAT_TERMS, sin) * R;
    const par = (0.9508 + series(T, PAR_TERMS, cos)) * R;
    const me = equatorial(ml, mb);
    const mh = horizontal(n, me.ra, me.dec);
    const dra = se.ra - me.ra;
    const limb = atan2(cos(se.dec) * sin(dra), sin(se.dec) * cos(me.dec) - cos(se.dec) * sin(me.dec) * cos(dra));
    const q = atan2(sin(mh.H), tan(LAT) * cos(me.dec) - sin(me.dec) * cos(mh.H));
    const elong = ml - sl;
    return {
        sun: { alt: sh.alt / R, az: sh.az / R },
        moon: {
            alt: (mh.alt - par * cos(mh.alt)) / R,
            az: mh.az / R,
            fraction: (1 - cos(elong)) / 2,
            waxing: sin(elong) > 0,
            tilt: (limb - q) / R,
        },
    };
}
```

### Prototipo de la compuerta

```html
<script>(function(){var t;try{t=localStorage.getItem("theme-choice")}catch(e){}if(t!="dark"&&t!="light"){var R=Math.PI/180,n=Date.now()/864e5-10957.5,g=(357.528+.9856003*n)*R,l=(280.46+.9856474*n)*R+.0334*Math.sin(g)+35e-5*Math.sin(2*g),d=Math.asin(.3978*Math.sin(l));t=.1819*Math.sin(d)+.9833*Math.cos(d)*Math.cos((280.46062+360.98564737*n-66.9036)*R-Math.atan2(.9175*Math.sin(l),Math.cos(l)))>-.01454?"light":"dark"}if(t=="dark")document.documentElement.classList.add("dark")})()</script>
```

Constantes: `.1819` y `.9833` son el seno y el coseno de la latitud; `.3978` y `.9175`, los de la oblicuidad; `−.01454` es el seno de −0,833°.

### Script de tamaños (`size.mjs`)

```js
import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';

const entries = {
    'suncalc@2 sol+luna+fase': "export {getPosition,getMoonPosition,getMoonIllumination} from 'suncalc'",
    'propio sky': "export {sky} from './sky.js'",
    // ...una entrada por fila de la tabla
};
for (const [name, contents] of Object.entries(entries)) {
    const r = await build({
        stdin: { contents, resolveDir: process.cwd(), loader: 'js' },
        bundle: true, minify: true, format: 'esm', write: false, target: 'es2022', platform: 'browser',
    });
    const b = Buffer.from(r.outputFiles[0].contents);
    console.log(name, b.length, gzipSync(b, { level: 9 }).length);
}
```
