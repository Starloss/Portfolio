// La Avenida Bolívar, al pie de las Torres de Parque Central: la capa más cercana del Viaje de
// cámara. Funciones puras que comparten la Escena SVG (quieta) y la WebGL (animada). Todo en px de
// pantalla, relativo a la franja de la calle: alto H, y `s` de 0 (arriba) a 1 (abajo).

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
export const STREET_WALKS = { back: 0.27, front: 0.995 };

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
    const walkers = (s: number, scale: number, count: number) => {
        for (let i = 0; i < count; i++) {
            agents.push({
                kind: 'walker',
                s,
                dir: rand() < 0.5 ? 1 : -1,
                speed: 22 + rand() * 14,
                scale: scale * (0.9 + rand() * 0.2),
                x: rand(),
                phase: rand() * 6.28,
            });
        }
    };
    walkers(STREET_WALKS.back, 0.72, 7);
    walkers(STREET_WALKS.front, 1, 5);
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
