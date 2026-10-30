// Ruido de valor fractal para las nubes y la niebla de la Escena WebGL. Se repite en mosaico, y R y
// G son dos semillas distintas. Lo genera el Worker: nada que descargar.

// Un generador de números pseudoaleatorios con semilla: el mismo ruido en cada visita.
function lattice(seed: number, cells: number) {
    const values = new Float32Array(cells * cells);
    let s = seed;
    for (let i = 0; i < values.length; i++) {
        s = (s * 16807) % 2147483647;
        values[i] = s / 2147483647;
    }
    const wrap = (i: number) => ((i % cells) + cells) % cells;
    return (x: number, y: number) => {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const sx = (x - x0) ** 2 * (3 - 2 * (x - x0));
        const sy = (y - y0) ** 2 * (3 - 2 * (y - y0));
        const v = (i: number, j: number) => values[wrap(j) * cells + wrap(i)];
        const top = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * sx;
        const bottom = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * sx;
        return top + (bottom - top) * sy;
    };
}

/** RGBA de `size` × `size`: R y G con cinco octavas cada uno, A opaco. */
export function noiseData(size = 256): Uint8Array {
    const data = new Uint8Array(size * size * 4);
    const octaves = (seed: number) =>
        [4, 8, 16, 32, 64].map((cells, i) => ({ sample: lattice(seed + i * 101, cells), cells }));
    const channels = [octaves(7), octaves(9137)];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            channels.forEach((layers, channel) => {
                let value = 0;
                let amplitude = 0.5;
                let total = 0;
                for (const { sample, cells } of layers) {
                    value += sample((x / size) * cells, (y / size) * cells) * amplitude;
                    total += amplitude;
                    amplitude *= 0.5;
                }
                data[(y * size + x) * 4 + channel] = Math.round((value / total) * 255);
            });
            data[(y * size + x) * 4 + 3] = 255;
        }
    }
    return data;
}
