import { describe, expect, it } from 'vitest';
import { WeatherClock, weatherTarget } from '@app/scene/weather';

const settled = (clock: WeatherClock, estado: Parameters<WeatherClock['tick']>[1], from = 0) => {
    let frame = clock.tick(from, estado);
    for (let t = from; t < from + 6000; t += 100) frame = clock.tick(t, estado);
    return frame;
};

describe('weatherTarget', () => {
    it.each([
        ['despejado', { cover: 0, dark: 0, rain: 0 }],
        ['parcial', { cover: 0.42, dark: 0.04, rain: 0 }],
        ['nublado', { cover: 0.82, dark: 0.2, rain: 0 }],
        ['lluvia', { cover: 0.93, dark: 0.4, rain: 0.7 }],
        ['tormenta', { cover: 1, dark: 0.65, rain: 1 }],
    ] as const)('%s', (estado, expected) => {
        expect(weatherTarget(estado)).toEqual(expected);
    });

    it('sin Clima quedan las nubes de siempre: ni despejado ni cubierto', () => {
        const base = weatherTarget(null);
        expect(base.cover).toBeGreaterThan(0);
        expect(base.cover).toBeLessThan(weatherTarget('parcial').cover);
        expect(base.dark).toBe(0);
        expect(base.rain).toBe(0);
    });
});

describe('WeatherClock', () => {
    it('al arrancar ya está en el Clima, sin fundido', () => {
        const frame = new WeatherClock().tick(0, 'nublado');
        expect(frame.cover).toBe(0.82);
        expect(frame.dark).toBe(0.2);
    });

    it('al cambiar, se acerca con un fundido de cerca de 1,5 s, sin saltar', () => {
        const clock = new WeatherClock();
        clock.tick(0, 'despejado');
        const soon = clock.tick(100, 'tormenta');
        expect(soon.cover).toBeGreaterThan(0);
        expect(soon.cover).toBeLessThan(0.5);
        expect(clock.fading).toBe(true);
        let cover = soon.cover;
        for (let t = 200; t <= 2000; t += 100) cover = clock.tick(t, 'tormenta').cover;
        expect(cover).toBeGreaterThan(0.95);
        for (let t = 2100; t <= 4000; t += 100) clock.tick(t, 'tormenta');
        expect(clock.fading).toBe(false);
    });

    it.each(['despejado', 'nublado', 'lluvia', null] as const)('con %s no hay rayos', (estado) => {
        const clock = new WeatherClock(() => 0);
        for (let t = 0; t < 30_000; t += 20) expect(clock.tick(t, estado).flash).toBe(0);
    });

    it('en tormenta hay rayos: dos pulsos cortos, con al menos 5 s entre un rayo y otro', () => {
        const clock = new WeatherClock(() => 0.5);
        const strikes: number[] = [];
        let wasFlashing = false;
        let lastFlash = -Infinity;
        for (let t = 0; t < 40_000; t += 10) {
            const { flash } = clock.tick(t, 'tormenta');
            expect(flash).toBeLessThanOrEqual(1);
            if (flash > 0 && !wasFlashing && t - lastFlash > 1000) strikes.push(t);
            if (flash > 0) lastFlash = t;
            wasFlashing = flash > 0;
        }
        expect(strikes.length).toBeGreaterThanOrEqual(2);
        for (let i = 1; i < strikes.length; i++) {
            expect(strikes[i] - strikes[i - 1]).toBeGreaterThanOrEqual(5000);
            expect(strikes[i] - strikes[i - 1]).toBeLessThanOrEqual(13_000);
        }
    });

    it('en cada rayo, nunca más de 3 destellos por segundo', () => {
        const clock = new WeatherClock(() => 0);
        const rises: number[] = [];
        let was = false;
        for (let t = 0; t < 7000; t += 5) {
            const on = clock.tick(t, 'tormenta').flash > 0;
            if (on && !was) rises.push(t);
            was = on;
        }
        expect(rises.length).toBe(2);
        expect(rises[1] - rises[0]).toBeLessThan(1000);
    });

    it('cada rayo cae en otro lugar, dentro de la pantalla', () => {
        const values = [0, 0.9];
        let i = 0;
        const clock = new WeatherClock(() => values[i++ % 2]);
        const places = new Set<number>();
        for (let t = 0; t < 30_000; t += 10) {
            const frame = clock.tick(t, 'tormenta');
            if (frame.flash > 0) {
                expect(frame.boltX).toBeGreaterThanOrEqual(0.15);
                expect(frame.boltX).toBeLessThanOrEqual(0.85);
                places.add(frame.boltX);
            }
        }
        expect(places.size).toBeGreaterThan(1);
    });

    it('se ve el clima al asentarse', () => {
        expect(settled(new WeatherClock(), 'lluvia').rain).toBeCloseTo(0.7);
    });
});
