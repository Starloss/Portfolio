import { describe, expect, it, vi } from 'vitest';
import { sceneFrame } from '@app/scene/camera';
import { EscenaGL } from '@app/scene/gl/engine';
import { STREET_BLEED } from '@app/scene/gl/frame';

describe('límite de texturas de la Escena WebGL', () => {
    it.each([
        {
            viewport: { width: 4096, height: 1080 },
            dpr: 2,
            expected: 4096 / (4096 + 2 * STREET_BLEED),
        },
        { viewport: { width: 600, height: 4000 }, dpr: 2, expected: 4096 / 4000 },
        { viewport: { width: 1200, height: 800 }, dpr: 1.5, expected: 1.5 },
    ])('limita el DPR para $viewport con DPR $dpr', async ({ viewport, dpr, expected }) => {
        const requestTextures = vi.fn().mockResolvedValue({});
        // Se prueba load sin crear un contexto WebGL: al estar destruido, descarta la respuesta.
        const engine = Object.assign(Object.create(EscenaGL.prototype), {
            layout: { viewport, frame: sceneFrame(viewport) },
            generation: 0,
            ready: { day: -1, night: -1 },
            pending: {},
            dpr,
            maxTexture: 4096,
            options: { requestTextures },
            disposed: true,
        }) as { load: (theme: 'day') => Promise<boolean> };

        await engine.load('day');
        const request = requestTextures.mock.calls[0][0];
        expect(request.dpr).toBeCloseTo(expected, 10);
        expect(Math.round((viewport.width + 2 * STREET_BLEED) * request.dpr)).toBeLessThanOrEqual(
            4096,
        );
        expect(Math.round(viewport.height * request.dpr)).toBeLessThanOrEqual(4096);
    });
});
