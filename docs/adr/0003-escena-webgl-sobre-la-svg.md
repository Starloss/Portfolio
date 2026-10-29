---
status: proposed
---

# La Escena tiene una versión WebGL para escritorio, encima de la versión SVG

Si el prototipo da luz verde, esta ADR reemplaza a la 0001. La Escena SVG por capas sigue siendo la base: es lo primero que se pinta, la única versión en móviles y el respaldo de cualquier equipo que no rinda. Encima, en escritorio y tablet con una GPU capaz, una versión WebGL 2.5D hecha con `ogl` dibuja las mismas siluetas como texturas. A eso le agrega nubes y niebla volumétricas, la luz del atardecer y el amanecer, una ciudad nocturna viva, parallax con el mouse y una Avenida Bolívar con gente y carros en movimiento. El objetivo es un impacto visual que la SVG no alcanza, sin que ese costo recaiga en la carga inicial ni en los equipos que no pueden con él.

## Considered Options

- **three.js**: pesa unos 150 kB gzip para lo que es un plano 2.5D. `ogl` hace lo mismo con 10–25 kB.
- **3D real** (el Ávila modelado desde datos de elevación): es más caro en bytes, en tiempo y en tests. Además, el efecto de la referencia (la intro del blog de Kimi) es una foto con un canvas encima, no una escena 3D.
- **WebGL para todos**: rompe el objetivo de Lighthouse móvil ≥90 y el presupuesto de 150 kB de JS.
- **Arte nuevo pintado**: haría que las dos versiones dejaran de verse como la misma Caracas. Con las siluetas como texturas hay una sola fuente de verdad.

## Consequences

- El presupuesto de Lighthouse (≥90 y 150 kB) aplica a la carga inicial. La detección y la versión WebGL se cargan en chunks diferidos.
- Una corrida de Lighthouse de escritorio con `?escena=webgl` también exige rendimiento ≥90.
- Antes de descargar nada, la detección previa deja la SVG si hay reduced-motion, Save-Data, falta WebGL2, el hardware es bajo, la GPU es de gama baja o por software, o el dispositivo es móvil.
- En ejecución, un vigilante vuelve a la SVG si la Escena se sostiene por debajo de unos 45 fps, y recuerda la decisión para ese visitante.
- El parámetro `?escena=webgl` salta tanto la detección como el vigilante.
- Las dos versiones leen el mismo modelo del Viaje de cámara, así que el paso de una a otra es un fundido cruzado sin salto. En la SVG, la Avenida Bolívar aparece quieta.
- El renderer `ogl` es un adaptador delgado: queda excluido de la cobertura y se prueba con Playwright. La lógica pura se cubre con tests unitarios.
- Umami registra qué versión recibió cada visitante y cada caída a SVG.
