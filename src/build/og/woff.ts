// Convierte una fuente WOFF 1 en TTF/OTF: el rasterizador de las imágenes OG no lee WOFF, y
// así se reutilizan los archivos de Fontsource que ya usa el CV en vez de versionar fuentes.
// WOFF 1 guarda las mismas tablas que el sfnt original, cada una comprimida con zlib.
import zlib from 'node:zlib';

const WOFF_SIGNATURE = 0x774f4646; // "wOFF"
const WOFF_HEADER = 44;
const WOFF_ENTRY = 20;
const SFNT_HEADER = 12;
const SFNT_RECORD = 16;

const pad4 = (n: number) => (n + 3) & ~3;

export function woffToSfnt(woff: Buffer): Buffer {
    if (woff.readUInt32BE(0) !== WOFF_SIGNATURE) throw new Error('no es un archivo WOFF');
    const flavor = woff.readUInt32BE(4);
    const numTables = woff.readUInt16BE(12);

    const tables = Array.from({ length: numTables }, (_, i) => {
        const entry = WOFF_HEADER + i * WOFF_ENTRY;
        const offset = woff.readUInt32BE(entry + 4);
        const compLength = woff.readUInt32BE(entry + 8);
        const origLength = woff.readUInt32BE(entry + 12);
        const raw = woff.subarray(offset, offset + compLength);
        return {
            tag: woff.readUInt32BE(entry),
            checksum: woff.readUInt32BE(entry + 16),
            data: compLength < origLength ? zlib.inflateSync(raw) : raw,
        };
    });

    const entrySelector = Math.floor(Math.log2(numTables));
    const searchRange = 2 ** entrySelector * 16;
    let offset = SFNT_HEADER + numTables * SFNT_RECORD;
    const size = tables.reduce((total, t) => total + pad4(t.data.length), offset);
    const sfnt = Buffer.alloc(size);
    sfnt.writeUInt32BE(flavor, 0);
    sfnt.writeUInt16BE(numTables, 4);
    sfnt.writeUInt16BE(searchRange, 6);
    sfnt.writeUInt16BE(entrySelector, 8);
    sfnt.writeUInt16BE(numTables * 16 - searchRange, 10);
    tables.forEach((t, i) => {
        const record = SFNT_HEADER + i * SFNT_RECORD;
        sfnt.writeUInt32BE(t.tag, record);
        sfnt.writeUInt32BE(t.checksum, record + 4);
        sfnt.writeUInt32BE(offset, record + 8);
        sfnt.writeUInt32BE(t.data.length, record + 12);
        t.data.copy(sfnt, offset);
        offset += pad4(t.data.length);
    });
    return sfnt;
}
