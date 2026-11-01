---
status: accepted
---

# El tema inicial sale de la hora de Caracas, no de la preferencia del sistema

Sin una elección en la visita actual, el tema de todo el sitio depende de si el sol está sobre el horizonte de Caracas. Así, la Escena muestra el Día o la Noche reales de la ciudad que retrata, y la UI nunca se contradice con ella. Alguien con el sistema en oscuro verá el sitio claro si en Caracas es de día. El toggle sigue mandando, pero solo durante esa visita: cada visita nueva vuelve a la hora de Caracas, para que siempre se vea la hora real de la ciudad.

## Considered Options

- **Seguir `prefers-color-scheme` y que la hora solo mueva el sol o la luna**: respeta el sistema, pero a mediodía en Caracas un visitante en oscuro vería Noche, y el dato real no decidiría si es de día o de noche.
- **Que la Escena siga la hora y la UI siga el sistema**: es lo más fiel, pero el toggle dejaría de cambiar la Escena y habría que asegurar el contraste de cada combinación de texto y cielo.
- **Guardar la elección para siempre o por 30 días**: quien eligió dejaría de ver la hora de Caracas, sea para siempre o hasta que venza el plazo. Se prefirió que cada visita muestre la hora real, aunque quien prefiere un tema tenga que elegirlo cada vez.

## Consequences

- Un script inline en el `<head>` aplica el tema antes del primer pintado, y `theme.tsx` lo lee de `.dark`. Si no, React lo revertiría al montar.
- La elección vive en `sessionStorage`. Una pestaña nueva puede empezar en otro tema.
- Volver al tema que corresponde a la hora borra la elección, así que un clic por error se deshace del todo. Esa hora se evalúa al cargar la página: cerca del atardecer, una elección puede perderse o no al recargar, y se acepta para no repetir el cálculo.
- El valor `theme` de `localStorage` se ignora: no distingue una elección real de un tema guardado al montar.
- `color-scheme` en `src/tailwind.css` debe seguir a `.dark`, no al sistema.
- El tema nunca cambia solo durante una visita, aunque en Caracas amanezca o anochezca.
- Al cambiar de tema, la Escena gira enseguida y la UI cambia a la mitad de la Bóveda celeste, así que durante un instante parte del texto queda sobre el otro cielo.
- Si el reloj del dispositivo está mal, el tema inicial también lo estará.
- `?hora=HH:MM` sustituye al reloj, también en producción, para las pruebas y Lighthouse.
- Umami registra el evento técnico `tema-elegido` cuando alguien cambia el tema de la hora, salvo con la hora o el Clima forzados. Sirve para evaluar esta decisión.
