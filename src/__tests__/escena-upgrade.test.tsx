import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { EscenaUpgrade } from '@app/scene/EscenaUpgrade';
import type { EscenaChoice } from '@app/scene/gl/detect';
import type { FallbackReason } from '@app/scene/gl/SceneGL';

// El interruptor de la carga inicial: con la página cargada y el navegador ocioso, decide con la
// detección previa y solo entonces trae la Escena WebGL (ADR 0003).

const detect = vi.hoisted(() => ({
    choice: { version: 'svg', reason: 'mobile' } as EscenaChoice,
    remember: vi.fn(),
}));

vi.mock('@app/scene/gl/detect', () => ({
    readSignals: () => ({}),
    chooseEscena: () => detect.choice,
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

beforeEach(() => {
    window.umami = { track };
});

afterEach(() => {
    delete window.umami;
    track.mockReset();
    detect.remember.mockReset();
});

describe('EscenaUpgrade', () => {
    it('si la detección elige la SVG, no carga la WebGL y lo registra', async () => {
        detect.choice = { version: 'svg', reason: 'mobile' };
        render(<EscenaUpgrade />);
        await waitFor(() =>
            expect(track).toHaveBeenCalledWith('escena', { version: 'svg', reason: 'mobile' }),
        );
        expect(screen.queryByTestId('escena-gl')).not.toBeInTheDocument();
    });

    it('si elige la WebGL, la monta con el vigilante encendido', async () => {
        detect.choice = { version: 'webgl', reason: 'capable' };
        render(<EscenaUpgrade />);
        const gl = await screen.findByTestId('escena-gl');
        expect(gl).toHaveAttribute('data-watch', 'true');
        expect(track).toHaveBeenCalledWith('escena', { version: 'webgl', reason: 'capable' });
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

    it('una caída con ?escena=webgl no se recuerda: es una prueba', async () => {
        detect.choice = { version: 'webgl', reason: 'forced' };
        render(<EscenaUpgrade />);
        const gl = await screen.findByTestId('escena-gl');
        act(() => gl.click());
        expect(detect.remember).not.toHaveBeenCalled();
    });

    it('espera al evento load si la página todavía no terminó de cargar', async () => {
        detect.choice = { version: 'svg', reason: 'mobile' };
        const state = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
        render(<EscenaUpgrade />);
        await new Promise((r) => setTimeout(r, 300));
        expect(track).not.toHaveBeenCalled();
        state.mockRestore();
        window.dispatchEvent(new Event('load'));
        await waitFor(() => expect(track).toHaveBeenCalled());
    });
});
