// Genera el perfil de El Ávila visto desde Los Próceres a partir de datos reales de elevación.
//
// Fuente: SRTM 1" de la NASA (dominio público), tile N10W067. No se versiona; se descarga de
//   https://s3.amazonaws.com/elevation-tiles-prod/skadi/N10/N10W067.hgt.gz
// Uso: pnpm scene:avila <ruta a N10W067.hgt.gz o .hgt>
//
// Para cada azimut, cada 0,5°, busca el máximo ángulo de elevación a lo largo del rayo, con
// curvatura terrestre y refracción (k = 0,87) y el ojo a 40 m sobre el terreno. Hay tres
// crestas por distancia (≤3 km, ≤6,5 km y el horizonte completo) y los Hitos en su azimut
// real. Escribe src/app/scene/avila-data.ts, que el build usa tal cual.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import prettier from 'prettier';

const SIDE = 3601;
const TILE_LAT = 10;
const TILE_LON = -67;
const EARTH_RADIUS = 6371000;
const CURVATURE = 0.87;
const EYE_HEIGHT = 40;
const STEP = 15;
const MAX_DISTANCE = 40000;
const BANDS = [3000, 6500, Infinity];

const VIEWPOINT = { name: 'Los Próceres', lat: 10.4745, lon: -66.9065 };
const AZIMUTH: [number, number] = [-8, 72];
const AZIMUTH_STEP = 0.5;

// Coordenadas de los Hitos; `height` suma lo que el terreno no tiene (edificios).
const LANDMARKS = {
    humboldt: { lat: 10.5414, lon: -66.8764, height: 0 },
    upperStation: { lat: 10.5402, lon: -66.8766, height: 0 },
    lowerStation: { lat: 10.5082, lon: -66.8798, height: 0 },
    parqueCentral: { lat: 10.4986, lon: -66.901, height: 197 },
} as const;

export function readTile(file: string): Int16Array {
    const raw = fs.readFileSync(file);
    const buf = file.endsWith('.gz') ? zlib.gunzipSync(raw) : raw;
    const out = new Int16Array(SIDE * SIDE);
    for (let i = 0; i < out.length; i++) out[i] = buf.readInt16BE(i * 2);
    return out;
}

function elevationAt(tile: Int16Array, lat: number, lon: number): number {
    const r = (TILE_LAT + 1 - lat) * (SIDE - 1);
    const c = (lon - TILE_LON) * (SIDE - 1);
    const r0 = Math.max(0, Math.min(SIDE - 2, Math.floor(r)));
    const c0 = Math.max(0, Math.min(SIDE - 2, Math.floor(c)));
    const fr = r - r0;
    const fc = c - c0;
    const at = (rr: number, cc: number) => Math.max(0, tile[rr * SIDE + cc]);
    return (
        at(r0, c0) * (1 - fr) * (1 - fc) +
        at(r0, c0 + 1) * (1 - fr) * fc +
        at(r0 + 1, c0) * fr * (1 - fc) +
        at(r0 + 1, c0 + 1) * fr * fc
    );
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

function elevationAngle(height: number, eye: number, distance: number): number {
    const drop = (CURVATURE * distance * distance) / (2 * EARTH_RADIUS);
    return toDeg(Math.atan2(height - eye - drop, distance));
}

function offset(lat: number, lon: number, azimuth: number, distance: number) {
    const a = toRad(azimuth);
    return {
        lat: lat + toDeg((distance * Math.cos(a)) / EARTH_RADIUS),
        lon: lon + toDeg((distance * Math.sin(a)) / (EARTH_RADIUS * Math.cos(toRad(lat)))),
    };
}

export function computeProfiles(tile: Int16Array) {
    const ground = elevationAt(tile, VIEWPOINT.lat, VIEWPOINT.lon);
    const eye = ground + EYE_HEIGHT;
    const count = Math.round((AZIMUTH[1] - AZIMUTH[0]) / AZIMUTH_STEP) + 1;
    const profiles = BANDS.map(() => new Array<number>(count).fill(-1));
    for (let i = 0; i < count; i++) {
        const az = AZIMUTH[0] + i * AZIMUTH_STEP;
        for (let d = STEP; d <= MAX_DISTANCE; d += STEP) {
            const p = offset(VIEWPOINT.lat, VIEWPOINT.lon, az, d);
            if (p.lat >= TILE_LAT + 1 || p.lon >= TILE_LON + 1) break;
            const angle = elevationAngle(elevationAt(tile, p.lat, p.lon), eye, d);
            BANDS.forEach((band, b) => {
                if (d <= band && angle > profiles[b][i]) profiles[b][i] = angle;
            });
        }
    }

    const landmarks = Object.fromEntries(
        Object.entries(LANDMARKS).map(([name, l]) => {
            const north = toRad(l.lat - VIEWPOINT.lat) * EARTH_RADIUS;
            const east =
                toRad(l.lon - VIEWPOINT.lon) * EARTH_RADIUS * Math.cos(toRad(VIEWPOINT.lat));
            const distance = Math.hypot(north, east);
            const height = elevationAt(tile, l.lat, l.lon) + l.height;
            return [name, [toDeg(Math.atan2(east, north)), elevationAngle(height, eye, distance)]];
        }),
    ) as Record<keyof typeof LANDMARKS, [number, number]>;

    return { ground, profiles, landmarks };
}

const round = (n: number) => Math.round(n * 100) / 100;

async function writeModule(result: ReturnType<typeof computeProfiles>, out: string) {
    const json = (v: unknown) => JSON.stringify(v);
    const landmarks = Object.entries(result.landmarks)
        .map(([k, [az, ang]]) => `    ${k}: ${json([round(az), round(ang)])},`)
        .join('\n');
    const source = `// GENERADO por scripts/avila-profile.ts desde SRTM 1" (NASA, dominio público), tile N10W067.
// No editar a mano. Ángulos de elevación en grados, cada ${AZIMUTH_STEP}° de azimut.
export const VIEWPOINT = ${json({ name: VIEWPOINT.name, lat: VIEWPOINT.lat, lon: VIEWPOINT.lon, ground: Math.round(result.ground) })} as const;

export const AZIMUTH: readonly [number, number] = ${json(AZIMUTH)};

/** Crestas del Ávila: relieve hasta 3 km, hasta 6,5 km y el horizonte completo. */
export const RIDGE_ANGLES: readonly (readonly number[])[] = [
${result.profiles.map((p) => `    ${json(p.map(round))},`).join('\n')}
];

/** Hitos como [azimut, ángulo de elevación]. */
export const LANDMARK_ANGLES = {
${landmarks}
} as const;
`;
    const options = await prettier.resolveConfig(out);
    fs.writeFileSync(out, await prettier.format(source, { ...options, filepath: out }));
}

const input = process.argv.slice(2).find((a) => a !== '--');
if (input) {
    const result = computeProfiles(readTile(input));
    const out = path.resolve('src/app/scene/avila-data.ts');
    await writeModule(result, out);
    console.log(`✓ perfil del Ávila escrito en ${path.relative(process.cwd(), out)}`);
}
