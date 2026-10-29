# La analítica usa Umami Cloud, no Vercel Web Analytics

El sitio se aloja en Vercel, pero mide las Señales de interés con Umami Cloud (plan Hobby gratuito). Lo que importa medir es la descarga del CV y los clics a email o LinkedIn, y eso exige eventos personalizados. En Vercel esos eventos solo existen en los planes Pro y Enterprise; el plan Hobby solo cuenta páginas vistas. Umami Hobby incluye eventos, reportes UTM y no usa cookies, así que no necesita un banner de consentimiento. Su script pesa ~4 kB gzip: para que entrara, el presupuesto de script de Lighthouse CI pasó de 150 a 155 kB.

## Considered Options

- **Vercel Web Analytics en Hobby**: solo mediría la apertura de un Caso de estudio, porque cada uno tiene ruta propia. El CV y el contacto quedarían sin medir.
- **Vercel Pro**: mantendría todo en Vercel, pero cuesta cerca de 20 USD al mes solo por los eventos.
- **Plausible**: es equivalente a Umami, pero de pago.

## Consequences

- Umami Hobby guarda los datos 6 meses, así que cada revisión de las Señales de interés debe hacerse dentro de esa ventana.
- El script solo cuenta en el dominio de producción, de modo que las previews, los e2e y Lighthouse CI no ensucian los datos.
- Si algún día se cambia de proveedor, se pierde el histórico.
