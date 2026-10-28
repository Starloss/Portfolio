import fs from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { CONTENT, type Content } from '@/content';
import { IMAGE_SIZES } from '@/content/data/image-sizes';
import { validateContent } from '@/content/validate';

const publicFileExists = (src: string) => fs.existsSync(path.join('public', src));
const realSizes = (src: string) => IMAGE_SIZES[src];

// Copia profunda para modificar sin tocar el contenido real.
const clone = (): Content => structuredClone(CONTENT);

describe('Integridad del contenido real', () => {
    it('no tiene Datos pendientes ni referencias rotas', () => {
        expect(
            validateContent(CONTENT, { fileExists: publicFileExists, imageSize: realSizes }),
        ).toEqual([]);
    });
});

describe('validateContent', () => {
    const ok = () => true;
    const sized = () => ({ width: 1280, height: 720 });

    it('falla si queda un Dato pendiente', () => {
        const c = clone();
        c.experiences[0].achievements[0].pending = true;
        c.keyFigures[1].pending = true;
        expect(validateContent(c, { fileExists: ok, imageSize: sized })).toEqual([
            'Dato pendiente en experiences[0].achievements[0]',
            'Dato pendiente en keyFigures[1]',
        ]);
    });

    it('falla si una Cifra clave apunta a un respaldo inexistente', () => {
        const c = clone();
        c.keyFigures[2].backing = { kind: 'project', id: 'no-existe' };
        expect(validateContent(c, { fileExists: ok, imageSize: sized })).toEqual([
            'keyFigures[2]: el respaldo project "no-existe" no existe',
        ]);
    });

    it('falla si a un texto traducible le falta un idioma', () => {
        const c = clone();
        c.projects[0].caseStudy.problem.en = ' ';
        expect(validateContent(c, { fileExists: ok, imageSize: sized })).toEqual([
            'Falta "en" en projects[0].caseStudy.problem',
        ]);
    });

    it('falla si a un texto traducible le falta un idioma entero', () => {
        const c = clone();
        (c.hero.location as Record<string, string>) = { es: 'Caracas' };
        expect(validateContent(c, { fileExists: ok, imageSize: sized })).toEqual([
            'Falta "en" en hero.location',
        ]);
    });

    it('falla si una imagen de galería no tiene alt o le falta uno de sus WebP', () => {
        const c = clone();
        c.projects[0].caseStudy.gallery[1].alt.es = '';
        const problems = validateContent(c, {
            fileExists: (src) => src !== '/projects/superwallet-4-1280.webp',
            imageSize: sized,
        });
        expect(problems).toEqual([
            'Falta "es" en projects[0].caseStudy.gallery[1].alt',
            'projects[0].caseStudy.gallery[2]: no existe el archivo /projects/superwallet-4-1280.webp',
        ]);
    });

    it('pide los WebP de 640 y 1280 de cada imagen', () => {
        const asked: string[] = [];
        validateContent(clone(), {
            fileExists: (src) => {
                asked.push(src);
                return true;
            },
            imageSize: sized,
        });
        expect(asked).toContain('/projects/superwallet-1-640.webp');
        expect(asked).toContain('/projects/superwallet-1-1280.webp');
    });

    it('falla si una imagen de galería no tiene medidas', () => {
        const problems = validateContent(clone(), {
            fileExists: ok,
            imageSize: (src) => (src === '/projects/superwallet-1' ? undefined : sized()),
        });
        expect(problems).toEqual([
            'projects[0].caseStudy.gallery[0]: /projects/superwallet-1 no tiene medidas (ancho y alto)',
        ]);
    });

    it('falla si un Caso de estudio no tiene portada: ni capturas ni diagrama', () => {
        const c = clone();
        c.projects[1].caseStudy.gallery = [];
        delete c.projects[1].caseStudy.diagram;
        expect(validateContent(c, { fileExists: ok, imageSize: sized })).toEqual([
            'projects[1] ("be-booking-engine"): el Caso de estudio no tiene portada (ni capturas ni diagrama)',
        ]);
    });

    it('falla si al diagrama le faltan pasos o un texto en algún idioma', () => {
        const c = clone();
        const diagram = c.projects[1].caseStudy.diagram!;
        diagram.steps = [];
        diagram.alt.en = '';
        diagram.noScreenshots.es = '';
        expect(validateContent(c, { fileExists: ok, imageSize: sized })).toEqual([
            'Falta "en" en projects[1].caseStudy.diagram.alt',
            'Falta "es" en projects[1].caseStudy.diagram.noScreenshots',
            'projects[1] ("be-booking-engine"): el diagrama no tiene pasos',
        ]);
    });

    it('falla si un Proyecto de trabajo apunta a una Experiencia inexistente', () => {
        const c = clone();
        c.projects[1].experienceId = 'nadie';
        expect(validateContent(c, { fileExists: ok, imageSize: sized })).toEqual([
            'projects[1]: la Experiencia "nadie" no existe',
        ]);
    });

    it('falla si una Experiencia tiene menos de 2 Logros', () => {
        const c = clone();
        c.experiences[3].achievements = c.experiences[3].achievements.slice(0, 1);
        expect(validateContent(c, { fileExists: ok, imageSize: sized })).toEqual([
            'experiences[3] ("daxos") tiene menos de 2 Logros',
        ]);
    });
});
