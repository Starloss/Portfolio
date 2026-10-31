import { describe, expect, it } from 'vitest';
import {
    arcFraction,
    arcPoint,
    BovedaClock,
    bovedaAt,
    DEFAULT_SKY_LAYOUT,
    moonPath,
    restOf,
    skyLayout,
    starField,
    type SkyState,
} from '@app/scene/vault';

const NOON: SkyState = {
    sun: { alt: 80, hour: 0 },
    moon: { alt: -40, hour: 180, fraction: 0.5, tilt: 10 },
};
const AFTERNOON_MOON: SkyState = {
    sun: { alt: 30, hour: 60 },
    moon: { alt: 50, hour: -40, fraction: 0.3, tilt: 10 },
};
const NIGHT_WITH_MOON: SkyState = {
    sun: { alt: -40, hour: 130 },
    moon: { alt: 40, hour: 45, fraction: 0.9, tilt: 200 },
};
const NIGHT_NO_MOON: SkyState = {
    sun: { alt: -40, hour: 130 },
    moon: { alt: -30, hour: -120, fraction: 0.1, tilt: 0 },
};

describe('arco del sol y la luna', () => {
    it('el ángulo horario da el avance: 0 al este, 0,5 en el meridiano, 1 al oeste', () => {
        expect(arcFraction(-90)).toBe(0);
        expect(arcFraction(0)).toBe(0.5);
        expect(arcFraction(90)).toBe(1);
    });

    it('sale por la derecha y se pone por la izquierda', () => {
        const rise = arcPoint(0, DEFAULT_SKY_LAYOUT);
        const set = arcPoint(1, DEFAULT_SKY_LAYOUT);
        expect(rise.x).toBeGreaterThan(0.9);
        expect(set.x).toBeLessThan(0.1);
        expect(arcPoint(0.5, DEFAULT_SKY_LAYOUT).x).toBeCloseTo(0.5);
    });

    it('sube rápido hasta arriba del todo, y fuera del arco queda bajo el horizonte', () => {
        const { top } = DEFAULT_SKY_LAYOUT;
        expect(arcPoint(0.5, DEFAULT_SKY_LAYOUT).y).toBeCloseTo(top);
        expect(arcPoint(0.2, DEFAULT_SKY_LAYOUT).y).toBeLessThan(0.4);
        expect(arcPoint(1.2, DEFAULT_SKY_LAYOUT).y).toBeGreaterThan(
            arcPoint(1, DEFAULT_SKY_LAYOUT).y,
        );
    });

    it('sobre la columna de texto pasa por encima, y a los lados puede bajar', () => {
        const layout = { top: 0.14, size: 52, column: { left: 0.25, right: 0.75 }, margin: 0.06 };
        expect(arcPoint(0.3, layout).y).toBeCloseTo(0.14);
        expect(arcPoint(0.03, layout).y).toBeGreaterThan(0.3);
    });
});

describe('skyLayout', () => {
    const viewport = { width: 1000, height: 800 };

    it('pone el arco entre la cabecera y el texto, con un astro que cabe en ese hueco', () => {
        const page = { column: { left: 250, right: 750, top: 140, bottom: 300 }, headerBottom: 60 };
        expect(skyLayout(viewport, page)).toEqual({
            top: 0.125,
            size: 52,
            column: { left: 0.25, right: 0.75 },
            margin: 0.078,
        });
    });

    it('con poco hueco, el astro se achica', () => {
        const page = { column: { left: 16, right: 374, top: 110, bottom: 300 }, headerBottom: 60 };
        const layout = skyLayout({ width: 390, height: 844 }, page);
        expect(layout.size).toBe(42);
        expect(layout.top).toBeCloseTo(85 / 844);
    });

    it('nunca lo achica de más, aunque casi no haya hueco', () => {
        const page = { column: { left: 16, right: 374, top: 70, bottom: 300 }, headerBottom: 60 };
        expect(skyLayout({ width: 390, height: 844 }, page).size).toBe(28);
    });

    it('sin columna, como en un Caso de estudio, usa el arco de siempre', () => {
        expect(skyLayout(viewport, null)).toEqual(DEFAULT_SKY_LAYOUT);
    });
});

describe('dónde descansan el sol y la luna', () => {
    it('de Día con sol, el sol va en su posición real', () => {
        const rest = restOf(AFTERNOON_MOON, false);
        expect(rest.sun).toEqual({ f: arcFraction(60), visible: true });
        expect(rest.moon.visible).toBe(false);
    });

    it('de Día con el sol puesto, el sol va a la posición fija', () => {
        expect(restOf(NIGHT_WITH_MOON, false).sun).toEqual({ f: 0.3, visible: true });
    });

    it('de Noche con la luna arriba, la luna va en su posición real', () => {
        const rest = restOf(NIGHT_WITH_MOON, true);
        expect(rest.moon).toMatchObject({ f: arcFraction(45), visible: true });
        expect(rest.sun.visible).toBe(false);
    });

    it('de Noche sin la luna arriba, la Noche se queda sin luna', () => {
        expect(restOf(NIGHT_NO_MOON, true).moon.visible).toBe(false);
    });

    it('de Noche con el sol arriba, la luna va a la posición fija, con su fase real', () => {
        expect(restOf(NOON, true).moon).toEqual({ f: 0.3, visible: true, fraction: 0.5, tilt: 10 });
    });
});

describe('Bóveda celeste', () => {
    const rest = { toDay: restOf(NOON, false), toNight: restOf(NIGHT_WITH_MOON, true) };

    it('hacia la Noche, el sol se pone al oeste y la luna sale por el este', () => {
        const start = bovedaAt(true, 0, rest.toNight, rest.toDay);
        const end = bovedaAt(true, 1, rest.toNight, rest.toDay);
        expect(start.sun.f).toBeCloseTo(rest.toDay.sun.f);
        expect(start.moon.f).toBeLessThan(0);
        expect(end.sun.f).toBeGreaterThan(1);
        expect(end.moon.f).toBeCloseTo(rest.toNight.moon.f);
    });

    it('hacia el Día gira en el mismo sentido: la luna sigue al oeste, el sol sale por el este', () => {
        const start = bovedaAt(false, 0, rest.toDay, rest.toNight);
        const end = bovedaAt(false, 1, rest.toDay, rest.toNight);
        expect(start.moon.f).toBeCloseTo(rest.toNight.moon.f);
        expect(end.moon.f).toBeGreaterThan(1);
        expect(start.sun.f).toBeLessThan(0);
        expect(end.sun.f).toBeCloseTo(rest.toDay.sun.f);
    });

    it('la franja da media vuelta en cada cambio, sin volver atrás', () => {
        expect(bovedaAt(true, 0, rest.toNight, rest.toDay).sweep).toBeCloseTo(0);
        expect(bovedaAt(true, 1, rest.toNight, rest.toDay).sweep).toBeCloseTo(Math.PI);
        expect(bovedaAt(false, 0, rest.toDay, rest.toNight).sweep).toBeCloseTo(Math.PI);
        expect(bovedaAt(false, 1, rest.toDay, rest.toNight).sweep).toBeCloseTo(2 * Math.PI);
    });

    it('el atardecer es máximo a la mitad y nada en los extremos', () => {
        expect(bovedaAt(true, 0, rest.toNight, rest.toDay).dusk).toBe(0);
        expect(bovedaAt(true, 1, rest.toNight, rest.toDay).dusk).toBe(0);
        expect(bovedaAt(true, 0.5, rest.toNight, rest.toDay).dusk).toBe(1);
    });

    it('las estrellas giran hacia el oeste y llegan quietas a su lugar', () => {
        const start = bovedaAt(true, 0, rest.toNight, rest.toDay).stars;
        const end = bovedaAt(true, 1, rest.toNight, rest.toDay).stars;
        expect(start.angle).toBeGreaterThan(0);
        expect(end).toEqual({ angle: 0, alpha: 1 });
        expect(bovedaAt(false, 1, rest.toDay, rest.toNight).stars.alpha).toBe(0);
    });
});

describe('BovedaClock', () => {
    const day = restOf(NOON, false);
    const night = restOf(NIGHT_WITH_MOON, true);
    const seconds = 3.6;

    it('en reposo no gira, y el astro que no corresponde no se ve', () => {
        const clock = new BovedaClock(seconds);
        clock.set(true);
        const frame = clock.tick(0, night, day);
        expect(frame).toMatchObject({ night: 1, sweep: -1, dusk: 0 });
        expect(frame.moon.alpha).toBe(1);
        expect(frame.sun.alpha).toBe(0);
    });

    it('al cambiar, tarda lo que dura el giro', () => {
        const clock = new BovedaClock(seconds);
        clock.set(false);
        clock.tick(0, day, night);
        clock.change(true, 1000);
        const middle = clock.tick(1000 + 1800, night, day);
        expect(middle.night).toBeCloseTo(0.5);
        expect(middle.sweep).toBeGreaterThan(0);
        const end = clock.tick(1000 + 3600, night, day);
        expect(end.night).toBe(1);
        expect(end.sweep).toBe(-1);
    });

    it('si cambia en pleno giro, sigue desde el punto equivalente', () => {
        const clock = new BovedaClock(seconds);
        clock.set(false);
        clock.tick(0, day, night);
        clock.change(true, 0);
        const going = clock.tick(900, night, day);
        clock.change(false, 900);
        const back = clock.tick(900, day, night);
        expect(back.night).toBeCloseTo(going.night);
    });

    it('en reposo, el astro se desliza hacia su nuevo lugar, sin saltar', () => {
        const clock = new BovedaClock(seconds);
        clock.set(false);
        clock.tick(0, { ...day, sun: { f: 0.9, visible: true } }, night);
        const next = clock.tick(100, { ...day, sun: { f: 0.3, visible: true } }, night);
        expect(next.sun.f).toBeLessThan(0.9);
        expect(next.sun.f).toBeGreaterThan(0.3);
    });
});

describe('dibujo', () => {
    it('la fase: nueva no ilumina nada, y llena ilumina todo el disco', () => {
        expect(moonPath(0)).toBe('M0-1A1 1 0 0 1 0 1A1 1 0 0 0 0-1Z');
        expect(moonPath(1)).toBe('M0-1A1 1 0 0 1 0 1A1 1 0 0 1 0-1Z');
    });

    it('el cuarto es media luna, con el borde recto', () => {
        expect(moonPath(0.5)).toBe('M0-1A1 1 0 0 1 0 1A0 1 0 0 1 0-1Z');
    });

    it('las estrellas salen siempre iguales, repartidas en grupos', () => {
        const viewport = { width: 390, height: 844 };
        const field = starField(viewport, 3);
        expect(field).toHaveLength(3);
        expect(field).toEqual(starField(viewport, 3));
        const count = field.join('').match(/M/g)?.length;
        expect(count).toBe(120);
    });

    it('con el giro de las estrellas, siempre hay estrellas en la pantalla de un teléfono', () => {
        const viewport = { width: 390, height: 844 };
        const px = viewport.width / 2;
        const py = viewport.height * 1.15;
        const stars = starField(viewport, 1)[0]
            .split('M')
            .filter(Boolean)
            .map((s) => s.split(/[ h]/).slice(0, 2).map(Number));
        const visible = stars.filter(
            ([x, y]) =>
                x + px >= 0 && x + px <= viewport.width && y + py >= 0 && y + py <= viewport.height,
        );
        expect(visible.length).toBeGreaterThanOrEqual(20);
    });
});
