// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

import { countPdfPages, renderCv } from '@/build/cv/render';
import { CONTENT } from '@/content';

const TODAY = new Date(2026, 9, 27);

describe('CV en PDF', () => {
    it('continúa una Experiencia larga en otras páginas sin desbordarla', async () => {
        const originalExperiences = CONTENT.experiences;
        const experience = originalExperiences[0];
        CONTENT.experiences = [
            {
                ...experience,
                achievements: Array.from({ length: 100 }, (_, i) => ({
                    ...experience.achievements[0],
                    text: {
                        es: `Logro ${i}: ${experience.achievements[0].text.es}`,
                        en: `Achievement ${i}: ${experience.achievements[0].text.en}`,
                    },
                })),
            },
        ];
        const warn = vi.spyOn(console, 'warn');
        try {
            const pdf = await renderCv('en', TODAY, 'https://www.diegorangel.dev');
            expect(countPdfPages(pdf)).toBeGreaterThan(2);
            expect(warn).not.toHaveBeenCalled();
        } finally {
            CONTENT.experiences = originalExperiences;
            warn.mockRestore();
        }
    }, 30000);

    it.each(['es', 'en'] as const)(
        'genera el CV en %s con como mucho 2 páginas',
        async (locale) => {
            const pdf = await renderCv(locale, TODAY, 'https://www.diegorangel.dev');
            expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
            const pages = countPdfPages(pdf);
            expect(pages).toBeGreaterThanOrEqual(1);
            expect(pages).toBeLessThanOrEqual(2);
        },
        30000,
    );
});
