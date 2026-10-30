// Geometría de la Escena en coordenadas SVG (1600 × 900): El Ávila visto desde Los Próceres
// y los Hitos en su azimut real (composición B · Ávila monumental).
import { AZIMUTH, LANDMARK_ANGLES, RIDGE_ANGLES } from './avila-data';

export const VIEW = { width: 1600, height: 900 } as const;

// Ángulo 0° = altura del ojo, a nivel de la ciudad.
const HORIZON = 770;
const PX_PER_DEGREE = VIEW.width / (AZIMUTH[1] - AZIMUTH[0]);
const HIGHEST_ANGLE = Math.max(...RIDGE_ANGLES[2]);
// Exageración vertical automática: la cumbre más alta llega al 58% del alto del encuadre.
const EXAGGERATION = (0.58 * VIEW.height) / (HIGHEST_ANGLE * PX_PER_DEGREE);

const xOf = (azimuth: number) => (azimuth - AZIMUTH[0]) * PX_PER_DEGREE;
const yOf = (angle: number) => HORIZON - angle * PX_PER_DEGREE * EXAGGERATION;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Alto de cada cresta (y SVG) cada 0,5° de azimut, de la más cercana a la más lejana. */
const [NEAR, MID, FAR] = RIDGE_ANGLES.map((profile) => profile.map(yOf));
const SAMPLE_STEP = VIEW.width / (FAR.length - 1);

const ridgePath = (ys: readonly number[]) =>
    `M0 ${VIEW.height} ` +
    ys.map((y, i) => `L${round1(i * SAMPLE_STEP)} ${round1(y)}`).join(' ') +
    ` L${VIEW.width} ${VIEW.height} Z`;

export const RIDGE_PATHS = { near: ridgePath(NEAR), mid: ridgePath(MID), far: ridgePath(FAR) };

const AZIMUTH_STEP = (AZIMUTH[1] - AZIMUTH[0]) / (FAR.length - 1);
const crestAt = (azimuth: number) =>
    FAR[Math.max(0, Math.min(FAR.length - 1, Math.round((azimuth - AZIMUTH[0]) / AZIMUTH_STEP)))];

// Escala de las formas de los Hitos (valor del prototipo): así quedan unas 3–4 veces su tamaño
// angular real, para que se lean.
export const LANDMARK_SCALE = 1.6;

const [humboldtAz] = LANDMARK_ANGLES.humboldt;
export const HUMBOLDT = { x: xOf(humboldtAz), y: crestAt(humboldtAz) + 3 };

// Medidas del Humboldt en coordenadas locales (base en 0,0), antes de escalar.
export const HUMBOLDT_SHAPE = { width: 15, height: 44, antenna: 18, haloRadius: 34 } as const;

const [towersAz, towersAngle] = LANDMARK_ANGLES.parqueCentral;
export const TOWERS = {
    x: xOf(towersAz),
    base: VIEW.height - 20,
    // Alto con la misma exageración, con un mínimo para que se lean.
    height: Math.max(70, Math.min(170, (HORIZON - yOf(towersAngle)) * 1.1 + 40)),
    scale: 1.15,
};

// Teleférico: de la estación de abajo, apoyada en la ladera visible (Maripérez queda tapada
// desde Los Próceres), a Waraira Repano, junto al Humboldt. El cable cuelga con una comba.
const [lowerAz, lowerAngle] = LANDMARK_ANGLES.lowerStation;
const [upperAz] = LANDMARK_ANGLES.upperStation;
const CABLE_DROP = 12;
const SAG = 0.06;
export const STATIONS = {
    lower: { x: xOf(lowerAz), y: Math.min(HORIZON + 10, yOf(Math.max(lowerAngle, 0.2))) },
    upper: { x: xOf(upperAz) + 8, y: crestAt(upperAz) + 4 },
};
const cableFrom = { x: STATIONS.lower.x, y: STATIONS.lower.y - CABLE_DROP };
const cableTo = { x: STATIONS.upper.x, y: STATIONS.upper.y - CABLE_DROP };
const cableControl = {
    x: (cableFrom.x + cableTo.x) / 2,
    y: (cableFrom.y + cableTo.y) / 2 + Math.abs(cableFrom.y - cableTo.y) * SAG,
};

export const CABLE_PATH = `M${round1(cableFrom.x)} ${round1(cableFrom.y)} Q ${round1(cableControl.x)} ${round1(cableControl.y)} ${round1(cableTo.x)} ${round1(cableTo.y)}`;

/** Punto del cable para t de 0 (estación de abajo) a 1 (Waraira Repano). */
export function cablePoint(t: number): { x: number; y: number } {
    const u = 1 - t;
    return {
        x: u * u * cableFrom.x + 2 * u * t * cableControl.x + t * t * cableTo.x,
        y: u * u * cableFrom.y + 2 * u * t * cableControl.y + t * t * cableTo.y,
    };
}

/**
 * Borde superior del paisaje (y SVG) en cada muestra de azimut: la cresta lejana más el
 * Humboldt, y de Noche también su halo. Es lo que no puede quedar detrás del texto del Hero.
 */
export function skyline(night: boolean): number[] {
    const s = LANDMARK_SCALE;
    const shapes = [
        {
            halfWidth: (HUMBOLDT_SHAPE.width / 2 + 2) * s,
            top: HUMBOLDT.y - (HUMBOLDT_SHAPE.height + HUMBOLDT_SHAPE.antenna) * s,
        },
    ];
    if (night) {
        const r = HUMBOLDT_SHAPE.haloRadius * s;
        shapes.push({ halfWidth: r, top: HUMBOLDT.y - (HUMBOLDT_SHAPE.height / 2) * s - r });
    }
    return FAR.map((y, i) => {
        const x = i * SAMPLE_STEP;
        return shapes.reduce(
            (top, shape) =>
                Math.abs(x - HUMBOLDT.x) <= shape.halfWidth ? Math.min(top, shape.top) : top,
            y,
        );
    });
}

// Cabinas que avanzan solas por un tramo del cable, ida y vuelta.
export const MOVING_CABINS = [
    { from: 0.56, to: 0.7 },
    { from: 0.86, to: 0.74 },
];
