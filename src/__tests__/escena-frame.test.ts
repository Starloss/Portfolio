import { describe, it, expect } from 'vitest';
import {
    cabinPoint,
    cameraHeightAt,
    cloudsAt,
    layerShift,
    sceneFrame,
    toScreen,
} from '@app/scene/camera';
import { cablePoint } from '@app/scene/geometry';
import { MOVING_CABINS } from '@app/scene/parts';
import { CABIN_WIDTH, SKY_DARKENING } from '@app/scene/Scene';
import { cssEaseInOut, escenaFrame, loopAt } from '@app/scene/gl/frame';

// Lo que la Escena WebGL dibuja en cada cuadro sale del mismo Viaje de cámara que la SVG: así el
// fundido cruzado entre las dos no salta.

const viewport = { width: 1440, height: 900 };
const frame = sceneFrame(viewport);
const at = (progress: number, time = 0) =>
    escenaFrame({ progress, sink: 30, viewport, frame, time });

describe('escenaFrame', () => {
    it('las capas se hunden igual que en la Escena SVG', () => {
        for (const progress of [0, 0.3, 0.7, 1]) {
            const h = cameraHeightAt(progress);
            const f = at(progress);
            expect(f.height).toBeCloseTo(h);
            expect(f.shifts.farRidge).toBeCloseTo(layerShift('farRidge', h, 900, 30));
            expect(f.shifts.avila).toBeCloseTo(layerShift('avila', h, 900, 30));
            expect(f.shifts.city).toBeCloseTo(layerShift('city', h, 900, 30));
            expect(f.shifts.towers).toBeCloseTo(layerShift('towers', h, 900, 30));
            expect(f.clouds).toEqual(cloudsAt(h, 900));
            expect(f.skyHigh).toBeCloseTo(h * SKY_DARKENING);
        }
    });

    it('la cabina del visitante cuelga del cable donde la pone la SVG, y baja con el Ávila', () => {
        const f = at(0.4);
        const point = toScreen(frame, cabinPoint(f.height).x, cabinPoint(f.height).y);
        expect(f.visitorCabin.x).toBeCloseTo(point.x - (CABIN_WIDTH / 2) * frame.scale);
        expect(f.visitorCabin.y).toBeCloseTo(point.y + f.shifts.avila);
    });

    it('las cabinas que se mueven arrancan en su punto del cable y llegan al otro a los 26 s', () => {
        const start = at(0.5, 0);
        const end = at(0.5, 26);
        MOVING_CABINS.forEach(({ from, to }, i) => {
            const a = toScreen(frame, cablePoint(from).x, cablePoint(from).y);
            const b = toScreen(frame, cablePoint(to).x, cablePoint(to).y);
            expect(start.movingCabins[i].x).toBeCloseTo(a.x);
            expect(start.movingCabins[i].y).toBeCloseTo(a.y + start.shifts.avila);
            expect(end.movingCabins[i].x).toBeCloseTo(b.x);
            expect(end.movingCabins[i].y).toBeCloseTo(b.y + end.shifts.avila);
        });
        // `alternate`: a los 52 s vuelven al principio.
        expect(at(0.5, 52).movingCabins[0].x).toBeCloseTo(start.movingCabins[0].x);
    });

    it('las guacamayas van y vuelven cada 16 s, con el mismo recorrido que en CSS', () => {
        expect(at(0, 0).macaws).toEqual({ x: 0, y: 0 });
        expect(at(0, 8).macaws.x).toBeCloseTo(-40 * frame.scale);
        expect(at(0, 8).macaws.y).toBeCloseTo(-12 * frame.scale);
        expect(at(0, 16).macaws.x).toBeCloseTo(0);
    });

    it('las nubes derivan de ida y vuelta cada 48 s', () => {
        expect(at(0, 0).cloudDrift).toBeCloseTo(0);
        expect(at(0, 48).cloudDrift).toBeCloseTo(1);
        expect(at(0, 96).cloudDrift).toBeCloseTo(0);
    });
});

describe('cssEaseInOut y loopAt', () => {
    it('ease-in-out de CSS: lenta en los extremos, simétrica', () => {
        expect(cssEaseInOut(0)).toBe(0);
        expect(cssEaseInOut(1)).toBe(1);
        expect(cssEaseInOut(0.5)).toBeCloseTo(0.5);
        expect(cssEaseInOut(0.1)).toBeLessThan(0.05);
        expect(cssEaseInOut(0.25) + cssEaseInOut(0.75)).toBeCloseTo(1);
    });

    it('loopAt da la fracción de una animación infinita, con o sin alternate', () => {
        expect(loopAt(5, 10, false)).toBeCloseTo(0.5);
        expect(loopAt(15, 10, false)).toBeCloseTo(0.5);
        expect(loopAt(15, 10, true)).toBeCloseTo(0.5);
        expect(loopAt(12, 10, true)).toBeCloseTo(0.8);
    });
});
