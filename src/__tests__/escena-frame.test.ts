import { afterEach, describe, it, expect } from 'vitest';
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
import { CABIN_HEIGHT, CABIN_WIDTH, CLOUD_ASPECT, CLOUDS, SKY_DARKENING } from '@app/scene/Scene';
import {
    cssEase,
    cssEaseInOut,
    cubicBezier,
    escenaFrame,
    loopAt,
    type Clocks,
} from '@app/scene/gl/frame';
import { readClocks } from '@app/scene/gl/clocks';

// Lo que la Escena WebGL dibuja en cada cuadro sale del mismo Viaje de cámara que la SVG y del
// reloj de sus animaciones de CSS: así el fundido cruzado entre las dos no salta.

const viewport = { width: 1440, height: 900 };
const frame = sceneFrame(viewport);
const units = { vw: 14.4, vh: 9 };
const still: Clocks = { cabins: 0, macaws: 0, drift: 0, twinkle: 0 };
const at = (progress: number, clocks: Partial<Clocks> = {}) =>
    escenaFrame({ progress, sink: 30, viewport, frame, clocks: { ...still, ...clocks }, units });

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
            expect(f.cloudsOpacity).toBeCloseTo(cloudsAt(h, 900).opacity);
            expect(f.skyHigh).toBeCloseTo(h * SKY_DARKENING);
        }
    });

    it('la cabina del visitante cuelga del cable donde la pone la SVG, y baja con el Ávila', () => {
        const f = at(0.4);
        const p = toScreen(frame, cabinPoint(f.height).x, cabinPoint(f.height).y);
        expect(f.cabins[2]).toEqual({
            x: p.x - (CABIN_WIDTH / 2) * frame.scale,
            y: p.y + f.shifts.avila,
            width: CABIN_WIDTH * frame.scale,
            height: CABIN_HEIGHT * frame.scale,
        });
    });

    it('las cabinas que se mueven arrancan en su punto del cable y llegan al otro a los 26 s', () => {
        const start = at(0.5);
        const end = at(0.5, { cabins: 26 });
        MOVING_CABINS.forEach(({ from, to }, i) => {
            const a = toScreen(frame, cablePoint(from).x, cablePoint(from).y);
            const b = toScreen(frame, cablePoint(to).x, cablePoint(to).y);
            expect(start.cabins[i].x).toBeCloseTo(a.x - (CABIN_WIDTH / 2) * frame.scale);
            expect(start.cabins[i].y).toBeCloseTo(a.y + start.shifts.avila);
            expect(end.cabins[i].x).toBeCloseTo(b.x - (CABIN_WIDTH / 2) * frame.scale);
            expect(end.cabins[i].y).toBeCloseTo(b.y + end.shifts.avila);
        });
        // `alternate`: a los 52 s vuelven al principio.
        expect(at(0.5, { cabins: 52 }).cabins[0].x).toBeCloseTo(start.cabins[0].x);
    });

    it('las guacamayas van y vuelven cada 16 s, con el mismo recorrido que en CSS', () => {
        expect(at(0).macaws).toEqual({ x: 0, y: 0 });
        expect(at(0, { macaws: 8 }).macaws.x).toBeCloseTo(-40 * frame.scale);
        expect(at(0, { macaws: 8 }).macaws.y).toBeCloseTo(-12 * frame.scale);
        expect(at(0, { macaws: 16 }).macaws.x).toBeCloseTo(0);
    });

    it('las nubes son las mismas elipses que en CSS, en vw y vh, y derivan cada 48 s', () => {
        const f = at(0.5);
        const y = cloudsAt(f.height, 900).y;
        CLOUDS.forEach((c, i) => {
            expect(f.clouds[i].x).toBeCloseTo((c.left + c.width / 2) * units.vw);
            expect(f.clouds[i].y).toBeCloseTo(
                c.top * units.vh + (c.width / CLOUD_ASPECT / 2) * units.vw + y,
            );
            expect(f.clouds[i].rx / f.clouds[i].ry).toBeCloseTo(CLOUD_ASPECT);
        });
        const drifted = at(0.5, { drift: 48 });
        expect(drifted.clouds[0].x - f.clouds[0].x).toBeCloseTo(CLOUDS[0].drift * units.vw);
        expect(at(0.5, { drift: 96 }).clouds[0].x).toBeCloseTo(f.clouds[0].x);
    });
});

describe('curvas de CSS y loopAt', () => {
    it('ease-in-out: lenta en los extremos y simétrica', () => {
        expect(cssEaseInOut(0)).toBe(0);
        expect(cssEaseInOut(1)).toBe(1);
        expect(cssEaseInOut(0.5)).toBeCloseTo(0.5);
        expect(cssEaseInOut(0.1)).toBeLessThan(0.05);
        expect(cssEaseInOut(0.25) + cssEaseInOut(0.75)).toBeCloseTo(1);
    });

    it('ease: arranca rápido y llega lenta, como la de CSS', () => {
        expect(cssEase(0.5)).toBeCloseTo(0.8024, 3);
        expect(cubicBezier(0, 0, 1, 1)(0.3)).toBeCloseTo(0.3);
    });

    it('loopAt da la fracción de una animación infinita, con o sin alternate', () => {
        expect(loopAt(5, 10, false)).toBeCloseTo(0.5);
        expect(loopAt(15, 10, false)).toBeCloseTo(0.5);
        expect(loopAt(15, 10, true)).toBeCloseTo(0.5);
        expect(loopAt(12, 10, true)).toBeCloseTo(0.8);
    });
});

describe('readClocks', () => {
    afterEach(() => document.body.replaceChildren());

    it('toma la hora de cada animación de CSS de la Escena SVG', () => {
        document.body.innerHTML = `<div class="scene"><g data-anim="cabin"></g></div>`;
        const cabin = document.querySelector<HTMLElement>('[data-anim="cabin"]')!;
        cabin.getAnimations = () => [{ currentTime: 12_500 } as Animation];
        expect(readClocks(3)).toEqual({ cabins: 12.5, macaws: 3, drift: 3, twinkle: 3 });
    });

    it('si una animación no está montada, usa el reloj de respaldo', () => {
        expect(readClocks(7)).toEqual({ cabins: 7, macaws: 7, drift: 7, twinkle: 7 });
    });
});
