import { describe, it, expect } from 'vitest';
import {
    cabinPoint,
    CAMERA_JOURNEY,
    cameraHeightAt,
    cloudsAt,
    HERO_HEIGHT,
    heroSink,
    layerOffset,
    layerShift,
    moonPosition,
    mountainSink,
    sceneFrame,
    toScreen,
} from '@app/scene/camera';
import { LIFT_SHARE, streetBand } from '@app/scene/street';
import { STATIONS } from '@app/scene/geometry';

describe('Viaje de cámara: baja del Hero a la ciudad', () => {
    it('empieza arriba en el Hero, con las cumbres del Ávila y cielo libre', () => {
        expect(HERO_HEIGHT).toBe(0.8);
        expect(cameraHeightAt(0)).toBe(0.8);
    });

    it('termina en la ciudad al final de la página, en Contacto', () => {
        expect(cameraHeightAt(1)).toBe(0);
    });

    it('baja en un solo sentido: nunca vuelve a subir', () => {
        let previous = cameraHeightAt(0);
        for (let i = 1; i <= 100; i++) {
            const height = cameraHeightAt(i / 100);
            expect(height).toBeLessThanOrEqual(previous);
            previous = height;
        }
    });

    it('baja con suavizado: lento al empezar y al terminar', () => {
        // Al 25% del scroll, una bajada lineal daría 0,6; con suavizado (smoothstep) baja
        // 0,8 × 0,15625 = 0,125 y queda en 0,675. A la mitad, justo a medio camino.
        expect(cameraHeightAt(0.25)).toBeCloseTo(0.675, 5);
        expect(cameraHeightAt(0.5)).toBeCloseTo(0.4, 5);
        expect(cameraHeightAt(0.75)).toBeCloseTo(0.125, 5);
    });

    it('fuera del rango de scroll se queda en los extremos', () => {
        expect(cameraHeightAt(-0.2)).toBe(0.8);
        expect(cameraHeightAt(1.3)).toBe(0);
    });

    it('da keyframes con progreso estrictamente creciente de 0 a 1', () => {
        const { progress, height } = CAMERA_JOURNEY;
        expect(progress.length).toBe(height.length);
        expect(progress[0]).toBe(0);
        expect(progress[progress.length - 1]).toBe(1);
        for (let i = 1; i < progress.length; i++) {
            expect(progress[i]).toBeGreaterThan(progress[i - 1]);
        }
        expect(height[0]).toBe(0.8);
        expect(height[height.length - 1]).toBe(0);
    });
});

describe('Viaje de cámara: desplazamiento de las capas', () => {
    it('cada capa se hunde según su profundidad × la altura × el alto de la ventana', () => {
        // Profundidades: cresta lejana 0,35, Ávila 0,55, ciudad 0,8 y Torres 0,9.
        expect(layerOffset('farRidge', 1, 900)).toBeCloseTo(315, 5);
        expect(layerOffset('avila', 1, 900)).toBeCloseTo(495, 5);
        expect(layerOffset('city', 0.5, 900)).toBeCloseTo(360, 5);
        expect(layerOffset('towers', 0.5, 800)).toBeCloseTo(360, 5);
    });

    it('en la ciudad ninguna capa se mueve', () => {
        for (const layer of ['farRidge', 'avila', 'city', 'towers'] as const) {
            expect(layerOffset(layer, 0, 900)).toBe(0);
        }
    });

    it('el hundimiento del Hero baja las crestas y el Ávila, pero no la ciudad ni las Torres', () => {
        // Con la cámara en la ciudad (Contacto), la ciudad sigue apoyada abajo: solo sube con la
        // Avenida Bolívar, igual que la montaña, que además lleva el hundimiento del Hero.
        const lift = streetBand(0, 900).lift;
        expect(layerShift('farRidge', 0, 900, 150)).toBeCloseTo(150 - lift * LIFT_SHARE.farRidge);
        expect(layerShift('avila', 0, 900, 150)).toBeCloseTo(150 - lift * LIFT_SHARE.avila);
        expect(layerShift('city', 0, 900, 150)).toBeCloseTo(-lift);
        expect(layerShift('towers', 0, 900, 150)).toBeCloseTo(-lift);
        // Al subir, cada capa suma lo que se hunde por su profundidad.
        expect(layerShift('avila', 1, 900, 150)).toBeCloseTo(645, 5);
        expect(layerShift('city', 1, 900, 150)).toBeCloseTo(720, 5);
    });

    it('las nubes bajan de −70vh a +10vh y aparecen al subir', () => {
        expect(cloudsAt(0, 1000)).toEqual({ y: -700, opacity: 0 });
        expect(cloudsAt(0.5, 1000)).toEqual({ y: -300, opacity: 0.8 });
        expect(cloudsAt(1, 1000)).toEqual({ y: 100, opacity: 1 });
    });
});

describe('Encuadre de la Escena en pantalla', () => {
    it('en escritorio ancho muestra todo el ancho del paisaje, apoyado abajo', () => {
        // 1440 × 900: escala 1 y se ven 1440 de los 1600 de ancho, desde x = 0.
        const frame = sceneFrame({ width: 1440, height: 900 });
        expect(frame.scale).toBe(1);
        expect(toScreen(frame, 0, 900)).toEqual({ x: 0, y: 900 });
        expect(toScreen(frame, 1000, 300)).toEqual({ x: 1000, y: 300 });
    });

    it('en un teléfono vertical encuadra las Torres y el Humboldt, a la izquierda del centro', () => {
        // 390 × 844: escala 844/900 y se ven 415,9 de ancho centrados en x = 560.
        const frame = sceneFrame({ width: 390, height: 844 });
        expect(frame.scale).toBeCloseTo(0.93778, 4);
        expect(toScreen(frame, 560, 900).x).toBeCloseTo(195, 3);
        expect(toScreen(frame, 560, 900).y).toBeCloseTo(844, 3);
    });

    it('en una pantalla baja recorta el cielo y no los lados', () => {
        // 1366 × 700: escala 1366/1600 y el paisaje sobresale 68,4 px por arriba.
        const frame = sceneFrame({ width: 1366, height: 700 });
        expect(toScreen(frame, 0, 0).x).toBeCloseTo(0, 5);
        expect(toScreen(frame, 0, 0).y).toBeCloseTo(-68.375, 3);
    });
});

describe('Hundimiento del paisaje según el alto del Hero', () => {
    // Paisaje plano a y = 300, con un pico a y = 100 a la derecha (x ≥ 1200).
    const skyline = Array.from({ length: 161 }, (_, i) => (i * 10 >= 1200 ? 100 : 300));

    it('hunde el paisaje para que empiece 16 px por debajo de la línea de ubicación', () => {
        const viewport = { width: 1440, height: 900 };
        const column = { left: 400, right: 1000, top: 120, bottom: 330 };
        expect(heroSink(viewport, column, skyline)).toBeCloseTo(46, 5);
    });

    it('no lo hunde si ya queda por debajo', () => {
        const viewport = { width: 1440, height: 900 };
        const column = { left: 400, right: 1000, top: 80, bottom: 200 };
        expect(heroSink(viewport, column, skyline)).toBe(0);
    });

    it('solo mira el paisaje detrás de la columna de texto', () => {
        const viewport = { width: 1440, height: 900 };
        const wide = { left: 400, right: 1300, top: 120, bottom: 330 };
        expect(heroSink(viewport, wide, skyline)).toBeCloseTo(246, 5);
    });

    it('la montaña solo se hunde lo que no alcanzó a bajar la cámara en el Hero', () => {
        // En el Hero la cresta lejana ya bajó 0,35 × 0,8 × 900 = 252 px.
        const viewport = { width: 1440, height: 900 };
        const column = { left: 400, right: 1000, top: 120, bottom: 330 };
        expect(mountainSink(viewport, column, skyline)).toBe(0);
        const low = { left: 400, right: 1000, top: 120, bottom: 600 };
        // Haría falta 600 + 16 − 300 = 316 px: faltan 64.
        expect(mountainSink(viewport, low, skyline)).toBeCloseTo(64, 5);
    });

    it('en una pantalla baja lo hunde más', () => {
        // 1366 × 700: la línea y = 300 queda en −68,375 + 300 × 0,85375 = 187,75 px.
        const viewport = { width: 1366, height: 700 };
        const column = { left: 400, right: 966, top: 100, bottom: 330 };
        expect(heroSink(viewport, column, skyline)).toBeCloseTo(158.25, 3);
    });
});

describe('Luna fuera de la columna de texto del Hero', () => {
    it('va a la derecha de la columna cuando hay lugar', () => {
        const viewport = { width: 1440, height: 900 };
        const column = { left: 432, right: 1008, top: 120, bottom: 330 };
        expect(moonPosition(viewport, column, 64)).toEqual({ x: 1224, y: 146 });
    });

    it('va entre la cabecera y el texto si no hay lugar a los lados', () => {
        const viewport = { width: 600, height: 900 };
        const column = { left: 40, right: 560, top: 260, bottom: 520 };
        expect(moonPosition(viewport, column, 64)).toEqual({ x: 550, y: 162 });
    });

    it('no se dibuja si no cabe sin tapar el texto', () => {
        const viewport = { width: 390, height: 844 };
        const column = { left: 20, right: 370, top: 104, bottom: 420 };
        expect(moonPosition(viewport, column, 64)).toBeNull();
    });
});

describe('Cabina del Teleférico atada a la altura de la cámara', () => {
    it('sale de la estación de abajo y llega a Waraira Repano, colgada del cable', () => {
        const start = cabinPoint(0);
        const end = cabinPoint(1);
        expect(start.x).toBeCloseTo(STATIONS.lower.x, 5);
        expect(end.x).toBeCloseTo(STATIONS.upper.x, 5);
        expect(end.y).toBeLessThan(start.y);
    });

    it('a mitad de camino va por debajo de la línea recta entre estaciones, por la comba', () => {
        const start = cabinPoint(0);
        const end = cabinPoint(1);
        expect(cabinPoint(0.5).y).toBeGreaterThan((start.y + end.y) / 2);
    });
});
