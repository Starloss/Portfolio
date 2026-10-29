// Prototipo #40: la Avenida Bolívar al pie de las Torres de Parque Central. Peatones,
// camioneticas, motorizados y carros como siluetas; de Noche, faros y luces traseras.
// Todo en px de pantalla, relativo a la franja de la calle (alto H, `s` de 0 arriba a 1 abajo).

export const Kind = { Car: 0, Bus: 1, Moto: 2, Walker: 3, Beam: 4, Dot: 5 } as const;
type KindValue = (typeof Kind)[keyof typeof Kind];

interface Agent {
    kind: typeof Kind.Car | typeof Kind.Bus | typeof Kind.Moto | typeof Kind.Walker;
    /** Línea de apoyo, en fracciones del alto de la calle. */
    s: number;
    dir: 1 | -1;
    /** px/s con la calle de 200 px de alto; escala con H. */
    speed: number;
    scale: number;
    x: number;
    phase: number;
}

// Carriles: los de atrás van hacia la izquierda y los de adelante hacia la derecha.
const FAR_LANES = [0.47, 0.6];
const NEAR_LANES = [0.76, 0.89];
const BACK_WALK = 0.27;
const FRONT_WALK = 0.995;

/** Proporciones (ancho y alto en fracciones de H) de cada tipo, con la escala del carril. */
const SIZE: Record<Agent['kind'], [number, number]> = {
    [Kind.Car]: [0.55, 0.19],
    [Kind.Bus]: [0.78, 0.31],
    [Kind.Moto]: [0.3, 0.24],
    [Kind.Walker]: [0.11, 0.24],
};

let seed = 11;
const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
};

function spawn(): Agent[] {
    const agents: Agent[] = [];
    // Cada carril va a una sola velocidad y con separación pareja, para que nadie se encime.
    const lane = (s: number, dir: 1 | -1, scale: number, count: number) => {
        const speed = 85 + rand() * 45;
        for (let i = 0; i < count; i++) {
            const r = rand();
            const kind: Agent['kind'] = r < 0.2 ? Kind.Bus : r < 0.45 ? Kind.Moto : Kind.Car;
            const x = (i + rand() * 0.35) / count;
            agents.push({ kind, s, dir, speed, scale, x, phase: rand() * 6.28 });
        }
    };
    FAR_LANES.forEach((s) => lane(s, -1, 0.88, 3));
    NEAR_LANES.forEach((s) => lane(s, 1, 1, 3));
    const walkers = (s: number, scale: number, count: number) => {
        for (let i = 0; i < count; i++) {
            agents.push({
                kind: Kind.Walker,
                s,
                dir: rand() < 0.5 ? 1 : -1,
                speed: 22 + rand() * 14,
                scale: scale * (0.9 + rand() * 0.2),
                x: rand(),
                phase: rand() * 6.28,
            });
        }
    };
    walkers(BACK_WALK, 0.72, 7);
    walkers(FRONT_WALK, 1, 5);
    // De atrás hacia adelante: así se dibujan en orden.
    return agents.sort((a, b) => a.s - b.s);
}

/** Atributos por instancia: anchor (x, y), size (w, h), meta (kind, dir, phase, s), color. */
export const MAX_INSTANCES = 96;

export class Street {
    private agents = spawn();
    readonly anchor = new Float32Array(MAX_INSTANCES * 2);
    readonly size = new Float32Array(MAX_INSTANCES * 2);
    readonly meta = new Float32Array(MAX_INSTANCES * 4);
    readonly color = new Float32Array(MAX_INSTANCES * 3);
    count = 0;

    /** Mueve a todos `dt` segundos; `x` está en fracciones de un ancho con margen. */
    step(dt: number, width: number, H: number) {
        const span = width + 2 * H;
        for (const a of this.agents) {
            a.x += (a.dir * a.speed * (H / 200) * dt) / span;
            a.x -= Math.floor(a.x);
        }
    }

    /** Llena los buffers de instancias para la calle con techo en `top` y alto `H`. */
    write(top: number, H: number, width: number, night: number, time: number) {
        let n = 0;
        const span = width + 2 * H;
        const push = (
            kind: KindValue,
            x: number,
            y: number,
            w: number,
            h: number,
            dir: number,
            phase: number,
            s: number,
            rgb: [number, number, number] = [0, 0, 0],
        ) => {
            if (n >= MAX_INSTANCES) return;
            this.anchor.set([x, y], n * 2);
            this.size.set([w, h], n * 2);
            this.meta.set([kind, dir, phase, s], n * 4);
            this.color.set(rgb, n * 3);
            n++;
        };
        for (const a of this.agents) {
            const [fw, fh] = SIZE[a.kind];
            const w = fw * H * a.scale;
            const h = fh * H * a.scale;
            const x = a.x * span - H;
            // Los motorizados zigzaguean un poco entre carriles.
            const wobble = a.kind === Kind.Moto ? Math.sin(time * 0.9 + a.phase) * 0.035 * H : 0;
            const y = top + a.s * H + wobble;
            push(a.kind, x, y, w, h, a.dir, a.phase, a.s);
            if (night > 0.01 && a.kind !== Kind.Walker) {
                const front = x + (a.dir * w) / 2;
                const back = x - (a.dir * w) / 2;
                const lampY =
                    y - h * (a.kind === Kind.Bus ? 0.28 : a.kind === Kind.Moto ? 0.5 : 0.36);
                push(
                    Kind.Beam,
                    front + (a.dir * 1.1 * H * a.scale) / 2,
                    lampY,
                    1.1 * H * a.scale,
                    0.3 * H * a.scale,
                    a.dir,
                    0,
                    night,
                    [1, 0.93, 0.75],
                );
                push(Kind.Dot, front, lampY, 0.08 * H, 0.08 * H, a.dir, 0, night, [1, 0.97, 0.88]);
                push(Kind.Dot, back, lampY, 0.07 * H, 0.07 * H, a.dir, 0, night, [1, 0.12, 0.1]);
            }
        }
        this.size.fill(0, n * 2);
        this.count = n;
    }
}
