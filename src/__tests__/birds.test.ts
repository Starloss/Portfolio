import { describe, expect, it } from 'vitest';
import { createBirdInstances, MAX_BIRDS, writeBirds } from '@app/scene/gl/birds';
import type { Bird } from '@app/scene/flights';

const bird = (x: number): Bird => ({ x, y: 10, length: 40, dir: 1, flap: 0, species: 0 });

describe('writeBirds', () => {
    it('corre cada ave con el parallax del cielo', () => {
        const into = writeBirds(createBirdInstances(), [bird(100), bird(200)], 7);
        expect(into.count).toBe(2);
        expect([into.anchor[0], into.anchor[2]]).toEqual([107, 207]);
    });

    it('no pasa del tope, y las que sobran de un cuadro anterior no se ven', () => {
        const into = createBirdInstances();
        writeBirds(
            into,
            Array.from({ length: MAX_BIRDS + 5 }, (_, i) => bird(i)),
            0,
        );
        expect(into.count).toBe(MAX_BIRDS);
        writeBirds(into, [bird(1)], 0);
        expect(into.count).toBe(1);
        expect(into.length[1]).toBe(0);
    });
});
