// La gente que camina por la Avenida Bolívar en la Escena WebGL, según la Afluencia (rhythm.ts).
// Camina sola, en parejas o en grupos de hasta cuatro, y hay gente parada. Cada acera tiene varias
// líneas a distintas distancias, y los más rápidos adelantan. Con lluvia salen los paraguas y la
// gente parada espera bajo los árboles; con tormenta, la poca que queda corre. Fuera de la carga,
// nadie aparece ni desaparece a la vista: se entra y se sale por los bordes, y quien se para o se
// va lo hace donde está. Todo en altos de calzada (H), como street.ts.
import type { AfluenciaParams } from './rhythm';
import {
    SIDEWALK_LINES as LINES,
    standingCount,
    UMBRELLA_COLORS,
    UMBRELLA_SHARE,
    walkersOnLine,
    type Umbrella,
} from './street';

export type Gait = 'walk' | 'stand' | 'run';

export interface Walker {
    /** Centro en x, en H desde el borde izquierdo. */
    u: number;
    /** Línea de apoyo, en fracciones de H (la de su línea de SIDEWALK_LINES). */
    s: number;
    /** Índice de su línea de SIDEWALK_LINES. */
    line: number;
    dir: 1 | -1;
    speed: number;
    scale: number;
    phase: number;
    gait: Gait;
    umbrella: Umbrella | null;
    /** Quien camina con otros comparte su número de grupo. */
    group: number;
}

// Donde se para la gente: la línea de más atrás de la acera de atrás y la de adelante del todo.
const STANDING_LINES = [2, LINES.length - 1];
// Cuánto se aleja de un árbol (en H) quien se refugia bajo él.
const SHELTER_REACH = 0.25;

export class Crowd {
    walkers: Walker[] = [];
    private params: AfluenciaParams = { afluencia: 0, lluvia: 'seca' };
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

    /**
     * Cambia la Afluencia o el Clima en una ventana de `span` H, con un árbol cada `treeEvery` H. La
     * primera vez la acera ya arranca con su gente; después, los cambios llegan con quien entra.
     */
    set(params: AfluenciaParams, span: number, treeEvery: number) {
        this.params = params;
        if (this.started) return;
        this.started = true;
        LINES.forEach((_, line) => {
            const wanted = walkersOnLine(params.afluencia, line, span);
            let placed = 0;
            while (placed < wanted) placed += this.enter(line, span, this.rand() * (span + 2) - 1);
        });
        for (let i = 0; i < standingCount(params, span); i++) {
            const line = STANDING_LINES[this.rand() < 0.4 ? 1 : 0];
            const u =
                params.lluvia === 'seca' ? this.rand() * span : this.treeSpot(span, treeEvery);
            this.walkers.push(this.person(line, u, 1, 0, 'stand', null, this.nextGroup++));
        }
    }

    private treeSpot(span: number, treeEvery: number) {
        const trees = Math.max(1, Math.floor(span / treeEvery));
        return (Math.floor(this.rand() * trees) + 0.5) * treeEvery + (this.rand() - 0.5) * 0.3;
    }

    private person(
        line: number,
        u: number,
        dir: 1 | -1,
        speed: number,
        gait: Gait,
        umbrella: Umbrella | null,
        group: number,
    ): Walker {
        const { s, scale } = LINES[line];
        return {
            u,
            s,
            line,
            dir,
            speed,
            scale: scale * (0.9 + this.rand() * 0.2),
            phase: this.rand() * Math.PI * 2,
            gait,
            umbrella,
            group,
        };
    }

    /** Un grupo que entra por un borde (o en `at`, al cargar). Devuelve cuántos son. */
    private enter(line: number, span: number, at?: number): number {
        const { lluvia } = this.params;
        const dir: 1 | -1 = this.rand() < 0.5 ? 1 : -1;
        const r = this.rand();
        const size = r < 0.45 ? 1 : r < 0.8 ? 2 : r < 0.92 ? 3 : 4;
        const run = lluvia === 'tormenta';
        const speed = run ? 0.32 + this.rand() * 0.08 : 0.11 + this.rand() * 0.07;
        const start = at ?? (dir > 0 ? -1 : span + 1);
        const group = this.nextGroup++;
        for (let i = 0; i < size; i++) {
            const umbrella =
                lluvia === 'lluvia' && this.rand() < UMBRELLA_SHARE
                    ? UMBRELLA_COLORS[Math.floor(this.rand() * UMBRELLA_COLORS.length)]
                    : null;
            const gait = run ? 'run' : 'walk';
            const w = this.person(line, start - dir * i * 0.14, dir, speed, gait, umbrella, group);
            // En grupo se camina de a dos, un poco escalonados.
            w.s += (i % 2) * 0.012;
            this.walkers.push(w);
        }
        return size;
    }

    // La gente parada cambia de a uno y donde está: alguien que pasaba se detiene (con lluvia, solo
    // bajo un árbol), o alguien que esperaba sigue caminando y se va por un borde.
    private adjustStanding(span: number, treeEvery: number) {
        const { lluvia } = this.params;
        const underTree = (u: number) => {
            const k = u / treeEvery - 0.5;
            return Math.abs(k - Math.round(k)) * treeEvery < SHELTER_REACH;
        };
        const fits = (w: Walker) => lluvia === 'seca' || underTree(w.u);
        const standing = this.walkers.filter((w) => w.gait === 'stand');
        // Con lluvia, quien esperaba al descubierto se va a buscar techo.
        const exposed = standing.find((w) => !fits(w));
        if (exposed || standing.length > standingCount(this.params, span)) {
            const leaving = exposed ?? standing[Math.floor(this.rand() * standing.length)];
            leaving.gait = lluvia === 'tormenta' ? 'run' : 'walk';
            leaving.speed = lluvia === 'tormenta' ? 0.35 : 0.14;
            return;
        }
        if (standing.length < standingCount(this.params, span)) {
            const passer = this.walkers.find(
                (w) =>
                    w.gait === 'walk' &&
                    STANDING_LINES.includes(w.line) &&
                    w.u > 0 &&
                    w.u < span &&
                    fits(w),
            );
            if (passer) {
                passer.gait = 'stand';
                passer.speed = 0;
            }
        }
    }

    /** Avanza `dt` s en una ventana de `span` H, con un árbol cada `treeEvery` H. */
    step(dt: number, span: number, treeEvery: number) {
        const moving = new Array<number>(LINES.length).fill(0);
        let kept = 0;
        for (const w of this.walkers) {
            w.u += w.dir * w.speed * dt;
            const gone = w.gait !== 'stand' && (w.dir > 0 ? w.u > span + 1.2 : w.u < -1.2);
            if (gone) continue;
            if (w.gait !== 'stand') moving[w.line]++;
            this.walkers[kept++] = w;
        }
        this.walkers.length = kept;
        // Entra gente por los bordes hasta llegar a la que corresponde a cada línea.
        moving.forEach((count, line) => {
            const wanted = walkersOnLine(this.params.afluencia, line, span);
            const rate = 0.25 + wanted * 0.08;
            if (count < wanted && this.rand() < rate * dt) this.enter(line, span);
        });
        // Unas dos veces por segundo, alguien se para o se va.
        if (this.rand() < dt * 2) this.adjustStanding(span, treeEvery);
    }
}
