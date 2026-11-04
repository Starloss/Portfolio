import { describe, it, expect } from 'vitest';
import { cameraHeightAt, HERO_HEIGHT, layerShift, layerOffset } from '@app/scene/camera';
import {
    crowdFormation,
    FILTER_LINES,
    LIFT_SHARE,
    SIDEWALK_LINES,
    standingCount,
    streetBand,
    trafficFormation,
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

describe('trafficFormation', () => {
    const span = 1280 / 150;
    const levels = ['vacia', 'fluida', 'cargada', 'tranca'] as const;

    it('cada nivel trae más vehículos que el anterior, y siempre los mismos', () => {
        const counts = levels.map((n) => trafficFormation(n, span).length);
        for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1]);
        expect(trafficFormation('cargada', span)).toEqual(trafficFormation('cargada', span));
    });

    it('trae carros, camioneticas y motorizados; los carriles de atrás van a la izquierda', () => {
        const vehicles = trafficFormation('cargada', span);
        expect(new Set(vehicles.map((v) => v.kind))).toEqual(new Set(['car', 'bus', 'moto']));
        for (const v of vehicles) expect(v.dir).toBe(v.s < 0.7 ? -1 : 1);
    });

    it('se dibujan de atrás hacia adelante', () => {
        const s = trafficFormation('tranca', span).map((v) => v.s);
        expect(s).toEqual([...s].sort((a, b) => a - b));
    });

    it('en la tranca, las motos van entre los carriles', () => {
        const motos = trafficFormation('tranca', span).filter((v) => v.kind === 'moto');
        expect(motos.length).toBeGreaterThan(0);
        for (const m of motos) expect(Object.values(FILTER_LINES)).toContain(m.s);
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
