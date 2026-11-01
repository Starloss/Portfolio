// El Clima en la Escena WebGL, sin nada del navegador: cuánto cubre, oscurece y llueve cada estado, y
// cuándo cae un rayo. Corre en el Worker, cuadro a cuadro.
import type { Estado } from '@lib/clima';

export interface ClimaTarget {
    cover: number;
    dark: number;
    rain: number;
}

const TARGETS: Record<Estado, ClimaTarget> = {
    despejado: { cover: 0, dark: 0, rain: 0 },
    parcial: { cover: 0.42, dark: 0.04, rain: 0 },
    nublado: { cover: 0.82, dark: 0.2, rain: 0 },
    lluvia: { cover: 0.93, dark: 0.4, rain: 0.7 },
    tormenta: { cover: 1, dark: 0.65, rain: 1 },
};
// Sin Clima, hasta que llega o si falla: algunas nubes, como la Escena de siempre.
const BASE: ClimaTarget = { cover: 0.25, dark: 0, rain: 0 };

export const climaTarget = (estado: Estado | null) => (estado ? TARGETS[estado] : BASE);

export interface ClimaFrame extends ClimaTarget {
    /** La luz del rayo en este instante, de 0 a 1. */
    flash: number;
    /** Dónde cae, como fracción del ancho, y una semilla para su forma. */
    boltX: number;
    boltSeed: number;
}

// El fundido se acerca a su objetivo y en cerca de 1,5 s casi llegó.
const FADE_RATE = 2;
const SETTLED = 0.002;
const MAX_STEP = 0.1;
// Dos pulsos por rayo, con al menos 5 s entre rayos: muy por debajo de los 3 destellos por segundo
// que WCAG considera peligrosos.
const GAP = { min: 5000, spread: 8000 };
const PULSES = [
    { at: 0, peak: 1 },
    { at: 170, peak: 0.55 },
];
const PULSE_MS = 130;

export class ClimaClock {
    private current: ClimaTarget | null = null;
    private last = 0;
    private strikeAt = -Infinity;
    private nextStrike: number | null = null;
    private boltX = 0.5;
    private boltSeed = 0;
    /** Si todavía está cambiando: con una GPU por software solo se dibuja cuando algo cambia. */
    fading = false;

    constructor(private random: () => number = Math.random) {}

    tick(now: number, estado: Estado | null): ClimaFrame {
        const target = climaTarget(estado);
        // Un cuadro largo no se salta el fundido, como en el resto del motor.
        const dt = Math.min(MAX_STEP, (now - this.last) / 1000);
        const k = Math.min(1, dt * FADE_RATE);
        this.last = now;
        const from = this.current ?? target;
        const moved = {
            cover: from.cover + (target.cover - from.cover) * k,
            dark: from.dark + (target.dark - from.dark) * k,
            rain: from.rain + (target.rain - from.rain) * k,
        };
        this.fading =
            Math.abs(moved.cover - target.cover) > SETTLED ||
            Math.abs(moved.dark - target.dark) > SETTLED ||
            Math.abs(moved.rain - target.rain) > SETTLED;
        // Al asentarse llega justo al objetivo: un cielo despejado no conserva una llovizna residual.
        const next = this.fading ? moved : target;
        this.current = next;

        return {
            ...next,
            flash: this.flash(now, estado === 'tormenta'),
            boltX: this.boltX,
            boltSeed: this.boltSeed,
        };
    }

    private flash(now: number, storm: boolean): number {
        if (!storm) {
            this.nextStrike = null;
            return 0;
        }
        this.nextStrike ??= now + GAP.min;
        if (now >= this.nextStrike) {
            this.strikeAt = now;
            this.nextStrike = now + GAP.min + this.random() * GAP.spread;
            this.boltX = 0.15 + this.random() * 0.7;
            this.boltSeed = this.random();
        }
        let light = 0;
        for (const { at, peak } of PULSES) {
            const u = (now - this.strikeAt - at) / PULSE_MS;
            if (u >= 0 && u < 1) light = Math.max(light, peak * (1 - u));
        }
        return light;
    }
}
