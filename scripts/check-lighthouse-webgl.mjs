// El Lighthouse de escritorio fuerza la Escena WebGL (?escena=webgl). Este control falla si en
// alguna corrida no llegó a cargarse el Worker que la dibuja: si no, se mediría la SVG creyendo
// que se mide la WebGL. Las caídas a la SVG las atrapa la aserción errors-in-console.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? '.lighthouseci-desktop';
const reports = readdirSync(dir).filter((f) => f.endsWith('.report.json'));
const missing = reports.filter((file) => {
    const report = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
    const requests = report.audits['network-requests']?.details?.items ?? [];
    return !requests.some((r) => /\/worker-[\w-]+\.js$/.test(r.url));
});
if (reports.length === 0 || missing.length > 0) {
    console.error(`La Escena WebGL no se cargó en: ${missing.join(', ') || '(no hay reportes)'}`);
    process.exit(1);
}
console.log(`La Escena WebGL se cargó en las ${reports.length} corridas.`);
