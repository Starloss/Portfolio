import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { SceneGL, type FallbackReason } from '@app/scene/gl/SceneGL';
import { ThemeProvider } from '@lib/theme';

// La Escena WebGL como componente: fundido de entrada y vuelta a la SVG. El cliente del Worker que
// dibuja necesita una GPU, así que aquí es un doble; el de verdad lo prueba Playwright.

const engines = vi.hoisted(() => ({
    last: null as null | Record<string, unknown>,
    options: null as null | { dpr: number; watch: boolean },
    failOnCreate: false,
}));

vi.mock('@app/scene/gl/client', () => ({
    EscenaClient: class {
        onFirstFrame?: () => void;
        onFailed?: (reason: FallbackReason) => void;
        setNight = vi.fn(() => Promise.resolve());
        setLayout = vi.fn();
        setSky = vi.fn();
        start = vi.fn();
        stop = vi.fn();
        destroy = vi.fn();
        constructor(_canvas: HTMLCanvasElement, options: { dpr: number; watch: boolean }) {
            if (engines.failOnCreate) throw new Error('Sin OffscreenCanvas');
            engines.last = this as unknown as Record<string, unknown>;
            engines.options = options;
        }
    },
}));

type Fake = {
    onFirstFrame: () => void;
    onFailed: (reason: FallbackReason) => void;
    setNight: ReturnType<typeof vi.fn>;
    setLayout: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
};
const engine = () => engines.last as unknown as Fake;

const mount = (watch = true) => {
    const onFallback = vi.fn<(reason: FallbackReason) => void>();
    const view = render(
        <ThemeProvider>
            <SceneGL watch={watch} onFallback={onFallback} />
        </ThemeProvider>,
    );
    return { onFallback, view, canvas: () => view.container.querySelector('canvas')! };
};

const setHidden = (hidden: boolean) => {
    Object.defineProperty(document, 'visibilityState', {
        value: hidden ? 'hidden' : 'visible',
        configurable: true,
    });
    act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
    });
};

beforeEach(() => {
    vi.useFakeTimers();
    engines.failOnCreate = false;
});

afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
    delete document.documentElement.dataset.escena;
});

describe('SceneGL', () => {
    it('entra con un fundido y, ya a la vista, la SVG deja de pintarse', () => {
        const { canvas, view } = mount();
        expect(canvas().style.opacity).toBe('0');
        act(() => engine().onFirstFrame());
        expect(canvas().style.opacity).toBe('1');
        expect(document.documentElement.dataset.escena).toBeUndefined();
        act(() => vi.advanceTimersByTime(600));
        expect(document.documentElement.dataset.escena).toBe('webgl');
        view.unmount();
        expect(document.documentElement.dataset.escena).toBeUndefined();
        expect(engine().destroy).toHaveBeenCalled();
    });

    it('fija el tema antes que el tamaño: rasteriza primero el tema que se ve', () => {
        mount();
        const e = engine();
        expect(e.setNight.mock.invocationCallOrder[0]).toBeLessThan(
            e.setLayout.mock.invocationCallOrder[0],
        );
    });

    it('si se pierde el contexto, vuelve a la SVG enseguida, sin fundido', () => {
        const { onFallback } = mount();
        act(() => engine().onFirstFrame());
        act(() => vi.advanceTimersByTime(600));
        act(() => engine().onFailed('context-lost'));
        expect(document.documentElement.dataset.escena).toBeUndefined();
        act(() => vi.advanceTimersByTime(0));
        expect(onFallback).toHaveBeenCalledWith('context-lost');
    });

    it('si el canvas no se puede pasar al Worker, vuelve a la SVG sin que nada llegue a verse', () => {
        engines.failOnCreate = true;
        engines.last = null;
        const { onFallback } = mount();
        expect(onFallback).toHaveBeenCalledWith('init-failed');
    });

    it('si el vigilante (en el Worker) la ve lenta, se funde de vuelta a la SVG', () => {
        const { onFallback, canvas } = mount();
        act(() => engine().onFirstFrame());
        act(() => engine().onFailed('slow'));
        expect(canvas().style.opacity).toBe('0');
        expect(onFallback).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(600));
        expect(onFallback).toHaveBeenCalledWith('slow');
    });

    it('con ?escena=webgl le pide al Worker que no vigile', () => {
        mount(false);
        expect(engines.options?.watch).toBe(false);
    });

    it('con la pestaña oculta se detiene, y al volver arranca de nuevo', () => {
        mount();
        const e = engine();
        expect(e.start).toHaveBeenCalledTimes(1);
        setHidden(true);
        expect(e.stop).toHaveBeenCalled();
        setHidden(false);
        expect(e.start).toHaveBeenCalledTimes(2);
    });
});
