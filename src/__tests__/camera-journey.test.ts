import { describe, it, expect } from 'vitest';
import {
    cabinPoint,
    cameraHeightAt,
    cameraJourney,
    cloudsAt,
    heroSink,
    layerOffset,
    moonPosition,
    sceneFrame,
    toScreen,
} from '@app/scene/camera';
import { STATIONS } from '@app/scene/geometry';

// Home de 6 secciones apiladas, con una ventana de 900 px de alto.
const VIEWPORT_HEIGHT = 900;
const SECTIONS = [
    { id: 'hero', top: 0, height: 700 },
    { id: 'impact', top: 700, height: 500 },
    { id: 'experience', top: 1200, height: 1400 },
    { id: 'projects', top: 2600, height: 900 },
    { id: 'skills', top: 3500, height: 600 },
    { id: 'contact', top: 4100, height: 500 },
];
const DOCUMENT_HEIGHT = 4600;
const MAX_SCROLL = DOCUMENT_HEIGHT - VIEWPORT_HEIGHT;

// Scroll en el que el centro de una sección cruza el centro de la pantalla.
const centerOf = (top: number, height: number) => top + height / 2 - VIEWPORT_HEIGHT / 2;
const heightAtScroll = (scroll: number, sections = SECTIONS) =>
    cameraHeightAt(cameraJourney(sections, VIEWPORT_HEIGHT, DOCUMENT_HEIGHT), scroll / MAX_SCROLL);

describe('Viaje de cámara: altura por sección', () => {
    it('empieza en la ciudad con el Hero', () => {
        expect(heightAtScroll(0)).toBe(0);
    });

    it('sube sobre las nubes cuando Proyectos destacados cruza el centro de la pantalla', () => {
        expect(heightAtScroll(centerOf(2600, 900))).toBeCloseTo(1, 5);
    });

    it('usa la altura de cada sección en su centro', () => {
        expect(heightAtScroll(centerOf(700, 500))).toBeCloseTo(0.35, 5);
        expect(heightAtScroll(centerOf(1200, 1400))).toBeCloseTo(0.7, 5);
        expect(heightAtScroll(centerOf(3500, 600))).toBeCloseTo(0.6, 5);
    });

    it('vuelve a la ciudad al llegar a Contacto, al final de la página', () => {
        expect(heightAtScroll(MAX_SCROLL)).toBeCloseTo(0, 5);
    });

    it('entre dos secciones interpola con suavizado y no en línea recta', () => {
        const from = centerOf(1200, 1400);
        const to = centerOf(2600, 900);
        // Al 25% del tramo de 0,7 a 1, una interpolación lineal daría 0,775; con suavizado
        // (smoothstep) da 0,7 + 0,3 × 0,15625 = 0,746875.
        expect(heightAtScroll(from + (to - from) * 0.25)).toBeCloseTo(0.746875, 3);
        expect(heightAtScroll(from + (to - from) * 0.5)).toBeCloseTo(0.85, 3);
    });

    it('ignora las secciones sin altura configurada y sigue con las que existen', () => {
        const sections = [
            { id: 'hero', top: 0, height: 700 },
            { id: 'skills', top: 700, height: 900 },
            { id: 'about', top: 1600, height: 900 },
            { id: 'experience', top: 2500, height: 1200 },
            { id: 'projects', top: 3700, height: 500 },
            { id: 'contact', top: 4200, height: 400 },
        ];
        expect(heightAtScroll(centerOf(700, 900), sections)).toBeCloseTo(0.6, 5);
        expect(heightAtScroll(centerOf(3700, 500), sections)).toBeCloseTo(1, 5);
        expect(heightAtScroll(MAX_SCROLL, sections)).toBeCloseTo(0, 5);
    });

    it('se queda en la ciudad si la página no tiene scroll', () => {
        const journey = cameraJourney(SECTIONS.slice(0, 1), VIEWPORT_HEIGHT, 600);
        expect(cameraHeightAt(journey, 0)).toBe(0);
        expect(cameraHeightAt(journey, 1)).toBe(0);
    });

    it('da rangos de progreso estrictamente crecientes entre 0 y 1', () => {
        const { progress, height } = cameraJourney(SECTIONS, VIEWPORT_HEIGHT, DOCUMENT_HEIGHT);
        expect(progress.length).toBe(height.length);
        expect(progress[0]).toBeGreaterThanOrEqual(0);
        expect(progress[progress.length - 1]).toBeLessThanOrEqual(1);
        for (let i = 1; i < progress.length; i++) {
            expect(progress[i]).toBeGreaterThan(progress[i - 1]);
        }
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
