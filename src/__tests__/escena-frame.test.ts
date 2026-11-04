import { describe, it, expect } from 'vitest';
import {
    CABIN_HEIGHT,
    CABIN_WIDTH,
    cabinPoint,
    cameraHeightAt,
    journeyAt,
    cloudsAt,
    layerShift,
    sceneFrame,
    SKY_DARKENING,
    toScreen,
} from '@app/scene/camera';
import { circuitAt } from '@app/scene/circuit';
import { cableLinePoint } from '@app/scene/geometry';
import { circuitOnScreen, escenaFrame, followPointer, PARALLAX_PX } from '@app/scene/gl/frame';

// Lo que la Escena WebGL dibuja en cada cuadro sale del mismo Viaje de cámara que la SVG: así el
// fundido cruzado entre las dos no salta.

const viewport = { width: 1440, height: 900 };
const frame = sceneFrame(viewport);
const at = (progress: number, pointer = 0) =>
    escenaFrame({
        progress,
        sink: 30,
        viewport,
        frame,
        pointer,
    });

describe('escenaFrame', () => {
    it('las capas se hunden igual que en la Escena SVG: interpoladas entre las mismas muestras', () => {
        for (const progress of [0, 0.3, 0.7, 1]) {
            const f = at(progress);
            const svg = (valueAt: (h: number) => number) => journeyAt(progress, valueAt);
            expect(f.height).toBeCloseTo(svg((h) => h));
            for (const layer of ['farRidge', 'avila', 'city', 'towers'] as const) {
                expect(f.shifts[layer]).toBeCloseTo(svg((h) => layerShift(layer, h, 900, 30)));
            }
            expect(f.cloudsOpacity).toBeCloseTo(svg((h) => cloudsAt(h, 900).opacity));
            expect(f.skyHigh).toBeCloseTo(svg((h) => h * SKY_DARKENING));
        }
        // En las muestras coincide con la curva exacta.
        expect(at(1).shifts.city).toBeCloseTo(layerShift('city', cameraHeightAt(1), 900, 30));
    });

    it('la cabina del visitante cuelga del cable donde la pone la SVG, y baja con el Ávila', () => {
        const progress = 0.4;
        const f = at(progress);
        const svg = (valueAt: (h: number) => number) => journeyAt(progress, valueAt);
        const point = (h: number) => toScreen(frame, cabinPoint(h).x, cabinPoint(h).y);
        expect(f.visitor.x).toBeCloseTo(svg((h) => point(h).x) - (CABIN_WIDTH / 2) * frame.scale);
        expect(f.visitor.y).toBeCloseTo(svg((h) => point(h).y + layerShift('avila', h, 900, 30)));
        expect(f.visitor.width).toBeCloseTo(CABIN_WIDTH * frame.scale);
        expect(f.visitor.height).toBeCloseTo(CABIN_HEIGHT * frame.scale);
    });

    it('las cabinas del circuito cuelgan de su cable y se mueven con el Ávila', () => {
        const f = at(0.5, 1);
        const onScreen = circuitOnScreen(12, frame, f);
        circuitAt(12).forEach((cabin, i) => {
            const p = cableLinePoint(cabin.t, cabin.line);
            const s = toScreen(frame, p.x, p.y);
            expect(onScreen[i].x).toBeCloseTo(s.x + f.parallax.avila);
            expect(onScreen[i].y).toBeCloseTo(s.y + f.shifts.avila);
            expect(onScreen[i].sway).toBe(cabin.sway);
            expect(onScreen[i].alpha).toBe(cabin.alpha);
        });
        // La de bajada va más atrás: un poco más chica.
        const down = onScreen.find((c) => c.line === 1)!;
        const up = onScreen.find((c) => c.line === 0)!;
        expect(down.scale).toBeLessThan(up.scale);
        expect(up.scale).toBeCloseTo(frame.scale);
    });

    it('las nubes lejanas bajan con la cámara, como la capa de nubes de la SVG', () => {
        for (const progress of [0, 0.5, 1]) {
            const f = at(progress);
            expect(f.cloudsShift).toBeCloseTo(cloudsAt(f.height, 900).y);
        }
    });
});

describe('efectos', () => {
    it('el puntero se sigue con suavidad, sin pasarse del objetivo', () => {
        const half = followPointer(0, 1, 0.1);
        expect(half).toBeGreaterThan(0);
        expect(half).toBeLessThan(1);
        expect(followPointer(0, 1, 5)).toBe(1);
    });

    it('con el puntero a un lado, lo lejano se mueve menos que lo cercano y en sentido contrario', () => {
        const f = at(0.5, 1);
        expect(f.parallax.farRidge).toBeLessThan(0);
        expect(Math.abs(f.parallax.farRidge)).toBeLessThan(Math.abs(f.parallax.avila));
        expect(Math.abs(f.parallax.avila)).toBeLessThan(Math.abs(f.parallax.city));
        expect(Math.abs(f.parallax.city)).toBeLessThanOrEqual(PARALLAX_PX * 1.2);
        // Las cabinas cuelgan del Ávila: se mueven con él.
        expect(f.visitor.x - at(0.5).visitor.x).toBeCloseTo(f.parallax.avila);
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
