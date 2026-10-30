// Lo que la Escena WebGL dibuja en cada cuadro, como funciones puras. Sale del mismo Viaje de
// cámara que la Escena SVG (camera.ts) y repite sus animaciones de CSS con los mismos tiempos, así
// el fundido cruzado entre las dos no salta.
import {
    cabinPoint,
    cameraHeightAt,
    cloudsAt,
    layerShift,
    toScreen,
    type SceneFrame,
    type Viewport,
} from '../camera';
import { cablePoint } from '../geometry';
import { MOVING_CABINS } from '../parts';
import { CABIN_WIDTH, SKY_DARKENING } from '../Scene';

/** `ease-in-out` de CSS: cubic-bezier(0.42, 0, 0.58, 1). */
export function cssEaseInOut(t: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const curve = (u: number, a: number, b: number) =>
        3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
    // Busca el parámetro de la curva cuya x es t; la x es monótona, alcanza con bisección.
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (curve(mid, 0.42, 0.58) < t) lo = mid;
        else hi = mid;
    }
    return curve((lo + hi) / 2, 0, 1);
}

/** Fracción (0 a 1) de una animación infinita de `duration` s; `alternate` va y vuelve. */
export function loopAt(time: number, duration: number, alternate: boolean): number {
    const cycles = time / duration;
    const fraction = cycles - Math.floor(cycles);
    return alternate && Math.floor(cycles) % 2 === 1 ? 1 - fraction : fraction;
}

// Keyframes en 0, 50% y 100%: CSS aplica el ease-in-out a cada tramo por separado.
function twoStep<T extends { x: number; y: number }>(t: number, a: T, b: T, c: T) {
    const [from, to, u] = t < 0.5 ? [a, b, t / 0.5] : [b, c, (t - 0.5) / 0.5];
    const k = cssEaseInOut(u);
    return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
}

const CABIN_SECONDS = 26;
const MACAW_SECONDS = 16;
const MACAW_SWING = { x: -40, y: -12 };
const DRIFT_SECONDS = 48;

export interface EscenaInputs {
    /** Progreso de scroll de la página, de 0 a 1. */
    progress: number;
    /** Hundimiento de la montaña en el Hero (px). */
    sink: number;
    viewport: Viewport;
    frame: SceneFrame;
    /** Segundos desde que arrancaron las animaciones. */
    time: number;
}

export function escenaFrame({ progress, sink, viewport, frame, time }: EscenaInputs) {
    const height = cameraHeightAt(progress);
    const vh = viewport.height;
    const shifts = {
        farRidge: layerShift('farRidge', height, vh, sink),
        avila: layerShift('avila', height, vh, sink),
        city: layerShift('city', height, vh, sink),
        towers: layerShift('towers', height, vh, sink),
    };
    const onAvila = (x: number, y: number) => {
        const p = toScreen(frame, x, y);
        return { x: p.x, y: p.y + shifts.avila };
    };
    const visitor = cabinPoint(height);
    const cabinT = loopAt(time, CABIN_SECONDS, true);
    const macawT = loopAt(time, MACAW_SECONDS, false);
    const macaws = twoStep(macawT, { x: 0, y: 0 }, MACAW_SWING, { x: 0, y: 0 });
    return {
        height,
        shifts,
        clouds: cloudsAt(height, vh),
        skyHigh: height * SKY_DARKENING,
        visitorCabin: {
            x: onAvila(visitor.x, visitor.y).x - (CABIN_WIDTH / 2) * frame.scale,
            y: onAvila(visitor.x, visitor.y).y,
        },
        movingCabins: MOVING_CABINS.map(({ from, to }) => {
            const p = twoStep(
                cabinT,
                cablePoint(from),
                cablePoint((from + to) / 2),
                cablePoint(to),
            );
            return onAvila(p.x, p.y);
        }),
        macaws: { x: macaws.x * frame.scale, y: macaws.y * frame.scale },
        cloudDrift: cssEaseInOut(loopAt(time, DRIFT_SECONDS, true)),
    };
}

export type EscenaFrame = ReturnType<typeof escenaFrame>;
