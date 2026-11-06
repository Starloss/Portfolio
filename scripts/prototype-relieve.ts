// PROTOTIPO (research/impeccable, mapa #104): hornea el relieve de El Ávila y el valle de Caracas
// para la Escena 3D de prueba (?escena=relieve).
//
// Fuente: SRTM 1" de la NASA (dominio público), tile N10W067, el mismo de avila-profile.ts:
//   https://s3.amazonaws.com/elevation-tiles-prod/skadi/N10/N10W067.hgt.gz
// Uso: pnpm vite-node scripts/prototype-relieve.ts -- <ruta a N10W067.hgt.gz>
//
// Recorta la ventana entre BOUNDS cada STRIDE muestras (~60 m) y escribe
// public/prototype/relieve/altura.bin (Uint16 little-endian, metros, fila 0 al norte) y meta.json.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SIDE = 3601;
const TILE_LAT = 10;
const TILE_LON = -67;
const BOUNDS = { north: 10.62, south: 10.44, west: -67.0, east: -66.74 };
const STRIDE = 2;

// Copia de readTile de avila-profile.ts: importarlo lo ejecutaría y reescribiría avila-data.ts.
function readTile(file: string): Int16Array {
    const raw = fs.readFileSync(file);
    const buf = file.endsWith('.gz') ? zlib.gunzipSync(raw) : raw;
    const out = new Int16Array(SIDE * SIDE);
    for (let i = 0; i < out.length; i++) out[i] = buf.readInt16BE(i * 2);
    return out;
}

const file = process.argv.at(-1);
if (!file || !fs.existsSync(file)) throw new Error('Falta la ruta al tile N10W067.hgt(.gz)');
const tile = readTile(file);

const row = (lat: number) => Math.round((TILE_LAT + 1 - lat) * (SIDE - 1));
const col = (lon: number) => Math.round((lon - TILE_LON) * (SIDE - 1));
const r0 = row(BOUNDS.north);
const r1 = row(BOUNDS.south);
const c0 = col(BOUNDS.west);
const c1 = col(BOUNDS.east);
const rows = Math.floor((r1 - r0) / STRIDE) + 1;
const cols = Math.floor((c1 - c0) / STRIDE) + 1;

const out = new Uint16Array(rows * cols);
let max = 0;
for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
        const h = Math.max(0, tile[(r0 + r * STRIDE) * SIDE + (c0 + c * STRIDE)]);
        out[r * cols + c] = h;
        max = Math.max(max, h);
    }

const dir = path.resolve('public/prototype/relieve');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'altura.bin'), Buffer.from(out.buffer));
const meta = {
    rows,
    cols,
    north: TILE_LAT + 1 - r0 / (SIDE - 1),
    south: TILE_LAT + 1 - (r0 + (rows - 1) * STRIDE) / (SIDE - 1),
    west: TILE_LON + c0 / (SIDE - 1),
    east: TILE_LON + (c0 + (cols - 1) * STRIDE) / (SIDE - 1),
    max,
    source: 'SRTM 1" NASA (dominio público), tile N10W067',
};
fs.writeFileSync(path.join(dir, 'meta.json'), `${JSON.stringify(meta, null, 4)}\n`);
console.log(`${cols}×${rows}, máximo ${max} m`);
