// Las guacamayas que cruzan el cielo de la Escena WebGL. Vuelan en parejas, casi ala con ala:
// bandadas de parejas por encima del título y, a veces, vuelos que salen pequeños del Ávila y
// pasan grandes cerca de la cámara. Salen más al amanecer y por la tarde, como en Caracas; de Noche
// y con lluvia no vuelan.

export interface FlightContext {
    /** Hora decimal de Caracas. */
    hour: number;
    /** Lluvia o tormenta. */
    raining: boolean;
    /** `?guacamayas=ya`: un vuelo enseguida, aunque no sea hora pico. */
    forced: boolean;
}

// Las horas pico (Ritmos reales de Caracas, #88): del amanecer a las 8 y de las 4 a la puesta.
const PEAKS: Array<[from: number, to: number]> = [
    [5.5, 8],
    [16, 18.75],
];
const DAY = [5.5, 18.75];
// Fuera de los picos, de Día, pasa alguna pareja suelta.
const OFF_PEAK = 0.15;
// Segundos entre vuelos en hora pico, en promedio.
const PEAK_INTERVAL = 12;

/** Cuántos vuelos salen, de 0 (ninguno) a 1 (hora pico). */
export function flightRate({ hour, raining }: Pick<FlightContext, 'hour' | 'raining'>): number {
    if (raining || hour < DAY[0] || hour >= DAY[1]) return 0;
    return PEAKS.some(([from, to]) => hour >= from && hour < to) ? 1 : OFF_PEAK;
}

/** 0 azul y amarilla (Ara ararauna, la más común en Caracas), 1 roja, 2 roja y verde. */
export type Species = 0 | 1 | 2;

/** Un ave de un vuelo, en largos de ave respecto del que va adelante. */
export interface FlightBird {
    dx: number;
    dy: number;
    species: Species;
    phase: number;
    bob: number;
}

export interface Flight {
    /** `band`: por encima del título; `avila`: sale de la montaña y se acerca. */
    kind: 'band' | 'avila';
    t: number;
    duration: number;
    dir: 1 | -1;
    /** Recorrido en fracciones de la ventana, y escala al salir y al llegar. */
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    scale0: number;
    scale1: number;
    birds: FlightBird[];
}

/** Un ave en pantalla: centro (px), largo de cola a pico (px), sentido, aleteo y especie. */
export interface Bird {
    x: number;
    y: number;
    length: number;
    dir: 1 | -1;
    flap: number;
    species: Species;
}

// Largo de una guacamaya a escala 1, en px del encuadre.
const BIRD_LENGTH = 46;
// Aleteo lento y poco profundo, unas 2,2 veces por segundo.
const WINGBEATS = 2.2;

export class Flights {
    flights: Flight[] = [];
    private seed: number;
    private wait = 2;
    private forcedDone = false;

    constructor(seed = 1) {
        this.seed = seed;
    }

    private rand() {
        this.seed = (this.seed * 16807) % 2147483647;
        return this.seed / 2147483647;
    }

    private species(): Species {
        const r = this.rand();
        return r < 0.75 ? 0 : r < 0.9 ? 1 : 2;
    }

    // Una pareja: casi tocándose las alas y casi siempre de la misma especie.
    private pair(dx: number, dy: number): FlightBird[] {
        const species = this.species();
        const phase = this.rand() * Math.PI * 2;
        return [
            { dx, dy, species, phase, bob: this.rand() * Math.PI * 2 },
            {
                dx: dx - 0.35,
                dy: dy - 0.22,
                species,
                phase: phase + 0.5,
                bob: this.rand() * Math.PI * 2,
            },
        ];
    }

    private launch(): Flight {
        const dir: 1 | -1 = this.rand() < 0.5 ? 1 : -1;
        if (this.rand() < 0.3) {
            // Sale de detrás del Ávila, pequeña, y pasa grande cerca de la cámara.
            const from = 0.3 + this.rand() * 0.4;
            return {
                kind: 'avila',
                t: 0,
                duration: 9 + this.rand() * 3,
                dir,
                x0: from,
                x1: from + dir * (0.9 + this.rand() * 0.3),
                y0: 0.38 + this.rand() * 0.05,
                y1: 0.05 + this.rand() * 0.15,
                scale0: 0.25,
                scale1: 1.6,
                birds:
                    this.rand() < 0.3
                        ? [...this.pair(0, 0), ...this.pair(-1.6, 0.6)]
                        : this.pair(0, 0),
            };
        }
        // Por encima del título: una bandada de 3 a 6 parejas en fila suelta, o una pareja sola.
        const pairs = this.rand() < 0.6 ? 3 + Math.floor(this.rand() * 4) : 1;
        const birds: FlightBird[] = [];
        for (let i = 0; i < pairs; i++) {
            const dy = i === 0 ? 0 : (i % 2 ? 1 : -1) * (0.3 + this.rand() * 0.6);
            birds.push(...this.pair(-i * (1.1 + this.rand() * 0.8), dy));
        }
        // Entre la cabecera y el título: de 0,1 a 0,16 del alto de la ventana.
        const y0 = 0.1 + this.rand() * 0.05;
        return {
            kind: 'band',
            t: 0,
            duration: 13 + this.rand() * 5,
            dir,
            x0: dir > 0 ? -0.1 : 1.1,
            x1: dir > 0 ? 1.25 : -0.25,
            y0,
            y1: y0 + (this.rand() - 0.5) * 0.04,
            scale0: 0.85 + this.rand() * 0.3,
            scale1: 0,
            birds,
        };
    }

    step(dt: number, context: FlightContext) {
        for (const f of this.flights) f.t += dt;
        // Se van cuando la última del grupo sale de la ventana.
        this.flights = this.flights.filter((f) => f.t < f.duration + 3);
        if (context.raining) return;
        if (context.forced && !this.forcedDone) {
            this.forcedDone = true;
            this.flights.push(this.launch());
            return;
        }
        const rate = flightRate(context);
        if (rate <= 0) return;
        this.wait -= dt * rate;
        if (this.wait <= 0) {
            this.flights.push(this.launch());
            this.wait = PEAK_INTERVAL * (0.6 + this.rand() * 0.8);
        }
    }

    /** Las aves en una ventana de `width` × `height` px, de la más lejana a la más cercana. */
    birds(width: number, height: number, time: number, scale: number): Bird[] {
        const out: Bird[] = [];
        for (const f of this.flights) {
            const u = Math.min(1, f.t / f.duration);
            const approaching = f.kind === 'avila';
            // Las que salen del Ávila crecen al acercarse y bajan la curva hacia la cámara.
            const s = (approaching ? f.scale0 + (f.scale1 - f.scale0) * u * u : f.scale0) * scale;
            const length = BIRD_LENGTH * s;
            const cx = (f.x0 + (f.x1 - f.x0) * u) * width;
            const cy =
                (f.y0 + (f.y1 - f.y0) * (approaching ? Math.sin((u * Math.PI) / 2) : u)) * height;
            for (const b of f.birds) {
                out.push({
                    x: cx + f.dir * b.dx * length,
                    y: cy + b.dy * length + Math.sin(time * 1.3 + b.bob) * 0.12 * length,
                    length,
                    dir: f.dir,
                    flap: time * Math.PI * 2 * WINGBEATS + b.phase,
                    species: b.species,
                });
            }
        }
        return out.sort((a, b) => a.length - b.length);
    }
}

/** `?guacamayas=ya`: para pruebas y previews, también en producción. */
export const flightForced = (search: string) =>
    new URLSearchParams(search).get('guacamayas') === 'ya';
