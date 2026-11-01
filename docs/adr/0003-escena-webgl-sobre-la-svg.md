---
status: accepted
---

# La Escena tiene una versión WebGL para los equipos capaces, encima de la versión SVG

El prototipo (#40) dio luz verde y esta ADR reemplaza a la 0001. La Escena SVG por capas sigue siendo la base: es lo primero que se pinta y el respaldo de cualquier equipo que no rinda. Encima, en cualquier equipo que pase la detección, teléfonos incluidos, una versión WebGL 2.5D hecha con `ogl` dibuja las mismas siluetas como texturas. A eso le agrega nubes y niebla volumétricas, la luz del atardecer y el amanecer, una ciudad nocturna viva, parallax con el mouse y una Avenida Bolívar con gente y carros en movimiento. El objetivo es un impacto visual que la SVG no alcanza, sin que ese costo recaiga en la carga inicial ni en los equipos que no pueden con él.

## Considered Options

- **three.js**: pesa unos 150 kB gzip para lo que es un plano 2.5D. `ogl` hace lo mismo con 10–25 kB.
- **3D real** (el Ávila modelado desde datos de elevación): es más caro en bytes, en tiempo y en tests. Además, el efecto de la referencia (la intro del blog de Kimi) es una foto con un canvas encima, no una escena 3D.
- **WebGL para todos**: rompe el objetivo de Lighthouse móvil ≥90 y el presupuesto de 150 kB de JS.
- **Arte nuevo pintado**: haría que las dos versiones dejaran de verse como la misma Caracas. Con las siluetas como texturas hay una sola fuente de verdad.

## Consequences

- El presupuesto de Lighthouse (≥90 y 157 kB, por las ADR 0002 y 0005) aplica a la carga inicial. La detección y la versión WebGL se cargan en chunks diferidos.
- La versión WebGL dibuja desde un Worker con OffscreenCanvas, y la prueba de la detección también corre en un Worker. Crear un contexto WebGL es una llamada síncrona: sin GPU (SwiftShader, en CI) bloqueaba la página ~900 ms. Ahora la página solo pasa el scroll, las medidas, el tema, la posición del sol y la luna y el reloj de las animaciones de CSS, y rasteriza las texturas cuando el Worker las pide. Sin WebGL2 en OffscreenCanvas (Safari anterior a 17) se queda la SVG.
- Con una GPU por software, que solo llega con `?escena=webgl`, la Escena WebGL dibuja solo cuando algo cambia, a media resolución y con las animaciones quietas.
- Una corrida de Lighthouse de escritorio con `?escena=webgl` también exige rendimiento ≥90.
- La detección previa es un chunk diminuto que se carga cuando el navegador está ocioso, y decide antes de descargar la versión WebGL. Deja la SVG si hay reduced-motion, Save-Data, una caída recordada, falta WebGL2, el hardware es bajo, o la GPU es de gama baja o por software. Los teléfonos pasan por la misma detección: al principio se dejaban fuera, pero Diego probó la Escena WebGL en el suyo, fue fluida y casi no calentó. El nombre de una GPU de teléfono no dice cuánto rinde, así que el vigilante decide. Solo se mide en ese teléfono, y Lighthouse no lo cubre: en CI no hay GPU real.
- En ejecución, un vigilante vuelve a la SVG si la Escena se sostiene por debajo de unos 45 fps, y recuerda la decisión para ese visitante. Los valores exactos del vigilante los fija la spec.
- Si `ogl` no logra iniciar o se pierde el contexto WebGL (`webglcontextlost`), la Escena vuelve a la SVG de inmediato, como si hubiera actuado el vigilante.
- El parámetro `?escena=webgl` salta tanto la detección como el vigilante.
- Las dos versiones leen el mismo modelo del Viaje de cámara, así que el paso de una a otra es un fundido cruzado sin salto. En la SVG, la Avenida Bolívar aparece quieta. Las estrellas no son siluetas: giran con el cielo y cada versión las dibuja a su manera, así que no coinciden una a una.
- El renderer `ogl` es un adaptador delgado: queda excluido de la cobertura y se prueba con Playwright. La lógica pura se cubre con tests unitarios.
- Umami registra qué versión recibió cada visitante y cada caída a SVG.
