// El Tráfico de la Avenida Bolívar en la Escena WebGL, según su nivel (rhythm.ts). Cada vehículo
// frena según el de adelante (un modelo de seguimiento, IDM), y la cola nace en un cuello de
// botella pasado el borde de salida: desde cargada va a tirones, y algún conductor frena sin motivo,
// lo que crea ondas. En la tranca, las motos filtran entre los carriles. Los vehículos solo entran
// y salen por los bordes. Todo en altos de calzada (H), como street.ts.
import type { NivelTrafico } from './rhythm';
import { AGENT_SIZE, filterLine, laneX, TRAFFIC_LANES, type VehicleKind } from './street';

export interface Vehicle {
    kind: VehicleKind;
    /** Línea de apoyo, en fracciones de H. */
    s: number;
    dir: 1 | -1;
    scale: number;
    /** Centro, en H a lo largo del carril y en el sentido de la marcha (entra en -1). */
    u: number;
    /** Velocidad, en H/s. */
    v: number;
    length: number;
    phase: number;
    braking: boolean;
    /** Una moto que avanza entre los carriles, por fuera de la cola. */
    filtering: boolean;
    /** Velocidad que quiere llevar este conductor. */
    wants: number;
}

// Cuánto tráfico es cada nivel, de 0 a 1, para la simulación.
const LEVEL: Record<NivelTrafico, number> = { vacia: 0, fluida: 0.3, cargada: 0.6, tranca: 0.92 };

// El modelo de seguimiento, en H y segundos.
const ACCEL = 0.55;
const BRAKE = 1.1;
const MIN_GAP = 0.09;
const HEADWAY = 0.7;
// Las motos que filtran van entre los dos carriles de su sentido (filterLine), a paso firme.
const FILTER_SPEED = 0.28;
// Cuántas motos por segundo entran filtrando en cada sentido, y a qué distancia (en H) de la anterior.
const MOTOS_FILTERING = 0.2;
const MOTO_SPACING = 1.2;

interface Lane {
    s: number;
    dir: 1 | -1;
    scale: number;
    /** Velocidad libre del carril. */
    free: number;
    phase: number;
    /** [0] es el que va más adelante. */
    vehicles: Vehicle[];
}

function idm(me: Vehicle, wants: number, gap: number, dv: number) {
    const desired =
        MIN_GAP + Math.max(0, me.v * HEADWAY + (me.v * dv) / (2 * Math.sqrt(ACCEL * BRAKE)));
    return (
        ACCEL * (1 - (me.v / Math.max(0.01, wants)) ** 4 - (desired / Math.max(0.005, gap)) ** 2)
    );
}

export class Traffic {
    private lanes: Lane[];
    private filtering: Vehicle[] = [];
    private level = 0;
    private nivel: NivelTrafico = 'vacia';
    private seed = 7;
    private t = 0;
    private started = false;

    constructor() {
        this.lanes = TRAFFIC_LANES.map(({ s, dir, scale }, i) => this.lane(s, dir, scale, i));
    }

    private rand() {
        this.seed = (this.seed * 16807) % 2147483647;
        return this.seed / 2147483647;
    }

    private lane(s: number, dir: 1 | -1, scale: number, i: number): Lane {
        return { s, dir, scale, free: 0.5 + this.rand() * 0.2, phase: i * 5.3, vehicles: [] };
    }

    /** Todos los vehículos, de atrás hacia adelante: así se dibujan en orden. */
    get vehicles(): Vehicle[] {
        return [...this.lanes.flatMap((l) => l.vehicles), ...this.filtering].sort(
            (a, b) => a.s - b.s,
        );
    }

    /** Cambia el nivel. La primera vez la calle ya arranca con su tráfico, no vacía. */
    set(nivel: NivelTrafico, span: number) {
        this.level = LEVEL[nivel];
        this.nivel = nivel;
        if (this.started) return;
        this.started = true;
        for (let i = 0; i < 90 * 20; i++) this.step(0.05, span);
    }

    private vehicle(lane: Lane, kind: VehicleKind, v: number, filtering: boolean): Vehicle {
        const length = AGENT_SIZE[kind][0] * lane.scale;
        const wants =
            lane.free * (kind === 'moto' ? 1.15 : kind === 'bus' ? 0.85 : 0.9 + this.rand() * 0.2);
        return {
            kind,
            s: filtering ? filterLine(lane.dir) : lane.s,
            dir: lane.dir,
            scale: lane.scale,
            u: -1 - length / 2,
            v,
            length,
            phase: this.rand() * Math.PI * 2,
            braking: false,
            filtering,
            wants,
        };
    }

    private spawn(lane: Lane, v: number) {
        const r = this.rand();
        // En la tranca, las motos no hacen la cola: entran por su cuenta, entre los carriles.
        const moto = this.nivel !== 'tranca' && r < 0.42 && r >= 0.18;
        const kind: VehicleKind = r < 0.18 ? 'bus' : moto ? 'moto' : 'car';
        lane.vehicles.push(this.vehicle(lane, kind, v, false));
    }

    /** Avanza `dt` s en una ventana de `span` H de ancho. */
    step(dt: number, span: number) {
        this.t += dt;
        const exit = span + 1.5;
        for (const lane of this.lanes) {
            this.stepLane(lane, dt, span);
            lane.vehicles = lane.vehicles.filter((v) => v.u - v.length / 2 < exit);
        }
        // En la tranca, por cada sentido, cada tanto entra una moto entre los carriles.
        if (this.nivel === 'tranca') {
            for (const lane of [this.lanes[0], this.lanes[2]]) {
                // Una detrás de otra, nunca encimadas.
                const last = [...this.filtering].reverse().find((m) => m.dir === lane.dir);
                const room = !last || last.u > -1 + MOTO_SPACING;
                if (room && this.rand() < dt * MOTOS_FILTERING) {
                    this.filtering.push(this.vehicle(lane, 'moto', FILTER_SPEED, true));
                }
            }
        }
        for (const m of this.filtering) {
            m.v = FILTER_SPEED;
            m.u += m.v * dt;
        }
        this.filtering = this.filtering.filter((m) => m.u - m.length / 2 < exit);
    }

    private stepLane(lane: Lane, dt: number, span: number) {
        const L = this.level;
        const vs = lane.vehicles;
        // El cuello de botella, pasado el borde de salida: su velocidad baja con el nivel y, desde
        // cargada, va a tirones (para y arranca).
        const slowFrom = span + 0.4;
        const base = lane.free * (0.12 + 0.88 * (1 - L));
        const pulse = Math.min(1, Math.max(0, (L - 0.4) / 0.5));
        const stop = 0.5 - 0.5 * Math.sin(this.t * 0.3 + lane.phase);
        const slowWants = Math.max(0.004, base * (1 - pulse * stop));
        for (let i = 0; i < vs.length; i++) {
            const me = vs[i];
            const ahead = vs[i - 1];
            const gap = ahead ? ahead.u - ahead.length / 2 - (me.u + me.length / 2) : Infinity;
            const dv = ahead ? me.v - ahead.v : 0;
            const wants = me.u > slowFrom ? Math.min(me.wants, slowWants) : me.wants;
            let a = idm(me, wants, gap, dv);
            // Con tráfico, algún conductor frena sin motivo: de ahí nacen las ondas.
            if (L > 0.3 && this.rand() < dt * 0.08 * L) a = -BRAKE * 1.5;
            a = Math.min(ACCEL, Math.max(-BRAKE * 3, a));
            me.braking = a < -0.12;
            me.v = Math.max(0, me.v + a * dt);
            me.u += me.v * dt;
        }
        // Entra por el borde, si hay lugar, más seguido con más nivel.
        const last = vs[vs.length - 1];
        const room = last ? last.u - last.length / 2 + 1 : Infinity;
        const entering = last ? Math.min(lane.free, last.v + 0.05) : lane.free;
        const rate = 0.04 + 0.7 * L ** 1.5;
        if (room > MIN_GAP + entering * HEADWAY + 0.05 && this.rand() < rate * dt) {
            this.spawn(lane, entering);
        }
    }
}

/** Centro en px de un vehículo. */
export const vehicleX = (v: Vehicle, width: number, H: number) => laneX(v.dir, v.u, width, H);
