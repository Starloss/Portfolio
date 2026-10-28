// Post-build: corre después de `vite build` (ver el script "build" de package.json).
// 1. Valida el contenido: un Dato pendiente o una referencia rota hace fallar el build.
// 2. Escribe un index.html con su <head> por ruta e idioma, el sitemap y robots.txt.
// 3. Genera las imágenes OG y el CV en ES y EN.
// 4. Comprueba que todo exista y pese más de 0, que cada CV tenga como mucho 2 páginas y que
//    cada imagen OG mida 1200 × 630.
import fs from 'node:fs';
import path from 'node:path';
import { buildSiteArtifacts, OG_SIZE, ogImages } from '@/build/artifacts';
import { pngSize, renderOgImage } from '@/build/og/render';
import { countPdfPages, renderCv } from '@/build/cv/render';
import { CONTENT, LOCALES } from '@/content';
import { IMAGE_SIZES } from '@/content/data/image-sizes';
import { validateContent } from '@/content/validate';
import { SITE_URL } from '@app/config/site';
import { cvPath } from '@lib/locale-path';

const DIST = path.resolve('dist');
const PUBLIC = path.resolve('public');
const today = new Date();

function fail(message: string): never {
    console.error(`\n✖ post-build: ${message}\n`);
    process.exit(1);
}

const problems = validateContent(CONTENT, {
    fileExists: (src) => fs.existsSync(path.join(PUBLIC, src)),
    imageSize: (src) => IMAGE_SIZES[src],
});
if (problems.length) fail(`el contenido no se puede publicar:\n  - ${problems.join('\n  - ')}`);

const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const files = buildSiteArtifacts({ indexHtml, siteUrl: SITE_URL, today });
for (const [file, body] of Object.entries(files)) {
    const target = path.join(DIST, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
}

const images = ogImages(today);
for (const { file, card } of images) {
    const target = path.join(DIST, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, await renderOgImage(card));
}

for (const locale of LOCALES) {
    const pdf = await renderCv(locale, today, SITE_URL);
    const pages = countPdfPages(pdf);
    if (pages < 1 || pages > 2) fail(`el CV en ${locale} tiene ${pages} páginas (máximo 2)`);
    fs.writeFileSync(path.join(DIST, cvPath(locale)), pdf);
}

const expected = [
    ...Object.keys(files),
    ...images.map((i) => i.file),
    ...LOCALES.map((l) => cvPath(l).slice(1)),
];
for (const file of expected) {
    const target = path.join(DIST, file);
    if (!fs.existsSync(target) || fs.statSync(target).size === 0) fail(`falta ${file}`);
}
for (const { file } of images) {
    const { width, height } = pngSize(fs.readFileSync(path.join(DIST, file)));
    if (width !== OG_SIZE.width || height !== OG_SIZE.height)
        fail(`${file} mide ${width} × ${height} (tiene que medir 1200 × 630)`);
}
console.log(`✓ post-build: ${expected.length} archivos generados`);
