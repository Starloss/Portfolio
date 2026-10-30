// Lo que la Escena WebGL dibuja en cada cuadro, como funciones puras. Sale del mismo Viaje de
// cámara que la Escena SVG (camera.ts) y repite sus animaciones de CSS con sus mismas curvas, sobre
// el reloj de esas mismas animaciones: así el fundido cruzado entre las dos no salta.
import {
    CABIN_HEIGHT,
    CABIN_WIDTH,
    cabinPoint,
    cameraHeightAt,
    cloudsAt,
    layerShift,
    SKY_DARKENING,
    toScreen,
    type SceneFrame,
    type Viewport,
} from '../camera';
import { cablePoint, MOVING_CABINS } from '../geometry';

/** Una curva `cubic-bezier()` de CSS, como función del progreso. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
    const at = (u: number, a: number, b: number) =>
        3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
    return (t: number) => {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        // La x de la curva es monótona: alcanza con bisección para hallar el parámetro.
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 24; i++) {
            const mid = (lo + hi) / 2;
            if (at(mid, x1, x2) < t) lo = mid;
            else hi = mid;
        }
        return at((lo + hi) / 2, y1, y2);
    };
}

export const cssEaseInOut = cubicBezier(0.42, 0, 0.58, 1);
export const cssEase = cubicBezier(0.25, 0.1, 0.25, 1);

/** Fracción (0 a 1) de una animación infinita de `duration` s; `alternate` va y vuelve. */
export function loopAt(time: number, duration: number, alternate: boolean): number {
    const cycles = time / duration;
    const fraction = cycles - Math.floor(cycles);
    return alternate && Math.floor(cycles) % 2 === 1 ? 1 - fraction : fraction;
}

// Keyframes en 0, 50% y 100%: CSS aplica el ease-in-out a cada tramo por separado.
function twoStep(t: number, a: Point, b: Point, c: Point): Point {
    const [from, to, u] = t < 0.5 ? [a, b, t / 0.5] : [b, c, (t - 0.5) / 0.5];
    const k = cssEaseInOut(u);
    return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
}

interface Point {
    x: number;
    y: number;
}

const CABIN_SECONDS = 26;
const MACAW_SECONDS = 16;
const MACAW_SWING = { x: -40, y: -12 };

/** Segundos de cada animación de CSS de la Escena SVG (su `currentTime`). */
export interface Clocks {
    cabins: number;
    macaws: number;
    twinkle: number;
}

/** Los relojes de CSS en un instante (ms desde el epoch): el Worker los avanza con el suyo. */
export interface ClockAnchor {
    at: number;
    clocks: Clocks;
}

export function advanceClocks({ at, clocks }: ClockAnchor, now: number): Clocks {
    const elapsed = (now - at) / 1000;
    return {
        cabins: clocks.cabins + elapsed,
        macaws: clocks.macaws + elapsed,
        twinkle: clocks.twinkle + elapsed,
    };
}

/**
 * Cuánto se ve el atardecer o el amanecer según el avance del cambio de tema (0 Día, 1 Noche): nada
 * en los extremos, todo a la mitad. El ×1,15 lo satura un poco antes, así el momento dorado dura.
 */
export function duskAt(night: number): number {
    return Math.min(1, 4 * night * (1 - night) * 1.15);
}

/**
 * Dónde está el sol en el cambio de tema, como fracción de la pantalla. Mirando al Ávila (al norte),
 * se pone a la izquierda, al oeste, al pasar a Noche, y sale a la derecha, al este, al volver al
 * Día. En los dos casos está más bajo cuanto más cerca de la Noche.
 */
export function sunAt(night: number, setting: boolean): { x: number; y: number } {
    return { x: setting ? 0.12 : 0.88, y: 0.48 + 0.24 * night };
}

/** El puntero en x, de -1 (izquierda) a 1, seguido con suavidad: nunca salta ni se pasa. */
export function followPointer(current: number, target: number, dt: number): number {
    return current + (target - current) * Math.min(1, dt * 3);
}

/** px que se corre la capa más cercana con el puntero en un borde. */
export const PARALLAX_PX = 14;
// Profundidad de cada capa para el parallax: lo lejano se mueve menos.
const PARALLAX_DEPTH = { sky: 0.15, farRidge: 0.3, avila: 0.5, city: 0.8, towers: 0.9 };

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
    clocks: Clocks;
    /** El puntero en x ya suavizado (`followPointer`); 0, al centro, si no hay mouse. */
    pointer: number;
}

export function escenaFrame({ progress, sink, viewport, frame, clocks, pointer }: EscenaInputs) {
    const height = cameraHeightAt(progress);
    const vh = viewport.height;
    const shifts = {
        farRidge: layerShift('farRidge', height, vh, sink),
        avila: layerShift('avila', height, vh, sink),
        city: layerShift('city', height, vh, sink),
        towers: layerShift('towers', height, vh, sink),
    };
    const shift = (depth: number) => -pointer * PARALLAX_PX * depth || 0;
    const parallax = {
        sky: shift(PARALLAX_DEPTH.sky),
        farRidge: shift(PARALLAX_DEPTH.farRidge),
        avila: shift(PARALLAX_DEPTH.avila),
        city: shift(PARALLAX_DEPTH.city),
        towers: shift(PARALLAX_DEPTH.towers),
    };
    // Una cabina cuelga del cable desde su centro arriba; en pantalla, el rectángulo de su sprite.
    const cabinRect = (x: number, y: number) => {
        const p = toScreen(frame, x, y);
        return {
            x: p.x - (CABIN_WIDTH / 2) * frame.scale + parallax.avila,
            y: p.y + shifts.avila,
            width: CABIN_WIDTH * frame.scale,
            height: CABIN_HEIGHT * frame.scale,
        };
    };
    const cabinT = loopAt(clocks.cabins, CABIN_SECONDS, true);
    const moving = MOVING_CABINS.map(({ from, to }) => {
        const p = twoStep(cabinT, cablePoint(from), cablePoint((from + to) / 2), cablePoint(to));
        return cabinRect(p.x, p.y);
    });
    const visitor = cabinPoint(height);
    const macaws = twoStep(
        loopAt(clocks.macaws, MACAW_SECONDS, false),
        { x: 0, y: 0 },
        MACAW_SWING,
        {
            x: 0,
            y: 0,
        },
    );
    const clouds = cloudsAt(height, vh);
    return {
        height,
        shifts,
        skyHigh: height * SKY_DARKENING,
        cloudsOpacity: clouds.opacity,
        /** Cuánto bajó la capa de nubes lejanas con la cámara (px). */
        cloudsShift: clouds.y,
        /** Las dos cabinas que van y vienen y, al final, la del visitante. */
        cabins: [...moving, cabinRect(visitor.x, visitor.y)],
        macaws: { x: macaws.x * frame.scale + parallax.sky, y: macaws.y * frame.scale },
        twinkle: clocks.twinkle,
        parallax,
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
