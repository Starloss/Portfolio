import { readFileSync } from 'node:fs';

import { describe, it, expect } from 'vitest';
import { DAY, NIGHT, NIGHT_LIGHTS } from '@app/scene/palette';
import { UI_TOKENS, type UiMode } from '@app/theme/tokens';
import { alphaOf, compositeOver, contrastRatio } from '@lib/contrast';

// Lo que puede quedar detrás de un bloque: cualquier color de la Escena de ese modo. Las nubes,
// que son translúcidas, se componen sobre el cielo.
const sceneColors = (mode: UiMode): string[] => {
    const palette = mode === 'day' ? DAY : NIGHT;
    const colors = Object.values(palette).map((c) => compositeOver(c, palette.skyBottom));
    return mode === 'night' ? [...colors, ...Object.values(NIGHT_LIGHTS)] : colors;
};

// El peor caso de un texto sobre la superficie de un bloque, con la Escena detrás.
const worstContrastOnSurface = (mode: UiMode, text: string) =>
    Math.min(
        ...sceneColors(mode).map((background) =>
            contrastRatio(text, compositeOver(UI_TOKENS[mode].surface, background)),
        ),
    );

describe('contraste (fórmula de WCAG)', () => {
    it('da 21:1 entre negro y blanco y 1:1 entre iguales', () => {
        expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
        expect(contrastRatio('#5ea8dc', '#5ea8dc')).toBeCloseTo(1, 5);
    });

    it('coincide con valores conocidos', () => {
        // Botón primario de la paleta anterior: blanco sobre #3b82f6 da 3,68 (fallaba AA).
        expect(contrastRatio('#ffffff', '#3b82f6')).toBeCloseTo(3.68, 2);
    });

    it('compone un color translúcido sobre su fondo', () => {
        expect(compositeOver('rgba(0,0,0,0.5)', '#ffffff')).toBe('#808080');
        expect(alphaOf('rgba(250,252,248,0.86)')).toBe(0.86);
        expect(alphaOf('#2f6b4f')).toBe(1);
    });
});

describe('Tokens de color de la UI', () => {
    for (const mode of ['day', 'night'] as const) {
        const t = UI_TOKENS[mode];

        it(`${mode}: texto, texto suave, ámbar y primario dan ≥4,5:1 sobre un bloque con la Escena detrás`, () => {
            for (const text of [t.text, t.textMuted, t.amberText, t.primary]) {
                expect(worstContrastOnSurface(mode, text)).toBeGreaterThanOrEqual(4.5);
            }
        });

        it(`${mode}: el texto sobre el botón primario da ≥4,5:1`, () => {
            expect(contrastRatio(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(4.5);
        });

        it(`${mode}: los dos colores del anillo de foco se distinguen entre sí (≥3:1)`, () => {
            expect(contrastRatio(t.focusInner, t.focusOuter)).toBeGreaterThanOrEqual(3);
        });
    }

    it('la superficie de los bloques no baja de 0,84 de Día ni de 0,77 de Noche', () => {
        expect(alphaOf(UI_TOKENS.day.surface)).toBeGreaterThanOrEqual(0.84);
        expect(alphaOf(UI_TOKENS.night.surface)).toBeGreaterThanOrEqual(0.77);
    });

    it('el fondo de la página es el color del cielo de cada modo', () => {
        expect(UI_TOKENS.day.page).toBe('#5ea8dc');
        expect(UI_TOKENS.night.page).toBe('#050a1a');
    });
});

describe('tokens en Tailwind', () => {
    // @theme escribe a mano los nombres --ui-* que tokens-plugin.cjs deriva del JSON: un error de
    // tipeo no falla el build, deja la utilidad sin color.
    it('cada var(--ui-*) de tailwind.css existe en tokens.json', () => {
        const css = readFileSync('src/tailwind.css', 'utf8');
        const used = [...css.matchAll(/var\(--ui-([a-z-]+)\)/g)].map((m) => m[1]);
        const published = Object.keys(UI_TOKENS.day).map((k) =>
            k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
        );
        expect(used.length).toBeGreaterThan(0);
        expect(used.filter((name) => !published.includes(name))).toEqual([]);
    });
});
