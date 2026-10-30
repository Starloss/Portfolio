---
status: superseded by ADR-0003
---

# La Escena se construye con SVG por capas y CSS, no con WebGL

La Escena de Caracas (El Ávila con el Hotel Humboldt, las Torres de Parque Central, el Teleférico, el ciclo Día/Noche y el Viaje de cámara) se dibuja como siluetas SVG dentro de capas HTML. El Viaje de cámara mueve cada capa con un `transform` ligado al progreso del scroll mediante `motion`, que puede pasarlo al compositor, y la animación continua (cabinas, estrellas, nubes, guacamayas, ventanas) usa keyframes de CSS de `transform` y `opacity`. No se usa three.js / react-three-fiber, aunque el objetivo sea un portafolio "espectacular". El motivo es el presupuesto fijo de Lighthouse móvil ≥90 en rendimiento y accesibilidad: WebGL agrega más de 150 KB y un costo de GPU que no cabe en ese presupuesto. Además, las siluetas estilizadas ya cumplen el objetivo de que se reconozca Caracas.

## Considered Options

- **three.js / R3F**: daría profundidad 3D real, pero pone en riesgo el presupuesto móvil y es más difícil de testear con cobertura ≥80%.
- **Canvas 2D**: más barato para partículas (estrellas, ventanas), pero exige mucho más código propio y empeora la accesibilidad y el testing.

## Consequences

Con prefers-reduced-motion, la Escena queda fija en el encuadre del hero. En móvil se conserva el Viaje de cámara, pero con menos capas.
