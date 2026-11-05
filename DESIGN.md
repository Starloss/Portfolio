---
name: Diego Rangel · Portafolio
description: Bloques translúcidos de contenido sobre una Escena animada de Caracas que sigue la hora real.
colors:
  sky-day: "#5ea8dc"
  avila-green: "#2f6b4f"
  on-avila-green: "#ffffff"
  amber-text-day: "#8f5400"
  amber-decor-day: "#b86e00"
  ink-day: "#14231c"
  ink-muted-day: "#4b5d55"
  surface-day: "rgba(250,252,248,0.86)"
  line-day: "rgba(47,107,79,0.25)"
  sky-night: "#050a1a"
  avila-green-night: "#6fcf97"
  on-avila-green-night: "#06140d"
  amber-night: "#ffcf6e"
  ink-night: "#eef4f0"
  ink-muted-night: "#a9bcb2"
  surface-night: "rgba(8,18,27,0.78)"
  line-night: "rgba(111,207,151,0.25)"
typography:
  display:
    fontFamily: "Space Grotesk, Space Grotesk Fallback, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Space Grotesk, Space Grotesk Fallback, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
rounded:
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  gutter: "16px"
  block: "32px"
components:
  button-primary:
    backgroundColor: "{colors.avila-green}"
    textColor: "{colors.on-avila-green}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-day}"
    textColor: "{colors.ink-day}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"
  block:
    backgroundColor: "{colors.surface-day}"
    textColor: "{colors.ink-day}"
    rounded: "{rounded.2xl}"
    padding: "32px"
  indicator:
    backgroundColor: "{colors.surface-day}"
    textColor: "{colors.ink-day}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
---

<!-- Registro del look incumbente en `main`, escrito al empezar el rework de `research/impeccable` (mapa #104). El rediseño lo trata como evidencia y anti-referencia, y reemplaza este archivo cuando elija su mundo visual. -->

# Design System: Diego Rangel · Portafolio

## Overview

**Creative North Star: "El cielo de Caracas detrás del vidrio"**

La Escena es todo el fondo de la página, y el color de la página es el de su cielo. El contenido flota encima en Bloques translúcidos sin blur, centrados en una columna estrecha y separados por grandes tramos de cielo vacío (20 a 35 vh), para que el Viaje de cámara se vea entre un bloque y otro. Hay dos estados, Día y Noche, que siguen la hora de Caracas o lo que elija el visitante. Cada token tiene su par para cada estado.

La interfaz es sobria y genérica: tarjetas redondeadas con borde verde tenue, títulos en Space Grotesk 700 y cuerpo en la fuente del sistema. Toda la personalidad está en la Escena, no en la UI.

**Key Characteristics:**
- Una sola columna centrada de unos 892 px sobre una Escena a pantalla completa.
- Superficies translúcidas sin blur, con borde verde al 25% de opacidad.
- Verde Ávila como acento único y ámbar para lo decorativo.
- Foco visible de dos colores que se lee sobre los bloques y sobre el cielo.

## Colors

Un verde de montaña sobre el azul o el negro del cielo, con un ámbar de luz de ciudad.

### Primary
- **Verde Ávila** (avila-green; avila-green-night de Noche): botón principal, cifras de Impacto y bordes al pasar el cursor.

### Secondary
- **Ámbar de farol** (amber-text-day, amber-decor-day; amber-night de Noche): textos y detalles decorativos, y el anillo exterior del foco de Noche.

### Neutral
- **Cielo** (sky-day y sky-night): el fondo de la página, que es el mismo cielo de la Escena.
- **Tinta** (ink-*, ink-muted-*): el texto y el texto secundario.
- **Vidrio** (surface-*): los Bloques, la barra superior y las píldoras.
- **Línea** (line-*): los bordes de todas las superficies.

### Named Rules
**The Sky Is the Page Rule.** El fondo de la página siempre es el cielo de la Escena. El contraste se evalúa contra el cielo real, no contra un blanco.

## Typography

**Display Font:** Space Grotesk 700, con subset latino auto-hospedado y fallbacks métricos.
**Body Font:** la sans-serif del sistema.

**Character:** una grotesca técnica para los títulos y el sistema para el resto. Es funcional y no tiene una voz propia.

### Hierarchy
- **Display** (700, 2.25rem en móvil y 3.75rem en escritorio, tracking -0.025em): el saludo del Hero.
- **Headline** (700, 1.5rem a 1.875rem): los títulos de Bloque. Las cifras de Impacto usan la misma fuente a 1.875rem en verde.
- **Body** (400, 1rem a 1.125rem): la propuesta de valor y los Logros.
- **Label** (600, 0.75rem a 0.875rem): botones, píldoras y el Indicador.

## Layout

Una columna centrada de 892 px como máximo, con 16 px de margen lateral. Entre Bloques hay 20 vh de separación en móvil y 35 vh en escritorio, y lo que se ve en ese espacio es la Escena. El Hero está centrado. Impacto es una cuadrícula de 2 columnas en móvil y 4 en escritorio. La barra superior es sticky, sobre una superficie translúcida.

## Elevation & Depth

Casi plana: la profundidad la pone la Escena, con sus capas y su parallax. La UI solo usa una sombra mínima en la barra superior cuando se hace scroll.

## Shapes

Esquinas suaves. Los Bloques usan 16 px, los botones 12 px y las píldoras son redondas. Los bordes son de 1 px en el color de línea. No hay formas propias de Caracas en la UI.

## Components

### Buttons
- **Shape:** 12 px.
- **Primary:** fondo verde Ávila y texto claro. Al pasar el cursor, la opacidad baja al 90%.
- **Secondary:** fondo de vidrio y borde de línea, que pasa a verde al pasar el cursor.

### Cards / Containers
- **Bloque:** vidrio, borde de línea, 16 px de radio y 24 a 32 px de padding. Entra con un fundido y 16 px de desplazamiento; con reduced-motion, sin animar.

### Navigation
- Barra superior sticky de vidrio con borde inferior. En móvil se abre un menú hamburguesa. Tiene los controles de idioma y de Día/Noche.

### Indicador
- Una píldora de vidrio en el Hero con la hora y el Clima de Caracas.

## Do's and Don'ts

### Do:
- **Do** dar un par Día/Noche a cada color (`src/app/theme/tokens.json`).
- **Do** mantener el foco de dos colores (2 px por fuera y 2 px por dentro).
- **Do** respetar reduced-motion en cada animación de entrada.

### Don't:
- **Don't** usar blur en las superficies: cuesta en móvil y tapa la Escena.
- **Don't** usar un fondo de página distinto del cielo de la Escena.
