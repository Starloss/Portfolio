import fs from 'node:fs';

import { describe, it, expect } from 'vitest';

// El <head> por ruta se publica como "x.html" y Vercel lo sirve en "/x" gracias a cleanUrls;
// lo que no es un archivo cae al index.html de la SPA.
describe('vercel.json', () => {
    const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    const spaFallback = new RegExp(`^${config.rewrites[0].source}$`);

    it('sirve las páginas por ruta sin extensión', () => {
        expect(config.cleanUrls).toBe(true);
    });

    it('manda a la SPA las rutas sin extensión y deja pasar los archivos', () => {
        expect(config.rewrites[0].destination).toBe('/index.html');
        expect(spaFallback.test('/en/projects/nada')).toBe(true);
        expect(spaFallback.test('/cv-diego-rangel-es.pdf')).toBe(false);
        expect(spaFallback.test('/assets/index.js')).toBe(false);
    });
});
