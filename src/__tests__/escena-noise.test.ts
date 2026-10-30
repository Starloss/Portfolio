import { describe, it, expect } from 'vitest';
import { noiseData } from '@app/scene/gl/noise';

// Ruido para las nubes y la niebla de la Escena WebGL: se genera en el Worker, no se descarga.

const SIZE = 64;
const at = (data: Uint8Array, x: number, y: number, channel = 0) =>
    data[(((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)) * 4 + channel];

describe('noiseData', () => {
    const data = noiseData(SIZE);

    it('es siempre el mismo: las nubes no cambian de una visita a otra', () => {
        expect(noiseData(SIZE)).toEqual(data);
    });

    it('trae dos ruidos distintos, en R y en G, con alfa opaco', () => {
        let differ = 0;
        for (let i = 0; i < SIZE * SIZE; i++) {
            if (data[i * 4] !== data[i * 4 + 1]) differ++;
            expect(data[i * 4 + 3]).toBe(255);
        }
        expect(differ / (SIZE * SIZE)).toBeGreaterThan(0.9);
    });

    it('se repite en mosaico sin costura: los bordes opuestos se continúan', () => {
        let seam = 0;
        let inside = 0;
        for (let y = 0; y < SIZE; y++) {
            seam += Math.abs(at(data, SIZE - 1, y) - at(data, 0, y));
            inside += Math.abs(at(data, SIZE / 2, y) - at(data, SIZE / 2 + 1, y));
        }
        // Cruzar el borde no salta más que dar un paso adentro.
        expect(seam).toBeLessThan(inside * 2);
    });

    it('cubre un rango amplio, para que el umbral de las nubes tenga de dónde cortar', () => {
        const values = Array.from({ length: SIZE * SIZE }, (_, i) => data[i * 4]);
        expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(100);
    });
});
