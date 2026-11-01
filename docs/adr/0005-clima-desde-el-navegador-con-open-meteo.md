---
status: accepted
---

# El Clima sale de Open-Meteo, llamado desde el navegador y sin consultarle

La Escena y el Indicador muestran el Clima real de Caracas con la API gratuita de Open-Meteo, llamada desde el navegador después de pintar, con un caché de 30 minutos. No hay función de Vercel: el sitio sigue sin backend, y los límites de uso se reparten por visitante. La API gratuita es para usos no comerciales, y sus [términos](https://open-meteo.com/en/terms) admiten sitios sin suscripciones ni publicidad, pero también cuentan como comerciales las «promotional activities», y no mencionan portafolios. Este sitio promociona a Diego para conseguir empleo, así que el riesgo existe. Se decidió asumirlo sin consultarle, porque si objetan o bloquean, el sitio solo pierde el Clima.

## Considered Options

- **MET Norway con una función de Vercel**: sus términos no distinguen uso comercial, pero crea el primer backend del sitio. Queda como plan B.
- **Un plan de pago de Open-Meteo**: elimina la duda, pero no se justifica en un portafolio mientras nadie objete.
- **Consultarle antes de implementar**: da certeza, pero deja una fase en manos de una respuesta que puede no llegar.

## Consequences

- La fuente vive en un solo módulo (`src/lib/clima.ts`) que entrega `{ estado, temperatura }`, para que cambiarla sea barato.
- Si la API falla, queda el cielo base y el Indicador muestra solo la hora, sin error visible. Si solo falla un refresco, el último Clima se mantiene hasta una hora. Umami registra el evento técnico `clima-caida`, que es la señal para pasar al plan B.
- La atribución que pide la licencia CC BY 4.0 va en el Indicador y en el pie de página. Que eso baste es una lectura propia, no una confirmación de Open-Meteo.
- `?clima=` sustituye al dato para pruebas y demostraciones, también en producción. No llama a la API ni envía eventos del Cielo vivo, y así CI no depende de un tercero. Con `?hora=` tampoco se registran los fallos.
- El presupuesto de script de Lighthouse CI pasa de 155 a 157 kB, porque el Clima y el Indicador van en la carga inicial: separarlos no ahorra bytes, porque Lighthouse también cuenta los chunks diferidos.
- El acceso desde una red venezolana no se ha comprobado.
- Como la llamada sale del navegador, Open-Meteo recibe la dirección IP y los encabezados HTTP de cada visitante. La consulta usa coordenadas fijas de Caracas y no pide la geolocalización del navegador.
