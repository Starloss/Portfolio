import { describe, expect, it } from 'vitest';
import { createCabinInstances, writeCabins } from '@app/scene/gl/cabins';
import type { CabinOnScreen } from '@app/scene/gl/frame';

const cabin = (line: 0 | 1, x: number, alpha = 1): CabinOnScreen => ({
    x,
    y: 0,
    scale: 1,
    sway: 0,
    alpha,
    line,
});

describe('writeCabins', () => {
    it('dibuja primero las del cable de bajada: al cruzarse, la de adelante queda encima', () => {
        const into = writeCabins(createCabinInstances(), [cabin(0, 1), cabin(1, 2), cabin(0, 3)]);
        expect(into.count).toBe(3);
        expect([...into.meta].filter((_, i) => i % 3 === 1).slice(0, 3)).toEqual([1, 0, 0]);
    });

    it('no dibuja las que están ocultas dentro de una estación', () => {
        const into = writeCabins(createCabinInstances(), [cabin(0, 1, 0), cabin(1, 2)]);
        expect(into.count).toBe(1);
        expect(into.anchor[0]).toBe(2);
    });
});
