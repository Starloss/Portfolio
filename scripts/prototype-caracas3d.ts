// PROTOTIPO (research/impeccable, mapa #104, ticket "Prototipo de la Caracas 3D en three.js"):
// hornea los datos de la Escena 3D (?escena=3d) en public/prototype/caracas3d/.
//
// Fuentes (ver docs/research/caracas-3d.md):
//   - Relieve: Copernicus GLO-30 (© DLR e.V. 2010-2014 y © Airbus Defence and Space GmbH
//     2014-2018, provisto bajo COPERNICUS por la Unión Europea y la ESA), tile N10 W067:
//     https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N10_00_W067_00_DEM/Copernicus_DSM_COG_10_N10_00_W067_00_DEM.tif
//   - Cobertura del suelo: ESA WorldCover 10 m 2021 v200 (CC BY 4.0), tile N09W069.
//   - Edificios y vías: © OpenStreetMap contributors (ODbL), por Overpass.
// Uso: pnpm vite-node scripts/prototype-caracas3d.ts -- <carpeta con glo30.tif, worldcover.tif,
//      osm-buildings.json y osm-roads.json>
//
// Salida (todo little-endian, coordenadas en metros al este y al sur de ORIGIN):
//   relieve.bin   Uint16, altura × 4 (0,25 m), fila 0 al norte, cols × rows.
//   suelo.bin     Uint8, clase de WorldCover en la misma grilla.
//   edificios.bin por edificio: Uint16 altura (dm), Uint16 n, n × (Int16 x, Int16 z) en medios metros.
//   faroles.bin   Int16 (x, z) en medios metros, un farol cada FAROL_PASO metros de vía.
//   meta.json     grilla, origen y conteos.
import fs from 'node:fs';
import path from 'node:path';

import { fromFile } from 'geotiff';

const BOUNDS = { north: 10.62, south: 10.44, west: -67.0, east: -66.74 };
const ORIGIN = { lat: 10.5, lon: -66.9 };
const M_PER_LAT = 110574;
const M_PER_LON = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
const FAROL_PASO = 32;
// El Humboldt se modela aparte; su huella de OSM no se extruye.
const HUMBOLDT = { lat: 10.5414, lon: -66.8764 };

const dir = process.argv.slice(2).find((a) => a !== '--');
if (!dir) throw new Error('Falta la carpeta con los datos descargados');
const out = path.resolve('public/prototype/caracas3d');
fs.mkdirSync(out, { recursive: true });

const toXZ = (lat: number, lon: number) => [
    (lon - ORIGIN.lon) * M_PER_LON,
    -(lat - ORIGIN.lat) * M_PER_LAT,
];

/** Lee la ventana BOUNDS de un GeoTIFF de grilla geográfica. */
async function readWindow(file: string) {
    const tiff = await fromFile(file);
    const image = await tiff.getImage();
    const [west, south, east, north] = image.getBoundingBox();
    const w = image.getWidth();
    const h = image.getHeight();
    const px = (lon: number) => Math.round(((lon - west) / (east - west)) * w);
    const py = (lat: number) => Math.round(((north - lat) / (north - south)) * h);
    const window = [px(BOUNDS.west), py(BOUNDS.north), px(BOUNDS.east), py(BOUNDS.south)];
    const [data] = (await image.readRasters({ window })) as unknown as ArrayLike<number>[];
    return { data, cols: window[2] - window[0], rows: window[3] - window[1] };
}

const dem = await readWindow(path.join(dir, 'glo30.tif'));
const { cols, rows } = dem;
const relieve = new Uint16Array(cols * rows);
let max = 0;
for (let i = 0; i < relieve.length; i++) {
    const h = Math.max(0, dem.data[i]);
    relieve[i] = Math.round(h * 4);
    max = Math.max(max, h);
}
fs.writeFileSync(path.join(out, 'relieve.bin'), Buffer.from(relieve.buffer));
console.log(`relieve ${cols}×${rows}, máximo ${max.toFixed(0)} m`);

// WorldCover tiene 3× la resolución: se toma la clase más frecuente de cada celda de 3×3.
const wc = await readWindow(path.join(dir, 'worldcover.tif'));
const suelo = new Uint8Array(cols * rows);
for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
        const counts = new Map<number, number>();
        const r0 = Math.floor((r / rows) * wc.rows);
        const c0 = Math.floor((c / cols) * wc.cols);
        for (let dr = 0; dr < 3; dr++)
            for (let dc = 0; dc < 3; dc++) {
                const v =
                    wc.data[
                        Math.min(wc.rows - 1, r0 + dr) * wc.cols + Math.min(wc.cols - 1, c0 + dc)
                    ];
                counts.set(v, (counts.get(v) ?? 0) + 1);
            }
        suelo[r * cols + c] = [...counts].sort((a, b) => b[1] - a[1])[0][0];
    }
fs.writeFileSync(path.join(out, 'suelo.bin'), Buffer.from(suelo));
console.log(`suelo ${wc.cols}×${wc.rows} → ${cols}×${rows}`);

// Edificios: la altura de OSM si la tiene; si no, por pisos; si no, estimada por superficie.
interface Element {
    id: number;
    type: string;
    tags?: Record<string, string>;
    geometry?: { lat: number; lon: number }[];
    members?: { role: string; geometry?: { lat: number; lon: number }[] }[];
}
const hash = (n: number) => {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
};
const buildings = (
    JSON.parse(fs.readFileSync(path.join(dir, 'osm-buildings.json'), 'utf8')) as {
        elements: Element[];
    }
).elements;
const chunks: Buffer[] = [];
let count = 0;
let fromTag = 0;
for (const b of buildings) {
    const ring = b.geometry ?? b.members?.find((m) => m.role === 'outer')?.geometry;
    if (!ring || ring.length < 4) continue;
    const pts = ring.slice(0, -1).map((p) => toXZ(p.lat, p.lon));
    const [hx, hz] = toXZ(HUMBOLDT.lat, HUMBOLDT.lon);
    if (pts.some(([x, z]) => Math.hypot(x - hx, z - hz) < 60)) continue;
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
        const [x1, z1] = pts[i];
        const [x2, z2] = pts[(i + 1) % pts.length];
        area += x1 * z2 - x2 * z1;
    }
    area = Math.abs(area) / 2;
    if (area < 12 || pts.length > 400) continue;
    const tags = b.tags ?? {};
    let height = parseFloat(tags.height ?? '');
    if (Number.isFinite(height)) fromTag++;
    else if (tags['building:levels']) height = parseFloat(tags['building:levels']) * 3.2 + 1;
    else {
        const r = hash(b.id);
        height =
            area < 90
                ? 3.5 + r * 4
                : area < 400
                  ? 7 + r * 9
                  : area < 1500
                    ? 12 + r * 28
                    : 18 + r * 40;
    }
    if (!Number.isFinite(height) || height <= 0) continue;
    const buf = Buffer.alloc(4 + pts.length * 4);
    buf.writeUInt16LE(Math.min(65535, Math.round(height * 10)), 0);
    buf.writeUInt16LE(pts.length, 2);
    pts.forEach(([x, z], i) => {
        buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x * 2))), 4 + i * 4);
        buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(z * 2))), 6 + i * 4);
    });
    chunks.push(buf);
    count++;
}
fs.writeFileSync(path.join(out, 'edificios.bin'), Buffer.concat(chunks));
console.log(`edificios ${count} (${fromTag} con altura de OSM)`);

// Faroles: un punto cada FAROL_PASO metros a lo largo de las vías.
const roads = (
    JSON.parse(fs.readFileSync(path.join(dir, 'osm-roads.json'), 'utf8')) as { elements: Element[] }
).elements;
const faroles: number[] = [];
for (const r of roads) {
    const g = (r.geometry ?? []).map((p) => toXZ(p.lat, p.lon));
    let carry = 0;
    for (let i = 1; i < g.length; i++) {
        const [x1, z1] = g[i - 1];
        const [x2, z2] = g[i];
        const len = Math.hypot(x2 - x1, z2 - z1);
        for (let d = carry; d < len; d += FAROL_PASO) {
            const t = d / len;
            faroles.push(
                Math.round((x1 + (x2 - x1) * t) * 2),
                Math.round((z1 + (z2 - z1) * t) * 2),
            );
        }
        carry = (carry - len) % FAROL_PASO;
        if (carry < 0) carry += FAROL_PASO;
    }
}
fs.writeFileSync(path.join(out, 'faroles.bin'), Buffer.from(new Int16Array(faroles).buffer));
console.log(`faroles ${faroles.length / 2}`);

const [x0, z0] = toXZ(BOUNDS.north, BOUNDS.west);
const [x1, z1] = toXZ(BOUNDS.south, BOUNDS.east);
const meta = {
    cols,
    rows,
    x0,
    z0,
    x1,
    z1,
    origin: ORIGIN,
    max,
    edificios: count,
    faroles: faroles.length / 2,
    fuentes: [
        'Copernicus GLO-30: © DLR e.V. 2010-2014 y © Airbus Defence and Space GmbH 2014-2018, provisto bajo COPERNICUS por la Unión Europea y la ESA',
        'ESA WorldCover 10 m 2021 v200 (CC BY 4.0)',
        '© OpenStreetMap contributors (ODbL)',
    ],
};
fs.writeFileSync(path.join(out, 'meta.json'), `${JSON.stringify(meta, null, 4)}\n`);
