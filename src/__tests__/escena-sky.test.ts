import { describe, expect, it } from 'vitest';
import { sky } from '@app/scene/sky';

// Valores de referencia de astronomy-engine para Caracas, topocéntricos y sin refracción.
const REFERENCE = [
    {
        at: '2026-10-31T16:00:00Z',
        sun: { alt: 65.11, hour: -2.8 },
        moon: { alt: -3.83, hour: 99.05 },
        fraction: 0.635,
    },
    {
        at: '2026-11-01T02:00:00Z',
        sun: { alt: -57.76, hour: 147.2 },
        moon: { alt: -21.57, hour: -118.75 },
        fraction: 0.588,
    },
    {
        at: '2026-11-24T04:00:00Z',
        sun: { alt: -79.38, hour: 176.45 },
        moon: { alt: 75.61, hour: 4.42 },
        fraction: 0.995,
    },
    {
        at: '2026-12-09T00:00:00Z',
        sun: { alt: -27.04, hour: 115.07 },
        moon: { alt: -28.61, hour: 116.91 },
        fraction: 0.002,
    },
    {
        at: '2027-03-20T16:00:00Z',
        sun: { alt: 76.31, hour: -8.77 },
        moon: { alt: -67.56, hour: -166.63 },
        fraction: 0.958,
    },
    {
        at: '2027-06-21T23:30:00Z',
        sun: { alt: -9.39, hour: 105.13 },
        moon: { alt: -22.75, hour: -110.54 },
        fraction: 0.923,
    },
];

const near = (value: number, expected: number, tolerance: number) =>
    expect(Math.abs(value - expected)).toBeLessThanOrEqual(tolerance);

describe('sky: sol y luna sobre Caracas', () => {
    it.each(REFERENCE)('coincide con la referencia el $at', ({ at, sun, moon, fraction }) => {
        const s = sky(Date.parse(at));
        near(s.sun.alt, sun.alt, 0.1);
        near(s.sun.hour, sun.hour, 0.1);
        near(s.moon.alt, moon.alt, 0.6);
        // La hora de la luna es geocéntrica: la paralaje la corre hasta 1° respecto de la referencia.
        near(s.moon.hour, moon.hour, 1.2);
        near(s.moon.fraction, fraction, 0.01);
    });

    it('el ángulo horario va de -180 a 180: negativo al este, positivo al oeste', () => {
        const morning = sky(Date.parse('2026-10-31T12:00:00Z'));
        const afternoon = sky(Date.parse('2026-10-31T20:00:00Z'));
        expect(morning.sun.hour).toBeLessThan(0);
        expect(afternoon.sun.hour).toBeGreaterThan(0);
        for (const s of [morning, afternoon]) {
            expect(Math.abs(s.moon.hour)).toBeLessThanOrEqual(180);
        }
    });

    it('la parte iluminada de la luna mira hacia el sol', () => {
        // Creciente al anochecer del 15 de noviembre: el sol ya bajó, así que la luz viene de abajo.
        const { moon } = sky(Date.parse('2026-11-15T23:30:00Z'));
        expect(moon.alt).toBeGreaterThan(0);
        expect(moon.fraction).toBeLessThan(0.5);
        expect(Math.cos((moon.tilt * Math.PI) / 180)).toBeLessThan(0);
    });
});
