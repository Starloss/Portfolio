import { describe, expect, it } from 'vitest';
import { flightRate, Flights, type FlightContext } from '@app/scene/flights';

// Las guacamayas en vuelo: cuándo salen, cómo van (en parejas) y de qué especie son.

const day = (hour: number, extra: Partial<FlightContext> = {}): FlightContext => ({
    hour,
    raining: false,
    forced: false,
    ...extra,
});

// Corre `seconds` s de vuelos y devuelve todo lo que salió.
function run(context: FlightContext, seconds: number, seed = 1) {
    const flights = new Flights(seed);
    const seen: Flights['flights'][number][] = [];
    for (let t = 0; t < seconds; t += 0.5) {
        flights.step(0.5, context);
        for (const f of flights.flights) if (!seen.includes(f)) seen.push(f);
    }
    return { flights, seen };
}

describe('flightRate', () => {
    it('vuela más al amanecer y por la tarde, algo de día, y nada de noche ni con lluvia', () => {
        expect(flightRate(day(7))).toBe(1);
        expect(flightRate(day(17))).toBe(1);
        expect(flightRate(day(12))).toBeGreaterThan(0);
        expect(flightRate(day(12))).toBeLessThan(0.3);
        expect(flightRate(day(22))).toBe(0);
        expect(flightRate(day(3))).toBe(0);
        expect(flightRate(day(7, { raining: true }))).toBe(0);
    });
});

describe('Flights', () => {
    it('en la hora pico salen vuelos seguido; de noche, ninguno', () => {
        expect(run(day(17), 600).seen.length).toBeGreaterThan(20);
        expect(run(day(23), 600).seen.length).toBe(0);
    });

    it('?guacamayas=ya hace salir un vuelo enseguida, aunque no sea hora pico; de noche y con lluvia, no', () => {
        expect(run(day(12, { forced: true }), 1).seen.length).toBe(1);
        expect(run(day(12, { forced: true, raining: true }), 1).seen.length).toBe(0);
        expect(run(day(22, { forced: true }), 1).seen.length).toBe(0);
    });

    it('fuera de la hora pico solo pasa alguna pareja suelta, por encima del título', () => {
        const { seen } = run(day(12), 3600);
        expect(seen.length).toBeGreaterThan(0);
        for (const f of seen) {
            expect(f.kind).toBe('band');
            expect(f.birds.length).toBe(2);
        }
    });

    it('vuelan en parejas casi ala con ala, cada pareja de una sola especie', () => {
        for (const f of run(day(17), 600).seen) {
            expect(f.birds.length % 2).toBe(0);
            for (let i = 0; i < f.birds.length; i += 2) {
                const [a, b] = [f.birds[i], f.birds[i + 1]];
                expect(a.species).toBe(b.species);
                expect(Math.hypot(a.dx - b.dx, a.dy - b.dy)).toBeLessThan(0.6);
            }
        }
    });

    it('la mayoría son azules y amarillas', () => {
        const birds = run(day(17), 3600).seen.flatMap((f) => f.birds);
        const blue = birds.filter((b) => b.species === 0).length / birds.length;
        expect(blue).toBeGreaterThan(0.6);
        expect(blue).toBeLessThan(0.9);
    });

    it('las bandadas van por encima del título; las que salen del Ávila crecen al acercarse', () => {
        const { seen } = run(day(17), 1200);
        const kinds = new Set(seen.map((f) => f.kind));
        expect(kinds).toEqual(new Set(['band', 'avila']));
        for (const f of seen.filter((f) => f.kind === 'band')) {
            expect(Math.min(f.y0, f.y1)).toBeGreaterThanOrEqual(0.08);
            expect(Math.max(f.y0, f.y1)).toBeLessThanOrEqual(0.17);
        }
        for (const f of seen.filter((f) => f.kind === 'avila')) {
            expect(f.scale1).toBeGreaterThan(f.scale0 * 3);
        }
    });

    it('cada ave aletea y se mueve en pantalla mientras cruza', () => {
        const flights = new Flights(2);
        flights.step(0.5, day(12, { forced: true }));
        const before = flights.birds(1280, 720, 1, 1);
        flights.step(2, day(12));
        const after = flights.birds(1280, 720, 3, 1);
        expect(before.length).toBeGreaterThan(0);
        expect(after[0].x).not.toBeCloseTo(before[0].x);
        expect(after[0].flap).not.toBeCloseTo(before[0].flap);
    });
});
