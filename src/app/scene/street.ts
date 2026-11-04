// La Avenida Bolívar, al pie de las Torres de Parque Central: la capa más cercana del Viaje de
// cámara. Funciones puras que comparten la Escena SVG (quieta) y la WebGL (animada). Todo en px de
// pantalla, relativo a la franja de la calle: alto H, y `s` de 0 (arriba) a 1 (abajo).

import type { AfluenciaParams } from './rhythm';

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// La calle entra en el último tramo del Viaje, debajo de esta altura de cámara.
const STREET_FROM_HEIGHT = 0.2;
// Lo que hay por encima de la calzada (postes y árboles) mide hasta 0,8 del alto de la calzada.
export const STREET_ABOVE = 0.8;
// Al final se ve el 95% de la calzada (el borde de abajo de la acera queda justo afuera), y el
// paisaje sube un poco menos que la calle, para que la ciudad asome sobre los árboles.
const SHOWN = 0.95;
const LIFT = 0.92;

/** Alto de la calzada (px): crece con la ventana, entre 90 y 150 px. */
export const streetHeight = (viewportHeight: number) => clamp(0.14 * viewportHeight, 90, 150);

/**
 * La franja de la calle con la cámara a una altura dada: el alto de la calzada (`height`, px),
 * dónde queda su borde de arriba (`top`), dónde empieza la capa con sus postes y árboles
 * (`layerTop`) y cuánto sube el paisaje con ella (`lift`). Antes de entrar queda entera debajo de
 * la pantalla. Cuando entra, la cámara llega al nivel de la acera: si el paisaje no subiera, la
 * calle taparía la ciudad.
 */
export function streetBand(height: number, viewportHeight: number) {
    const H = streetHeight(viewportHeight);
    const enter = smoothstep(clamp(1 - height / STREET_FROM_HEIGHT, 0, 1));
    const top = viewportHeight + STREET_ABOVE * H * (1 - enter) - SHOWN * H * enter;
    return {
        height: H,
        top,
        layerTop: top - STREET_ABOVE * H,
        lift: Math.max(0, viewportHeight - top) * LIFT,
    };
}

/** Qué parte del alzado sube cada capa: la ciudad, que está a nivel de calle, sube entera. */
export const LIFT_SHARE = { farRidge: 0.75, avila: 0.75, city: 1, towers: 1 } as const;

export type AgentKind = 'car' | 'bus' | 'moto' | 'walker';

export interface StreetAgent {
    kind: AgentKind;
    /** Línea de apoyo, en fracciones de H. */
    s: number;
    dir: 1 | -1;
    /** px/s con la calle de 200 px de alto; escala con H. */
    speed: number;
    scale: number;
    /** Posición inicial, en fracciones del recorrido (el ancho más un margen a cada lado). */
    x: number;
    /** Fase propia: el paso de los peatones, el zigzag de los motorizados. */
    phase: number;
}

/** Ancho y alto de cada tipo, en fracciones de H, antes de la escala de su carril. */
export const AGENT_SIZE: Record<AgentKind, [number, number]> = {
    car: [0.55, 0.19],
    bus: [0.78, 0.31],
    moto: [0.3, 0.24],
    walker: [0.11, 0.24],
};

/** A qué alto (fracción del vehículo) van sus faros y luces traseras. */
export const LIGHT_HEIGHT: Record<Exclude<AgentKind, 'walker'>, number> = {
    car: 0.36,
    bus: 0.28,
    moto: 0.5,
};

// Carriles: los de atrás van hacia la izquierda y los de adelante hacia la derecha.
export const STREET_LANES = { far: [0.47, 0.6], near: [0.76, 0.89] };
/**
 * Las líneas de cada acera, de atrás hacia adelante: la de atrás tiene tres y la de adelante dos.
 * `perSpan` es cuánta gente camina por cada H de ancho con la acera llena.
 */
export const SIDEWALK_LINES = [
    { s: 0.14, scale: 0.6, perSpan: 1.5 },
    { s: 0.2, scale: 0.66, perSpan: 1.5 },
    { s: 0.27, scale: 0.72, perSpan: 1.5 },
    { s: 0.965, scale: 0.94, perSpan: 1.7 },
    { s: 0.995, scale: 1, perSpan: 1.7 },
] as const;

/** Cada cuántos px va un poste con su árbol. */
export const POST_EVERY = 260;

/** La acera de atrás (detrás de los carriles); el resto es la de adelante. */
export const isBackSidewalk = (s: number) => s <= 0.5;

/** Cuánta gente camina por una línea de acera con esa Afluencia, en una ventana de `span` H. */
export const walkersOnLine = (afluencia: number, line: number, span: number) =>
    Math.round(afluencia * SIDEWALK_LINES[line].perSpan * span);

/**
 * Cuánta gente está parada (esperando, conversando) en una ventana de `span` H. Con lluvia se juntan
 * más bajo los árboles; con tormenta, nadie se queda.
 */
export function standingCount({ afluencia, lluvia }: AfluenciaParams, span: number): number {
    if (lluvia === 'tormenta') return 0;
    return Math.round(afluencia * (lluvia === 'lluvia' ? 1.4 : 0.45) * span);
}

/** Con lluvia, cuántos de cada 4 llevan paraguas. */
export const UMBRELLA_SHARE = 0.75;

/** Un color de paraguas (RGB de 0 a 1). */
export type Umbrella = readonly [number, number, number];

/** Colores de paraguas. */
export const UMBRELLA_COLORS: readonly Umbrella[] = [
    [0.12, 0.13, 0.16],
    [0.75, 0.16, 0.18],
    [0.16, 0.36, 0.7],
    [0.95, 0.72, 0.16],
    [0.2, 0.55, 0.42],
];

/** Alguien de la acera, quieto: dónde va (en H desde el borde) y si lleva paraguas. */
export interface StillWalker {
    u: number;
    s: number;
    dir: 1 | -1;
    scale: number;
    umbrella: Umbrella | null;
}

// Un número entre 0 y 1 que parece al azar, pero siempre igual para el mismo i: la SVG no cambia
// entre un render y otro.
const scatter = (i: number) => {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
};

/**
 * La gente de la Escena SVG, quieta: la misma cantidad que la Escena WebGL simula para esa Afluencia
 * (la que camina y la que está parada, con lluvia bajo los árboles), repartida con una fórmula en una
 * ventana de `span` H de ancho, con un árbol cada `treeEvery` H.
 */
export function crowdFormation(
    params: AfluenciaParams,
    span: number,
    treeEvery: number,
): StillWalker[] {
    const { afluencia, lluvia } = params;
    const out: StillWalker[] = [];
    SIDEWALK_LINES.forEach(({ s, scale }, line) => {
        const count = walkersOnLine(afluencia, line, span);
        for (let k = 0; k < count; k++) {
            const i = line * 97 + k;
            out.push({
                u: ((k + scatter(i) * 0.7) / count) * (span + 2) - 1,
                s,
                dir: scatter(i + 0.5) < 0.5 ? 1 : -1,
                scale: scale * (0.9 + scatter(i + 0.25) * 0.2),
                umbrella:
                    lluvia === 'lluvia' && scatter(i + 0.75) < UMBRELLA_SHARE
                        ? UMBRELLA_COLORS[Math.floor(scatter(i + 0.9) * UMBRELLA_COLORS.length)]
                        : null,
            });
        }
    });
    // La gente parada, en la línea de atrás y en la de adelante; con lluvia, bajo los árboles.
    const trees = Math.max(1, Math.floor(span / treeEvery));
    const standing = standingCount(params, span);
    for (let k = 0; k < standing; k++) {
        const line = SIDEWALK_LINES[k % 3 === 0 ? SIDEWALK_LINES.length - 1 : 2];
        const u =
            lluvia === 'lluvia'
                ? ((k % trees) + 0.5) * treeEvery + (scatter(k + 0.3) - 0.5) * 0.3
                : ((k + scatter(k + 0.3)) / standing) * span;
        out.push({
            u,
            s: line.s - 0.01,
            dir: scatter(k + 0.6) < 0.5 ? 1 : -1,
            scale: line.scale,
            umbrella: null,
        });
    }
    return out;
}

/** La formación de la calle, siempre la misma: un generador con semilla. */
export function streetAgents(): StreetAgent[] {
    let seed = 11;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
    };
    const agents: StreetAgent[] = [];
    // Cada carril va a una sola velocidad y con separación pareja, para que nadie se encime.
    const lane = (s: number, dir: 1 | -1, scale: number, count: number) => {
        const speed = 85 + rand() * 45;
        for (let i = 0; i < count; i++) {
            const r = rand();
            const kind: AgentKind = r < 0.2 ? 'bus' : r < 0.45 ? 'moto' : 'car';
            const x = (i + rand() * 0.35) / count;
            agents.push({ kind, s, dir, speed, scale, x, phase: rand() * 6.28 });
        }
    };
    STREET_LANES.far.forEach((s) => lane(s, -1, 0.88, 3));
    STREET_LANES.near.forEach((s) => lane(s, 1, 1, 3));
    // De atrás hacia adelante: así se dibujan en orden.
    return agents.sort((a, b) => a.s - b.s);
}

/**
 * Centro (x en px) de alguien de la calle a los `time` s: avanza en su sentido y, al salir por un
 * borde, vuelve a entrar por el otro. Con `time` 0 es la calle quieta de la Escena SVG.
 */
export function agentX(agent: StreetAgent, time: number, width: number, H: number): number {
    const span = width + 2 * H;
    const travelled = (agent.dir * agent.speed * (H / 200) * time) / span;
    const x = agent.x + travelled;
    return (x - Math.floor(x)) * span - H;
}
