import { describe, expect, it } from 'vitest';
import { Crowd } from '@app/scene/crowd';
import type { CrowdParams } from '@app/scene/rhythm';

// La gente que camina por la Avenida Bolívar en la Escena WebGL: cuánta, cómo y con qué Clima.

const SPAN = 1280 / 150; // la ventana, en altos de calzada

function settle(params: CrowdParams, seconds = 60, seed = 1) {
    const crowd = new Crowd(seed);
    crowd.set(params, SPAN);
    for (let t = 0; t < seconds; t += 0.1) crowd.step(0.1, SPAN);
    return crowd;
}

const onScreen = (crowd: Crowd) => crowd.walkers.filter((w) => w.u > 0 && w.u < SPAN);

describe('Crowd', () => {
    it('la cantidad de gente sigue a la Afluencia: nadie en 0 y la acera llena en 1', () => {
        expect(onScreen(settle({ afluencia: 0, weather: 'seco' })).length).toBe(0);
        const full = onScreen(settle({ afluencia: 1, weather: 'seco' })).length;
        const half = onScreen(settle({ afluencia: 0.5, weather: 'seco' })).length;
        expect(full).toBeGreaterThan(50);
        expect(half).toBeGreaterThan(full * 0.3);
        expect(half).toBeLessThan(full * 0.7);
    });

    it('cuando cambia la Afluencia, la gente entra y sale solo por los bordes', () => {
        const crowd = settle({ afluencia: 0.2, weather: 'seco' });
        const before = new Set(crowd.walkers);
        crowd.set({ afluencia: 1, weather: 'seco' }, SPAN);
        for (let t = 0; t < 5; t += 0.1) {
            crowd.step(0.1, SPAN);
            for (const w of crowd.walkers) {
                if (before.has(w) || w.gait === 'stand') continue;
                // Las nuevas que caminan entraron por un borde: todavía están cerca de él.
                expect(w.u < 1.5 || w.u > SPAN - 1.5).toBe(true);
            }
            crowd.walkers.forEach((w) => before.has(w) || w.gait === 'stand' || before.add(w));
        }
    });

    it('caminan solas, en parejas o en grupos, y hay gente parada', () => {
        const crowd = settle({ afluencia: 1, weather: 'seco' }, 120);
        expect(crowd.walkers.some((w) => w.gait === 'stand')).toBe(true);
        const groups = new Map<number, number>();
        for (const w of crowd.walkers) groups.set(w.group, (groups.get(w.group) ?? 0) + 1);
        expect([...groups.values()].some((n) => n >= 2)).toBe(true);
    });

    it('las aceras tienen fondo: varias líneas, más chica la gente de atrás', () => {
        const crowd = settle({ afluencia: 1, weather: 'seco' });
        const lines = new Set(crowd.walkers.map((w) => w.line));
        expect(lines.size).toBeGreaterThanOrEqual(4);
        const back = crowd.walkers.filter((w) => w.s < 0.5);
        const front = crowd.walkers.filter((w) => w.s > 0.5);
        expect(Math.max(...back.map((w) => w.scale))).toBeLessThan(
            Math.min(...front.map((w) => w.scale)),
        );
    });

    it('con lluvia hay paraguas de colores y la gente parada espera bajo los árboles', () => {
        const crowd = settle({ afluencia: 0.5, weather: 'lluvia' });
        const walking = crowd.walkers.filter((w) => w.gait === 'walk');
        expect(walking.filter((w) => w.umbrella).length / walking.length).toBeGreaterThan(0.5);
        const standing = crowd.walkers.filter((w) => w.gait === 'stand');
        expect(standing.length).toBeGreaterThan(0);
        expect(standing.every((w) => w.sheltered)).toBe(true);
    });

    it('con tormenta la poca gente que queda corre, sin paraguas', () => {
        const crowd = settle({ afluencia: 0.1, weather: 'tormenta' });
        const moving = crowd.walkers.filter((w) => w.gait !== 'stand');
        expect(moving.length).toBeGreaterThan(0);
        expect(moving.every((w) => w.gait === 'run' && !w.umbrella)).toBe(true);
    });
});
