// La gente que camina por la Avenida Bolívar en la Escena WebGL, según la Afluencia (rhythm.ts).
// Camina sola, en parejas o en grupos de hasta cuatro, y hay gente parada. Cada acera tiene varias
// líneas a distintas distancias, y los más rápidos adelantan. Con lluvia salen los paraguas y la
// gente parada espera bajo los árboles; con tormenta, la poca que queda corre. Solo entra y sale
// por los bordes. Todo en altos de calzada (H), como street.ts.
import type { CrowdParams } from './rhythm';
import { SIDEWALK_LINES as LINES, UMBRELLA_COLORS as UMBRELLAS } from './street';

export type Gait = 'walk' | 'stand' | 'run';

export interface Walker {
    /** Centro en x, en H desde el borde izquierdo. */
    u: number;
    /** Línea de apoyo, en fracciones de H (una de SIDEWALK_LINES). */
    s: number;
    /** Índice de su línea de acera. */
    line: number;
    dir: 1 | -1;
    speed: number;
    scale: number;
    phase: number;
    gait: Gait;
    umbrella: boolean;
    /** Color del paraguas. */
    color: readonly [number, number, number];
    /** Quien camina con otros comparte su número de grupo. */
    group: number;
    /** Parado bajo un árbol. */
    sheltered: boolean;
}

// Gente parada por cada H de ancho con la acera llena; con lluvia se juntan más bajo los árboles.
const STANDING_PER_SPAN = 0.45;
const SHELTERED_PER_SPAN = 1.4;
// Los árboles de la calle, cada 260 px con la calzada de 150 px (Avenue, en parts.tsx).
const TREE_EVERY = 260 / 150;

const NO_COLOR = [0, 0, 0] as const;

export class Crowd {
    walkers: Walker[] = [];
    private params: CrowdParams = { afluencia: 0, weather: 'seco' };
    private seed: number;
    private nextGroup = 0;
    private started = false;

    constructor(seed = 3) {
        this.seed = seed;
    }

    private rand() {
        this.seed = (this.seed * 16807) % 2147483647;
        return this.seed / 2147483647;
    }

    /** Cambia la Afluencia o el Clima. La primera vez, la acera ya arranca con su gente. */
    set(params: CrowdParams, span: number) {
        const weatherChanged = params.weather !== this.params.weather;
        this.params = params;
        if (!this.started || weatherChanged) {
            // Al empezar, o si cambia el Clima, la gente aparece ya repartida: nadie abre un
            // paraguas a mitad de cuadra.
            this.started = true;
            this.walkers = [];
            LINES.forEach((line, i) => {
                for (let k = 0; k < this.wanted(i, span); k++) {
                    this.enter(i, span, this.rand() * (span + 2) - 1);
                }
            });
        }
        this.placeStanding(span);
    }

    private wanted(line: number, span: number) {
        return Math.round(this.params.afluencia * LINES[line].perSpan * span);
    }

    private enter(line: number, span: number, at?: number) {
        const { weather } = this.params;
        const dir: 1 | -1 = this.rand() < 0.5 ? 1 : -1;
        // Un grupo: sola, en pareja, de tres o de cuatro.
        const r = this.rand();
        const size = at !== undefined ? 1 : r < 0.45 ? 1 : r < 0.8 ? 2 : r < 0.92 ? 3 : 4;
        const run = weather === 'tormenta';
        const speed = run ? 0.32 + this.rand() * 0.08 : 0.11 + this.rand() * 0.07;
        const start = at ?? (dir > 0 ? -1 : span + 1);
        const group = this.nextGroup++;
        const { s, scale } = LINES[line];
        for (let i = 0; i < size; i++) {
            const umbrella = weather === 'lluvia' && this.rand() < 0.75;
            this.walkers.push({
                u: start - dir * i * 0.14,
                s: s + (i % 2) * 0.012,
                line,
                dir,
                speed,
                scale: scale * (0.9 + this.rand() * 0.2),
                phase: this.rand() * Math.PI * 2,
                gait: run ? 'run' : 'walk',
                umbrella,
                color: umbrella ? UMBRELLAS[Math.floor(this.rand() * UMBRELLAS.length)] : NO_COLOR,
                group,
                sheltered: false,
            });
        }
    }

    // La gente parada (esperando, conversando); con lluvia, bajo los árboles.
    private placeStanding(span: number) {
        const raining = this.params.weather !== 'seco';
        const perSpan = raining ? SHELTERED_PER_SPAN : STANDING_PER_SPAN;
        const wanted = Math.round(this.params.afluencia * perSpan * span);
        const standing = this.walkers.filter((w) => w.gait === 'stand');
        if (standing.length === wanted) return;
        this.walkers = this.walkers.filter((w) => w.gait !== 'stand');
        for (let i = 0; i < wanted; i++) {
            const line = this.rand() < 0.4 ? LINES.length - 1 : 2;
            const u = raining
                ? (Math.floor(this.rand() * (span / TREE_EVERY)) + 0.5) * TREE_EVERY +
                  (this.rand() - 0.5) * 0.3
                : this.rand() * span;
            this.walkers.push({
                u,
                s: LINES[line].s - 0.01,
                line,
                dir: this.rand() < 0.5 ? 1 : -1,
                speed: 0,
                scale: LINES[line].scale * (0.9 + this.rand() * 0.2),
                phase: this.rand() * Math.PI * 2,
                gait: 'stand',
                umbrella: false,
                color: NO_COLOR,
                group: this.nextGroup++,
                sheltered: raining,
            });
        }
    }

    /** Avanza `dt` s en una ventana de `span` H de ancho. */
    step(dt: number, span: number) {
        for (const w of this.walkers) w.u += w.dir * w.speed * dt;
        const gone = (w: Walker) => (w.dir > 0 ? w.u > span + 1.2 : w.u < -1.2);
        this.walkers = this.walkers.filter((w) => w.gait === 'stand' || !gone(w));
        // Entra gente por los bordes hasta llegar a la que corresponde a cada línea.
        LINES.forEach((_, line) => {
            const moving = this.walkers.filter((w) => w.line === line && w.gait !== 'stand');
            const wanted = this.wanted(line, span);
            const rate = 0.25 + wanted * 0.08;
            if (moving.length < wanted && this.rand() < rate * dt) this.enter(line, span);
        });
    }
}
