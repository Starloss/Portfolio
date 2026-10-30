import { afterEach, describe, it, expect } from 'vitest';
import {
    CABIN_HEIGHT,
    CABIN_WIDTH,
    cabinPoint,
    cameraHeightAt,
    cloudsAt,
    layerShift,
    sceneFrame,
    SKY_DARKENING,
    toScreen,
} from '@app/scene/camera';
import { cablePoint, MOVING_CABINS } from '@app/scene/geometry';
import {
    cssEase,
    cssEaseInOut,
    advanceClocks,
    cubicBezier,
    duskAt,
    escenaFrame,
    followPointer,
    loopAt,
    PARALLAX_PX,
    sunAt,
    type Clocks,
} from '@app/scene/gl/frame';
import { readClocks } from '@app/scene/gl/clocks';

// Lo que la Escena WebGL dibuja en cada cuadro sale del mismo Viaje de cámara que la SVG y del
// reloj de sus animaciones de CSS: así el fundido cruzado entre las dos no salta.

const viewport = { width: 1440, height: 900 };
const frame = sceneFrame(viewport);
const still: Clocks = { cabins: 0, macaws: 0, twinkle: 0 };
const at = (progress: number, clocks: Partial<Clocks> = {}, pointer = 0) =>
    escenaFrame({
        progress,
        sink: 30,
        viewport,
        frame,
        clocks: { ...still, ...clocks },
        pointer,
    });

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

    it('las nubes lejanas bajan con la cámara, como la capa de nubes de la SVG', () => {
        for (const progress of [0, 0.5, 1]) {
            const f = at(progress);
            expect(f.cloudsShift).toBeCloseTo(cloudsAt(f.height, 900).y);
        }
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

describe('advanceClocks', () => {
    it('el Worker avanza los relojes de CSS con el tiempo que pasó desde el ancla', () => {
        const anchor = { at: 10_000, clocks: { cabins: 1, macaws: 2, twinkle: 4 } };
        expect(advanceClocks(anchor, 12_500)).toEqual({ cabins: 3.5, macaws: 4.5, twinkle: 6.5 });
    });
});

describe('readClocks', () => {
    afterEach(() => document.body.replaceChildren());

    it('toma la hora de cada animación de CSS de la Escena SVG', () => {
        document.body.innerHTML = `<div class="scene"><g data-anim="cabin"></g></div>`;
        const cabin = document.querySelector<HTMLElement>('[data-anim="cabin"]')!;
        cabin.getAnimations = () => [{ currentTime: 12_500 } as Animation];
        expect(readClocks(3)).toEqual({ cabins: 12.5, macaws: 3, twinkle: 3 });
    });

    it('si una animación no está montada, usa el reloj de respaldo', () => {
        expect(readClocks(7)).toEqual({ cabins: 7, macaws: 7, twinkle: 7 });
    });
});

describe('efectos', () => {
    it('el atardecer o amanecer aparece solo a mitad del cambio de tema', () => {
        expect(duskAt(0)).toBe(0);
        expect(duskAt(1)).toBe(0);
        expect(duskAt(0.5)).toBe(1);
        expect(duskAt(0.2)).toBeGreaterThan(0.5);
        expect(duskAt(0.2)).toBeCloseTo(duskAt(0.8));
    });

    it('el puntero se sigue con suavidad, sin pasarse del objetivo', () => {
        const half = followPointer(0, 1, 0.1);
        expect(half).toBeGreaterThan(0);
        expect(half).toBeLessThan(1);
        expect(followPointer(0, 1, 5)).toBe(1);
    });

    it('el sol se pone al oeste (izquierda) y sale al este (derecha), más bajo hacia la Noche', () => {
        expect(sunAt(0.5, true).x).toBeLessThan(0.5);
        expect(sunAt(0.5, false).x).toBeGreaterThan(0.5);
        // Al atardecer baja a medida que avanza hacia la Noche; al amanecer sube al volver al Día.
        expect(sunAt(0.8, true).y).toBeGreaterThan(sunAt(0.2, true).y);
        expect(sunAt(0.2, false).y).toBeLessThan(sunAt(0.8, false).y);
    });

    it('con el puntero a un lado, lo lejano se mueve menos que lo cercano y en sentido contrario', () => {
        const f = at(0.5, {}, 1);
        expect(f.parallax.farRidge).toBeLessThan(0);
        expect(Math.abs(f.parallax.farRidge)).toBeLessThan(Math.abs(f.parallax.avila));
        expect(Math.abs(f.parallax.avila)).toBeLessThan(Math.abs(f.parallax.city));
        expect(Math.abs(f.parallax.city)).toBeLessThanOrEqual(PARALLAX_PX * 1.2);
        // Las cabinas cuelgan del Ávila: se mueven con él.
        expect(f.cabins[2].x - at(0.5).cabins[2].x).toBeCloseTo(f.parallax.avila);
        expect(at(0.5).parallax).toEqual({
            farRidge: 0,
            avila: 0,
            city: 0,
            towers: 0,
            sky: 0,
            street: 0,
        });
    });

    it('las nubes cercanas se cruzan a mitad del Viaje, no arriba ni en la ciudad', () => {
        const height = (progress: number) => at(progress).height;
        const peak = [0, 0.2, 0.4, 0.5, 0.6, 0.8, 1].reduce((best, p) =>
            at(p).frontClouds > at(best).frontClouds ? p : best,
        );
        expect(at(peak).frontClouds).toBeGreaterThan(0.5);
        expect(Math.abs(height(peak) - 0.6)).toBeLessThan(0.15);
        expect(at(1).frontClouds).toBeLessThan(0.01);
    });

    it('la niebla se pega a las laderas: baja con su capa', () => {
        const top = at(0);
        const bottom = at(1);
        expect(top.mist.avila - bottom.mist.avila).toBeCloseTo(
            top.shifts.avila - bottom.shifts.avila,
        );
        expect(top.mist.farRidge - bottom.mist.farRidge).toBeCloseTo(
            top.shifts.farRidge - bottom.shifts.farRidge,
        );
    });
});
