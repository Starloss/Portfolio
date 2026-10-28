import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@app/App';
import { ThemeProvider } from '@lib/theme';

import { CONTENT } from '@/content';

const renderAt = (url: string) =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <ThemeProvider>
                <AppRoutes />
            </ThemeProvider>
        </MemoryRouter>,
    );

describe('El idioma sale de la URL', () => {
    it('la raíz está en español', () => {
        renderAt('/');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola, soy');
        expect(document.documentElement.lang).toBe('es');
    });

    it('/en está en inglés', () => {
        renderAt('/en');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Hi, I'm");
        expect(
            screen.getByText(
                'I lead teams that build fast, scalable, measurable web and mobile products.',
            ),
        ).toBeInTheDocument();
        expect(document.documentElement.lang).toBe('en');
    });

    it('una ruta desconocida lleva a la Home del mismo idioma', () => {
        renderAt('/en/no-existe');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Hi, I'm");
    });

    it('el selector "ES / EN" lleva a la misma página en el otro idioma', async () => {
        renderAt('/en/projects/superwallet');
        expect(screen.getByRole('heading', { name: 'Key decisions' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('link', { name: 'ES' }));
        expect(screen.getByRole('heading', { name: 'Decisiones clave' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SuperWallet');
    });

    it('"Descargar CV" apunta al PDF del idioma de la URL', () => {
        renderAt('/en');
        expect(screen.getAllByRole('link', { name: 'Download CV' })[0]).toHaveAttribute(
            'href',
            '/cv-diego-rangel-en.pdf',
        );
    });

    it('"Descargar CV" en español apunta al PDF en español', () => {
        renderAt('/');
        expect(screen.getAllByRole('link', { name: 'Descargar CV' })[0]).toHaveAttribute(
            'href',
            '/cv-diego-rangel-es.pdf',
        );
    });
});

describe('Home con el contenido nuevo', () => {
    it('ya no tiene "Sobre mí" ni el chip de años', () => {
        renderAt('/');
        expect(screen.queryByText('Sobre mí')).not.toBeInTheDocument();
        expect(screen.queryByText(/7\+ años/)).not.toBeInTheDocument();
    });

    it('muestra la Experiencia en XHype con su período', () => {
        renderAt('/en');
        const xhype = screen.getByRole('heading', { name: 'Senior Developer · XHype' });
        expect(xhype.closest('li')).toHaveTextContent('Aug 2025 – Apr 2026');
    });

    it('los enlaces a Proyectos conservan el idioma', () => {
        renderAt('/en');
        const projects = screen.getByRole('region', { name: 'Featured projects' });
        expect(
            within(projects).getAllByRole('link', { name: /Wedding Invitation/ })[0],
        ).toHaveAttribute('href', '/en/projects/wedding-invitation');
    });
});

const sheet = () => screen.getByRole('complementary');
const story = () => screen.getByRole('article');

describe('Caso de estudio · ficha', () => {
    it('muestra tipo, título, resumen, período · rol, tech y el Impacto', () => {
        renderAt('/projects/superwallet');
        const ficha = sheet();
        expect(ficha).toHaveTextContent('Proyecto de trabajo · XHype');
        expect(within(ficha).getByRole('heading', { level: 1 })).toHaveTextContent('SuperWallet');
        expect(ficha).toHaveTextContent('· Senior Developer');
        expect(within(ficha).getByRole('list', { name: 'tecnologias' })).toBeInTheDocument();
        const impacto = within(ficha).getByRole('region', { name: 'Impacto' });
        expect(impacto).toHaveTextContent('−80%');
    });

    it('un Proyecto personal lo dice y lleva Demo y Repositorio', () => {
        renderAt('/projects/wedding-invitation');
        const ficha = sheet();
        expect(ficha).toHaveTextContent('Proyecto personal');
        expect(within(ficha).getByRole('link', { name: 'Demo' })).toHaveAttribute(
            'href',
            'https://wedding-invitation-seven-brown.vercel.app',
        );
        expect(within(ficha).getByRole('link', { name: 'Repositorio' })).toHaveAttribute(
            'href',
            'https://github.com/Starloss/wedding-invitation',
        );
    });

    it('solo muestra los enlaces que existen', () => {
        renderAt('/en/projects/be-booking-engine');
        const ficha = sheet();
        expect(within(ficha).queryByRole('link', { name: /Demo/ })).not.toBeInTheDocument();
        expect(within(ficha).queryByRole('link', { name: /Repository/ })).not.toBeInTheDocument();
        expect(ficha).not.toHaveTextContent('Private');
    });

    it('el índice lleva a Contexto, Decisiones clave y Galería', () => {
        renderAt('/en/projects/superwallet');
        const index = within(sheet()).getByRole('navigation', { name: 'On this page' });
        const links = within(index).getAllByRole('link');
        expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
            ['Context', '#context'],
            ['Key decisions', '#decisions'],
            ['Gallery', '#gallery'],
        ]);
        for (const id of ['context', 'decisions', 'gallery']) {
            expect(story().querySelector(`#${id}`)).not.toBeNull();
        }
    });

    it('"← Proyectos" vuelve a Proyectos destacados del mismo idioma', () => {
        renderAt('/en/projects/superwallet');
        expect(within(sheet()).getByRole('link', { name: '← Projects' })).toHaveAttribute(
            'href',
            '/en#projects',
        );
    });
});

describe('Caso de estudio · relato', () => {
    it('empieza con la portada y sigue con Contexto, Problema y las Decisiones numeradas', () => {
        renderAt('/projects/wedding-invitation');
        const relato = story();
        const [cover] = within(relato).getAllByRole('img');
        expect(cover).toHaveAccessibleName('Portada de la invitación en escritorio');
        const headings = within(relato)
            .getAllByRole('heading')
            .map((h) => h.textContent);
        expect(headings.slice(0, 4)).toEqual([
            'Contexto',
            'Problema',
            'Decisiones clave',
            '01RSVP por token, sin login',
        ]);
        expect(relato).toHaveTextContent(/Confirmar asistencia por grupo/);
    });

    it('BE muestra su diagrama como portada y explica por qué no hay capturas', () => {
        renderAt('/projects/be-booking-engine');
        const relato = story();
        expect(
            within(relato).getByRole('img', {
                name: 'Ciclo de una reserva: reserva, asignación de intérprete, servicio, reporte y facturación',
            }),
        ).toHaveTextContent('Facturación');
        expect(relato).toHaveTextContent(
            'Sin capturas: el sistema es interno. El diagrama resume el ciclo de una reserva.',
        );
        expect(within(relato).queryAllByRole('button')).toEqual([]);
    });

    it('un Proyecto inexistente muestra el aviso en el idioma de la URL', () => {
        renderAt('/en/projects/nada');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Project not found');
        expect(screen.getByRole('link', { name: '← Home' })).toHaveAttribute('href', '/en');
    });
});

describe('Galería del Caso de estudio', () => {
    const gallery = () => screen.getByRole('region', { name: /^(Galería|Gallery)$/ });

    it('las capturas horizontales ocupan 2 columnas y las verticales 2 filas', () => {
        renderAt('/projects/wedding-invitation');
        const items = within(gallery()).getAllByRole('listitem');
        // wedding-invitation-11 es horizontal (1280 × 635); wedding-invitation-1, vertical (371 × 793).
        expect(items[0]).toHaveStyle({ gridColumn: 'span 2' });
        expect(items[0]).not.toHaveStyle({ gridRow: 'span 2' });
        expect(items[1]).toHaveStyle({ gridRow: 'span 2' });
        expect(items[1]).not.toHaveStyle({ gridColumn: 'span 2' });
    });

    it('una captura más angosta que 640 px se declara con su ancho real', () => {
        renderAt('/projects/wedding-invitation');
        const narrow = within(gallery()).getByRole('img', {
            name: 'Portada de la invitación en móvil',
        });
        expect(narrow.getAttribute('srcset')).toBe('/projects/wedding-invitation-1-640.webp 371w');
    });

    it('el visor se abre en la captura tocada, navega con flechas y botones, y Esc lo cierra', async () => {
        renderAt('/projects/wedding-invitation');
        await userEvent.click(
            within(gallery()).getByRole('button', { name: 'Portada de la invitación en móvil' }),
        );
        const viewer = screen.getByRole('dialog', { name: 'Invitación de Boda · Galería' });
        expect(viewer).toHaveTextContent('Portada de la invitación en móvil · 2 de 8');
        await userEvent.keyboard('{ArrowRight}');
        expect(viewer).toHaveTextContent('· 3 de 8');
        await userEvent.click(within(viewer).getByRole('button', { name: 'Anterior' }));
        await userEvent.click(within(viewer).getByRole('button', { name: 'Anterior' }));
        await userEvent.click(within(viewer).getByRole('button', { name: 'Anterior' }));
        // En círculo: antes de la primera viene la última.
        expect(viewer).toHaveTextContent('· 8 de 8');
        await userEvent.click(within(viewer).getByRole('button', { name: 'Siguiente' }));
        expect(viewer).toHaveTextContent('Portada de la invitación en escritorio · 1 de 8');
        await userEvent.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('el foco entra al visor, no sale con Tab y vuelve a la captura al cerrar', async () => {
        renderAt('/en/projects/superwallet');
        const opener = within(gallery()).getByRole('button', {
            name: 'Wallet with USDT balance and supported tokens',
        });
        await userEvent.click(opener);
        const viewer = screen.getByRole('dialog', { name: 'SuperWallet · Gallery' });
        expect(viewer).toHaveTextContent('2 of 8');
        expect(viewer).toContainElement(document.activeElement as HTMLElement);
        for (let i = 0; i < 5; i++) {
            await userEvent.tab();
            expect(viewer).toContainElement(document.activeElement as HTMLElement);
        }
        await userEvent.tab({ shift: true });
        expect(viewer).toContainElement(document.activeElement as HTMLElement);
        await userEvent.click(within(viewer).getByRole('button', { name: 'Close' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
    });
});

describe('Navegación desde un Caso de estudio', () => {
    it.each([false, true])(
        'omite anterior y siguiente para un Proyecto no destacado (sin destacados: %s)',
        (noFeaturedProjects) => {
            const originalProjects = CONTENT.projects;
            CONTENT.projects = originalProjects.map((p) => ({
                ...p,
                featured: !noFeaturedProjects && p.id !== 'superwallet' && p.featured,
            }));
            try {
                renderAt('/en/projects/superwallet');
                expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SuperWallet');
                expect(
                    screen.queryByRole('navigation', { name: 'More projects' }),
                ).not.toBeInTheDocument();
            } finally {
                CONTENT.projects = originalProjects;
            }
        },
    );

    it('el menú lleva a las secciones de la Home del mismo idioma', async () => {
        renderAt('/en/projects/be-booking-engine');
        await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
        const mobile = screen.getByRole('navigation', { name: 'mobile' });
        expect(within(mobile).getByRole('link', { name: 'Experience' })).toHaveAttribute(
            'href',
            '/en#experience',
        );
        await userEvent.click(within(mobile).getByRole('link', { name: 'Experience' }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Hi, I'm");
    });

    it('anterior y siguiente recorren los Proyectos destacados en orden, en círculo', async () => {
        renderAt('/en/projects/be-booking-engine');
        const nav = () => screen.getByRole('navigation', { name: 'More projects' });
        expect(within(nav()).getByRole('link', { name: '← SuperWallet' })).toBeInTheDocument();
        await userEvent.click(within(nav()).getByRole('link', { name: 'Wedding Invitation →' }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Wedding Invitation');
        await userEvent.click(within(nav()).getByRole('link', { name: 'SuperWallet →' }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SuperWallet');
        await userEvent.click(within(nav()).getByRole('link', { name: '← Wedding Invitation' }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Wedding Invitation');
    });
});
