// Viaje de cámara: la coreografía de la Escena como funciones puras.
// La altura de la cámara va de 0 (ciudad) a 1 (sobre las nubes) y solo hay movimiento vertical.
import { cablePoint, VIEW } from './geometry';

/** Altura de la cámara cuando cada sección cruza el centro de la pantalla, por id de sección. */
export const CAMERA_HEIGHTS: Readonly<Record<string, number>> = {
    hero: 0,
    impact: 0.35,
    experience: 0.7,
    projects: 1,
    skills: 0.6,
    contact: 0,
};

export interface SectionBox {
    id: string;
    /** Distancia desde el inicio del documento, en px. */
    top: number;
    height: number;
}

/** Keyframes del Viaje: progreso de scroll (0 a 1) y altura de la cámara en cada punto. */
export interface CameraJourney {
    progress: number[];
    height: number[];
}

const SAMPLES_PER_SEGMENT = 8;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function cameraJourney(
    sections: readonly SectionBox[],
    viewportHeight: number,
    documentHeight: number,
): CameraJourney {
    const maxScroll = documentHeight - viewportHeight;
    if (maxScroll <= 0) return { progress: [0, 1], height: [0, 0] };

    // Cada sección configurada aporta un ancla: el scroll en que su centro cruza el de la pantalla.
    // Si varias anclas caen en el mismo punto (el final de la página), gana la última del documento.
    const anchors: { scroll: number; height: number }[] = [];
    for (const s of sections) {
        const height = CAMERA_HEIGHTS[s.id];
        if (height === undefined) continue;
        const scroll = clamp(s.top + s.height / 2 - viewportHeight / 2, 0, maxScroll);
        while (anchors.length > 0 && anchors[anchors.length - 1].scroll >= scroll) anchors.pop();
        anchors.push({ scroll, height });
    }
    if (anchors.length === 0) return { progress: [0, 1], height: [0, 0] };
    if (anchors.length === 1) {
        return { progress: [0, 1], height: [anchors[0].height, anchors[0].height] };
    }

    // Entre anclas se interpola con suavizado; se muestrea para que el tramo sea lineal a trozos.
    const progress: number[] = [];
    const height: number[] = [];
    for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i];
        const b = anchors[i + 1];
        for (let k = 0; k < SAMPLES_PER_SEGMENT; k++) {
            const t = k / SAMPLES_PER_SEGMENT;
            progress.push((a.scroll + (b.scroll - a.scroll) * t) / maxScroll);
            height.push(a.height + (b.height - a.height) * smoothstep(t));
        }
    }
    const last = anchors[anchors.length - 1];
    progress.push(last.scroll / maxScroll);
    height.push(last.height);
    return { progress, height };
}

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

/** Altura de la cámara para un progreso de scroll (0 a 1). */
export function cameraHeightAt({ progress, height }: CameraJourney, at: number): number {
    if (at <= progress[0]) return height[0];
    for (let i = 1; i < progress.length; i++) {
        if (at <= progress[i]) {
            const t = (at - progress[i - 1]) / (progress[i] - progress[i - 1]);
            return height[i - 1] + (height[i] - height[i - 1]) * t;
        }
    }
    return height[height.length - 1];
}
