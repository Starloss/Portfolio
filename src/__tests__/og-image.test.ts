// @vitest-environment node
import { describe, it, expect } from 'vitest';

import { pngSize, renderOgImage } from '@/build/og/render';

describe('Imagen OG', () => {
    it('es un PNG de 1200 × 630 con la Escena y el texto', async () => {
        const png = await renderOgImage({
            title: 'Diego Rangel',
            label: 'Full-Stack Lead Developer',
        });
        expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
        expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
        // Una imagen lisa comprime a muy poco; la Escena con texto pesa bastante más.
        expect(png.length).toBeGreaterThan(20_000);
    }, 30_000);

    it('cambia según lo que dice la tarjeta', async () => {
        const home = await renderOgImage({
            title: 'Diego Rangel',
            label: 'Full-Stack Lead Developer',
        });
        const caseStudy = await renderOgImage({
            title: 'SuperWallet',
            label: 'Caso de estudio',
            detail: 'React · TypeScript · Prisma · Nest',
        });
        expect(caseStudy.equals(home)).toBe(false);
    }, 30_000);
});
