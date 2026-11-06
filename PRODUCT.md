# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters y hiring managers que evalúan a Diego Rangel para puestos Lead o Full-Stack remotos. Llegan desde un link (LinkedIn, el CV, una aplicación), a menudo desde el móvil y con poco tiempo, y deciden en segundos si siguen leyendo y si lo contactan. El vocabulario del dominio está en `GLOSSARY.md`.

## Product Purpose

El sitio personal de Diego (www.diegorangel.dev): presenta su Trayectoria y los Proyectos que ha construido sobre una Escena animada de Caracas, su ciudad natal. Tiene éxito cuando produce Señales de interés: descargar el CV, abrir el email o LinkedIn de Diego, o abrir un Caso de estudio. Las visitas solas no cuentan (Umami, `docs/adr/0002`).

## Positioning

Un Lead que sigue construyendo. Lidera más de 10 devs con 100% de entregas a tiempo y a la vez entrega producto medible, como el −80% en el tiempo de booking hotelero de SuperWallet. El propio sitio, con una Caracas viva en WebGL (cielo, clima, tráfico y gente según la hora real), es la prueba de oficio.

## Operating Context

- Se visita sobre todo en móvil, desde links de LinkedIn y del CV. La Escena WebGL es solo de escritorio; en móvil, y cuando no hay WebGL, se usa la Escena SVG (`docs/adr/0001`, `docs/adr/0003`).
- Es bilingüe: español en `/` e inglés en `/en`. Todo el contenido de ambos idiomas vive en `src/content/data`.
- El CV en PDF (ES y EN) se genera con el mismo contenido del sitio.
- Las páginas son el Home (Hero, Impacto, Experiencia, Proyectos destacados, Skills, Contacto) y un Caso de estudio por Proyecto.

## Capabilities and Constraints

- Stack: Vite + React 19, Tailwind v4, `motion` (LazyMotion), ogl en un Worker para la Escena WebGL, despliegue en Vercel.
- El tema inicial sigue la hora de Caracas (`docs/adr/0004`), y el Clima viene de Open-Meteo desde el navegador (`docs/adr/0005`).
- El presupuesto de script es de 160 kB gzip (`docs/adr/0006`). Lighthouse CI mide rendimiento y accesibilidad móviles, con un mínimo de 90 en cada uno.
- Se respeta `prefers-reduced-motion`.
- Tráfico y Afluencia son modelos estimados, nunca datos reales, y ningún texto del sitio los presenta como reales.
- En la rama `research/impeccable` todo lo anterior se mide para el veredicto, pero no bloquea.

## Brand Commitments

- Caracas es el tema: el sitio la muestra de la forma más vívida y espectacular posible.
- Los Hitos reales (El Ávila con el Hotel Humboldt, las Torres de Parque Central, el Teleférico y las guacamayas) se pueden re-escenificar, pero no reemplazar por otros.
- El Cielo vivo se queda: el sol, la luna, su posición, la fase lunar y el Clima reales de Caracas, y el Día o la Noche según la hora de Caracas.
- El nombre público es Diego Rangel y el rol, Full-Stack Lead Developer.
- La UI es el estándar de la categoría ejecutado con oficio, sobria, directa y profesional, sin mundos temáticos. La ambición visual va a la Escena. La vara de oficio son las páginas de producto de Apple, Linear y el portafolio de Paco Coursey (decisión de Diego, 2026-11-06).

## Evidence on Hand

- La Trayectoria tiene cinco Experiencias (XHype, CORE Care and Health Systems, Wocoon, Daxos y 300 Dev) con sus Logros, en `src/content/data/experiences.ts`.
- Tres Proyectos tienen Caso de estudio: SuperWallet, BE - Booking Engine e Invitación de Boda. Están en `src/content/data/projects.ts`, con capturas en `public/projects/`.
- Las Cifras clave son los años de Trayectoria, 10+ devs liderados, −80% en el tiempo de booking hotelero y 100% de entregas a tiempo. Cada una remite a su respaldo (`src/content/data/profile.ts`).
- Están la Formación (Computación, UCV) y las skills por categoría.
- No hay testimonios, clientes citados ni prensa, y no se inventan. Un Dato pendiente, redactado pero no confirmado por Diego, no se publica.

## Product Principles

- Cada afirmación tiene respaldo: una Cifra clave remite a una Experiencia, un Proyecto o la Trayectoria.
- El oficio se demuestra, no se declara: la Escena es la prueba de que Diego construye.
- Lo primero que se ve tiene que bastar para decidir en segundos, en el móvil.
- El contenido es el de los datos, sin rellenos.

## Accessibility & Inclusion

Lighthouse móvil de accesibilidad 90 o más, `prefers-reduced-motion` respetado, y contenido completo en español e inglés.
