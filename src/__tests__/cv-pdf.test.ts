// @vitest-environment node
import { describe, it, expect } from 'vitest';

import { countPdfPages, renderCv } from '@/build/cv/render';

const TODAY = new Date(2026, 9, 27);

describe('CV en PDF', () => {
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
