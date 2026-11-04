import { describe, expect, it } from 'vitest';
import { Crowd } from '@app/scene/crowd';
import type { AfluenciaParams } from '@app/scene/rhythm';

// La gente que camina por la Avenida Bolívar en la Escena WebGL: cuánta, cómo y con qué Clima.

const SPAN = 1280 / 150; // la ventana, en altos de calzada
const TREE_EVERY = 260 / 150; // un árbol cada 260 px

function settle(params: AfluenciaParams, seconds = 60, seed = 1) {
    const crowd = new Crowd(seed);
    crowd.set(params, SPAN, TREE_EVERY);
    for (let t = 0; t < seconds; t += 0.1) crowd.step(0.1, SPAN, TREE_EVERY);
    return crowd;
}

const onScreen = (crowd: Crowd) => crowd.walkers.filter((w) => w.u > 0 && w.u < SPAN);
const underTree = (u: number) => {
    const k = u / TREE_EVERY - 0.5;
    return Math.abs(k - Math.round(k)) * TREE_EVERY < 0.26;
};

describe('Crowd', () => {
    it('la cantidad de gente sigue a la Afluencia: nadie en 0 y la acera llena en 1', () => {
        expect(onScreen(settle({ afluencia: 0, lluvia: 'seca' })).length).toBe(0);
        const full = onScreen(settle({ afluencia: 1, lluvia: 'seca' })).length;
        const half = onScreen(settle({ afluencia: 0.5, lluvia: 'seca' })).length;
        expect(full).toBeGreaterThan(50);
        expect(half).toBeGreaterThan(full * 0.3);
        expect(half).toBeLessThan(full * 0.7);
    });

    it('después de cargar, nadie aparece a la vista: se entra por los bordes o se para donde está', () => {
        const crowd = settle({ afluencia: 0.2, lluvia: 'seca' });
        const seen = new Set(crowd.walkers);
        // Sube la Afluencia y empieza a llover: los cambios llegan con quien entra.
        crowd.set({ afluencia: 1, lluvia: 'lluvia' }, SPAN, TREE_EVERY);
        for (let t = 0; t < 10; t += 0.1) {
            crowd.step(0.1, SPAN, TREE_EVERY);
            for (const w of crowd.walkers) {
                if (!seen.has(w)) expect(w.u < 1.5 || w.u > SPAN - 1.5).toBe(true);
                seen.add(w);
            }
        }
    });

    it('caminan solas, en parejas o en grupos desde que carga, y hay gente parada', () => {
        const crowd = new Crowd(1);
        crowd.set({ afluencia: 1, lluvia: 'seca' }, SPAN, TREE_EVERY);
        expect(crowd.walkers.some((w) => w.gait === 'stand')).toBe(true);
        const groups = new Map<number, number>();
        for (const w of crowd.walkers) groups.set(w.group, (groups.get(w.group) ?? 0) + 1);
        expect([...groups.values()].some((n) => n >= 2)).toBe(true);
    });

    it('las aceras tienen fondo: varias líneas, más chica la gente de atrás', () => {
        const crowd = settle({ afluencia: 1, lluvia: 'seca' });
        expect(new Set(crowd.walkers.map((w) => w.line)).size).toBeGreaterThanOrEqual(4);
        const back = crowd.walkers.filter((w) => w.s < 0.5).map((w) => w.scale);
        const front = crowd.walkers.filter((w) => w.s > 0.5).map((w) => w.scale);
        expect(Math.max(...back)).toBeLessThan(Math.min(...front));
    });

    it('con lluvia hay paraguas de colores y la gente parada espera bajo los árboles', () => {
        const crowd = settle({ afluencia: 0.5, lluvia: 'lluvia' });
        const walking = crowd.walkers.filter((w) => w.gait === 'walk');
        expect(walking.filter((w) => w.umbrella).length / walking.length).toBeGreaterThan(0.5);
        const standing = crowd.walkers.filter((w) => w.gait === 'stand');
        expect(standing.length).toBeGreaterThan(0);
        expect(standing.every((w) => underTree(w.u))).toBe(true);
    });

    it('si empieza a llover, quien esperaba al descubierto se va caminando', () => {
        const crowd = settle({ afluencia: 0.8, lluvia: 'seca' });
        crowd.set({ afluencia: 0.8, lluvia: 'lluvia' }, SPAN, TREE_EVERY);
        for (let t = 0; t < 60; t += 0.1) crowd.step(0.1, SPAN, TREE_EVERY);
        const standing = crowd.walkers.filter((w) => w.gait === 'stand');
        expect(standing.every((w) => underTree(w.u))).toBe(true);
    });

    it('con tormenta la poca gente que queda corre, sin paraguas, y nadie se queda parado', () => {
        const crowd = settle({ afluencia: 0.1, lluvia: 'tormenta' });
        expect(crowd.walkers.length).toBeGreaterThan(0);
        expect(crowd.walkers.every((w) => w.gait === 'run' && !w.umbrella)).toBe(true);
    });
});
