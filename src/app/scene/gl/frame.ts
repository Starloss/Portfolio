// Lo que la Escena WebGL dibuja en cada cuadro, como funciones puras. Sale del mismo Viaje de
// cámara que la Escena SVG (camera.ts) y repite sus animaciones de CSS con sus mismas curvas, sobre
// el reloj de esas mismas animaciones: así el fundido cruzado entre las dos no salta.
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
import { CABIN_HEIGHT, CABIN_WIDTH, CLOUD_ASPECT, CLOUDS, SKY_DARKENING } from '../Scene';

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
const DRIFT_SECONDS = 48;

/** Segundos de cada animación de CSS de la Escena SVG (su `currentTime`). */
export interface Clocks {
    cabins: number;
    macaws: number;
    drift: number;
    twinkle: number;
}

export interface EscenaInputs {
    /** Progreso de scroll de la página, de 0 a 1. */
    progress: number;
    /** Hundimiento de la montaña en el Hero (px). */
    sink: number;
    viewport: Viewport;
    frame: SceneFrame;
    clocks: Clocks;
    /** px de 1vw y de 1vh: las nubes se miden en esas unidades. */
    units: { vw: number; vh: number };
}

export function escenaFrame({ progress, sink, viewport, frame, clocks, units }: EscenaInputs) {
    const height = cameraHeightAt(progress);
    const vh = viewport.height;
    const shifts = {
        farRidge: layerShift('farRidge', height, vh, sink),
        avila: layerShift('avila', height, vh, sink),
        city: layerShift('city', height, vh, sink),
        towers: layerShift('towers', height, vh, sink),
    };
    // Una cabina cuelga del cable desde su centro arriba; en pantalla, el rectángulo de su sprite.
    const cabinRect = (x: number, y: number) => {
        const p = toScreen(frame, x, y);
        return {
            x: p.x - (CABIN_WIDTH / 2) * frame.scale,
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
    const drift = cssEaseInOut(loopAt(clocks.drift, DRIFT_SECONDS, true));
    return {
        height,
        shifts,
        skyHigh: height * SKY_DARKENING,
        cloudsOpacity: clouds.opacity,
        /** Cada nube como elipse en px: centro y semiejes. */
        clouds: CLOUDS.map((c) => ({
            x: (c.left + c.width / 2 + c.drift * drift) * units.vw,
            y: c.top * units.vh + (c.width / CLOUD_ASPECT / 2) * units.vw + clouds.y,
            rx: (c.width / 2) * units.vw,
            ry: (c.width / CLOUD_ASPECT / 2) * units.vw,
        })),
        /** Las dos cabinas que van y vienen y, al final, la del visitante. */
        cabins: [...moving, cabinRect(visitor.x, visitor.y)],
        macaws: { x: macaws.x * frame.scale, y: macaws.y * frame.scale },
        twinkle: clocks.twinkle,
    };
}

export type EscenaFrame = ReturnType<typeof escenaFrame>;
