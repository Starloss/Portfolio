// La gente y los vehículos de la Avenida Bolívar en la Escena WebGL: la misma formación que la
// Escena SVG (street.ts), en movimiento. Se dibujan en un solo pase instanciado; de Noche suman
// faros y luces traseras (la luz de los postes ya viene en la textura de la calle).
import { AGENT_SIZE, agentX, LIGHT_HEIGHT, type StreetAgent } from '../street';

/** Qué dibuja cada instancia (aMeta.x en el shader). */
export const KIND = { car: 0, bus: 1, moto: 2, walker: 3, beam: 4, dot: 5 } as const;

export const MAX_INSTANCES = 128;

const BLACK = [0, 0, 0] as const;
const HEADLIGHT: [number, number, number] = [1, 0.97, 0.88];
const TAILLIGHT: [number, number, number] = [1, 0.12, 0.1];
const BEAM: [number, number, number] = [1, 0.93, 0.75];

export interface Instances {
    /** Punto de apoyo (x, y) en px. */
    anchor: Float32Array;
    /** Ancho y alto en px. */
    size: Float32Array;
    /** Tipo, sentido, fase e intensidad (solo las luces). */
    meta: Float32Array;
    color: Float32Array;
    count: number;
}

export function createInstances(): Instances {
    return {
        anchor: new Float32Array(MAX_INSTANCES * 2),
        size: new Float32Array(MAX_INSTANCES * 2),
        meta: new Float32Array(MAX_INSTANCES * 4),
        color: new Float32Array(MAX_INSTANCES * 3),
        count: 0,
    };
}

/**
 * Llena `into` con la calle a los `time` s: con la calzada arriba en `top`, de alto `H` y `width`
 * de ancho, corrida `shiftX` px por el parallax. `night` (0 a 1) enciende las luces.
 */
export function writeInstances(
    into: Instances,
    agents: readonly StreetAgent[],
    {
        time,
        top,
        H,
        width,
        night,
        shiftX = 0,
    }: {
        time: number;
        top: number;
        H: number;
        width: number;
        night: number;
        shiftX?: number;
    },
): Instances {
    let n = 0;
    const push = (
        kind: number,
        x: number,
        y: number,
        w: number,
        h: number,
        dir: number,
        phase: number,
        intensity: number,
        rgb: readonly [number, number, number] = BLACK,
    ) => {
        if (n >= MAX_INSTANCES) return;
        // Escritura directa: se llama unas 80 veces por cuadro, mejor sin crear arreglos.
        into.anchor[n * 2] = x + shiftX;
        into.anchor[n * 2 + 1] = y;
        into.size[n * 2] = w;
        into.size[n * 2 + 1] = h;
        into.meta[n * 4] = kind;
        into.meta[n * 4 + 1] = dir;
        into.meta[n * 4 + 2] = phase;
        into.meta[n * 4 + 3] = intensity;
        into.color[n * 3] = rgb[0];
        into.color[n * 3 + 1] = rgb[1];
        into.color[n * 3 + 2] = rgb[2];
        n++;
    };
    for (const a of agents) {
        const [fw, fh] = AGENT_SIZE[a.kind];
        const w = fw * H * a.scale;
        const h = fh * H * a.scale;
        const x = agentX(a, time, width, H);
        // Los motorizados zigzaguean un poco entre carriles.
        const wobble = a.kind === 'moto' ? Math.sin(time * 0.9 + a.phase) * 0.035 * H : 0;
        const y = top + a.s * H + wobble;
        push(KIND[a.kind], x, y, w, h, a.dir, a.phase, 0);
        if (night > 0.01 && a.kind !== 'walker') {
            const front = x + (a.dir * w) / 2;
            const back = x - (a.dir * w) / 2;
            const lampY = y - h * LIGHT_HEIGHT[a.kind];
            const beam = 1.1 * H * a.scale;
            push(
                KIND.beam,
                front + (a.dir * beam) / 2,
                lampY,
                beam,
                0.3 * H * a.scale,
                a.dir,
                0,
                night,
                BEAM,
            );
            push(KIND.dot, front, lampY, 0.08 * H, 0.08 * H, a.dir, 0, night, HEADLIGHT);
            push(KIND.dot, back, lampY, 0.07 * H, 0.07 * H, a.dir, 0, night, TAILLIGHT);
        }
    }
    into.size.fill(0, n * 2);
    into.count = n;
    return into;
}
