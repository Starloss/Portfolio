// Las cabinas del Teleférico en la Escena WebGL: una instancia por cabina del circuito
// (circuit.ts), en un solo pase entre las dos mitades del Ávila.
import type { CabinOnScreen } from './frame';

export const MAX_CABINS = 24;

export interface CabinInstances {
    /** De dónde cuelga (x, y) en px. */
    anchor: Float32Array;
    /** Escala del viewBox de la cabina a px. */
    scale: Float32Array;
    /** Vaivén, línea y opacidad. */
    meta: Float32Array;
    count: number;
}

export function createCabinInstances(): CabinInstances {
    return {
        anchor: new Float32Array(MAX_CABINS * 2),
        scale: new Float32Array(MAX_CABINS),
        meta: new Float32Array(MAX_CABINS * 3),
        count: 0,
    };
}

export function writeCabins(into: CabinInstances, cabins: readonly CabinOnScreen[]) {
    let n = 0;
    for (const c of cabins) {
        // Dentro de una estación no se ve: no hace falta dibujarla.
        if (n >= MAX_CABINS || c.alpha <= 0) continue;
        into.anchor[n * 2] = c.x;
        into.anchor[n * 2 + 1] = c.y;
        into.scale[n] = c.scale;
        into.meta[n * 3] = c.sway;
        into.meta[n * 3 + 1] = c.line;
        into.meta[n * 3 + 2] = c.alpha;
        n++;
    }
    into.scale.fill(0, n);
    into.count = n;
    return into;
}
