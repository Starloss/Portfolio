import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { BovedaCeleste } from '@app/scene/BovedaCeleste';
import { BOVEDA_SECONDS, bovedaKeyframes, DEFAULT_SKY_LAYOUT, restOf } from '@app/scene/vault';

const root = document.documentElement;
const viewport = { width: 1000, height: 800 };
// El instante forzado, como lo deja el script de index.html.
const NOON = Date.parse('2026-10-31T16:00:00Z');
const NIGHT_MOON = Date.parse('2026-11-24T04:00:00Z');
const NIGHT_NO_MOON = Date.parse('2026-12-09T00:00:00Z');

function setup(at: number, night: boolean, animate = true) {
    root.dataset.horaForzada = String(at);
    const ui = (n: boolean, on = animate) => (
        <BovedaCeleste
            night={n}
            layout={DEFAULT_SKY_LAYOUT}
            viewport={viewport}
            animate={on}
            twinkleGroups={3}
        />
    );
    let current = night;
    const { container, rerender } = render(ui(night));
    const part = (name: string) => container.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
    return {
        container,
        part,
        setNight: (n: boolean) => {
            current = n;
            rerender(ui(n));
        },
        setAnimate: (on: boolean) => rerender(ui(current, on)),
    };
}

afterEach(() => {
    delete root.dataset.horaForzada;
    vi.restoreAllMocks();
    vi.useRealTimers();
    delete (Element.prototype as { animate?: unknown }).animate;
});

describe('BovedaCeleste en reposo', () => {
    it('de Día se ve el sol, y no la luna ni las estrellas', () => {
        const { part } = setup(NOON, false);
        expect(part('sun').style.opacity).toBe('1');
        expect(part('moon').style.opacity).toBe('0');
        expect(part('stars').style.opacity).toBe('0');
    });

    it('de Noche se ven la luna y las estrellas, y no el sol', () => {
        const { part } = setup(NIGHT_MOON, true);
        expect(part('moon').style.opacity).toBe('1');
        expect(part('stars').style.opacity).toBe('1');
        expect(part('sun').style.opacity).toBe('0');
    });

    it('una Noche sin la luna arriba se queda solo con las estrellas', () => {
        const { part } = setup(NIGHT_NO_MOON, true);
        expect(part('moon').style.opacity).toBe('0');
        expect(part('stars').style.opacity).toBe('1');
    });

    it('las estrellas titilan solo de Noche y con movimiento', () => {
        const twinkling = (c: HTMLElement) => c.querySelectorAll('[data-anim="twinkle"]').length;
        expect(twinkling(setup(NIGHT_MOON, true).container)).toBe(3);
        expect(twinkling(setup(NOON, false).container)).toBe(0);
        expect(twinkling(setup(NIGHT_MOON, true, false).container)).toBe(0);
    });

    it('el sol y la luna avanzan solos con el paso de los minutos', () => {
        vi.useFakeTimers();
        vi.setSystemTime(NOON);
        const { part } = setup(0, false);
        const before = part('sun').style.transform;
        act(() => {
            vi.advanceTimersByTime(60 * 60_000);
        });
        expect(part('sun').style.transform).not.toBe(before);
    });
});

describe('BovedaCeleste al cambiar de tema', () => {
    function stubAnimate() {
        const animate = vi.fn(function animate() {
            return { cancel: vi.fn(), currentTime: 0, playState: 'running' };
        });
        (Element.prototype as unknown as { animate: unknown }).animate = animate;
        return animate;
    }

    it('al cargar no gira', () => {
        const animate = stubAnimate();
        setup(NOON, false);
        expect(animate).not.toHaveBeenCalled();
    });

    it('gira el sol, la luna, las estrellas y la franja, lo que dura la Bóveda celeste', () => {
        const animate = stubAnimate();
        const { setNight } = setup(NIGHT_MOON, false);
        setNight(true);
        expect(animate).toHaveBeenCalledTimes(4);
        for (const [, options] of animate.mock.calls as unknown as [
            unknown,
            KeyframeAnimationOptions,
        ][]) {
            expect(options.duration).toBe(BOVEDA_SECONDS * 1000);
        }
    });

    it('con reduced-motion no gira nada', () => {
        const animate = stubAnimate();
        const { setNight } = setup(NIGHT_MOON, false, false);
        setNight(true);
        expect(animate).not.toHaveBeenCalled();
    });

    it('si cambia en pleno giro, vuelve por el mismo camino, sin un giro nuevo', () => {
        const running = { cancel: vi.fn(), reverse: vi.fn(), playState: 'running' };
        const animate = vi.fn(() => running);
        (Element.prototype as unknown as { animate: unknown }).animate = animate;
        const { setNight } = setup(NIGHT_MOON, false);
        setNight(true);
        setNight(false);
        expect(animate).toHaveBeenCalledTimes(4);
        expect(running.reverse).toHaveBeenCalledTimes(4);
        expect(running.cancel).not.toHaveBeenCalled();
    });

    it('si pide menos movimiento en pleno giro, se corta', () => {
        const running = { cancel: vi.fn(), reverse: vi.fn(), playState: 'running' };
        (Element.prototype as unknown as { animate: unknown }).animate = vi.fn(() => running);
        const { setNight, setAnimate } = setup(NIGHT_MOON, false);
        setNight(true);
        setAnimate(false);
        expect(running.cancel).toHaveBeenCalledTimes(4);
    });
});

describe('bovedaKeyframes', () => {
    const sky = {
        sun: { alt: 40, hour: 30, halfArc: 90 },
        moon: { alt: -20, hour: -100, halfArc: 90, fraction: 0.5, tilt: 0 },
    };

    it('la franja solo se ve durante el giro, y da media vuelta', () => {
        const { sweep } = bovedaKeyframes(
            true,
            restOf(sky, true),
            restOf(sky, false),
            DEFAULT_SKY_LAYOUT,
            viewport,
        );
        expect(sweep[0].opacity).toBeCloseTo(0);
        expect(sweep[sweep.length - 1].opacity).toBeCloseTo(0);
        expect(sweep[12].opacity).toBe(1);
        expect(sweep[sweep.length - 1].transform).toContain(`rotate(${(-Math.PI).toFixed(3)}rad)`);
    });

    it('el sol arranca donde estaba en reposo', () => {
        const { sun } = bovedaKeyframes(
            true,
            restOf(sky, true),
            restOf(sky, false),
            DEFAULT_SKY_LAYOUT,
            viewport,
        );
        // Avance 2/3: x = 0,36 y, con la subida rápida del arco, y = 0,173; menos el radio del astro.
        expect(sun[0].transform).toBe('translate(334.0px, 112.7px)');
    });
});
