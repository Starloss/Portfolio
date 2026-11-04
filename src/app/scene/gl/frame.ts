// Lo que la Escena WebGL dibuja en cada cuadro, como funciones puras. Sale del mismo Viaje de
// cámara que la Escena SVG (camera.ts): así el fundido cruzado entre las dos no salta.
import {
    journeyAt,
    cloudsAt,
    layerShift,
    SKY_DARKENING,
    toScreen,
    type MovingLayer,
    type SceneFrame,
    type Viewport,
} from '../camera';
import { circuitAt } from '../circuit';
import { cableLinePoint, RETURN_CABLE, type CableLine } from '../geometry';
import { streetBand } from '../street';

/** El puntero en x, de -1 (izquierda) a 1, seguido con suavidad: nunca salta ni se pasa. */
export function followPointer(current: number, target: number, dt: number): number {
    return current + (target - current) * Math.min(1, dt * 3);
}

/** px que se corre la capa más cercana con el puntero en un borde. */
export const PARALLAX_PX = 14;
// Profundidad de cada capa para el parallax: lo lejano se mueve menos.
const PARALLAX_DEPTH = {
    sky: 0.15,
    farRidge: 0.3,
    avila: 0.5,
    city: 0.8,
    towers: 0.9,
    street: 1.1,
};

// Altura de la cámara donde la atraviesan las nubes cercanas, y cuánto dura el cruce.
const FRONT_CLOUDS = { height: 0.6, spread: 0.11, density: 0.9 };
// La niebla se pega a las laderas a esta altura (y SVG) y con este alto (unidades SVG).
const MIST = { y: 560, halfHeight: 42 };

export interface EscenaInputs {
    /** Progreso de scroll de la página, de 0 a 1. */
    progress: number;
    /** Hundimiento de la montaña en el Hero (px). */
    sink: number;
    viewport: Viewport;
    frame: SceneFrame;
    /** El puntero en x ya suavizado (`followPointer`); 0, al centro, si no hay mouse. */
    pointer: number;
}

export function escenaFrame({ progress, sink, viewport, frame, pointer }: EscenaInputs) {
    // Lo que depende de la altura de la cámara se interpola entre las muestras del Viaje, igual que
    // en la Escena SVG: así el fundido cruzado entre las dos no salta.
    const sample = (valueAt: (height: number) => number) => journeyAt(progress, valueAt);
    const height = sample((h) => h);
    const vh = viewport.height;
    const shift = (layer: MovingLayer) => sample((h) => layerShift(layer, h, vh, sink));
    const shifts = {
        farRidge: shift('farRidge'),
        avila: shift('avila'),
        city: shift('city'),
        towers: shift('towers'),
    };
    const sway = (depth: number) => -pointer * PARALLAX_PX * depth || 0;
    const parallax = {
        sky: sway(PARALLAX_DEPTH.sky),
        farRidge: sway(PARALLAX_DEPTH.farRidge),
        avila: sway(PARALLAX_DEPTH.avila),
        city: sway(PARALLAX_DEPTH.city),
        towers: sway(PARALLAX_DEPTH.towers),
        street: sway(PARALLAX_DEPTH.street),
    };
    const clouds = {
        y: sample((h) => cloudsAt(h, vh).y),
        opacity: sample((h) => cloudsAt(h, vh).opacity),
    };
    const band = (key: 'top' | 'layerTop' | 'lift') => sample((h) => streetBand(h, vh)[key]);
    return {
        height,
        shifts,
        skyHigh: sample((h) => h * SKY_DARKENING),
        cloudsOpacity: clouds.opacity,
        /** Cuánto bajó la capa de nubes lejanas con la cámara (px). */
        cloudsShift: clouds.y,
        parallax,
        /** La franja de la Avenida Bolívar (street.ts): su borde de arriba y su alto, en px. */
        street: {
            height: streetBand(height, vh).height,
            top: band('top'),
            layerTop: band('layerTop'),
            lift: band('lift'),
        },
        /** Densidad de las nubes cercanas que cruza la cámara (0 a 1). */
        frontClouds:
            FRONT_CLOUDS.density *
            Math.exp(-(((height - FRONT_CLOUDS.height) / FRONT_CLOUDS.spread) ** 2)),
        /** Centro (y en px) de la franja de niebla de cada cresta, y su medio alto. */
        mist: {
            // La de la cresta lejana va un poco más arriba: esa cresta es la más alta.
            farRidge: toScreen(frame, 0, MIST.y).y + shifts.farRidge - 0.08 * vh,
            avila: toScreen(frame, 0, MIST.y).y + shifts.avila,
            halfHeight: MIST.halfHeight * frame.scale,
        },
    };
}

export type EscenaFrame = ReturnType<typeof escenaFrame>;

/** Una cabina del circuito en pantalla: de dónde cuelga (px), su escala, su vaivén y su opacidad. */
export interface CabinOnScreen {
    x: number;
    y: number;
    scale: number;
    sway: number;
    alpha: number;
    line: CableLine;
}

/**
 * Las cabinas del circuito (circuit.ts) a los `time` s, colgadas de su cable y movidas con el
 * Ávila.
 */
export function circuitOnScreen(
    time: number,
    frame: SceneFrame,
    { parallax, shifts }: { parallax: { avila: number }; shifts: { avila: number } },
): CabinOnScreen[] {
    return circuitAt(time).map(({ t, line, sway, alpha }) => {
        const p = cableLinePoint(t, line);
        const s = toScreen(frame, p.x, p.y);
        return {
            x: s.x + parallax.avila,
            y: s.y + shifts.avila,
            scale: frame.scale * (line ? RETURN_CABLE.scale : 1),
            sway,
            alpha,
            line,
        };
    });
}
