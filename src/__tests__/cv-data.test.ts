import { describe, it, expect } from 'vitest';

import { cvData } from '@/build/cv/cv-data';

const TODAY = new Date(2026, 9, 27);
const SITE = 'https://www.diegorangel.dev';

describe('Datos del CV', () => {
    it('la cabecera lleva el nombre completo y el contacto, sin teléfono', () => {
        const cv = cvData('es', TODAY, SITE);
        expect(cv.header.fullName).toBe('Diego Alfonso Rangel De Ornelas');
        expect(cv.header.role).toBe('Full-Stack Lead Developer');
        expect(cv.header.contacts).toEqual([
            { label: 'starloss09@gmail.com', url: 'mailto:starloss09@gmail.com' },
            { label: 'LinkedIn', url: 'https://www.linkedin.com/in/diego-rangel-de-ornelas' },
            { label: 'GitHub', url: 'https://github.com/Starloss' },
            { label: 'www.diegorangel.dev', url: 'https://www.diegorangel.dev' },
        ]);
        expect(JSON.stringify(cv)).not.toMatch(/\+58|424/);
    });

    it('abre con el resumen con los años calculados', () => {
        expect(cvData('es', TODAY, SITE).summary).toMatch(
            /^Full-Stack Lead Developer con 8\+ años de experiencia\./,
        );
    });

    it('incluye todas las Experiencias con todos sus Logros y su Proyecto de trabajo', () => {
        const { experiences } = cvData('en', TODAY, SITE);
        expect(experiences.map((e) => e.company)).toEqual([
            'XHype',
            'CORE Care and Health Systems',
            'Wocoon',
            'Daxos',
            '300 Dev',
        ]);
        expect(experiences[1].achievements).toHaveLength(5);
        expect(experiences[0].projects).toEqual(['SuperWallet']);
        expect(experiences[1].projects).toEqual(['BE - Booking Engine']);
        expect(experiences[2].projects).toEqual([]);
    });

    it('enlaza cada Proyecto destacado a su Caso de estudio en el mismo idioma', () => {
        const projects = cvData('en', TODAY, SITE).featuredProjects;
        expect(projects.map((p) => p.url)).toEqual([
            'https://www.diegorangel.dev/en/projects/superwallet',
            'https://www.diegorangel.dev/en/projects/be-booking-engine',
            'https://www.diegorangel.dev/en/projects/wedding-invitation',
        ]);
        expect(projects[2].title).toBe('Wedding Invitation');
    });

    it('incluye la Formación y las skills', () => {
        const cv = cvData('es', TODAY, SITE);
        expect(cv.education).toEqual([
            {
                institution: 'Universidad Central de Venezuela',
                title: 'Computación',
                location: 'Caracas, Venezuela',
                period: '2016 – 2021',
            },
        ]);
        expect(cv.skills.map((s) => s.name)).toContain('Habilidades blandas');
        expect(cv.headings.education).toBe('Formación');
        expect(cvData('en', TODAY, SITE).headings.education).toBe('Education');
    });
});
