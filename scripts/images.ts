// Genera los WebP de las capturas de los Casos de estudio, una sola vez: quedan versionados y el
// build no procesa imágenes.
//
// Lee los originales de images/projects/ (no se publican) y escribe en public/projects/ un WebP
// de 640, 960 y 1280 px de ancho por imagen ("x-640.webp", "x-960.webp", "x-1280.webp"; nunca agranda).
// También escribe src/content/data/image-sizes.ts con el ancho y alto del WebP más grande, para
// que las páginas reserven su espacio (CLS 0).
// Uso: pnpm images
import fs from 'node:fs';
import path from 'node:path';

import prettier from 'prettier';
import sharp from 'sharp';

import { IMAGE_WIDTHS } from '@/content/images';

const SOURCE = path.resolve('images/projects');
const PUBLIC = path.resolve('public/projects');
const SIZES = path.resolve('src/content/data/image-sizes.ts');

const sizes: Record<string, { width: number; height: number }> = {};
fs.mkdirSync(PUBLIC, { recursive: true });
for (const file of fs.readdirSync(SOURCE).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()) {
    const name = file.replace(/\.[^.]+$/, '');
    for (const width of IMAGE_WIDTHS) {
        const info = await sharp(path.join(SOURCE, file))
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 78 })
            .toFile(path.join(PUBLIC, `${name}-${width}.webp`));
        sizes[`/projects/${name}`] = { width: info.width, height: info.height };
    }
}

const source = `// GENERADO por scripts/images.ts. No editar a mano.
// Ancho y alto del WebP más grande de cada imagen, por su ruta sin extensión.
export const IMAGE_SIZES: Record<string, { width: number; height: number } | undefined> = ${JSON.stringify(sizes)};
`;
const options = await prettier.resolveConfig(SIZES);
fs.writeFileSync(SIZES, await prettier.format(source, { ...options, filepath: SIZES }));
console.log(`✓ ${Object.keys(sizes).length} imágenes en public/projects/`);
