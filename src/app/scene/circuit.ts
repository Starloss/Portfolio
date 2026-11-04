// El Teleférico como circuito de desembrague, igual que el real: las cabinas suben por un cable y
// bajan por otro, paralelo. En la línea van rápidas y parejas; en cada estación se sueltan del
// cable y van despacio, así que se juntan al llegar. Función pura del tiempo: la Escena WebGL la
// dibuja en movimiento.
import { CABLE_TOWERS } from './geometry';

export const CIRCUIT = {
    // Impar: así las que suben y las que bajan no se cruzan siempre a la misma altura.
    cabins: 17,
    /** Segundos de un viaje de una estación a la otra (el real dura unos 15 min). */
    tripSeconds: 55,
};

// Cada estación ocupa este tramo del cable (en t) y este tiempo de la vuelta.
const STATION_LENGTH = 0.06;
const STATION_TIME = 0.12;

export interface CircuitCabin {
    /** Punto del cable, de 0 (estación de abajo) a 1 (Waraira Repano). */
    t: number;
    /** 0 sube por el cable de adelante; 1 baja por el de atrás. */
    line: 0 | 1;
    /** Cuánto se inclina (radianes) al mecerse. */
    sway: number;
    /** 0 dentro de una estación, donde se oculta; 1 en la línea. */
    alpha: number;
}

// El vaivén: amplitud (radianes) al salir de una estación y al pasar una torre, y cuánto tarda en
// apagarse a lo largo del cable.
const SWAY_FROM_STATION = 0.14;
const SWAY_FROM_TOWER = 0.07;
const SWAY_DAMPING = 30;
const SWAY_FREQUENCY = 70;

// Cuánto se mece una cabina que pasó hace `d` (en t) por donde la sacudió.
const swing = (d: number, amplitude: number) =>
    d >= 0 && d < 0.25 ? amplitude * Math.exp(-d * SWAY_DAMPING) * Math.sin(d * SWAY_FREQUENCY) : 0;

function swayAt(t: number, line: 0 | 1): number {
    // Lo recorrido desde un punto, en el sentido de la marcha.
    const since = (x: number) => (line === 0 ? t - x : x - t);
    const leftStation = since(line === 0 ? STATION_LENGTH / 2 : 1 - STATION_LENGTH / 2);
    const tower = Math.min(...CABLE_TOWERS.map(since).filter((d) => d >= 0), Infinity);
    const sway = swing(leftStation, SWAY_FROM_STATION) + swing(tower, SWAY_FROM_TOWER);
    return line === 0 ? sway : -sway;
}

// Se oculta en el último tramo de la estación.
const alphaAt = (t: number) => Math.min(1, Math.max(0, (Math.min(t, 1 - t) - 0.005) / 0.025));

// La vuelta en tramos, cada uno con su parte del tiempo y su parte del recorrido (0 a 2: sube de
// 0 a 1 y baja de 1 a 2): media estación de abajo, subida, estación de arriba, bajada y la otra
// media estación de abajo.
const LINE_TIME = (1 - 2 * STATION_TIME) / 2;
const LINE_LENGTH = 1 - STATION_LENGTH;
const STRETCHES: Array<[time: number, length: number]> = [
    [STATION_TIME / 2, STATION_LENGTH / 2],
    [LINE_TIME, LINE_LENGTH],
    [STATION_TIME, STATION_LENGTH],
    [LINE_TIME, LINE_LENGTH],
    [STATION_TIME / 2, STATION_LENGTH / 2],
];

/** Dónde va (0 a 2) una cabina a esa fracción (0 a 1) de la vuelta. */
function along(phase: number): number {
    let time = 0;
    let at = 0;
    for (const [duration, length] of STRETCHES) {
        if (phase <= time + duration) return at + ((phase - time) / duration) * length;
        time += duration;
        at += length;
    }
    return 2;
}

/** Las cabinas a los `time` s. */
export function circuitAt(time: number): CircuitCabin[] {
    const lap = CIRCUIT.tripSeconds * 2;
    const elapsed = (time % lap) / lap;
    return Array.from({ length: CIRCUIT.cabins }, (_, i) => {
        const s = along((elapsed + i / CIRCUIT.cabins) % 1);
        const line = s < 1 ? 0 : 1;
        const t = line === 0 ? s : 2 - s;
        return { t, line, sway: swayAt(t, line), alpha: alphaAt(t) };
    });
}
