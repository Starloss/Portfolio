import { describe, it, expect } from 'vitest';
import { cameraHeightAt, HERO_HEIGHT, layerShift, layerOffset } from '@app/scene/camera';
import {
    agentX,
    AGENT_SIZE,
    crowdFormation,
    LIFT_SHARE,
    SIDEWALK_LINES,
    standingCount,
    streetAgents,
    streetBand,
} from '@app/scene/street';

// La Avenida Bolívar: la capa más cercana al final del Viaje de cámara. Al entrar, el paisaje sube
// con ella para que la ciudad quede apoyada en la acera (la usan la Escena SVG y la WebGL).

describe('streetBand', () => {
    it('arriba del Viaje la calle queda entera debajo de la pantalla, postes incluidos', () => {
        for (const height of [HERO_HEIGHT, 0.22]) {
            const band = streetBand(height, 900);
            expect(band.layerTop).toBeGreaterThanOrEqual(900);
            expect(band.lift).toBe(0);
        }
    });

    it('al final del Viaje la calle se ve casi entera y el paisaje subió con ella', () => {
        const band = streetBand(0, 900);
        expect(band.top).toBeLessThan(900 - band.height * 0.9);
        expect(band.lift).toBeGreaterThan(0);
        expect(band.lift).toBeLessThan(900 - band.top);
    });

    it('entra recién en el último tramo y sin saltos', () => {
        expect(streetBand(0.25, 900).lift).toBe(0);
        let last = 0;
        for (let h = 0.2; h >= 0; h -= 0.02) {
            const lift = streetBand(h, 900).lift;
            expect(lift).toBeGreaterThanOrEqual(last);
            // Un paso de 0,02 de cámara (un par de % de scroll) sube menos de un tercio de la calle.
            expect(lift - last).toBeLessThan(streetBand(0, 900).height / 3);
            last = lift;
        }
    });

    it('su alto crece con la ventana, dentro de un rango', () => {
        expect(streetBand(0, 400).height).toBe(90);
        expect(streetBand(0, 2000).height).toBe(150);
        expect(streetBand(0, 900).height).toBeCloseTo(126);
    });
});

describe('el paisaje sube con la calle', () => {
    it('cada capa sube una parte del alzado: la ciudad entera, el Ávila menos y en una pieza', () => {
        const lift = streetBand(0, 900).lift;
        for (const layer of ['farRidge', 'avila', 'city', 'towers'] as const) {
            expect(layerShift(layer, 0, 900, 0)).toBeCloseTo(
                layerOffset(layer, 0, 900) - lift * LIFT_SHARE[layer],
            );
        }
        expect(LIFT_SHARE.city).toBe(1);
        expect(LIFT_SHARE.farRidge).toBe(LIFT_SHARE.avila);
        expect(LIFT_SHARE.avila).toBeLessThan(LIFT_SHARE.city);
    });

    it('en el Hero y en medio del Viaje no cambia nada', () => {
        for (const progress of [0, 0.3, 0.6]) {
            const h = cameraHeightAt(progress);
            expect(layerShift('city', h, 900, 0)).toBeCloseTo(layerOffset('city', h, 900));
        }
    });
});

describe('streetAgents', () => {
    const agents = streetAgents();

    it('es siempre la misma formación: la Escena SVG y la WebGL muestran la misma calle', () => {
        expect(streetAgents()).toEqual(agents);
    });

    it('trae carros, camioneticas y motorizados; la gente la pone la Afluencia', () => {
        const kinds = new Set(agents.map((a) => a.kind));
        expect(kinds).toEqual(new Set(['car', 'bus', 'moto']));
    });

    it('los carriles de atrás van a la izquierda y los de adelante a la derecha', () => {
        for (const a of agents.filter((a) => a.kind !== 'walker')) {
            expect(a.dir).toBe(a.s < 0.7 ? -1 : 1);
        }
    });

    it('se dibujan de atrás hacia adelante', () => {
        const rows = agents.map((a) => a.s);
        expect(rows).toEqual([...rows].sort((a, b) => a - b));
    });

    it('en un mismo carril nadie se encima', () => {
        const width = 1440;
        const H = 126;
        const lanes = new Map<number, number[]>();
        for (const a of agents.filter((a) => a.kind !== 'walker')) {
            lanes.set(a.s, [...(lanes.get(a.s) ?? []), agentX(a, 0, width, H)]);
        }
        for (const xs of lanes.values()) {
            xs.sort((a, b) => a - b);
            for (let i = 1; i < xs.length; i++) {
                expect(xs[i] - xs[i - 1]).toBeGreaterThan(AGENT_SIZE.bus[0] * H);
            }
        }
    });
});

describe('agentX', () => {
    const [agent] = streetAgents().filter((a) => a.kind === 'car');

    it('avanza en su sentido y vuelve a entrar por el otro lado', () => {
        const width = 1440;
        const H = 126;
        const start = agentX(agent, 0, width, H);
        const later = agentX(agent, 1, width, H);
        expect(Math.sign(later - start)).toBe(agent.dir);
        for (let t = 0; t < 120; t += 0.5) {
            const x = agentX(agent, t, width, H);
            expect(x).toBeGreaterThanOrEqual(-H);
            expect(x).toBeLessThanOrEqual(width + H);
        }
    });
});

describe('crowdFormation', () => {
    const span = 1280 / 150;
    const trees = 260 / 150;

    it('pone tanta gente como la Escena WebGL para esa Afluencia, y siempre igual', () => {
        expect(crowdFormation({ afluencia: 0, lluvia: 'seca' }, span, trees)).toHaveLength(0);
        const full = crowdFormation({ afluencia: 1, lluvia: 'seca' }, span, trees);
        const moving = SIDEWALK_LINES.reduce((n, l) => n + Math.round(l.perSpan * span), 0);
        const expected = moving + standingCount({ afluencia: 1, lluvia: 'seca' }, span);
        expect(full).toHaveLength(expected);
        expect(crowdFormation({ afluencia: 1, lluvia: 'seca' }, span, trees)).toEqual(full);
    });

    it('con lluvia la mayoría lleva paraguas; con tormenta, nadie', () => {
        const rain = crowdFormation({ afluencia: 0.5, lluvia: 'lluvia' }, span, trees);
        expect(rain.filter((w) => w.umbrella).length / rain.length).toBeGreaterThan(0.5);
        expect(
            crowdFormation({ afluencia: 0.5, lluvia: 'tormenta' }, span, trees).some(
                (w) => w.umbrella,
            ),
        ).toBe(false);
    });
});
