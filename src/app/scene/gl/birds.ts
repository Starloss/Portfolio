// Las guacamayas en vuelo en la Escena WebGL: una instancia por ave (flights.ts), en un solo pase
// detrás de las nubes y del Ávila.
import type { Bird } from '../flights';

export const MAX_BIRDS = 48;

export interface BirdInstances {
    /** Centro del ave (x, y) en px. */
    anchor: Float32Array;
    /** Largo de cola a pico, en px. */
    length: Float32Array;
    /** Sentido, aleteo y especie. */
    meta: Float32Array;
    count: number;
}

export function createBirdInstances(): BirdInstances {
    return {
        anchor: new Float32Array(MAX_BIRDS * 2),
        length: new Float32Array(MAX_BIRDS),
        meta: new Float32Array(MAX_BIRDS * 3),
        count: 0,
    };
}

/** `shiftX`: el parallax del cielo. */
export function writeBirds(into: BirdInstances, birds: readonly Bird[], shiftX: number) {
    let n = 0;
    for (const b of birds) {
        if (n >= MAX_BIRDS) break;
        into.anchor[n * 2] = b.x + shiftX;
        into.anchor[n * 2 + 1] = b.y;
        into.length[n] = b.length;
        into.meta[n * 3] = b.dir;
        into.meta[n * 3 + 1] = b.flap;
        into.meta[n * 3 + 2] = b.species;
        n++;
    }
    into.length.fill(0, n);
    into.count = n;
    return into;
}
