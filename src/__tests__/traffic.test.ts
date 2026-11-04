import { describe, expect, it } from 'vitest';
import { createInstances, MAX_INSTANCES, writeInstances } from '@app/scene/gl/agents';
import { Traffic } from '@app/scene/traffic';
import type { NivelTrafico } from '@app/scene/rhythm';

// El Tráfico de la Avenida Bolívar en la Escena WebGL: cada vehículo frena según el de adelante.

const SPAN = 1280 / 150;

function settle(nivel: NivelTrafico, seconds = 120) {
    const traffic = new Traffic();
    traffic.set(nivel, SPAN);
    for (let t = 0; t < seconds; t += 0.05) traffic.step(0.05, SPAN);
    return traffic;
}

// Promedio de una medida de los vehículos en pantalla durante 30 s.
function average(traffic: Traffic, measure: (vs: Traffic['vehicles']) => number) {
    let sum = 0;
    let n = 0;
    for (let t = 0; t < 30; t += 0.05) {
        traffic.step(0.05, SPAN);
        sum += measure(traffic.vehicles.filter((v) => v.u > 0 && v.u < SPAN));
        n++;
    }
    return sum / n;
}

const count = (vs: Traffic['vehicles']) => vs.length;
const speed = (vs: Traffic['vehicles']) =>
    vs.length ? vs.reduce((s, v) => s + v.v, 0) / vs.length : 0;

describe('Traffic', () => {
    it('cada nivel tiene más vehículos que el anterior, y en la tranca casi no avanzan', () => {
        const levels: NivelTrafico[] = ['vacia', 'fluida', 'cargada', 'tranca'];
        const counts = levels.map((n) => average(settle(n), count));
        for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1]);
        expect(average(settle('tranca'), speed)).toBeLessThan(average(settle('fluida'), speed) / 4);
    });

    it('en la tranca paran y arrancan: hay vehículos detenidos y frenando', () => {
        const traffic = settle('tranca');
        let stopped = 0;
        let braking = 0;
        for (let t = 0; t < 30; t += 0.05) {
            traffic.step(0.05, SPAN);
            stopped += traffic.vehicles.filter((v) => v.v < 0.03).length;
            braking += traffic.vehicles.filter((v) => v.braking).length;
        }
        expect(stopped).toBeGreaterThan(0);
        expect(braking).toBeGreaterThan(0);
    });

    it('cuando cambia el nivel, los vehículos solo entran y salen por los bordes', () => {
        const traffic = settle('vacia');
        const seen = new Set(traffic.vehicles);
        traffic.set('tranca', SPAN);
        for (let t = 0; t < 20; t += 0.05) {
            traffic.step(0.05, SPAN);
            for (const v of traffic.vehicles) {
                if (!seen.has(v)) expect(v.u).toBeLessThan(0);
                seen.add(v);
            }
        }
    });

    it('en la tranca, las motos filtran entre los carriles y van más rápido que la cola', () => {
        const traffic = settle('tranca');
        const filtering = traffic.vehicles.filter((v) => v.filtering);
        expect(filtering.length).toBeGreaterThan(0);
        expect(filtering.every((v) => v.kind === 'moto')).toBe(true);
        const queue = traffic.vehicles.filter((v) => !v.filtering);
        expect(speed(filtering)).toBeGreaterThan(speed(queue));
        // Fuera de la tranca, nadie filtra.
        expect(settle('fluida').vehicles.some((v) => v.filtering)).toBe(false);
    });
});

describe('Traffic, en la tranca', () => {
    it('las motos que filtran nunca van encimadas', () => {
        const traffic = settle('tranca', 240);
        for (const dir of [1, -1]) {
            const motos = traffic.vehicles
                .filter((v) => v.filtering && v.dir === dir)
                .map((v) => v.u)
                .sort((a, b) => a - b);
            for (let i = 1; i < motos.length; i++)
                expect(motos[i] - motos[i - 1]).toBeGreaterThan(1);
        }
    });

    it('se dibujan de atrás hacia adelante, las motos que filtran incluidas', () => {
        const s = settle('tranca').vehicles.map((v) => v.s);
        expect(s).toEqual([...s].sort((a, b) => a - b));
    });

    it('una tranca de Noche en una pantalla de 1920 px cabe en el tope de instancias', () => {
        const traffic = new Traffic();
        const span = 1920 / 150;
        traffic.set('tranca', span);
        const into = writeInstances(createInstances(), traffic.vehicles, [], {
            top: 900,
            H: 150,
            width: 1920,
            time: 0,
            night: 1,
        });
        // Y queda lugar para la acera llena, que suma más de 100.
        expect(into.count).toBeLessThan(MAX_INSTANCES - 150);
    });
});
