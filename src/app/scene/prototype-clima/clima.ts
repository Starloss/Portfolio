// PROTOTIPO desechable (ticket "Cómo se ve cada estado de Clima"): nunca se mergea.
// Tres formas de pintar el Clima en ?climav=a|b|c. Puro: lo usan la Escena SVG y el Worker.

export type Estado = 'despejado' | 'parcial' | 'nublado' | 'lluvia' | 'tormenta';
export type ClimaVariant = 'a' | 'b' | 'c';

export interface ClimaParams {
    variant: ClimaVariant;
    estado: Estado;
    /** Topes de 0 a 1: cuánto puede oscurecer y cubrir el Clima como máximo. */
    topeOscuro: number;
    topeDensidad: number;
}

export interface ClimaFrame {
    cover: number;
    dark: number;
    rain: number;
    /** 0 a 1: la luz del rayo en este instante. */
    flash: number;
    boltX: number;
    boltSeed: number;
    /** 0 A, 1 B, 2 C. */
    mode: number;
}

export const ESTADOS: Estado[] = ['despejado', 'parcial', 'nublado', 'lluvia', 'tormenta'];

export const CLIMA_VARIANTS: Record<ClimaVariant, string> = {
    a: 'Cielo entero',
    b: 'Cortina delante',
    c: 'Sobre el Ávila',
};

const TARGETS: Record<Estado, { cover: number; dark: number; rain: number; storm: boolean }> = {
    despejado: { cover: 0, dark: 0, rain: 0, storm: false },
    parcial: { cover: 0.35, dark: 0.04, rain: 0, storm: false },
    nublado: { cover: 0.7, dark: 0.2, rain: 0, storm: false },
    lluvia: { cover: 0.85, dark: 0.4, rain: 0.7, storm: false },
    tormenta: { cover: 1, dark: 0.65, rain: 1, storm: true },
};

export function climaTarget(p: ClimaParams) {
    const t = TARGETS[p.estado];
    return {
        cover: Math.min(t.cover, p.topeDensidad),
        dark: Math.min(t.dark, p.topeOscuro),
        rain: t.rain,
        storm: t.storm,
    };
}

// Cuánto tarda en entrar o cambiar el Clima, y los rayos: nunca más de dos pulsos seguidos ni menos
// de 5 s entre ellos, muy por debajo de los 3 destellos por segundo de WCAG.
const FADE_RATE = 1 / 1.5;
const FLASH_GAP = { min: 5000, spread: 8000 };
const PULSES = [
    { at: 0, peak: 1 },
    { at: 170, peak: 0.55 },
];
const PULSE_MS = 130;

export class ClimaSim {
    private cover = 0;
    private dark = 0;
    private rain = 0;
    private last = 0;
    private primed = false;
    private strikeAt = -1;
    private nextStrike = 0;
    private boltX = 0.3;
    private boltSeed = 0.2;

    tick(now: number, p: ClimaParams): ClimaFrame {
        const t = climaTarget(p);
        const dt = Math.min(0.1, (now - (this.last || now)) / 1000);
        this.last = now;
        const k = this.primed ? Math.min(1, dt * FADE_RATE * 3) : 1;
        this.primed = true;
        this.cover += (t.cover - this.cover) * k;
        this.dark += (t.dark - this.dark) * k;
        this.rain += (t.rain - this.rain) * k;

        let flash = 0;
        if (t.storm) {
            if (now >= this.nextStrike) {
                this.strikeAt = now;
                this.nextStrike = now + FLASH_GAP.min + Math.random() * FLASH_GAP.spread;
                this.boltX = 0.15 + Math.random() * 0.7;
                this.boltSeed = Math.random();
            }
            for (const pulse of PULSES) {
                const u = (now - this.strikeAt - pulse.at) / PULSE_MS;
                if (u >= 0 && u < 1) flash = Math.max(flash, pulse.peak * (1 - u));
            }
        }
        return {
            cover: this.cover,
            dark: this.dark,
            rain: this.rain,
            flash,
            boltX: this.boltX,
            boltSeed: this.boltSeed,
            mode: p.variant === 'a' ? 0 : p.variant === 'b' ? 1 : 2,
        };
    }
}
