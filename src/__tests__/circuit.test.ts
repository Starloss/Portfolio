import { describe, expect, it } from 'vitest';
import { CIRCUIT, circuitAt } from '@app/scene/circuit';
import { CABLE_TOWERS } from '@app/scene/geometry';

// El Teleférico como circuito de desembrague: las cabinas suben por un cable y bajan por el otro,
// rápidas en la línea y lentas al pasar por las estaciones.

// La cabina i a lo largo de una vuelta, muestreada cada `step` s.
const track = (i: number, seconds: number, step = 0.25) =>
    Array.from({ length: Math.round(seconds / step) }, (_, k) => circuitAt(k * step)[i]);

describe('circuitAt', () => {
    it('cada cabina sube por el cable de adelante y baja por el de atrás', () => {
        const lap = track(0, CIRCUIT.tripSeconds * 2);
        for (let k = 1; k < lap.length; k++) {
            const [a, b] = [lap[k - 1], lap[k]];
            if (a.line !== b.line) continue;
            if (a.line === 0) expect(b.t).toBeGreaterThanOrEqual(a.t);
            else expect(b.t).toBeLessThanOrEqual(a.t);
        }
        expect(lap.some((c) => c.line === 0)).toBe(true);
        expect(lap.some((c) => c.line === 1)).toBe(true);
    });

    it('en las estaciones van despacio y en la línea rápido, así que se juntan al llegar', () => {
        const lap = track(0, CIRCUIT.tripSeconds * 2, 0.1);
        const speed = (near: (t: number) => boolean) => {
            const steps = lap
                .slice(1)
                .map((b, k) => ({ a: lap[k], b }))
                .filter(({ a, b }) => a.line === b.line && near(a.t));
            return steps.reduce((sum, { a, b }) => sum + Math.abs(b.t - a.t), 0) / steps.length;
        };
        const inStation = speed((t) => t < 0.03 || t > 0.97);
        const onLine = speed((t) => t > 0.2 && t < 0.8);
        expect(inStation).toBeLessThan(onLine / 3);
    });

    it('al entrar en una estación la cabina se oculta en ella; en la línea se ve entera', () => {
        const lap = track(0, CIRCUIT.tripSeconds * 2, 0.05);
        for (const c of lap) {
            if (c.t < 0.004 || c.t > 0.996) expect(c.alpha).toBe(0);
            if (c.t > 0.05 && c.t < 0.95) expect(c.alpha).toBe(1);
        }
    });

    it('se mece al salir de la estación y al pasar una torre, y se aquieta en la línea', () => {
        const lap = track(0, CIRCUIT.tripSeconds, 0.05).filter((c) => c.line === 0);
        const swing = (from: number, to: number) =>
            Math.max(...lap.filter((c) => c.t > from && c.t < to).map((c) => Math.abs(c.sway)));
        // Recién salida de la estación de abajo, y recién pasada la primera torre.
        expect(swing(0.03, 0.08)).toBeGreaterThan(0.02);
        expect(swing(CABLE_TOWERS[0], CABLE_TOWERS[0] + 0.04)).toBeGreaterThan(0.01);
        // Justo antes de la torre, el vaivén de la salida ya se apagó.
        expect(swing(CABLE_TOWERS[0] - 0.03, CABLE_TOWERS[0])).toBeLessThan(0.002);
    });

    it('una vuelta completa dura dos viajes y vuelve a empezar igual', () => {
        expect(circuitAt(CIRCUIT.tripSeconds * 2)).toEqual(circuitAt(0));
    });
});
