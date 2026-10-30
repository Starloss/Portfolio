// Colores de la Escena. Día y Noche comparten la geometría; en el sitio, los componentes pintan
// con variables CSS (VARS) y la raíz de la Escena define sus valores con DAY o NIGHT. Las
// imágenes OG, que se rasterizan sin CSS, usan DAY directamente.
const DAY_COLORS = {
    skyTop: '#5ea8dc',
    skyBottom: '#cfe8f5',
    skyHigh: '#1f5f99',
    cloud: 'rgba(255,255,255,0.9)',
    ridgeFar: '#9fbfb0',
    ridgeMid: '#6f9f86',
    ridgeNear: '#3f7a5c',
    cityBack: '#7d8f9c',
    cityFront: '#5a6c79',
    towers: '#4f6170',
    towersLight: '#6b7f8f',
    humboldt: '#f2f4f2',
    humboldtShade: '#c9d0d3',
    humboldtBands: '#9aa7ad',
    cable: '#3a4652',
    cabin: '#d62828',
    cabinWindow: '#f7f7f7',
    station: '#e9ecef',
    // Avenida Bolívar.
    sidewalk: '#78858f',
    curb: '#a3a8ad',
    road: '#4f5761',
    laneMark: '#ebe6cc',
    centerLine: '#f2c733',
    lamppost: '#293642',
    tree: '#2b4a3b',
    vehicle: '#26303d',
    vehicleWindow: '#59667a',
    busWindow: '#59667a',
};

export type ScenePalette = typeof DAY_COLORS;

export const DAY: ScenePalette = DAY_COLORS;

export const NIGHT: ScenePalette = {
    skyTop: '#050a1a',
    skyBottom: '#1b2c52',
    skyHigh: '#01030a',
    cloud: 'rgba(160,180,215,0.35)',
    ridgeFar: '#1c2c44',
    ridgeMid: '#142235',
    ridgeNear: '#0c1826',
    cityBack: '#13202f',
    cityFront: '#0c1622',
    towers: '#0e1925',
    towersLight: '#1a2a3a',
    humboldt: '#fff1c4',
    humboldtShade: '#e8c97a',
    humboldtBands: '#ffcf6e',
    cable: '#4b5a6b',
    cabin: '#ffcf6e',
    cabinWindow: '#fff6dc',
    station: '#ffe8b0',
    sidewalk: '#0f141f',
    curb: '#1c212b',
    road: '#080b12',
    laneMark: '#524d3d',
    centerLine: '#614d14',
    lamppost: '#030509',
    tree: '#030608',
    vehicle: '#030406',
    vehicleWindow: '#1f1a0e',
    busWindow: '#d9b261',
};

/** Colores exclusivos de Noche: no cambian con el tema porque solo existen de Noche. */
export const NIGHT_LIGHTS = {
    window: '#ffcf6e',
    beacon: '#ff4d4d',
    star: '#ffffff',
    moon: '#f4f1e4',
    halo: '#ffe3a0',
    headlight: '#fff7e0',
    taillight: '#ff1f1a',
} as const;

const varName = (key: string) => `--scene-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

export const VARS = Object.fromEntries(
    Object.keys(DAY_COLORS).map((key) => [key, `var(${varName(key)})`]),
) as ScenePalette;

/** Declaraciones de variables CSS para la raíz de la Escena. */
export function paletteVars(palette: ScenePalette): Record<string, string> {
    return Object.fromEntries(Object.entries(palette).map(([key, value]) => [varName(key), value]));
}
