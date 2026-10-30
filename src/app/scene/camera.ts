// Viaje de cámara: la coreografía de la Escena como funciones puras.
// La altura de la cámara va de 0 (ciudad) a 1 (sobre las nubes) y solo hay movimiento vertical.
import { cablePoint, VIEW } from './geometry';
import { LIFT_SHARE, streetBand } from './street';

/** Altura de la cámara en el Hero: arriba, con las cumbres del Ávila y cielo libre para el texto. */
export const HERO_HEIGHT = 0.8;

/** Keyframes del Viaje: progreso de scroll (0 a 1) y altura de la cámara en cada punto. */
export interface CameraJourney {
    progress: number[];
    height: number[];
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Altura de la cámara según el progreso de scroll de toda la página (0 arriba, 1 abajo). Baja en
 * un solo sentido, con suavizado, como el Teleférico de Waraira Repano a Maripérez: del Hero a la
 * ciudad en Contacto. No depende de cuánto mide cada sección.
 */
export function cameraHeightAt(progress: number): number {
    return HERO_HEIGHT * (1 - smoothstep(clamp(progress, 0, 1)));
}

// Muestreada para ligar las capas al scroll con tramos lineales cortos.
const SAMPLES = 16;
export const CAMERA_JOURNEY: CameraJourney = {
    progress: Array.from({ length: SAMPLES + 1 }, (_, i) => i / SAMPLES),
    height: Array.from({ length: SAMPLES + 1 }, (_, i) => cameraHeightAt(i / SAMPLES)),
};

/** Profundidad de cada capa que se mueve: cuánto se hunde por unidad de altura, en altos de ventana. */
export const LAYER_DEPTH = {
    farRidge: 0.35,
    avila: 0.55,
    city: 0.8,
    towers: 0.9,
} as const;

export type MovingLayer = keyof typeof LAYER_DEPTH;

/** Desplazamiento vertical de una capa, en px. */
export function layerOffset(layer: MovingLayer, height: number, viewportHeight: number): number {
    return LAYER_DEPTH[layer] * height * viewportHeight;
}

// El hundimiento del Hero solo baja la montaña: la ciudad y las Torres quedan apoyadas abajo,
// así que se ven al empezar y al volver a la ciudad en Contacto.
const SINKS_WITH_HERO: readonly MovingLayer[] = ['farRidge', 'avila'];

/**
 * Desplazamiento vertical total de una capa (px): su hundimiento con la cámara más el del Hero,
 * menos lo que sube con la Avenida Bolívar al final del Viaje.
 */
export function layerShift(
    layer: MovingLayer,
    height: number,
    viewportHeight: number,
    heroSink: number,
): number {
    const sink = SINKS_WITH_HERO.includes(layer) ? heroSink : 0;
    const lift = streetBand(height, viewportHeight).lift * LIFT_SHARE[layer];
    return sink + layerOffset(layer, height, viewportHeight) - lift;
}

/** Las nubes bajan de −70vh a +10vh y aparecen con opacidad al subir la cámara. */
export function cloudsAt(height: number, viewportHeight: number): { y: number; opacity: number } {
    return {
        y: ((-70 + 80 * height) / 100) * viewportHeight,
        opacity: Math.min(1, 1.6 * height),
    };
}

export interface Viewport {
    width: number;
    height: number;
}

/** Caja de la columna de texto del Hero en pantalla, hasta la línea de ubicación. */
export interface TextColumn {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

// El paisaje cubre la pantalla (como `preserveAspectRatio="xMidYMax slice"`) y, cuando no
// entra entero a lo ancho, se centra en x = 560 para que se vean las Torres y el Humboldt.
const FOCUS_X = 560;

export interface SceneFrame {
    /** viewBox de los SVG del paisaje. */
    viewBox: string;
    /** px de pantalla por unidad SVG. */
    scale: number;
    /** Punto SVG que cae en la esquina superior izquierda de la pantalla. */
    originX: number;
    originY: number;
}

export function sceneFrame({ width, height }: Viewport): SceneFrame {
    const scale = Math.max(width / VIEW.width, height / VIEW.height);
    const visibleWidth = width / scale;
    const center = clamp(FOCUS_X, visibleWidth / 2, VIEW.width - visibleWidth / 2);
    return {
        viewBox: `${center - VIEW.width / 2} 0 ${VIEW.width} ${VIEW.height}`,
        scale,
        originX: center - visibleWidth / 2,
        originY: VIEW.height - height / scale,
    };
}

export function toScreen(frame: SceneFrame, x: number, y: number): { x: number; y: number } {
    return { x: (x - frame.originX) * frame.scale, y: (y - frame.originY) * frame.scale };
}

const HERO_CLEARANCE = 16;

/**
 * Cuánto se hunde el paisaje (px) en el encuadre del Hero para que su borde superior, detrás
 * de la columna de texto, empiece al menos 16 px por debajo de la línea de ubicación.
 * `skyline` es el borde superior del paisaje (y SVG) muestreado a lo ancho de los 1600.
 */
export function heroSink(
    viewport: Viewport,
    column: TextColumn,
    skyline: readonly number[],
): number {
    const frame = sceneFrame(viewport);
    const step = VIEW.width / (skyline.length - 1);
    const from = frame.originX + column.left / frame.scale;
    const to = frame.originX + column.right / frame.scale;
    let top = Infinity;
    skyline.forEach((y, i) => {
        const x = i * step;
        if (x >= from && x <= to) top = Math.min(top, y);
    });
    if (top === Infinity) return 0;
    const screenTop = toScreen(frame, 0, top).y;
    return Math.max(0, column.bottom + HERO_CLEARANCE - screenTop);
}

/**
 * Cuánto más hay que hundir la montaña (px) en el Hero, además de lo que ya bajó la cámara: la
 * cresta lejana es la capa que menos baja, así que manda ella.
 */
export function mountainSink(
    viewport: Viewport,
    column: TextColumn,
    skyline: readonly number[],
): number {
    const needed = heroSink(viewport, column, skyline);
    return Math.max(0, needed - layerOffset('farRidge', HERO_HEIGHT, viewport.height));
}

export const MOON_SIZE = 52;
const MOON_MARGIN = 24;

/**
 * Centro de la luna (px), fuera de la columna de texto del Hero: a su derecha si hay lugar, o
 * entre la cabecera y el texto. `null` si no cabe sin tapar el texto.
 */
export function moonPosition(
    viewport: Viewport,
    column: TextColumn,
    headerBottom: number,
): { x: number; y: number } | null {
    const room = MOON_SIZE + 2 * MOON_MARGIN;
    const rightSpace = viewport.width - column.right;
    if (rightSpace >= room) {
        return {
            x: column.right + rightSpace / 2,
            y: Math.max(headerBottom + MOON_MARGIN + MOON_SIZE / 2, column.top + MOON_SIZE / 2),
        };
    }
    const topSpace = column.top - headerBottom;
    if (topSpace >= room) {
        return {
            x: viewport.width - MOON_MARGIN - MOON_SIZE / 2,
            y: headerBottom + topSpace / 2,
        };
    }
    return null;
}

/** Punto del cable (SVG) donde va la cabina del visitante: sube con la cámara. */
export function cabinPoint(height: number): { x: number; y: number } {
    return cablePoint(clamp(height, 0, 1));
}

// Cuánto se oscurece el cielo arriba de todo con la cámara sobre las nubes; poco, para que el
// texto del Hero siga contrastando.
export const SKY_DARKENING = 0.3;
/** Cabina del visitante, en unidades SVG (viewBox -6 0 12 17). */
export const CABIN_WIDTH = 12;
export const CABIN_HEIGHT = 17;
/** Las nubes son elipses de ancho / alto = 3,2. */
export const CLOUD_ASPECT = 3.2;

/** Nubes lejanas: posición y ancho en vw y vh, y cuánto derivan (vw). */
export const CLOUDS = [
    { left: 8, top: 20, width: 28, drift: 6 },
    { left: 55, top: 12, width: 34, drift: -5 },
    { left: 30, top: 45, width: 40, drift: 4 },
];
