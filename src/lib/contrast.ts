// Contraste de colores según WCAG 2.x, para vigilar los tokens de la UI sobre la Escena.

interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
}

function parse(color: string): Rgba {
    const hex = color.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
        const n = parseInt(hex[1], 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
    }
    const rgba = color.match(
        /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i,
    );
    if (rgba) {
        const [r, g, b] = rgba.slice(1, 4).map(Number);
        return { r, g, b, a: rgba[4] === undefined ? 1 : Number(rgba[4]) };
    }
    throw new Error(`color no soportado: ${color}`);
}

const toHex = ({ r, g, b }: Rgba) =>
    `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** Opacidad de un color (1 si es opaco). */
export const alphaOf = (color: string) => parse(color).a;

/** Color opaco que resulta de pintar `color` (quizás translúcido) sobre `background`. */
export function compositeOver(color: string, background: string): string {
    const fg = parse(color);
    const bg = parse(compositeOnWhiteIfNeeded(background));
    const mix = (f: number, b: number) => f * fg.a + b * (1 - fg.a);
    return toHex({ r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 });
}

// Un fondo translúcido sin nada detrás se toma sobre blanco.
function compositeOnWhiteIfNeeded(color: string) {
    const c = parse(color);
    return c.a === 1 ? color : compositeOver(color, '#ffffff');
}

function luminance(color: string): number {
    const { r, g, b } = parse(color);
    const [lr, lg, lb] = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** Contraste entre dos colores opacos, de 1 a 21. */
export function contrastRatio(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}
