import fs from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { CONTENT, type Content } from '@/content';
import { validateContent } from '@/content/validate';

const publicFileExists = (src: string) => fs.existsSync(path.join('public', src));

// Copia profunda para modificar sin tocar el contenido real.
const clone = (): Content => structuredClone(CONTENT);

describe('Integridad del contenido real', () => {
    it('no tiene Datos pendientes ni referencias rotas', () => {
        expect(validateContent(CONTENT, { fileExists: publicFileExists })).toEqual([]);
    });
});

describe('validateContent', () => {
    const ok = () => true;

    it('falla si queda un Dato pendiente', () => {
        const c = clone();
        c.experiences[0].achievements[0].pending = true;
        c.keyFigures[1].pending = true;
        expect(validateContent(c, { fileExists: ok })).toEqual([
            'Dato pendiente en experiences[0].achievements[0]',
            'Dato pendiente en keyFigures[1]',
        ]);
    });

    it('falla si una Cifra clave apunta a un respaldo inexistente', () => {
        const c = clone();
        c.keyFigures[2].backing = { kind: 'project', id: 'no-existe' };
        expect(validateContent(c, { fileExists: ok })).toEqual([
            'keyFigures[2]: el respaldo project "no-existe" no existe',
        ]);
    });

    it('falla si a un texto traducible le falta un idioma', () => {
        const c = clone();
        c.projects[0].caseStudy.problem.en = ' ';
        expect(validateContent(c, { fileExists: ok })).toEqual([
            'Falta "en" en projects[0].caseStudy.problem',
        ]);
    });

    it('falla si a un texto traducible le falta un idioma entero', () => {
        const c = clone();
        (c.hero.location as Record<string, string>) = { es: 'Caracas' };
        expect(validateContent(c, { fileExists: ok })).toEqual(['Falta "en" en hero.location']);
    });

    it('falla si una imagen de galería no tiene alt o su archivo no existe', () => {
        const c = clone();
        c.projects[0].caseStudy.gallery[1].alt.es = '';
        const problems = validateContent(c, {
            fileExists: (src) => src !== '/projects/superwallet-4.jpg',
        });
        expect(problems).toEqual([
            'Falta "es" en projects[0].caseStudy.gallery[1].alt',
            'projects[0].caseStudy.gallery[2]: no existe el archivo /projects/superwallet-4.jpg',
        ]);
    });

    it('falla si un Proyecto de trabajo apunta a una Experiencia inexistente', () => {
        const c = clone();
        c.projects[1].experienceId = 'nadie';
        expect(validateContent(c, { fileExists: ok })).toEqual([
            'projects[1]: la Experiencia "nadie" no existe',
        ]);
    });

    it('falla si una Experiencia tiene menos de 2 Logros', () => {
        const c = clone();
        c.experiences[3].achievements = c.experiences[3].achievements.slice(0, 1);
        expect(validateContent(c, { fileExists: ok })).toEqual([
            'experiences[3] ("daxos") tiene menos de 2 Logros',
        ]);
    });
});
