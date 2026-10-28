import { describe, it, expect } from 'vitest';

import { resolveContent } from '@/content';

describe('Contenido resuelto por idioma', () => {
    it('calcula los años de Trayectoria desde el inicio de la primera Experiencia', () => {
        expect(resolveContent('es', new Date(2026, 9, 27)).trajectoryYears).toBe('8+');
        expect(resolveContent('es', new Date(2027, 8, 1)).trajectoryYears).toBe('9+');
        expect(resolveContent('es', new Date(2026, 7, 31)).trajectoryYears).toBe('7+');
    });

    it('ordena las Experiencias de la más reciente a la más antigua', () => {
        const ids = resolveContent('es', TODAY).experiences.map((e) => e.id);
        expect(ids).toEqual(['xhype', 'core', 'wocoon', 'daxos', '300-dev']);
    });

    it('arma el período de cada Experiencia en el idioma pedido', () => {
        const es = resolveContent('es', TODAY).experiences;
        const en = resolveContent('en', TODAY).experiences;
        expect(es.find((e) => e.id === '300-dev')?.period).toBe('Sep 2018 – Ago 2020');
        expect(en.find((e) => e.id === '300-dev')?.period).toBe('Sep 2018 – Aug 2020');
        expect(es.find((e) => e.id === 'core')?.period).toBe('Oct 2022 – Presente');
        expect(en.find((e) => e.id === 'core')?.period).toBe('Oct 2022 – Present');
    });

    it('traduce rol, ubicación y Logros de cada Experiencia', () => {
        const xhypeEs = resolveContent('es', TODAY).experiences[0];
        const xhypeEn = resolveContent('en', TODAY).experiences[0];
        expect(xhypeEs).toMatchObject({ company: 'XHype', location: 'Remoto' });
        expect(xhypeEn.location).toBe('Remote');
        const core = resolveContent('en', TODAY).experiences[1];
        expect(core.company).toBe('CORE Care and Health Systems');
        expect(core.achievements[0]).toBe(
            'I lead and mentor a team of 10+ developers, increasing their productivity by 60%.',
        );
        expect(core.achievements[1]).toMatch(/100% on-time delivery/);
    });

    it('un Proyecto de trabajo hereda la Empresa de su Experiencia y uno personal no tiene', () => {
        const projects = resolveContent('es', TODAY).projects;
        const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
        expect(byId['superwallet'].company).toBe('XHype');
        expect(byId['be-booking-engine'].company).toBe('CORE Care and Health Systems');
        expect(byId['wedding-invitation'].company).toBeUndefined();
        expect(byId['wedding-invitation'].period).toBe('Mar 2026');
    });

    it('lista los Proyectos destacados en el orden acordado', () => {
        expect(resolveContent('en', TODAY).featuredProjects.map((p) => p.title)).toEqual([
            'SuperWallet',
            'BE - Booking Engine',
            'Wedding Invitation',
        ]);
    });

    it('traduce el Caso de estudio, con el problema aparte del contexto', () => {
        const boda = resolveContent('en', TODAY).projects.find(
            (p) => p.id === 'wedding-invitation',
        );
        expect(boda?.caseStudy.problem).toMatch(/^Collecting RSVPs per group/);
        expect(boda?.caseStudy.decisions[0].title).toBe('Token-based RSVP, no login');
        expect(boda?.caseStudy.gallery[0]).toEqual({
            src: '/projects/wedding-invitation-11.jpg',
            alt: 'Invitation cover on desktop',
        });
    });

    it('resuelve las Cifras clave con su valor y su respaldo', () => {
        const figures = resolveContent('es', TODAY).keyFigures;
        expect(figures.map((f) => f.value)).toEqual(['8+', '10+', '−80%', '100%']);
        expect(figures.map((f) => f.backing)).toEqual([
            { kind: 'trajectory', label: 'Trayectoria' },
            { kind: 'experience', id: 'core', label: 'CORE Care and Health Systems' },
            { kind: 'project', id: 'superwallet', label: 'SuperWallet' },
            { kind: 'experience', id: 'core', label: 'CORE Care and Health Systems' },
        ]);
        expect(resolveContent('en', TODAY).keyFigures[0]).toMatchObject({
            label: 'years of experience',
            backing: { label: 'Career' },
        });
    });

    it('incluye el Hero, la Formación y las skills traducidas', () => {
        const en = resolveContent('en', TODAY);
        expect(en.hero.valueProposition).toBe(
            'I lead teams that build fast, scalable, measurable web and mobile products.',
        );
        expect(en.education[0]).toMatchObject({
            institution: 'Universidad Central de Venezuela',
            title: 'Computer Science',
            period: '2016 – 2021',
        });
        const soft = resolveContent('es', TODAY).skills.at(-1);
        expect(soft?.name).toBe('Habilidades blandas');
        expect(soft?.items).toContain('Liderazgo');
        expect(resolveContent('es', TODAY).skills[0].items).toContain('React');
    });

    it('arma el resumen del CV con los años calculados', () => {
        expect(resolveContent('en', TODAY).profile.cvSummary).toMatch(
            /^Full-Stack Lead Developer with 8\+ years of experience\./,
        );
    });
});

const TODAY = new Date(2026, 9, 27);
