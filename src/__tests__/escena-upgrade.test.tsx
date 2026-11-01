import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { EscenaChoice } from '@app/scene/gl/detect';
import type { FallbackReason } from '@app/scene/gl/SceneGL';

// El interruptor de la carga inicial: con la página cargada y el navegador ocioso, decide con la
// detección previa y solo entonces trae la Escena WebGL (ADR 0003).

const detect = vi.hoisted(() => ({
    choice: { version: 'svg', reason: 'save-data' } as EscenaChoice,
    fail: false,
    remember: vi.fn(),
}));

vi.mock('@app/scene/gl/detect', () => ({
    readSignals: () => ({}),
    chooseEscena: () => {
        if (detect.fail) throw new Error('chunk');
        return detect.choice;
    },
    rememberFallback: detect.remember,
}));

// En jsdom no hay WebGL: la Escena WebGL se reemplaza por un doble que puede caer.
vi.mock('@app/scene/gl/SceneGL', () => ({
    SceneGL: ({
        watch,
        onFallback,
    }: {
        watch: boolean;
        onFallback: (reason: FallbackReason) => void;
    }) => (
        <button
            data-testid="escena-gl"
            data-watch={String(watch)}
            onClick={() => onFallback('slow')}
        >
            WebGL
        </button>
    ),
}));

const track = vi.fn();

// La decisión es una por visita: cada test empieza con el módulo recién cargado.
let EscenaUpgrade: React.FC;
beforeEach(async () => {
    window.umami = { track };
    detect.fail = false;
    vi.resetModules();
    ({ EscenaUpgrade } = await import('@app/scene/EscenaUpgrade'));
});

afterEach(() => {
    delete window.umami;
    delete document.documentElement.dataset.escenaElegida;
    delete document.documentElement.dataset.escenaRazon;
    vi.restoreAllMocks();
    track.mockReset();
    detect.remember.mockReset();
});

describe('EscenaUpgrade', () => {
    it('si la detección elige la SVG, no carga la WebGL y lo registra', async () => {
        detect.choice = { version: 'svg', reason: 'save-data' };
        render(<EscenaUpgrade />);
        await waitFor(() =>
            expect(track).toHaveBeenCalledWith('escena', { version: 'svg', reason: 'save-data' }),
        );
        expect(screen.queryByTestId('escena-gl')).not.toBeInTheDocument();
        expect(document.documentElement.dataset.escenaElegida).toBe('svg');
        expect(document.documentElement.dataset.escenaRazon).toBe('save-data');
    });

    it('si elige la WebGL, la monta con el vigilante encendido', async () => {
        detect.choice = { version: 'webgl', reason: 'capable' };
        render(<EscenaUpgrade />);
        const gl = await screen.findByTestId('escena-gl');
        expect(gl).toHaveAttribute('data-watch', 'true');
        expect(document.documentElement.dataset.escenaElegida).toBe('webgl');
        expect(track).toHaveBeenCalledWith('escena', { version: 'webgl', reason: 'capable' });
    });

    it('si en plena visita se pide menos movimiento, la WebGL se va sin registrar una caída', async () => {
        detect.choice = { version: 'webgl', reason: 'capable' };
        let reduced = false;
        const listeners = new Set<() => void>();
        vi.spyOn(window, 'matchMedia').mockImplementation(
            (query: string) =>
                ({
                    get matches() {
                        return query.includes('reduce') && reduced;
                    },
                    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
                    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
                }) as unknown as MediaQueryList,
        );
        render(<EscenaUpgrade />);
        await screen.findByTestId('escena-gl');
        reduced = true;
        act(() => listeners.forEach((fn) => fn()));
        expect(screen.queryByTestId('escena-gl')).not.toBeInTheDocument();
        expect(track).not.toHaveBeenCalledWith('escena-caida', expect.anything());
        expect(detect.remember).not.toHaveBeenCalled();
    });

    it('con ?escena=webgl la monta sin vigilante', async () => {
        detect.choice = { version: 'webgl', reason: 'forced' };
        render(<EscenaUpgrade />);
        expect(await screen.findByTestId('escena-gl')).toHaveAttribute('data-watch', 'false');
    });

    it('al caer vuelve a la SVG, registra la caída y la recuerda', async () => {
        detect.choice = { version: 'webgl', reason: 'capable' };
        render(<EscenaUpgrade />);
        const gl = await screen.findByTestId('escena-gl');
        act(() => gl.click());
        expect(screen.queryByTestId('escena-gl')).not.toBeInTheDocument();
        expect(track).toHaveBeenCalledWith('escena-caida', { reason: 'slow' });
        expect(detect.remember).toHaveBeenCalled();
    });

    it('una caída con ?escena=webgl no se recuerda, pero se avisa en la consola', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        detect.choice = { version: 'webgl', reason: 'forced' };
        render(<EscenaUpgrade />);
        const gl = await screen.findByTestId('escena-gl');
        act(() => gl.click());
        expect(detect.remember).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalledWith('Escena WebGL forzada: volvió a la SVG (slow)');
        expect(document.documentElement.dataset.escenaElegida).toBe('svg');
    });

    it('espera al evento load si la página todavía no terminó de cargar', async () => {
        detect.choice = { version: 'svg', reason: 'save-data' };
        const state = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
        render(<EscenaUpgrade />);
        await new Promise((r) => setTimeout(r, 300));
        expect(track).not.toHaveBeenCalled();
        state.mockRestore();
        window.dispatchEvent(new Event('load'));
        await waitFor(() => expect(track).toHaveBeenCalled());
    });

    it('volver a la Home no repite la detección ni el evento', async () => {
        detect.choice = { version: 'webgl', reason: 'capable' };
        const first = render(<EscenaUpgrade />);
        await screen.findByTestId('escena-gl');
        first.unmount();
        render(<EscenaUpgrade />);
        await screen.findByTestId('escena-gl');
        expect(track.mock.calls.filter(([event]) => event === 'escena')).toHaveLength(1);
    });

    it('después de una caída, la WebGL no vuelve en la misma visita', async () => {
        detect.choice = { version: 'webgl', reason: 'capable' };
        const first = render(<EscenaUpgrade />);
        const gl = await screen.findByTestId('escena-gl');
        act(() => gl.click());
        first.unmount();
        render(<EscenaUpgrade />);
        await new Promise((r) => setTimeout(r, 300));
        expect(screen.queryByTestId('escena-gl')).not.toBeInTheDocument();
    });

    it('si el chunk de la detección no llega, se queda la SVG y lo avisa en la consola', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        detect.fail = true;
        render(<EscenaUpgrade />);
        await new Promise((r) => setTimeout(r, 300));
        expect(screen.queryByTestId('escena-gl')).not.toBeInTheDocument();
        expect(track).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalled();
        expect(document.documentElement.dataset.escenaElegida).toBe('svg');
    });
});
