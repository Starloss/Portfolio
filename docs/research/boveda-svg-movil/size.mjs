// Peso en el chunk principal: compila origin/main tal cual y con cada forma de la Bóveda y el tinte,
// sin barras ni lectura de la URL, como iría a producción.
// Uso, desde una copia limpia de origin/main con dependencias instaladas:
//   node <ruta>/size.mjs <carpeta prototype-boveda y prototype-clima del laboratorio>
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const LAB_SCENE = process.argv[2];
const scenePath = 'src/app/scene/Scene.tsx';
const read = (f) => readFileSync(f, 'utf8').split(String.fromCharCode(13)).join('');
const pristine = read(scenePath);

const PARAMS = `{
    variant: 'c' as const,
    hour: new Date().getUTCHours(),
    phase: 0.4,
    moonRule: 'real' as const,
    sunRule: 'fija' as const,
    arc: 'sobre' as const,
    ui: 'inicio' as const,
    reduced,
    minX: page?.column ? page.column.right / viewport.width : 0.5,
}`;
const CLIMA = `{ variant: 'b' as const, estado: 'nublado' as const, topeOscuro: 0.65, topeDensidad: 1 }`;

function sceneWith(importLines, jsx) {
    let s = pristine;
    s = s.replace("import './scene.css';", `${importLines}\nimport './scene.css';`);
    // Producción reemplaza las estrellas y la luna de hoy.
    s = s.replace(
        /\{night && \(\s*<Stars[\s\S]*?\/>\s*\)\}/,
        '',
    );
    s = s.replace(/\{night && moon && \([\s\S]*?\n\s*\)\}/, jsx);
    if (!s.includes('prototipo-medido')) throw new Error('no se aplicó el parche');
    return s;
}

function prepare() {
    for (const dir of ['prototype-boveda', 'prototype-clima']) {
        mkdirSync(`src/app/scene/${dir}`, { recursive: true });
    }
    for (const f of ['BovedaSvg.tsx', 'BovedaCss.tsx', 'sim.ts', 'boveda-css.css']) {
        copyFileSync(path.join(LAB_SCENE, 'prototype-boveda', f), `src/app/scene/prototype-boveda/${f}`);
    }
    for (const f of ['ClimaTint.tsx', 'clima.ts']) {
        copyFileSync(path.join(LAB_SCENE, 'prototype-clima', f), `src/app/scene/prototype-clima/${f}`);
    }
    // Sin lab.ts: se fijan las decisiones del laboratorio.
    let svg = read('src/app/scene/prototype-boveda/BovedaSvg.tsx');
    svg = svg
        .replace("import { LAB, landRule } from './lab';\n", '')
        .replace('LAB.n ?? 420', '420')
        .replace(
            '<style>{landRule(durationOf(params))}</style>',
            '<style>{`.scene * { transition-duration: ${durationOf(params)}s !important; }`}</style>',
        );
    writeFileSync('src/app/scene/prototype-boveda/BovedaSvg.tsx', svg);
    const css = read('src/app/scene/prototype-boveda/BovedaCss.tsx');
    writeFileSync(
        'src/app/scene/prototype-boveda/BovedaCssCircles.tsx',
        css.replace(/\{form === 'path' \? \([\s\S]*?\) : \(\s*(list\.map[\s\S]*?\/>\))\s*\)\}/, '{$1}'),
    );
    writeFileSync(
        'src/app/scene/prototype-boveda/BovedaCssPath.tsx',
        css
            .replace(
                /\{form === 'path' \? \(\s*(<>[\s\S]*?<\/>)\s*\) : \([\s\S]*?\)\s*\)\}/,
                '$1',
            ),
    );
    // Tinte: la del prototipo sin la rama del laboratorio, y la de dos capas sola.
    const tint = read('src/app/scene/prototype-clima/ClimaTint.tsx');
    const noLab = tint.replace("import { LAB } from '../prototype-boveda/lab';\n\n", '');
    writeFileSync(
        'src/app/scene/prototype-clima/ClimaTintProto.tsx',
        noLab.replace(/    if \(LAB\.tint === 'css'\) \{[\s\S]*?\n    \}\n/, ''),
    );
    writeFileSync(
        'src/app/scene/prototype-clima/ClimaTintCss.tsx',
        noLab
            .replace("if (LAB.tint === 'css') {", '{')
            .replace(/    const low = params\.variant === 'c';[\s\S]*?\n\};/, '};')
            .replace(/const \[r, g, b\] =.*\n/, ''),
    );
}

const FILL06 = `<style>{'.scene [data-layer]:not([data-layer="sky"]) * { transition-delay: 1.5s !important; }'}</style>`;
const VARIANTS = {
    main: null,
    'svg-raf-420+tinte-proto': sceneWith(
        `import { BovedaSvg } from './prototype-boveda/BovedaSvg';
import { ClimaTint } from './prototype-clima/ClimaTintProto';`,
        `{/* prototipo-medido */}<BovedaSvg night={night} params={${PARAMS}} /><ClimaTint night={night} params={${CLIMA}} />`,
    ),
    'svg-raf-420': sceneWith(
        `import { BovedaSvg } from './prototype-boveda/BovedaSvg';`,
        `{/* prototipo-medido */}<BovedaSvg night={night} params={${PARAMS}} />`,
    ),
    'css-circles+tinte-css': sceneWith(
        `import { BovedaCss } from './prototype-boveda/BovedaCssCircles';
import { ClimaTint } from './prototype-clima/ClimaTintCss';`,
        `{/* prototipo-medido */}${FILL06}<BovedaCss night={night} count={120} params={${PARAMS}} /><ClimaTint night={night} params={${CLIMA}} />`,
    ),
    'css-path+tinte-css': sceneWith(
        `import { BovedaCss } from './prototype-boveda/BovedaCssPath';
import { ClimaTint } from './prototype-clima/ClimaTintCss';`,
        `{/* prototipo-medido */}${FILL06}<BovedaCss night={night} count={120} params={${PARAMS}} /><ClimaTint night={night} params={${CLIMA}} />`,
    ),
    'css-circles': sceneWith(
        `import { BovedaCss } from './prototype-boveda/BovedaCssCircles';`,
        `{/* prototipo-medido */}${FILL06}<BovedaCss night={night} count={120} params={${PARAMS}} />`,
    ),
    'solo-tinte-css': sceneWith(
        `import { ClimaTint } from './prototype-clima/ClimaTintCss';`,
        `{/* prototipo-medido */}<ClimaTint night={night} params={${CLIMA}} />`,
    ),
};

prepare();
const table = {};
for (const [name, source] of Object.entries(VARIANTS)) {
    writeFileSync(scenePath, source ?? pristine);
    const outDir = `dist-size/${name.replace(/\+/g, '_')}`;
    execSync(`pnpm exec vite build --outDir ${outDir} --emptyOutDir`, { stdio: 'pipe' });
    const assets = readdirSync(`${outDir}/assets`);
    const size = (re) => {
        const f = assets.find((a) => re.test(a));
        const raw = readFileSync(`${outDir}/assets/${f}`);
        return { file: f, raw: raw.length, gzip: gzipSync(raw, { level: 6 }).length };
    };
    table[name] = { js: size(/^index-.*\.js$/), css: size(/^index-.*\.css$/) };
    console.log(name, table[name].js.gzip, table[name].css.gzip);
}
writeFileSync(scenePath, pristine);
const base = table.main;
for (const v of Object.values(table)) {
    v.deltaJs = v.js.gzip - base.js.gzip;
    v.deltaCss = v.css.gzip - base.css.gzip;
}
writeFileSync('size-results.json', JSON.stringify(table, null, 1));
console.table(
    Object.fromEntries(
        Object.entries(table).map(([k, v]) => [
            k,
            { jsGzip: v.js.gzip, deltaJs: v.deltaJs, cssGzip: v.css.gzip, deltaCss: v.deltaCss },
        ]),
    ),
);
