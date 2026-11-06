---
target: portafolio actual en producción (Home y Caso de estudio)
total_score: 19
max_score: 28
na_heuristics: 7,9,10
p0_count: 0
p1_count: 2
target_identity: "url:https://www.diegorangel.dev/"
timestamp: 2026-11-06T02-26-26Z
slug: www-diegorangel-dev
---
## Design Health Score

| # | Heurística | Puntaje | Problema principal |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | La navegación marca la sección activa y el Indicador da hora y Clima reales. |
| 2 | Relación con el mundo real | 3 | Caracas real, el lenguaje del dominio y el Clima y la hora de verdad. |
| 3 | Control y libertad | 3 | Día/Noche, ES/EN y "← Proyectos" funcionan; nada atrapa. |
| 4 | Consistencia y estándares | 2 | "Descargar CV" aparece dos veces en el primer viewport y otra vez en Contacto. Los puntos de la línea de tiempo son azul cielo y nada más en la UI usa ese color. El texto se ve fantasma debajo de la barra translúcida. |
| 5 | Prevención de errores | 3 | No hay formularios. Los enlaces externos y el CV son claros. |
| 6 | Reconocer antes que recordar | 3 | Las secciones se nombran igual en la barra y en los títulos. |
| 7 | Flexibilidad y eficiencia | n/a | Superficie Experience: un portafolio no tiene usuarios avanzados. |
| 8 | Estética y minimalismo | 2 | Seis elementos centrados y apilados en el Hero, tarjetas por todas partes, y la Escena tapada la mayor parte del recorrido. |
| 9 | Recuperación de errores | n/a | No hay estados de error en esta superficie. |
| 10 | Ayuda y documentación | n/a | Superficie Experience. |
| **Total** | | **19/28** | **Acceptable (68%)** |

## Design Specificity Verdict

**Evaluación LLM.** Hay dos sitios en uno y no se hablan.

- **La Escena es específica e inimitable.** El Ávila con el Humboldt, el Teleférico, las guacamayas y la Avenida Bolívar con su Tráfico y su Afluencia, todo según la hora y el Clima reales de Caracas. Ningún otro portafolio puede copiar eso.
- **La UI de encima es intercambiable con cualquier portafolio de dev:**
  - "Hola, soy X" centrado;
  - una píldora con el rol;
  - una propuesta de valor;
  - dos botones;
  - una franja de 4 cifras en tarjetas;
  - una línea de tiempo de bullets;
  - tarjetas de proyecto;
  - chips de skills;
  - una tarjeta de contacto.

Cambiando el fondo, sería el portafolio de cualquiera. La Escena funciona como fondo de pantalla, no como escenario. El contenido nunca la usa para componer: no se apoya en el horizonte, no la enmarca y no le deja la pantalla en el momento clave.

**Escaneo determinista.** `impeccable detect`, 62 reglas, sobre 4 URLs:
- **1 warning en el Home de escritorio:** `radial-spotlight-glow` sobre `scene-cloud`. Es un **falso positivo a medias**: son las nubes de la Escena, no un halo decorativo. Pero el detector acierta en que se leen como un resplandor difuso y no como nubes (ver P2).
- **1 warning en el Caso de estudio de escritorio:** `line-length`, unos 97 caracteres por línea en un párrafo (lo ideal es menos de 80).
- **Advisories:**
  - `shape-assembled-illustration` en todas las páginas: la Escena SVG está armada con 20 a 35 primitivas y 10 a 12 colores planos.
  - 5 `straggler` en el móvil: "medibles.", "cliente-servidor.", "60%.", "cliente." y "Systems" quedan solos en la última línea.
  - 1 `unbalanced-heading` en el Caso de estudio móvil.
- **Sobre el código de `src/`:** 0 hallazgos.
- **Lo que el detector agrega a la evaluación LLM:** el párrafo de 97 caracteres y las palabras huérfanas en el móvil.
- **Lo que no puede ver:** que la UI es genérica. Por eso el escaneo sale casi limpio aunque el diseño sea de plantilla.

**Overlays visuales:** no se inyectaron. Se usaron capturas headless y no hay pestaña `[Human]`.

## Overall Impression

La idea es excelente y está escondida. Una Caracas viva que sigue la hora y el Clima reales es una firma que nadie más tiene. El sitio la pone detrás de vidrio esmerilado y le pone delante una plantilla de portafolio. La mayor oportunidad es invertir la jerarquía: que la ciudad sea el escenario y el contenido viva dentro de ella, no encima.

## What's Working

1. **El Cielo vivo y el Indicador.** La hora y el Clima reales en el Hero ("12:00 · 20 °C · nublado") son un detalle verdadero y propio, y la Noche lo aprovecha. Es la semilla de identidad más fuerte del sitio.
2. **La Noche.** El Humboldt encendido en dorado, las cabinas del Teleférico como puntos de luz y el cielo con estrellas son el momento más evocador de todo el sitio. Ahí se siente Caracas.
3. **El contenido con respaldo.** Cada Cifra clave lleva a su Experiencia o a su Proyecto. El Caso de estudio tiene una estructura clara: columna fija con impacto, contexto, problema, decisiones y galería.

## Priority Issues

**[P1] La ciudad es fondo de pantalla, no escenario.**
- **Por qué importa:** el posicionamiento es "el sitio es la prueba de oficio", pero la Escena queda tapada.
  - En escritorio, los Bloques de 860 px tapan el centro durante la mayor parte del scroll.
  - En el móvil, que es por donde llega la audiencia, las tarjetas ocupan todo el ancho y la Escena solo se asoma en los huecos de 20 vh. El Viaje de cámara casi no se ve.
- **Arreglo:** componer con la Escena.
  - Darle momentos a sangre completa en los que el texto vaya directo sobre el cielo, con el contraste resuelto.
  - Anclar secciones a los Hitos: el Teleférico como hilo, la Avenida para Contacto.
  - Que el contenido ocupe tercios y no el centro.
- **Comando sugerido:** `/impeccable layout`, o un mundo nuevo vía new-work.

**[P1] El Hero es la plantilla de portafolio por defecto y no dice el posicionamiento.**
- **Por qué importa:** son seis elementos centrados y apilados: saludo, píldora, propuesta, ubicación, Indicador y dos botones. "Hola, soy" es la apertura más gastada del género. Un recruiter en el móvil decide en segundos, y nada distingue a "un Lead que sigue construyendo".
- **Arreglo:**
  - Una sola afirmación fuerte que diga liderar y construir.
  - El nombre como firma.
  - La Escena como prueba visual inmediata.
  - Un solo CTA dominante.
- **Comando sugerido:** `/impeccable clarify` y `/impeccable bolder`.

**[P2] La Escena se ve plana para la promesa de "lo más vívida y espectacular posible".**
- **Por qué importa:**
  - Las montañas son siluetas pastel lisas.
  - El sol de mediodía es un disco gris que se confunde con la luna.
  - Las nubes son halos radiales, que el detector marca.
  - La ciudad a nivel de calle son bloques gráficos oscuros.
  - Falta luz: ni dirección del sol, ni bruma, ni perspectiva atmosférica marcada, ni color de la hora.
- **Arreglo:** una dirección de arte de la luz. Que la hora tiña todo (amanecer, mediodía, atardecer, noche), con bruma en las capas lejanas, nubes con volumen y un sol que ilumine. Es lo que más rinde para el "wow".
- **Comando sugerido:** `/impeccable overdrive` y `/impeccable colorize`.

**[P2] La franja de Impacto es la plantilla de "métrica de héroe".**
- **Por qué importa:** son cuatro tarjetas iguales con número grande y etiqueta, el patrón que impeccable rechaza. En el móvil quedan bajo el pliegue, a 2 por fila, con links largos que parten en 3 líneas.
- **Arreglo:** integrar las cifras en la narrativa (cada una junto a lo que la respalda) o darles una forma propia de Caracas, en lugar de la cuadrícula de tarjetas.
- **Comando sugerido:** `/impeccable layout`.

**[P2] La tipografía no tiene voz.**
- **Por qué importa:**
  - Space Grotesk 700 está en la lista de fuentes demasiado vistas, y el cuerpo usa la sans del sistema.
  - Todo está en tamaños medios, sin contraste de escala ni de carácter.
  - Hay líneas de 97 caracteres en el Caso de estudio y palabras huérfanas en el móvil.
- **Arreglo:** una pareja tipográfica con carácter que hable de Caracas o del oficio, una escala con contraste real, `text-wrap: balance` o `pretty`, y una medida máxima de unos 70 caracteres.
- **Comando sugerido:** `/impeccable typeset`.

## Persona Red Flags

**Recruiter con prisa en el móvil** (la persona propia del proyecto):
- Llega desde LinkedIn y ve "Hola, soy Diego Rangel" en dos líneas, una píldora y un párrafo. Las Cifras clave quedan bajo el pliegue.
- En el primer viewport no hay nada que no tenga cualquier otro candidato, salvo un cielo azul liso con una montaña que apenas asoma.
- Para ver la ciudad tiene que hacer scroll, y lo que encuentra son tarjetas a todo el ancho.

**Hiring manager técnico en escritorio** (la persona propia del proyecto):
- Busca prueba de oficio y la Escena WebGL lo es. Pero nada le dice que está viendo un render en vivo con datos reales: el Tráfico, la Afluencia y la hora pasan desapercibidos.
- La línea de tiempo de bullets densos no invita a leer.

**Jordan (primera visita):**
- "Descargar CV" aparece dos veces en el primer viewport y no queda claro cuál es la acción principal.
- El texto de los Bloques se ve fantasma debajo de la barra superior translúcida, y parece un error.

## Minor Observations

- Los puntos de la línea de tiempo usan el azul cielo (`#5ea8dc`), un color que no está en la paleta de la UI.
- La barra superior al 86% de opacidad deja leer el texto de abajo, lo que crea ruido.
- "Ver en CORE Care and Health Systems →" parte en 3 líneas en el móvil.
- La captura oscura de SuperWallet, sobre un Bloque claro, queda como un agujero negro en el Caso de estudio de Día.
- La nota de crédito del Clima, al pie, flota encima de la Avenida y tapa autos.

## Questions to Consider

- ¿Y si el primer viewport fuera Caracas a pantalla completa, a la hora real, con el contenido escrito en su cielo?
- ¿Qué pasaría si cada sección fuera una parada del Teleférico, del Humboldt a la Avenida, en vez de una tarjeta más?
- ¿Cómo se vería la versión segura de sí misma: una sola frase, una sola acción y la ciudad haciendo el resto?
- ¿Las Cifras clave necesitan tarjetas, o pueden estar escritas en la ciudad?
